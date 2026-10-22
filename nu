#!/bin/bash
# OROLADO — mise à jour de sécurité de Node.js sur le VPS (alerte Hostinger du 22/10/2026 : 22.23.4 ou plus).
# À lancer en root dans le terminal du VPS :  curl -sL orolado.com/nu | bash
set -e
echo "Mise a jour de Node.js en cours (1 minute)..."
curl -fsSL https://raw.githubusercontent.com/tj/n/v10.2.0/bin/n -o /tmp/n-orolado
N_PREFIX=/usr/local bash /tmp/n-orolado 22 >/dev/null
rm -f /tmp/n-orolado
hash -r
systemctl restart orolado-direct
echo ""
echo "Version installee : $(/usr/local/bin/node -v)"
systemctl is-active --quiet orolado-direct && echo "Ligne des prix : OK" || echo "Ligne des prix : PROBLEME"
echo "TERMINE"
