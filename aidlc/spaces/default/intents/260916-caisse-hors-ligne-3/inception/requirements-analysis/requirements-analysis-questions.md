# Analyse des exigences — Questions

Ton document `docs/exigences-tenuxpector.md` couvre déjà en détail les unités U0 à U6. Ces questions portent uniquement sur ce qui n'y est pas encore écrit — l'approvisionnement, le crédit client, la facture A4 — et sur trois points laissés ouverts par les étapes précédentes.

## Q1. Comment la marchandise entre-t-elle en stock ?

Contexte : l'approvisionnement est entré en V1, mais aucune exigence ne le décrit. La question est de savoir jusqu'où va le suivi. Chaque niveau ajoute du travail : une commande préalable, c'est un état de plus à gérer ; les dettes fournisseurs, c'est un compte à tenir.

A. Réception directe : on saisit ce qui arrive — fournisseur, articles, quantités, coût réel — sans commande préalable
B. Commande puis réception : on enregistre d'abord une commande au fournisseur, puis la réception, qui peut être partielle
C. Comme B, plus le suivi des dettes fournisseurs : ce qui reste à payer à chacun
D. Comme A, plus le suivi des dettes fournisseurs
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q2. Quelles règles pour le crédit client ?

Contexte : le crédit est entré en V1. Le cadrage d'origine prévoyait un plafond par client. La faisabilité a retenu que seuls le nom et le téléphone sont conservés.

A. Un plafond par client ; au-delà, la vente à crédit est refusée sauf dérogation par PIN du propriétaire ; les remboursements partiels sont acceptés
B. Un plafond par client ; au-delà, la vente à crédit est bloquée, sans dérogation possible
C. Pas de plafond : on enregistre, on suit le solde, et une alerte se déclenche au-delà d'un montant paramétrable
D. Pas de plafond ni d'alerte : simple suivi des soldes
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Q3. Comment numéroter et remplir la facture A4 ?

Contexte : la facture A4 est en V1, sous le régime de l'impôt général synthétique, donc sans TVA. Le document ne décrit ni sa numérotation ni son contenu obligatoire.

A. Même séquence de numérotation que les tickets ; mentions de l'entreprise (raison sociale, NIU, RCCM, adresse, téléphone) et mention « TVA non applicable »
B. Une séquence de numérotation séparée pour les factures
C. Comme A, plus un client obligatoire sur la facture (nom, et NIU si c'est une entreprise)
D. Comme B, plus un client obligatoire sur la facture
E. Pas encore défini
X. Other (please specify)

[Answer]: B

## Q4. Comment saisir le catalogue la première fois ?

Contexte : tu voulais éviter de tout taper à la main. L'ingénieur sécurité a relevé que photographier le registre enverrait les prix d'achat à un tiers, alors que ton propre §2.2 les cache même aux vendeurs. Cette décision bloque l'unité du catalogue.

A. Aucun service tiers : uniquement la saisie clavier rapide déjà spécifiée (EF-U2-06 à EF-U2-12)
B. Un service tiers avec interface, à choisir plus tard ; les photos sont recadrées sur les désignations et les prix de vente, et les prix d'achat sont saisis à la main
C. Une reconnaissance de texte sur l'appareil, hors ligne et sans tiers, à valider pendant la preuve de concept
D. On tranche plus tard, avant de construire le catalogue
E. Pas encore défini
X. Other (please specify)

[Answer]: D

## Q5. La tablette Android fait-elle partie de la V1 ?

Contexte : point laissé ouvert par la définition du périmètre. Le PC vient d'abord. La tablette double une partie des tests et de l'empaquetage, et exige sa propre preuve de concept.

A. Non : la V1 est livrée sur PC ; la tablette est un chantier suivant
B. Oui : la tablette fait partie de la V1 et est livrée en même temps que le PC
C. Oui, mais seulement après l'installation du PC en boutique
D. Pas encore décidé : on verra selon le matériel
E. Pas encore défini
X. Other (please specify)

[Answer]: B

## Q6. Jusqu'où mettre à jour le document d'exigences ?

Contexte : tu m'as chargé de le mettre à jour. Il contredit encore trois décisions, il ne décrit ni l'approvisionnement, ni le crédit, ni la facture A4, et ses noms de tables et de fonctions sont en français alors que le code sera en anglais.

A. Mise à jour ciblée : corriger §1.2, §1.3, §11 et DEC-02, ajouter les sections manquantes pour l'approvisionnement, le crédit et la facture A4, reformuler les exigences qui parlent de « CI bloquante », et ajouter un glossaire français-anglais en annexe. Les noms français restent dans le document, le glossaire fait le lien avec le code
B. Réécriture complète : traduire aussi en anglais tous les noms de tables et de fonctions du document
C. Mise à jour ciblée, sans glossaire
D. Ne rien changer au document : `requirements.md` devient la référence
E. Pas encore défini
X. Other (please specify)

[Answer]: A

## Requested Changes Feedback

Réponse du propriétaire au résumé consolidé, verbatim :

« Que pense tu a propres de ca : Facture A4 : numérotation séparée des tickets, sans TVA., les facture que j'ai pu voir ne sont jamais sur A4 c'est sure des petit bout de papier , aussi concernant les numeros peuyx faire de recherchr la dessus

pour la premiere fois c'est a moi de rentrer tous les produits qui sont inscript sur papier , donc je veux le faire par photo je filme plus les produit sont ajoute automatiquement »

Recherche faite sur la facturation au Cameroun (sources : yorine.app, lefisk.cm, fiscafinance.com ; blogs spécialisés, pas le texte officiel) :
- Mentions obligatoires : NIU, raison sociale et forme juridique, RCCM, adresse complète et coordonnées, NIU du client pour les ventes entre entreprises.
- Numérotation : unique, continue et chronologique, sans trou (conforme OHADA).
- Sous impôt libératoire ou régime simplifié : facturation hors TVA avec la mention « TVA non applicable ».
- Aucune source ne mentionne d'obligation de format A4.
- À faire valider par un comptable ou la DGI avant la mise en service.

## Q7. Sur quel support sort la facture ?

Contexte : suite de ta remarque. Les factures que tu as vues sont sur de petits bouts de papier, et la recherche ne trouve aucune obligation de format A4. La numérotation séparée que tu as choisie en Q3 reste valable ; elle devra simplement être continue et sans trou.

A. La facture sort sur l'imprimante thermique 80 mm, avec toutes les mentions obligatoires ; pas de format A4 en V1
B. Comme A, plus un export PDF A4 pour les clients entreprises qui le demandent
C. Format A4 uniquement, comme prévu à l'origine
D. Les deux supports dès le départ, au choix de l'opérateur au moment de l'impression
E. Pas encore défini
X. Other (please specify)

[Answer]: D

## Q8. Que photographies-tu pour remplir le catalogue ?

Contexte : tu veux saisir les produits par photo dès le départ, pas au clavier. La technique dépend de ce qui est photographié, et la difficulté n'est pas du tout la même.

A. Le registre papier du propriétaire : on lit du texte manuscrit ou imprimé, avec un écran de vérification avant import. Fiable, mais suppose un service de reconnaissance à choisir
B. Comme A, mais avec une reconnaissance qui tourne sur l'appareil, sans envoyer les photos à un tiers
C. Les produits eux-mêmes dans les rayons, en filmant : il faut reconnaître des objets, pas du texte. Beaucoup plus incertain, et les prix n'y figurent pas
D. Le registre papier d'abord (A ou B, tranché en preuve de concept), et la photo des rayons seulement si elle s'avère faisable
E. Pas encore défini
X. Other (please specify)

[Answer]: X — Le registre c'est pour avoir le nom et les prix de tous les produits que la boutique peux avoir noter les quantite des articles c'est apres lorsqu'on installe deja dans la boutique , donc le register s'est juste pour avoir les produits que la boutique peux avoir tu comprends mieux

## Consolidated Summary Confirmation

Résumé révisé après tes deux corrections (les entrées précédentes de cette section sont remplacées par celle-ci) :

- **Approvisionnement** : réception directe. On saisit ce qui arrive — fournisseur, articles, quantités, coût réel — sans commande préalable et sans suivi des dettes fournisseurs (Q1).
- **Crédit client** : un plafond par client ; au-delà, la vente à crédit est refusée sauf dérogation par PIN du propriétaire, tracée ; les remboursements partiels sont acceptés (Q2).
- **Facture** : numérotation propre aux factures, séparée de celle des tickets, continue et sans trou. Sortie **au choix de l'opérateur** : ticket thermique 80 mm ou export PDF A4, les deux disponibles dès le départ. Régime de l'impôt général synthétique, donc mention « TVA non applicable ». Mentions obligatoires : raison sociale et forme juridique, NIU, RCCM, adresse complète et coordonnées, et NIU du client pour une vente à une entreprise. Ces mentions restent à faire valider par un comptable ou la DGI avant la mise en service (Q3, Q7).
- **Saisie initiale du catalogue** : par photo du registre papier, pour obtenir **les noms et les prix** de tous les produits que la boutique peut vendre. Un écran de vérification précède l'import. **L'import initial ne crée aucun stock** : les quantités sont saisies plus tard, à l'installation en boutique. Le moyen de reconnaissance — sur l'appareil ou service tiers — est tranché à la preuve de concept ; la saisie clavier rapide reste disponible (Q4, Q8).
- **Tablette Android** : elle fait partie de la V1 et est livrée en même temps que le PC. Le PC reste construit en premier ; la tablette a sa propre preuve de concept et la parité entre les deux cibles est vérifiée (Q5).
- **Document d'exigences** : mise à jour ciblée — périmètre V1 (§1.2, §1.3), règle de passage (§11), décision de plateforme (DEC-02) ; ajout des sections approvisionnement, crédit et facture ; reformulation des exigences « CI bloquante » ; glossaire français-anglais en annexe. Les noms français restent dans le document (Q6).

Conséquence à noter : l'exigence d'import actuelle (EF-U2-03) crée un mouvement de stock à l'import. Elle est corrigée : l'import initial crée les articles et leurs prix, jamais de quantité.

Does this all look correct before I generate the requirements artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
