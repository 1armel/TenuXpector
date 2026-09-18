# Cadrage de l'intention — Questions

Ces questions cadrent l'intention du projet TenuXpector : le problème, pour qui, comment on saura que c'est réussi, qui décide. Le document `docs/exigences-tenuxpector.md` répond déjà à une grande partie ; quand c'est le cas, l'option A reprend ce qu'il dit, pour que tu confirmes plutôt que de réécrire. Rien du document n'entre dans les livrables sans passer par une réponse confirmée ici.

## Sources

- [desc] Initial description: "TenuXpector — logiciel de caisse et de gestion de stock hors ligne d'abord pour le commerce de détail (premier client : une quincaillerie familiale à Douala). Exigences arbitrées dans docs/exigences-tenuxpector.md (fait foi) et cadrage dans docs/specifications.md. Périmètre V1 = unités U0 à U6. Dépôt greenfield, aucun code applicatif. Langue de travail : français."
- [scope] Workflow-selected scope: `spec-driven-dual-target-ops`.

## Q1. Quel est le problème métier à résoudre ?

Contexte : c'est la phrase qui justifiera chaque arbitrage ultérieur. Le §1.1 du document d'exigences en donne une formulation ; je veux savoir si elle est la bonne, ou s'il y a une hiérarchie entre plusieurs problèmes.

A. Savoir à tout moment qui tenait la caisse, ce qui a été vendu, à quel prix et où sont les écarts, même sans aucune connexion — les pertes et les écarts de caisse qu'on ne peut rattacher à personne sont le problème central (formulation du §1.1)
B. Remplacer la tenue sur papier par un outil fiable de caisse et de stock ; le contrôle anti-vol est un bénéfice secondaire
C. Les deux à égalité : informatiser la boutique **et** rendre chaque écart imputable à une personne
D. Construire d'abord un produit revendable à d'autres commerces ; la boutique familiale sert de terrain d'essai
E. Pas encore défini
X. Other (please specify)

[Answer]: C et D

## Q2. Qui est le client, et quelle douleur vit-il aujourd'hui ?

Contexte : la réponse détermine pour qui on optimise quand deux besoins se contredisent — par exemple la vitesse de vente du vendeur contre le contrôle du propriétaire.

A. Le propriétaire de la boutique familiale de Douala : il ne peut pas savoir qui a pris de l'argent ou de la marchandise, parce que plusieurs personnes se relaient à la caisse
B. Le propriétaire **et** les vendeurs : l'outil doit aussi rendre leur travail plus rapide et plus simple, pas seulement les contrôler
C. D'autres commerçants de détail à terme ; le premier client n'est qu'un pilote
D. A et C : le propriétaire aujourd'hui, les autres commerces demain
E. Non identifié
X. Other (please specify)

[Answer]: D

## Q3. À quoi reconnaîtra-t-on que le projet a réussi ?

Contexte : il faut des indicateurs mesurables. Le §1.2 donne un critère de fin par unité de travail ; la question est de savoir s'ils suffisent, ou s'il faut aussi un indicateur métier qui prouve que le problème est réellement résolu.

A. Les critères de fin par unité du §1.2 suffisent — par exemple « une journée complète de ventes réelles tenue sans réseau » pour la caisse (U3), « le propriétaire voit une vente sur son téléphone en moins de 60 s » pour la synchronisation (U6)
B. Un indicateur métier en plus : chaque écart de clôture au-delà du seuil (500 FCFA) est rattaché à une session et à un opérateur identifiés, sans exception
C. A et B ensemble
D. Un indicateur financier : une baisse mesurable des manquants de caisse ou de stock sur une période donnée — à chiffrer
E. Pas encore défini
X. Other (please specify)

[Answer]: C

## Q4. Sur quelle durée observe-t-on avant de figer les seuils d'alerte ?

Contexte : c'est l'une des deux questions encore ouvertes du registre (§10, Q-06). Ta réponse initiale contenait à la fois « 4 semaines d'observation » et « revoir les seuils après 1 semaine », et le document laisse les deux lectures possibles. Cette durée conditionne le moment où les alertes deviennent fiables.

A. Une première revue des seuils après 1 semaine, puis une observation complète sur 4 semaines avant de les figer
B. Une observation de 4 semaines, avec une seule revue à la fin
C. Une revue après 1 semaine seulement ; « 4 semaines » était une erreur
D. Une revue par semaine pendant 4 semaines, soit quatre revues
E. Pas encore défini
X. Other (please specify)

[Answer]: C

## Q5. Qu'est-ce qui déclenche ce projet maintenant ?

Contexte : le document d'exigences décrit la solution mais ne dit pas explicitement pourquoi c'est le moment. Le déclencheur dit aussi quelle unité doit arriver en premier en boutique pour que le projet vaille la peine.

A. Des pertes d'argent ou de marchandise constatées ou soupçonnées, sans pouvoir savoir qui en est responsable
B. La rotation des personnes à la caisse rend impossible tout contrôle informel
C. Une opportunité : construire un produit revendable là où les solutions existantes supposent une connexion permanente
D. A et B
E. Non identifié
X. Other (please specify)

[Answer]: D et C

## Q6. Qui sont les parties prenantes, et qu'est-ce qui compte pour chacune ?

Contexte : le §2.1 décrit les acteurs **du logiciel**. Une partie prenante du **projet** peut être autre chose — quelqu'un qui paie, qui décide, ou qui est touché sans jamais utiliser la caisse.

A. Les trois acteurs humains du §2.1 : le propriétaire (voit tout, valide les dérogations), le gérant (le remplace en boutique, rôle tournant selon DEC-13), les vendeurs (employés ou membres de la famille qui tiennent la caisse)
B. A, plus toi en tant que développeur et futur éditeur du produit, qui porte l'objectif de revente
C. A et B, plus des parties externes : l'administration fiscale via le régime de TVA (DEC-10), l'hébergeur du serveur de production (§1.4)
D. A et B, plus les futurs commerçants clients de la revente
E. Non identifié
X. Other (please specify)

[Answer]: D

## Q7. Qui décide du périmètre et des priorités, et qui influence ces décisions ?

Contexte : pendant la construction, des arbitrages vont remonter — un seuil, une priorité entre deux unités, une fonctionnalité à reporter. Il faut savoir à qui les soumettre.

A. Le propriétaire décide seul du périmètre et des priorités ; le gérant et les vendeurs influencent par leur usage quotidien
B. Toi, développeur, décides du périmètre et de l'ordre de construction ; le propriétaire décide de ce qui est utilisable en boutique, ce qui déclenche l'unité suivante (règle de passage du §11)
C. Décision partagée : le propriétaire tranche le métier (seuils, horaires, rôles), toi la technique et l'ordre de construction
D. Toi seul, le propriétaire étant consulté
E. Pas encore défini
X. Other (please specify)

[Answer]: D

## Q8. Quel rythme de communication et de compte rendu ?

Contexte : le §11 impose une démonstration à la fin de chaque unité et interdit de commencer une unité tant que la précédente n'est pas utilisée en boutique. Entre deux unités, le rythme n'est pas fixé.

A. Une démonstration au propriétaire à la fin de chaque unité (§11), rien entre deux
B. A, plus un point régulier avec le propriétaire pendant la construction — à préciser (par exemple hebdomadaire)
C. A, plus un retour des vendeurs après chaque mise en service en boutique
D. Pas de rituel formel : échanges au fil de l'eau
E. Pas encore défini
X. Other (please specify)

[Answer]: E

## Q9. Le périmètre du produit est-il confirmé ?

Contexte : il faut distinguer deux choses. Le **plan de travail** — les étapes que je vais suivre — a été composé et approuvé : `spec-driven-dual-target-ops`. Le **périmètre du produit** — ce que le logiciel fera — est une autre question : le §1.2 fixe la V1 aux unités U0 à U6, le §1.3 liste ce qui en sort, et deux décisions récentes l'ont déplacé (le tiroir-caisse prévu mais inactif selon DEC-12, et la preuve de concept sur les deux cibles avant U0 selon le §10).

A. Je confirme le périmètre du produit : V1 = unités U0 à U6 (§1.2), avec la preuve de concept préalable et le tiroir prévu mais inactif ; hors V1 comme au §1.3 (achats et fournisseurs, clients et crédit, inventaires tournants, facture A4, console multi-client). Le plan de travail choisi convient aussi
B. Le périmètre du produit est bon, mais le plan de travail doit être revu
C. Le périmètre du produit doit s'élargir — préciser ce qu'on ajoute
D. Le périmètre du produit doit se réduire — préciser ce qu'on retire
E. Pas encore défini
X. Other (please specify)

[Answer]: X — on doit prendre en compte l'approvisionnement et le credit car la boutique marche comme ca et si l'app ne permet pas de gerer ca ca sera une pas vraiment utilise

## Q10. Quelle est la plus petite pièce réellement en circulation chez le client ?

Contexte : c'est la seconde question encore ouverte du registre (§10, Q-07). Les encaissements en espèces sont arrondis au multiple de cette pièce (règle RG-01) ; la valeur 25 FCFA est proposée mais pas confirmée. Si elle est fausse, chaque clôture de caisse affichera de petits écarts fictifs.

A. 25 FCFA : on arrondit l'encaissement en espèces au multiple de 25 le plus proche
B. 50 FCFA
C. 10 FCFA
D. Aucun arrondi (1 FCFA) : la petite monnaie ne manque pas en boutique
E. Pas encore défini — à observer en boutique
X. Other (please specify)

[Answer]: A

## Q11. Y a-t-il une échéance ?

Contexte : le document ne fixe aucune date. Une échéance changerait l'ordre et la profondeur des étapes ; son absence laisse la cadence au terrain, selon la règle de passage du §11.

A. Pas de date imposée : la cadence suit la règle du §11, une unité utilisée en boutique avant d'attaquer la suivante
B. Une date cible pour la première mise en service de la caisse hors ligne (U3) — à préciser
C. Une date cible pour la V1 complète (U6) — à préciser
D. Une contrainte externe : saison commerciale, ouverture d'un second point de vente, obligation fiscale — à préciser
E. Pas encore défini
X. Other (please specify)

[Answer]: X — Je voudrais tout livrer d'un coup je par tester puis je viens completer , on doit me donner le registrer avec tous les produits et les prix je voudrais quand allant chercher ca dans les semaines qui suivre j'ai la possibiliter de les entrer et tester

## Q12. Quelles activités de la boutique entrent dans la V1 ? (select all that apply)

Contexte : suite de ta réponse X à Q9. Tu m'as écrit que l'approvisionnement et le crédit sont essentiels parce que la boutique les pratique déjà, et que l'application doit digitaliser tout ce qui se fait. Or le document dit encore l'inverse : le §1.2 limite la V1 aux unités U0 à U6, et le §1.3 exclut explicitement les achats (U7) et le crédit (U8), en précisant que le paiement à crédit n'est pas proposé à la caisse. « Tout ce qui se fait » peut aussi couvrir d'autres activités ; il faut une frontière nette.

A. Achats et fournisseurs (U7) : commandes, réceptions de marchandise, entrées de stock au coût réel, dettes envers les fournisseurs
B. Clients et crédit (U8) : fiches clients, ventes à crédit avec plafond, remboursements, relevés de compte
C. Inventaires tournants (U9) : comptages partiels réguliers et écarts de stock
D. Facture A4 (U10) : factures pour clients professionnels, avec mentions légales
E. Aucune autre : la V1 reste U0 à U6
X. Other (please specify)

[Answer]: D

## Q13. Qui écrit les exigences détaillées des activités ajoutées ?

Contexte : le document contient environ 70 exigences détaillées pour U0 à U6, et aucune pour les achats ni le crédit. Le plan de travail approuvé saute l'analyse des exigences précisément parce que le document était complet. Si de nouvelles activités entrent en V1 sans exigences détaillées, aucune étape ultérieure ne les définira.

A. Toi : tu complètes docs/exigences-tenuxpector.md (§1.2, §1.3, §5 pour chaque nouvelle unité, §11) avant l'étape de définition du périmètre
B. Moi : je rédige ces sections dans le document à partir de tes réponses et du cadrage d'origine (docs/specifications.md décrit déjà les tables d'achats, de fournisseurs, de clients et de crédit), puis tu relis et valides
C. On réintègre l'étape d'analyse des exigences dans le plan de travail, qui les produira à partir de tes réponses
D. On les reporte en V2 : la V1 reste U0 à U6 pour l'instant
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q14. Quand la boutique et le produit revendable tirent dans deux directions, lequel l'emporte ?

Contexte : à Q1 tu as répondu à la fois C (informatiser la boutique et rendre chaque écart imputable) et D (construire d'abord un produit revendable, la boutique servant de terrain d'essai). Les deux vont se contredire en construction — par exemple la façon dont la boutique accorde le crédit de manière informelle, face au comportement générique qu'attendraient d'autres commerces.

A. La boutique d'abord : on livre ce dont elle a besoin, on généralise ensuite
B. Le produit d'abord : on conçoit générique, la boutique s'adapte
C. Générique par défaut, mais chaque pratique réelle de la boutique doit rester possible par paramétrage (conforme à la règle « aucune valeur métier en dur »)
D. Au cas par cas, tranché par toi (ta réponse à Q7)
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q15. Quelle échéance voulais-tu indiquer ?

Contexte : suite de ta réponse X à Q11, laissée sans précision.

A. Pas de date : la cadence suit la règle du §11, une unité utilisée en boutique avant la suivante
B. Une date pour la première mise en service de la caisse (U3) — préciser la date
C. Une date pour la V1 complète — préciser la date
D. Une date liée aux nouvelles activités (achats, crédit) — préciser la date
E. Pas encore défini
X. Other (please specify)

[Answer]: X — 30/09/2026 ; on doit prendre en compte l'approvisionnement et le credit car la boutique marche comme ca et si l'app ne permet pas de gerer ca ca sera une pas vraiment utilise

## Consolidated Summary Confirmation

Résumé de tes réponses, tel que je vais m'en servir pour écrire la déclaration d'intention et la carte des parties prenantes :

- **Problème** : informatiser la boutique et rendre chaque écart imputable à une personne, tout en construisant un produit revendable (Q1). En cas de conflit entre les deux, **la boutique d'abord** (Q14).
- **Client** : le propriétaire de la boutique aujourd'hui, les autres commerces demain (Q2).
- **Succès** : les critères de fin par unité, plus un indicateur métier — chaque écart de clôture au-delà de 500 FCFA est rattaché à une session et à un opérateur identifiés (Q3).
- **Seuils d'alerte** : une revue après 1 semaine ; « 4 semaines » était une erreur (Q4, referme Q-06).
- **Déclencheur** : des pertes qu'on ne peut rattacher à personne, la rotation à la caisse, et l'opportunité d'un produit revendable (Q5).
- **Parties prenantes** : le propriétaire, le gérant (rôle tournant), les vendeurs, toi en tant que développeur et futur éditeur, et les futurs commerçants clients (Q6).
- **Décision** : toi seul décides du périmètre et des priorités, le propriétaire est consulté (Q7).
- **Communication** : rythme pas encore défini (Q8).
- **Périmètre V1** : élargi à l'**approvisionnement** (achats et fournisseurs) et au **crédit client** (Q9, Q15), et à la **facture A4**, cochée à Q12. Je retiens l'union de tes trois réponses : V1 = U0 à U8 plus la facture A4.
- **Exigences des activités ajoutées** : tu complètes toi-même `docs/exigences-tenuxpector.md` (Q13).
- **Plus petite pièce** : 25 FCFA (Q10, referme Q-07).
- **Livraison** : tout livrer d'un coup plutôt qu'unité par unité, puis saisir le registre des produits et des prix et tester dans les semaines qui suivent (Q11) ; **date cible de la V1 complète : 30/09/2026** (Q15).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

## Assumption Confirmation

Les livrables contiennent les hypothèses suivantes, non confirmées comme des faits :

- Déclaration d'intention — l'échéance du 30/09/2026 paraît très difficile à tenir pour une V1 qui couvre la caisse hors ligne, l'approvisionnement, le crédit, la facture A4, deux cibles et un serveur de production ; à réévaluer à la faisabilité et à la définition du périmètre.
- Déclaration d'intention — la livraison « tout d'un coup » est à réconcilier avec la règle du document d'exigences qui fait démarrer chaque unité seulement après l'usage réel de la précédente en boutique.
- Déclaration d'intention — les exigences détaillées de l'approvisionnement, du crédit et de la facture A4 n'existent pas encore.
- Carte des parties prenantes — les intérêts propres du gérant et des vendeurs restent à recueillir.
- Carte des parties prenantes — aucun rythme de compte rendu n'est fixé.

A. Accept assumptions
B. Convert to follow-up questions

[Answer]: A. Accept assumptions
