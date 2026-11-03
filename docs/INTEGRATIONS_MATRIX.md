# NURVO — Integraciones y estados reales (02-11-2026)

| Fuente | Tipo | Estado verificable en NURVO | Permiso/acción requerida |
|---|---|---|---|
| NHTSA vPIC | Datos de fabricante por VIN estandarizado | **Integración pública directa en vin.html**: consulta del navegador; puede fallar CORS/cobertura, no Registro Civil | No exponer secretos; informar comunicación a NHTSA, probar en producción |
| Registro Civil Chile | Padrón, inscripciones, anotaciones, alteraciones | **Sin conexión automática**; solo enlace a trámite | Procedimiento legal/credenciales oficiales y finalidad autorizada; nunca bypass |
| Auto Seguro / Carabineros | Consulta encargo vehicular | **Sin integración**; solo enlace externo | Convenio/API autorizada si existe, sin inferir "sin encargo" |
| SERNAC | Alertas seguridad/recalls | **Enlace a fuente pública** | Automatizar solo si hay feed/API y condiciones de reutilización verificadas |
| Nissan Chile | Recall, política de mantenciones | **Enlace a portal oficial** | Para automatizar VIN o políticas individuales: autorización/licencia |
| Ford, Volkswagen, Hyundai, Derco, Toyota, Chevrolet, etc. | Catálogos, compatibilidad y garantías marca | **Sin acuerdos ni API** | Negociación con titular/importador; revisar póliza por vehículo |
| ANAC | Rankings de mercado | **Lectura de informes oficiales enlazados** | Publicar datos agregados con fuente/fecha y condiciones de reuso |
| ChileCompra / Mercado Público | Registro, licitaciones/contratos públicos | **Enlace externo**, no contratación directa | Habilitación/proceso de compra; API solo según acceso/términos |
| Google Maps | Búsqueda de talleres | **Enlace externo generado tras acción del usuario** | No usar Places API ni afirmar rating, certificación o política sobre repuestos |
| Repuesteras chilenas | SKU, precios/stock, proveedores | **API propia B2B implementada pero deshabilitada; ningún feed/proveedor real conectado** | Contrato/licencia, credenciales de servidor, inventario firmado/fechado, revisión manual, impuestos, origen, disponibilidad |
| Awto y otras arrendadoras | Flotas de carsharing | **Sin contrato ni acceso** | Acuerdo de operador, autorización, política reparación y privacidad |
| Proveedores de mantenimiento público | Flotas hospitalarias, policiales y municipales | **Sin contrato ni acceso** | Ley de compras, contrato, controles específicos, confidencialidad |

## Regla de interfaces
Nunca publicar una tarjeta comercial como "aliado", "precio real", "original garantizado", "compatible", "sin encargo", "sin multas" o "taller certificado" sin evidencia verificable específica, fuente, fecha y derechos de uso. \`HTTP 200\` o un campo vacío no prueba estado oficial. Evitar que datos de clientes terminen en terceros sin base jurídica y documentación.

## Próximas integraciones técnicas
- Prototipo API FastAPI alojado fuera de GitHub Pages bajo TLS, autenticación/roles, rate limits y logs minimizados.
- Adaptadores de catálogo permitidos y controlados por proveedor; validación estricta y registro de sincronización.
- Datos multi-tenant con controles de autorización y pruebas de aislamiento; contratos de encargo de datos.
- Convenios de marca: definición de SKU, condiciones de uso de marca, garantía, catálogo, recall y trazabilidad.
- Antes de conectar fuentes gubernamentales, tramitar oficialmente permisos y alcance; no automatizar consultas en portales con autenticación/CAPTCHA.
