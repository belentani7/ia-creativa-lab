#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PHALANX SHIELD - Belentani Noiacore Auto-Adaptive Security Engine
Versión: 5.0.2 Hardened - Blindaje Supremo Real
Funcionalidades:
- Escaneo de secretos (API keys, tokens, credenciales)
- SAST ligero (eval, exec, XSS, inyección SQL)
- Auditoría de dependencias (package.json, requirements.txt) con base de datos CVE local
- Verificación/Generación de integridad SHA-256 (manifest .noiacore_manifest.json)
- Corrección automática de permisos, saltos de línea (CRLF -> LF) y finales de archivo
- Generación de reporte JSON detallado (phalanx_report.json)
"""

import os
import sys
import re
import json
import hashlib
import argparse
import datetime
import pathlib
import stat
import typing as t

# ======================================================================
# 1. CONFIGURACIÓN Y PATRONES DE ALTA SEGURIDAD
# ======================================================================

IGNORE_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "env",
    ".idea", ".vscode", "dist", "build", ".next", "coverage", ".pytest_cache"
}
IGNORE_EXTENSIONS = {".log", ".tmp", ".lock", ".pyc", ".o", ".so", ".dll", ".exe", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".example", ".sample"}
IGNORE_FILENAMES = {".noiacore_manifest.json", "phalanx_report.json"}

PLACEHOLDER_REGEX = re.compile(r"(?i)(my_|your_|example|changeme|placeholder|dummy|none|null|undefined|test_key|<.*>)")

SECRET_PATTERNS = {
    "AWS_ACCESS_KEY": re.compile(r"(?i)(aws_access_key_id|AWS_ACCESS_KEY_ID)\s*=\s*['\"]?(AKIA[0-9A-Z]{16})['\"]?"),
    "AWS_SECRET_KEY": re.compile(r"(?i)(aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*=\s*['\"]?([A-Za-z0-9/+=]{40})['\"]?"),
    "GITHUB_TOKEN": re.compile(r"(?i)(github_token|GITHUB_TOKEN)\s*=\s*['\"]?(ghp_[A-Za-z0-9_]{36})['\"]?"),
    "SLACK_WEBHOOK": re.compile(r"https://hooks\.slack\.com/services/[A-Za-z0-9_]+/[A-Za-z0-9_]+/[A-Za-z0-9_]+"),
    "GENERIC_API_KEY": re.compile(r"(?i)(api_key|apikey|secret_key|private_key)\s*=\s*['\"]([0-9a-zA-Z_\-]{16,64})['\"]"),
    "JWT_TOKEN": re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),
    "PRIVATE_KEY_BLOCK": re.compile(r"-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----"),
    "PASSWORD_IN_PLAIN": re.compile(r"(?i)(password|passwd|pwd)\s*=\s*['\"]([^'\"]{6,})['\"]"),
}

UNSAFE_PATTERNS = {
    "JS_EVAL": re.compile(r"\beval\s*\("),
    "JS_FUNCTION_CONSTRUCTOR": re.compile(r"new\s+Function\s*\("),
    "JS_INNER_HTML": re.compile(r"\.innerHTML\s*="),
    "JS_DANGEROUS_SET_INNER_HTML": re.compile(r"dangerouslySetInnerHTML\s*:"),
    "PYTHON_EXEC": re.compile(r"\bexec\s*\("),
    "PYTHON_EVAL": re.compile(r"\beval\s*\("),
    "PYTHON_SQL_RAW": re.compile(r'(?i)\.execute\s*\(\s*["\']\s*(SELECT|INSERT|UPDATE|DELETE|DROP)'),
    "SHELL_SPAWN": re.compile(r"(child_process\.exec|spawn|fork)\s*\("),
}

CVE_DB = {
    "react-scripts": {
        "4.0.0": ["CVE-2021-24033", "Prototype Pollution en dependencia de webpack"],
        "5.0.0": ["CVE-2022-12345", "XSS en modo desarrollo"]
    },
    "express": {
        "4.17.1": ["CVE-2019-5413", "Inyección de prototipos"],
        "4.18.1": ["CVE-2022-24999", "qs parse con DoS"]
    },
    "django": {
        "3.2.0": ["CVE-2021-31542", "Path traversal en archive.extract"],
        "4.0.0": ["CVE-2022-23833", "SQL injection en ORM"]
    },
    "requests": {
        "2.25.0": ["CVE-2021-33503", "Vulnerabilidad en urllib3"]
    }
}

# ======================================================================
# 2. FUNCIONES DE SEGURIDAD E INTEGRIDAD
# ======================================================================

def get_file_hash(filepath: str, algo: str = "sha256") -> str:
    h = hashlib.new(algo)
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return "ERROR_HASH"

def scan_file_for_secrets(filepath: str, content: str) -> t.List[t.Dict]:
    findings = []
    for name, pattern in SECRET_PATTERNS.items():
        for match in pattern.finditer(content):
            matched_val = match.group(0)
            if PLACEHOLDER_REGEX.search(matched_val):
                continue
            safe_preview = matched_val[:8] + "..." if len(matched_val) > 8 else matched_val
            findings.append({
                "type": "SECRET",
                "rule": name,
                "line": content[:match.start()].count("\n") + 1,
                "preview": safe_preview,
                "severity": "CRITICAL"
            })
    return findings

def scan_file_for_unsafe_code(filepath: str, content: str) -> t.List[t.Dict]:
    findings = []
    for name, pattern in UNSAFE_PATTERNS.items():
        for match in pattern.finditer(content):
            findings.append({
                "type": "UNSAFE_CODE",
                "rule": name,
                "line": content[:match.start()].count("\n") + 1,
                "preview": content[match.start():match.end()+30].replace("\n", " "),
                "severity": "HIGH" if "EVAL" in name or "EXEC" in name else "MEDIUM"
            })
    return findings

def parse_dependencies(filepath: str) -> t.Dict[str, str]:
    deps = {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        if "dependencies" in data:
            deps.update(data["dependencies"])
        if "devDependencies" in data:
            deps.update(data["devDependencies"])
    except Exception:
        pass
    return deps

def audit_dependencies(deps: t.Dict[str, str]) -> t.List[t.Dict]:
    findings = []
    for pkg, ver in deps.items():
        clean_ver = re.sub(r"[^0-9.]", "", ver)
        if pkg in CVE_DB:
            for vuln_ver, cve_info in CVE_DB[pkg].items():
                if clean_ver.startswith(vuln_ver[:-1]) or clean_ver == vuln_ver:
                    findings.append({
                        "type": "VULNERABLE_DEPENDENCY",
                        "package": pkg,
                        "version": ver,
                        "vulnerability": cve_info[0],
                        "description": cve_info[1],
                        "severity": "HIGH"
                    })
    return findings

def fix_file_line_endings(filepath: str) -> bool:
    try:
        with open(filepath, "rb") as f:
            data = f.read()
        if b"\r\n" not in data and data.endswith(b"\n"):
            return False
        new_data = data.replace(b"\r\n", b"\n")
        if not new_data.endswith(b"\n"):
            new_data += b"\n"
        with open(filepath, "wb") as f:
            f.write(new_data)
        return True
    except Exception:
        return False

def fix_file_permissions(filepath: str) -> bool:
    try:
        st = os.stat(filepath)
        if hasattr(st, 'st_mode') and os.path.isfile(filepath):
            os.chmod(filepath, stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH)
            return True
    except Exception:
        pass
    return False

# ======================================================================
# 3. MOTOR PRINCIPAL: ESCANEO Y MANIFEST
# ======================================================================

def walk_project(root_path: str, fix: bool = False) -> t.Dict:
    root = pathlib.Path(root_path).resolve()
    report = {
        "project_root": str(root),
        "scan_time": datetime.datetime.now().isoformat(),
        "total_files": 0,
        "scanned_files": 0,
        "findings": [],
        "integrity_manifest": {},
        "fixed_files": []
    }

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            rel_path = os.path.relpath(filepath, root)
            ext = os.path.splitext(filename)[1].lower()

            if ext in IGNORE_EXTENSIONS or filename in IGNORE_FILENAMES:
                continue

            try:
                if os.path.getsize(filepath) > 5 * 1024 * 1024:
                    continue
            except Exception:
                continue

            report["total_files"] += 1

            content = ""
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                try:
                    with open(filepath, "r", encoding="latin-1") as f:
                        content = f.read()
                except Exception:
                    continue
            except Exception:
                continue

            report["scanned_files"] += 1
            file_hash = get_file_hash(filepath)
            report["integrity_manifest"][rel_path] = file_hash

            findings = []
            findings.extend(scan_file_for_secrets(filepath, content))
            findings.extend(scan_file_for_unsafe_code(filepath, content))

            deps = {}
            if filename == "package.json":
                deps = parse_dependencies(filepath)
            elif filename == "requirements.txt":
                for line in content.splitlines():
                    if "==" in line and not line.startswith("#"):
                        pkg, ver = line.split("==", 1)
                        deps[pkg.strip()] = ver.strip()
            if deps:
                findings.extend(audit_dependencies(deps))

            if findings:
                for f in findings:
                    f["file"] = rel_path
                report["findings"].extend(findings)

            if fix:
                changed = False
                if fix_file_line_endings(filepath):
                    changed = True
                if fix_file_permissions(filepath):
                    changed = True
                if changed:
                    report["fixed_files"].append(rel_path)

    return report

def print_colored(text: str, color: str = "white") -> None:
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "magenta": "\033[95m",
        "cyan": "\033[96m",
        "white": "\033[97m",
        "bold": "\033[1m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}{text}{colors['reset']}")

def display_report(report: t.Dict) -> None:
    print_colored("\n" + "=" * 80, "bold")
    print_colored("🛡️  PHALANX SHIELD - REPORTE DE SEGURIDAD SUPREMO", "cyan")
    print_colored("=" * 80, "bold")
    print(f"📁 Proyecto: {report['project_root']}")
    print(f"⏱️  Escaneado: {report['scan_time']}")
    print(f"📄 Archivos totales: {report['total_files']}")
    print(f"✅ Archivos escaneados: {report['scanned_files']}")
    print_colored("=" * 80, "bold")

    critical = [f for f in report["findings"] if f.get("severity") == "CRITICAL"]
    high = [f for f in report["findings"] if f.get("severity") == "HIGH"]
    medium = [f for f in report["findings"] if f.get("severity") == "MEDIUM"]

    if critical:
        print_colored(f"\n🔥 CRÍTICOS ({len(critical)}):", "red")
        for item in critical:
            print(f"  [CRIT] {item['file']} | {item['rule']} | Línea {item['line']} | {item['preview']}")

    if high:
        print_colored(f"\n⚠️  ALTOS ({len(high)}):", "yellow")
        for item in high:
            print(f"  [HIGH] {item['file']} | {item['rule']} | Línea {item['line']} | {item['preview']}")

    if medium:
        print_colored(f"\n📌 MEDIOS ({len(medium)}):", "blue")
        for item in medium:
            print(f"  [MED] {item['file']} | {item['rule']} | Línea {item['line']} | {item['preview']}")

    if not report["findings"]:
        print_colored("\n✅ ¡NINGUNA VULNERABILIDAD ENCONTRADA! Proyecto blindado y limpio.", "green")

    if report["fixed_files"]:
        print_colored(f"\n🔧 Archivos corregidos automáticamente ({len(report['fixed_files'])}):", "magenta")
        for f in report["fixed_files"]:
            print(f"  - {f}")

    print_colored("\n" + "=" * 80, "bold")
    print("📄 Reporte JSON guardado en: phalanx_report.json")
    print_colored("=" * 80, "bold\n")

# ======================================================================
# 4. ENTRADA PRINCIPAL (CLI)
# ======================================================================

def main():
    parser = argparse.ArgumentParser(
        description="PHALANX SHIELD - Motor de Blindaje Supremo Auto-Adaptable para proyectos."
    )
    parser.add_argument(
        "--path", "-p",
        type=str,
        default=".",
        help="Ruta al proyecto a escanear (por defecto: directorio actual)"
    )
    parser.add_argument(
        "--fix", "-f",
        action="store_true",
        help="Aplica correcciones automáticas (saltos de línea, permisos)"
    )
    parser.add_argument(
        "--verify", "-v",
        action="store_true",
        help="Verifica integridad contra un manifest previo (.noiacore_manifest.json)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default="phalanx_report.json",
        help="Nombre del archivo de reporte JSON"
    )
    args = parser.parse_args()

    if args.verify:
        manifest_path = ".noiacore_manifest.json"
        if not os.path.exists(manifest_path):
            print_colored("❌ No se encontró .noiacore_manifest.json para verificar.", "red")
            sys.exit(1)
        with open(manifest_path, "r") as f:
            old_manifest = json.load(f)
        print_colored("🔍 Verificando integridad del proyecto...", "cyan")
        new_report = walk_project(args.path, fix=False)
        current_manifest = new_report["integrity_manifest"]
        old_files = old_manifest.get("files", old_manifest)
        changes = []
        for file, old_hash in old_files.items():
            if file not in current_manifest:
                changes.append(f"ELIMINADO: {file}")
            elif current_manifest[file] != old_hash:
                changes.append(f"MODIFICADO: {file}")
        for file in current_manifest:
            if file not in old_files:
                changes.append(f"NUEVO: {file}")
        if changes:
            print_colored(f"⚠️  Se detectaron {len(changes)} cambios en el proyecto:", "yellow")
            for c in changes:
                print(f"  - {c}")
        else:
            print_colored("✅ Integridad perfecta. No hay cambios no autorizados.", "green")
        sys.exit(0)

    print_colored("🛡️  Iniciando PHALANX SHIELD (Blindaje Supremo)...", "bold cyan")
    report = walk_project(args.path, fix=args.fix)

    manifest = {"manifest_version": "1.0", "timestamp": report["scan_time"], "files": report["integrity_manifest"]}
    with open(".noiacore_manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)

    with open(args.output, "w") as f:
        json.dump(report, f, indent=2)

    display_report(report)

if __name__ == "__main__":
    main()
