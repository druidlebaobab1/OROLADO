#!/bin/sh
# SIMULATIONS VERROUILLÉES (propriétaire, 2026-10-19) : les courbes sont validées, on n'y touche plus.
# Toute retouche de indices.json / feed_lib.php / fair_table.php doit être demandée par le propriétaire.
# Vérification : sh scripts/sim-lock.sh  → « OK » si rien n'a bougé.
cd "$(dirname "$0")/.." || exit 1
sha256sum -c --quiet <<'SUMS' && echo "OK : simulations inchangées"
37224abaef7b247d7a17be5d8a59cb4ad91fc3df4d6052e26217b8990bdfed6d  indices.json
5ccc6e504c699ae1139bfa83cce52e426877d3caa479c84223e69699989a0f81  feed_lib.php
4f24dde31d437fbe5a39b059a4214b0120ffb7e043b7d97300f03d94a72a76f7  fair_table.php
SUMS
