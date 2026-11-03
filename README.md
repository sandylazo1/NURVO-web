# NURVO · Tu auto, bajo control

Sitio público: https://sandylazo1.github.io/NURVO-web/

## VIN, precios y talleres (rama de revisión)
- Herramienta estática en `vin.html`: decodificación pública NHTSA vPIC de VIN estandarizados, sin pedir año obligatorio. Cobertura principal 1981 en adelante; chasis antiguos permiten registro manual **sin inventar identificación**.
- En GitHub Pages, la consulta pública NHTSA se intenta desde el navegador; si CORS, conectividad o límites del servicio lo impiden, se muestra error y enlace a la fuente oficial, no un resultado ficticio. El backend FastAPI existente requiere alojamiento independiente.
- Cotizaciones/precios ingresados y fechados por el usuario, guardados solo en navegador y **no verificados por NURVO**. No hay feed de precios/stock en vivo ni red comercial afirmada.
- Lista orientativa de mantenimiento y búsqueda externa de talleres por ciudad/comuna (sin afirmar acuerdos o disponibilidad).
- Registro Civil y Auto Seguro/Carabineros: solo enlaces a trámites oficiales. No hay conexión a registros protegidos ni consulta automatizada con credenciales. Se requiere convenio, permiso técnico y backend separado.
- Pruebas: `node tests/vin.mjs`; las existentes siguen ejecutándose.

## Ecosistema automotriz y protección del usuario (02-11-2026)
- [Ecosistema](ecosistema.html): repuestos genuinos/OES/alternativos/remanufacturados/usados; categorías mecánicas y accesorios sin compatibilidades o inventarios ficticios.
- Generador local de solicitud de cotización que alerta por piezas críticas, garantía, repuestos aportados, arrendados/carsharing, flotas privadas y compras públicas.
- Búsqueda externa de talleres; NURVO no afirma que algún taller acepte cualquier repuesto sin confirmación.
- [Términos y condiciones](terminos.html) y [privacidad](privacidad.html) son **borradores jurídicos que requieren identificar operador y revisión profesional** antes de registrar clientes/pagos.
- Análisis: [cumplimiento Chile](docs/COMPLIANCE_CHILE_2026.md), [ciberseguridad](docs/CYBERSECURITY_ASSESSMENT.md), [mercado y alianzas](docs/MARKET_PARTNERSHIPS_CL.md), [integraciones](docs/INTEGRATIONS_MATRIX.md).
- No hay convenios reales con marcas ni Awto, hospitales o Carabineros, ni fuentes de precio/stock conectadas. Solo el VIN público NHTSA se consulta desde el navegador en la herramienta existente; Registro Civil y Auto Seguro son enlaces externos.

## Expansión del sitio web · equipo, mantenimiento, flotas y alianzas
- [Equipo](equipo.html): Rafael Vester — CEO, ingeniero mecánico y socio mayoritario proyectado; Tomás Venegas — Founder y Consultor del Departamento de Negocios; Sandy Lazo — Co-Founder, Product Management y Consultora del Departamento TI. La distribución societaria y derechos de autor **no se presumen formalizados**.
- [Mi mantenimiento y flotas](gestion.html): cálculo con intervalos aportados por el manual, comparación numérica de dos presupuestos y registro local anónimo de hasta 25 unidades con exportación CSV / eliminación. Sin sincronización, datos de matrículas o acceso institucional.
- [Alianzas](alianzas.html): esquema B2B/B2B2C y generador local de propuesta comercial, sin envío ni contratos reales.
- Navegación conectada desde portada, ecosistema, VIN y páginas jurídicas; diseño responsive consistente.
- Pruebas `node tests/expansion.mjs` y Playwright con cálculo y flujo local verificados en CI.
- No reemplaza el backend FastAPI ni constituye conexión oficial a Registro Civil, Carabineros, talleres, fabricantes o catálogos privados.

## Catálogo comercial B2B (2026-11-02)
- [Catálogo con procedencia](catalogo.html): consulta pública **solo si existe backend comercial, proveedores autorizados y fichas revisadas**. GitHub Pages mantiene un estado vacío honesto cuando no hay API o contratos.
- FastAPI `backend/app/marketplace.py`: catálogo SKU/referencia OEM/familia (incluidos accesorios)/condición/precio/stock declarados, revisión antes de publicar, roles de empresa, solicitudes de cotización B2B sin pago y métricas agregadas administrativas. **Deshabilitado por defecto**, no desplegado en Pages.
- Seguridad: credenciales privadas exclusivamente para clientes B2B servidor-servidor, hashes SHA-256 y tokens aleatorios de alta entropía, tenant isolation, auditoría sin PII, validación de enlaces, consulta paginada y pruebas de autorización.
- El producto mostrado **no certifica originalidad, compatibilidad ni stock**. No hay convenios de fabricantes, pagos, cuentas de usuario, reservas ni ventas verificadas.
- Detalles, endpoints, requisitos y despliegue seguro: [Contrato API marketplace](docs/MARKETPLACE_API_CONTRACT.md).

## Qué funciona
- Catálogo editorial de 8 familias de repuestos, fotografías referenciales con alternativa interactiva al pasar el cursor y botón táctil.
- Búsqueda por texto, filtros por familia y orden alfabético.
- Lista persistente en el navegador, edición de cantidades, solicitud descargable y copiable, más enlaces a proveedores reales.
- Comparación de familias y características **sin precios inventados**.
- Asistente de orientación por patente ingresada, año, marca, modelo, kilómetros, motorización, uso y síntomas. Permite descargar orientación, derivar a repuestos y guardar en el garaje.
- Garaje digital e historial local de mantenciones con fecha, kilometraje y marcado de tareas.
- Formulario B2B que descarga una solicitud; **no la envía**.
- Navegación responsive, carruseles, movimiento reducido y controles de accesibilidad.

## Modelo comercial y límites
NURVO es un **intermediario informativo** en esta versión. No vende piezas, no fija precios, no confirma stock, no realiza pagos ni dispone de acuerdos declarados con los proveedores enlazados. Los enlaces son externos y no representan afiliaciones.

La patente es un identificador proporcionado por el usuario: no se consulta automáticamente ningún registro. Las orientaciones dependen de los datos suministrados, no son diagnóstico médico/mecánico ni compatibilidad certificada. Para identificar un vehículo automáticamente se requiere una API legalmente autorizada, una clave protegida en un backend y permisos adecuados. Una API con clave **no debe invocarse directamente desde GitHub Pages**.

Los datos del garaje y la lista se almacenan solo en `localStorage`; sin cuenta, sincronización ni servidor.

## Tecnología
HTML, CSS y JavaScript sin framework ni compilación; GitHub Pages despliega directamente `index.html`. Las interacciones se implementaron con CSS y APIs web nativas, inspiradas en estilos de motion UI; **React Bits no está instalado** (requiere infraestructura React y build).

Para validar la estructura y el JavaScript:
```sh
node tests/smoke.mjs
```

## Fotografía
Las fotografías referenciales del catálogo se cargan desde Pexels. Su licencia permite uso comercial y no exige atribución. No representan el SKU que vende una tienda. Las imágenes editoriales adicionales provienen de Unsplash. Revisar derechos de marcas reconocibles y condiciones de uso antes de campañas publicitarias.

Licencias:
- https://www.pexels.com/license/
- https://unsplash.com/license

## Evolución recomendada
1. Acuerdos con talleres, repuesteras y distribuidores; carga de inventario/precios desde ellos, no desde NURVO.
2. Backend seguro de cotizaciones, consentimiento y tratamiento de datos.
3. Integración licenciada de patente → vehículo y VIN/versión; jamás fingir resultados.
4. Base de datos con vehículos, motorización, OEM y compatibilidad autorizada.
5. Seguimiento de solicitudes, comparación de cotizaciones y comisiones por transacción o lead.
6. Analítica respetuosa de privacidad y pruebas end-to-end en navegadores.

## Identidad
Paleta NURVO: `#0B1F3B`, `#E10600`, `#FFFFFF`, `#E5EAF2`. Montserrat para titulares e Inter para interfaz. El logotipo se integra como imagen PNG transparente incrustada en `index.html`, no como SVG.
