# OROLADO — tests manuels (patch incrémental)

## Trades
- [ ] Ouvrir 5 trades en même temps → OK
- [ ] 6e trade → toast « Maximum 5 trades en cours »
- [ ] Refresh au milieu d’un trade → settlement toujours OK à l’expiry
- [ ] Démo et réel : soldes séparés ; une perte/gain touche le bon compte

## Historique
- [ ] Sous le graphe : max 2 lignes « Derniers trades »
- [ ] « Historique complet » ouvre la feuille avec plus de lignes
- [ ] 0 trade → message « Aucun trade pour l’instant… »

## Marchés
- [ ] Scroll horizontal : V100, Stable, V75, Crash 300, Boom 300
- [ ] Sélection encadrée or ; graphe suit l’actif
- [ ] Chaque marché a une courbe distincte (pas la même montagne + offset)
- [ ] Crash = chutes brusques ; Boom = fusées haussières

## Settlement multi (critique)
- [ ] 5 trades 10s sur actifs différents → les 5 se résolvent (won/lost/void)
- [ ] Aucun « EN COURS » coincé après expiry
- [ ] Refresh au milieu → à l’expiry solde correct (mises perdues / gains crédités)
- [ ] Démo ≠ réel : crédit/débit sur le bon compte
- [ ] 6e trade → toast max 5

## Aide
- [ ] Bouton Aide → formulaire sujet + message
- [ ] Message apparaît dans Admin → Messages
- [ ] Résoudre un message côté admin

## Admin
- [ ] Recherche par `ORO-xxxxxx` / e-mail / nom / tel
- [ ] Clic ligne user → fiche + ajustement avec motif obligatoire
- [ ] Métriques : dépôts validés, retraits payés, soldes réels, net plateforme
- [ ] Valider dépôt pending → crédit une seule fois (anti double-clic)

## Profil / inscription
- [ ] Nouvel inscrit : numéro de téléphone obligatoire
- [ ] Accès démo direct sans login ; Connexion/Inscription en haut
- [ ] Max 2 trades ouverts ; 6e (3e) bloqué
- [ ] Durées : 10s / 30s / 1 min / 5 min / 10 min
- [ ] Aide dans la barre du haut (pas de FAB)
- [ ] Historique des trades sous CALL/PUT
