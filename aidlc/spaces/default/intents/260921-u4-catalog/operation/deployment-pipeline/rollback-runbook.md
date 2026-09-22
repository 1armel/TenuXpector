# Runbook rollback — U4 Catalogue (PC boutique)

**Summary Authorization Id:** 0f60ce4780ba597077404a47f827150a7cac18849233c5ada54795fe503229bc

## Quand déclencher

- App ne démarre plus après install.
- Migration SQLite échoue ou corrompt l’usage caisse.
- Régression bloquante (vente, catalogue C1, rôles) constatée au smoke.

## Prérequis (avant chaque install)

1. Conserver le **build N-1** (dossier `out` / installateur précédent) sur support offline.
2. **Backup SQLite** : copie à froid du fichier DB chiffré (app arrêtée) vers support externe daté.
3. Noter la version git / tag / SHA du build entrant.

## Procédure rollback (Q3-A)

### A. Rollback applicatif (préféré)

1. Arrêter `pc-proof` sur le PC caisse.
2. Réinstaller / remplacer par le **build N-1**.
3. Redémarrer ; vérifier smoke caisse (ouverture session → vente simple si données présentes).
4. **Ne pas** réappliquer la migration N si elle a déjà tourné — passer en B si schéma incompatible.

### B. Rollback données (si migration N déjà appliquée)

1. App arrêtée.
2. Remplacer le fichier DB par le **backup pré-migration**.
3. Réinstaller build N-1 (aligné schéma backup).
4. Redémarrer + smoke.
5. Si une migration inverse versionnée existe pour N→N-1 : l’appliquer uniquement sur une copie de test avant prod.

### C. Escalade

- Si backup absent ou illisible : restaurer depuis dernière copie connue hors machine ; documenter perte éventuelle.
- Journaliser l’incident (date, SHA, symptôme) pour le prochain Bolt / ADR.

## Interdits

- Pas de DELETE métier pour « corriger » (invariants append-only).
- Pas de flag cloud pour masquer une régression.
- Pas de push réseau non contrôlé depuis la caisse.

## Temps cible

- Rollback applicatif : < 15 min hors diagnostic.
- Rollback + restore DB : < 30 min si backup local disponible.
