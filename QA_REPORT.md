# NURVO — Informe QA verificable

**Fecha:** 2026-11-01. **Repositorio:** `sandylazo1/NURVO-web`. **Rama:** `agent/ci-audit-20261101-c`.

## Hechos comprobados

| Área | Estado | Evidencia y límites |
|---|---|---|
| Rama aislada | VERIFICADO | GitHub `create_branch` desde `main`; sin sobrescribir archivos de otros agentes. |
| Código previo | VERIFICADO EN GITHUB | Commits de NURVO en `main`; identidad, carrito-cotización, catálogo, formas y API están guardados. |
| PNG logotipo | VERIFICADO EN CÓDIGO | Dos PNG transparentes embebidos; se validaron firmas PNG y CRC previamente. |
| SEO | IMPLEMENTADO EN RAMA | Canonical, OpenGraph, robots.txt, sitemap.xml, manifest. |
| Atribución API | IMPLEMENTADO EN RAMA | Badge externo mostrado solo para respuestas reales de AutoRiesgo. |
| JavaScript y pruebas | CONFIGURADO, SIN APROBACIÓN END-TO-END | `tests/smoke.mjs`, `tests/browser.mjs`, workflows CI. No afirmar que pasaron sin resultados. |
| Python FastAPI | CONFIGURADO, NO DESPLEGADO | `backend/app`, pytest, SQLite, adaptadores. GitHub Pages solo soporta estáticos. |
| API patente | NO ACTIVA EN PAGES | `config.js` tiene URL vacía; sin clave y contrato no hay consulta automática verificada. |
| Robo y multas | DESHABILITADOS | Un fallo o silencio de fuente se trata como NO VERIFICADO. |
| GitHub Actions fallidos | PENDIENTE DE LOGS | Capturas del usuario muestran X rojas. La conexión de GitHub permite obtener logs si se conocen los run IDs, pero no expone listado de runs push. NO interpretar ausencia de statuses como verde. |
| Despliegue Pages | PENDIENTE DE VERIFICACIÓN | Debe comprobarse URL, commit publicado y carga de recursos. |

## Run failures — plantilla de triage

| Run ID | SHA | Workflow | Job / paso | Error | Corrección | Resultado |
|---|---|---|---|---|---|---|
| Por capturar | Por capturar | NURVO CI / Pages | Por identificar | Capturas muestran X; sin logs completos | No inventar causa | Pendiente |

Procedimiento: abrir https://github.com/sandylazo1/NURVO-web/actions, obtener run ID desde URL, revisar job rojo y descargar log. Con `gh`: `gh run list -R sandylazo1/NURVO-web --limit 50`, `gh run view <RUN_ID> -R sandylazo1/NURVO-web --log-failed`. Reproducir con `node tests/smoke.mjs`, `node tests/browser.mjs`, `cd backend && python -m pytest -q`.

## Riesgos y criterios de publicación

- No mostrar un badge verde de «sin robo» para respuesta antigua o sin fuente.
- No presentar VIN NHTSA como identificación por patente chilena.
- No guardar datos personales del propietario ni exponer tokens en Pages.
- No afirmar licencias fotográficas individuales sin verificar la foto exacta.
- No activar scraping de sitios con restricciones o sin autorización.
- No fusionar un PR rojo; solicitar revisión cruzada con Antigravity.

## Trabajo de esta rama
- SEO técnico y recursos estáticos.
- Atribución condicional del proveedor comercial.
- Captura de pantalla/console ante fallos Playwright.
- Handoff de coordinación y matrices de QA.

**Conclusión provisional:** cambios de código guardados; revisión de runs fallidos, pruebas de navegador y publicación no certificados todavía.

## Verificación adicional y bloqueo

GitHub reportó `NOT_FOUND` para la rama `agent/ci-audit-20261101-c` después de haber sido usada. El último `main` observado es `f13ae7fa` (corrección de CI). Se recuperó documentación desde commit inmutable anterior a la desaparición. No se atribuye la eliminación de rama a ningún agente sin confirmación. No existe run ID verificable accesible desde el conector en este momento.

## Auditoría CI incorporada

El workflow incluye job `audit` con permisos `actions: read`, ejecuta `scripts/audit-actions.py`, consulta hasta 500 runs recientes y publica `test-artifacts/failed-actions.md` como artefacto. Es una **instrumentación pendiente de ejecución**, no prueba de que hayan desaparecido los fallos. No se adjuntan logs completos para evitar exposición accidental de datos.

## Aislamiento adicional

Se detectó `main` SHA `5e65810d`, commit de rediseño de `index.html`; la rama actual parte de ese SHA, para preservar el rediseño concurrente y evitar conflictos en PR #4.

## Verificación estática adicional (2026-11-01)

Inspección directa de la rama actual mediante conector GitHub y comprobaciones JavaScript en memoria:

- `index.html`: 259.684 caracteres; 84 identificadores HTML, **0 duplicados**.
- Catálogo: 8 pares de fotografías declarados (16 IDs de foto distintos).
- Logotipo: 2 PNG incrustados en el HTML.
- Scripts: `config.js` y `assets/patente-api.js` referenciados desde HTML.
- `new Function(...)` aceptó el script principal y `assets/patente-api.js` sin errores de sintaxis.
- Persisten la barra móvil, consulta por patente, solicitud de cotización, sin referencias a `money(p.price)`.

**Estas son pruebas estáticas, no navegación real, validez de links remotos ni evidencia de pruebas GitHub Actions en verde.** El job `audit` debería publicar identificadores reales de fallos tras ejecutarse; aún no hay artefacto confirmado en la conexión actual.

## Evidencia de CI obtenida desde PR #6

El PR #6 (`https://github.com/sandylazo1/NURVO-web/pull/6`) documenta 31 runs fallidos: 8 Ubuntu 26.04 / Playwright 1.56.1, 4 whitespace en `git diff --check`, 1 smoke de catálogo, 17 Pages HTTP 400 por despliegues concurrentes y 1 Jekyll sin carpeta `docs`. En ese PR se informa que el run `41307742153` fue verde en los 3 jobs; también se citan `41307433226` y `41307432547` de `main`. **Es evidencia de esos SHAs, no de esta rama.** PR #5 aborda CI concurrency/Ubuntu. El nuevo job `audit` de esta rama todavía requiere resultado propio.

## Evidencia CI confirmada — run 41307915426

**URL:** https://github.com/sandylazo1/NURVO-web/actions/runs/41307915426
**SHA:** `108f0ac2e491a8db96d920bbd01d03bf424aeef4` (antes de actualizar este informe).

Consulta del run mediante GitHub Connector: los cuatro jobs terminaron **success**:
1. `Identify failed historical GitHub Actions jobs` — success; pruebas offline del auditor y publicación de artefacto.
2. `Static integrity and git commit` — success; `git diff --check` y Node smoke.
3. `Python API tests` — success; instalación, compilación y pytest.
4. `Real Chromium UI test` — success; instalación Chromium, flujos escritorio/móvil y artefactos.

**Artefacto real:** `nurvo-failed-actions-audit` ID 13084126767, descargado y leído; 136 ejecuciones revisadas (2 páginas) / **31 fallidas**:
- 18 runs `pages build and deployment`: 17 fallos en Deploy to GitHub Pages, 1 en Jekyll build.
- 13 runs `NURVO - CI and visual checks`: 8 instalaciones Playwright, 4 `git diff --check`, 1 smoke test por ID de foto desactualizado.

**Causas confirmadas desde logs reales de jobs:**
- Run [41306999901](https://github.com/sandylazo1/NURVO-web/actions/runs/41306999901), job 124849357463: `Playwright 1.56.1 does not support chromium on ubuntu26.04-x64`. El workflow actual se fijó en `ubuntu-24.04`; el job browser más reciente ya pasó.
- Run [41306256999](https://github.com/sandylazo1/NURVO-web/actions/runs/41306256999), job 124847142464: `git diff --check` detectó `trailing whitespace` en `index.html`. La corrección anterior del commit `f13ae7fa` normalizó fin de línea; job frontend más reciente pasó.
- Run [41290702821](https://github.com/sandylazo1/NURVO-web/actions/runs/41290702821), job 124801194493: `Deploy to GitHub Pages` error HTTP 400: había otro despliegue todavía en curso para SHA `579005672...`. Causa de concurrencia de deploys, no prueba de código roto.
- Run [41290493360](https://github.com/sandylazo1/NURVO-web/actions/runs/41290493360), job 124800544218: assert de Node `Catálogo con imágenes reales` no coincidía con ID de foto cambiado. Suite actual verde.
- Run [41282662825](https://github.com/sandylazo1/NURVO-web/actions/runs/41282662825), job 124777585428: Jekyll buscó carpeta `docs` inexistente (`Errno::ENOENT`); el sitio ahora dispone de raíz `index.html` y `.nojekyll`. Verificar la configuración actual de Settings → Pages.

**Pendiente:** confirmación del último despliegue a GitHub Pages (no inferir estado de producción solo por CI del PR). Evitar pushes simultáneos a `main` y no reintentar despliegues de SHAs antiguos (riesgo de rollback).

