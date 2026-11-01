# NURVO — Informe QA verificable

**Fecha:** 2026-11-01. **Repositorio:** `sandylazo1/NURVO-web`. **Rama:** `agent/qa-ci-hardening-20261101`.

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

GitHub reportó `NOT_FOUND` para la rama `agent/qa-ci-hardening-20261101` después de haber sido usada. El último `main` observado es `f13ae7fa` (corrección de CI). Se recuperó documentación desde commit inmutable anterior a la desaparición. No se atribuye la eliminación de rama a ningún agente sin confirmación. No existe run ID verificable accesible desde el conector en este momento.
