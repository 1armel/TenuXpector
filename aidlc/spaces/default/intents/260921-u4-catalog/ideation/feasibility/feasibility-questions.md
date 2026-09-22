# Faisabilité et contraintes — Questions

Ces questions portent **uniquement** sur ce qui peut bloquer, découper ou contraindre U4 Catalogue et saisie. Le cadrage d’intention est déjà approuvé (FR3.1–FR3.8, photo + preuve de concept OCR, UI embarquée dans la caisse sur u1–u3). On ne repose pas le périmètre produit.

## Q1. Avec quoi l’interface catalogue doit-elle s’intégrer, concrètement ?

Contexte : l’intention dit « embarquée dans la caisse, sur le socle u1–u3 déjà livré ». Il faut confirmer le système existant à ne pas recréer, et s’il y a un autre outil (tableur, logiciel fournisseur) à brancher.

A. Uniquement la caisse déjà livrée (schéma articles / unités de vente déjà en base) : pas d’autre système
B. La caisse, **plus** un fichier d’import fourni par un outil existant (tableur, export fournisseur) — préciser lequel si tu le connais
C. La caisse, **plus** un service ou site extérieur pour la reconnaissance de texte (en plus de l’adaptateur à choisir)
D. Non identifié
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Q2. Pour la preuve de concept photo du registre, quelle contrainte réseau acceptes-tu ?

Contexte : l’intention laisse le moyen de reconnaissance ouvert jusqu’à la preuve de concept. Toutes les autres fonctions de caisse doivent marcher **sans réseau**. Un service tiers pour la photo impliquerait une connexion **pendant cet import uniquement**. Ça change l’ordre de construction (adaptateur isolé vs preuve en ligne).

A. La preuve de concept doit marcher **sans réseau** (reconnaissance sur l’appareil, ou saisie manuelle de secours si la photo échoue)
B. Un service tiers est acceptable **pour cet import initial seulement**, même s’il faut internet à ce moment-là ; le reste de la caisse reste hors ligne
C. Les deux voies dans la preuve de concept, puis on tranche avant de figer l’adaptateur (comme prévu à l’intention)
D. Pas encore défini
E. Non applicable — reporter la photo hors de cette unité (contredit l’intention approuvée ; ne choisir que si tu changes d’avis)
X. Other (please specify)

[Answer]: C
## Q3. Comment la photo du registre arrive-t-elle sur le poste de caisse ?

Contexte : le premier client n’a pas de lecteur de codes-barres ; la caisse cible est un PC. Sans caméra utilisable, « saisie par photo » devient « fichier image déjà sur le disque », ce qui change l’ergonomie de la preuve de concept.

A. Fichier image déjà sur le PC (photo prise au téléphone, copiée par USB ou dossier partagé)
B. Webcam ou scanner branché sur le PC
C. Photo prise sur une tablette / un téléphone, puis transmise à la caisse
D. Pas encore défini
E. Non identifié
X. Other (please specify)

[Answer]: A
## Q4. De quel ordre de grandeur est le catalogue à saisir pour dimensionner l’import et l’ergonomie ?

Contexte : le critère de succès parle d’un catalogue réel et d’une cible « 50 articles en moins de 15 min ». Un registre de quelques centaines d’articles n’a pas les mêmes risques qu’un registre de plusieurs milliers.

A. Moins de 500 références
B. Entre 500 et 3 000 références
C. Plus de 3 000 références (catalogue très large, comme déjà décrit pour le premier client)
D. Pas encore estimé ; on dimensionne sur 50 articles pour la démo, le volume réel plus tard
E. Pas encore défini
X. Other (please specify)

[Answer]: C
## Q5. Les photos du registre papier montrent-elles des prix d’achat ?

Contexte : un vendeur ne doit jamais voir prix d’achat, CUMP, marge, CA cumulé ni valorisation. Si un service tiers est utilisé, les prix d’achat ne lui sont **jamais** transmis. Si le registre mélange désignations, prix de vente et prix d’achat, il faut masquer ou recadrer avant envoi — ça peut rendre un service tiers inutilisable.

A. Le registre ne contient que désignations et prix de **vente** (pas de prix d’achat sur la photo)
B. Le registre contient aussi des prix d’achat : il faudra les masquer / ne pas les envoyer, ou rester sur l’appareil
C. Je ne sais pas encore ce que le registre montre ; à vérifier sur un spécimen avant de figer l’adaptateur
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: C
## Q6. Quel format d’import de fichier faut-il viser en premier ?

Contexte : l’import fichier (prévisualisation, lignes en erreur non bloquantes, réimport sans doublon) est dans le périmètre. Le format réel du propriétaire n’est pas dans l’intention. Un format inconnu retarde l’import ; un CSV/Excel simple débloque.

A. Fichier tableur Excel (`.xlsx`) en premier
B. CSV en premier
C. Les deux dès U4
D. Format encore inconnu : poser un import générique (colonnes mappées à l’écran) et s’adapter au premier fichier réel
E. Pas encore défini
X. Other (please specify)

[Answer]: D
## Q7. Quelle pile et quelle compétence pour U4 — y a-t-il un trou sur la photo / la reconnaissance de texte ?

Contexte : le socle est TypeScript, interface de caisse Electron, règles dans `packages/domain`. La seule incertitude technique nouvelle est la reconnaissance de texte. Si tu n’as pas de compétence ni de temps pour une preuve de concept OCR, l’ordre devient : interface + stub d’extraction d’abord, vrai moyen ensuite — ce qui contredit « trancher le moyen dans U4 » sauf si tu l’acceptes ici.

A. La pile actuelle suffit ; la preuve de concept OCR est faisable dans U4
B. La reconnaissance de texte est nouvelle / risquée : interface + adaptateur factice d’abord, vrai moyen dans un Bolt suivant **de la même intention**
C. Faire appel à un outil ou un service déjà connu pour extraire le texte, sans construire un moteur maison
D. Pas encore défini
E. Non identifié
X. Other (please specify)

[Answer]: C
## Q8. Y a-t-il un bloqueur d’organisation ou de calendrier pour **cette** unité ?

Contexte : l’intention prévoit une démo hors boutique à la fin de U4, avant l’unité suivante. Le registre réel peut n’arriver qu’à l’installation. Un gel, une indisponibilité, ou « pas de démo sans registre réel » changerait l’ordre.

A. Aucun bloqueur : démo hors boutique sur données de démonstration, registre réel plus tard
B. La démo U4 attend un spécimen (pages) du registre papier, même si le catalogue complet vient plus tard
C. Autre priorité ou gel : U4 ne peut pas avancer tout de suite — préciser
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A
## Q9. Un compte ou un service cloud (AWS ou autre) est-il nécessaire pour U4 ?

Contexte : la caisse et le catalogue local n’ont pas besoin d’AWS. Seule une reconnaissance de texte **tierce** pourrait appeler un service. La question sert à ne pas introduire d’hébergement cloud « pour le catalogue ».

A. Aucun cloud pour U4 : tout est local (et éventuellement un appel HTTPS ponctuel si Q2 le permet, sans compte AWS)
B. Un compte cloud / AWS est déjà là et pourra servir à l’OCR
C. À créer seulement si la preuve de concept retient un service tiers
D. Pas encore défini
E. Non applicable
X. Other (please specify)

[Answer]: A

## Consolidated Summary Confirmation

- Looks correct
- Request changes

Does this all look correct before I generate the artifact?

[Answer]: Looks correct
