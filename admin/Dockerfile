FROM python:3.12-alpine

RUN apk add --no-cache \
     gcc \
     musl-dev \
     python3-dev \
     linux-headers \
     pcre-dev
RUN apk add libffi-dev

WORKDIR /opt/admin

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV UWSGI_PROCESSES 2
ENV UWSGI_THREADS 12
ENV UWSGI_HARAKIRI 240
ENV DJANGO_SETTINGS_MODULE 'config.settings'


COPY run.sh run.sh
COPY requirements.txt requirements.txt
COPY uwsgi/uwsgi.ini uwsgi.ini

RUN chmod +x .
RUN  pip install --upgrade pip \
     && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "/opt/admin/run.sh"]