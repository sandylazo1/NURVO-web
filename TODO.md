# NURVO — TODO y prioridades (2026-11-01)

## P0: errores reales de GitHub Actions
- [ ] Identificar TODOS los run IDs fallidos en https://github.com/sandylazo1/NURVO-web/actions y registrar workflow, SHA, job, etapa, log y causa.
- [ ] Antigravity: investigar en rama `antigravity/ci-failures`, abrir PR propio y coordinar mediante issues/PR; NO editar esta rama ni main simultáneamente.
- [ ] Revisar fallos del workflow `NURVO - CI and visual checks`: integridad estática Node, Chromium desktop/móvil, pytest FastAPI y despliegue de Pages.
- [ ] Ejecutar pruebas en entorno real; el código por sí solo NO equivale a tests verdes.
- [ ] Conservar capturas `test-artifacts/nurvo-failed-state.png` y logs si Chromium falla.
- [ ] No fusionar este PR hasta obtener resultados CI verdes.

## P1: producto y UX
- [x] Identidad NURVO + PNG transparente y paleta oficial.
- [x] Listas para cotizar sin precios ni stock simulados.
- [x] API de patentes preparada, deshabilitada sin credenciales/permiso; VIN NHTSA vPIC opcional.
- [x] SEO básico en rama del agente: canonical, OpenGraph, robots.txt, sitemap.xml, manifest.
- [ ] Verificar fotografías individuales, sus licencias y que representen correctamente las piezas.
- [ ] Validar imágenes y enlaces externos: 404, hotlink, tiempos de carga, alt.
- [ ] Auditar accesibilidad con teclado, lectores de pantalla, contraste WCAG y reduced motion.
- [ ] Revisar responsive a 390, 768, 1440 px y capturas de navegador.
- [ ] Optimizar el HTML monolítico y diferir JS no crítico después de pruebas.

## P2: backend y conversión
- [ ] Desplegar FastAPI en un servicio HTTPS con base persistente (GitHub Pages NO ejecuta Python).
- [ ] Obtener permiso, contrato y API key de proveedor chileno; nunca publicar secretos.
- [ ] Validar respuestas reales de placa, robos, multas y límites comerciales antes de activar.
- [ ] Conectar `config.js` a la URL real y establecer privacidad, retención y borrado de datos.
- [ ] Convenios con repuesteras para precios/stock y compatibilidad OEM real.
- [ ] Backend real para envío y trazabilidad de cotizaciones, consentimiento y comisiones.

## Política de coordinación
No hacer `push --force`, no fusionar pruebas rojas, no asumir conexión con Antigravity. Revisar PR y comentarios antes de integrar. Ver `AGENT_PROGRESS.md` y `QA_REPORT.md`.

## Ejecutado en la rama de auditoría
- [x] Mantener aislamiento de `main` después de cambios concurrentes.
- [x] Añadir herramienta de auditoría para listar IDs/pasos fallidos vía API GitHub Actions en workflow.
- [x] Añadir captura de pantalla en fallo de Chromium.
- [x] Restaurar documentación y assets SEO desde commits recuperables.
- [ ] Obtener artefacto `nurvo-failed-actions-audit` tras CI y clasificar errores; sin run real no marcar como verificado.
