FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv/nurvo
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
RUN useradd -m -u 10001 nurvo && mkdir -p /srv/nurvo/data && chown -R nurvo:nurvo /srv/nurvo
USER nurvo
ENV NURVO_DATABASE_PATH=/srv/nurvo/data/nurvo.sqlite3
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
