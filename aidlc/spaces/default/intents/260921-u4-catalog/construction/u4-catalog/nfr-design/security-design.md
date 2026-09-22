# Conception sécurité — U4 Catalogue (`u4-catalog`)

> Résumé consolidé confirmé (`Looks correct`). Q2-A : réutiliser le socle ; pas d’auth catalogue séparée.

## Objectifs (NFR3.3–NFR3.5)

| ID | Exigence | Design |
|---|---|---|
| NFR3.3 / ENF-08 | Base chiffrée ; pas de secrets en dépôt ; pas de PIN/prix d’achat/jeton dans les logs | SQLCipher local existant ; Zod IPC ; logs sans champs sensibles |
| NFR3.4 / CT-09 | Vendeur sans prix d’achat / CUMP / marge / valorisation | SensitiveDataGuard + projection IPC + DOM non monté (BR3.17) |
| NFR3.5 / CR-02 | OCR : pas d’image ni prix d’achat chez un tiers avant spécimen | Adaptateur on-device par défaut ; C-04 non branché |

## Contrôles

### Authentification / session

- Réutilise la session opérateur / rôle de la caisse déjà livrée.
- Aucun compte catalogue distinct ; `FORBIDDEN_ROLE` sur mutations si rôle vendeur.

### Autorisation (défense en profondeur)

1. **Main / domaine** : SensitiveDataGuard sur lectures enrichies.
2. **IPC** : réponses `ProductView` / `ProductSummary` déjà filtrées ; canaux mutation refusés au vendeur.
3. **UI** : RoleGate — nœuds coûts et actions création/import/photo absents du DOM.

### Validation & surface d’attaque

- Zod strict des deux côtés du pont (C-01) ; taille max payload ; unknown fields ignorés en lecture.
- Chemins fichier import/photo : fichiers déjà sur disque ; pas de stream caméra ; pas d’URL distante depuis le renderer.
- Jamais de `eval` / HTML brut pour ligne OCR ; texte échappé à l’affichage.

### Données au repos / en transit

- Au repos : SQLite chiffrée (socle).
- Transit métier catalogue : IPC local uniquement (pas HTTPS pour le cœur).
- Si OCR tiers un jour (après spécimen) : HTTPS + payload sans prix d’achat (BR3.8) ; ADR obligatoire.

### Audit

- Modifications prix/plancher → `journal_audit` + outbox dans la **même** transaction (BR3.16).
- Désactivation, import commit, capture commit : événements auditables.

### Secrets

- Aucune clé API OCR / credential dans le dépôt.
- Paramètres métier (`prix.multiple_conseille`, etc.) via `parametres`, pas en dur.

## Menaces et mitigations

| Menace | Mitigation |
|---|---|
| Vendeur voit CUMP | Triple filtre BR3.17 + tests |
| Fuite registre vers cloud | CR-02 / BR3.8 ; défaut on-device |
| Injection via CSV/OCR | Zod + validation Catalog avant écriture |
| Delete article | Interdit ; désactivation seule (BR3.14) |
