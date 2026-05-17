# Nginx reverse proxy config for instabotapp.com
# Deploy to: /etc/nginx/sites-available/instabotapp.com
# Then symlink: ln -s /etc/nginx/sites-available/instabotapp.com /etc/nginx/sites-enabled/
#
# After deploying this HTTP-only config, run:
#   certbot --nginx -d instabotapp.com -d www.instabotapp.com
# Certbot will automatically upgrade this file with SSL/HTTPS blocks.

server {
    listen 80;
    server_name instabotapp.com www.instabotapp.com;

    # Max upload size (for avatar images)
    client_max_body_size 5M;

    # Cache image responses served through the /files proxy endpoint
    location /files/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Tell browsers to cache images for 24 hours
        add_header Cache-Control "public, max-age=86400";
        expires 24h;
    }

    # Proxy all other traffic to the NestJS app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# ------------------------------------------------------------
# The blocks below are added automatically by Certbot.
# Do NOT paste them manually — run:
#   certbot --nginx -d instabotapp.com -d www.instabotapp.com
# They are shown here for reference only.
# ------------------------------------------------------------
#
# server {
#     listen 443 ssl;
#     server_name instabotapp.com www.instabotapp.com;
#
#     ssl_certificate     /etc/letsencrypt/live/instabotapp.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/instabotapp.com/privkey.pem;
#     include             /etc/letsencrypt/options-ssl-nginx.conf;
#     ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;
#
#     client_max_body_size 5M;
#
#     location /files/ {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         add_header Cache-Control "public, max-age=86400";
#         expires 24h;
#     }
#
#     location / {
#         proxy_pass http://127.0.0.1:3000;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade;
#     }
# }
#
# server {
#     listen 80;
#     server_name instabotapp.com www.instabotapp.com;
#     return 301 https://$host$request_uri;
# }
