# ADR 002 — Voie d’impression thermique

- **Statut** : accepté (provisoire jusqu’à mesure physique Windows)
- **Date** : 2026-09-20
- **Unité** : `u1-pc-proof`
- **Exigences** : NFR13

## Contexte

La voie USB qui fonctionnera sous Windows n’est pas connue d’avance. La preuve
de concept doit pouvoir comparer sans réécrire l’appelant.

## Décision

Interface unique `ReceiptPrinter` avec **trois** implémentations :

1. **USB raw** (`UsbReceiptPrinter`) — écriture d’octets ESC/POS sur le périphérique (`TENU_PRINTER_DEVICE`, défaut `\\.\USB001`).
2. **File Windows** (`SpoolerReceiptPrinter`) — `copy /b` vers un partage local (`TENU_PRINTER_SHARE`).
3. **Aperçu écran** (`PreviewReceiptPrinter`) — toujours disponible, utilisé par les tests et comme repli.

Le choix se fait à l’appel (`target`), pas dans une constante globale. Une
impression échouée **ne bloque jamais** l’appelant (`printSafely`).

## Conséquences

- La vérification physique USB reste manuelle sur PC Windows (jalon J0).
- L’ADR sera mis à jour avec la voie retenue après mesure terrain.

## Alternatives rejetées

| Option | Motif de rejet |
|---|---|
| Une seule voie USB hardcodée | Risque de blocage J0 si le port/driver diffère |
| Bibliothèque ESC/POS tierce lourde | Moins de contrôle des octets pour la preuve |
| Impression via pilote GDI | Transforme le ticket ; hors ESC/POS brut |
