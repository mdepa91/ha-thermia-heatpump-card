# Generates the drawings used by the card, with example values (winter day) so they can also be viewed on their own:
#   heatpump.svg           landscape (1030 x 600), for wide cards
#   heatpump-portrait.svg  portrait (420 x 1075), for narrow cards (phones): heating on top, heat pump in the
#                          middle, ground loop at the bottom
# Both carry the same ids: every dynamic element has an id (pipe-*, ref-*, val-*, st-*, btn-*) that card.js updates;
# every static label has data-i18n="<key>" so the card can translate it (see I18N in card.js).
#   python3 src/schematic.py src/heatpump.svg src/heatpump-portrait.svg
import re
import sys

V = dict(  # example values (winter day)
    outdoor=-3.0, heatstop=17, brine_in=2.1, brine_out=-1.4, brine_pwm=65,
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
o = []


def A(s):
    o.append(s)


# shared state of the example values
co = V["valve"] == "CO"
on = V["compressor"]
bi, bo = tcol(V["brine_in"]), tcol(V["brine_out"])
hot, ret = tcol(V["t1"]), tcol(V["t2"])
aux_kw = (3 if V["aux3"] else 0) + (6 if V["aux6"] else 0)

# MDI icons (Apache 2.0)
MDI_HOME_THERMOMETER_OUTLINE = ("M19 8C20.11 8 21 8.9 21 10V16.76C21.61 17.31 22 18.11 22 19C22 20.66 20.66 22 19 22C17.34 22 16 "
                                "20.66 16 19C16 18.11 16.39 17.31 17 16.76V10C17 8.9 17.9 8 19 8M19 9C18.45 9 18 9.45 18 10V11H20V10C20 "
                                "9.45 19.55 9 19 9M12 5.69L7 10.19V18H14.1L14 19L14.1 20H5V12H2L12 3L16.4 6.96C15.89 7.4 15.5 7.97 "
                                "15.25 8.61L12 5.69Z")
MDI_THERMOSTAT = ("M16.95,16.95L14.83,14.83C15.55,14.1 16,13.1 16,12C16,11.26 15.79,10.57 15.43,10L17.6,7.81C18.5,9 19,10.43 "
                  "19,12C19,13.93 18.22,15.68 16.95,16.95M12,5C13.57,5 15,5.5 16.19,6.4L14,8.56C13.43,8.21 12.74,8 12,8A4,4 "
                  "0 0,0 8,12C8,13.1 8.45,14.1 9.17,14.83L7.05,16.95C5.78,15.68 5,13.93 5,12A7,7 0 0,1 12,5M12,2A10,10 0 0,0 "
                  "2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z")


def chevron(x, y, ang, color="#ffffff"):
    A(f'<path d="M-5,-5 L5,0 L-5,5" transform="translate({x},{y}) rotate({ang})" fill="none" '
      f'stroke="{color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')


def pump(gid, x, y, on, label, pwm_id, pwm, side=None):
    """Circulation pump: white disc with a 4-vane impeller; the impeller spins while the pump runs.
    The label and speed go above the pump, or to its "left" / "right" (for a pump on a vertical pipe)."""
    vanes = "".join(f'<path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate({k * 90})"/>' for k in range(4))
    A(f'<g id="{gid}" transform="translate({x},{y})"><circle r="19" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>'
      f'<g id="st-{gid}" class="impeller{" spin" if on else ""}" fill="{"#1a73e8" if on else "#9aa0a6"}">{vanes}'
      '<circle r="3" fill="#ffffff" stroke="#5f6368"/></g></g>')
    if side is None:
        A(f'<text x="{x}" y="{y-40}" text-anchor="middle" class="lbl">{label}</text>')
        A(f'<text id="{pwm_id}" x="{x}" y="{y-24}" text-anchor="middle" class="val">{pwm} %</text>')
    else:
        lx, anchor = (x - 26, "end") if side == "left" else (x + 26, "start")
        A(f'<text x="{lx}" y="{y-4}" text-anchor="{anchor}" class="lbl">{label}</text>')
        A(f'<text id="{pwm_id}" x="{lx}" y="{y+14}" text-anchor="{anchor}" class="val">{pwm} %</text>')


def header(w, h, floor_up=False):
    """<svg>, styles, patterns; floor_up: the floor coil is fed from the bottom (T1 at the bottom of the gradient)."""
    A(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
      'font-family="Helvetica, Arial, sans-serif" font-size="13">')
    y1, y2 = ("1", "0") if floor_up else ("0", "1")
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
  <linearGradient id="grad-floor" x1="0" y1="{y1}" x2="0" y2="{y2}">
    <stop id="grad-floor-in" offset="0" stop-color="{tcol(V["t1"]) if V["valve"] == "CO" else OFF}"/>
    <stop id="grad-floor-out" offset="1" stop-color="{tcol(V["t2"]) if V["valve"] == "CO" else OFF}"/>
  </linearGradient>
</defs>''')
    A(f'<rect width="{w}" height="{h}" fill="#f1f3f4"/>')


def outdoor():
    A('<g id="outdoor">')
    A('<circle cx="40" cy="38" r="14" fill="#fbbc04"/>')
    A('<path d="M30,62 a12,12 0 0 1 7,-21 a16,16 0 0 1 29,4 a10,10 0 0 1 2,20 h-34 a9,9 0 0 1 -4,-3 z" '
      'fill="#ffffff" stroke="#9aa0a6" stroke-width="1.5"/>')
    A('<text x="84" y="34" class="lbl">Zewnętrzna</text>')
    A(f'<text id="val-outdoor" x="84" y="56" font-size="20" font-weight="bold" fill="{tcol(V["outdoor"])}">'
      f'{V["outdoor"]:.0f} °C</text>')
    A('</g>')
    # heat stop: above this outdoor temperature the pump does not heat (outside the group: its own click area)
    A(f'<text id="val-heatstop" x="84" y="76" class="lbl" font-size="11">'
      f'<tspan data-i18n="heatstop">stop CO</tspan> ≥ <tspan id="val-heatstop-temp">{V["heatstop"]:.0f} °C</tspan></text>')


def serpentine(x_in, x_near, x_far):
    """4 horizontal runs y=200..280 joined by equal U-turns; enters and leaves at x_in on the outer side."""
    r = 80 / 6  # half the row spacing
    sweep_far, sweep_near = (1, 0) if x_far > x_in else (0, 1)
    return (f"M{x_in},200 H{x_far} a{r},{r} 0 0 {sweep_far} 0,{2*r:.2f} H{x_near} a{r},{r} 0 0 {sweep_near} 0,{2*r:.2f} "
            f"H{x_far} a{r},{r} 0 0 {sweep_far} 0,{2*r:.2f} H{x_in}")


def evaporator():
    """Drawn upright at x=325..375, y=170..310; brine enters at (325,200) and leaves at (325,280)."""
    A(f'<rect id="evaporator" x="325" y="170" width="50" height="140" rx="10" fill="{tcol(V["brine_in"])}" '
      'fill-opacity="0.25" stroke="#5f6368" stroke-width="1.5"/>')


def condenser():
    """Drawn upright at x=565..615, y=170..310; heating water leaves at (615,200) and returns at (615,280)."""
    A(f'<rect id="condenser" x="565" y="170" width="50" height="140" rx="10" fill="{tcol(V["t1"])}" '
      'fill-opacity="0.25" stroke="#5f6368" stroke-width="1.5"/>')


def coil_evaporator():
    A(f'<path id="coil-evaporator" d="{serpentine(325, 345, 358)}" fill="none" stroke="{bi}" stroke-width="4" stroke-linejoin="round"/>')


def coil_condenser():
    A(f'<path id="coil-condenser" d="{serpentine(615, 595, 582)}" fill="none" stroke="{tcol(V["t1"])}" stroke-width="4" stroke-linejoin="round"/>')


def compressor(x, y):
    A(f'<g id="compressor" transform="translate({x},{y})">'
      f'<circle id="st-compressor-disc" r="24" fill="{"#7cb342" if on else "#bdc1c6"}" stroke="#ffffff" stroke-width="3"/>'
      f'<g id="compressor-fan" class="fan{" spin" if on else ""}" fill="#ffffff">' +
      ''.join(f'<path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate({k * 45})"/>' for k in range(8)) +
      '<circle r="3.5" fill="#ffffff"/></g></g>')


def expansion_valve(transform):
    A(f'<g id="expansion-valve" transform="{transform}"><rect x="-16" y="-9" width="32" height="18" rx="4" '
      'fill="#e8eaed" stroke="#5f6368" stroke-width="1.5"/><path d="M-9,-9 V9 M9,-9 V9" stroke="#9aa0a6"/></g>')


def compressor_chip(cx, y):
    """Compressor ON/OFF chip, 116 x 20, top at y."""
    A(f'<rect id="st-compressor-bg" x="{cx-58}" y="{y}" width="116" height="20" rx="10" fill="{"#e6f4ea" if on else "#f1f3f4"}"/>')
    A(f'<text id="st-compressor" x="{cx}" y="{y+14}" text-anchor="middle" class="tag" fill="{"#137333" if on else "#5f6368"}">'
      f'{"SPRĘŻARKA ON" if on else "SPRĘŻARKA OFF"}</text>')


def rows(x_lbl, x_val, y, step, items):
    for i, (l, v, vid) in enumerate(items):
        yy = y + i * step
        A(f'<text x="{x_lbl}" y="{yy}" class="lbl">{l}</text>'
          f'<text id="{vid}" x="{x_val}" y="{yy}" text-anchor="end" class="val">{v}</text>')


def compressor_values(x_lbl, x_val, y):
    rows(x_lbl, x_val, y, 22, (("Gorący gaz", f'{V["hot_gas"]:.0f} °C', "val-hot-gas"),
                               ("Prąd", f'{V["current"]:.1f} A', "val-current")))


def heater(transform, kw_x, kw_y, anchor="middle"):
    """Electric aux heaters (3 + 6 kW) in the supply line: heater icon, total power next to it."""
    A(f'<g id="heater"{f' transform="{transform}"' if transform else ""}>'
      '<rect x="648" y="187" width="28" height="26" rx="5" fill="#ffffff" stroke="#5f6368" stroke-width="1.8"/>'
      f'<path id="st-heater-coil" d="M651,200 l3,-7 l3.5,14 l3.5,-14 l3.5,14 l3.5,-14 l3,7" fill="none" '
      f'stroke="{"#ea4335" if aux_kw else "#9aa0a6"}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></g>')
    A(f'<text id="val-aux" x="{kw_x}" y="{kw_y}" text-anchor="{anchor}" class="tag" font-size="12" '
      f'fill="{"#c5221f" if aux_kw else "#80868b"}">{aux_kw} kW</text>')


def temp_label(lbl_id, val_id, x, y, label, t):
    A(f'<text id="{lbl_id}" x="{x}" y="{y}" class="lbl">{label}</text><text id="{val_id}" x="{x+18}" y="{y}" class="val" '
      f'fill="{tcol(t)}">{t:.1f} °C</text>')


def three_way_valve(transform):
    """Inlet on the left, heating (CO) out on the right, hot water (CWU) out at the bottom - before `transform`."""
    A(f'<g id="valve" transform="{transform}">'
      '<path d="M-12,-10 L0,0 L-12,10 Z" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>'
      f'<path id="st-valve-co" d="M12,-10 L0,0 L12,10 Z" fill="{hot if co else "#ffffff"}" stroke="#5f6368" stroke-width="2"/>'
      f'<path id="st-valve-cwu" d="M-10,12 L0,0 L10,12 Z" fill="{"#ffffff" if co else hot}" stroke="#5f6368" stroke-width="2"/></g>')


def valve_chip(x, y, lbl_x, lbl_y, lbl_anchor="middle"):
    """'→ CO' chip, 60 x 20 with its top-left corner at (x, y), and the 'zawór 3D' label."""
    A(f'<rect id="st-valve-bg" x="{x}" y="{y}" width="60" height="20" rx="10" fill="{"#fce8e6" if co else "#e8f0fe"}"/>')
    A(f'<text id="st-valve" x="{x+30}" y="{y+14}" text-anchor="middle" class="tag" fill="{"#c5221f" if co else "#1a73e8"}">'
      f'→ {V["valve"]}</text>')
    A(f'<text x="{lbl_x}" y="{lbl_y}" text-anchor="{lbl_anchor}" class="lbl" font-size="11">zawór 3D</text>')


def floor_coil(box_x, box_y, box_h, x_in, x_turn, x_far, top, bottom, n_rows, from_bottom=False):
    """Underfloor heating (CO): a meander of n_rows runs between `top` and `bottom`, starting at x_in."""
    A(f'<rect x="{box_x}" y="{box_y}" width="104" height="{box_h}" rx="8" fill="#ffffff" stroke="#dadce0"/>')
    A(f'<text x="{box_x+52}" y="{box_y-8}" text-anchor="middle" class="title">CO</text>')
    r = (bottom - top) / (n_rows - 1) / 2
    step = -2 * r if from_bottom else 2 * r
    sweep_far, sweep_near = (0, 1) if from_bottom else (1, 0)
    d = f"M{x_in},{bottom if from_bottom else top} H{x_far}"
    for k in range(n_rows - 1):
        d += (f" a{r:.2f},{r:.2f} 0 0 {sweep_far} 0,{step:.2f} H{x_turn}" if k % 2 == 0 else
              f" a{r:.2f},{r:.2f} 0 0 {sweep_near} 0,{step:.2f} H{x_far}")
    return d


def tank(x, y, h, coil_d, labels):
    """Hot water tank (CWU), 90 wide; coil_d = (back, front) paths of the helical coil."""
    A('<g id="tank">')
    A(f'<rect x="{x}" y="{y}" width="90" height="{h}" rx="32" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')
    A(f'<rect id="fill-tank" x="{x+3}" y="{y+3}" width="84" height="{h-6}" rx="29" fill="{tcol(V["t3"])}" opacity="0.18"/>')
    back, front = coil_d
    A(f'<g id="pipe-cwu-coil" fill="none" stroke="{OFF if co else hot}" stroke-width="3.5" stroke-linecap="round">'
      f'<path d="{back}" stroke-opacity="0.45"/><path d="{front}"/></g>')
    labels()
    A('</g>')


def helix(cx, y0, turns=6, rx=20, ry=6, pitch=11):
    """Helical coil: front half-turns drawn solid, back half-turns lighter, like a spring seen from the side.
    Returns (back, front-turns) paths; the caller adds the inlet / outlet."""
    back = "".join(f"M{cx + rx},{y0 + k * pitch + pitch / 2:.1f} A{rx},{ry} 0 0 0 {cx - rx},{y0 + (k + 1) * pitch:.1f} "
                   for k in range(turns))
    front = "".join(f"M{cx - rx},{y0 + k * pitch} A{rx},{ry} 0 0 0 {cx + rx},{y0 + k * pitch + pitch / 2:.1f} "
                    for k in range(turns))
    return back, front


def room(transform):
    """Room sensor panel with the setpoint buttons; drawn at x=1015..1175, y=250..500 before `transform`."""
    A(f'<g id="room" transform="{transform}">')
    A('<rect x="1015" y="250" width="160" height="250" rx="16" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')
    A('<rect x="1043" y="268" width="109" height="52" rx="7" fill="#202124"/>')
    # MDI home-thermometer-outline: measured room temperature
    A('<g id="ic-room" transform="translate(1048,283) scale(0.92)" fill="#8ab4f8" opacity="0.85">'
      '<title data-i18n="room_temp">Temperatura w pokoju</title>'
      f'<path d="{MDI_HOME_THERMOMETER_OUTLINE}"/></g>')
    A(f'<text id="val-room" x="1106" y="304" text-anchor="middle" font-size="24" font-weight="bold" fill="#8ab4f8">'
      f'{V["room"]:.1f}°</text>')
    # setpoint: MDI thermostat, dial about 17 px, under the value
    A('<g id="ic-setpoint" transform="translate(1086.65,366) scale(0.8625)" fill="#1a73e8">'
      '<title data-i18n="setpoint_hint">Temperatura zadana</title>'
      f'<path d="{MDI_THERMOSTAT}"/></g>')
    A('<g id="btn-sp-down" transform="translate(1052,356)"><circle r="14" fill="#e8f0fe" stroke="#1a73e8" stroke-width="1.5"/>'
      '<path d="M-6,0 H6" stroke="#1a73e8" stroke-width="2.5" stroke-linecap="round"/></g>')
    # x is 3 px right of the buttons' midpoint: the digits are centred, the ° sticks out to the right
    A(f'<text id="val-sp-sensor" x="1100" y="362" text-anchor="middle" class="val" font-size="17">{V["sp_sensor"]:.1f}°</text>')
    A('<g id="btn-sp-up" transform="translate(1142,356)"><circle r="14" fill="#e8f0fe" stroke="#1a73e8" stroke-width="1.5"/>'
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


def legend(x, y, step=4, inactive_below=False):
    A(f'<text x="{x}" y="{y}" class="lbl" font-size="11">Kolor = temperatura</text>')
    for i in range(61):
        A(f'<rect x="{x + i * step:g}" y="{y + 8}" width="{step}" height="9" fill="{tcol(-5 + i)}"/>')
    for t in (-5, 15, 35, 55):
        A(f'<text x="{x + (t + 5) * step:g}" y="{y + 30}" text-anchor="middle" class="lbl" font-size="10">{t}°</text>')
    px, py = (x, y + 48) if inactive_below else (x + 270, y + 13)
    A(f'<path d="M{px},{py} h34" class="pipe" stroke="{OFF}"/><text x="{px + 42}" y="{py + 4}" class="lbl" font-size="11">'
      'nieaktywna gałąź</text>')


# ======================================================================================================================
def landscape():
    W, H = 1030, 600
    header(W, H)
    # heat pump frame first: every pipe is drawn over it and reaches the heat exchangers
    A('<rect x="300" y="110" width="340" height="370" rx="12" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')

    # ---------- outdoor sensor ----------
    outdoor()
    A('<path class="sig" d="M160,48 H390 V110"/>')

    # ---------- ground source ----------
    A('<rect x="10" y="420" width="230" height="170" rx="6" fill="url(#soil)"/>')
    A('<rect x="10" y="414" width="230" height="8" fill="#34a853"/>')
    A('<text x="140" y="448" class="title" style="fill:#ffffff">Dolne źródło</text>')
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
    A(f'<path id="ref-suction" class="ref" stroke="{tcol(V["brine_out"] - 4)}" d="M350,170 V150 H446"/>')
    A(f'<path id="ref-discharge" class="ref" stroke="{tcol(V["hot_gas"])}" d="M494,150 H590 V170"/>')
    A(f'<path id="ref-liquid" class="ref" stroke="{tcol(V["t2"])}" d="M590,310 V350 H486"/>')
    A(f'<path id="ref-expanded" class="ref" stroke="{tcol(V["brine_out"] - 8)}" d="M454,350 H350 V310"/>')
    for x, y, a in ((400, 150, 0), (545, 150, 0), (590, 330, 90), (530, 350, 180), (400, 350, 180), (350, 330, -90)):
        chevron(x, y, a)
    # evaporator / condenser (heat exchangers) with the brine / heating water passing through
    evaporator()
    condenser()
    coil_evaporator()
    coil_condenser()
    A('<text x="350" y="374" text-anchor="middle" class="lbl" font-size="10">parownik</text>')
    A('<text x="590" y="374" text-anchor="middle" class="lbl" font-size="10">skraplacz</text>')
    compressor(470, 150)
    expansion_valve("translate(470,350)")
    A('<text x="470" y="374" text-anchor="middle" class="lbl" font-size="10">zawór rozprężny</text>')
    # compressor status + parameters in the middle of the loop
    compressor_chip(470, 186)
    compressor_values(400, 540, 234)
    # bottom panel: integral + supply target
    A('<rect x="318" y="394" width="304" height="70" rx="8" fill="#f8f9fa" stroke="#dadce0"/>')
    A('<text x="334" y="422" class="lbl">Integral</text>')
    A(f'<text id="val-integral" x="606" y="422" text-anchor="end" class="val">{V["integral"]} °C·min</text>')
    A('<text x="334" y="448" class="lbl">Zasilanie zadana</text>')
    # the target, then the current supply temperature T1 it is compared with
    A(f'<text x="606" y="448" text-anchor="end"><tspan id="val-target" class="val" fill="{tcol(V["target"])}">'
      f'{V["target"]:.1f} °C</tspan><tspan id="val-target-now" class="lbl"> (T1 {V["t1"]:.1f} °C)</tspan></text>')

    # ---------- heating side ----------
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
    heater(None, 662, 179)
    temp_label("lbl-t1", "val-t1", 672, 236, "T1", V["t1"])
    temp_label("lbl-t2", "val-t2", 672, 498, "T2", V["t2"])
    three_way_valve("translate(763,200)")
    valve_chip(752, 150, 782, 142)
    # underfloor heating coil (CO): narrow, tall meander from the top (supply) to the bottom (return), colour T1 -> T2
    d = floor_coil(866, 110, 170, 872, 885, 955, 125, 265, 8) + " H872"
    A(f'<path id="pipe-floor" fill="none" stroke="url(#grad-floor)" stroke-width="5" stroke-linecap="round" '
      f'stroke-linejoin="round" d="{d}"/>')
    # hot water tank (CWU): the coil is fed from the top
    cx, y0, rx = 763, 306, 20
    back, turns = helix(cx, y0)
    front = f"M{cx},{y0 - 26} V{y0 - 8} L{cx - rx},{y0} " + turns + f"M{cx - rx},{y0 + 6 * 11} L{cx},{y0 + 6 * 11 + 8} V440"

    def tank_labels():
        A('<text x="740" y="296" text-anchor="middle" class="title" font-size="12">CWU</text>')
        A('<text id="lbl-t3" x="740" y="400" text-anchor="middle" class="lbl">T3</text>')
        A(f'<text id="val-t3" x="740" y="418" text-anchor="middle" class="val" fill="{tcol(V["t3"])}">{V["t3"]:.0f} °C</text>')
    tank(718, 270, 175, (back, front), tank_labels)

    # ---------- room sensor with setpoint buttons (under the CO coil) ----------
    room("translate(-157,50)")
    A('<path class="sig" d="M1018,420 H1024 V80 H550 V110"/>')
    A('<text x="700" y="74" class="lbl" font-size="10">303/304 – esphome-thermia-room</text>')

    legend(300, 556)
    A('</svg>')


# ======================================================================================================================
def portrait():
    """Narrow layout: outdoor + legend, room sensor | floor coil + hot water tank, heat pump, ground loop."""
    W, H = 420, 1075
    header(W, H, floor_up=True)
    SUP, RET = 180, 260          # supply / return pipes at the condenser (and brine in / out at the evaporator)
    OY = 460                     # top of the heat pump frame
    VY = 305                     # 3-way valve
    DOWN = 412                   # common return down the right edge
    A(f'<rect x="20" y="{OY}" width="380" height="360" rx="12" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>')

    # ---------- top: outdoor, legend ----------
    outdoor()
    legend(212, 26, step=3.2, inactive_below=True)

    # ---------- room sensor (left column) ----------
    room("translate(-1007,-155)")

    # ---------- heating side ----------
    # floor coil above the valve, fed from the bottom left, leaves at the top right
    co_top, co_bottom = 117, 258
    d = floor_coil(174, 105, 165, SUP, 193, 265, co_top, co_bottom, 7, from_bottom=True) + " H284"
    A(f'<path id="pipe-co-supply" class="pipe" stroke="{hot if co else OFF}" d="M{SUP},{VY - 12} V{co_bottom}"/>')
    A(f'<path id="pipe-co-return" class="pipe" stroke="{ret if co else OFF}" d="M284,{co_top} H{DOWN} V300"/>')
    A(f'<path id="pipe-floor" fill="none" stroke="url(#grad-floor)" stroke-width="5" stroke-linecap="round" '
      f'stroke-linejoin="round" d="{d}"/>')
    # hot water tank right of the floor coil: fed and drained at the bottom
    tx, ty, th = 310, 140, 150
    cx, y0, rx = tx + 45, 192, 20
    riser = cx - 25
    back, turns = helix(cx, y0)
    front = (f"M{riser},{ty + th} V{y0 - 6} Q{riser},{y0} {cx - rx},{y0} " + turns +
             f"M{cx - rx},{y0 + 6 * 11} L{cx},{y0 + 6 * 11 + 8} V{ty + th}")
    A(f'<path id="pipe-cwu-supply" class="pipe" stroke="{OFF if co else hot}" d="M{SUP + 12},{VY} H{riser} V{ty + th}"/>')
    A(f'<path id="pipe-cwu-return" class="pipe" stroke="{OFF if co else ret}" d="M{cx},{ty + th} V300 H{DOWN}"/>')

    def tank_labels():
        A(f'<text x="{cx}" y="{ty + 22}" text-anchor="middle" class="title" font-size="12">CWU</text>')
        A(f'<text id="lbl-t3" x="{cx - 18}" y="{ty + 40}" class="lbl">T3</text>')
        A(f'<text id="val-t3" x="{cx - 2}" y="{ty + 40}" class="val" fill="{tcol(V["t3"])}">{V["t3"]:.0f} °C</text>')
    tank(tx, ty, th, (back, front), tank_labels)
    # common return: down the right edge, then left to the condenser
    A(f'<path id="pipe-return" class="pipe" stroke="{ret}" d="M{DOWN},300 V{OY - 10} H{RET} V{OY + 40}"/>')
    A(f'<path id="pipe-supply" class="pipe" stroke="{hot}" d="M{SUP},{OY + 40} V{VY + 12}"/>')
    for x, y, a in ((SUP, 470, -90), (SUP, 272, -90), (350, co_top, 0), (DOWN, 380, 90), (330, OY - 10, 180),
                    (RET, OY + 22, 90)):
        chevron(x, y, a)
    # 3-way valve: inlet from below, heating up, hot water to the right
    three_way_valve(f"translate({SUP},{VY}) rotate(-90)")
    valve_chip(198, 316, 264, 330, "start")
    pump("supply-pump", SUP, 380, True, "Pompa CO", "val-supply-pwm", V["supply_pwm"], side="right")
    heater(f"translate({SUP},420) rotate(90) translate(-662,-200)", SUP - 22, 424, "end")
    temp_label("lbl-t1", "val-t1", SUP + 20, 428, "T1", V["t1"])
    temp_label("lbl-t2", "val-t2", 300, 438, "T2", V["t2"])

    # ---------- heat pump: refrigerant circuit turned upright ----------
    # condenser on top (heating water leaves upwards), evaporator at the bottom (brine comes from below),
    # compressor on the right, expansion valve on the left
    L, R = 70, 370
    yc, ye, ym = OY + 65, OY + 315, OY + 190
    A(f'<text x="34" y="{OY + 24}" class="title">Pompa ciepła</text>')
    A(f'<path id="ref-suction" class="ref" stroke="{tcol(V["brine_out"] - 4)}" d="M290,{ye} H{R} V{ym + 24}"/>')
    A(f'<path id="ref-discharge" class="ref" stroke="{tcol(V["hot_gas"])}" d="M{R},{ym - 24} V{yc} H290"/>')
    A(f'<path id="ref-liquid" class="ref" stroke="{tcol(V["t2"])}" d="M150,{yc} H{L} V{ym - 16}"/>')
    A(f'<path id="ref-expanded" class="ref" stroke="{tcol(V["brine_out"] - 8)}" d="M{L},{ym + 16} V{ye} H150"/>')
    for x, y, a in ((330, ye, 0), (R, ye - 60, -90), (R, yc + 60, -90), (330, yc, 180), (110, yc, 180), (L, yc + 60, 90),
                    (L, ye - 60, 90), (110, ye, 0)):
        chevron(x, y, a)
    A(f'<g transform="translate(220,{ye}) rotate(-90) translate(-350,-240)">')
    evaporator()
    coil_evaporator()
    A('</g>')
    A(f'<g transform="translate(220,{yc}) rotate(-90) translate(-590,-240)">')
    condenser()
    coil_condenser()
    A('</g>')
    A(f'<text x="220" y="{yc + 41}" text-anchor="middle" class="lbl" font-size="10">skraplacz</text>')
    A(f'<text x="220" y="{ye - 33}" text-anchor="middle" class="lbl" font-size="10">parownik</text>')
    compressor(R, ym)
    expansion_valve(f"translate({L},{ym}) rotate(90)")
    A(f'<text x="44" y="{ym}" transform="rotate(-90,44,{ym})" text-anchor="middle" class="lbl" font-size="10">'
      'zawór rozprężny</text>')
    compressor_chip(220, OY + 116)
    compressor_values(100, 336, OY + 160)
    A(f'<rect x="92" y="{OY + 192}" width="250" height="70" rx="8" fill="#f8f9fa" stroke="#dadce0"/>')
    A(f'<text x="104" y="{OY + 212}" class="lbl">Integral</text>')
    A(f'<text id="val-integral" x="330" y="{OY + 212}" text-anchor="end" class="val">{V["integral"]} °C·min</text>')
    A(f'<text x="104" y="{OY + 234}" class="lbl">Zasilanie zadana</text>')
    A(f'<text x="330" y="{OY + 234}" text-anchor="end"><tspan id="val-target" class="val" fill="{tcol(V["target"])}">'
      f'{V["target"]:.1f} °C</tspan></text>')
    # the current supply temperature T1 the target is compared with, on its own line
    A(f'<text x="330" y="{OY + 252}" text-anchor="end"><tspan id="val-target-now" class="lbl">'
      f' (T1 {V["t1"]:.1f} °C)</tspan></text>')

    # ---------- ground loop (bottom) ----------
    gy = OY + 360                # bottom of the heat pump frame
    soil = gy + 120
    A(f'<rect x="10" y="{soil}" width="400" height="{H - soil - 10}" rx="6" fill="url(#soil)"/>')
    A(f'<rect x="10" y="{soil - 6}" width="400" height="8" fill="#34a853"/>')
    A(f'<text x="300" y="{soil + 34}" class="title" style="fill:#ffffff">Dolne źródło</text>')
    bottom = H - 50
    A(f'<path id="pipe-borehole-up" class="pipe" stroke="{bi}" d="M{RET},{bottom} Q220,{bottom + 40} {SUP},{bottom} V{soil}"/>')
    A(f'<path id="pipe-borehole-down" class="pipe" stroke="{bo}" d="M{RET},{soil} V{bottom}"/>')
    A(f'<path id="pipe-brine-in" class="pipe" stroke="{bi}" d="M{SUP},{soil} V{gy - 20}"/>')
    A(f'<path id="pipe-brine-out" class="pipe" stroke="{bo}" d="M{RET},{gy - 20} V{soil}"/>')
    for x, y, a in ((SUP, soil + 50, -90), (RET, soil + 50, 90), (SUP, gy + 92, -90), (RET, gy + 20, 90)):
        chevron(x, y, a)
    pump("brine-pump", SUP, gy + 40, True, "Pompa DŹ", "val-brine-pwm", V["brine_pwm"], side="left")
    A(f'<text x="{SUP - 26}" y="{gy + 88}" text-anchor="end" class="lbl">DŹ wejście</text>')
    A(f'<text id="val-brine-in" x="{SUP - 26}" y="{gy + 104}" text-anchor="end" class="val" fill="{bi}">{V["brine_in"]:.1f} °C</text>')
    A(f'<text x="{RET + 20}" y="{gy + 36}" class="lbl">DŹ wyjście</text>')
    A(f'<text id="val-brine-out" x="{RET + 20}" y="{gy + 52}" class="val" fill="{bo}">{V["brine_out"]:.1f} °C</text>')
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


def _tag(m):
    attrs, text = m.group(1), m.group(2)
    key = I18N_KEYS.get(text)
    if key:
        attrs += f' data-i18n="{key}"'
    if 'class="val"' in attrs or 'id="val-' in attrs:
        attrs = re.sub(r' fill="(#[0-9a-f]{6})"', r' style="fill:\1"', attrs)
    return f"<text{attrs}>{text}</text>"


def render(layout):
    o.clear()
    layout()
    svg = "\n".join(o)
    svg = re.sub(r"<text([^>]*)>([^<]*)</text>", _tag, svg)
    svg = re.sub(r'<rect (width="\d+" height="\d+" fill="#f1f3f4")/>', r'<rect class="bg" \1/>', svg, count=1)
    svg = re.sub(r'<rect ([^>]*fill="#ffffff"[^>]*)/>', lambda m: f'<rect class="box" {m.group(1)}/>', svg)
    svg = svg.replace('fill="#f8f9fa"', 'class="panel" fill="#f8f9fa"')
    return svg


if __name__ == "__main__":
    open(sys.argv[1], "w").write(render(landscape))
    if len(sys.argv) > 2:
        open(sys.argv[2], "w").write(render(portrait))
