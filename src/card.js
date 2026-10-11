/*
 * Thermia heat pump card for Home Assistant.
 * Draws the heat pump (ground loop, refrigerant circuit, heating/DHW side, room sensor) and colours pipes by
 * temperature. Source: src/card.js + src/heatpump.svg, built into dist/ by build.py.
 */

const CARD_VERSION = "__VERSION__";
const SVG = `__SVG__`;

const I18N = {
  pl: {
    outdoor: "Zewnętrzna", ground: "Dolne źródło", brine_pump: "Pompa DŹ", brine_in: "DŹ wejście",
    brine_out: "DŹ wyjście", heat_pump: "Pompa ciepła", evaporator: "parownik", condenser: "skraplacz",
    expansion_valve: "zawór rozprężny", hot_gas: "Gorący gaz", current: "Prąd", integral: "Integral",
    supply_target: "Zasilanie zadana", aux_heaters: "grzałki", supply_pump: "Pompa CO", valve: "zawór 3D",
    heating: "CO", hot_water: "CWU", setpoint: "zadana", active_target: "Aktywna (r03)",
    fallback_target: "Awaryjna (r32)", room_factor: "Waga temp. pok.", legend: "Kolor = temperatura",
    inactive: "nieaktywna gałąź", compressor_on: "SPRĘŻARKA ON", compressor_off: "SPRĘŻARKA OFF",
    sensor_ok: "czujnik OK", sensor_alarm: "ALARM czujnika",
  },
  en: {
    outdoor: "Outdoor", ground: "Ground loop", brine_pump: "Brine pump", brine_in: "Brine in",
    brine_out: "Brine out", heat_pump: "Heat pump", evaporator: "evaporator", condenser: "condenser",
    expansion_valve: "expansion valve", hot_gas: "Hot gas", current: "Current", integral: "Integral",
    supply_target: "Supply target", aux_heaters: "aux heaters", supply_pump: "Heating pump", valve: "3-way valve",
    heating: "Heating", hot_water: "DHW", setpoint: "setpoint", active_target: "Active (r03)",
    fallback_target: "Fallback (r32)", room_factor: "Room factor", legend: "Colour = temperature",
    inactive: "inactive branch", compressor_on: "COMPRESSOR ON", compressor_off: "COMPRESSOR OFF",
    sensor_ok: "sensor OK", sensor_alarm: "sensor ALARM",
  },
};

// Entity keys accepted under `entities:` (names follow esphome-thermia / esphome-thermia-room).
const ENTITY_KEYS = [
  "outdoor", "brine_in", "brine_out", "brine_pump", "brine_pump_speed", "compressor", "hot_gas", "current",
  "aux_3kw", "aux_6kw", "integral", "supply", "return", "supply_target", "supply_pump", "supply_pump_speed",
  "hotwater_production", "hotwater", "room_temperature", "setpoint", "indoor_target", "fallback_setpoint",
  "room_factor", "alarm_indoor_sensor",
];

// Visual editor (gives the card the Config / Visibility / Layout tabs in HA). Groups follow the drawing.
const EDITOR_GROUPS = [
  ["ground", ["outdoor", "brine_in", "brine_out", "brine_pump", "brine_pump_speed"]],
  ["heat_pump", ["compressor", "hot_gas", "current", "aux_3kw", "aux_6kw", "integral", "supply_target"]],
  ["heating_side", ["supply", "return", "supply_pump", "supply_pump_speed", "hotwater_production", "hotwater"]],
  ["room", ["room_temperature", "setpoint", "indoor_target", "fallback_setpoint", "room_factor", "alarm_indoor_sensor"]],
];
const BINARY_KEYS = ["brine_pump", "compressor", "aux_3kw", "aux_6kw", "supply_pump", "hotwater_production",
  "alarm_indoor_sensor"];
const EDITOR_LABELS = {
  pl: {
    title: "Tytuł", language: "Język", entities: "Encje", device: "Urządzenie ESPHome (automatyczny dobór encji)", ground: "Dolne źródło", heat_pump: "Pompa ciepła",
    heating_side: "CO / CWU", room: "Czujnik pokojowy", outdoor: "Temperatura zewnętrzna",
    brine_in: "DŹ wejście", brine_out: "DŹ wyjście", brine_pump: "Pompa DŹ (włączona)",
    brine_pump_speed: "Pompa DŹ (moc %)", compressor: "Sprężarka (włączona)", hot_gas: "Gorący gaz",
    current: "Prąd", aux_3kw: "Grzałka 3 kW", aux_6kw: "Grzałka 6 kW", integral: "Integral",
    supply_target: "Zasilanie zadana", supply: "Zasilanie T1", return: "Powrót T2",
    supply_pump: "Pompa CO (włączona)", supply_pump_speed: "Pompa CO (moc %)",
    hotwater_production: "Grzanie CWU (zawór 3D)", hotwater: "CWU T3", room_temperature: "Temperatura pokojowa",
    setpoint: "Temperatura zadana (przyciski −/+)", indoor_target: "Zadana aktywna (r03)",
    fallback_setpoint: "Zadana awaryjna (r32)", room_factor: "Waga temp. pokojowej",
    alarm_indoor_sensor: "Alarm czujnika pokojowego",
  },
  en: {
    title: "Title", language: "Language", entities: "Entities", device: "ESPHome device (fills in the entities)", ground: "Ground loop", heat_pump: "Heat pump",
    heating_side: "Heating / hot water", room: "Room sensor", outdoor: "Outdoor temperature",
    brine_in: "Brine in", brine_out: "Brine out", brine_pump: "Brine pump (on/off)",
    brine_pump_speed: "Brine pump (speed %)", compressor: "Compressor (on/off)", hot_gas: "Hot gas",
    current: "Current", aux_3kw: "Aux heater 3 kW", aux_6kw: "Aux heater 6 kW", integral: "Integral",
    supply_target: "Supply target", supply: "Supply T1", return: "Return T2",
    supply_pump: "Heating pump (on/off)", supply_pump_speed: "Heating pump (speed %)",
    hotwater_production: "Hot water production (3-way valve)", hotwater: "Hot water T3",
    room_temperature: "Room temperature", setpoint: "Room setpoint (−/+ buttons)",
    indoor_target: "Active target (r03)", fallback_setpoint: "Fallback setpoint (r32)",
    room_factor: "Room factor", alarm_indoor_sensor: "Room sensor alarm",
  },
};

function langOf(hass) {
  const lang = (hass && hass.language) || "en";
  return lang.startsWith("pl") ? "pl" : "en";
}

// ---------- device auto-detection ----------
// 1. Card maps published by the firmware: a select whose first option is MAP_MARKER, the rest "<config key>=<name>"
//    (esphome-thermia `card_map`, esphome-thermia-room `card_map`).
// 2. For whatever is still missing: keywords (PL / EN) in the entity names, domain and a few attributes.
const MAP_MARKER = "thermia-card-map:1";
// firmware config key -> [card key, priority] (higher wins when two firmware keys map to the same card key)
const FW_TO_CARD = {
  temp_outdoor: ["outdoor", 1], temp_brine_in: ["brine_in", 1], temp_brine_out: ["brine_out", 1],
  brine_pump: ["brine_pump", 1], brine_pump_speed: ["brine_pump_speed", 1], compressor: ["compressor", 1],
  temp_hot_gas: ["hot_gas", 1], current: ["current", 1], aux_3kw: ["aux_3kw", 1], aux_6kw: ["aux_6kw", 1],
  integral: ["integral", 1], temp_supply: ["supply", 1], temp_return: ["return", 1],
  temp_supply_target: ["supply_target", 1], supply_pump: ["supply_pump", 1],
  supply_pump_speed: ["supply_pump_speed", 1], hotwater_production: ["hotwater_production", 1],
  temp_hotwater: ["hotwater", 1], temp_indoor_target: ["indoor_target", 1],
  setting_indoor_temp: ["fallback_setpoint", 1], setting_room_factor: ["room_factor", 1],
  alarm_indoor_sensor: ["alarm_indoor_sensor", 1],
  temp_indoor: ["room_temperature", 1],          // what the pump reports ...
  room_temperature: ["room_temperature", 2],     // ... loses to what thermia_room sends
  setpoint: ["setpoint", 2],
};
const SENSORS = ["sensor", "number", "input_number"];
const BINARIES = ["binary_sensor", "switch", "input_boolean"];
const PUMP_DZ = /(pomp|pump).*(dz|brine|zrodl|ground)|(dz|brine|ground).*(pomp|pump)/;
const PUMP_CO = /(pomp|pump).*(obieg|\bco\b|heating|circulation|supply)|(obieg|\bco\b|heating|circulation|supply).*(pomp|pump)/;
const SPEED = /\bmoc\b|speed|predk|pwm/;
// Order matters: more specific keys first, so they are not taken by a broader pattern.
const KEYWORDS = [
  ["supply_target", SENSORS, /(zasil|supply).*(zadan|target)|(zadan|target).*(zasil|supply)/],
  ["supply", SENSORS, /zasil|supply|\bt1\b/, /zadan|target|shunt|bocznik/],
  ["return", SENSORS, /powrot|return|\bt2\b/, /zadan|target/],
  ["outdoor", SENSORS, /zewn|outdoor|outside/],
  ["brine_in", SENSORS, /(dz|brine|ground).*(wej|\bin\b|inlet)|(wej|inlet).*(dz|brine)/],
  ["brine_out", SENSORS, /(dz|brine|ground).*(wyj|\bout\b|outlet)|(wyj|outlet).*(dz|brine)/],
  ["brine_pump_speed", SENSORS, PUMP_DZ, null, (n) => SPEED.test(n)],
  ["brine_pump", BINARIES, PUMP_DZ],
  ["supply_pump_speed", SENSORS, PUMP_CO, null, (n) => SPEED.test(n)],
  ["supply_pump", BINARIES, PUMP_CO],
  ["compressor", BINARIES, /sprez|compressor/],
  ["hot_gas", SENSORS, /gorac|hot gas|tlocz|discharge/],
  ["current", SENSORS, /\bprad\b|current/, /czas|runtime/],
  ["aux_3kw", BINARIES, /\b3 ?kw\b/],
  ["aux_6kw", BINARIES, /\b6 ?kw\b/],
  ["integral", SENSORS, /integral|calka/],
  ["hotwater_production", BINARIES, /cwu|hot ?water|dhw|ciepla woda|podgrz/, /alarm/],
  ["hotwater", SENSORS, /cwu|hot ?water|dhw|ciepla woda/, /prog|start|stop|threshold|czas|runtime/],
  ["alarm_indoor_sensor", BINARIES, /alarm.*(pok|room|indoor|wewn)/],
  ["indoor_target", SENSORS, /(wewn|indoor|pok|room).*(zadan|target)|aktywn|active/, /awaryj|fallback/],
  // the room-sensor setpoint steps by 0.5 °C, the pump's own (r32) by 1 °C
  ["setpoint", ["number", "input_number"], /zadan|setpoint/, /awaryj|fallback|aktywn|active|zasil|supply/,
    (n, st) => (Number(st && st.attributes.step) === 0.5 ? 2 : 1)],
  ["fallback_setpoint", ["number", "input_number"], /awaryj|fallback|bez czujnik|(pok|indoor|room|wewn).*zadan/,
    /zasil|supply/],
  ["room_factor", ["number", "input_number", "sensor"], /waga|room factor|wplyw/],
  ["room_temperature", ["number", "input_number", "sensor"], /emul|(pok|room|wewn|indoor).*temp/,
    /zadan|setpoint|target|awaryj|fallback|waga|factor/,
    (n, st, eid) => (eid.startsWith("number.") ? 2 : 1)],
];

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

function deviceEntityIds(hass, deviceId) {
  if (!hass || !hass.entities || !deviceId) return [];
  return Object.values(hass.entities).filter((e) => e.device_id === deviceId).map((e) => e.entity_id);
}

function detectEntities(hass, deviceId) {
  const result = {};
  const ids = deviceEntityIds(hass, deviceId);
  if (!ids.length) return result;
  const dev = hass.devices && hass.devices[deviceId];
  const devName = norm(dev && (dev.name_by_user || dev.name));
  // Entity name without the device prefix that has_entity_name adds to friendly_name.
  const names = {};
  for (const eid of ids) {
    const reg = hass.entities[eid];
    const st = hass.states[eid];
    let n = norm((reg && reg.name) || (st && st.attributes.friendly_name) || eid.split(".")[1]);
    if (devName && n.startsWith(`${devName} `)) n = n.slice(devName.length + 1);
    names[eid] = n;
  }
  const used = new Set();
  const prio = {};
  for (const eid of ids) {
    const opts = eid.startsWith("select.") && hass.states[eid] && hass.states[eid].attributes.options;
    if (!Array.isArray(opts) || opts[0] !== MAP_MARKER) continue;
    used.add(eid);  // the map itself is never a value
    for (const opt of opts.slice(1)) {
      const at = opt.indexOf("=");
      const target = FW_TO_CARD[opt.slice(0, at)];
      if (at < 0 || !target) continue;
      const [key, p] = target;
      const want = norm(opt.slice(at + 1));
      const match = ids.find((e) => !used.has(e) && (names[e] === want || names[e].endsWith(` ${want}`)));
      if (!match || (prio[key] || 0) >= p) continue;
      if (result[key]) used.delete(result[key]);
      result[key] = match;
      prio[key] = p;
      used.add(match);
    }
  }
  for (const [key, domains, re, not, score] of KEYWORDS) {
    if (result[key]) continue;
    let best;
    let bestScore = 0;
    for (const eid of ids) {
      if (used.has(eid) || !domains.includes(eid.split(".")[0])) continue;
      const n = names[eid];
      if (!re.test(n) || (not && not.test(n))) continue;
      const sc = score ? score(n, hass.states[eid], eid) : 1;
      if (sc > bestScore) {
        best = eid;
        bestScore = sc;
      }
    }
    if (best) {
      result[key] = best;
      used.add(best);
    }
  }
  return result;
}

// ---------- visual editor ----------
function entitySelector(key, include) {
  const domain = BINARY_KEYS.includes(key) ? BINARIES
    : key === "setpoint" ? ["number", "input_number"] : SENSORS;
  return { entity: include && include.length ? { domain, include_entities: include } : { domain } };
}

function editorSchema(lang, deviceEntities) {
  const L = EDITOR_LABELS[lang];
  return [
    {
      type: "grid",
      name: "",
      schema: [
        { name: "title", selector: { text: {} } },
        {
          name: "language",
          selector: {
            select: { mode: "dropdown", options: [{ value: "pl", label: "Polski" }, { value: "en", label: "English" }] },
          },
        },
      ],
    },
    { name: "device", selector: { device: { filter: { integration: "esphome" } } } },
    {
      type: "expandable",
      name: "entities",
      title: L.entities,
      expanded: true,
      schema: EDITOR_GROUPS.map(([group, keys]) => ({
        type: "expandable",
        flatten: true,
        name: group,
        title: L[group],
        schema: keys.map((key) => ({ name: key, selector: entitySelector(key, deviceEntities) })),
      })),
    },
  ];
}

// <ha-form> is lazy-loaded by HA; opening a built-in card editor that uses it makes sure it is defined.
async function loadHaForm() {
  if (customElements.get("ha-form") || !window.loadCardHelpers) return;
  const helpers = await window.loadCardHelpers();
  const card = await helpers.createCardElement({ type: "entities", entities: [] });
  if (card && card.constructor.getConfigElement) await card.constructor.getConfigElement();
}

// Click targets: each entity gets one invisible rectangle covering its label, value and icon, so the whole area is
// clickable, not only the glyphs. Entries are element ids, or "i18n:<key>" for a translated label.
const CLICK_GROUPS = {
  outdoor: ["outdoor"],
  brine_in: ["i18n:brine_in", "val-brine-in"],
  brine_out: ["i18n:brine_out", "val-brine-out"],
  brine_pump: ["i18n:brine_pump", "val-brine-pwm", "brine-pump"],
  compressor: ["compressor", "st-compressor-bg"],
  hot_gas: ["i18n:hot_gas", "val-hot-gas"],
  current: ["i18n:current", "val-current"],
  integral: ["i18n:integral", "val-integral"],
  supply_target: ["i18n:supply_target", "val-target", "val-target-now"],
  aux_3kw: ["heater", "val-aux"],
  supply: ["lbl-t1", "val-t1"],
  return: ["lbl-t2", "val-t2"],
  supply_pump: ["i18n:supply_pump", "val-supply-pwm", "supply-pump"],
  hotwater_production: ["i18n:valve", "st-valve-bg", "valve"],
  hotwater: ["lbl-t3", "val-t3"],
  room_temperature: ["val-room"],
  setpoint: ["i18n:setpoint", "val-sp-sensor"],
  indoor_target: ["i18n:active_target", "val-sp-active"],
  fallback_setpoint: ["i18n:fallback_target", "val-sp-fallback"],
  room_factor: ["i18n:room_factor", "val-room-factor"],
  alarm_indoor_sensor: ["st-room-alarm"],
};
// Without a binary sensor, the pumps fall back to their speed entity.
const CLICK_FALLBACK = { brine_pump: "brine_pump_speed", supply_pump: "supply_pump_speed", aux_3kw: "aux_6kw" };

const OFF = "#c4c7cc";
const CHIP_OFF = "var(--secondary-background-color, #f1f3f4)";  // follows the HA theme (light / dark)
const STOPS = [[-5, [37, 99, 235]], [5, [6, 182, 212]], [20, [34, 197, 94]], [35, [234, 179, 8]],
  [45, [249, 115, 22]], [55, [220, 38, 38]]];

// Same scale as src/schematic.py: -5 °C blue ... 55 °C red.
function tcol(t) {
  if (!Number.isFinite(t)) return OFF;
  let c = STOPS[0][1];
  if (t >= STOPS[STOPS.length - 1][0]) c = STOPS[STOPS.length - 1][1];
  else {
    for (let i = 0; i < STOPS.length - 1; i++) {
      const [a, ca] = STOPS[i];
      const [b, cb] = STOPS[i + 1];
      if (t >= a && t <= b) {
        const f = (t - a) / (b - a);
        c = ca.map((x, k) => Math.round(x + (cb[k] - x) * f));
        break;
      }
    }
  }
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const STYLE = `
  ha-card { padding: 8px; overflow: hidden; }
  .card-title { padding: 4px 8px 8px; font-size: 1.2em; }
  svg { width: 100%; height: auto; display: block; }
  svg .bg { fill: transparent; }
  svg .box { fill: var(--card-background-color, #fff); }
  svg .panel { fill: var(--secondary-background-color, #f8f9fa); }
  svg .lbl { fill: var(--secondary-text-color, #5f6368); }
  svg .val, svg .title { fill: var(--primary-text-color, #202124); }
  svg .click { cursor: pointer; }
  svg .hit { fill: transparent; cursor: pointer; }
  svg .hit:hover { fill: var(--primary-color, #03a9f4); fill-opacity: 0.08; }
  svg #btn-sp-down, svg #btn-sp-up { cursor: pointer; }
  svg.paused .spin { animation-play-state: paused; }
  @media (prefers-reduced-motion: reduce) { svg .spin { animation: none; } }
  svg #btn-sp-down:active circle, svg #btn-sp-up:active circle { fill: #c6dafc; }
`;

class ThermiaHeatpumpCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("thermia-heatpump-card-editor");
  }

  // Exposed for the editor and for tests.
  static detectEntities(hass, deviceId) {
    return detectEntities(hass, deviceId);
  }

  static getStubConfig() {
    return { entities: {} };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.entities !== undefined && (typeof config.entities !== "object" || config.entities === null))
      throw new Error("entities: must be a map of key: entity_id");
    config = { ...config, entities: { ...(config.entities || {}) } };
    const unknown = Object.keys(config.entities).filter((k) => !ENTITY_KEYS.includes(k));
    if (unknown.length) throw new Error(`Unknown entity keys: ${unknown.join(", ")}`);
    if (config.language && !I18N[config.language]) throw new Error("language: must be pl or en");
    if (config.device !== undefined && typeof config.device !== "string") throw new Error("device: must be a device id");
    this._config = config;
    this._ents = config.entities;
    this._detectedFor = undefined;
    if (this._root) this._build();
  }

  getCardSize() {
    return 6;
  }

  // Sections view: take the full width of the section (the drawing scales with the width, so a narrow card is a
  // small drawing). Widen the section itself with column_span, or use a panel view.
  getGridOptions() {
    return { columns: "full", rows: "auto", min_columns: 12 };
  }

  set hass(hass) {
    this._hass = hass;
    // `device:` fills in every entity that is not given explicitly. Re-run only when the registry changes.
    if (this._config.device && hass.entities !== this._detectedFor) {
      this._detectedFor = hass.entities;
      const ents = { ...detectEntities(hass, this._config.device), ...this._config.entities };
      const changed = JSON.stringify(ents) !== JSON.stringify(this._ents);
      this._ents = ents;
      if (changed && this._root) this._build();
    }
    if (!this._root) this._build();
    this._update();
  }

  get _lang() {
    const lang = this._config.language || (this._hass && this._hass.language) || "en";
    return I18N[lang] ? lang : lang.startsWith("pl") ? "pl" : "en";
  }

  _t(key) {
    return I18N[this._lang][key] || I18N.en[key] || key;
  }

  _build() {
    if (!this._root) this._root = this.attachShadow({ mode: "open" });
    const title = this._config.title ? `<div class="card-title">${this._config.title}</div>` : "";
    this._root.innerHTML = `<style>${STYLE}</style><ha-card>${title}${SVG}</ha-card>`;
    this._svg = this._root.querySelector("svg");
    this._svg.removeAttribute("width");
    this._svg.removeAttribute("height");
    for (const el of this._svg.querySelectorAll("[data-i18n]")) el.textContent = this._t(el.dataset.i18n);
    this._hitsDone = false;
    this._lastStates = undefined;
    this._el("btn-sp-down").addEventListener("click", () => this._stepSetpoint(-1));
    this._el("btn-sp-up").addEventListener("click", () => this._stepSetpoint(1));
  }

  connectedCallback() {
    // Pause the spinning icons while the card is off screen (another view, collapsed, scrolled away).
    if (!this._observer && "IntersectionObserver" in window) {
      this._observer = new IntersectionObserver((entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (this._svg) this._svg.classList.toggle("paused", !visible);
        if (visible) this._addHitAreas();
      });
      this._observer.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
    this._observer = undefined;
  }

  // Needs real layout (getBoundingClientRect), so it runs once the card is visible and sized.
  _addHitAreas() {
    if (this._hitsDone || !this._svg) return;
    const ctm = this._svg.getScreenCTM();
    if (!ctm || this._svg.getBoundingClientRect().width === 0) return;
    const inv = ctm.inverse();
    const NS = "http://www.w3.org/2000/svg";
    const layer = document.createElementNS(NS, "g");
    layer.setAttribute("id", "hit-layer");
    for (const [key, refs] of Object.entries(CLICK_GROUPS)) {
      const entityKey = this._ents[key] ? key : CLICK_FALLBACK[key];
      if (!entityKey || !this._ents[entityKey]) continue;
      let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
      for (const ref of refs) {
        const el = ref.startsWith("i18n:")
          ? this._svg.querySelector(`[data-i18n="${ref.slice(5)}"]`)
          : this._el(ref);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        for (const [px, py] of [[r.left, r.top], [r.right, r.bottom]]) {
          const pt = new DOMPoint(px, py).matrixTransform(inv);
          x1 = Math.min(x1, pt.x); y1 = Math.min(y1, pt.y); x2 = Math.max(x2, pt.x); y2 = Math.max(y2, pt.y);
        }
      }
      if (!Number.isFinite(x1)) continue;
      const pad = 4;
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("class", "hit");
      rect.setAttribute("x", x1 - pad);
      rect.setAttribute("y", y1 - pad);
      rect.setAttribute("width", x2 - x1 + 2 * pad);
      rect.setAttribute("height", y2 - y1 + 2 * pad);
      rect.setAttribute("rx", 6);
      rect.dataset.entity = entityKey;
      rect.addEventListener("click", () => this._moreInfo(key === "aux_3kw" ? this._auxKey(entityKey) : entityKey));
      layer.appendChild(rect);
    }
    // On top of everything; the -/+ buttons sit outside every hit area, so they stay clickable.
    this._svg.appendChild(layer);
    this._hitsDone = true;
  }

  _el(id) {
    return this._svg.getElementById ? this._svg.getElementById(id) : this._svg.querySelector(`#${id}`);
  }

  _state(key) {
    const id = this._ents[key];
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  _num(key) {
    const st = this._state(key);
    return st ? parseFloat(st.state) : NaN;
  }

  // true/false for binary entities, undefined if not configured or unavailable
  _on(key) {
    const st = this._state(key);
    if (!st || st.state === "unavailable" || st.state === "unknown") return undefined;
    return st.state === "on";
  }

  _text(id, text, color) {
    const el = this._el(id);
    if (!el) return;
    el.textContent = text;
    if (color !== undefined) el.style.fill = color;
  }

  _stroke(id, color) {
    const el = this._el(id);
    if (el) el.style.stroke = color;
  }

  _fill(id, color) {
    const el = this._el(id);
    if (el) el.style.fill = color;
  }

  _spin(id, on) {
    const el = this._el(id);
    if (el) el.classList.toggle("spin", !!on);
  }

  _fmt(value, decimals, unit) {
    return Number.isFinite(value) ? `${value.toFixed(decimals)}${unit}` : "—";
  }

  _temp(key, id, decimals = 1, suffix = " °C") {
    const t = this._num(key);
    this._text(id, this._fmt(t, decimals, suffix), Number.isFinite(t) ? tcol(t) : undefined);
    return t;
  }

  // A pump runs if its binary sensor says so; without one, if its speed is above 0.
  _pumpOn(binKey, speedKey) {
    const on = this._on(binKey);
    if (on !== undefined) return on;
    const speed = this._num(speedKey);
    return Number.isFinite(speed) ? speed > 0 : undefined;
  }

  _update() {
    if (!this._svg || !this._hass) return;
    // HA calls `set hass` on every state change anywhere in the system; redraw only when one of ours changed.
    // State objects are replaced on change, so comparing references is enough.
    const states = Object.values(this._ents).map((id) => this._hass.states[id]);
    if (this._lastStates && states.length === this._lastStates.length &&
        states.every((st, i) => st === this._lastStates[i])) return;
    this._lastStates = states;
    if (!this._hitsDone) requestAnimationFrame(() => this._addHitAreas());

    // outdoor
    this._temp("outdoor", "val-outdoor");

    // ground loop
    const brineOn = this._pumpOn("brine_pump", "brine_pump_speed");
    const bi = this._temp("brine_in", "val-brine-in");
    const bo = this._temp("brine_out", "val-brine-out");
    const biCol = brineOn === false ? OFF : tcol(bi);
    const boCol = brineOn === false ? OFF : tcol(bo);
    for (const id of ["pipe-brine-in", "pipe-borehole-up", "coil-evaporator"]) this._stroke(id, biCol);
    for (const id of ["pipe-brine-out", "pipe-borehole-down"]) this._stroke(id, boCol);
    this._fill("evaporator", tcol(bi));
    this._text("val-brine-pwm", this._fmt(this._num("brine_pump_speed"), 0, " %"));
    this._fill("st-brine-pump", brineOn ? "#1a73e8" : "#9aa0a6");
    this._spin("st-brine-pump", brineOn);

    // heat pump
    const comp = this._on("compressor");
    const hotGas = this._num("hot_gas");
    const t1 = this._num("supply");
    const t2 = this._num("return");
    this._fill("st-compressor-disc", comp ? "#7cb342" : "#bdc1c6");
    this._spin("compressor-fan", comp);
    this._text("st-compressor", this._t(comp ? "compressor_on" : "compressor_off"),
      comp ? "#137333" : "var(--secondary-text-color, #5f6368)");
    this._fill("st-compressor-bg", comp ? "#e6f4ea" : CHIP_OFF);
    this._stroke("ref-suction", comp ? tcol(bo - 4) : OFF);
    this._stroke("ref-discharge", comp ? tcol(hotGas) : OFF);
    this._stroke("ref-liquid", comp ? tcol(t2) : OFF);
    this._stroke("ref-expanded", comp ? tcol(bo - 8) : OFF);
    this._text("val-hot-gas", this._fmt(hotGas, 0, " °C"));
    this._text("val-current", this._fmt(this._num("current"), 1, " A"));
    // aux heaters: total power of the stages that are on
    const kw = (this._on("aux_3kw") ? 3 : 0) + (this._on("aux_6kw") ? 6 : 0);
    const auxKnown = this._state("aux_3kw") || this._state("aux_6kw");
    this._text("val-aux", auxKnown ? `${kw} kW` : "—", kw ? "#c5221f" : "var(--secondary-text-color, #80868b)");
    this._stroke("st-heater-coil", kw ? "#ea4335" : "#9aa0a6");
    const integral = this._num("integral");
    this._text("val-integral", this._fmt(integral, 0, " °C·min"),
      Number.isFinite(integral) && integral < 0 ? "#c5221f" : undefined);
    this._temp("supply_target", "val-target");
    this._text("val-target-now", Number.isFinite(t1) ? ` (T1 ${this._fmt(t1, 1, " °C")})` : "");

    // heating / DHW side
    const dhw = this._on("hotwater_production") === true;
    const supplyOn = this._pumpOn("supply_pump", "supply_pump_speed");
    this._temp("supply", "val-t1");
    this._temp("return", "val-t2");
    const hot = supplyOn === false ? OFF : tcol(t1);
    const ret = supplyOn === false ? OFF : tcol(t2);
    this._stroke("pipe-supply", hot);
    this._stroke("pipe-return", ret);
    this._stroke("coil-condenser", tcol(t1));
    this._fill("condenser", tcol(t1));
    this._stroke("pipe-co-supply", dhw ? OFF : hot);
    this._stroke("pipe-co-return", dhw ? OFF : ret);
    this._stroke("pipe-cwu-supply", dhw ? hot : OFF);
    this._stroke("pipe-cwu-return", dhw ? ret : OFF);
    this._stroke("pipe-cwu-coil", dhw ? hot : OFF);
    const gIn = this._el("grad-floor-in");
    const gOut = this._el("grad-floor-out");
    if (gIn) gIn.setAttribute("stop-color", dhw ? OFF : hot);
    if (gOut) gOut.setAttribute("stop-color", dhw ? OFF : ret);
    this._fill("st-valve-co", dhw ? "#ffffff" : hot);
    this._fill("st-valve-cwu", dhw ? hot : "#ffffff");
    this._text("st-valve", `→ ${this._t(dhw ? "hot_water" : "heating")}`, dhw ? "#1a73e8" : "#c5221f");
    this._fill("st-valve-bg", dhw ? "#e8f0fe" : "#fce8e6");
    this._text("val-supply-pwm", this._fmt(this._num("supply_pump_speed"), 0, " %"));
    this._fill("st-supply-pump", supplyOn ? "#1a73e8" : "#9aa0a6");
    this._spin("st-supply-pump", supplyOn);
    const t3 = this._num("hotwater");
    this._text("val-t3", this._fmt(t3, 0, " °C"), Number.isFinite(t3) ? tcol(t3) : undefined);
    this._fill("fill-tank", tcol(t3));

    // room sensor
    this._text("val-room", this._fmt(this._num("room_temperature"), 1, "°"));
    // While a +/- change is waiting to be sent, keep showing it instead of the old state.
    const sp = Number.isFinite(this._pendingSetpoint) ? this._pendingSetpoint : this._num("setpoint");
    this._text("val-sp-sensor", this._fmt(sp, 1, "°"));
    this._text("val-sp-active", this._fmt(this._num("indoor_target"), 1, " °C"));
    this._text("val-sp-fallback", this._fmt(this._num("fallback_setpoint"), 1, " °C"));
    this._text("val-room-factor", this._fmt(this._num("room_factor"), 0, ""));
    const alarm = this._on("alarm_indoor_sensor");
    this._fill("st-room-alarm", alarm ? "#fce8e6" : "#e6f4ea");
    this._text("st-room-alarm-text", this._t(alarm ? "sensor_alarm" : "sensor_ok"), alarm ? "#c5221f" : "#137333");
  }

  _stepSetpoint(dir) {
    const st = this._state("setpoint");
    if (!st) return;
    const step = Number(st.attributes.step) || 0.5;
    const min = Number.isFinite(Number(st.attributes.min)) ? Number(st.attributes.min) : -Infinity;
    const max = Number.isFinite(Number(st.attributes.max)) ? Number(st.attributes.max) : Infinity;
    // Count from the last value shown, so quick repeated clicks add up before HA reports back.
    const current = Number.isFinite(this._pendingSetpoint) ? this._pendingSetpoint : parseFloat(st.state);
    if (!Number.isFinite(current)) return;
    const value = Math.min(max, Math.max(min, Math.round((current + dir * step) / step) * step));
    this._pendingSetpoint = value;
    this._text("val-sp-sensor", this._fmt(value, 1, "°"));
    clearTimeout(this._setpointTimer);
    this._setpointTimer = setTimeout(() => {
      this._hass.callService("number", "set_value", { entity_id: st.entity_id, value });
      this._pendingSetpoint = undefined;
    }, 600);
  }

  // The heater icon stands for both stages: open the one that is running (3 kW when both or neither run).
  _auxKey(fallback) {
    if (this._ents.aux_6kw && this._on("aux_6kw") && !this._on("aux_3kw")) return "aux_6kw";
    return fallback;
  }

  _moreInfo(key) {
    const entityId = this._ents[key];
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}

class ThermiaHeatpumpCardEditor extends HTMLElement {
  // Exposed for tests.
  static schema(lang, deviceEntities) {
    return editorSchema(lang, deviceEntities);
  }

  setConfig(config) {
    this._config = { ...config, entities: { ...(config.entities || {}) } };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  async _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      if (this._loading) return;
      this._loading = true;
      await loadHaForm();
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => this._changed(ev.detail.value));
      this.appendChild(this._form);
    }
    const lang = langOf(this._hass);
    this._form.hass = this._hass;
    this._form.computeLabel = (schema) => EDITOR_LABELS[lang][schema.name] || schema.name;
    this._form.data = this._config;
    this._form.schema = editorSchema(lang, deviceEntityIds(this._hass, this._config.device));
  }

  _changed(value) {
    const prev = this._config;
    const cfg = { ...value, entities: Object.fromEntries(Object.entries(value.entities || {}).filter(([, v]) => v)) };
    // A newly picked device: fill the entities from it, keep the user's picks that belong to the same device.
    if (cfg.device && cfg.device !== prev.device) {
      const own = new Set(deviceEntityIds(this._hass, cfg.device));
      const kept = Object.fromEntries(Object.entries(cfg.entities).filter(([, v]) => own.has(v)));
      cfg.entities = { ...detectEntities(this._hass, cfg.device), ...kept };
    }
    for (const k of ["device", "title", "language"]) if (!cfg[k]) delete cfg[k];
    this._config = cfg;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
    this._render();
  }
}

customElements.define("thermia-heatpump-card", ThermiaHeatpumpCard);
customElements.define("thermia-heatpump-card-editor", ThermiaHeatpumpCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "thermia-heatpump-card",
  name: "Thermia heat pump",
  description: "Heat pump schematic with live temperatures (esphome-thermia / esphome-thermia-room).",
  preview: false,
});
console.info(`%c THERMIA-HEATPUMP-CARD %c ${CARD_VERSION} `, "background:#1a73e8;color:#fff", "");
