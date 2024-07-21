#!/bin/bash
mkdir -p /var/www/static
mkdir -p /var/www/media

chown www-data:www-data /var/log

python manage.py collectstatic --no-input
python manage.py makemigrations
python manage.py migrate
#python manage.py runserver 0.0.0.0:80 #!DO THIS ONLY IN DEBUG MODE

uwsgi --strict --ini uwsgi.ini