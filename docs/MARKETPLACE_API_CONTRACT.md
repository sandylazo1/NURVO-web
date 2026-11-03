# NURVO — Contrato técnico del marketplace B2B y puerta de activación

Estado de desarrollo: 2026-11-02. **Código implementado, NO servicio comercial desplegado.** Este documento describe el diseño de FastAPI para proveedores y compradores B2B. GitHub Pages continúa alojando solo páginas estáticas.

## 1. Alcance real

- Catálogo multiempresa con SKU, nombre, marca, referencia OEM opcional, condición declarada, referencia de aplicación no verificada, precio CLP, cantidad declarada, fuente HTTPS y resumen de garantía aportados por proveedor.
- Acceso B2B **servidor a servidor** bajo API key de alta entropía. Solo se almacenan hashes SHA-256 de las claves en variables del servidor; ninguna clave en JavaScript del navegador, en el repositorio ni en páginas públicas.
- Separación por organización (tenant_id), roles `admin`, `supplier`, `buyer`, `workshop`, `fleet`. El rol `admin` publica fichas tras revisión documental interna, **no certifica origen/compatibilidad/stock**.
- Cambiar la ficha de un proveedor revierte automáticamente su publicación a `pending`, hasta nueva revisión.
- Compradores B2B pueden solicitar una cotización sobre una ficha publicada y vigente; el proveedor correspondiente la responde, sin pago, facturación, reserva, agenda ni aceptación contractual automáticas.
- Logs de auditoría técnicos sin nombres, RUT, direcciones, correos, VIN, patentes ni tokens.
- La página pública `catalogo.html` hace solo GET al backend cuando `config.js` tiene un URL HTTPS; si está vacío o el backend no está habilitado, muestra un estado sin productos, nunca ofertas ficticias.

## 2. No implementado: limitaciones importantes

- **No hay** contrato firmado de proveedores, compra/reserva, checkout, integración SII, facturación, pago PSP, sistema de reclamos, logística, mensajería, usuario final con identidad, sesión ni pasarela de pago.
- **No hay** adaptadores contratados para datos OEM/fitment, Registro Civil, Carabineros, marca, precio/stock de terceros o flotas de Awto/hospitales.
- El campo `oem_reference` se declara por proveedor; NO valida que una pieza encaje en cualquier vehículo ni prueba originalidad, garantía de fábrica o trazabilidad.
- Las organizaciones en tests son **sintéticas**; el sistema de producción permanece deshabilitado hasta autorizar cada proveedor.
- No se recomienda habilitar esto directamente frente a clientes hasta que haya contratos, asesoría de consumo/privacidad, hosting seguro, controles de operación y pruebas independientes.

## 3. Activación backend privado (operación futura)

1. Contratar y verificar proveedor y comprador. Definir obligaciones, garantías, procedencia, fuente de precios, stock, SII, tratamiento de datos, devoluciones y revisión mecánica.
2. Desplegar FastAPI fuera de GitHub Pages, con HTTPS terminado en proxy confiable y base de datos persistente; respaldos, monitoreo y controles de acceso/seguridad. Un único SQLite puede servir para piloto controlado, no sustituye infraestructura de alta disponibilidad o multiempresa a escala.
3. Generar **una clave aleatoria distinta por organización y rol**, mínimo 32 bytes de entropía. Ejemplo de generación local (no enviar la clave a terceros):
   ```python
   import secrets, hashlib
   key = secrets.token_urlsafe(48)
   digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
   print("HASH PARA SECRET MANAGER:", digest)
   # Guarda key privadamente para el cliente B2B; no se imprime ni guarda en código fuente.
   ```
4. Colocar, **solo en secretos del hosting**, las variables:
   ```env
   NURVO_MARKETPLACE_ENABLED=true
   NURVO_MARKETPLACE_KEYS_JSON={"<SHA256_DEL_TOKEN_1>":{"tenant_id":"proveedor-uno","role":"supplier"},"<SHA256_DEL_TOKEN_2>":{"tenant_id":"comprador-uno","role":"buyer"},"<SHA256_DEL_TOKEN_3>":{"tenant_id":"nurvo-admin","role":"admin"}}
   ```
   Esta estructura es un **ejemplo de esquema**, no claves funcionales. El backend falla cerrado si falta configuración o si el JSON de roles es inválido.
5. El cliente B2B autorizado, en entorno controlado, usa cabecera `X-NURVO-Key` con su token privado. Nunca ponerla en una web pública ni en `config.js`. Rotar/revocar mediante secretos del servidor y reinicio planificado.
6. Revisar expediente del proveedor y aprobar la publicación mediante rol admin y una referencia interna a la revisión. No sustituye una verificación legal/técnica.
7. Solo entonces configurar `window.NURVO_API_BASE_URL = "https://api.tudominio.cl";` en `config.js`. Es URL pública del backend, **sin credenciales**; habilitar CORS GET explícito y comprobar Pages en navegador real.
8. No aceptar solicitudes POST con tokens desde el browser del consumidor. Para futura autogestión, crear autenticación de usuarios, roles finos, controles CSRF, consentimiento y una capa web autenticada.

## 4. Endpoints

| Método | Ruta | Acceso | Contrato |
|---|---|---|---|
| GET | `/api/marketplace/status` | público | Informa deshabilitado/conectado, límites y ausencia de checkout |
| GET | `/api/marketplace/products` | público cuando habilitado | Hasta 50 fichas por página, solo publicadas y con actualización no anterior a 30 días, campos con avisos no verificados |
| POST | `/api/marketplace/products` | supplier | Alta/actualización de SKU propio; siempre queda `pending` |
| GET | `/api/marketplace/my/products` | supplier | Solo registros de su `tenant_id`, máximo 100 |
| POST | `/api/marketplace/products/{id}/publish` | admin | Publicación tras documentación interna y referencia de revisión |
| POST | `/api/marketplace/quotes` | buyer/workshop/fleet | Solicitud B2B de cantidad para producto publicado y reciente, sin información personal |
| GET | `/api/marketplace/quotes` | buyer/workshop/fleet/supplier | Solo cotizaciones del tenant comprador o proveedor, sin visibilidad cruzada |
| POST | `/api/marketplace/quotes/{id}/respond` | supplier asignado | Cotización CLP, plazo de vigencia y resumen de garantía; respuesta única |
| GET | `/api/marketplace/metrics` | admin | Conteos agregados reales de fichas/cotizaciones; nunca ingresos o ventas cobradas |

**Regla de seguridad:** `id` no sirve como autorización. Cada consulta o mutación verifica el tenant/rol asociado a la credencial; se ejercitan controles BOLA/IDOR en `backend/tests/test_marketplace.py`.

## 5. Casos representativos de flujo

**Proveedor autorizado:** servidor B2B llama a POST productos con `X-NURVO-Key` válido, SKU y URL HTTPS de fuente propia → la ficha queda `pending` → admin revisa documentos/contrato y publica → público ve precio/stock **declarado**, con fecha, garantía y advertencias. Sin revisión, sigue oculta.

**Comprador autorizado:** solicita cotización del producto publicado → proveedor asignado recibe solo las solicitudes de su tenant → responde con importe total CLP y plazo → comprador ve respuesta. NURVO no cobra ni confirma reserva.

**Producto modificado:** se actualiza precio o stock → visibilidad vuelve a pendiente, se solicita nueva revisión. Cotizaciones previas históricas no son actualizadas ni constituyen un nuevo pedido; el proveedor debe respetar las obligaciones contractuales aplicables.

**Proveedor no contratado:** no existe credencial válida, por tanto HTTP 401/403 o 503 cuando el servicio está deshabilitado. No se crea oferta automáticamente.

## 6. Calidad y ciberseguridad

- Pruebas de backend: `python -m pytest -q backend/tests` (desde `backend/`: `python -m pytest -q tests`), incluyendo roles, tenant isolation, abuso de IDs, condiciones fraudulentas, validación de URL y expiración de cotizaciones.
- Pruebas estáticas frontend `node tests/catalogo.mjs` y navegador Chromium: estado sin backend, datos sintéticos interceptados para QA, neutralización de HTML malicioso y experiencia móvil.
- SQL parametrizado con claves foráneas, índices por tenant, consulta paginada y una pista de auditoría de eventos de negocio sin datos personales.
- API protegida por limitación de 60 solicitudes/h por IP en memoria (compartida con otros endpoints existentes). Para producción: control per token y por IP en proxy, bloqueo de bots, token rotation, monitoreo y centralización de eventos.
- **Control operativo pendiente:** no usar credenciales B2B en Pages; revisar cabeceras TLS, certificados, CORS, gateway, logs, rotación, cifrado de base y copias de seguridad.
- **Control de publicación pendiente:** acreditar proveedor, derechos de uso de marca, autenticidad cuando proceda, validez del precio, IVA, condición del producto, reclamos y garantía.
- **Control contractual pendiente:** identidad del operador NURVO, políticas de cancelación, responsabilidades según rol real y proceso de reclamos sin renuncia de derechos.
- [OWASP API Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/): controles de autorización objeto, autenticación, autorización de campos, consumo de recursos y SSRF.
- [Ley 21.719](https://www.bcn.cl/leychile/Navegar?idNorma=1209272): entrada en vigor el 01-12-2026; revisar bases legales y obligaciones concretas antes de almacenar datos de titulares. No declara cumplimiento certificado.

## 7. Puertas para operar comercialmente

- [ ] Razón social, RUT, correo y responsable legal NURVO confirmados; términos y política contractual revisados por abogado chileno.
- [ ] Contratos de venta/intermediación y tratamiento de datos firmados con cada proveedor.
- [ ] Primer catálogo licenciado recibido, SKU/referencias y origen auditados; piloto sin datos ficticios.
- [ ] Backend y base de datos hospedados de forma segura y probados bajo HTTPS; plan de backups e incidentes.
- [ ] Cumplimiento técnico de leyes de tránsito, consumo y garantías por categoría (especialmente piezas de seguridad).
- [ ] Pipeline de órdenes de trabajo, facturación SII y PSP con separación de responsabilidades antes de cobrar.
- [ ] Métricas sustentadas en transacciones reales: conversión, cancelación, incompatibilidad, reclamos y margen.
