#!/usr/bin/env python3
"""
🩺 DOCTOR FIX - Autonomous Repository Clinic & GitHub Automator
Created for Pedro Belentani (@belentani7)
"""

import os
import sys
import argparse
from pathlib import Path

VERSION = "2.1.0-BELENTANI"

PAGES_WORKFLOW = """name: 🚀 Doctor Fix - Auto Deploy to GitHub Pages

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: "."
      - id: deployment
        uses: actions/deploy-pages@v4
"""

SECURITY_MD = """# 🛡️ Política de Seguridad

Este repositorio está protegido bajo las directrices del motor **Phalanx Shield v5.0.2** y **Doctor Fix**.

Reporte confidencial de vulnerabilidades: **belentani7pedro@gmail.com**
Autor: Pedro Belentani (@belentani7)
"""

PHALANX_WORKFLOW = """name: 🛡️ Phalanx Shield CI/CD Hardening

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  phalanx:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: |
          if [ -f "phalanx_shield.py" ]; then
            python3 phalanx_shield.py --path . --fix
            python3 phalanx_shield.py --verify
          else
            echo "Phalanx Shield ready"
          fi
"""

def diagnose(repo_path: Path):
    print(f"\n🩺 [DOCTOR FIX] Diagnosticando repositorio en: {repo_path.resolve()}")
    score = 100
    issues = []
    
    # 1. Check README
    readme = list(repo_path.glob("README*"))
    if not readme:
        score -= 20
        issues.append("❌ Falta archivo README.md")
    else:
        print("  ✓ README.md presente")
        
    # 2. Check Workflows
    wf_dir = repo_path / ".github" / "workflows"
    if not wf_dir.exists() or not list(wf_dir.glob("*.yml")):
        score -= 25
        issues.append("❌ Sin workflows de GitHub Actions (.github/workflows)")
    else:
        print("  ✓ GitHub Actions workflows detectados")
        
    # 3. Check SECURITY.md
    sec_file = repo_path / "SECURITY.md"
    if not sec_file.exists():
        score -= 15
        issues.append("❌ Falta política de seguridad SECURITY.md")
    else:
        print("  ✓ SECURITY.md presente")
        
    # 4. Check gitignore
    gi_file = repo_path / ".gitignore"
    if not gi_file.exists():
        score -= 15
        issues.append("❌ Falta .gitignore estándar")
    else:
        print("  ✓ .gitignore presente")

    print(f"\n📊 Puntuación de Salud Doctor Fix: {max(10, score)}/100")
    if issues:
        print("⚠️ Hallazgos a reparar:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("✅ ¡Repositorio en estado óptimo!")
    return score, issues

def fix_all(repo_path: Path):
    print(f"\n🩺 [DOCTOR FIX] Aplicando reparaciones automáticas en: {repo_path.resolve()}...")
    
    # 1. Create .github/workflows
    wf_dir = repo_path / ".github" / "workflows"
    wf_dir.mkdir(parents=True, exist_ok=True)
    
    pages_file = wf_dir / "deploy-pages.yml"
    if not pages_file.exists():
        pages_file.write_text(PAGES_WORKFLOW, encoding="utf-8")
        print(f"  ✓ Creado: {pages_file}")
        
    phalanx_file = wf_dir / "phalanx_shield.yml"
    if not phalanx_file.exists():
        phalanx_file.write_text(PHALANX_WORKFLOW, encoding="utf-8")
        print(f"  ✓ Creado: {phalanx_file}")
        
    # 2. Create SECURITY.md
    sec_file = repo_path / "SECURITY.md"
    if not sec_file.exists():
        sec_file.write_text(SECURITY_MD, encoding="utf-8")
        print(f"  ✓ Creado: {sec_file}")
        
    # 3. Create .gitignore if missing
    gi_file = repo_path / ".gitignore"
    if not gi_file.exists():
        gi_file.write_text("node_modules/\ndist/\n.DS_Store\n*.log\n__pycache__/\n.env\n", encoding="utf-8")
        print(f"  ✓ Creado: {gi_file}")

    print("\n✅ Todas las reparaciones de Doctor Fix han sido aplicadas con éxito.")
    print("👉 Ejecuta: git add . && git commit -m '🩺 Doctor Fix applied' && git push")

def main():
    parser = argparse.ArgumentParser(description="🩺 Doctor Fix - GitHub Repository Clinic")
    parser.add_argument("--path", default=".", help="Ruta del repositorio local")
    parser.add_argument("--fix", action="store_true", help="Aplicar correcciones automáticamente")
    args = parser.parse_args()
    
    repo_path = Path(args.path)
    score, issues = diagnose(repo_path)
    if args.fix:
        fix_all(repo_path)

if __name__ == "__main__":
    main()
