# Règles découvertes — TenuXpector

> Contraintes dures énoncées par une personne : le `CLAUDE.md` racine du propriétaire, les exigences
> obligatoires de `docs/exigences-tenuxpector.md` (qui fait foi), et les décisions de l'entretien.
> Les invariants de données sont énoncés **par leur sens**, pas par les noms de tables français de
> `CLAUDE.md`, car le code, tables comprises, est écrit en anglais (Q6) : ces règles restent vraies
> après le renommage défini par le glossaire. Les pratiques révisables sont dans `team-practices.md`.

## Mandated

- ALWAYS filtrer par `tenant_id` toute requête sur une table métier. [CLAUDE.md]
- ALWAYS rattacher toute opération de caisse à une session de caisse ouverte. [CLAUDE.md]
- ALWAYS générer les identifiants en UUID v7 côté client. [CLAUDE.md]
- ALWAYS lire les valeurs métier (TVA, devise, arrondis, seuils, mentions) depuis la table des paramètres. [CLAUDE.md]
- ALWAYS écrire une mutation et son événement `outbox` dans la même transaction. [CLAUDE.md]
- ALWAYS calculer les alertes dans `packages/domain`, côté caisse ; une notification n'est qu'un canal. [CLAUDE.md]
- ALWAYS faire saisir le comptage de clôture avant tout affichage du théorique. [CLAUDE.md, EF-U3-31]
- ALWAYS représenter les montants en entiers FCFA, les quantités en millièmes d'unité de base, le CUMP en millièmes de FCFA et les taux en points de base. [CLAUDE.md, DEC-04]
- ALWAYS faire le contrôle d'accès du tableau de bord dans l'API et le couvrir par un test. [CLAUDE.md]
- ALWAYS filtrer par rôle dans la couche de lecture de l'interface de caisse, et côté API pour tout appareil autre que la caisse, avec des tests. [DEC-01]
- ALWAYS écrire toute nouvelle règle métier d'abord dans `packages/domain`, tests d'abord, puis l'interface. [CLAUDE.md]
- ALWAYS maintenir la couverture de `packages/domain` à au moins 90 % des lignes et des branches. [ENF-11]
- ALWAYS valider avec Zod à toutes les frontières (API, import, lecture des paramètres). [CLAUDE.md]
- ALWAYS compiler en TypeScript strict. [CLAUDE.md, ENF-11]
- ALWAYS écrire le code en anglais (identifiants, tables, colonnes, fonctions du domaine, clés de paramètres) et tenir à jour le glossaire français-anglais qui le relie aux exigences. [Q5, Q6]
- ALWAYS rédiger en français tout ce que voit l'utilisateur : interface, tickets, rapports, documents. [CLAUDE.md, Q5]
- ALWAYS chiffrer la base locale au repos sur chaque cible. [DEC-01, ENF-08]
- ALWAYS stocker le PIN haché en PBKDF2-SHA256, avec au moins 310 000 itérations et un sel par utilisateur, et le vérifier sans réseau. [EF-U0-06]
- ALWAYS utiliser TLS 1.2 ou plus récent pour tout échange réseau, avec des jetons révocables. [ENF-08]
- ALWAYS garder `apps/proprietaire` séparée de `apps/caisse`. [CLAUDE.md]
- ALWAYS écrire les commits en Conventional Commits, une unité ou fonctionnalité par branche, avec les identifiants d'exigence dans le message ; citer aussi ces identifiants dans les plans et les tests. [CLAUDE.md]
- ALWAYS consigner chaque décision d'architecture dans un ADR sous `docs/adr/`. [CLAUDE.md]
- ALWAYS signaler explicitement toute modification du schéma et l'accompagner d'une migration réversible. [CLAUDE.md, EF-U0-02]
- ALWAYS signaler une demande qui contredit un invariant ou une exigence, et poser la question Q-xx qui bloque une tâche au lieu de supposer. [CLAUDE.md]
- ALWAYS terminer chaque tâche par `pnpm typecheck && pnpm lint && pnpm test`. [CLAUDE.md]

## Forbidden

- NEVER modifier ni supprimer une entrée des journaux à ajout seul : mouvements de stock, mouvements de caisse, journal d'audit, ouvertures du tiroir, lignes de vente, paiements. Une correction est un mouvement inverse daté du jour. [CLAUDE.md]
- NEVER modifier une vente, sauf ses champs d'annulation, et une seule fois. [CLAUDE.md]
- NEVER stocker de quantité mutable sur un article ; la quantité est calculée. [CLAUDE.md, RG-10]
- NEVER utiliser d'identifiant auto-incrémenté. [CLAUDE.md]
- NEVER écrire une valeur métier en dur dans le code. [CLAUDE.md]
- NEVER faire dépendre une fonctionnalité métier du réseau, ni faire lire l'API par l'interface de caisse. [CLAUDE.md]
- NEVER exiger un transport de synchronisation pour que l'application fonctionne. [CLAUDE.md]
- NEVER utiliser de nombre flottant pour un montant, une quantité, un CUMP ou un taux. [CLAUDE.md, DEC-04]
- NEVER montrer à un vendeur le prix d'achat, le CUMP, la marge, le CA cumulé ou la valorisation. [CLAUDE.md, §2.2]
- NEVER faire dépendre `packages/domain` d'une base, d'un framework d'interface ou du réseau. [CLAUDE.md]
- NEVER utiliser le type `any`. [CLAUDE.md, ENF-11]
- NEVER écrire le mot désigné par ENF-14 dans un fichier de code (`apps/`, `packages/`, configuration à la racine), à l'exception du seed ; le script de contrôle ne contient pas non plus ce mot en clair. [CLAUDE.md, ENF-14]
- NEVER committer de secret ou de clé de chiffrement dans le dépôt, ni journaliser un PIN, un prix d'achat ou un jeton. [ENF-08]
