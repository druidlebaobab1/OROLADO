#!/bin/bash
# Branche orolado.org, orolado.net et orolad0.com sur leurs dossiers (sites/outils, sites/academie, sites/quiz)
# et redirige orolado.app vers orolado.com.
# À lancer : sudo bash /var/www/orolado/serveur-direct/vps/sites-annexes.sh (on peut le relancer sans risque).
# Sécurité : si nginx refuse la nouvelle configuration, l'ancienne est remise telle quelle et rien ne change.
set -u
SRC=/var/www/orolado/serveur-direct/vps/nginx-sites-annexes.conf
DST=/etc/nginx/sites-available/orolado-annexes
LNK=/etc/nginx/sites-enabled/orolado-annexes
BAK=/etc/nginx/orolado-annexes.avant
if [ ! -f "$SRC" ]; then echo "ERREUR : $SRC introuvable (le site est-il bien à jour ?)"; exit 1; fi
HAD_LINK=0; [ -e "$LNK" ] && HAD_LINK=1
rm -f "$BAK"; [ -f "$DST" ] && cp "$DST" "$BAK"
cp "$SRC" "$DST"
ln -sf "$DST" "$LNK"
if nginx -t 2>/tmp/annexes-test.txt; then
  systemctl reload nginx
  echo "OK : orolado.org, orolado.net et orolad0.com sont branchés ; orolado.app renvoie vers orolado.com."
else
  if [ -f "$BAK" ]; then cp "$BAK" "$DST"; else rm -f "$DST"; fi
  [ "$HAD_LINK" = 0 ] && rm -f "$LNK"
  echo "ANNULÉ : nginx a refusé la configuration, l'ancienne est remise, rien n'a changé. Détail :"
  cat /tmp/annexes-test.txt
  exit 1
fi
