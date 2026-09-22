# Spécification d’interaction — Catalogue U4

Format : template composant (`.claude/knowledge/aidlc-design-agent/component-spec-template.md`). Desktop Electron ; clavier prioritaire (Q4-A).

## CatalogShell

| Field | Value |
|---|---|
| Component | CatalogShell |
| Description | Conteneur de l’onglet Catalogue : en-tête d’actions selon le rôle, zone recherche+fiche ou assistant |
| Category | layout / navigation |

### States

| State | Description | Trigger |
|---|---|---|
| default | Vue recherche + fiche | ouverture onglet |
| wizard | Assistant import ou photo | clic Importer / Photo |
| complete-list | Liste « à compléter » | clic À compléter |
| seller | Actions création masquées | rôle vendeur |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA role | `main` pour la zone catalogue ; onglet = `tab` / `tabpanel` |
| Keyboard | `Tab` entre zones ; raccourcis documentés sous CatalogSearch |
| Focus | À l’ouverture de l’onglet → champ Recherche |

---

## CatalogSearch

| Field | Value |
|---|---|
| Component | CatalogSearch |
| Description | Champ de recherche catalogue (désignation, synonyme, code interne, code-barres) |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| default | Vide, focus ready | mount |
| typing | Résultats mis à jour (debounce court) | frappe ≥ 1 caractère utile |
| loading | Indicateur dans la liste | requête en cours |
| empty | Aucun résultat | 0 hit |
| error | Message système sous le champ | échec lecture locale |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| query | string | yes | "" | Texte saisi |
| onQueryChange | (q: string) => void | yes | — | Mise à jour |
| role | "vendeur" \| "gerant" \| "proprietaire" | yes | — | Filtre d’affichage résultats |

### Keyboard

| Touche | Action |
|---|---|
| Caractères | Alimentent la recherche |
| ↓ / ↑ | Parcourir les résultats |
| Entrée | Ouvrir la fiche (propriétaire) ou annoncer sélection |
| Échap | Vider la requête |

### Accessibility

| Requirement | Implementation |
|---|---|
| Label | Libellé visible « Recherche » |
| ARIA | `role="combobox"` + `aria-controls` liste + `aria-activedescendant` |
| Contrast | Texte 4.5:1 ; focus visible ≥ 2 px |

---

## CatalogResultList

| Field | Value |
|---|---|
| Component | CatalogResultList |
| Description | Liste des articles trouvés ; sans coûts pour le vendeur |
| Category | display |

### States

| State | Description | Trigger |
|---|---|---|
| default | Lignes désignation + code + prix vente | hits |
| empty | Message guidé | aucun hit |
| selected | Ligne active | flèches / clic |
| inactive-badge | Badge « Désactivé » | article `active=false` (vue propriétaire) |

### Accessibility

| Requirement | Implementation |
|---|---|
| ARIA | `listbox` / `option` |
| Screen reader | Annonce du nombre de résultats après mise à jour |

---

## ArticleForm

| Field | Value |
|---|---|
| Component | ArticleForm |
| Description | Création / édition fiche ; quatre champs obligatoires minimum (EF-U2-06) |
| Category | input |

### States

| State | Description | Trigger |
|---|---|---|
| create | Formulaire vide ou partiellement prérempli (série) | nouveau |
| edit | Champs chargés | sélection résultat |
| serial | Après save : reset + conserve catégorie/unité/emplacement | EF-U2-07 |
| read-only | Vendeur | rôle |
| invalid | Erreurs inline | blur / submit |
| saving | Bouton désactivé | commit local |

### Props / Inputs

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| mode | "create" \| "edit" \| "duplicate" | yes | — | Mode |
| values | ArticleFormValues | yes | — | Champs |
| showCosts | boolean | yes | false | Afficher prix d’achat / CUMP (jamais vendeur) |
| onSave | () => Promise\<Result\> | yes | — | Persistance |
| onDuplicate | () => void | no | — | EF-U2-08 |
| onDeactivate | () => void | no | — | EF-U2-05 |

### Keyboard

| Touche | Action |
|---|---|
| Tab | Parcours des champs |
| Entrée | Enregistrer si valide |
| Échap | Annuler brouillon (confirm si dirty) |

### Accessibility

| Requirement | Implementation |
|---|---|
| Labels | Au-dessus de chaque champ (pas placeholder seul) |
| Errors | `aria-describedby` + texte sous le champ |
| Suggestion prix | Texte « Suggestion : N FCFA (écart ±X) » ; bouton Refuser / Accepter |

---

## ImportPhotoWizard

| Field | Value |
|---|---|
| Component | ImportPhotoWizard |
| Description | Assistant 4 étapes partagé import fichier / photo |
| Category | layout |

### States

| State | Description | Trigger |
|---|---|---|
| step-1 | Choix fichier (disque) | start |
| step-2 | Mapping colonnes ou édition extraction | après fichier OK |
| step-3 | Prévisualisation partagée | mapping/OCR prêt |
| step-4 | Validation + rapport | confirm |
| error-line | Ligne en erreur non bloquante | validation ligne |

### Keyboard

| Touche | Action |
|---|---|
| Entrée | Étape suivante si valide |
| Échap | Fermer assistant (confirm si données) |
| Tab | Parcours mapping / tableau prévisualisation |

### Accessibility

| Requirement | Implementation |
|---|---|
| Progress | `aria-current="step"` sur l’étape active ; libellés « Étape n sur 4 » |
| Table preview | Table HTML sémantique ; statut ligne en texte (OK / Avertissement / Erreur), pas couleur seule |
| Focus | Au changement d’étape → titre de l’étape |

---

## Transitions visibles

| De | Vers | Feedback |
|---|---|---|
| Recherche → Fiche | Sélection ligne | Fiche remplie ; focus premier champ éditable (propriétaire) |
| Save série | Formulaire vide | Toast « Article enregistré » ; focus désignation |
| Import → Preview | Étape 3 | Compteurs OK / warn / err en tête |
| Preview → Done | Étape 4 | Lien téléchargement rapport erreurs |
| Désactivation | Liste | Badge ; confirmation destructive « Désactiver » (pas supprimer) |
