# Dépendances externes — U4 Catalogue

Carte des éléments **hors équipe** qui peuvent bloquer un Bolt.

| Dépendance | Owner | Délai typique | Bolt bloqué | Si ça glisse |
|---|---|---|---|---|
| Spécimen registre papier (A-01) | Propriétaire boutique | Inconnu | Décision OCR en **C4** seulement | Figer la voie **sur l’appareil** (CR-02) ; J1 non bloqué |
| Fichier fournisseur réel | Boutique / toi | Inconnu | Qualité mapping **C3** | Utiliser CSV de démonstration ; mapping générique |
| Bibliothèques OCR (hash / ADR) | Toi / upstream npm | Jours | **C4** | PoC locale ; pas de vendor tant que CR-02 |
| Compte / API OCR tiers | — | — | **C4** si retenu | **Non branché** tant que pas de spécimen |
| Imprimante USB (étiquette) | Matériel déjà prévu U3 | — | Démo étiquette **C2** | Aperçu `preview` sans papier |

Aucune API cloud requise pour J1. La Construction reste faisable hors boutique sur données de démonstration.
