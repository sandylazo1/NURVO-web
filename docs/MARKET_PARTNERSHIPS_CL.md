# NURVO — Mercado chileno, alianzas comerciales y flotas (análisis preliminar, 02-11-2026)

## Enfoque de mercado (sin inventar fallas)
- ANAC publica **rankings de ventas** por marca y modelo en su Informe del Mercado Automotor septiembre de 2026. El ranking de ventas NO demuestra confiabilidad, fallas ni valor de posventa.
- ANAC diciembre 2025 identifica entre vehículos de pasajeros: Suzuki Baleno, Kia Soluto, Hyundai Grand i10, Chevrolet Sail, Suzuki Swift, Toyota Yaris, Nissan Versa, Volkswagen Polo y otros. Son **candidatos para investigación de demanda**, no una afirmación de tasa de falla. [Informe ANAC diciembre 2025](https://www.anac.cl/wp-content/uploads/2026/01/12-ANAC-Mercado-Automotor-Diciembre-2025.pdf), [informes septiembre 2026](https://www.anac.cl/category/estudio-de-mercado/).
- Marcas a investigar por canal de repuestos/talleres en Chile (orden comercial **hipotético**, no ranking oficial): Suzuki, Chevrolet, Kia, Hyundai, Toyota, Nissan, Ford, Volkswagen, Chery, MG, Mazda y Renault.
- Segmentos adicionales requieren dataset: pickups comerciales, vans de transporte, taxis/colectivos, electrificados, ambulancias y unidades de servicio público. No inferir su participación con cifras de vehículos de pasajeros.
- La **calidad de datos de fallas** debe venir de recall por VIN/lote, reparaciones reales anonimizadas con consentimiento o estudios con denominador de unidades/edad/km, nunca de conjeturas ni anécdotas. [SERNAC recall y seguridad](https://www.sernac.cl/portal/619/w3-propertyvalue-66190.html), [Nissan Chile recall](https://www.nissan.cl/servicios/campanas.html).

## Secuencia de alianzas (propuesta, NO convenios firmados)
| Canal | Valor para NURVO | Requisitos mínimos |
|---|---|---|
| Repuesteras y distribuidores locales | Precios y disponibilidad por API/CSV bajo licencia, no scraped | Convenio de distribución/lead, SKU, OEM equivalencias, impuestos, stock timestamp, derechos de uso |
| Red independiente de talleres | Cotización + citas + calidad + postventa | Identidad comercial, permisos, competencias, seguros, garantía de trabajo, aceptación de repuestos de terceros |
| Redes autorizadas de marcas (Ford/Nissan/Hyundai/Volkswagen/Derco) | OEM, recalls, pautas por versión, service | Acuerdo con entidad legal local, marca registrada, API, precio, uso de datos, responsabilidad |
| Aseguradoras/gestores de flota | Siniestralidad autorizada, mantenciones, SLA | DPA, contratos, seguridad, reglas de garantía y sin consentimiento ficticio |
| Carsharing/rent-a-car como Awto | Mantención programada de unidades arrendadas | Acuerdo con operador y autorización expresa de intervención; no relación existente |
| Hospitales, municipalidades y Carabineros | Flotas, ambulancias, móviles institucionales | Registro hábil de ChileCompra, procedimiento legal, contratos, acceso restringido y régimen especial aplicable |
| Recicladores/autopartes usadas | Reutilización, economía circular | Origen lícito, trazabilidad, calidad y exclusiones de piezas críticas |

## Modelo B2C / B2B / B2B2C
- **B2C:** orientación y solicitudes a proveedores/talleres, comparación real de cotizaciones, historial y recordatorios de mantenimiento (hoy informativos y manuales).
- **B2B:** SaaS para talleres/inventario, portal RFP de flotas, trazabilidad y compras. Facturación, multi-tenant y permisos antes de habilitar.
- **B2B2C:** distribuidor → taller → conductor, acuerdos claros sobre calidad, garantía, precio, tratamiento de datos y contratos. No presentar como relaciones existentes.
- Ingresos potenciales: fee por lead validado, comisión por transacción, licencia de gestión B2B, SaaS de flota. Todos requieren contratos y pruebas de unit economics y cumplimiento tributario; NO imponer comisiones ficticias ni cobros sin checkout regulado.

## Estrategia de datos (operable)
1. Catálogo con campo obligatorio \`supplier_id\`, \`sku\`, \`oem_ref\`, \`condition\`, \`source_url\`, \`last_verified_at\`, \`currency\`, \`tax_included\`, \`stock_status\` y \`verification_level\`.
2. Compatibilidad: VIN/versión/motor especificados, fuente de fitment autorizada, revisión mecánica para seguridad crítica.
3. Garantía en entidad separada por cada producto, trabajo y póliza de fabricante; no combinar seis meses de garantía legal con política comercial voluntaria.
4. Estados de integración: \`sin_fuente\`, \`no_verificado\`, \`referencial\`, \`confirmado_proveedor\`. Nunca \`sin_robo\` inferido.
5. Costo + cupo de consultas en API comercial, cache TTL acordado, necesidad de contrato previo para datos de terceros.
6. Actualizar rankings y alertas con fecha/fuente; no usar bases de datos con licencia restrictiva sin permiso.

## Plan por etapas
**Fase 0**: formularios orientativos sin datos sensibles y fuentes públicas con enlaces (esta rama).
**Fase 1**: onboarding de 3–5 talleres independientes y 2 distribuidores con convenios reales; cotizaciones y compatibilidad probadas; política y responsable legal completos.
**Fase 2**: facturación/cotización digital, multi-tenant, garantía/orden de trabajo, seguros y API de inventario con consentimiento. Integración de proveedores legalmente autorizados.
**Fase 3**: gestoras de flotas, carsharing, leasing y contratos institucionales solo vía mecanismos apropiados. Control de accesos y cumplimiento revisados.

## Tratados internacionales ≠ convenio con fabricante
Los acuerdos de comercio exterior de Chile y reglas de origen/arancel son distintos de un convenio privado con concesionario, marca o distribuidor. Para importar repuestos verificar clasificación aduanera, origen acreditado, documentación, restricciones técnicas, seguridad y tributos. [SUBREI acuerdos vigentes](https://www.subrei.gob.cl/acuerdos-comerciales/acuerdos-comerciales-vigentes) y [tarifas](https://aranceles.subrei.gob.cl/).
