# Domain Setup: instabotapp.com (Docker + host Certbot)

**Domain:** instabotapp.com  
**Server IP:** 46.62.205.43  
**App port:** 3000 (NestJS, internal — not exposed to host)  
**Entry point:** nginx Docker container → ports 80 / 443  
**TLS:** Certbot installed directly on the host server

## How certbot and nginx share files

Certbot runs on the **host** and writes to two host directories:

| Host path          | Purpose                                    | Mounted into nginx container as |
| ------------------ | ------------------------------------------ | ------------------------------- |
| `/var/www/certbot` | ACME challenge files (domain verification) | `/var/www/certbot` (read-only)  |
| `/etc/letsencrypt` | Issued certificates + renewal config       | `/etc/letsencrypt` (read-only)  |

nginx reads both paths as bind mounts — no Docker volumes involved.

## Nginx folder structure

```
nginx/
├── nginx.conf                       # Global config — loaded by the nginx container
├── conf.d/
│   ├── instabotapp.com.conf         # ACTIVE — HTTP-only (Step 1)
│   └── instabotapp.com.ssl          # INACTIVE — full HTTPS (Step 2, rename to activate)
└── instabotapp.com                  # Reference only — bare-metal config, not used in Docker
```

nginx loads every `*.conf` file in `conf.d/` automatically. Files with any other extension (`.ssl`, `.bak`) are ignored. Note: `.ssl.conf` would **not** be safe — it still ends in `.conf` and would be loaded. The HTTPS template uses `.ssl` with no `.conf` suffix for this reason.

---

## Prerequisites

- Ubuntu/Debian server at `46.62.205.43`
- SSH access as root or a sudo user
- Docker + Docker Compose installed
- GoDaddy A records pointing `instabotapp.com` and `www.instabotapp.com` → `46.62.205.43`

Verify DNS before proceeding (Let's Encrypt will fail if DNS hasn't propagated):

```bash
dig +short instabotapp.com
# must return: 46.62.205.43
```

---

## Step 1 — Open host firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

---

## Step 2 — Install Certbot on the host

```bash
sudo apt update
sudo apt install -y certbot

# Verify
certbot --version
```

---

## Step 3 — Create the webroot directory

Certbot will write ACME challenge files here. nginx (in Docker) reads it as a bind mount.

```bash
sudo mkdir -p /var/www/certbot
```

---

## Step 4 — Deploy the repo and configure .env

```bash
git clone <your-repo> ~/instagram-chat-bot
cd ~/instagram-chat-bot
cp .env.example .env
nano .env   # fill in all values; set SERVER_DOMAIN=http://instabotapp.com for now
```

---

## Step 5 — Start services (HTTP only)

```bash
docker compose -f docker-compose-build.yaml up -d database redis app nginx
```

Verify nginx is up and the app is reachable over HTTP:

```bash
curl -I http://instabotapp.com/
# Expected: HTTP/1.1 200 OK  (or 404 if no root route — that's fine)
```

---

## Step 6 — Obtain the SSL certificate

Run certbot on the host using the webroot challenge. nginx (already running) serves the
challenge file from `/var/www/certbot` automatically.

```bash
sudo certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your@email.com \
  --agree-tos \
  --no-eff-email \
  -d instabotapp.com \
  -d www.instabotapp.com
```

On success, certs are written to `/etc/letsencrypt/live/instabotapp.com/` on the host —
the nginx container can already read them via the bind mount.

---

## Step 7 — Activate the HTTPS config

```bash
cd ~/instagram-chat-bot/nginx/conf.d

# Archive the HTTP-only config
mv instabotapp.com.conf instabotapp.com.http.bak

# Activate the HTTPS config
mv instabotapp.com.ssl instabotapp.com.conf
```

Test and reload nginx (no restart needed, run from the repo root):

```bash
cd ~/instagram-chat-bot
docker compose -f docker-compose-build.yaml exec nginx nginx -t
# must say: syntax is ok / test is successful

docker compose -f docker-compose-build.yaml exec nginx nginx -s reload
```

---

## Step 8 — Verify HTTPS

```bash
curl -I https://instabotapp.com/
# Expected: HTTP/2 200

curl -I http://instabotapp.com/
# Expected: HTTP/1.1 301 Moved Permanently
```

---

## Step 9 — Update SERVER_DOMAIN in .env

```bash
nano ~/instagram-chat-bot/.env
# Change: SERVER_DOMAIN=https://instabotapp.com
```

Restart the app to pick up the new value:

```bash
docker compose -f docker-compose-build.yaml restart app
```

---

## Step 10 — Update the Meta / Facebook webhook URL

In the Meta Developer Console, set the Instagram webhook callback URL to:

```
https://instabotapp.com/webhooks
```

---

## Certificate renewal

Certificates expire after 90 days. Renew with certbot on the host, then reload nginx:

```bash
sudo certbot renew
docker compose -f docker-compose-build.yaml exec nginx nginx -s reload
```

Automate with a cron job (runs on the 1st and 15th of each month):

```bash
sudo crontab -e
# Add:
0 3 1,15 * * certbot renew --quiet && docker compose -f /root/instagram-chat-bot/docker-compose-build.yaml exec nginx nginx -s reload
```

---

## Useful commands

| Task                 | Command                                                                  |
| -------------------- | ------------------------------------------------------------------------ |
| Start all services   | `docker compose -f docker-compose-build.yaml up -d`                      |
| Stop all services    | `docker compose -f docker-compose-build.yaml down`                       |
| View nginx logs      | `docker compose -f docker-compose-build.yaml logs -f nginx`              |
| View app logs        | `docker compose -f docker-compose-build.yaml logs -f app`                |
| Test nginx config    | `docker compose -f docker-compose-build.yaml exec nginx nginx -t`        |
| Reload nginx config  | `docker compose -f docker-compose-build.yaml exec nginx nginx -s reload` |
| Renew certificate    | `sudo certbot renew`                                                     |
| Check all containers | `docker compose -f docker-compose-build.yaml ps`                         |
