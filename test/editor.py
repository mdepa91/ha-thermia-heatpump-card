"""Check the visual editor schema (getConfigForm) and tolerant setConfig in Chromium."""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch().new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("file:///w/test/index.html")
    res = page.evaluate("""() => {
      const C = customElements.get('thermia-heatpump-card');
      const form = C.getConfigForm();
      const ents = form.schema.find(s => s.name === 'entities');
      const keys = ents.schema.flatMap(g => g.schema.map(f => f.name));
      const labelsEn = keys.slice(0, 3).map(k => form.computeLabel({name: k}));
      // pretend HA language is Polish
      const ha = document.createElement('home-assistant'); ha.hass = {language: 'pl'}; document.body.appendChild(ha);
      const labelsPl = keys.slice(0, 3).map(k => form.computeLabel({name: k}));
      const c = document.createElement('thermia-heatpump-card');
      let noEntities = 'ok'; try { c.setConfig({type: 'custom:thermia-heatpump-card'}); } catch (e) { noEntities = e.message; }
      let badKey = 'accepted'; try { c.setConfig({entities: {nope: 'sensor.x'}}); } catch (e) { badKey = e.message; }
      return {top: form.schema.map(s => s.type || s.name), groups: ents.schema.map(g => g.title),
              n_keys: keys.length, unique: new Set(keys).size, labelsEn, labelsPl, noEntities, badKey,
              grid: new C().getGridOptions()};
    }""")
    res["errors"] = errors
    print(json.dumps(res, ensure_ascii=False, indent=1))
