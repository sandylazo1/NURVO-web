# QA_REPORT — NURVO VIN, cotizaciones y talleres
Fecha: 2026-11-02. Rama: `agent/vin-services-20261102`. Base: `main` SHA `05fb6fbd073128267dbe281fcce6ddbb80011243`.

## Entregado en rama de revisión
- `vin.html` + `assets/vin-tool.js`: nueva ruta estática enlazada desde el menú de `index.html`.
- Consulta pública de NHTSA vPIC desde el navegador para VIN estándar de 17 caracteres (año opcional); aviso explícito cuando falten datos, CORS o conectividad. No se valida propiedad, patente chilena, robo, multas ni compatibilidad de repuestos.
- Chasis antiguos/pre-1981: captura y estado manual; **NHTSA no garantiza cobertura pre-1981**. No prometer decodificación automática independiente del año.
- Cotizaciones aportadas por el usuario (precio CLP, proveedor, fecha, enlace opcional), únicamente localStorage. No constituyen oferta confirmada por NURVO.
- Checklist general de mantenimiento sin intervalos inventados. Para intervalos específicos se requiere manual, motor, versión, kilómetros y/o fuente licenciada.
- Búsqueda externa por comuna y servicio en Google Maps; no se afirma alianza, calidad ni disponibilidad de talleres.
- Enlaces a Auto Seguro, ChileAtiende y Registro Civil. **Sin acceso técnico directo a bases de Carabineros/Registro Civil**; convenios/autorización pendientes.
- `tests/vin.mjs` y pruebas Playwright del flujo estático con respuesta NHTSA simulada, sin fingir verificación real.

## Estado de pruebas
- Primer run [41513625907](https://github.com/sandylazo1/NURVO-web/actions/runs/41513625907), SHA `6892a229`: frontend y backend verdes; Chromium falló en `tests/browser.mjs:130` al afirmar `HONDA` antes de que resolviera el `fetch` asíncrono simulado. Log real inspeccionado; no fue un fallo de identificación vehicular.
- Corrección en [commit 9e8f66c](https://github.com/sandylazo1/NURVO-web/commit/9e8f66c7f52bf4e4d3f3f5c4b8f0c8a7af12a93f): `waitFor` de Playwright antes de leer resultado.
- Segundo run [41513840348](https://github.com/sandylazo1/NURVO-web/actions/runs/41513840348): **3/3 jobs verdes**. Frontend `tests/smoke.mjs` y `tests/vin.mjs` aprobados, backend **10 passed, 1 warning**, Chromium desktop/mobile y flujo VIN/cotizaciones/talleres con NHTSA simulada aprobados. Logs inspeccionados. Los datos simulados solo prueban renderizado, nunca identidad real.
- CI requerido en PR: `node tests/smoke.mjs`, `node tests/vin.mjs`, `node tests/browser.mjs`, `cd backend && python -m pytest -q tests`.
- Este entorno local no puede resolver DNS a NHTSA; no se hizo consulta en vivo. **Los tests de Playwright simulan exclusivamente una respuesta técnica de NHTSA para probar la UI.**
- No declarar tests verdes ni despliegue productivo antes de revisar los runs reales del commit más reciente.
- Publicación Pages: solo después de revisión y fusión explícita de PR con checks verdes. `vin.html` permanece en rama hasta entonces.

## Seguridad y fuentes
- Fuente VIN: https://vpic.nhtsa.dot.gov/api/ y https://vpic.nhtsa.dot.gov/ ; destinada principalmente a años modelo 1981+ y sujeta a límites/CORS.
- Robo y búsqueda: https://www.chileatiende.gob.cl/fichas/25160 y https://www.autoseguro.gob.cl/ . Su plataforma de integración no constituye credenciales o un API pública otorgada a NURVO.
- Registro Civil, certificado de anotaciones vigentes: https://www.chileatiende.gob.cl/fichas/3370 .
- No usar scraping no autorizado, credenciales en Pages, ni estado «sin encargo» por defecto. GitHub Pages no hospeda FastAPI.
- VIN se envía a NHTSA al consultar un VIN moderno; cotizaciones se guardan en el navegador del usuario. No se consultan registros de propietarios.

## Coordinación
Revisadas issue #1 y PR #2, #4, #5, #6, #7; los cambios móviles del PR #8 están en `main`. Esta rama no incorpora ni fusiona los otros PR, para preservar revisión aislada y evitar conflictos.
- PR #2 cerrado sin merge.
- PR #4 abierto con conflictos reportados en auditoría previa.
- PR #5/#6/#7 abiertos: coordinar scripts CI y documentación con Antigravity.
- Issue: https://github.com/sandylazo1/NURVO-web/issues/1
- No cambios a secretos, no push forzado, no merge.

## Pendientes antes de producción
1. Revisar CI y navegador en último SHA, incluyendo errores de consola.
2. Confirmar desde navegador real si NHTSA permite CORS desde Pages; si no, usar backend separado o abrir decodificador oficial, sin exponer claves.
3. Contratar proveedores e implementar ofertas verificables con identificador, vigencia, moneda, IVA, enlace y stock desde fuentes autorizadas.
4. Solicitar convenio/credenciales oficiales de datos chilenos y hacer análisis legal/privacidad antes de automatizar consultas; alojar adapter server-side.
5. Verificar el despliegue después de merge con el workflow y URL, no anticiparlo.

---

## Expansión automotriz, legal y comercial (02-11-2026)
**Rama:** `agent/automotive-legal-marketplace-20261102` desde main `f3f3025`. Los PR #4/#5/#6/#7 permanecen en sus ramas, no se mezclan ni se fuerza push.

### Implementación
- `ecosistema.html` + `assets/ecosistema.css` + `assets/ecosistema.js`: página responsiva para genuinos/OEM, OES, aftermarket, remanufacturados, usados, accesorios, explorador de familias, formulario que genera texto local para cotización y advertencias según seguridad/garantía/tenencia de vehículo, talleres mediante búsqueda externa y esquemas B2C/B2B/B2B2C.
- `terminos.html` y `privacidad.html`: **borradores legales no aprobados**, sin renuncia abusiva de derechos, condicionados a identificar operador jurídico y revisión profesional.
- `docs/COMPLIANCE_CHILE_2026.md`, `docs/CYBERSECURITY_ASSESSMENT.md`, `docs/MARKET_PARTNERSHIPS_CL.md`, `docs/INTEGRATIONS_MATRIX.md`: legislación chilena, fuentes de ANAC/SERNAC, flotas, compras públicas, tratamientos de datos, brechas técnicas y matriz de integraciones.
- Navegación agregada desde `index.html` y `vin.html` sin sustituir el rediseño anterior; `README.md` actualizado.
- Tests nuevos `node tests/ecosistema.mjs` y recorrido de Chromium de catálogo, solicitud, garantía, alquiler, taller, escritorio/móvil, términos y privacidad. Se conserva CI de Python y VIN existentes.

### Límites verificables
- Ley 21.719: entrada en vigor 01-12-2026; al 02-11-2026 no se puede afirmar certificación ni cumplimiento completo.
- Ni Registro Civil, ni Carabineros, ni Awto, ni Ford, Hyundai, Derco, Volkswagen, Nissan u hospital poseen conexión/contrato verificado en NURVO.
- NHTSA vPIC disponible solo según cobertura/condiciones de consulta de VIN; no identifica propietario ni situación legal.
- Las categorías no constituyen SKU, precio, stock ni compatibilidad confirmada.
- Los talleres obtenidos en Maps no han sido auditados; NURVO no conoce su política de repuestos.
- La responsabilidad del usuario no extingue deberes legales de talleres, vendedores ni intermediarios.
- No automatizar scrapeo ni acceso a organismos públicos; no poner credenciales en GitHub Pages.
- Tratados comerciales de importación no implican convenios de marca.
- Uso institucional requiere proceso de compras públicas, representación y resguardo de información.

### Puertas de calidad y despliegue
- [ ] CI último SHA: `node tests/smoke.mjs`, `node tests/vin.mjs`, `node tests/ecosistema.mjs`.
- [ ] Chromium (nuevo flujo y pruebas legacy) verde.
- [ ] Backend: `cd backend && python -m pytest -q tests`.
- [ ] Revisar logs reales y corregir en rama exclusiva si hay fallos.
- [ ] Confirmar Pages del commit integrado si se autoriza merge.
- [ ] **Antes de pagos/cotización vinculante/cuentas:** abogado chileno, identidad operador, DPA, contratos con proveedores/talleres, API licenciada, medidas técnicas.

