# NURVO — Roadmap de producto, integraciones y comercialización
Fecha: 2026-11-02. Documento operativo; los objetivos no son compromisos ni integraciones existentes.

## Disponible en GitHub Pages
- **Inicio** \`index.html\`: catálogo editorial, orientación por patente ingresada, filtros, cesta de cotización, garaje/localStorage, enlaces externos. Precios y stock no verificados.
- **VIN** \`vin.html\`: decodificador público NHTSA desde navegador con cobertura limitada, chasis antiguos manuales, cotizaciones ingresadas por el usuario y talleres por Google Maps.
- **Ecosistema** \`ecosistema.html\`: categorías OEM/OES/aftermarket/remanufacturado/usado/accesorios, formulario de solicitud, garantías, legislación, B2C/B2B/B2B2C y avisos de flotas.
- **Gestión** \`gestion.html\`: calendario por km y meses provistos por usuario, comparación de dos cotizaciones CLP con IVA y flota de hasta 25 aliases anónimos guardada localmente, CSV y borrado.
- **Alianzas** \`alianzas.html\`: propuesta de colaboración y requisitos por tipo de contraparte, borrador exportable sin envío.
- **Equipo** \`equipo.html\`: cargos informados por los 3 integrantes, funciones y distinción entre autoría/titularidad/participación.
- **Legal** \`terminos.html\` / \`privacidad.html\`: borradores, no sustituyen asesoría ni datos del operador faltantes.

## Estado de fuentes externas (no se debe falsear)
| Fuente | Estado | Próximo paso autorizado |
|---|---|---|
| NHTSA vPIC | Consulta pública en navegador; condicionada a cobertura, disponibilidad y CORS | Verificación real de disponibilidad, gestión de errores, transparencia |
| Registro Civil / Carabineros | No conectado, solo enlaces a trámites | Solicitar permisos y comprobar si existen APIs oficiales/licencias para la finalidad |
| Auto Seguro | Enlace externo, no API habilitada | Convenio autorizado; no inferir ausencia de encargo |
| Importadores/Ford/Nissan/Hyundai/VW/Derco | Fuentes informativas públicas enlazadas; sin acuerdos NURVO | Licencias, catálogos, garantías por vehículo y negociación |
| Talleres/repuesteras | Sin feeds de precio/stock y sin alianzas verificadas | Piloto contractual, disponibilidad, precios, calidad, garantías |
| Awto y flotas empresariales | Sin conexión ni convenio | Autorización de operador, segregación datos y SLA |
| Hospitales/Carabineros/municipios | Sin contrato ni acceso a flotas | Procedimiento de compras públicas aplicable y seguridad institucional |

## Fase 1 — Primeras ventas (hipótesis a validar)
1. Entrevistas y datos de compra reales, definir segmento primario B2C (p. ej. mantenimiento preventivo simple).
2. Acordar 2 proveedores y 3 talleres con contratos piloto, precio CLP/IVA, SKU/OEM, stock y garantías por escrito.
3. Medir solicitud→cotización→servicio, tasa de incompatibilidad, tiempos, reclamos y margen.
4. No anunciar descuentos o verificación oficial sin evidencia auditable.

## Fase 2 — Infraestructura y confianza
1. Backend FastAPI en hosting separado de Pages, con TLS, roles, base de datos cifrada, backups y límites de consulta.
2. Contratos con proveedores de datos y logs minimizados; pruebas de seguridad XSS/CSRF/BOLA/IDOR/SSRF.
3. Identidad legal del operador, tratamiento de datos de acuerdo a Ley 19.628 y requisitos de Ley 21.719 desde su vigencia, contratos DPA.
4. Tracking de cotizaciones y garantías, recibos, reclamos y roles de responsable real de prestación.

## Fase 3 — B2B y B2B2C
1. Talleres: inventario, citas, aprobaciones de órdenes de trabajo y postventa.
2. Distribuidores: catálogo SKU, actualización stock, precios/IVA, devoluciones y compatibilidad licenciada.
3. Flotas: multi-tenant, permisos por empresa y unidad; mantenimiento con pauta técnica validada.
4. Arrendadoras y sector público: contratos, autorización y compras públicas según corresponda.

## Restricciones permanentes
- No poner secretos en GitHub Pages ni declarar FastAPI desplegado allí.
- No inferir datos de robo, multas o compatibilidad por ausencia de resultados.
- No atribuir convenio a marcas, talleres o organismos sin prueba.
- No eliminar garantías legales ni trasladar responsabilidad mecánica por negligencia al usuario.
- No almacenar datos sensibles de flotas públicas en herramientas locales de demostración.
- No mezclar derechos de autor y participaciones societarias.
