#!/usr/bin/env python3
"""Build dist/thermia-heatpump-card.js: regenerate the SVG and embed it into src/card.js.
    python3 build.py [version]
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
version = sys.argv[1] if len(sys.argv) > 1 else (ROOT / "VERSION").read_text().strip()

subprocess.run([sys.executable, str(ROOT / "src" / "schematic.py"), str(ROOT / "src" / "heatpump.svg"),
                str(ROOT / "src" / "heatpump-portrait.svg")], check=True)


def embed(name):
    svg = (ROOT / "src" / name).read_text()
    return svg.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


js = (ROOT / "src" / "card.js").read_text()
js = js.replace("__SVG_PORTRAIT__", embed("heatpump-portrait.svg")).replace("__SVG__", embed("heatpump.svg"))
js = js.replace("__VERSION__", version)
out = ROOT / "dist" / "thermia-heatpump-card.js"
out.write_text(js)
print(f"{out.relative_to(ROOT)}: {len(js)} bytes, version {version}")
