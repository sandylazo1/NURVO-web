# NURVO · Tu auto, bajo control

Sitio público: https://sandylazo1.github.io/NURVO-web/

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
