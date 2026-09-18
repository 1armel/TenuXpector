---
name: spec-driven-dual-target-ops
depth: Comprehensive
keywords: []
description: Produit greenfield dont les exigences sont deja arbitrees, a livrer sur deux cibles d'execution avec un vrai volet serveur
skeleton: on
change_control: strict
---

# scope spec-driven-dual-target-ops

Scope composé pour un produit greenfield dont la spécification existe **déjà**
et fait foi, mais dont la construction porte trois charges lourdes : prouver la
faisabilité sur deux cibles d'exécution, concevoir des contrats d'interface
stables, et exploiter un vrai serveur de production.

Composé à partir d'un score d'autonomie de 55/100 (profil : ambiguïté d'intention
faible, hypothèses non résolues faibles, incertitude structurelle moyenne, charge
de vérification et risque élevés). 23 étapes sur 33 s'exécutent.

Change Control est `strict` : dès qu'une entrée change après qu'une personne l'a
approuvée ou confirmée, cette approbation se rouvre au lieu d'être consignée en
passant.

## Pourquoi cette forme

Trois arbitrages définissent ce scope.

**Les exigences ne sont pas réécrites.** Quand la décomposition fonctionnelle,
les contraintes, le hors-périmètre, les règles de calcul et les exigences non
fonctionnelles chiffrées existent déjà dans un document arbitré et déclaré source
de vérité, les redériver est de la duplication. `requirements-analysis`,
`nfr-requirements`, `user-stories` et `market-research` sont donc repliés, et les
étapes avales lisent le document d'exigences directement.

**La faisabilité se prouve avant de concevoir.** Deux cibles d'exécution à partir
d'un cœur partagé, c'est une parité à démontrer, pas à supposer. `feasibility`
s'exécute tôt et porte une preuve de concept sur les deux cibles, avant que la
conception ne s'engage.

**L'exploitation est réelle.** Un serveur de production à provisionner, durcir,
sauvegarder et déployer, plusieurs artefacts à publier en version cohérente, et
des mises en service successives sur des données irréversibles : les étapes
d'exploitation `deployment-pipeline`, `environment-provisioning` et
`deployment-execution` s'exécutent. `observability-setup` est replié à part,
parce qu'aucune fonction métier ne dépend du serveur.

## Membres

23 étapes EXECUTE, 10 SKIP, 20 portes.

Repliées (SKIP) : `market-research`, `team-formation`, `rough-mockups`,
`reverse-engineering`, `requirements-analysis`, `user-stories`,
`nfr-requirements`, `observability-setup`, `incident-response`,
`feedback-optimization`.

`reverse-engineering` est de toute façon réservé au brownfield. Les autres replis
sont des décisions économiques : chacun est couvert soit par un artefact existant,
soit par une autre étape EXECUTE.

`keywords` est vide : ce scope est composé, pas inférable. Il se résout uniquement
par `--scope spec-driven-dual-target-ops`. Le rendre inférable est un choix humain
explicite, qui n'a pas été accordé à la porte d'approbation.
