# Risques et justification de séquence — U4 Catalogue

## Heuristique

**Squelette marchant d’abord** (Cockburn) + **WSJF informel** (Reinertsen / SAFe) : score ≈ (valeur + criticité temps + réduction de risque) ÷ taille.

| Bolt | Valeur | Criticité temps | Réduction risque | Taille | Score relatif | Rang |
|---|---|---|---|---|---|---|
| C1 | Haute (débloque vente) | Haute | Archi UI+IPC+domain | M | Très haut | 1 |
| C2 | Haute (ENF-16) | Haute | Ergonomie saisie | M | Haut | 2 |
| C3 | Haute (volume) | Moyenne | Format fichier inconnu | M | Haut | 3 |
| C4 | Moyenne (confort saisie) | Basse à J1 | OCR / CR-02 | L | Moyen | 4 |

## Pourquoi cet ordre

1. **C1 en premier** — prouve les couches (domain, db, IPC, UI, masquage) avant d’investir dans le volume et l’OCR. Aligné sur les pratiques Walking Skeleton.
2. **C2 avant C3** — ENF-16 est le goulot métier du registre papier ; l’import aide mais ne remplace pas la saisie clavier. Série imposée par l’équipe solo (écart vs parallélisme théorique du carnet).
3. **C4 en dernier** — hors chemin critique J1 ; dépend du chemin d’import validé (C3) et du spécimen éventuel (CR-02).

## Écart au DAG 2.7

Le DAG local n’a qu’un nœud (`u4-catalog`). Aucun écart topologique entre unités. L’ordre ci-dessus est **économique intra-unité**.

## Risques suivis

| Risque | Mitigation dans la séquence |
|---|---|
| OCR / CR-02 | Isolé en C4 ; J1 sans photo |
| Format fichier inconnu | C3 après UI stable ; mapping générique |
| ENF-16 raté | C2 avant J1 ; chronométrage jalon |
| Hooks non exécutables | DoD C1 |
