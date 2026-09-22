# Évaluation de faisabilité — U4 Catalogue et saisie

Entrées : `intent-statement.md` (cadrage d’intention) et les réponses confirmées de `feasibility-questions.md`.

## Verdict

**Faisable, sous trois conditions.** L’interface catalogue s’appuie sur la caisse déjà livrée et sur le schéma articles / unités de vente déjà en base. Aucun nouveau système à brancher. Aucun compte cloud à ouvrir pour cette unité. La seule incertitude technique réelle est la **reconnaissance de texte sur photo du registre** : elle reste dans le périmètre, mais le moyen n’est pas figé.

Les trois conditions :

1. **Isoler la reconnaissance de texte.** La preuve de concept compare deux voies (sur l’appareil, et un outil ou service déjà connu), puis on tranche **avant** de figer l’adaptateur.
2. **Ne rien envoyer à un tiers avant d’avoir vu un spécimen du registre.** On ne sait pas encore si les photos montrent des prix d’achat. Tant que ce n’est pas vérifié, pas d’envoi d’image.
3. **Ne pas bloquer U4 sur le registre réel.** La démonstration de fin d’unité se fait hors boutique, avec des données de démonstration. Le volume réel (plus de 3 000 références) sert à dimensionner l’import et l’ergonomie, pas à attendre le papier.

## Viabilité par domaine

| Domaine | Viabilité | Commentaire |
|---|---|---|
| Fiche article, recherche, désactivation, saisie clavier | Élevée | Même application de caisse, données déjà prévues en base. Pas d’autre logiciel à intégrer. |
| Import de fichier | Élevée | Format encore inconnu : un import où l’opérateur associe les colonnes à l’écran évite de parier sur Excel ou CSV trop tôt. |
| Catalogue de plus de 3 000 références | Moyenne | Faisable si la saisie clavier et l’import restent rapides (cible déjà posée : 50 articles en moins de 15 min pour un opérateur formé). Le volume pèse sur l’ergonomie, pas sur un verrou technologique. |
| Photo du registre → fichier image sur le PC | Élevée | Photo au téléphone, copie sur le poste : pas de webcam obligatoire. |
| Reconnaissance de texte | Moyenne | Pas de moteur maison. Un outil ou service connu, derrière une interface remplaçable. Les deux voies sont essayées dans la preuve de concept. |
| Appel réseau pour l’import photo | Acceptable **seulement** pour cet import, si la preuve de concept le retient | Tout le reste de la caisse reste hors ligne. Pas de compte AWS. |
| Démo hors boutique | Élevée | Aucun bloqueur d’organisation. Le registre complet peut arriver à l’installation. |

## Analyse des risques

Les risques sont suivis dans `raid-log.md`. Les deux qui peuvent faire dérailler **cette** unité :

- **Figé trop tôt un service photo** alors que le spécimen du registre n’a pas été vu (prix d’achat éventuellement visibles).
- **Construire un moteur de reconnaissance maison**, alors que le besoin est d’entrer les produits une première fois sans tout retaper.

## Recommandations

- Construire d’abord fiche, recherche, saisie clavier et import générique — ce qui débloque la démo et la vente réelle hors photo.
- Mener la preuve de concept photo en parallèle, sur des images déjà sur le PC, sans réseau d’abord, puis avec un outil connu si besoin.
- Trancher le moyen de reconnaissance seulement après le spécimen du registre.
- Ne pas ouvrir d’infrastructure cloud « pour le catalogue ».

## Traçabilité

| Élément de l’intention (`intent-statement.md`) | Couvert ici par |
|---|---|
| UI catalogue embarquée dans la caisse, socle u1–u3 | Intégration uniquement à la caisse déjà livrée |
| FR3.1 à FR3.8 y compris photo du registre | Viabilité par domaine ; photo non reportée |
| Preuve de concept OCR et choix du moyen avant de figer l’adaptateur | Condition 1 ; Q2 |
| Prix d’achat jamais transmis à un tiers | Condition 2 ; Q5 |
| Démo hors boutique en fin d’unité | Condition 3 ; Q8 |
| Catalogue très large, saisie sans formation lourde | Volume > 3 000 ; import générique ; saisie clavier |

## Perspectives (plateforme et conformité)

- **Plateforme** : U4 n’a pas de paysage AWS. Un éventuel appel HTTPS vers un service d’extraction de texte n’est pas un hébergement, ni un compte cloud à provisionner.
- **Conformité** : le risque utile ici n’est pas la carte bancaire ni le dossier client, c’est la **confidentialité des coûts d’achat** sur une photo envoyée dehors. Tant que le spécimen n’est pas vu, on traite toute photo comme potentiellement sensible.

## Assumptions & Open Questions

None.
