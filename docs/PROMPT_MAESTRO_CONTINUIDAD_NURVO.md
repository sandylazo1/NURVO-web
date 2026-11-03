# NURVO — PROMPT MAESTRO DE CONTINUIDAD Y VALIDACIÓN DEL PRODUCTO

**Versión:** 2 de noviembre de 2026  
**Repositorio:** https://github.com/sandylazo1/NURVO-web  
**Regla:** antes de implementar, lee `README.md`, `QA_REPORT.md`, `docs/VIN_GUIDE_CHILE.md`, `docs/MARKETPLACE_API_CONTRACT.md`, `docs/COMPLIANCE_CHILE_2026.md` y `docs/TEAM_GOVERNANCE_NURVO.md`.

## Rol del agente ejecutor

Actúa como equipo senior de ingeniería mecánica, producto/UX, seguridad/privacidad, frontend, FastAPI, integración de datos autorizados, QA, DevOps, comercial y derecho del consumidor de Chile.

**Equipo NURVO**: Rafael Vester — CEO, ingeniero mecánico y socio mayoritario proyectado; Tomás Venegas — Founder y Consultor Departamento de Negocios; Sandy Lazo — Co-Founder, Product Management y Consultora del Departamento TI. Los porcentajes, contratos y cesiones no se presumen.

**Objetivo final:** avanzar hacia marketplace B2C/B2B/B2B2C para identificación, mantenimiento, repuestos genuinos/OES/alternativos/remanufacturados/usados, talleres, flotas y cotizaciones, preservando el carácter verificable de toda afirmación.

## Trabajo ya ejecutado y que NO debe duplicarse

1. Frontend de NURVO en Pages con categorías, directorio, cotizaciones informativas, equipo, mantenimiento manual, flotas locales y propuesta B2B.
2. API FastAPI separada, opt-in para inventarios y cotizaciones B2B, deshabilitada sin contratos ni credenciales.
3. Página VIN con diagrama SVG original de ubicaciones, enlaces chilenos, entrada moderna de 17 caracteres, modo chasis antiguo, validación inmediata y grupos WMI/VDS/VIS.
4. NHTSA vPIC para decodificación pública voluntaria; NURVO no afirma acceso a Registro Civil ni Carabineros.
5. Ficha de compatibilidad en memoria: marca/modelo disponibles, motor y versión declarados, tipo de pieza, código OEM aportado; copia con VIN oculto por defecto y opción explícita de compartirlo completo.
6. QA automatizado del frontend/Chromium/Python, docs de seguridad, privacidad, mercados y regulación.

## Tareas siguientes por prioridad

### P0 — Comercialización autorizada de primer proveedor
- Obtener acuerdo, alcance, SLA, fuentes licenciadas, derechos de marca/uso de datos, condiciones de IVA, facturación, stock y garantías.
- Adaptar API proveedor de inventario con token exclusivamente de servidor, firma de datos, timestamps, límites de API y revisión antes de publicar.
- **No** crear precios, stock o reputaciones ficticias.
- Validar entre 2 y 5 talleres pilotos con evidencia documental y política sobre piezas aportadas por usuarios.

### P1 — Compatibilidad técnica validada
- Construir adaptador de fitment con catálogo OEM licenciado y especificaciones por versión/motor/configuración/mercado.
- Devolver `desconocido` si falta una fuente. Diferenciar descripción NHTSA, declaración del usuario, publicación del proveedor y verificación profesional.
- Comprobar homologación, seguridad y restricciones de repuestos críticos con ingeniero responsable.
- Pruebas de incompatibilidad intencional y flujos para números de chasis antiguos.

### P2 — Orden de servicio y postventa
- Diseñar roles por vendedor/intermediario/taller, flujos presupuesto→aceptación→orden de trabajo→entrega y reclamo con trazabilidad.
- Garantía legal y voluntaria diferenciadas, política por marca según documentos, sin renuncia de derechos irrenunciables.
- Integrar pagos, comprobantes SII y devoluciones **solo cuando** exista operador legal identificado y PSP contratado.
- No usar interfaz de compra confirmada antes del backend y pruebas de producción.

### P3 — Flotas B2B y B2B2C
- Multi-tenant autenticado y con permisos granulares, auditoría, backups y políticas de conservación.
- Convenios expresos para leasing, arriendo/carsharing, instituciones y compras públicas.
- Nunca publicar rutas/ubicaciones/identificadores de ambulancias, patrullas u otros vehículos sensibles.

### P4 — Ciberseguridad y datos
- Revisar OIDC/autenticación de usuarios, MFA interno, separación de organizaciones, gestión de secretos, CSRF/IDOR/SSRF/XSS, gateway y análisis de dependencias.
- Aplicar Ley 19.628 vigente y prepararse para la reforma Ley 21.719 desde 01-12-2026, con revisión jurídica de bases, finalidades, contratos, incidentes y derechos.
- Restringir APIs oficiales al alcance autorizado; sin scraping que burle CAPTCHA, portales privados ni bases del Registro Civil o Carabineros.

### P5 — QA, puesta en producción y medición
- Crear rama propia; inspeccionar los PR abiertos de Antigravity antes de editar; no pisarlos.
- Ejecutar Node (smoke/VIN/ecosistema/expansión/catálogo), Python pytest, Chromium desktop/móvil y pruebas de accesibilidad.
- Registrar SHA, runs, capturas, fallos y correcciones en `QA_REPORT.md`.
- No fusionar si cualquier trabajo CI está rojo. No force push, no secretos en GitHub Pages, no prometer que FastAPI ejecuta ahí.
- Medir solo KPIs de operaciones reales con fuente: solicitudes, respuestas, incompatibilidades, reclamos, margen, retención y tiempos. No llamar a solicitudes o métricas de prueba «ventas».

## Criterios obligatorios para declarar terminado un módulo
- Cambios verificables en rama; prueba funcional real y de seguridad según criticidad.
- Fuente legal/técnica citada, con fecha de revisión.
- Estados `sin_fuente`, `pendiente`, `confirmado` y advertencias explícitos.
- No inventar datos, convenios, acuerdos de autoría/acciones, precios ni verificaciones vehiculares.
- URL pública verificada cuando corresponde; Github Pages puede estar publicado aunque el backend esté apagado.
- Registro de lo implementado, limitaciones y responsable del siguiente paso.

**Instrucción de ejecución:** empieza por leer el código real y el último CI. Haz primero el trabajo que tenga dependencias disponibles, no simules las que requieren contratos ni credenciales. Conserva la experiencia de NURVO y prueba antes de fusionar.
