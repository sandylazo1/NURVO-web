# NURVO — Evaluación preliminar de ciberseguridad (02-11-2026)

**Alcance:** SPA estática GitHub Pages \`index.html\`, \`vin.html\`, \`ecosistema.html\` y backend FastAPI existente en repositorio (no alojado en Pages). Esto es una **revisión estática preliminar**; no es pentest, certificación ISO 27001, auditoría SOC2 ni cumplimiento legal exhaustivo.

## Inventario de activos y flujos
| Activo | Exposición | Flujo real / esperado |
|---|---|---|
| Sitio HTML/JS público | Público, repositorio abierto | Browser → GitHub Pages. Los archivos/JS/config son públicos. |
| Explorador ecosistema | Navegador del usuario | Selección de categoría, borrador y mapa sin almacenamiento ni API privada. |
| VIN página vin.html | NHTSA API pública al pulsar consultar | VIN sale a tercero internacional; no equivale a Registro Civil de Chile. |
| Garaje y cotizaciones de otras páginas | localStorage, dispositivo local | No enviar a servidor por defecto; sujeto a borrado de datos del sitio. |
| Backend FastAPI en backend/app | Código disponible; hosting no demostrado | Debe desplegarse fuera de Pages para servir APIs seguras, proveedor autorizado y DB. |
| Proveedor chileno externo | **No autorizado/conectado por defecto** | Integración contractual, token server-side y limitación de datos por finalidad. |
| Flotas e instituciones | Futuro, no implementado | Separación de tenants, contratos, permisos, auditoría, retención, certificación. |

## Riesgos y medidas (prioridad)
| Riesgo | Severidad | Estado actual / acción |
|---|---|---|
| Divulgación de API key o credencial en \`config.js\`/Pages | **Crítico** | Prohibido. No incluir tokens/client secrets en JS, URL, workflow o docs. Solo backend secret manager. |
| Acceso cruzado entre empresas/fleets (IDOR/BOLA) | **Crítico** | Sin tenants aún. Crear identidad, roles, políticas por fila y pruebas de negación antes de CRM B2B. |
| Datos sensibles de ambulancias/policías/empleados | **Crítico** | NO recopilar en frontend público; DPA, clasificación, necesidad legal, autorización y aislamiento. |
| Consulta a bases Registro Civil/Carabineros sin permiso | **Crítico** | No realizada; adquirir acceso por convenio; prohibir scraping, evasión CAPTCHA y acceso a datos personales. |
| VIN/PPU reidentificación y transferencias internacionales | Alto | Divulgar envío a NHTSA bajo acción explícita. Minimizar/anonimizar telemetría y logs; reglas de conservación. |
| Abuso API masiva, enumeración de patentes | Alto | Rate limiting global por usuario/IP, cuotas por proveedor, monitoreo, costos, anti-scraping y claves restringidas. |
| Proveedores remotos / SSRF / redirect | Alto | En backend permitir lista de hosts de proveedor previamente aprobados, no aceptar URLs del usuario; bloquear IP internas/redirecciones. |
| Inyección HTML/JS y datos externos | Alto | En ecosistema se usa \`textContent\` y CSP restrictiva; código legacy \`index.html\` requiere revisión de sinks y XSS. |
| CORS demasiado abierto, CSRF y sesiones | Alto | Aislar API con lista exacta de orígenes, autenticación y protección CSRF si usa cookies. |
| Datos falsos de precio, robo, multa y certificados | Alto | Nunca convertir "no respondió" en "limpio"; objetos con fuente, tiempo, nivel de verificación y consentimiento. |
| Software supply chain, Actions comprometidas | Alto | Fijar acciones por SHA, dependabot/alertas, mínimo token \`GITHUB_TOKEN\`, revisiones de PR y secretos; auditoría CI. |
| Pérdida de datos localStorage o dispositivo compartido | Medio | Informar almacenamiento, eliminación y no prometer sincronización/seguridad tipo backend cifrado. |
| Borradores de T&C como garantía legal | Alto | Bloquear checkout hasta individualizar operador y revisión jurídica. |

## Requisitos concretos de arquitectura para próximos PR
1. **Separación:** Pages (solo frontend estático) → HTTPS → API FastAPI con acceso autorizado → proveedores oficiales/licenciados → base de datos gestionada cifrada. Eliminar cualquier secreto del frontend.
2. **Autenticación/autorización:** MFA para personal, RBAC + ABAC tenant, registros de acceso, expiración de sesión, no compartir cuentas públicas; test BOLA/IDOR.
3. **Datos:** catálogo de campos, bases jurídicas diferenciadas, retención limitada, supresión, exportación controlada, trazabilidad de consentimiento donde proceda.
4. **Pagos:** usar PSP externo compatible, nunca almacenar PAN/CVV; contratos de marketplace, prevención fraude, conciliación/tributación.
5. **Proveedores:** no inferir estado de robo de respuesta vacía, no persistir RUT/direcciones de dueños; versionar fuente y timestamp con nivel de certeza.
6. **Logs/alertas:** no registrar VIN/PPU completos salvo justificación, sanitizar credenciales y payload, alertas de anomalías, backups y restauración probada.
7. **Security SDLC:** SAST, SCA, secret scanning, DAST en staging con autorización, pruebas de XSS/CSRF/SSRF/IDOR, análisis de amenazas y respuesta a incidentes.
8. **Flotas críticas:** designar responsable, clasificación y segregación operacional, contratos DPA, RTO/RPO, continuidad y requisitos del organismo.
9. **Ley 21.663:** evaluar aplicabilidad real al rol de NURVO, a los clientes institucionales y a la infraestructura, no atribuir automáticamente OIV por servir a un hospital.
10. **Ley 21.719:** preparar cumplimiento para vigencia 01-12-2026 según versión oficial, sin afirmar conformidad por publicar un aviso.

## Observaciones sobre implementación nueva
- \`ecosistema.html\`: política CSP en meta restringiendo scripts, estilos y conexiones al origen; sin dependencias de terceros. HTML y JS sin claves, localStorage, fetch ni formularios de captura de datos sensibles.
- \`assets/ecosistema.js\`: lectura de input limitada; \`textContent\` para salida, URL \`google.com/maps/search\` construida vía \`encodeURIComponent\` sin atribuir políticas reales de talleres; descarga local \`Blob\`.
- \`terminos.html\` y \`privacidad.html\`: borradores visibles, sin panel de aceptación o consentimiento ficticio.
- PENDIENTE: revisión de \`index.html\` legacy de ~260 KiB, políticas CSP por cabecera, security headers de Pages no controlables directamente, seguridad de \`localStorage\`, host de API, protección de supply chain.
- No afirmar que "seguridad legal" está completada por estas modificaciones.

### Fuentes
[Ley 21.719](https://www.bcn.cl/leychile/Navegar?idNorma=1209272); [Ley 19.628](https://www.bcn.cl/leychile/Navegar?idNorma=141599); [Ley 21.663](https://www.bcn.cl/leychile/Navegar?idNorma=1202434); [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/); [OWASP API Security Top 10](https://owasp.org/www-project-api-security/).
