#!/bin/bash
# OROLADO — mise en ligne automatique sur le VPS (lancé toutes les minutes par orolado-deploy.timer).
# Si GitHub (branche main) a changé : copie le nouveau code dans /var/www/orolado, SANS toucher
# aux données du serveur (data/, feedcache/), puis relance la ligne directe si son code a changé.
# Comme chez Hostinger : « git push origin main » suffit.
set -euo pipefail
REPO=/opt/orolado-git
SITE=/var/www/orolado
export GIT_SSH_COMMAND="ssh -i /root/.ssh/github_deploy -o IdentitiesOnly=yes -o BatchMode=yes"

if [ ! -d "$REPO/.git" ]; then
  git clone -q git@github.com:druidlebaobab1/OROLADO.git "$REPO"
fi
cd "$REPO"
before=$(git rev-parse HEAD)
git fetch -q origin main
after=$(git rev-parse origin/main)
if [ "$before" = "$after" ] && [ -f "$SITE/.deploye" ] && [ "$(cat "$SITE/.deploye")" = "$after" ]; then
  exit 0
fi
git reset -q --hard "$after"

# Le code change-t-il pour la ligne directe / le moteur ?
relance=0
if [ "$before" != "$after" ] && git diff --name-only "$before" "$after" | grep -qE '^(serveur-direct/|scripts/moteur-prix\.php|feed_lib\.php|feed_live_lib\.php)'; then
  relance=1
fi
[ -f "$SITE/.deploye" ] || relance=1

rsync -a --delete \
  --exclude '.git/' \
  --exclude 'data/***' --include 'data/.htaccess' \
  --exclude 'feedcache/***' \
  --exclude '.deploye' \
  --exclude '/.env' \
  --exclude '/.user.ini' \
  "$REPO/" "$SITE/"
# Les .htaccess de data/ et feedcache/ venant de GitHub (sans effet sous nginx, gardés pour mémoire).
cp -f "$REPO/data/.htaccess" "$SITE/data/.htaccess" 2>/dev/null || true
chown -R www-data:www-data "$SITE"
echo "$after" > "$SITE/.deploye"

if [ "$relance" = 1 ]; then systemctl restart orolado-direct; fi
logger -t orolado-deploy "mis en ligne ${after:0:7} (relance moteur: $relance)"
