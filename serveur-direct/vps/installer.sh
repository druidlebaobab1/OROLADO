#!/bin/bash
# OROLADO — met en place la configuration du VPS (à lancer en root sur le serveur, depuis
# /var/www/orolado). Peut être relancé sans danger : il remet la même configuration.
set -euo pipefail
cd "$(dirname "$0")"

# 1) Adresses de Cloudflare (pour voir la vraie adresse des joueurs).
{
  for ip in $(curl -sf https://www.cloudflare.com/ips-v4) $(curl -sf https://www.cloudflare.com/ips-v6); do
    echo "set_real_ip_from $ip;"
  done
} > /etc/nginx/cloudflare-ips.conf.new
if [ -s /etc/nginx/cloudflare-ips.conf.new ]; then mv /etc/nginx/cloudflare-ips.conf.new /etc/nginx/cloudflare-ips.conf; fi
touch /etc/nginx/cloudflare-ips.conf

# 2) Certificat https provisoire (Cloudflare en mode « Full » l'accepte) s'il n'y en a pas encore.
mkdir -p /etc/ssl/orolado
if [ ! -s /etc/ssl/orolado/origin.pem ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 -subj "/CN=orolado.com" \
    -keyout /etc/ssl/orolado/origin.key -out /etc/ssl/orolado/origin.pem >/dev/null 2>&1
  chmod 600 /etc/ssl/orolado/origin.key
fi

# 3) nginx : beaucoup de connexions ouvertes (une par joueur sur la ligne directe).
sed -i 's/^\(\s*\)worker_connections .*/\1worker_connections 16384;/' /etc/nginx/nginx.conf
grep -q '^worker_rlimit_nofile' /etc/nginx/nginx.conf || sed -i '1i worker_rlimit_nofile 65535;' /etc/nginx/nginx.conf
cp nginx-orolado.conf /etc/nginx/sites-available/orolado
ln -sf /etc/nginx/sites-available/orolado /etc/nginx/sites-enabled/orolado
rm -f /etc/nginx/sites-enabled/default

# 4) Système : file d'attente large pour les foules qui arrivent d'un coup.
cat > /etc/sysctl.d/90-orolado.conf <<'EOF'
net.core.somaxconn = 8192
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.ip_local_port_range = 10240 65000
fs.file-max = 500000
EOF
sysctl --system >/dev/null

# 5) PHP : assez de travailleurs pour les connexions, trades et dépôts.
POOL=/etc/php/8.3/fpm/pool.d/www.conf
sed -i 's/^pm = .*/pm = dynamic/; s/^pm.max_children = .*/pm.max_children = 60/; s/^pm.start_servers = .*/pm.start_servers = 10/; s/^pm.min_spare_servers = .*/pm.min_spare_servers = 6/; s/^pm.max_spare_servers = .*/pm.max_spare_servers = 20/' "$POOL"
grep -q '^pm.max_requests' "$POOL" || echo 'pm.max_requests = 2000' >> "$POOL"
INI=/etc/php/8.3/fpm/conf.d/90-orolado.ini
printf 'memory_limit = 256M\nupload_max_filesize = 10M\npost_max_size = 12M\nmax_execution_time = 120\nexpose_php = Off\nopcache.enable = 1\nopcache.memory_consumption = 128\nopcache.validate_timestamps = 1\nopcache.revalidate_freq = 2\n' > "$INI"
cp "$INI" /etc/php/8.3/cli/conf.d/90-orolado.ini
sed -i 's/^memory_limit = .*/memory_limit = 512M/' /etc/php/8.3/cli/conf.d/90-orolado.ini

# 6) Droits : le site (www-data) écrit dans data/ et feedcache/.
mkdir -p /var/www/orolado/data /var/www/orolado/feedcache
chown -R www-data:www-data /var/www/orolado

# 7) Ligne directe + moteur continu.
cp orolado-direct.service /etc/systemd/system/orolado-direct.service
systemctl daemon-reload
systemctl enable orolado-direct >/dev/null 2>&1

# 8) Mise en ligne automatique depuis GitHub (toutes les minutes).
cp deployer.sh /usr/local/bin/orolado-deployer.sh
sed -i 's/$//' /usr/local/bin/orolado-deployer.sh
cp orolado-deploy.service orolado-deploy.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now orolado-deploy.timer >/dev/null 2>&1

nginx -t
systemctl restart php8.3-fpm
systemctl reload nginx || systemctl restart nginx
systemctl restart orolado-direct
echo "OROLADO : configuration en place."
