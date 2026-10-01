#!/bin/sh
# ============================================================================
# CADENAS OROLADO (simulation posé le 29 septembre 2026, argent le 1er octobre 2026)
#
# 1) SIMULATION : moteur de prix, lignes des payouts, diffusion des prix,
#    affichage de la courbe, règlement des trades.
#    Pour modifier (seulement avec l'accord du propriétaire) :
#      OROLADO_SIMULATION=ouvert git commit -m "..."
#
# 2) ARGENT : soldes, dépôts (crypto OxaPay, carte Flutterwave), retraits,
#    comptes, admin, API. Validés par les tests (trades, sécurité, comptes,
#    retraits, dépôts, crypto, vol de paiement, historique, admin).
#    Pour modifier (seulement avec l'accord du propriétaire) :
#      OROLADO_ARGENT=ouvert git commit -m "..."
#
# Installé dans .git/hooks/pre-commit (copie de ce fichier).
# ============================================================================
PROTEGES="feed_lib.php fair_table.php js/fair_table.js feed.php feedcache/.htaccess js/engine.js js/chart.js trade_lib.php"
PROTEGES_ARGENT="orolado_lib.php api.php account_lib.php admin_lib.php admin.php history_lib.php wipe_lib.php retraits-paiement.php api/deposit-confirm.php api/deposit-initiate.php api/deposit-verify-crypto.php api/deposit-webhook.php api/flutterwave-callback.php api/flutterwave-charge.php api/flutterwave-checkout.php api/flutterwave-status.php api/flutterwave-verify.php api/flutterwave-webhook.php api/maketou-webhook.php api/oxapay-invoice.php api/oxapay-status.php api/oxapay-webhook.php"

sim=""
arg=""
for f in $(git diff --cached --name-only); do
  if [ "$OROLADO_SIMULATION" != "ouvert" ]; then
    for p in $PROTEGES; do
      if [ "$f" = "$p" ]; then sim="$sim $f"; fi
    done
  fi
  if [ "$OROLADO_ARGENT" != "ouvert" ]; then
    for p in $PROTEGES_ARGENT; do
      if [ "$f" = "$p" ]; then arg="$arg $f"; fi
    done
  fi
done

if [ -n "$sim" ] || [ -n "$arg" ]; then
  echo ""
  echo "=================================================================="
  if [ -n "$sim" ]; then
    echo " CADENAS SIMULATION : fichiers protégés touchés :$sim"
    echo "   (accord du propriétaire, puis OROLADO_SIMULATION=ouvert git commit ...)"
  fi
  if [ -n "$arg" ]; then
    echo " CADENAS ARGENT : fichiers protégés touchés :$arg"
    echo "   (accord du propriétaire, puis OROLADO_ARGENT=ouvert git commit ...)"
  fi
  echo " Ces fichiers ont été validés. Ne les modifier qu'avec l'accord écrit"
  echo " du propriétaire."
  echo "=================================================================="
  echo ""
  exit 1
fi
exit 0
