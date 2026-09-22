# Cadrage de l'intention — Questions

Ces questions cadrent l'intention **U4 Catalogue et saisie** (`u4-catalog`) : UI catalogue (fiche, recherche, saisie rapide, import, photo du registre) embarquée dans la caisse, sur le socle u1–u3 déjà livré. Les exigences FR3.1 à FR3.8 et EF-U2-* sont déjà tranchées dans le flux précédent et dans `docs/exigences-tenuxpector.md` ; ici on ne confirme que ce qui change la **frontière**, l'**ordre** ou le **contenu** de ce qu'on construit maintenant.

## Sources

- [desc] Initial description: "Construire l'unité U4 Catalogue et saisie (u4-catalog) : UI catalogue FR3.1 à FR3.8, embarquée dans la caisse, sur le socle u1–u3 déjà livré."
- [scope] Workflow-selected scope: `spec-driven-dual-target-ops`.
- [memory:M1] `aidlc/spaces/default/memory/project.md#Corrections`: "ALWAYS poser seulement les questions qui changent la frontière, l'ordre ou le contenu de ce qu'on construit, sans reposer ce que docs/exigences-tenuxpector.md tranche déjà : le propriétaire est seul décideur et la cérémonie le ralentit (learned 2026-09-17)"
- [memory:M2] `aidlc/spaces/default/memory/project.md#Forbidden`: "NEVER montrer à un vendeur le prix d'achat, le CUMP, la marge, le CA cumulé ou la valorisation. [CLAUDE.md, §2.2] (affirmed 2026-09-17)"
- [memory:M3] `aidlc/spaces/default/memory/project.md#Mandated`: "ALWAYS écrire toute nouvelle règle métier d'abord dans `packages/domain`, tests d'abord, puis l'interface. [CLAUDE.md] (affirmed 2026-09-17)"

## Q1. Quel problème métier cette unité catalogue doit-elle résoudre maintenant ?

Contexte : le flux précédent a livré le socle (identité, base, domaine caisse). Sans catalogue saisi, la caisse ne vend rien de réel. La réponse fixe le « pourquoi » de **cette** tranche, pas du produit entier.

A. Débloquer la vente réelle : sans articles et prix dans le système, le parcours de caisse u1–u3 ne sert pas en boutique
B. Remplacer la saisie papier du registre du propriétaire par un outil rapide (clavier, import, éventuellement photo), sans erreur bloquante sur un catalogue très large
C. A et B ensemble
D. Préparer surtout la revente du produit (démonstration catalogue soignée) ; le premier client n'est pas le critère principal
E. Pas encore défini
X. Other (please specify)

[Answer]:C

## Q2. Qui utilise l'UI catalogue, et qui en tire le bénéfice principal ?

Contexte : cela décide le masquage des champs sensibles (prix d'achat, CUMP, marge — jamais visibles au vendeur) et qui doit pouvoir créer ou modifier un article.

A. Le propriétaire (éventuellement le gérant) saisit et maintient le catalogue ; les vendeurs ne font que rechercher pour la vente — bénéfice principal : catalogue réel prêt pour la caisse
B. Le propriétaire **et** les vendeurs peuvent créer ou modifier des articles (avec masquage des champs d'achat pour le vendeur)
C. Uniquement le développeur pendant l'installation ; ensuite lecture seule en boutique jusqu'à une unité ultérieure
D. Non identifié
E. Pas encore défini
X. Other (please specify)

[Answer]:A.

## Q3. À quoi reconnaîtra-t-on que **cette** unité catalogue a réussi ?

Contexte : le critère de fin documentaire pour le catalogue (exigences §1.2 / unité U2) est « le catalogue réel de la boutique est importé sans erreur bloquante », avec ENF-16 (50 articles en moins de 15 min ; ajout au ticket en moins de 5 s). Faut-il s'y tenir pour U4, ou ajouter un critère métier ?

A. Les critères documentaires suffisent : import / saisie du catalogue réel sans erreur bloquante, et respect mesurable de l'ergonomie à grand volume (ENF-16)
B. A, plus une démo hors boutique : au moins une famille d'articles du registre papier saisie de bout en bout (clavier et/ou import) et utilisable à la caisse
C. Uniquement un critère de couverture de code / tests verts, sans chronométrage ENF-16 dans cette unité
D. Pas encore défini
E. Non applicable — le succès se jugera seulement après installation en boutique
X. Other (please specify)

[Answer]:B

## Q4. Qu'est-ce qui déclenche la construction de U4 **maintenant** ?

Contexte : u1–u3 sont livrés ; la traceabilité du flux précédent marquait FR3.* comme non couverts. Le déclencheur oriente l'ordre des sous-tranches (saisie clavier d'abord, import, photo).

A. Le socle est prêt : sans catalogue UI, on ne peut pas enchaîner caisse réelle ni les unités suivantes qui en dépendent
B. Pression métier : le registre papier doit entrer dans le système avant toute installation en boutique
C. A et B
D. Opportunité technique seulement (réutiliser le schéma Product/SellingUnit déjà posé en u2-foundation)
E. Non identifié
X. Other (please specify)

[Answer]:C

## Q5. Qui sont les parties prenantes de **cette** tranche catalogue, et qu'est-ce qui compte pour chacune ?

Contexte : on ne re-liste pas tout TenuXpector — seulement qui compte pour livrer U4.

A. Toi (développeur / éditeur) : livrer U4 testable hors boutique ; le propriétaire : pouvoir saisir son registre sans formation lourde ; les vendeurs : retrouver un article vite à la caisse sans voir les coûts
B. A, plus le gérant comme opérateur de saisie possible en boutique
C. Uniquement toi et le propriétaire ; les vendeurs hors périmètre de cette unité
D. Non identifié
E. Pas encore défini
X. Other (please specify)

[Answer]:B

## Q6. Qui décide du périmètre et des priorités **pour U4**, et qui influence ?

Contexte : arbitrages typiques — reporter la photo du registre, découper un Bolt « clavier+import » d'abord, choisir le moyen OCR. Le flux précédent a déjà tranché que le propriétaire est seul décideur métier ; ici on confirme pour **cette** intention.

A. Toi décides de l'ordre de construction et du découpage technique ; le propriétaire tranche le métier (ce qui doit être utilisable) quand un arbitrage remonte
B. Le propriétaire décide seul de chaque sous-périmètre (y compris reporter la photo) ; tu exécutes
C. Décision partagée à chaque micro-arbitrage, sans rôles distincts
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Q7. Y a-t-il une exigence de communication ou de rythme de reporting pour cette unité ?

Contexte : flux solo ; inutile d'inventer une cérémonie. Confirme le minimum utile.

A. Aucune cadence formelle : points au fil des portes d'approbation du flux et des questions qui bloquent
B. Un point de démo à la fin de U4 (hors boutique) avant de passer à l'unité suivante
C. Un rapport écrit à chaque Bolt
D. Non applicable
E. Pas encore défini
X. Other (please specify)

[Answer]:B

## Q8. Le plan de travail choisi (`spec-driven-dual-target-ops`) correspond-il à la frontière produit que tu veux pour cette intention ?

Contexte : ce plan enchaîne cadrage, conception, construction et une partie opérations, avec profondeur et tests complets. Confirmer le **plan de travail** n'est pas la même chose que confirmer le **périmètre produit** U4 (question suivante).

A. Oui — conserver ce plan de travail pour construire U4
B. Non — alléger (moins d'étapes / moins de profondeur) pour livrer plus vite le catalogue
C. Non — élargir encore le plan (étapes actuellement omises à réintégrer)
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Q9. Quelle est la frontière **produit** de cette intention pour le catalogue ?

Contexte : la description initiale vise FR3.1 à FR3.8 (fiche, recherche, import sans quantité, saisie clavier rapide, désactivation/étiquette, **et** saisie par photo du registre avec choix OCR à la preuve de concept). Confirmer si tout cela entre dans **cette** intention, ou si on découpe.

A. Tout FR3.1–FR3.8 dans cette intention, y compris la saisie par photo et le choix du moyen de reconnaissance (interface isolée + preuve de concept)
B. FR3.1–FR3.4, FR3.7 et FR3.8 maintenant (fiche, recherche, import, saisie clavier, désactivation) ; **reporter** la photo / OCR (FR3.5–FR3.6) à une intention ultérieure, avec une interface stub si besoin
C. Uniquement saisie clavier rapide + fiche + recherche ; import fichier et photo plus tard
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]:A

## Q10. Si la photo du registre est dans le périmètre (ou partiellement), comment traite-t-on le choix du moyen de reconnaissance dans **cette** intention ?

Contexte : FR3.6 laisse le choix (sur appareil vs service tiers) à la preuve de concept ; un service tiers ne reçoit jamais de prix d'achat. Si Q9 reporte la photo, choisis E.

A. Inclure une preuve de concept OCR dans U4 et trancher le moyen avant de figer l'adaptateur
B. Poser seulement l'interface d'extraction + un adaptateur factice / manuel ; le vrai moyen OCR est hors de cette intention
C. Décider dès maintenant : reconnaissance **uniquement sur l'appareil** (pas de service tiers)
D. Décider dès maintenant : service tiers autorisé pour désignations et prix de **vente** uniquement (jamais prix d'achat)
E. Non applicable — photo / OCR hors périmètre de cette intention
X. Other (please specify)

[Answer]:A

## Consolidated Summary Confirmation

- Looks correct
- Request changes

Does this all look correct before I generate the artifact?

[Answer]: Looks correct
