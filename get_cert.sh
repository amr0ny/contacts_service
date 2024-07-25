#!/bin/bash
docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt -v $(pwd)/certbot/www:/var/www/certbot certbot/certbot certonly --webroot --webroot-path=/var/www/certbot --email your_email@example.com --agree-tos --no-eff-email -d your_domain.com
