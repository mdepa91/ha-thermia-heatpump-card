"""Real mouse clicks on labels/icons, update skipping and animation CPU cost, in Chromium."""
import json
from playwright.sync_api import sync_playwright


def center(page, card_sel, js_locator):
    """Viewport centre of an element inside the card's shadow root."""
    return page.locator(card_sel).evaluate(f"c => {{ const r = ({js_locator}).getBoundingClientRect();"
                                           " return [r.left + r.width / 2, r.top + r.height / 2]; }")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 960, "height": 2200})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("file:///w/test/index.html")
    page.wait_for_timeout(600)
    card = "#pl-heating thermia-heatpump-card"
    n_hits = page.locator(card).evaluate("c => c.shadowRoot.querySelectorAll('.hit').length")

    clicks = {}
    for name, loc in {
        "label 'DŹ wejście'": "c.shadowRoot.querySelector('[data-i18n=\"brine_in\"]')",
        "heater icon": "c.shadowRoot.getElementById('heater')",
        "label T1": "c.shadowRoot.getElementById('lbl-t1')",
        "hot gas value": "c.shadowRoot.getElementById('val-hot-gas')",
        "pump CO (return)": "c.shadowRoot.getElementById('supply-pump')",
        "label 'Aktywna (r03)'": "c.shadowRoot.querySelector('[data-i18n=\"active_target\"]')",
    }.items():
        page.evaluate("window.moreInfo = []")
        x, y = center(page, card, loc)
        page.mouse.click(x, y)
        clicks[name] = page.evaluate("window.moreInfo")
    # heater icon opens the stage that is running
    aux = {}
    for a3, a6 in (("off", "off"), ("on", "off"), ("off", "on"), ("on", "on")):
        page.locator(card).evaluate(f"""c => {{
          const states = Object.assign({{}}, c._hass.states, {{'binary_sensor.aux_3kw': {{state: '{a3}', attributes: {{}}}},
                                                           'binary_sensor.aux_6kw': {{state: '{a6}', attributes: {{}}}}}});
          c.hass = Object.assign({{}}, c._hass, {{states}});
        }}""")
        page.evaluate("window.moreInfo = []")
        x, y = center(page, card, "c.shadowRoot.getElementById('heater')")
        page.mouse.click(x, y)
        aux[f"3kW {a3}, 6kW {a6}"] = page.evaluate("window.moreInfo")
    # -/+ buttons with the mouse
    page.evaluate("window.calls = []")
    x, y = center(page, card, "c.shadowRoot.getElementById('btn-sp-down')")
    page.mouse.click(x, y)
    page.wait_for_timeout(900)
    minus = page.evaluate("window.calls")

    # update skipping: same state objects -> no redraw; one changed object -> redraw
    skip = page.locator(card).evaluate("""c => {
      const el = c.shadowRoot.getElementById('val-t1');
      el.textContent = 'MARK';
      c.hass = Object.assign({}, c._hass);                        // new hass object, same state objects
      const skipped = el.textContent === 'MARK';
      const states = Object.assign({}, c._hass.states, {'sensor.t1': {state: '40.0', attributes: {}}});
      c.hass = Object.assign({}, c._hass, {states});
      return {skipped_when_unchanged: skipped, redrawn_on_change: el.textContent};
    }""")

    # CPU cost of the animations (3 cards, 6 spinning icons in total), 5 s each
    cdp = page.context.new_cdp_session(page)
    cdp.send("Performance.enable")

    def busy(ms=5000):
        m0 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
        page.wait_for_timeout(ms)
        m1 = {m["name"]: m["value"] for m in cdp.send("Performance.getMetrics")["metrics"]}
        return round(100 * (m1["TaskDuration"] - m0["TaskDuration"]) / (ms / 1000), 2)

    running = busy()
    page.evaluate("document.querySelectorAll('thermia-heatpump-card').forEach(c => c.shadowRoot.querySelector('svg').classList.add('paused'))")
    paused = busy()
    page.evaluate("document.querySelectorAll('.wrap').forEach(w => w.remove())")
    empty = busy()
    print(json.dumps({"hit_areas": n_hits, "clicks": clicks, "heater_click": aux, "minus_button": minus, "update": skip,
                      "cpu_main_thread_percent": {"animations_running": running, "paused": paused, "no_cards": empty},
                      "errors": errors}, ensure_ascii=False, indent=1))
