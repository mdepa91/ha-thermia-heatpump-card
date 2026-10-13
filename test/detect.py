"""Device auto-detection (firmware card maps + keyword fallback), device-only config and the editor, in Chromium."""
import json
from playwright.sync_api import sync_playwright

DEV = "ostrow-budowa-room-sensor"
# (entity_id suffix, domain, YAML name, firmware key, extra attributes) - the user's real configuration
ENTS = [
    ("temp_zewnetrzna", "sensor", "Temp. zewnętrzna", "temp_outdoor", {}),
    ("wirtualna_temp_wewnetrzna", "sensor", "Wirtualna temp. wewnętrzna", "temp_indoor", {}),
    ("temp_zadana_aktywna", "sensor", "Temp. zadana (aktywna)", "temp_indoor_target", {}),
    ("zasilanie_co_t1", "sensor", "Zasilanie CO (T1)", "temp_supply", {}),
    ("powrot_co_t2", "sensor", "Powrót CO (T2)", "temp_return", {}),
    ("ciepla_woda_cwu_t3", "sensor", "Ciepła woda CWU (T3)", "temp_hotwater", {}),
    ("dz_temp_wyjscia", "sensor", "DŹ temp. wyjścia", "temp_brine_out", {}),
    ("dz_temp_wejscia", "sensor", "DŹ temp. wejścia", "temp_brine_in", {}),
    ("zasilanie_co_zadana", "sensor", "Zasilanie CO - zadana", "temp_supply_target", {}),
    ("goracy_gaz_tloczenie", "sensor", "Gorący gaz (tłoczenie)", "temp_hot_gas", {}),
    ("prad", "sensor", "Prąd", "current", {}),
    ("pompa_obiegu_moc", "sensor", "Pompa obiegu moc", "supply_pump_speed", {}),
    ("pompa_dz_moc", "sensor", "Pompa DŹ moc", "brine_pump_speed", {}),
    ("integral_ro", "sensor", "Integral (RO)", "integral", {}),
    ("czas_pracy_sprezarki", "sensor", "Czas pracy sprężarki", "runtime_compressor", {}),
    ("praca_sprezarki", "binary_sensor", "Praca sprężarki", "compressor", {}),
    ("pompa_dz", "binary_sensor", "Pompa DŹ", "brine_pump", {}),
    ("pompa_obiegu", "binary_sensor", "Pompa obiegu", "supply_pump", {}),
    ("podgrzewanie_cwu", "binary_sensor", "Podgrzewanie CWU", "hotwater_production", {}),
    ("grzalka_3_kw", "binary_sensor", "Grzałka 3 kW", "aux_3kw", {}),
    ("grzalka_6_kw", "binary_sensor", "Grzałka 6 kW", "aux_6kw", {}),
    ("alarm_czujnik_pokojowy", "binary_sensor", "Alarm: czujnik pokojowy", "alarm_indoor_sensor", {}),
    ("temp_stop_grzania_heatstop", "number", "Temp. stop grzania (Heatstop)", "setting_heating_stop_temp", {"step": 1}),
    ("cwu_prog_startu", "number", "CWU: próg startu", "setting_hotwater_start_temp", {"step": 1}),
    ("temp_zadana_awaryjna_bez_czujnika", "number", "Temp. zadana (awaryjna, bez czujnika)", "setting_indoor_temp", {"step": 1}),
    ("waga_wplywu_temp_pokojowej_room_factor", "number", "Waga wpływu temp. pokojowej (room_factor)", "setting_room_factor", {"step": 1}),
    ("pok_temp_emulowana", "number", "Pok. temp. emulowana", "room_temperature", {"step": 0.1}),
    ("pok_temp_zadana", "number", "Pok. temp. zadana", "setpoint", {"step": 0.5}),
    ("nadawanie_czujnika", "switch", "Nadawanie czujnika", "transmit", {}),
]
EXPECTED = {
    "outdoor": "temp_zewnetrzna", "heatstop": "temp_stop_grzania_heatstop", "brine_in": "dz_temp_wejscia", "brine_out": "dz_temp_wyjscia",
    "brine_pump": "pompa_dz", "brine_pump_speed": "pompa_dz_moc", "compressor": "praca_sprezarki",
    "hot_gas": "goracy_gaz_tloczenie", "current": "prad", "aux_3kw": "grzalka_3_kw", "aux_6kw": "grzalka_6_kw",
    "integral": "integral_ro", "supply": "zasilanie_co_t1", "return": "powrot_co_t2",
    "supply_target": "zasilanie_co_zadana", "supply_pump": "pompa_obiegu", "supply_pump_speed": "pompa_obiegu_moc",
    "hotwater_production": "podgrzewanie_cwu", "hotwater": "ciepla_woda_cwu_t3",
    "room_temperature": "pok_temp_emulowana", "setpoint": "pok_temp_zadana", "indoor_target": "temp_zadana_aktywna",
    "fallback_setpoint": "temp_zadana_awaryjna_bez_czujnika", "room_factor": "waga_wplywu_temp_pokojowej_room_factor",
    "alarm_indoor_sensor": "alarm_czujnik_pokojowy", "transmit": "nadawanie_czujnika",
}
ROOM_KEYS = {"room_temperature", "setpoint", "transmit"}


def build_hass(with_maps, names_override=None):
    prefix = DEV.replace("-", "_")
    states, entities = {}, {}
    for suffix, dom, name, fw, attrs in ENTS:
        eid = f"{dom}.{prefix}_{suffix}"
        nm = (names_override or {}).get(fw, name)
        states[eid] = {"entity_id": eid, "state": "21.0" if dom in ("sensor", "number") else "off",
                       "attributes": {"friendly_name": f"{DEV} {nm}", **attrs}}
        entities[eid] = {"entity_id": eid, "device_id": "dev1", "platform": "esphome"}
    if with_maps:
        for comp, keys in (("thermia_card_map", [e for e in ENTS if e[3] not in ROOM_KEYS]),
                           ("thermia_room_card_map", [e for e in ENTS if e[3] in ROOM_KEYS])):
            eid = f"select.{prefix}_{comp}"
            opts = ["thermia-card-map:1"] + [f"{fw}={name}" for _, _, name, fw, _ in keys]
            states[eid] = {"entity_id": eid, "state": opts[0], "attributes": {"options": opts, "friendly_name": f"{DEV} map"}}
            entities[eid] = {"entity_id": eid, "device_id": "dev1", "platform": "esphome"}
    # an unrelated device with similar names must never be picked
    states["sensor.other_outdoor"] = {"entity_id": "sensor.other_outdoor", "state": "5", "attributes": {"friendly_name": "Weather outdoor temperature"}}
    entities["sensor.other_outdoor"] = {"entity_id": "sensor.other_outdoor", "device_id": "dev2", "platform": "met"}
    return {"language": "pl", "states": states, "entities": entities,
            "devices": {"dev1": {"id": "dev1", "name": DEV}, "dev2": {"id": "dev2", "name": "Weather"}}}


def score(found):
    prefix = DEV.replace("-", "_")
    ok = [k for k, v in EXPECTED.items() if found.get(k, "").endswith(f"{prefix}_{v}")]
    wrong = {k: found[k] for k in EXPECTED if k in found and k not in ok}
    missing = [k for k in EXPECTED if k not in found]
    return {"correct": f"{len(ok)}/{len(EXPECTED)}", "wrong": wrong, "missing": missing}


with sync_playwright() as p:
    page = p.chromium.launch().new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("file:///w/test/index.html")
    detect = lambda hass: page.evaluate("h => customElements.get('thermia-heatpump-card').detectEntities(h, 'dev1')", hass)
    out = {
        "with_firmware_maps": score(detect(build_hass(True))),
        "keywords_only_(old_firmware)": score(detect(build_hass(False))),
        # names in English, no maps (someone else's YAML)
        "keywords_only_english": score(detect(build_hass(False, {
            "temp_outdoor": "Outdoor temperature", "temp_indoor": "Indoor temperature", "temp_indoor_target": "Indoor target",
            "temp_supply": "Supply T1", "temp_return": "Return T2", "temp_hotwater": "Hot water T3",
            "temp_brine_out": "Brine out", "temp_brine_in": "Brine in", "temp_supply_target": "Supply target",
            "temp_hot_gas": "Hot gas", "current": "Current", "supply_pump_speed": "Circulation pump speed",
            "brine_pump_speed": "Brine pump speed", "integral": "Integral", "runtime_compressor": "Compressor runtime",
            "compressor": "Compressor", "brine_pump": "Brine pump", "supply_pump": "Circulation pump",
            "hotwater_production": "Hot water production", "aux_3kw": "Aux heater 3 kW", "aux_6kw": "Aux heater 6 kW",
            "alarm_indoor_sensor": "Alarm: room sensor", "setting_hotwater_start_temp": "Hot water start",
            "setting_heating_stop_temp": "Heating stop temperature",
            "setting_indoor_temp": "Fallback setpoint", "setting_room_factor": "Room factor",
            "room_temperature": "Room temperature (emulated)", "setpoint": "Room setpoint",
            "transmit": "Room sensor transmission"}))),
    }
    # card with only `device:` renders values from the detected entities
    out["device_only_card"] = page.evaluate("""h => {
      const c = document.createElement('thermia-heatpump-card');
      c.setConfig({device: 'dev1', language: 'pl'});
      document.body.appendChild(c); c.hass = h;
      return {t1: c.shadowRoot.getElementById('val-t1').textContent, entities: Object.keys(c._ents).length};
    }""", build_hass(True))
    # editor: picking the device fills the entities
    out["editor_pick_device"] = page.evaluate("""h => {
      const ed = document.createElement('thermia-heatpump-card-editor');
      let cfg; ed.addEventListener('config-changed', e => cfg = e.detail.config);
      ed.setConfig({type: 'custom:thermia-heatpump-card', entities: {outdoor: 'sensor.other_outdoor'}});
      ed.hass = h;
      ed._changed({type: 'custom:thermia-heatpump-card', device: 'dev1', entities: {outdoor: 'sensor.other_outdoor'}});
      return {device: cfg.device, n: Object.keys(cfg.entities).length, outdoor: cfg.entities.outdoor};
    }""", build_hass(True))
    out["errors"] = errors
    print(json.dumps(out, ensure_ascii=False, indent=1))
