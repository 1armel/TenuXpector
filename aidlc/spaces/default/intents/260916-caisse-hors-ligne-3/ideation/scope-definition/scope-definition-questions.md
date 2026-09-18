# Définition du périmètre — Questions

Ces questions fixent la frontière de la première livraison et l'ordre de construction. Elles s'appuient sur la déclaration d'intention, l'évaluation de faisabilité et le registre des contraintes ; rien de déjà tranché n'est reposé.

## Q1. Quel est le premier jalon démontrable ?

Contexte : la faisabilité recommande de fixer un objectif de démonstration court sur ton PC, avec des données de démonstration, plutôt que de viser la V1 entière d'un coup. C'est ce jalon qui orientera le découpage en unités.

A. La caisse hors ligne sur PC : ouverture de session, vente, encaissement en espèces et en mobile money, clôture à l'aveugle, ticket imprimé — sur un catalogue de démonstration
B. A, plus la saisie rapide du catalogue
C. A, plus l'approvisionnement et le crédit client
D. Seulement la preuve de concept sur PC : base locale chiffrée, impression USB, survie à une coupure
E. Pas encore défini
X. Other (please specify)

[Answer]:B

## Q2. Qu'est-ce qui est indispensable à la première mise en service en boutique ? (select all that apply)

Contexte : l'approvisionnement, le crédit et la facture A4 sont en V1, et le propriétaire veut une application sur son téléphone. La question n'est pas de les retirer de la V1, mais de savoir lesquels doivent déjà fonctionner le jour où la caisse entre en boutique.

A. L'approvisionnement : réception de marchandise et fournisseurs
B. Le crédit client : ventes à crédit, remboursements, soldes
C. La facture A4
D. La synchronisation et l'application du propriétaire sur son téléphone
E. Aucune : la caisse seule suffit pour démarrer en boutique
X. Other (please specify)

[Answer]:D

## Q3. Dans quel ordre construire ?

Contexte : la faisabilité recommande un ordre qui traite d'abord les risques techniques (preuve de concept sur PC), puis le socle et la caisse. Tu as aussi dit vouloir commencer le développement rapidement et voir où ça mène.

A. Les risques d'abord : preuve de concept sur PC, puis socle, puis caisse — l'ordre recommandé par la faisabilité
B. La valeur d'abord : une caisse utilisable le plus vite possible, la robustesse ensuite
C. Les dépendances d'abord : l'ordre strict des unités, du socle (U0) à la synchronisation (U6), puis approvisionnement, crédit, facture A4, tablette
D. Mixte : une preuve de concept sur PC très courte, puis la valeur d'abord
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Q4. Comment les unités passent-elles vers la boutique ?

Contexte : au cadrage, tu as souhaité tout livrer d'un coup. Le document d'exigences impose au contraire qu'une unité ne démarre qu'après l'usage réel de la précédente en boutique (§11). La faisabilité a relevé la contradiction ; il faut la trancher.

A. Livraison d'un coup : on construit tout, on teste hors boutique, puis on installe en une fois ; la règle du §11 est retirée
B. Unité par unité : chaque unité est utilisée en boutique avant d'attaquer la suivante ; la règle du §11 est conservée
C. Par blocs : la caisse complète d'abord en boutique, puis l'approvisionnement, le crédit et la facture A4 dans un second bloc
D. Tout reste hors boutique jusqu'à la V1 complète, avec une démonstration au propriétaire à la fin de chaque unité
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Q5. Qui met à jour le document d'exigences ?

Contexte : au cadrage (Q13), tu avais choisi d'écrire toi-même les exigences des activités ajoutées. Depuis, le plan allégé a ajouté une étape d'analyse des exigences, juste après les pratiques de travail. Et le document contredit encore trois décisions : la V1 limitée aux unités U0 à U6 (§1.2 et §1.3), les deux cibles dès le départ (DEC-02), le passage unité par unité (§11).

A. Moi, pendant l'analyse des exigences : je mets à jour §1.2, §1.3, §11 et DEC-02, et j'écris les exigences de l'approvisionnement, du crédit et de la facture A4 ; tu relis et valides
B. Toi, avant l'analyse des exigences, comme choisi au cadrage
C. Partagé : toi pour l'approvisionnement, le crédit et la facture A4 ; moi pour §1.2, §1.3, §11 et DEC-02
D. On laisse le document tel quel : les livrables du workflow font foi pour ces points
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Consolidated Summary Confirmation

Résumé de tes réponses, tel que je vais m'en servir pour écrire le document de périmètre et le carnet des unités :

- **Premier jalon démontrable** : la caisse hors ligne sur PC — session, vente, encaissement en espèces et en mobile money, clôture à l'aveugle, ticket imprimé — plus la saisie rapide du catalogue (Q1).
- **Ordre de construction** : les risques d'abord — preuve de concept sur PC, puis socle, puis caisse (Q3).
- **Passage en boutique** : livraison d'un coup ; on construit la V1, on teste hors boutique, puis on installe en une fois. La règle du §11 (unité par unité en boutique) est retirée (Q4).
- **Priorités dans la V1** : la synchronisation et l'application du propriétaire sur son téléphone sont indispensables à la mise en service ; l'approvisionnement, le crédit et la facture A4 restent en V1 mais passent après (Q2). Comme la livraison se fait d'un coup, ce classement fixe l'ordre de construction, pas le contenu livré.
- **Mise à jour du document d'exigences** : c'est moi qui m'en charge pendant l'analyse des exigences — §1.2, §1.3, §11, DEC-02, et les exigences de l'approvisionnement, du crédit et de la facture A4 — et tu relis (Q5).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
