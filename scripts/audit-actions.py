#!/usr/bin/env python3
"""Summarize recent failed GitHub Actions runs without copying potentially sensitive logs.

Runs on a GitHub Actions runner with GITHUB_TOKEN (actions: read). The artifact
lists IDs, URLs, commits, failing jobs and steps; it does NOT contain raw log bodies.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

REPO = os.getenv("GITHUB_REPOSITORY", "sandylazo1/NURVO-web")
TOKEN = os.getenv("GITHUB_TOKEN", "")
MAX_PAGES = min(20, max(1, int(os.getenv("NURVO_AUDIT_PAGES", "5"))))
API = "https://api.github.com"
OUT = Path("test-artifacts/failed-actions.md")

def fetch(path: str) -> dict:
    if not TOKEN:
        raise RuntimeError("GITHUB_TOKEN no disponible; auditoría de Actions no realizada")
    request = urllib.request.Request(
        API + path,
        headers={
            "Authorization": "Bearer " + TOKEN,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "nurvo-ci-auditor/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)

def audit() -> str:
    lines = [
        "# Auditoría de GitHub Actions — NURVO",
        "",
        "Repositorio: `" + REPO + "`.",
        "Los run IDs y pasos provienen de la API de GitHub, no de interpretaciones de iconos rojos.",
        "No se incluyen contenidos de logs que podrían contener información sensible.",
        "",
    ]
    seen, failures, pages = set(), [], 0
    for page in range(1, MAX_PAGES + 1):
        data = fetch("/repos/" + REPO + "/actions/runs?per_page=100&page=" + str(page))
        runs = data.get("workflow_runs", [])
        if not isinstance(runs, list):
            raise RuntimeError("Formato de respuesta inválido de GitHub Actions")
        pages += 1
        for run in runs:
            rid = run.get("id")
            if rid in seen:
                continue
            seen.add(rid)
            if run.get("conclusion") in {"failure", "timed_out", "action_required", "startup_failure"}:
                failures.append(run)
        if len(runs) < 100:
            break
        time.sleep(0.2)
    lines += [
        "Ventana revisada: " + str(len(seen)) + " ejecuciones en " + str(pages) + " página(s).",
        "Runs con conclusión fallida: " + str(len(failures)) + ".",
        "**Alcance:** se consultaron como máximo " + str(MAX_PAGES * 100)
          + " ejecuciones; si existen más, ampliar NURVO_AUDIT_PAGES.",
        "",
    ]
    for run in failures:
        rid = run["id"]
        lines += [
            "## " + str(run.get("name") or "Workflow") + " — run " + str(rid),
            "",
            "- URL: " + str(run.get("html_url") or "No disponible"),
            "- SHA: `" + str(run.get("head_sha") or "?") + "`",
            "- Rama: `" + str(run.get("head_branch") or "?") + "`",
            "- Estado: " + str(run.get("status") or "?") + " / " + str(run.get("conclusion") or "?"),
            "- Inicio: " + str(run.get("created_at") or "?"),
            "",
        ]
        jobs = fetch("/repos/" + REPO + "/actions/runs/" + str(rid) + "/jobs?per_page=100").get("jobs", [])
        found = False
        for job in jobs:
            if job.get("conclusion") not in {"failure", "timed_out", "action_required", "startup_failure"}:
                continue
            found = True
            lines.append("- **Job fallido:** `" + str(job.get("name")) + "` (ID " + str(job.get("id")) + ")")
            for step in job.get("steps") or []:
                if step.get("conclusion") in {"failure", "timed_out", "action_required", "startup_failure"}:
                    lines.append("  - Paso fallido: " + str(step.get("name"))
                                 + " (n.° " + str(step.get("number")) + ")")
        if not found:
            lines.append("- No se encontraron jobs fallidos disponibles; puede ser un error de definición de workflow.")
        lines.append("")
    if not failures:
        lines.append("No se recibieron runs fallidos en la ventana consultada; **no significa que CI esté verde**.")
    return "\n".join(lines) + "\n"

def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    try:
        text = audit()
    except (urllib.error.URLError, urllib.error.HTTPError, RuntimeError, ValueError) as exc:
        text = ("# Auditoría incompleta\n\nNo fue posible consultar los runs mediante GitHub API. "
                "Motivo: `" + str(exc)[:300] + "`.\n")
        print("Advertencia: no fue posible consultar los runs de Actions:", type(exc).__name__, file=sys.stderr)
    OUT.write_text(text, encoding="utf-8")
    summary = os.getenv("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as file:
            file.write(text)
    print("Informe generado:", OUT)

if __name__ == "__main__":
    main()
