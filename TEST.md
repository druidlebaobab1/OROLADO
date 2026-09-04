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
- [ ] Nouvel inscrit : WhatsApp obligatoire
- [ ] publicId visible (ORO-…)
- [ ] Réinitialiser démo → confirm ; réel inchangé
- [ ] Recharge uniquement en mode réel
