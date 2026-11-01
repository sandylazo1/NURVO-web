# NURVO — QA_REPORT: auditoría de GitHub Actions con logs reales

**Corte:** 2026-11-01, aproximadamente 12:40 UTC (09:40 America/Santiago). **Repositorio:** `sandylazo1/NURVO-web`.
**Alcance:** 130 ejecuciones recuperadas de GitHub Actions API, paginadas; 31 fallidas, 40 canceladas, 58 exitosas y 1 aún sin conclusión en la instantánea. Una cancelación no equivale a fallo de tests. Los datos son históricos y pueden cambiar con nuevas ejecuciones.

## Resultado actual verificado

- **CI de main verde:** [run 41307433226](https://github.com/sandylazo1/NURVO-web/actions/runs/41307433226), SHA `5e65810dc8c2`, tres jobs verdes: Static integrity / Node smoke, Real Chromium UI test y Python API tests / pytest.
- **GitHub Pages verde:** [run 41307432547](https://github.com/sandylazo1/NURVO-web/actions/runs/41307432547), SHA `5e65810dc8c2`, build y deploy exitosos. No equivale a una auditoría de disponibilidad y contenido desde un navegador externo.
- **Corrección de concurrencia propuesta separadamente:** [PR #5](https://github.com/sandylazo1/NURVO-web/pull/5), rama `fix/ci-stale-runs-20261101`, [run 41307554581](https://github.com/sandylazo1/NURVO-web/actions/runs/41307554581) verde. No fusionar automáticamente.
- **PR #2:** cerrado, no fusionado. **PR #4:** borrador en rama de otro trabajo del agente; sus documentos anteriores contenían la anotación provisional «sin logs» y no deben tomarse como informe actualizado. La presente rama solo añade evidencia, sin tocar ramas ajenas.
- **Backend:** el éxito de pytest certifica pruebas automatizadas del repositorio en ese SHA, no que FastAPI esté desplegado. GitHub Pages solo sirve frontend estático; `config.js` de main deja URL de API vacía. Nunca afirmar robos, multas ni patentes verificadas sin proveedor real.

## Resumen de causas de los 31 fallos

| Familia | Cantidad | Evidencia directa |
|---|---:|---|
| Chromium / Playwright 1.56.1 en Ubuntu 26.04 | 8 | `ERROR: Playwright does not support chromium on ubuntu26.04-x64`; paso de instalación fallido. |
| Integridad git por espacios al final de línea | 4 | `index.html:... trailing whitespace`; `git diff --check` exit 2. |
| Test Node smoke | 1 | `AssertionError [ERR_ASSERTION]: Catálogo con imágenes reales`. |
| Pages deploy concurrente | 17 | `Deployment request failed ... due to in progress deployment` (HTTP 400). |
| Pages Jekyll | 1 | `Errno::ENOENT: /github/workspace/docs` al convertir `assets/css/style.scss`. |
| **Total** | **31** | Identificadores, SHAs y pasos en la tabla inferior. |

**Correcciones verificadas en el estado posterior de main:** runner `ubuntu-24.04`, `git diff --check` verde, Node smoke verde, Chromium verde, pytest verde y Pages build/deploy verde. Las X históricas no se convierten en verdes retrospectivamente. El PR #5 añade una guarda explícita de versión de Ubuntu y `concurrency` a CI; no modificar su rama aquí.

## Inventario exhaustivo de los 31 runs fallidos

Se inspeccionaron los jobs/pasos fallidos de todos los IDs y los logs de sus categorías. Las causas están resumidas para no incluir tokens, datos privados ni volúmenes de logs completos. Cada ID enlaza a los logs originales.

| Run ID / logs | SHA (prefijo) | Workflow | Job / paso fallido | Error comprobado | Estado de corrección |
|---|---|---|---|---|---|
| [41306999901](https://github.com/sandylazo1/NURVO-web/actions/runs/41306999901) | `66ebac39aa19` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41306851015](https://github.com/sandylazo1/NURVO-web/actions/runs/41306851015) | `150ef287a377` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41306256999](https://github.com/sandylazo1/NURVO-web/actions/runs/41306256999) | `b715d7c235e1` | CI | Static integrity and git commit / Verify git working tree and commit | index.html: trailing whitespace; exit 2 | corregido en main posterior |
| [41290702821](https://github.com/sandylazo1/NURVO-web/actions/runs/41290702821) | `1f128f843fa5` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41290702617](https://github.com/sandylazo1/NURVO-web/actions/runs/41290702617) | `1f128f843fa5` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41290681582](https://github.com/sandylazo1/NURVO-web/actions/runs/41290681582) | `970612891f56` | CI | Static integrity and git commit / Verify git working tree and commit | index.html: trailing whitespace; exit 2 | corregido en main posterior |
| [41290681446](https://github.com/sandylazo1/NURVO-web/actions/runs/41290681446) | `970612891f56` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41290562972](https://github.com/sandylazo1/NURVO-web/actions/runs/41290562972) | `32da8724834e` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41290562612](https://github.com/sandylazo1/NURVO-web/actions/runs/41290562612) | `32da8724834e` | CI | Static integrity and git commit / Verify git working tree and commit | index.html: trailing whitespace; exit 2 | corregido en main posterior |
| [41290548226](https://github.com/sandylazo1/NURVO-web/actions/runs/41290548226) | `5796d1213f00` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41290513254](https://github.com/sandylazo1/NURVO-web/actions/runs/41290513254) | `5d4fe271cd3e` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41290513163](https://github.com/sandylazo1/NURVO-web/actions/runs/41290513163) | `5d4fe271cd3e` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41290493360](https://github.com/sandylazo1/NURVO-web/actions/runs/41290493360) | `bdab8306ded0` | CI | Static integrity and git commit / Verify static site scripts | AssertionError: Catálogo con imágenes reales | test de smoke pasa en main posterior |
| [41290441390](https://github.com/sandylazo1/NURVO-web/actions/runs/41290441390) | `cdc42673753e` | CI | Static integrity and git commit / Verify git working tree and commit | index.html: trailing whitespace; exit 2 | corregido en main posterior |
| [41290425046](https://github.com/sandylazo1/NURVO-web/actions/runs/41290425046) | `2c800732709b` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41290351575](https://github.com/sandylazo1/NURVO-web/actions/runs/41290351575) | `8e3c32f0e7b4` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41290320189](https://github.com/sandylazo1/NURVO-web/actions/runs/41290320189) | `0fc32e2b21b1` | CI | Real Chromium UI test / Install Playwright test browser | Playwright 1.56.1 no admite chromium en ubuntu26.04-x64 | runner ubuntu-24.04 en main |
| [41289644290](https://github.com/sandylazo1/NURVO-web/actions/runs/41289644290) | `3320e6067f26` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41289584525](https://github.com/sandylazo1/NURVO-web/actions/runs/41289584525) | `51d1c91a8866` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41289493860](https://github.com/sandylazo1/NURVO-web/actions/runs/41289493860) | `f8ee13c5a925` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41289426423](https://github.com/sandylazo1/NURVO-web/actions/runs/41289426423) | `fe08377c37b0` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41289300989](https://github.com/sandylazo1/NURVO-web/actions/runs/41289300989) | `a9cb6d2de7b4` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41289219909](https://github.com/sandylazo1/NURVO-web/actions/runs/41289219909) | `ba8a4e0dae36` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41289140711](https://github.com/sandylazo1/NURVO-web/actions/runs/41289140711) | `e5908cf87c95` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41288242648](https://github.com/sandylazo1/NURVO-web/actions/runs/41288242648) | `4d34263f5efc` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41288148154](https://github.com/sandylazo1/NURVO-web/actions/runs/41288148154) | `50ade337f71e` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41288101387](https://github.com/sandylazo1/NURVO-web/actions/runs/41288101387) | `d7e5bb6f0259` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41288014182](https://github.com/sandylazo1/NURVO-web/actions/runs/41288014182) | `a516210ffcdb` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41287896631](https://github.com/sandylazo1/NURVO-web/actions/runs/41287896631) | `da1a826077f4` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41287812765](https://github.com/sandylazo1/NURVO-web/actions/runs/41287812765) | `29fed16bd9f0` | Pages | deploy / Deploy to GitHub Pages | HTTP 400: deployment in progress; another deployment must finish | serializar pushes; último deploy verde |
| [41282662825](https://github.com/sandylazo1/NURVO-web/actions/runs/41282662825) | `da818b3fd886` | Pages | build / Build with Jekyll | Errno::ENOENT: /github/workspace/docs no existe | main actual contiene .nojekyll; Pages reciente verde |

## Validación adicional y limitaciones

1. El HTML de la rama de auditoría `agent/ci-audit-20261101-b` se inspeccionó por código: script inline compilable en V8, sin IDs HTML duplicados, 14 IDs esenciales presentes, 2 PNG embebidos, 8 pares de fotografías y 16 IDs de foto distintos. **Esto no sustituye `node tests/smoke.mjs` ni Chromium en esa rama.**
2. En el entorno de esta auditoría no se pudo clonar GitHub por fallo DNS (`Could not resolve host: github.com`). Por ello no se ejecutaron localmente npm, pytest ni Playwright; los resultados verdes citados son **jobs reales de GitHub Actions de main y PR #5**, no pruebas locales inventadas.
3. El PR #4 está divergido respecto de main y contiene cambios de SEO/QA concurrentes. Revisar conflictos y checks de su propio SHA antes de fusionar. Evitar editar su rama mientras otro agente trabaja.
4. No se han certificado licencias de cada imagen, ausencia de errores de red 404, accesibilidad WCAG ni integración real de patentes. Mantener «NO VERIFICADO» para datos vehiculares sin fuente autorizada.
5. La causa de los 40 runs cancelados debe separarse de los 31 fallidos. Su concentración durante pushes frecuentes es compatible con supersesión de despliegues, pero no permite atribuir cada cancelación a una persona o error de aplicación.

## Próximos pasos sin duplicar trabajo

- Esperar checks del PR que incorpore este informe y del PR #4; no fusionar con rojo ni por ausencia de checks.
- Mantener PR #5 como propuesta independiente de concurrencia CI; evitar nuevas correcciones duplicadas.
- Coordinar por [issue #1](https://github.com/sandylazo1/NURVO-web/issues/1) e [issue #3](https://github.com/sandylazo1/NURVO-web/issues/3); Antigravity no recibe automáticamente comentarios sin conectarse.
- Validar URL pública, imágenes y comportamiento responsive con screenshots del SHA desplegado, separadamente de las pruebas automatizadas.

## Seguimiento de integración — 2026-11-01, 11:00 America/Santiago

- **PR #7 (auditoría + SEO)**: el último SHA observado es `7b8c3e9afa5e8cca250d973f75afd42bb32d8a05`. El run [41308234630](https://github.com/sandylazo1/NURVO-web/actions/runs/41308234630) para **ese SHA** terminó con **4/4 jobs success**: auditor de Actions, Node smoke e integridad estática, pytest/compilación de backend, y Chromium escritorio/móvil. Se verificaron directamente los jobs y sus pasos mediante GitHub Actions. Artefactos del run: `nurvo-failed-actions-audit` (ID `13084575580`) y `nurvo-desktop-mobile-previews` (ID `13083614336`). No se certificó por ello un despliegue de producción del PR.
- **PR #4**: GitHub informa `mergeable=false` frente a `main`; su rama `agent/ci-audit-20261101-b` y la rama de PR #7 divergen (comparación: 21 commits ahead / 16 behind, 11 archivos modificados en común). **No fusionar PR #4 sin resolver conflictos**, revisar y evitar integrar dos veces el mismo auditor, SEO y QA. [PR #4](https://github.com/sandylazo1/NURVO-web/pull/4) y [PR #7](https://github.com/sandylazo1/NURVO-web/pull/7) siguen abiertos y en borrador.
- **PR #5**: el run [41307554581](https://github.com/sandylazo1/NURVO-web/actions/runs/41307554581) del SHA `fc93086d59d7c15293a949bb898970963793592d` está verde; su propuesta de concurrencia CI sigue separada. No se ha fusionado.
- **PR #6 (este informe)**: mantiene la evidencia histórica por ID y causa; el PR #7 incluye un auditor automatizado y puede ser el candidato principal para integración tras revisión cruzada. El informe histórico de 31 fallos no representa 31 fallos actuales. No repetir fixes ni atribuir recepción automática de issue #1 a Antigravity.

**Alcance de esta actualización:** documentación en rama propia; ninguna modificación de backend, frontend, secretos o `main`. No se ejecutaron tests locales en esta actualización; los éxitos descritos son exclusivamente ejecuciones reales de GitHub Actions vinculadas a sus SHAs.
## Seguimiento adicional — 2026-11-01, 12:24 America/Santiago

**Nuevo inventario paginado completo de GitHub Actions:** 142 ejecuciones en la API (páginas 1 y 2 de 100): **35 fallidas, 40 canceladas, 67 exitosas**. El inventario anterior de 31 fallos era correcto para su corte; se agregaron **4 fallos históricos de SHAs intermedios del PR #7**. No representan un fallo del último SHA de ese PR.

| Run fallido | SHA de PR (prefijo) | Job / paso | Evidencia literal del log |
|---|---|---|---|
| [41308133345](https://github.com/sandylazo1/NURVO-web/actions/runs/41308133345) | `0b8800dc` | Static integrity / Verify git working tree and commit | `AGENT_PROGRESS.md:78: new blank line at EOF.` y `QA_REPORT.md:98: new blank line at EOF.` |
| [41308139733](https://github.com/sandylazo1/NURVO-web/actions/runs/41308139733) | `0b2f8de0` | Static integrity / Verify git working tree and commit | `AGENT_PROGRESS.md:78`, `QA_REPORT.md:98`, `TODO.md:48`: `new blank line at EOF.` |
| [41308226258](https://github.com/sandylazo1/NURVO-web/actions/runs/41308226258) | `75708b0d` | Static integrity / Verify git working tree and commit | `QA_REPORT.md:98` y `TODO.md:48`: `new blank line at EOF.` |
| [41308228580](https://github.com/sandylazo1/NURVO-web/actions/runs/41308228580) | `001eeb46` | Static integrity / Verify git working tree and commit | `QA_REPORT.md:98: new blank line at EOF.` |

En los cuatro casos el comando `git diff --check HEAD^ HEAD` devolvió **exit code 2** por líneas en blanco añadidas al final de documentos Markdown. Los jobs de **Python API tests** y del **auditor** sí pasaron en esos runs; Chromium quedó `skipped` por dependencia del job de integridad, por lo que no puede declararse que Chromium falló.

**Corrección posterior verificada sin modificar la rama ajena:** [run 41308234630](https://github.com/sandylazo1/NURVO-web/actions/runs/41308234630), SHA `7b8c3e9afa5e8cca250d973f75afd42bb32d8a05`, completó **4/4 jobs success** (auditor, integridad/Node, pytest, Chromium). La rama del PR #7 ya corrigió los EOF; no repetir la reparación ni editar su rama.

**Últimos estados comprobados:** [PR #6 run 41314161627](https://github.com/sandylazo1/NURVO-web/actions/runs/41314161627), SHA `f15f83b8157ae00d1b04483955ca0a1b7500fddd`, **3/3 jobs success** antes de este nuevo commit; [main CI 41307433226](https://github.com/sandylazo1/NURVO-web/actions/runs/41307433226) **3/3 success** y [Pages 41307432547](https://github.com/sandylazo1/NURVO-web/actions/runs/41307432547) build/deploy **success**, ambos en `5e65810d`. El PR #4 continúa `mergeable=false`, PR #5, #6 y #7 siguen abiertos sin fusionar, y PR #2 cerrado sin merge.

**Limitaciones de esta ejecución:** se inspeccionaron logs reales de los 4 jobs fallidos y los pasos de los jobs verdes mediante GitHub; no se ejecutaron tests locales porque el contenedor no resuelve `github.com` al clonar. Las pruebas de frontend/backend citadas son ejecuciones reales de GitHub Actions, no resultados locales. Pages no ejecuta FastAPI ni verifica por sí solo robos, multas, patentes o compatibilidad de repuestos.
