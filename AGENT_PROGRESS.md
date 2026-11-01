# NURVO — Estado de continuidad y coordinación

**Fecha de trabajo:** 2026-11-01 (America/Santiago)
**Repositorio:** https://github.com/sandylazo1/NURVO-web
**Producción estática:** https://sandylazo1.github.io/NURVO-web/
**Rama vigente de este agente:** `agent/ci-audit-20261101-c` (base `main` SHA `f13ae7fa`).
**Regla:** no editar `main` directamente mientras haya agentes concurrentes; incorporar vía PR con pruebas.

## Cambios ya guardados en main antes de esta rama

- Plataforma single-page con identidad NURVO, logotipo PNG transparente, carruseles y fotos referenciales.
- Marketplace intermediario sin precios ficticios, listas para cotizar, filtros y comparación.
- Garaje local con historial, orientación por patente + datos proporcionados por usuario.
- Integración frontend configurable `config.js` + `assets/patente-api.js`.
- Backend en `backend/app`: FastAPI, SQLite, respuestas stale-while-revalidate, proveedor JSON/Playwright autorizado, AutoRiesgo comercial opt-in, VIN NHTSA vPIC, scheduler 03:00 Chile opt-in.
- Pruebas de frontend/Chromium y backend/pytest en `.github/workflows/nurvo-checks.yml`.

**Importante:** GitHub Pages solo ejecuta archivos estáticos. Ninguna consulta FastAPI aparece en producción hasta desplegar un backend separado y configurar su URL en `config.js`. El proveedor por defecto está deshabilitado. No inventar un estado limpio, diagnóstico o confirmación de compatibilidad.

## Cambios de esta rama

1. SEO: canonical, Open Graph, sitemap, robots y manifiesto estático de NURVO.
2. Atribución comercial condicional: solo mostrar insignia PNG «Powered by AutoRiesgo» si una respuesta conectada identifica esa fuente. Su licencia la requiere en buscadores que consumen su API.
3. Evidencia de fallos de Chromium: guardar `test-artifacts/nurvo-failed-state.png` y excepciones de consola en caso de error; GitHub Actions ya sube artefactos con `if: always()`.
4. Documentar QA, próximos pasos, responsabilidades y procedimiento de revisión de runs fallidos.
5. Mantener esta rama separada de `main` para evitar conflictos con Antigravity o Codex.

## Instrucciones para Antigravity (mensaje de coordinación persistente)

**Tarea solicitada por la propietaria del repositorio:** revisar *todos los run failed* de GitHub Actions y colaborar con la estabilización sin editar la misma rama.

1. Trabajar en `antigravity/ci-failures` desde el último `origin/main`, **no** en `main` ni en `agent/qa-ci-hardening-20261101`.
2. Ir a https://github.com/sandylazo1/NURVO-web/actions y localizar los runs fallidos y sus identificadores. Revisar las pestañas de *NURVO - CI and visual checks* y *pages build and deployment*.
3. Obtener logs reales de cada job fallido: `gh run list -R sandylazo1/NURVO-web --limit 30`; `gh run view <RUN_ID> -R sandylazo1/NURVO-web --log-failed`. Guardar en `QA_REPORT.md` el workflow, run ID, SHA, job, paso y línea del error.
4. Clasificar las fallas: YAML/workflow inválido, dependencia/runner, tests Python, tests Chromium, rutas de GitHub Pages o despliegue.
5. Revisar los artefactos de screenshots (`nurvo-desktop-mobile-previews` y `nurvo-failed-state.png`) cuando existan.
6. Proponer una corrección por causa real, reproducir, ejecutar pruebas y abrir PR **hacia `main`**. No alterar secretos ni instalar integraciones pagadas.
7. Revisar PR de este agente y comentar incompatibilidades; no fusionar nada rojo.
8. No activar scraping de AutoSeguro ni saltar CAPTCHA/controles de acceso. No enviar patentes a proveedores no autorizados.

**Canal real de coordinación:** este archivo, issues y PRs de GitHub. No hay un canal de mensajes directo a la aplicación Antigravity conectado desde esta conversación; este texto no implica que Antigravity ya lo haya leído o ejecutado.

## Continuación si se interrumpe la ejecución

- Revisar las 3 tareas principales en `TODO.md`.
- Revisar resultados y límites en `QA_REPORT.md`.
- Ejecutar: `node tests/smoke.mjs`; `cd backend && pip install -r requirements-dev.txt && python -m pytest -q tests`.
- Pruebas visuales: `python3 -m http.server 8765` en una terminal; en otra, `npm install --no-save playwright@1.56.1 && npx playwright install chromium && node tests/browser.mjs`.
- Revisar PR de esta rama antes de fusionar. Si hay commits de otros agentes en main, rebasear o resolver conflictos con cuidado; **jamás force push**.

## Nota de concurrencia 2026-11-01

La rama previa `agent/qa-ci-hardening-20261101` dejó de estar disponible al observar cambios concurrentes. Se conserva documentación en `agent/ci-audit-20261101-c`, creada a partir del commit `f13ae7fa` de `main` (corrección de CI por otro agente). **No se fuerza ni restablece la rama anterior.** Consultar PR #2 y issue #3 antes de integrar.

## Trabajo de esta rama

- Script `scripts/audit-actions.py`: consulta REST API de GitHub Actions con token temporal y permiso `actions: read` y genera artefacto con run IDs, jobs y pasos fallidos (no logs crudos).
- Workflow agrega un job `audit` independiente para producir `nurvo-failed-actions-audit` en cada PR. No permite confirmar logs retroactivamente hasta su ejecución.
- QA Chromium captura `nurvo-failed-state.png` ante fallas.
- Recursos SEO agregados: canonical/OG, robots, sitemap y manifest.
- PR anterior #2 puede haberse quedado con rama no disponible: no restaurar ni fusionar sin revisar. La rama actual es independiente.

## Cambio concurrente de diseño

La rama vigente `agent/ci-audit-20261101-c` se creó desde el último main conocido `5e65810d`, que incluía cambios grandes en `index.html` de otro agente. No reemplazar ese diseño; la auditoría CI se mantiene separada.

## Auditoría verificada por trabajo paralelo (2026-11-01)

PR #6 reporta 31 fallos documentados en `QA_REPORT.md`: 8 incompatibilidades Ubuntu/Playwright, 4 whitespace, 1 smoke de catálogo, 17 despliegues Pages concurrentes y 1 configuración Jekyll/docs. Run de PR #6 `41307742153` reportado verde en frontend, Chromium y backend; no equivale a validación de esta rama. PR #5 ya propone concurrency y guardia Ubuntu, no duplicar. PR #7 (esta rama) permanece en borrador hasta tener sus propios checks verdes. Issue #3 coordina Antigravity.

## Auditoría completada con evidencias de GitHub

- Job de auditoría `run 41307915426` publicado con éxito: [ver Actions](https://github.com/sandylazo1/NURVO-web/actions/runs/41307915426).
- Descargado y leído artefacto `nurvo-failed-actions-audit` (13084126767): 136 runs / 31 fallidos, con IDs y steps.
- Los 4 jobs del run 41307915426 (auditor, frontend, backend, Chromium) terminaron **success**.
- Las causas antiguas se documentan con enlaces concretos en `QA_REPORT.md`.
- La rama permanece aislada y el PR #7 sigue sin fusionar; el despliegue real de Pages debe verificarse tras aprobación.
