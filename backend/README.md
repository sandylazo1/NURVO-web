# NURVO API — FastAPI, caché SQLite y adaptadores autorizados

**Estado:** backend implementado en el repositorio; **no desplegado**. El sitio GitHub Pages es estático. No hay proveedor oficial de patentes conectado por defecto.

## Comenzar (Python 3.11+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements-dev.txt
python -m uvicorn app.main:app --reload --port 8000
pytest -q
```

Comprueba `http://127.0.0.1:8000/api/health` y consulta `http://127.0.0.1:8000/api/patente/ABCD12`. Sin proveedor habilitado, el resultado será `sin_fuente` y `no_verificado`, **no datos falsos**.

## Contrato de respuesta

```json
{
  "patente": "ABCD12",
  "marca": null,
  "modelo": null,
  "ano": null,
  "estado_robo": "no_verificado",
  "multas": null,
  "fuente": null,
  "ultima_actualizacion": null,
  "estado_consulta": "sin_fuente",
  "cache": "miss",
  "mensaje": "No hay resultados verificables. Use los enlaces oficiales para comprobar el vehículo.",
  "enlace_autoseguro": "https://www.autoseguro.gob.cl/",
  "enlace_multas": "https://www.chileatiende.gob.cl/fichas/3439"
}
```

La API nunca expone nombre, RUT, teléfono, dirección ni otros datos del propietario. La patente se valida como formato chileno común, no como patente existente.

## Fuentes

- `NURVO_PROVIDER_KIND=disabled` por defecto: no genera datos. Requiere un convenio o permiso con una fuente legítima.
- `json_api`: proveedor contratado mediante endpoint HTTPS con parámetro `{patente}`, respuesta JSON con campos `marca`, `modelo`, `ano`, `estado_robo` y `multas`. Requiere `NURVO_PROVIDER_AUTHORIZED=true`, `NURVO_PROVIDER_URL=https://.../{patente}` y token secreto si corresponde.
- `playwright`: opcional solo para un sitio con autorización para automatización, **sin evitar captcha, bloqueo o login**. Instala `requirements-playwright.txt`, ejecuta `playwright install chromium`, habilita `NURVO_ALLOW_PLAYWRIGHT=true` y define selectores reales de formulario y resultados en variables de entorno. No se proporcionan selectores inventados para Auto Seguro.
- `NURVO_VERIFIED_THEFT_SOURCE=true` y `NURVO_VERIFIED_FINES_SOURCE=true` **solo** si el proveedor está habilitado y autorizado para devolver esos campos con garantías. De lo contrario, el estado permanece `no_verificado` y las multas quedan en `null`.

Un resultado `sin_encargo_reportado` tampoco sustituye una certificación oficial. El portal Auto Seguro advierte que su información es orientativa. Los certificados de multas se tramitan por Registro Civil.

## Caché y tareas

SQLite (WAL) guarda respuestas confirmadas 24 horas. Respuestas recientes se devuelven desde la caché; antiguas se devuelven inmediatamente con `estado_consulta=actualizando` y se programa una actualización con `BackgroundTasks`. Si la fuente falla, se conservan los datos anteriores y su fecha real.

`NURVO_ENABLE_DAILY_REFRESH=true` habilita una tarea **a las 03:00 hora de Santiago**, que recorre secuencialmente patentes almacenadas, con al menos 5 segundos entre peticiones. Solo funciona si hay un proveedor autorizado y el backend es un proceso siempre encendido. Corre en **un worker** y un solo contenedor, de lo contrario se duplicarían trabajos. Para escalar: Redis/Celery + scheduler externo.

Se purgan automáticamente registros antiguos (90 días) durante el job diario; aplica tu política de conservación de datos y atención de solicitudes de eliminación.

## Seguridad y despliegue

- Backend en servicio con proceso Python persistente y volumen SQLite persistente (por ejemplo un VPS o contenedor con almacenamiento persistente). GitHub Pages **no ejecuta Python**.
- Configura HTTPS, `NURVO_CORS_ORIGINS` para el origen del frontend, variables secretas en el proveedor de hosting y rate limit de borde. La limitación por IP en memoria es una protección básica, no distribuida.
- Edita `config.js` del frontend para indicar la URL **HTTPS** del backend que hayas desplegado.
- No publiques claves ni contraseñas en el frontend; no conectes al Registro Civil con credenciales de terceros.
- Revisa licencias/contratos y requisitos legales antes de almacenar patentes o consultar datos gubernamentales.

## Enlaces útiles

- Consulta oficial: https://www.autoseguro.gob.cl/
- Certificado multas: https://www.chileatiende.gob.cl/fichas/3439
- FastAPI: https://fastapi.tiangolo.com/
