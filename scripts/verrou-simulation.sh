#!/bin/sh
# ============================================================================
# CADENAS DE LA SIMULATION OROLADO (posé le 29 septembre 2026, après validation)
#
# Refuse d'enregistrer (git commit) toute modification des fichiers qui font
# tourner la courbe et le jeu : moteur de prix, lignes des payouts, diffusion
# des prix en direct, affichage de la courbe, règlement des trades.
#
# Pour modifier quand même (seulement avec l'accord du propriétaire) :
#   OROLADO_SIMULATION=ouvert git commit -m "..."
#
# Installé dans .git/hooks/pre-commit par scripts/installer-verrou.sh
# ============================================================================
PROTEGES="feed_lib.php fair_table.php js/fair_table.js feed.php feedcache/.htaccess js/engine.js js/chart.js trade_lib.php"

if [ "$OROLADO_SIMULATION" = "ouvert" ]; then
  exit 0
fi

touches=""
for f in $(git diff --cached --name-only); do
  for p in $PROTEGES; do
    if [ "$f" = "$p" ]; then touches="$touches $f"; fi
  done
done

if [ -n "$touches" ]; then
  echo ""
  echo "=================================================================="
  echo " CADENAS : la simulation d'OROLADO est verrouillée."
  echo " Fichiers protégés touchés :$touches"
  echo ""
  echo " Ces fichiers font tourner la courbe et le jeu. Ils ont été validés"
  echo " (foule de visiteurs simulée, 1 milliard de trades simulés)."
  echo " Ne les modifier qu'avec l'accord écrit du propriétaire, puis :"
  echo "   OROLADO_SIMULATION=ouvert git commit -m \"...\""
  echo "=================================================================="
  echo ""
  exit 1
fi
exit 0
