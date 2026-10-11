/*
 * Thermia heat pump card for Home Assistant.
 * Draws the heat pump (ground loop, refrigerant circuit, heating/DHW side, room sensor) and colours pipes by
 * temperature. Source: src/card.js + src/heatpump.svg, built into dist/ by build.py.
 */

const CARD_VERSION = "0.1.5";
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1030" height="600" viewBox="0 0 1030 600" font-family="Helvetica, Arial, sans-serif" font-size="13">
<defs>
  <style>
    .pipe{fill:none;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
    .ref{fill:none;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
    .lbl{fill:#5f6368;font-size:12px}
    .val{fill:#202124;font-size:14px;font-weight:bold}
    .title{fill:#202124;font-size:14px;font-weight:bold}
    .tag{font-size:11px;font-weight:bold}
    .sig{fill:none;stroke:#9aa0a6;stroke-width:1.5;stroke-dasharray:5 4}
    .spin{transform-box:fill-box;transform-origin:center;animation:th-spin 2s steps(60) infinite}
    .impeller.spin{animation:th-spin 1.6s steps(48) infinite}
    @keyframes th-spin{to{transform:rotate(360deg)}}
  </style>
  <pattern id="soil" width="16" height="16" patternUnits="userSpaceOnUse">
    <rect width="16" height="16" fill="#a47551"/><circle cx="4" cy="5" r="1.4" fill="#8a5f3e"/>
    <circle cx="12" cy="11" r="1.1" fill="#8a5f3e"/></pattern>
  <linearGradient id="grad-floor" x1="0" y1="0" x2="0" y2="1">
    <stop id="grad-floor-in" offset="0" stop-color="#ef9f0c"/>
    <stop id="grad-floor-out" offset="1" stop-color="#d6b511"/>
  </linearGradient>
</defs>
<rect class="bg" width="1030" height="600" fill="#f1f3f4"/>
<rect class="box" x="300" y="110" width="340" height="370" rx="12" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>
<g id="outdoor">
<circle cx="40" cy="38" r="14" fill="#fbbc04"/>
<path d="M30,62 a12,12 0 0 1 7,-21 a16,16 0 0 1 29,4 a10,10 0 0 1 2,20 h-34 a9,9 0 0 1 -4,-3 z" fill="#ffffff" stroke="#9aa0a6" stroke-width="1.5"/>
<text x="84" y="34" class="lbl" data-i18n="outdoor">Zewnętrzna</text>
<text id="val-outdoor" x="84" y="56" font-size="20" font-weight="bold" style="fill:#1f74e6">-3 °C</text>
</g>
<path class="sig" d="M160,48 H390 V110"/>
<rect x="10" y="420" width="230" height="170" rx="6" fill="url(#soil)"/>
<rect x="10" y="414" width="230" height="8" fill="#34a853"/>
<text x="140" y="448" class="title" style="fill:#ffffff" data-i18n="ground">Dolne źródło</text>
<path id="pipe-borehole-up" class="pipe" stroke="#0f9edb" d="M110,560 Q90,580 70,560 V420"/>
<path id="pipe-borehole-down" class="pipe" stroke="#1a81e3" d="M110,420 V560"/>
<path id="pipe-brine-in" class="pipe" stroke="#0f9edb" d="M70,420 V200 H325"/>
<path id="pipe-brine-out" class="pipe" stroke="#1a81e3" d="M325,280 H110 V420"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(70,500) rotate(-90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(110,500) rotate(90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(70,320) rotate(-90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(260,200) rotate(0)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(240,280) rotate(180)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(110,350) rotate(90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<g id="brine-pump" transform="translate(175,200)"><circle r="19" fill="#ffffff" stroke="#5f6368" stroke-width="2"/><g id="st-brine-pump" class="impeller spin" fill="#1a73e8"><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(0)"/><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(90)"/><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(180)"/><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(270)"/><circle r="3" fill="#ffffff" stroke="#5f6368"/></g></g>
<text x="175" y="160" text-anchor="middle" class="lbl" data-i18n="brine_pump">Pompa DŹ</text>
<text id="val-brine-pwm" x="175" y="176" text-anchor="middle" class="val">65 %</text>
<text x="128" y="236" class="lbl" data-i18n="brine_in">DŹ wejście</text>
<text id="val-brine-in" x="128" y="252" class="val" style="fill:#0f9edb">2.1 °C</text>
<text x="128" y="310" class="lbl" data-i18n="brine_out">DŹ wyjście</text>
<text id="val-brine-out" x="128" y="326" class="val" style="fill:#1a81e3">-1.4 °C</text>
<text x="314" y="134" class="title" data-i18n="heat_pump">Pompa ciepła</text>
<path id="ref-suction" class="ref" stroke="#2563eb" d="M350,170 V150 H446"/>
<path id="ref-discharge" class="ref" stroke="#dc2626" d="M494,150 H590 V170"/>
<path id="ref-liquid" class="ref" stroke="#d6b511" d="M590,310 V350 H486"/>
<path id="ref-expanded" class="ref" stroke="#2563eb" d="M454,350 H350 V310"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(400,150) rotate(0)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(545,150) rotate(0)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(590,330) rotate(90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(530,350) rotate(180)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(400,350) rotate(180)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(350,330) rotate(-90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<rect id="evaporator" x="325" y="170" width="50" height="140" rx="10" fill="#0f9edb" fill-opacity="0.25" stroke="#5f6368" stroke-width="1.5"/>
<rect id="condenser" x="565" y="170" width="50" height="140" rx="10" fill="#ef9f0c" fill-opacity="0.25" stroke="#5f6368" stroke-width="1.5"/>
<path id="coil-evaporator" d="M325,200 H358 a13.333333333333334,13.333333333333334 0 0 1 0,26.67 H345 a13.333333333333334,13.333333333333334 0 0 0 0,26.67 H358 a13.333333333333334,13.333333333333334 0 0 1 0,26.67 H325" fill="none" stroke="#0f9edb" stroke-width="4" stroke-linejoin="round"/>
<path id="coil-condenser" d="M615,200 H582 a13.333333333333334,13.333333333333334 0 0 0 0,26.67 H595 a13.333333333333334,13.333333333333334 0 0 1 0,26.67 H582 a13.333333333333334,13.333333333333334 0 0 0 0,26.67 H615" fill="none" stroke="#ef9f0c" stroke-width="4" stroke-linejoin="round"/>
<text x="350" y="374" text-anchor="middle" class="lbl" font-size="10" data-i18n="evaporator">parownik</text>
<text x="590" y="374" text-anchor="middle" class="lbl" font-size="10" data-i18n="condenser">skraplacz</text>
<g id="compressor" transform="translate(470,150)"><circle id="st-compressor-disc" r="24" fill="#7cb342" stroke="#ffffff" stroke-width="3"/><g id="compressor-fan" class="fan spin" fill="#ffffff"><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(0)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(45)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(90)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(135)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(180)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(225)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(270)"/><path d="M0,0 C3,-6 9,-12 4,-18 C0,-12 -3,-6 0,0 Z" transform="rotate(315)"/><circle r="3.5" fill="#ffffff"/></g></g>
<g id="expansion-valve" transform="translate(470,350)"><rect x="-16" y="-9" width="32" height="18" rx="4" fill="#e8eaed" stroke="#5f6368" stroke-width="1.5"/><path d="M-9,-9 V9 M9,-9 V9" stroke="#9aa0a6"/></g>
<text x="470" y="374" text-anchor="middle" class="lbl" font-size="10" data-i18n="expansion_valve">zawór rozprężny</text>
<rect id="st-compressor-bg" x="412" y="186" width="116" height="20" rx="10" fill="#e6f4ea"/>
<text id="st-compressor" x="470" y="200" text-anchor="middle" class="tag" fill="#137333">SPRĘŻARKA ON</text>
<text x="400" y="234" class="lbl" data-i18n="hot_gas">Gorący gaz</text><text id="val-hot-gas" x="540" y="234" text-anchor="end" class="val">72 °C</text>
<text x="400" y="256" class="lbl" data-i18n="current">Prąd</text><text id="val-current" x="540" y="256" text-anchor="end" class="val">6.2 A</text>
<rect x="318" y="394" width="304" height="70" rx="8" class="panel" fill="#f8f9fa" stroke="#dadce0"/>
<text x="334" y="422" class="lbl" data-i18n="integral">Integral</text>
<text id="val-integral" x="606" y="422" text-anchor="end" class="val">-120 °C·min</text>
<text x="334" y="448" class="lbl" data-i18n="supply_target">Zasilanie zadana</text>
<text id="val-target" x="606" y="448" text-anchor="end" class="val" style="fill:#f0990e">39.0 °C</text>
<path id="pipe-supply" class="pipe" stroke="#ef9f0c" d="M615,200 H750"/>
<path id="pipe-co-supply" class="pipe" stroke="#ef9f0c" d="M776,200 H835 V125 H872"/>
<path id="pipe-cwu-supply" class="pipe" stroke="#c4c7cc" d="M763,213 V275"/>
<path id="pipe-co-return" class="pipe" stroke="#d6b511" d="M872,265 H845 V470"/>
<path id="pipe-cwu-return" class="pipe" stroke="#c4c7cc" d="M763,440 V470"/>
<path id="pipe-return" class="pipe" stroke="#d6b511" d="M845,470 H660 V280 H615"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(805,200) rotate(0)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(845,400) rotate(90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(720,470) rotate(180)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M-5,-5 L5,0 L-5,5" transform="translate(660,360) rotate(-90)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
<g id="supply-pump" transform="translate(707,200)"><circle r="19" fill="#ffffff" stroke="#5f6368" stroke-width="2"/><g id="st-supply-pump" class="impeller spin" fill="#1a73e8"><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(0)"/><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(90)"/><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(180)"/><path d="M0,0 C6,-2 10,-8 9,-14 C4,-12 1,-6 0,0 Z" transform="rotate(270)"/><circle r="3" fill="#ffffff" stroke="#5f6368"/></g></g>
<text x="707" y="160" text-anchor="middle" class="lbl" data-i18n="supply_pump">Pompa CO</text>
<text id="val-supply-pwm" x="707" y="176" text-anchor="middle" class="val">40 %</text>
<g id="heater"><rect class="box" x="648" y="187" width="28" height="26" rx="5" fill="#ffffff" stroke="#5f6368" stroke-width="1.8"/><path id="st-heater-coil" d="M651,200 l3,-7 l3.5,14 l3.5,-14 l3.5,14 l3.5,-14 l3,7" fill="none" stroke="#9aa0a6" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></g>
<text id="val-aux" x="662" y="179" text-anchor="middle" class="tag" font-size="12" style="fill:#80868b">0 kW</text>
<text id="lbl-t1" x="672" y="236" class="lbl">T1</text><text id="val-t1" x="690" y="236" class="val" style="fill:#ef9f0c">38.2 °C</text>
<text id="lbl-t2" x="672" y="498" class="lbl">T2</text><text id="val-t2" x="690" y="498" class="val" style="fill:#d6b511">33.5 °C</text>
<g id="valve" transform="translate(763,200)"><path d="M-12,-10 L0,0 L-12,10 Z" fill="#ffffff" stroke="#5f6368" stroke-width="2"/><path id="st-valve-co" d="M12,-10 L0,0 L12,10 Z" fill="#ef9f0c" stroke="#5f6368" stroke-width="2"/><path id="st-valve-cwu" d="M-10,12 L0,0 L10,12 Z" fill="#ffffff" stroke="#5f6368" stroke-width="2"/></g>
<rect id="st-valve-bg" x="752" y="150" width="60" height="20" rx="10" fill="#fce8e6"/>
<text id="st-valve" x="782" y="164" text-anchor="middle" class="tag" fill="#c5221f">→ CO</text>
<text x="782" y="142" text-anchor="middle" class="lbl" font-size="11" data-i18n="valve">zawór 3D</text>
<rect class="box" x="866" y="110" width="104" height="170" rx="8" fill="#ffffff" stroke="#dadce0"/>
<text x="918" y="102" text-anchor="middle" class="title" data-i18n="heating">CO</text>
<path id="pipe-floor" fill="none" stroke="url(#grad-floor)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d="M872,125 H955 a10.00,10.00 0 0 1 0,20.00 H885 a10.00,10.00 0 0 0 0,20.00 H955 a10.00,10.00 0 0 1 0,20.00 H885 a10.00,10.00 0 0 0 0,20.00 H955 a10.00,10.00 0 0 1 0,20.00 H885 a10.00,10.00 0 0 0 0,20.00 H955 a10.00,10.00 0 0 1 0,20.00 H885 H872"/>
<g id="tank">
<rect class="box" x="718" y="270" width="90" height="175" rx="32" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>
<rect id="fill-tank" x="721" y="273" width="84" height="169" rx="29" fill="#f05c1b" opacity="0.18"/>
<g id="pipe-cwu-coil" fill="none" stroke="#c4c7cc" stroke-width="3.5" stroke-linecap="round"><path d="M783,311.5 A20,6 0 0 0 743,317.0 M783,322.5 A20,6 0 0 0 743,328.0 M783,333.5 A20,6 0 0 0 743,339.0 M783,344.5 A20,6 0 0 0 743,350.0 M783,355.5 A20,6 0 0 0 743,361.0 M783,366.5 A20,6 0 0 0 743,372.0 " stroke-opacity="0.45"/><path d="M763,280 V298 L743,306 M743,306 A20,6 0 0 0 783,311.5 M743,317 A20,6 0 0 0 783,322.5 M743,328 A20,6 0 0 0 783,333.5 M743,339 A20,6 0 0 0 783,344.5 M743,350 A20,6 0 0 0 783,355.5 M743,361 A20,6 0 0 0 783,366.5 M743,372 L763,380 V440"/></g>
<text x="740" y="296" text-anchor="middle" class="title" font-size="12" data-i18n="hot_water">CWU</text>
<text id="lbl-t3" x="740" y="400" text-anchor="middle" class="lbl">T3</text>
<text id="val-t3" x="740" y="418" text-anchor="middle" class="val" style="fill:#f05c1b">48 °C</text>
</g>
<g id="room" transform="translate(-157,50)">
<rect class="box" x="1015" y="250" width="160" height="250" rx="16" fill="#ffffff" stroke="#5f6368" stroke-width="2"/>
<rect x="1043" y="268" width="109" height="52" rx="7" fill="#202124"/>
<text id="val-room" x="1097" y="304" text-anchor="middle" font-size="24" font-weight="bold" style="fill:#8ab4f8">21.3°</text>
<text x="1097" y="340" text-anchor="middle" class="lbl" data-i18n="setpoint">zadana</text>
<g id="btn-sp-down" transform="translate(1052,364)"><circle r="14" fill="#e8f0fe" stroke="#1a73e8" stroke-width="1.5"/><path d="M-6,0 H6" stroke="#1a73e8" stroke-width="2.5" stroke-linecap="round"/></g>
<text id="val-sp-sensor" x="1097" y="370" text-anchor="middle" class="val" font-size="17">21.5°</text>
<g id="btn-sp-up" transform="translate(1142,364)"><circle r="14" fill="#e8f0fe" stroke="#1a73e8" stroke-width="1.5"/><path d="M-6,0 H6 M0,-6 V6" stroke="#1a73e8" stroke-width="2.5" stroke-linecap="round"/></g>
<text x="1027" y="404" class="lbl" font-size="11" data-i18n="active_target">Aktywna (r03)</text><text id="val-sp-active" x="1165" y="404" text-anchor="end" class="val" font-size="12">21.5 °C</text>
<text x="1027" y="426" class="lbl" font-size="11" data-i18n="fallback_target">Awaryjna (r32)</text><text id="val-sp-fallback" x="1165" y="426" text-anchor="end" class="val" font-size="12">20.0 °C</text>
<text x="1027" y="448" class="lbl" font-size="11" data-i18n="room_factor">Waga temp. pok.</text><text id="val-room-factor" x="1165" y="448" text-anchor="end" class="val" font-size="12">3</text>
<rect id="st-room-alarm" x="1045" y="466" width="104" height="20" rx="10" fill="#e6f4ea"/>
<text id="st-room-alarm-text" x="1097" y="480" text-anchor="middle" class="tag" fill="#137333">czujnik OK</text>
</g>
<path class="sig" d="M1018,420 H1024 V80 H550 V110"/>
<text x="700" y="74" class="lbl" font-size="10">303/304 – esphome-thermia-room</text>
<text x="300" y="556" class="lbl" font-size="11" data-i18n="legend">Kolor = temperatura</text>
<rect x="300" y="564" width="4" height="9" fill="#2563eb"/>
<rect x="304" y="564" width="4" height="9" fill="#226be9"/>
<rect x="308" y="564" width="4" height="9" fill="#1f74e6"/>
<rect x="312" y="564" width="4" height="9" fill="#1c7ce4"/>
<rect x="316" y="564" width="4" height="9" fill="#1984e2"/>
<rect x="320" y="564" width="4" height="9" fill="#168ce0"/>
<rect x="324" y="564" width="4" height="9" fill="#1295dd"/>
<rect x="328" y="564" width="4" height="9" fill="#0f9ddb"/>
<rect x="332" y="564" width="4" height="9" fill="#0ca5d9"/>
<rect x="336" y="564" width="4" height="9" fill="#09aed6"/>
<rect x="340" y="564" width="4" height="9" fill="#06b6d4"/>
<rect x="344" y="564" width="4" height="9" fill="#08b7cc"/>
<rect x="348" y="564" width="4" height="9" fill="#0ab8c4"/>
<rect x="352" y="564" width="4" height="9" fill="#0cb9bc"/>
<rect x="356" y="564" width="4" height="9" fill="#0dbab5"/>
<rect x="360" y="564" width="4" height="9" fill="#0fbbad"/>
<rect x="364" y="564" width="4" height="9" fill="#11bca5"/>
<rect x="368" y="564" width="4" height="9" fill="#13bd9d"/>
<rect x="372" y="564" width="4" height="9" fill="#15be95"/>
<rect x="376" y="564" width="4" height="9" fill="#17bf8d"/>
<rect x="380" y="564" width="4" height="9" fill="#19c085"/>
<rect x="384" y="564" width="4" height="9" fill="#1bc17d"/>
<rect x="388" y="564" width="4" height="9" fill="#1cc276"/>
<rect x="392" y="564" width="4" height="9" fill="#1ec36e"/>
<rect x="396" y="564" width="4" height="9" fill="#20c466"/>
<rect x="400" y="564" width="4" height="9" fill="#22c55e"/>
<rect x="404" y="564" width="4" height="9" fill="#2fc458"/>
<rect x="408" y="564" width="4" height="9" fill="#3dc353"/>
<rect x="412" y="564" width="4" height="9" fill="#4ac14d"/>
<rect x="416" y="564" width="4" height="9" fill="#57c047"/>
<rect x="420" y="564" width="4" height="9" fill="#65bf41"/>
<rect x="424" y="564" width="4" height="9" fill="#72be3c"/>
<rect x="428" y="564" width="4" height="9" fill="#7fbd36"/>
<rect x="432" y="564" width="4" height="9" fill="#8dbb30"/>
<rect x="436" y="564" width="4" height="9" fill="#9aba2a"/>
<rect x="440" y="564" width="4" height="9" fill="#a7b925"/>
<rect x="444" y="564" width="4" height="9" fill="#b5b81f"/>
<rect x="448" y="564" width="4" height="9" fill="#c2b719"/>
<rect x="452" y="564" width="4" height="9" fill="#cfb513"/>
<rect x="456" y="564" width="4" height="9" fill="#ddb40e"/>
<rect x="460" y="564" width="4" height="9" fill="#eab308"/>
<rect x="464" y="564" width="4" height="9" fill="#ecad09"/>
<rect x="468" y="564" width="4" height="9" fill="#eda60b"/>
<rect x="472" y="564" width="4" height="9" fill="#eea00c"/>
<rect x="476" y="564" width="4" height="9" fill="#f0990e"/>
<rect x="480" y="564" width="4" height="9" fill="#f2930f"/>
<rect x="484" y="564" width="4" height="9" fill="#f38d10"/>
<rect x="488" y="564" width="4" height="9" fill="#f48612"/>
<rect x="492" y="564" width="4" height="9" fill="#f68013"/>
<rect x="496" y="564" width="4" height="9" fill="#f87915"/>
<rect x="500" y="564" width="4" height="9" fill="#f97316"/>
<rect x="504" y="564" width="4" height="9" fill="#f66b18"/>
<rect x="508" y="564" width="4" height="9" fill="#f36419"/>
<rect x="512" y="564" width="4" height="9" fill="#f05c1b"/>
<rect x="516" y="564" width="4" height="9" fill="#ed541c"/>
<rect x="520" y="564" width="4" height="9" fill="#ea4c1e"/>
<rect x="524" y="564" width="4" height="9" fill="#e84520"/>
<rect x="528" y="564" width="4" height="9" fill="#e53d21"/>
<rect x="532" y="564" width="4" height="9" fill="#e23523"/>
<rect x="536" y="564" width="4" height="9" fill="#df2e24"/>
<rect x="540" y="564" width="4" height="9" fill="#dc2626"/>
<text x="300" y="586" text-anchor="middle" class="lbl" font-size="10">-5°</text>
<text x="380" y="586" text-anchor="middle" class="lbl" font-size="10">15°</text>
<text x="460" y="586" text-anchor="middle" class="lbl" font-size="10">35°</text>
<text x="540" y="586" text-anchor="middle" class="lbl" font-size="10">55°</text>
<path d="M570,569 h34" class="pipe" stroke="#c4c7cc"/><text x="612" y="573" class="lbl" font-size="11" data-i18n="inactive">nieaktywna gałąź</text>
</svg>`;

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
    title: "Tytuł", language: "Język", entities: "Encje", ground: "Dolne źródło", heat_pump: "Pompa ciepła",
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
    title: "Title", language: "Language", entities: "Entities", ground: "Ground loop", heat_pump: "Heat pump",
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

function editorLang() {
  const ha = document.querySelector("home-assistant");
  const lang = (ha && ha.hass && ha.hass.language) || "en";
  return lang.startsWith("pl") ? "pl" : "en";
}

function entitySelector(key) {
  if (BINARY_KEYS.includes(key)) return { entity: { domain: ["binary_sensor", "switch", "input_boolean"] } };
  if (key === "setpoint") return { entity: { domain: ["number", "input_number"] } };
  return { entity: { domain: ["sensor", "number", "input_number"] } };
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
  supply_target: ["i18n:supply_target", "val-target"],
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
  static getConfigForm() {
    return {
      schema: [
        {
          type: "grid",
          name: "",
          schema: [
            { name: "title", selector: { text: {} } },
            {
              name: "language",
              selector: {
                select: {
                  mode: "dropdown",
                  options: [{ value: "pl", label: "Polski" }, { value: "en", label: "English" }],
                },
              },
            },
          ],
        },
        {
          type: "expandable",
          name: "entities",
          title: EDITOR_LABELS[editorLang()].entities,
          expanded: true,
          schema: EDITOR_GROUPS.map(([group, keys]) => ({
            type: "expandable",
            flatten: true,
            name: group,
            title: EDITOR_LABELS[editorLang()][group],
            schema: keys.map((key) => ({ name: key, selector: entitySelector(key) })),
          })),
        },
      ],
      computeLabel: (schema) => EDITOR_LABELS[editorLang()][schema.name] || schema.name,
    };
  }

  static getStubConfig() {
    return { entities: { outdoor: "sensor.outdoor_temperature", supply: "sensor.supply_t1", return: "sensor.return_t2" } };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (config.entities !== undefined && (typeof config.entities !== "object" || config.entities === null))
      throw new Error("entities: must be a map of key: entity_id");
    config = { ...config, entities: { ...(config.entities || {}) } };
    const unknown = Object.keys(config.entities).filter((k) => !ENTITY_KEYS.includes(k));
    if (unknown.length) throw new Error(`Unknown entity keys: ${unknown.join(", ")}`);
    if (config.language && !I18N[config.language]) throw new Error("language: must be pl or en");
    this._config = config;
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
      const entityKey = this._config.entities[key] ? key : CLICK_FALLBACK[key];
      if (!entityKey || !this._config.entities[entityKey]) continue;
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
      rect.addEventListener("click", () => this._moreInfo(entityKey));
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
    const id = this._config.entities[key];
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
    const states = Object.values(this._config.entities).map((id) => this._hass.states[id]);
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

  _moreInfo(key) {
    const entityId = this._config.entities[key];
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}

customElements.define("thermia-heatpump-card", ThermiaHeatpumpCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "thermia-heatpump-card",
  name: "Thermia heat pump",
  description: "Heat pump schematic with live temperatures (esphome-thermia / esphome-thermia-room).",
  preview: false,
});
console.info(`%c THERMIA-HEATPUMP-CARD %c ${CARD_VERSION} `, "background:#1a73e8;color:#fff", "");
