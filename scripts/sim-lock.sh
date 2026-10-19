#!/bin/sh
# SIMULATIONS VERROUILLÉES (propriétaire, 2026-10-19) : les courbes sont validées, on n'y touche plus.
# Toute retouche de indices.json / feed_lib.php / fair_table.php doit être demandée par le propriétaire.
# Vérification : sh scripts/sim-lock.sh  → « OK » si rien n'a bougé.
cd "$(dirname "$0")/.." || exit 1
sha256sum -c --quiet <<'SUMS' && echo "OK : simulations inchangées"
3eaa4d8d873485d0362e80cd51873f7c9e2990cb6732d7051918db11cab3fd4e  indices.json
a70fdd1ce50483db56642ab8139e05a293f37806bacfd133f3e9a66e993ca233  feed_lib.php
4f24dde31d437fbe5a39b059a4214b0120ffb7e043b7d97300f03d94a72a76f7  fair_table.php
SUMS
