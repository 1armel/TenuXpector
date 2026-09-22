# Accessibilité — Catalogue U4

Cible : **WCAG 2.1 niveau AA** (réponse Q4-A). Plateforme : desktop Electron / clavier. Cibles tactiles 44×44 et parcours tablette : **hors U4**.

## Checklist

### Perceivable

| ID | Exigence | Application catalogue | Statut |
|---|---|---|---|
| P1 | Contraste texte ≥ 4.5:1 | Tokens `#1c2430` sur fond clair ; vérifier boutons secondaires | À vérifier en implémentation |
| P2 | Contraste UI ≥ 3:1 | Bordures focus, icônes statut import | À vérifier |
| P3 | Pas de sens par la couleur seule | Statuts import : texte OK / Avertissement / Erreur (+ icône optionnelle) | Spécifié |
| P4 | Alternatives texte | Image registre : nom de fichier + « Page N » ; pas d’OCR annoncé comme certain | Spécifié |
| P5 | Pas de flash > 3/s | Aucune animation agressive | Spécifié |

### Operable

| ID | Exigence | Application catalogue | Statut |
|---|---|---|---|
| O1 | Tout au clavier | Recherche, fiche, wizard (voir `interaction-spec.md`) | Spécifié |
| O2 | Focus visible | Outline ≥ 2 px, contraste 3:1 ; jamais `outline: none` sans remplacement | Spécifié |
| O3 | Ordre de focus logique | Recherche → résultats → fiche → actions | Spécifié |
| O4 | Pas de piège clavier | Échap ferme wizard / annule fiche | Spécifié |
| O5 | Raccourcis documentés | Entrée valider, flèches liste — aide contextuelle courte | Spécifié |
| O6 | Cibles 44×44 | Non requis U4 (Q4-A) | N/A U4 |

### Understandable

| ID | Exigence | Application catalogue | Statut |
|---|---|---|---|
| U1 | Langue `lang="fr"` | Document renderer | À poser si absent |
| U2 | Labels visibles | Tous les champs ArticleForm | Spécifié |
| U3 | Erreurs spécifiques | « Le prix plancher ne peut pas dépasser le prix de vente » | Spécifié |
| U4 | Navigation cohérente | Onglet Catalogue stable ; même wizard import/photo | Spécifié |
| U5 | Confirmation destructive | Désactivation (jamais « supprimer ») | Spécifié |

### Robust

| ID | Exigence | Application catalogue | Statut |
|---|---|---|---|
| R1 | HTML sémantique | `main`, `nav`/`tab`, `table` prévisualisation, titres h1–h2 | Spécifié |
| R2 | ARIA correct | combobox / listbox / dialog wizard ; préférer natif | Spécifié |
| R3 | Masquage vendeur | Nœuds coûts absents du DOM (pas `hidden` seul) | Spécifié (CT-09) |

## Critères d’acceptation UX (extrait)

1. Un propriétaire peut créer 5 articles en série sans quitter le clavier (EF-U2-07, ENF-16).
2. Un vendeur ouvrant Catalogue ne voit aucun prix d’achat / CUMP / marge (CT-09).
3. Un parcours import ou photo aboutit à la même prévisualisation avec compteurs et rapport d’erreurs (FR3.3–FR3.5).
4. Focus visible sur chaque contrôle interactif en navigation Tab seule.
