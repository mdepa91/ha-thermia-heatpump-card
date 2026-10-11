"""Check the visual editor: element, schema (all keys, device picker, PL/EN labels) and tolerant setConfig."""
import json
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch().new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("file:///w/test/index.html")
    res = page.evaluate("""() => {
      const C = customElements.get('thermia-heatpump-card');
      const E = customElements.get('thermia-heatpump-card-editor');
      const schema = E.schema('pl', ['sensor.a', 'sensor.b']);
      const ents = schema.find(s => s.name === 'entities');
      const fields = ents.schema.flatMap(g => g.schema);
      const c = document.createElement('thermia-heatpump-card');
      let noEntities = 'ok'; try { c.setConfig({type: 'custom:thermia-heatpump-card'}); } catch (e) { noEntities = e.message; }
      let badKey = 'accepted'; try { c.setConfig({entities: {nope: 'sensor.x'}}); } catch (e) { badKey = e.message; }
      return {editor_tag: C.getConfigElement().tagName.toLowerCase(),
              top: schema.map(s => s.name || s.type), groups: ents.schema.map(g => g.title),
              n_keys: fields.length, unique: new Set(fields.map(f => f.name)).size,
              device_selector: schema.find(s => s.name === 'device').selector,
              filtered_to_device: fields.every(f => (f.selector.entity.include_entities || []).length === 2),
              unfiltered_without_device: E.schema('en', []).find(s => s.name === 'entities').schema[0].schema[0].selector,
              noEntities, badKey, grid: new C().getGridOptions()};
    }""")
    res["errors"] = errors
    print(json.dumps(res, ensure_ascii=False, indent=1))
