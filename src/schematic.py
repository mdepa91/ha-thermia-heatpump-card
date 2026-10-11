# Generates heatpump.svg - the drawing used by the card, with example values (winter day) so it can also be viewed
# on its own. Every dynamic element has an id (pipe-*, ref-*, val-*, st-*, btn-*) that card.js updates; every
# static label has data-i18n="<key>" so the card can translate it (see I18N in card.js).
#   python3 src/schematic.py src/heatpump.svg
import sys

V = dict(  # example values (winter day)
    outdoor=-3.0, brine_in=2.1, brine_out=-1.4, brine_pwm=65,
    t1=38.2, t2=33.5, target=39.0, t3=48.0, hot_gas=72.0, integral=-120,
    current=6.2, supply_pwm=40, compressor=True, aux3=False, aux6=False,
    valve="CO", room=21.3, sp_sensor=21.5, sp_active=21.5, sp_fallback=20.0, room_factor=3,
)

STOPS = [(-5, (37, 99, 235)), (5, (6, 182, 212)), (20, (34, 197, 94)), (35, (234, 179, 8)),
         (45, (249, 115, 22)), (55, (220, 38, 38))]


def tcol(t):
    """-5 C blue -> 5 cyan -> 20 green -> 35 yellow -> 45 orange -> 55 red, linear in between."""
    if t <= STOPS[0][0]:
        c = STOPS[0][1]
    elif t >= STOPS[-1][0]:
        c = STOPS[-1][1]
    else:
        for (a, ca), (b, cb) in zip(STOPS, STOPS[1:]):
            if a <= t <= b:
                f = (t - a) / (b - a)
                c = tuple(round(x + (y - x) * f) for x, y in zip(ca, cb))
                break
    return "#%02x%02x%02x" % c


OFF = "#c4c7cc"
W, H = 1030, 600
o = []
A = o.append


def chevron(x, y, ang, color="#ffffff"):
    A(f'<path d="M-5,-5 L5,0 L-5,5" transform="translate({x},{y}) rotate({ang})" fill="none" '
      f'stroke="{color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')




def pump(gid, x, y, on, label, pwm_id, pwm):
    """Circulation pump: white disc with a 4-vane impeller; the impeller spins while the pump runs."""
    vanes = "".join(f'<path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate({k * 90})"/>' for k in range(4))
    A(f'<g id="{gid}" transform="translate({x},{y})"><circle r="19" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>'
      f'<g id="st-{gid}" class="impeller{" spin" if on else ""}" fill="{"#1a73e8" if on else "#9aa0a6"}">{vanes}'
      '<circle r="3" fill="#ffffff" stroke="#5f6368"/></g></g>')
    A(f'<text x="{x}" y="{y-40}" text-anchor="middle" class="lbl">{label}</text>')
    A(f'<text id="{pwm_id}" x="{x}" y="{y-24}" text-anchor="middle" class="val">{pwm} %</text>')


A(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
  'font-family="Helvetica, Arial, sans-serif" font-size="13">')
A(f'''<defs>
  <style>
    .pipe{{fill:none;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}}
    .ref{{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}}
    .lbl{{fill:#5f6368;font-size:12px}}
    .val{{fill:#202124;font-size:14px;font-weight:bold}}
    .title{{fill:#202124;font-size:14px;font-weight:bold}}
    .tag{{font-size:11px;font-weight:bold}}
    .sig{{fill:none;stroke:#9aa0a6;stroke-width:1.5;stroke-dasharray:5 4}}
    .spin{{transform-box:fill-box;transform-origin:center;animation:th-spin 2s steps(60) infinite}}
    .impeller.spin{{animation:th-spin 1.6s steps(48) infinite}}
    @keyframes th-spin{{to{{transform:rotate(360deg)}}}}
  </style>
  <pattern id="soil" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="#a47551"/><circle cx="4" cy="5" r="1.4" fill="#8a5f3e"/>
    <circle cx="12" cy="11" r="1.1" fill="#8a5f3e"/></pattern>
  <linearGradient id="grad-floor" x1="0" y1="0" x2="0" y2="1">
    <stop id="grad-floor-in" offset="0" stop-color="{tcol(V["t1"]) if V["valve"] == "CO" else OFF}"/>
    <stop id="grad-floor-out" offset="1" stop-color="{tcol(V["t2"]) if V["valve"] == "CO" else OFF}"/>
  </linearGradient>
</defs>''')
A(f'<rect width="{W}" height="{H}" fill="#f1f3f4"/>')

# heat pump frame first: every pipe is drawn over it and reaches the heat exchangers
A('<rect x="300" y="110" width="340" height="370" rx="12" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')

# ---------- outdoor sensor ----------
A('<g id="outdoor">')
A('<circle cx="40" cy="38" r="14" fill="#fbbc04"/>')
A('<path d="M30,62 a12,12 0 0 1 7,-21 a16,16 0 0 1 29,4 a10,10 0 0 1 2,20 h-34 a9,9 0 0 1 -4,-3 z" '
  'fill="#ffffff" stroke="#9aa0a6" stroke-width="1.5"/>')
A('<text x="84" y="34" class="lbl">Zewnętrzna</text>')
A(f'<text id="val-outdoor" x="84" y="56" font-size="20" font-weight="bold" fill="{tcol(V["outdoor"])}">'
  f'{V["outdoor"]:.0f} °C</text>')
A('</g>')
A('<path class="sig" d="M160,48 H390 V110"/>')

# ---------- ground source ----------
A('<rect x="10" y="420" width="230" height="170" rx="6" fill="url(#soil)"/>')
A('<rect x="10" y="414" width="230" height="8" fill="#34a853"/>')
A('<text x="140" y="448" class="title" style="fill:#ffffff">Dolne źródło</text>')
bi, bo = tcol(V["brine_in"]), tcol(V["brine_out"])
A(f'<path id="pipe-borehole-up" class="pipe" stroke="{bi}" d="M110,560 Q90,580 70,560 V420"/>')
A(f'<path id="pipe-borehole-down" class="pipe" stroke="{bo}" d="M110,420 V560"/>')
A(f'<path id="pipe-brine-in" class="pipe" stroke="{bi}" d="M70,420 V200 H325"/>')
A(f'<path id="pipe-brine-out" class="pipe" stroke="{bo}" d="M325,280 H110 V420"/>')
for x, y, a in ((70, 500, -90), (110, 500, 90), (70, 320, -90), (260, 200, 0), (240, 280, 180), (110, 350, 90)):
    chevron(x, y, a)
pump("brine-pump", 175, 200, True, "Pompa DŹ", "val-brine-pwm", V["brine_pwm"])
A('<text x="128" y="236" class="lbl">DŹ wejście</text>')
A(f'<text id="val-brine-in" x="128" y="252" class="val" fill="{bi}">{V["brine_in"]:.1f} °C</text>')
A('<text x="128" y="310" class="lbl">DŹ wyjście</text>')
A(f'<text id="val-brine-out" x="128" y="326" class="val" fill="{bo}">{V["brine_out"]:.1f} °C</text>')

# ---------- heat pump: closed refrigerant circuit ----------
A('<text x="314" y="134" class="title">Pompa ciepła</text>')
# refrigerant loop: evaporator (left) -> compressor (top) -> condenser (right) -> expansion valve (bottom)
suction = tcol(V["brine_out"] - 4)      # cold gas leaving the evaporator
discharge = tcol(V["hot_gas"])          # hot gas after the compressor
liquid = tcol(V["t2"])                  # warm liquid leaving the condenser
expanded = tcol(V["brine_out"] - 8)     # cold mix after the expansion valve
A(f'<path id="ref-suction" class="ref" stroke="{suction}" d="M350,170 V150 H446"/>')
A(f'<path id="ref-discharge" class="ref" stroke="{discharge}" d="M494,150 H590 V170"/>')
A(f'<path id="ref-liquid" class="ref" stroke="{liquid}" d="M590,310 V350 H486"/>')
A(f'<path id="ref-expanded" class="ref" stroke="{expanded}" d="M454,350 H350 V310"/>')
for x, y, a in ((400, 150, 0), (545, 150, 0), (590, 330, 90), (530, 350, 180), (400, 350, 180), (350, 330, -90)):
    chevron(x, y, a)
# evaporator / condenser (heat exchangers) with the brine / heating water passing through
A(f'<rect id="evaporator" x="325" y="170" width="50" height="140" rx="10" fill="{tcol(V["brine_in"])}" '
  'fill-opacity="0.25" stroke="#5f6368" stroke-width="1.5"/>')
A(f'<rect id="condenser" x="565" y="170" width="50" height="140" rx="10" fill="{tcol(V["t1"])}" '
  'fill-opacity="0.25" stroke="#5f6368" stroke-width="1.5"/>')
def serpentine(x_in, x_near, x_far):
    """4 horizontal runs y=200..280 joined by equal U-turns; enters and leaves at x_in on the outer side."""
    r = 80 / 6  # half the row spacing
    sweep_far, sweep_near = (1, 0) if x_far > x_in else (0, 1)
    return (f"M{x_in},200 H{x_far} a{r},{r} 0 0 {sweep_far} 0,{2*r:.2f} H{x_near} a{r},{r} 0 0 {sweep_near} 0,{2*r:.2f} "
            f"H{x_far} a{r},{r} 0 0 {sweep_far} 0,{2*r:.2f} H{x_in}")


A(f'<path id="coil-evaporator" d="{serpentine(325, 345, 358)}" fill="none" stroke="{bi}" stroke-width="4" stroke-linejoin="round"/>')
A(f'<path id="coil-condenser" d="{serpentine(615, 595, 582)}" fill="none" stroke="{tcol(V["t1"])}" stroke-width="4" stroke-linejoin="round"/>')
A('<text x="350" y="374" text-anchor="middle" class="lbl" font-size="10">parownik</text>')
A('<text x="590" y="374" text-anchor="middle" class="lbl" font-size="10">skraplacz</text>')
# compressor: green disc with fan blades
on = V["compressor"]
A('<g id="compressor" transform="translate(470,150)">'
  f'<circle id="st-compressor-disc" r="24" fill="{"#7cb342" if on else "#bdc1c6"}" stroke="#ffffff" stroke-width="3"/>'
  f'<g id="compressor-fan" class="fan{" spin" if on else ""}" fill="#ffffff">' +
  ''.join(f'<path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate({k * 45})"/>' for k in range(8)) +
  '<circle r="3.5" fill="#ffffff"/></g></g>')
# expansion valve
A('<g id="expansion-valve" transform="translate(470,350)"><rect x="-16" y="-9" width="32" height="18" rx="4" '
  'fill="#e8eaed" stroke="#5f6368" stroke-width="1.5"/><path d="M-9,-9 V9 M9,-9 V9" stroke="#9aa0a6"/></g>')
A('<text x="470" y="374" text-anchor="middle" class="lbl" font-size="10">zawór rozprężny</text>')
# compressor status + parameters in the middle of the loop
A(f'<rect id="st-compressor-bg" x="412" y="186" width="116" height="20" rx="10" fill="{"#e6f4ea" if on else "#f1f3f4"}"/>')
A(f'<text id="st-compressor" x="470" y="200" text-anchor="middle" class="tag" fill="{"#137333" if on else "#5f6368"}">'
  f'{"SPRĘŻARKA ON" if on else "SPRĘŻARKA OFF"}</text>')
for i, (l, v, vid) in enumerate((("Gorący gaz", f'{V["hot_gas"]:.0f} °C', "val-hot-gas"),
                                 ("Prąd", f'{V["current"]:.1f} A', "val-current"))):
    y = 234 + i * 22
    A(f'<text x="400" y="{y}" class="lbl">{l}</text>'
      f'<text id="{vid}" x="540" y="{y}" text-anchor="end" class="val">{v}</text>')
# bottom panel: integral + supply target
A('<rect x="318" y="394" width="304" height="70" rx="8" fill="#f8f9fa" stroke="#dadce0"/>')
A('<text x="334" y="422" class="lbl">Integral</text>')
A(f'<text id="val-integral" x="606" y="422" text-anchor="end" class="val">{V["integral"]} °C·min</text>')
A('<text x="334" y="448" class="lbl">Zasilanie zadana</text>')
A(f'<text id="val-target" x="606" y="448" text-anchor="end" class="val" fill="{tcol(V["target"])}">'
  f'{V["target"]:.1f} °C</text>')

# ---------- heating side ----------
co = V["valve"] == "CO"
hot, ret = tcol(V["t1"]), tcol(V["t2"])
A(f'<path id="pipe-supply" class="pipe" stroke="{hot}" d="M615,200 H750"/>')
A(f'<path id="pipe-co-supply" class="pipe" stroke="{hot if co else OFF}" d="M776,200 H835 V125 H872"/>')
A(f'<path id="pipe-cwu-supply" class="pipe" stroke="{OFF if co else hot}" d="M763,213 V275"/>')
A(f'<path id="pipe-co-return" class="pipe" stroke="{ret if co else OFF}" d="M872,265 H845 V470"/>')
A(f'<path id="pipe-cwu-return" class="pipe" stroke="{OFF if co else ret}" d="M763,440 V470"/>')
A(f'<path id="pipe-return" class="pipe" stroke="{ret}" d="M845,470 H660 V280 H615"/>')
for x, y, a in ((805, 200, 0), (845, 400, 90), (720, 470, 180), (660, 360, -90)):
    chevron(x, y, a)
pump("supply-pump", 707, 200, True, "Pompa CO", "val-supply-pwm", V["supply_pwm"])
# electric aux heaters (3 + 6 kW) sit in the supply line after the condenser: heater icon, total power above
aux_kw = (3 if V["aux3"] else 0) + (6 if V["aux6"] else 0)
A('<g id="heater">'
  '<rect x="648" y="187" width="28" height="26" rx="5" fill="#ffffff" stroke="#5f6368" stroke-width="1.8"/>'
  f'<path id="st-heater-coil" d="M651,200 l3,-7 l3.5,14 l3.5,-14 l3.5,14 l3.5,-14 l3,7" fill="none" '
  f'stroke="{"#ea4335" if aux_kw else "#9aa0a6"}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></g>')
A(f'<text id="val-aux" x="662" y="179" text-anchor="middle" class="tag" font-size="12" '
  f'fill="{"#c5221f" if aux_kw else "#80868b"}">{aux_kw} kW</text>')
A(f'<text id="lbl-t1" x="672" y="236" class="lbl">T1</text><text id="val-t1" x="690" y="236" class="val" fill="{hot}">'
  f'{V["t1"]:.1f} °C</text>')
A(f'<text id="lbl-t2" x="672" y="498" class="lbl">T2</text><text id="val-t2" x="690" y="498" class="val" fill="{ret}">'
  f'{V["t2"]:.1f} °C</text>')
# 3-way valve
A('<g id="valve" transform="translate(763,200)">'
  '<path d="M-12,-10 L0,0 L-12,10 Z" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>'
  f'<path id="st-valve-co" d="M12,-10 L0,0 L12,10 Z" fill="{hot if co else "#ffffff"}" stroke="#5f6368" stroke-width="2"/>'
  f'<path id="st-valve-cwu" d="M-10,12 L0,0 L10,12 Z" fill="{"#ffffff" if co else hot}" stroke="#5f6368" stroke-width="2"/></g>')
A(f'<rect id="st-valve-bg" x="752" y="150" width="60" height="20" rx="10" fill="{"#fce8e6" if co else "#e8f0fe"}"/>')
A(f'<text id="st-valve" x="782" y="164" text-anchor="middle" class="tag" fill="{"#c5221f" if co else "#1a73e8"}">'
  f'→ {V["valve"]}</text>')
A('<text x="782" y="142" text-anchor="middle" class="lbl" font-size="11">zawór 3D</text>')
# underfloor heating coil (CO): narrow, tall meander from the top (supply) to the bottom (return), colour T1 -> T2
A('<rect x="866" y="110" width="104" height="170" rx="8" fill="#ffffff" stroke="#dadce0"/>')
A('<text x="918" y="102" text-anchor="middle" class="title">CO</text>')
rows, top, bottom = 8, 125, 265
r = (bottom - top) / (rows - 1) / 2
d = f"M872,{top} H955"
for k in range(rows - 1):
    d += f" a{r:.2f},{r:.2f} 0 0 1 0,{2*r:.2f} H885" if k % 2 == 0 else f" a{r:.2f},{r:.2f} 0 0 0 0,{2*r:.2f} H955"
d += " H872"
A(f'<path id="pipe-floor" fill="none" stroke="url(#grad-floor)" stroke-width="5" stroke-linecap="round" '
  f'stroke-linejoin="round" d="{d}"/>')
# hot water tank (CWU)
A('<g id="tank">')
A('<rect x="718" y="270" width="90" height="175" rx="32" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')
A(f'<rect id="fill-tank" x="721" y="273" width="84" height="169" rx="29" fill="{tcol(V["t3"])}" opacity="0.18"/>')
# helical coil: front half-turns drawn solid, back half-turns lighter, like a spring seen from the side
coil_col = OFF if co else hot
turns, cx, rx, ry, y0, pitch = 6, 763, 20, 6, 306, 11
back = "".join(f"M{cx + rx},{y0 + k * pitch + pitch / 2:.1f} A{rx},{ry} 0 0 0 {cx - rx},{y0 + (k + 1) * pitch:.1f} "
               for k in range(turns))
front = f"M{cx},{y0 - 26} V{y0 - 8} L{cx - rx},{y0} " + "".join(
    f"M{cx - rx},{y0 + k * pitch} A{rx},{ry} 0 0 0 {cx + rx},{y0 + k * pitch + pitch / 2:.1f} " for k in range(turns))
front += f"M{cx - rx},{y0 + turns * pitch} L{cx},{y0 + turns * pitch + 8} V440"
A(f'<g id="pipe-cwu-coil" fill="none" stroke="{coil_col}" stroke-width="3.5" stroke-linecap="round">'
  f'<path d="{back}" stroke-opacity="0.45"/><path d="{front}"/></g>')
A('<text x="740" y="296" text-anchor="middle" class="title" font-size="12">CWU</text>')
A('<text id="lbl-t3" x="740" y="400" text-anchor="middle" class="lbl">T3</text>')
A(f'<text id="val-t3" x="740" y="418" text-anchor="middle" class="val" fill="{tcol(V["t3"])}">{V["t3"]:.0f} °C</text>')
A('</g>')

# ---------- room sensor with setpoint buttons (under the CO coil) ----------
A('<g id="room" transform="translate(-157,50)">')
A('<rect x="1015" y="250" width="160" height="250" rx="16" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')
A('<rect x="1043" y="268" width="109" height="52" rx="7" fill="#202124"/>')
A(f'<text id="val-room" x="1097" y="304" text-anchor="middle" font-size="24" font-weight="bold" fill="#8ab4f8">'
  f'{V["room"]:.1f}°</text>')
A('<text x="1097" y="340" text-anchor="middle" class="lbl">zadana</text>')
A('<g id="btn-sp-down" transform="translate(1052,364)"><circle r="14" fill="#e8f0fe" stroke="#1a73e8" stroke-width="1.5"/>'
  '<path d="M-6,0 H6" stroke="#1a73e8" stroke-width="2.5" stroke-linecap="round"/></g>')
A(f'<text id="val-sp-sensor" x="1097" y="370" text-anchor="middle" class="val" font-size="17">{V["sp_sensor"]:.1f}°</text>')
A('<g id="btn-sp-up" transform="translate(1142,364)"><circle r="14" fill="#e8f0fe" stroke="#1a73e8" stroke-width="1.5"/>'
  '<path d="M-6,0 H6 M0,-6 V6" stroke="#1a73e8" stroke-width="2.5" stroke-linecap="round"/></g>')
for i, (l, key, vid) in enumerate((("Aktywna (r03)", "sp_active", "val-sp-active"),
                                   ("Awaryjna (r32)", "sp_fallback", "val-sp-fallback"))):
    y = 404 + i * 22
    A(f'<text x="1027" y="{y}" class="lbl" font-size="11">{l}</text>'
      f'<text id="{vid}" x="1165" y="{y}" text-anchor="end" class="val" font-size="12">{V[key]:.1f} °C</text>')
A('<text x="1027" y="448" class="lbl" font-size="11">Waga temp. pok.</text>'
  f'<text id="val-room-factor" x="1165" y="448" text-anchor="end" class="val" font-size="12">{V["room_factor"]}</text>')
A('<rect id="st-room-alarm" x="1045" y="466" width="104" height="20" rx="10" fill="#e6f4ea"/>')
A('<text id="st-room-alarm-text" x="1097" y="480" text-anchor="middle" class="tag" fill="#137333">czujnik OK</text>')
A('</g>')
A('<path class="sig" d="M1018,420 H1024 V80 H550 V110"/>')
A('<text x="700" y="74" class="lbl" font-size="10">303/304 – esphome-thermia-room</text>')

# ---------- legend ----------
A('<text x="300" y="556" class="lbl" font-size="11">Kolor = temperatura</text>')
for i in range(61):
    A(f'<rect x="{300 + i * 4}" y="564" width="4" height="9" fill="{tcol(-5 + i)}"/>')
for t in (-5, 15, 35, 55):
    A(f'<text x="{300 + (t + 5) * 4}" y="586" text-anchor="middle" class="lbl" font-size="10">{t}°</text>')
A(f'<path d="M570,569 h34" class="pipe" stroke="{OFF}"/><text x="612" y="573" class="lbl" font-size="11">nieaktywna gałąź</text>')
A('</svg>')

# Static labels -> data-i18n keys (Polish text is the default content; card.js swaps it for the chosen language).
I18N_KEYS = {
    "Zewnętrzna": "outdoor", "Dolne źródło": "ground", "Pompa DŹ": "brine_pump", "DŹ wejście": "brine_in",
    "DŹ wyjście": "brine_out", "Pompa ciepła": "heat_pump", "parownik": "evaporator", "skraplacz": "condenser",
    "zawór rozprężny": "expansion_valve", "Gorący gaz": "hot_gas", "Prąd": "current", "Integral": "integral",
    "Zasilanie zadana": "supply_target", "Pompa CO": "supply_pump", "zawór 3D": "valve",
    "CO": "heating", "CWU": "hot_water", "zadana": "setpoint", "Aktywna (r03)": "active_target",
    "Awaryjna (r32)": "fallback_target", "Waga temp. pok.": "room_factor", "Kolor = temperatura": "legend",
    "nieaktywna gałąź": "inactive",
}
import re


def _tag(m):
    attrs, text = m.group(1), m.group(2)
    key = I18N_KEYS.get(text)
    if key:
        attrs += f' data-i18n="{key}"'
    if 'class="val"' in attrs or 'id="val-' in attrs:
        attrs = re.sub(r' fill="(#[0-9a-f]{6})"', r' style="fill:\1"', attrs)
    return f"<text{attrs}>{text}</text>"


svg = "\n".join(o)
svg = re.sub(r"<text([^>]*)>([^<]*)</text>", _tag, svg)
svg = svg.replace(f'<rect width="{W}" height="{H}" fill="#f1f3f4"/>', f'<rect class="bg" width="{W}" height="{H}" fill="#f1f3f4"/>')
svg = re.sub(r'<rect ([^>]*fill="#ffffff"[^>]*)/>', lambda m: f'<rect class="box" {m.group(1)}/>', svg)
svg = svg.replace('fill="#f8f9fa"', 'class="panel" fill="#f8f9fa"')
open(sys.argv[1], "w").write(svg)
