"""Render test/index.html in Chromium, screenshot each scenario and exercise the buttons.
docker run --rm -v $PWD:/w -w /w mcr.microsoft.com/playwright/python:v1.58.0-jammy python3 test/render.py
"""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch().new_page(viewport={"width": 960, "height": 2200})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto("file:///w/test/index.html")
    page.wait_for_timeout(500)
    for sid in ("pl-heating", "en-dhw-dark", "pl-idle", "pl-phone", "en-phone-dark"):
        page.locator(f"#{sid}").screenshot(path=f"test/out-{sid}.png")

    card = page.locator("#pl-heating thermia-heatpump-card")
    texts = card.evaluate("""c => Object.fromEntries(['val-t1','val-sp-sensor','st-valve','st-compressor','val-integral']
        .map(id => [id, c.shadowRoot.getElementById(id).textContent]))""")
    spin = card.evaluate("c => c.shadowRoot.getElementById('compressor-fan').classList.contains('spin')")
    idle_spin = page.locator("#pl-idle thermia-heatpump-card").evaluate(
        "c => c.shadowRoot.getElementById('compressor-fan').classList.contains('spin')")
    en_labels = page.locator("#en-dhw-dark thermia-heatpump-card").evaluate(
        "c => [...c.shadowRoot.querySelectorAll('[data-i18n]')].slice(0, 6).map(e => e.textContent)")
    # + twice -> one debounced call with 22.5
    card.evaluate("c => { const b = c.shadowRoot.getElementById('btn-sp-up');"
                  " b.dispatchEvent(new MouseEvent('click')); b.dispatchEvent(new MouseEvent('click')); }")
    shown = card.evaluate("c => c.shadowRoot.getElementById('val-sp-sensor').textContent")
    page.wait_for_timeout(900)
    card.evaluate("c => c.shadowRoot.getElementById('val-t1').dispatchEvent(new MouseEvent('click'))")
    # layout follows the card width: narrow -> portrait; widening the phone card switches to landscape and back
    layout = lambda sel: page.locator(sel).evaluate("c => c._layout + ' ' + c.shadowRoot.querySelectorAll('#val-t1').length")
    layouts = {"wide": layout("#pl-heating thermia-heatpump-card"), "phone": layout("#pl-phone thermia-heatpump-card")}
    page.evaluate("document.getElementById('pl-phone').style.width = '900px'")
    page.wait_for_timeout(300)
    layouts["phone_widened"] = layout("#pl-phone thermia-heatpump-card")
    page.evaluate("document.getElementById('pl-phone').style.width = ''")
    page.wait_for_timeout(300)
    layouts["phone_again"] = layout("#pl-phone thermia-heatpump-card")
    layouts["phone_t1_after_switch"] = page.locator("#pl-phone thermia-heatpump-card").evaluate(
        "c => c.shadowRoot.getElementById('val-t1').textContent")
    print(json.dumps({"layouts": layouts, "texts": texts, "compressor_spins": spin, "idle_compressor_spins": idle_spin,
                      "en_labels": en_labels, "setpoint_shown_after_2x_plus": shown,
                      "service_calls": page.evaluate("window.calls"), "more_info": page.evaluate("window.moreInfo"),
                      "errors": errors}, ensure_ascii=False, indent=1))
