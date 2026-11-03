# Guía VIN y número de chasis para NURVO (Chile)

**Fecha:** 2 de noviembre de 2026. **Estado:** implementación informativa de identificación de vehículos y evaluación de riesgos, no registro ni certificado de compatibilidad. Este documento permite a producto, TI, mecánica y Negocios explicar qué verifica la aplicación y qué depende de fuentes autorizadas.

## 1. Qué es y cómo encontrarlo

El VIN (Vehicle Identification Number) es un identificador alfanumérico del vehículo. En el estándar moderno usado por NHTSA, típicamente tiene **17 caracteres** y no contiene las letras **I, O ni Q**. El VIN no equivale a la patente chilena ni al número de motor. En automóviles antiguos puede existir un número de chasis de longitud variable que no es decodificable mediante la base vPIC.

Ubicaciones habituales, siempre condicionadas al fabricante:
1. **Panel, junto a la base del parabrisas:** mirar desde fuera, hacia el lado del conductor, cerca de la esquina inferior del vidrio.
2. **Marco/pilar de puerta:** abrir la puerta del conductor y buscar la placa o etiqueta de identificación del vehículo.
3. **Compartimento del motor, estructura o chasis:** el grabado puede estar en zonas diferentes; se recomienda consultar el manual antes de remover paneles o tocar zonas mecánicas.
4. **Documento de inscripción chileno (padrón):** el certificado del Registro Civil informa VIN y chasis, además del número de motor; puede requerir identificación y trámites oficiales. No pedir a la persona que publique todo el padrón o los datos del propietario.

El diagrama implementado en \`vin.html\` es una ilustración SVG original e indicativa. No representa ubicación homologada en todas las marcas.

**Fuentes públicas:**
- ChileAtiende — [certificado de inscripción / padrón](https://www.chileatiende.gob.cl/fichas/3412-certificado): informa número de motor, chasis y VIN.
- Auto Seguro — [consulta y guía de identificación](https://www.autoseguro.gob.cl/): explica ubicaciones y precauciones de clonación; no es API autorizada de NURVO.
- NHTSA — [página oficial VIN](https://www.nhtsa.gov/vin-decoder) y [vPIC](https://vpic.nhtsa.dot.gov/): decodificador estadounidense de datos reportados por fabricantes.
- NHTSA — [información vPIC](https://vpic.nhtsa.dot.gov/): cobertura primordial para años modelo **1981 en adelante**, posibles limitaciones en vehículos producidos para Chile.

## 2. Identificación moderna versus antigua

| Situación | Comportamiento NURVO | Límite |
|---|---|---|
| VIN moderno con 17 caracteres válidos | Vista en vivo de longitud y grupos WMI (1–3), VDS (4–9), VIS (10–17); consulta NHTSA exclusivamente al pulsar el botón | Formato plausible **no prueba existencia**. No se exige año |
| VIN de 17 caracteres con I, O, Q o guion | Error de transcripción antes de llamar a NHTSA; el usuario puede optar por modo antiguo si realmente corresponde | No corregir silenciosamente confusiones que puedan cambiar el código |
| Número de chasis antiguo/no estándar | Registro **solo en memoria local** de la sesión, con advertencia de ausencia de decodificación | No inferir marca/modelo/año ni situación registral |
| Año conocido anterior a 1981 | Se evita la consulta automática a NHTSA | El dato de año lo aportó el usuario y no se ha verificado |
| NHTSA responde incompleto o falla | Mostrar error/advertencia y enlace a fuente externa | Nunca presentar resultados incompletos como identificación confirmada |
| Identificador de vehículo distinto entre placa y padrón | Recomendar verificación oficial y mecánica competente | No declarar clonación ni adulteración por algoritmos |

**Nota:** el dígito de control del VIN puede depender de reglas del mercado, y el décimo carácter del VIS no define por sí solo un año inequívoco para todas las regiones/ciclos. NURVO no utiliza estas heurísticas como prueba de identidad o compatibilidad.

## 3. Consentimiento y minimización de VIN

- La guía y la validación de formato trabajan sin enviar datos.
- VIN y año **solo se transmiten a NHTSA** al pulsar voluntariamente «Consultar». El envío a un servicio estadounidense es externo al registro chileno.
- Campos opcionales de motor/versión declarados por el usuario no se envían a NHTSA.
- La ficha orientativa para solicitar repuestos se compone localmente y se copia con el identificador **oculto por defecto** (\`••••4352\`, por ejemplo). Compartir el VIN completo exige marcar casilla específica y pulsar «Copiar ficha».
- No se guardan VIN ni datos de motor en localStorage ni en el repositorio. La sección de cotizaciones existente **sí** puede guardar precios/proveedores aportados por el usuario en localStorage, independientemente de la consulta VIN.
- «Limpiar datos VIN» borra campos, ficha y resultados actuales del navegador; no puede recuperar una consulta que ya se envió a NHTSA ni borrar contenido copiado al portapapeles. Se advierte expresamente en \`privacidad.html\`.
- No enviar VIN como parámetro URL entre páginas. No hacer consultas automáticas al cargar la web. No usar el VIN como búsqueda encubierta de dueño.

## 4. Compatibilidad y oferta de repuestos

La decodificación de un VIN mediante NHTSA puede retornar marca, modelo, año aproximado para el mercado y características informadas por fabricante; no es un servicio de **fitment OEM homologado en Chile**. Aun si la marca y el año están disponibles, falta determinar el motor real, código OEM, versión de equipamiento, transmisión, dimensiones, restricciones de instalación y seguridad.

Para declarar compatibilidad real se requiere:
1. Fuente OEM o catálogo con licencia comercial; referencia de parte y aplicaciones verificables.
2. Identificación suficiente de motorización/versión y cambios por año/planta/lote; evaluación humana en sistemas críticos.
3. Reglas de trazabilidad, procedencia, garantía legal/voluntaria, homologación y revisión técnica aplicable.
4. Una evidencia por oferta/compatibilidad con fuente, fecha, responsable de confirmación y estatus específico. No inventar \`compatible=true\` por 17 caracteres.
5. Autorización del propietario/operador cuando vehículo es arrendado, de carsharing, de flota empresarial o institucional.

El botón de catálogo en la ficha VIN abre el directorio comercial sin enviar ni guardar automáticamente el identificador. Si no existe inventario contratado o backend en operación, el catálogo muestra «sin backend conectado».

## 5. Estados y fuentes de Chile

- **Registro Civil:** no existe integración directa autorizada con NURVO. Padrón, anotaciones, limitaciones y otras verificaciones deben consultarse por canal oficial.
- **Auto Seguro/Carabineros:** no existe una API conectada; un VIN de formato correcto no significa «sin encargo».
- **Recalls:** verificar por fabricante o fuente oficial de alertas para mercado, fecha/lote y VIN cuando sea aplicable. NHTSA puede reflejar campañas de otro mercado y no reemplaza SERNAC.
- **Año cualquiera:** vehículos antiguos o sin VIN estandarizado se registran manualmente. No existe un decodificador universal por VIN para todos los años y marcas con información oficial chilena garantizada.
- **GitHub Pages:** HTML, CSS y JavaScript únicamente; FastAPI y cualquier API privada requieren servicio aparte, contratos y medidas de seguridad.

## 6. Calidad y próximos hitos

- Pruebas \`node tests/vin.mjs\`: estructura, CSS local/CSP, enlaces oficiales, privacidad, renderizador y código fuente.
- Chromium \`node tests/browser.mjs\`: error de I/O/Q, chasis 1975 sin NHTSA, decodificación de VIN con respuesta NHTSA **simulada solamente en pruebas**, presentación WMI/VDS/VIS, copia de VIN enmascarado y explícita, invalidación tras cambios y responsive.
- Backend \`backend/tests/test_vin.py\`: rechazo de entradas inválidas, consulta moderna **sin año** y resultados incompletos no inventados, con NHTSA simulado en pruebas.
- **No se declara prueba en vivo de consulta externa** basada solo en mocks. Confirmar en dispositivo real, y diseñar fallback a la URL oficial cuando el browser o NHTSA bloquee la conexión.
- Pendiente contractual: licencias de fabricantes para fitment, análisis de privacidad 21.719 cuando corresponda, pilotos de talleres, soporte y postventa.
