#!/usr/bin/env python3
"""Build dist/thermia-heatpump-card.js: regenerate the SVG and embed it into src/card.js.
    python3 build.py [version]
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
version = sys.argv[1] if len(sys.argv) > 1 else (ROOT / "VERSION").read_text().strip()

subprocess.run([sys.executable, str(ROOT / "src" / "schematic.py"), str(ROOT / "src" / "heatpump.svg")], check=True)
svg = (ROOT / "src" / "heatpump.svg").read_text()
svg = svg.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")
js = (ROOT / "src" / "card.js").read_text().replace("__SVG__", svg).replace("__VERSION__", version)
out = ROOT / "dist" / "thermia-heatpump-card.js"
out.write_text(js)
print(f"{out.relative_to(ROOT)}: {len(js)} bytes, version {version}")
