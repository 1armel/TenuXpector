# Project-Level Rules

> Project-specific specialisation and corrections. Loaded after `org.md` and
> `team.md` as strict-additive guidance; contradictions with broader policy
> are rejected. Populated by practices-discovery and the self-learning loop.
>
> Use sparingly: most teams don't need a project layer. Reach for it
> only when this specific project needs stable, durable guidance beyond the
> team practice (for example, package-specific release checks or an additional
> regression suite for a legacy component).

## Way of Working

<!-- Project-specific specialisation. Example: -->
<!-- This monorepo requires package-scoped branch names and a package owner -->
<!-- review in addition to the team's normal merge policy. -->

## Walking Skeleton

<!-- Project-specific specialisation. Example: -->
<!-- The walking skeleton must exercise the legacy service adapter as well -->
<!-- as the new service boundary. -->

## Testing Posture

<!-- Project-specific specialisation. -->

## Change Control

<!-- Project-specific. Mode: strict or relaxed. Strict here holds for every intent and cannot be changed from chat. -->

## Deployment

<!-- Project-specific specialisation. -->

## Code Style

<!-- Project-specific specialisation. -->

## Tech Stack

<!-- Technology choices locked for this project. -->

## Decided

<!-- Decisions made in earlier stages that should not be re-asked. -->
<!-- Format: DECIDED: [decision] (Stage [slug], [date]) -->

## Scope Overrides

<!-- Custom scope rules for this project. -->

## Forbidden

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: NEVER [behavior] (affirmed [date]) -->
<!-- Example: NEVER throw exceptions across service layer boundaries (affirmed 2026-05-17) -->

- NEVER modifier ni supprimer une entrée des journaux à ajout seul : mouvements de stock, mouvements de caisse, journal d'audit, ouvertures du tiroir, lignes de vente, paiements. Une correction est un mouvement inverse daté du jour. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER modifier une vente, sauf ses champs d'annulation, et une seule fois. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER stocker de quantité mutable sur un article ; la quantité est calculée. [CLAUDE.md, RG-10] (affirmed 2026-09-17)

- NEVER utiliser d'identifiant auto-incrémenté. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER écrire une valeur métier en dur dans le code. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER faire dépendre une fonctionnalité métier du réseau, ni faire lire l'API par l'interface de caisse. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER exiger un transport de synchronisation pour que l'application fonctionne. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER utiliser de nombre flottant pour un montant, une quantité, un CUMP ou un taux. [CLAUDE.md, DEC-04] (affirmed 2026-09-17)

- NEVER montrer à un vendeur le prix d'achat, le CUMP, la marge, le CA cumulé ou la valorisation. [CLAUDE.md, §2.2] (affirmed 2026-09-17)

- NEVER faire dépendre `packages/domain` d'une base, d'un framework d'interface ou du réseau. [CLAUDE.md] (affirmed 2026-09-17)

- NEVER utiliser le type `any`. [CLAUDE.md, ENF-11] (affirmed 2026-09-17)

- NEVER écrire le mot désigné par ENF-14 dans un fichier de code (`apps/`, `packages/`, configuration à la racine), à l'exception du seed ; le script de contrôle ne contient pas non plus ce mot en clair. [CLAUDE.md, ENF-14] (affirmed 2026-09-17)

- NEVER committer de secret ou de clé de chiffrement dans le dépôt, ni journaliser un PIN, un prix d'achat ou un jeton. [ENF-08] (affirmed 2026-09-17)

- NEVER modifier ni supprimer une entrée des journaux à ajout seul : mouvements de stock, mouvements de caisse, journal d'audit, ouvertures du tiroir, lignes de vente, paiements. Une correction est un mouvement inverse daté du jour. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER modifier une vente, sauf ses champs d'annulation, et une seule fois. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER stocker de quantité mutable sur un article ; la quantité est calculée. [CLAUDE.md, RG-10] (affirmed 2026-09-21)

- NEVER utiliser d'identifiant auto-incrémenté. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER écrire une valeur métier en dur dans le code. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER faire dépendre une fonctionnalité métier du réseau, ni faire lire l'API par l'interface de caisse. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER exiger un transport de synchronisation pour que l'application fonctionne. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER utiliser de nombre flottant pour un montant, une quantité, un CUMP ou un taux. [CLAUDE.md, DEC-04] (affirmed 2026-09-21)

- NEVER montrer à un vendeur le prix d'achat, le CUMP, la marge, le CA cumulé ou la valorisation. [CLAUDE.md, §2.2] (affirmed 2026-09-21)

- NEVER faire dépendre `packages/domain` d'une base, d'un framework d'interface ou du réseau. [CLAUDE.md] (affirmed 2026-09-21)

- NEVER utiliser le type `any`. [CLAUDE.md, ENF-11] (affirmed 2026-09-21)

- NEVER écrire le mot désigné par ENF-14 dans un fichier de code (`apps/`, `packages/`, configuration à la racine), à l'exception du seed ; le script de contrôle ne contient pas non plus ce mot en clair. [CLAUDE.md, ENF-14] (affirmed 2026-09-21)

- NEVER committer de secret ou de clé de chiffrement dans le dépôt, ni journaliser un PIN, un prix d'achat ou un jeton. [ENF-08] (affirmed 2026-09-21)

- NEVER envoyer une image du registre ni un prix d'achat à un service tiers tant que le spécimen n'a pas été vu, ni passer un appel réseau depuis l'interface (rendu) : s'il est un jour retenu, il reste dans le processus principal. [Q6, CR-01, CR-02] (affirmed 2026-09-21)

## Mandated

<!-- Populated by practices-discovery affirmation gate. -->
<!-- Format: ALWAYS [behavior] (affirmed [date]) -->
<!-- Example: ALWAYS use Result<T,E> for fallible operations in service layer (affirmed 2026-05-17) -->

- ALWAYS filtrer par `tenant_id` toute requête sur une table métier. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS rattacher toute opération de caisse à une session de caisse ouverte. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS générer les identifiants en UUID v7 côté client. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS lire les valeurs métier (TVA, devise, arrondis, seuils, mentions) depuis la table des paramètres. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS écrire une mutation et son événement `outbox` dans la même transaction. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS calculer les alertes dans `packages/domain`, côté caisse ; une notification n'est qu'un canal. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS faire saisir le comptage de clôture avant tout affichage du théorique. [CLAUDE.md, EF-U3-31] (affirmed 2026-09-17)

- ALWAYS représenter les montants en entiers FCFA, les quantités en millièmes d'unité de base, le CUMP en millièmes de FCFA et les taux en points de base. [CLAUDE.md, DEC-04] (affirmed 2026-09-17)

- ALWAYS faire le contrôle d'accès du tableau de bord dans l'API et le couvrir par un test. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS filtrer par rôle dans la couche de lecture de l'interface de caisse, et côté API pour tout appareil autre que la caisse, avec des tests. [DEC-01] (affirmed 2026-09-17)

- ALWAYS écrire toute nouvelle règle métier d'abord dans `packages/domain`, tests d'abord, puis l'interface. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS maintenir la couverture de `packages/domain` à au moins 90 % des lignes et des branches. [ENF-11] (affirmed 2026-09-17)

- ALWAYS valider avec Zod à toutes les frontières (API, import, lecture des paramètres). [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS compiler en TypeScript strict. [CLAUDE.md, ENF-11] (affirmed 2026-09-17)

- ALWAYS écrire le code en anglais (identifiants, tables, colonnes, fonctions du domaine, clés de paramètres) et tenir à jour le glossaire français-anglais qui le relie aux exigences. [Q5, Q6] (affirmed 2026-09-17)

- ALWAYS rédiger en français tout ce que voit l'utilisateur : interface, tickets, rapports, documents. [CLAUDE.md, Q5] (affirmed 2026-09-17)

- ALWAYS chiffrer la base locale au repos sur chaque cible. [DEC-01, ENF-08] (affirmed 2026-09-17)

- ALWAYS stocker le PIN haché en PBKDF2-SHA256, avec au moins 310 000 itérations et un sel par utilisateur, et le vérifier sans réseau. [EF-U0-06] (affirmed 2026-09-17)

- ALWAYS utiliser TLS 1.2 ou plus récent pour tout échange réseau, avec des jetons révocables. [ENF-08] (affirmed 2026-09-17)

- ALWAYS garder `apps/proprietaire` séparée de `apps/caisse`. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS écrire les commits en Conventional Commits, une unité ou fonctionnalité par branche, avec les identifiants d'exigence dans le message ; citer aussi ces identifiants dans les plans et les tests. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS consigner chaque décision d'architecture dans un ADR sous `docs/adr/`. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS signaler explicitement toute modification du schéma et l'accompagner d'une migration réversible. [CLAUDE.md, EF-U0-02] (affirmed 2026-09-17)

- ALWAYS signaler une demande qui contredit un invariant ou une exigence, et poser la question Q-xx qui bloque une tâche au lieu de supposer. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS terminer chaque tâche par `pnpm typecheck && pnpm lint && pnpm test`. [CLAUDE.md] (affirmed 2026-09-17)

- ALWAYS filtrer par `tenant_id` toute requête sur une table métier. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS rattacher toute opération de caisse à une session de caisse ouverte. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS générer les identifiants en UUID v7 côté client. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS lire les valeurs métier (TVA, devise, arrondis, seuils, mentions) depuis la table des paramètres. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS écrire une mutation et son événement `outbox` dans la même transaction. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS calculer les alertes dans `packages/domain`, côté caisse ; une notification n'est qu'un canal. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS faire saisir le comptage de clôture avant tout affichage du théorique. [CLAUDE.md, EF-U3-31] (affirmed 2026-09-21)

- ALWAYS représenter les montants en entiers FCFA, les quantités en millièmes d'unité de base, le CUMP en millièmes de FCFA et les taux en points de base. [CLAUDE.md, DEC-04] (affirmed 2026-09-21)

- ALWAYS faire le contrôle d'accès du tableau de bord dans l'API et le couvrir par un test. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS filtrer par rôle dans la couche de lecture de l'interface de caisse, et côté API pour tout appareil autre que la caisse, avec des tests. [DEC-01] (affirmed 2026-09-21)

- ALWAYS écrire toute nouvelle règle métier d'abord dans `packages/domain`, tests d'abord, puis l'interface. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS maintenir la couverture de `packages/domain` à au moins 90 % des lignes et des branches. [ENF-11] (affirmed 2026-09-21)

- ALWAYS valider avec Zod à toutes les frontières (API, import, lecture des paramètres). [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS compiler en TypeScript strict. [CLAUDE.md, ENF-11] (affirmed 2026-09-21)

- ALWAYS écrire les identifiants **nouveaux** en anglais (fonctions, types, canaux IPC, clés de paramètres nouvelles) et tenir à jour le glossaire français-anglais ; les tables et colonnes déjà persistées ne se renomment pas dans U4. [Q5] (affirmed 2026-09-21)

- ALWAYS rédiger en français tout ce que voit l'utilisateur : interface, tickets, rapports, documents. [CLAUDE.md, Q5] (affirmed 2026-09-21)

- ALWAYS chiffrer la base locale au repos sur chaque cible. [DEC-01, ENF-08] (affirmed 2026-09-21)

- ALWAYS stocker le PIN haché en PBKDF2-SHA256, avec au moins 310 000 itérations et un sel par utilisateur, et le vérifier sans réseau. [EF-U0-06] (affirmed 2026-09-21)

- ALWAYS utiliser TLS 1.2 ou plus récent pour tout échange réseau, avec des jetons révocables. [ENF-08] (affirmed 2026-09-21)

- ALWAYS garder `apps/proprietaire` séparée de `apps/caisse`. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS écrire les commits en Conventional Commits, une unité ou fonctionnalité par branche, avec les identifiants d'exigence dans le message ; citer aussi ces identifiants dans les plans et les tests. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS consigner chaque décision d'architecture dans un ADR sous `docs/adr/`. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS signaler explicitement toute modification du schéma et l'accompagner d'une migration réversible. [CLAUDE.md, EF-U0-02] (affirmed 2026-09-21)

- ALWAYS signaler une demande qui contredit un invariant ou une exigence, et poser la question Q-xx qui bloque une tâche au lieu de supposer. [CLAUDE.md] (affirmed 2026-09-21)

- ALWAYS terminer chaque tâche par `pnpm typecheck && pnpm lint && pnpm test`. [CLAUDE.md] (affirmed 2026-09-21)

## Corrections

<!-- Project-specific corrections from human feedback. -->
<!-- Format: NEVER/ALWAYS [behavior] (learned [date]) -->
- ALWAYS inclure dans le périmètre tout ce que la boutique pratique déjà, notamment l'approvisionnement et le crédit client : une application qui ne les gère pas ne sera pas réellement utilisée (learned 2026-09-17) <!-- cid:260916-caisse-hors-ligne-3:intent-capture:ff62b4ad51992a866db7afd91d93c7c006946ceb5dddd7141301d0b1946cf1b7 -->
- ALWAYS poser seulement les questions qui changent la frontière, l'ordre ou le contenu de ce qu'on construit, sans reposer ce que docs/exigences-tenuxpector.md tranche déjà : le propriétaire est seul décideur et la cérémonie le ralentit (learned 2026-09-17) <!-- cid:260916-caisse-hors-ligne-3:scope-definition:795ed179aad6cccd8932da32f01196f23d1a3698094ed82182c4325f32e068d2 -->
- ALWAYS citer la source de toute règle fiscale ou légale et préciser si elle vient d'un texte officiel ou d'un guide spécialisé ; à défaut, la consigner comme hypothèse à faire valider par un comptable ou la DGI avant la mise en service (learned 2026-09-17) <!-- cid:260916-caisse-hors-ligne-3:requirements-analysis:3946cd0d3fd998b74916e6a880338f6fdb888071209c379145a4f4649a1ef819 -->
- ALWAYS vérifier tout graphe de composants ou de dépendances par un contrôle automatique (symétrie des liens, acyclicité, références résolues) avant de le présenter, jamais par relecture à l'œil (learned 2026-09-18) <!-- cid:260916-caisse-hors-ligne-3:domain-design:2fbf46cc0b2ac675ae67e603d9068b8da96895300259c472d09b92481bfac360 -->
