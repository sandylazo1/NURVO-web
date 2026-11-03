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

### Ejecuciones de esta expansión
- [Run #41519095389](https://github.com/sandylazo1/NURVO-web/actions/runs/41519095389), SHA `eba8d528`: fallo verificado en `git diff --check` por **línea en blanco adicional al final de QA_REPORT.md**. Backend verde; Chromium omitido por dependencia. Ver log del trabajo `Static integrity and git commit`.
- Corregido sin force push en [commit b47ccdc](https://github.com/sandylazo1/NURVO-web/commit/b47ccdc8daab72b35367e7cf9ccd305e2c3e0bab).
- [Run #41519196597](https://github.com/sandylazo1/NURVO-web/actions/runs/41519196597), SHA `b47ccdc`: **3/3 trabajos exitosos**; frontend `smoke.mjs`, `vin.mjs`, `ecosistema.mjs`; backend **10 passed, 1 warning**; Chromium incluyó pruebas legacy y nuevo ecosistema, términos, privacidad, documentos, flota, piezas críticas y móvil. Logs inspeccionados.
- Se añadió [Ley 21.793 (2026)](https://www.bcn.cl/leychile/Navegar?idNorma=1220283) sobre conversiones eléctricas, y enlaces oficiales de postventa Ford, Volkswagen, Nissan, Hyundai y Derco (no convenios). Verificar **CI del último SHA** después de estas revisiones antes de fusionar.

---

## Actualización integral de interfaz, equipo y operaciones — 2026-11-02
**Rama de revisión:** \`agent/full-web-product-team-20261102\`, basada en main \`625d75a4fae4c948e7b22917d4f93f5ebd1cd19b\`.

### Implementación adicional sin duplicar módulos anteriores
- \`equipo.html\`: roles declarados: Rafael Vester (CEO, ingeniero mecánico, socio mayoritario proyectado), Tomás Venegas (Founder, Consultor Departamento de Negocios), Sandy Lazo (Co-Founder, Product Management y Consultora Departamento TI). No porcentajes, cesiones de PI ni facultades legales inventadas.
- \`gestion.html\` / \`assets/gestion.js\`: mantención basada en km y fecha/meses **introducidos por el usuario y respaldados por su manual**, comparación numérica de dos presupuestos CLP con IVA sin validar oferta, registros de flota con alias localStorage, CSV y borrado. Se rechaza formato de patente y VIN en el alias, se limita a 25 entradas y se informa que no es apto para datos sensibles de vehículos institucionales.
- \`alianzas.html\` / \`assets/alianzas.js\`: generador local de borradores de prospectos B2B/B2B2C; no envío, CRM, convenio ni precios reales, y requisitos de proveedores/talleres/flotas/marcas/sector público.
- \`assets/nurvo-plus.css\`: identidad NURVO y responsive para páginas nuevas, CSP compatible y navegación móvil.
- \`index.html\`, \`ecosistema.html\`, \`vin.html\`, \`terminos.html\`, \`privacidad.html\`: enlaces cruzados, módulos accesibles, transparencia sobre persistencia local de flotas.
- \`docs/TEAM_GOVERNANCE_NURVO.md\`, \`docs/ROADMAP_NURVO_PRODUCTO.md\`: distribución de funciones sin afirmar participación societaria legal, prioridades comerciales e integraciones todavía no disponibles.

### Pruebas y controles
- \`node tests/smoke.mjs\`: funcionalidades legacy.
- \`node tests/vin.mjs\`: contrato VIN.
- \`node tests/ecosistema.mjs\`: legal y ecosistema.
- \`node tests/expansion.mjs\`: sintaxis JS, roles, CSP, páginas, minimización de datos, no envío/secretos.
- \`node tests/browser.mjs\`: Chromium desktop/móvil, cálculo km, precios ingresados por usuario, flota local/CSV/borrado, propuestas B2B, equipo.
- \`cd backend && python -m pytest -q tests\`: backend y proveedor desconectado por defecto.
- **No afirmar resultado de CI hasta comprobar GitHub Actions del último SHA.** No hubo integración de nuevas API ni pruebas en vivo de registros oficiales.
- La operación comercial con contratos, pagos, fuentes privadas o datos sensibles **no está habilitada**; los términos y privacidad siguen en borrador sujeto a revisión jurídica.

### Coordinación
PR #2 cerrado sin merge; PR #4/#5/#6/#7 permanecen independientes, con issue #1 como canal de coordinación de Antigravity. No alterar ramas ajenas, secretos, forzar push ni fusionar cambios con CI rojo.

---

## Etapa 2026-11-02 — marketplace B2B autenticado y catálogo público condicional

**Rama:** `agent/marketplace-api-20261102`. Base: `main` en commit `de508dffda061e0e190bea82bd2310db803f6941`. PR: [#12](https://github.com/sandylazo1/NURVO-web/pull/12). No se editaron PR #4/#5/#6/#7 ni la rama de Antigravity.

### Código añadido
- `backend/app/marketplace.py`: router FastAPI habilitable, SQLite con `products`, `quotes`, `audit`; roles `admin`, `supplier`, `buyer`, `workshop`, `fleet`; claves B2B de alta entropía autenticadas frente a hashes SHA-256 almacenados solo en configuración de servidor.
- Creación/actualización de productos por proveedor identificado. SKU y fuente HTTPS obligatorios; condición y familia validadas. Publicación únicamente bajo permiso administrativo y revisión interna referenciada. Cambiar stock/precio revierte estado a `pending`; consultas públicas solo fichas publicadas con última declaración no anterior a 30 días.
- Solicitudes de cotización B2B por producto publicado, con cantidad y respuesta del proveedor propietario. Sin nombre, RUT, VIN, patente, pago, pedido, reserva ni facturación. Aislamiento por empresa y control de autorización por objeto en todas las lecturas/escrituras de cotización.
- `GET /api/marketplace/metrics`: solo administrador; conteos internos agregados de productos y cotizaciones, NO ventas ni ingresos.
- `catalogo.html`, `assets/catalogo.js`, `assets/catalogo.css`: catálogo público de solo lectura que muestra **sin backend habilitado** por defecto; si hay backend conectado, resultados con fuente, marca, SKU, familia, condición, precio/stock declarado, fecha, garantía informada y aviso de compatibilidad sin verificar.
- Enlaces desde `index.html`, `ecosistema.html`, `vin.html`, `gestion.html`, `alianzas.html`, `equipo.html`. Actualizados README, backend README, privacidad y matriz de integraciones.
- `backend/tests/test_marketplace.py`: pruebas sin datos reales de proveedores, aislamiento tenants, rechazo de claves y roles ilegítimos, filtros, fuentes no seguras, publicación, flujo de cotización, anti-BOLA/IDOR y métricas. `tests/catalogo.mjs` + Chromium con respuesta simulada **solo para QA**, test de XSS y móviles.
- `docs/MARKETPLACE_API_CONTRACT.md`: activación segura paso a paso, contrato, roles, arquitectura y barreras legales.

### Verificación inicial
- CI [#41551089951](https://github.com/sandylazo1/NURVO-web/actions/runs/41551089951) del commit inicial `e1308cb`: **3/3 success**, confirma API B2B y pruebas Python sin afectar el sitio anterior.
- CI [#41552029799](https://github.com/sandylazo1/NURVO-web/actions/runs/41552029799): backend **15 passed, 1 warning** (deprecación no bloqueante), frontend estático aprobado. Las ejecuciones posteriores verifican el catálogo estático y navegador; antes de fusionar debe constar el run verde del **último commit de esta rama**.
- La base nueva del marketplace y las ofertas actuales están **vacías**. Las credenciales y convenios no existen ni se han provisto. No se ha ejecutado un proveedor real, servicio de pagos ni consulta gubernamental.
- No se realizaron pruebas de penetración externas; pruebas de seguridad funcional y revisión de código **no equivalen a certificación**.

### Restricciones y puertas de producción
1. `NURVO_MARKETPLACE_ENABLED=false` por defecto y `NURVO_MARKETPLACE_KEYS_JSON` vacío. Ningún secreto en Pages, commit o documentos. El backend requiere hosting HTTPS separado.
2. Proveedores B2B deben firmar acuerdos, documentar importación/identificación, origen de piezas, términos de garantía, condición, stock, IVA y vigencia. Una publicación administrativa no acredita genuinidad ni compatibilidad mecánica.
3. No publicar ni automatizar Registro Civil, Carabineros, Auto Seguro, datos de flotas, acuerdos OEM o precios de terceros sin derecho de acceso y licencias.
4. Antes de transacciones: identidad legal del operador, términos y privacidad revisados, control de identidad de consumidores, órdenes, devoluciones/reclamos, facturación e integración con PSP/SII, pruebas de seguridad, tasa de solicitudes y backups.
5. Ley 21.719 entrará en vigencia el **1 de diciembre de 2026**. Al 02-11-2026 no se afirma certificación ni cumplimiento total; se deben determinar roles jurídicos, bases, conservación y derecho de los titulares antes de captar datos.
6. GitHub Pages aloja exclusivamente HTML/CSS/JS; **no ejecuta FastAPI**.
