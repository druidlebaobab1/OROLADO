#!/bin/bash
# Branche orolado.org, orolado.net et orolad0.com sur leurs dossiers (sites/outils, sites/academie, sites/quiz).
# À lancer UNE fois : sudo bash /var/www/orolado/serveur-direct/vps/sites-annexes.sh
# Sécurité : si nginx refuse la configuration, tout est annulé et orolado.com continue comme avant.
set -u
SRC=/var/www/orolado/serveur-direct/vps/nginx-sites-annexes.conf
DST=/etc/nginx/sites-available/orolado-annexes
LNK=/etc/nginx/sites-enabled/orolado-annexes
if [ ! -f "$SRC" ]; then echo "ERREUR : $SRC introuvable (le site est-il bien à jour ?)"; exit 1; fi
cp "$SRC" "$DST"
ln -sf "$DST" "$LNK"
if nginx -t 2>/tmp/annexes-test.txt; then
  systemctl reload nginx
  echo "OK : orolado.org, orolado.net et orolad0.com sont branchés."
else
  rm -f "$LNK"
  echo "ANNULÉ : nginx a refusé la configuration, rien n'a changé. Détail :"
  cat /tmp/annexes-test.txt
  exit 1
fi
