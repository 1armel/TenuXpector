# Faisabilité et contraintes — Questions

Ces questions servent à vérifier que le projet est faisable tel que cadré, et à révéler les contraintes qui changeraient la façon de le construire. Les points déjà tranchés dans `docs/exigences-tenuxpector.md` ou au cadrage de l'intention ne sont pas reposés.

## Q1. Sur quel appareil le premier client tiendra-t-il la caisse ?

Contexte : le §1.4 prévoit deux cibles — la tablette Android (Capacitor) et le PC (Electron) — avec une parité vérifiée en continu (ENF-15). Chaque cible ajoute des tests, un empaquetage et sa propre preuve de concept. Si la boutique n'en utilise qu'une au départ, l'autre peut suivre plus tard sans rien changer au code partagé.

A. Tablette Android uniquement au démarrage ; le PC viendra plus tard
B. PC uniquement au démarrage ; la tablette viendra plus tard
C. Les deux dès le premier jour
D. Pas encore décidé : ça dépendra du matériel disponible
E. Pas encore défini
X. Other (please specify)

[Answer]:C

## Q2. Quel matériel as-tu déjà sous la main pour la preuve de concept ?

Contexte : le §10 exige une preuve de concept sur les cibles avant de commencer le socle (U0) — base locale chiffrée, impression USB, résistance à la coupure de courant. Sans l'appareil réel, on ne prouve rien, et un délai d'achat s'ajoute à l'échéance.

A. Tablette Android et imprimante thermique USB déjà disponibles
B. PC et imprimante thermique USB déjà disponibles
C. Tout est disponible : tablette, PC et imprimante
D. Rien encore : à acheter — préciser le délai
E. Pas encore défini
X. Other (please specify) je vais lui demontrer sur mon pc 

[Answer]:X

## Q3. Qui construit, avec quelle expérience, et combien de temps ?

Contexte : tenir l'échéance dépend directement de la capacité réelle de construction. La pile prévue est TypeScript, React, Capacitor, Electron, SQLite chiffré, PostgreSQL et un moteur de synchronisation.

A. Toi seul, à plein temps, déjà à l'aise avec toute cette pile
B. Toi seul, à plein temps, mais une partie de la pile est nouvelle pour toi — préciser laquelle
C. Toi seul, à temps partiel — préciser le nombre d'heures par semaine
D. Toi et d'autres personnes — préciser qui et leur disponibilité
E. Pas encore défini
X. Other (please specify) Moi bref je ne sais pas a quoi serve ses question on peu commecer le dev et voir ou ca nous meme la date que jai mis c'est un souhait pas une obligation 

[Answer]:X

## Q4. Que doit-il exister réellement au 30/09/2026 ?

Contexte : au cadrage, tu as maintenu la V1 complète au 30/09/2026, soit dans 13 jours. La faisabilité doit confronter cette date au travail réel : deux cibles, la caisse hors ligne, l'approvisionnement, le crédit, la facture A4, un serveur de production — et les exigences de l'approvisionnement, du crédit et de la facture A4 ne sont pas encore écrites. Je te recommande franchement de fixer ce qui doit exister à cette date plutôt que la V1 entière.

A. La V1 complète, comme décidé au cadrage ; on accepte le risque de ne pas la tenir
B. Une caisse hors ligne utilisable en boutique (vente, encaissement, clôture) ; le reste suit
C. La preuve de concept validée sur la ou les cibles ; la construction commence ensuite
D. Une démonstration au propriétaire, sans usage réel en boutique
E. Pas encore défini
X. Other (please specify) bref je ne sais pas a quoi serve ses question on peu commecer le dev et voir ou ca nous meme la date que jai mis c'est un souhait pas une obligation

[Answer]:X.

## Q5. Quel budget pour le matériel et l'hébergement ?

Contexte : les postes identifiés sont la tablette ou le PC, l'imprimante thermique USB, un onduleur pour le poste fixe (ENF-17), la carte SIM et le forfait data de la tablette, et le serveur de production en Europe de l'Ouest. Un plafond oriente le choix du matériel et de l'hébergeur.

A. Moins de 150 000 FCFA au total
B. Entre 150 000 et 500 000 FCFA
C. Plus de 500 000 FCFA
D. Le matériel existe déjà ; seul l'hébergement est à budgéter — préciser le plafond mensuel
E. Pas encore défini
X. Other (please specify) ca te concerne pas ca n'interviens pas dans le dev si on a besoin d'un truck on va achete 

[Answer]:X

## Q6. Quel type d'hébergement pour le serveur de production ?

Contexte : le §1.4 prévoit un serveur en Europe de l'Ouest, hébergeur à choisir avant U6. Ce serveur ne sert qu'à la synchronisation et au tableau de bord du propriétaire : la caisse fonctionne entièrement sans lui.

A. Un serveur privé virtuel européen classique (par exemple OVH, Hetzner, Scaleway), le moins cher qui convienne
B. AWS dans une région européenne, pour bénéficier de services gérés
C. Supabase ou un service PostgreSQL géré équivalent
D. Aucun serveur au 30/09 : synchronisation reportée, la caisse tourne seule
E. Pas encore défini
X. Other (please specify) la premiere version doit tourner sur pc lhebergement cest juste pour la synchronisation bref je compte utiliser un vps 

[Answer]:X

## Q7. Import du catalogue par photo : quelle voie ?

Contexte : tu as ajouté à U2 l'import du catalogue par photo via le site imagetotext.info. Deux tensions : les photos du registre contiennent les prix d'achat, que le §2.2 cache même aux vendeurs, et elles seraient envoyées à un site tiers ; cette voie exige aussi internet. Par ailleurs, le registre n'arrivera que dans les semaines qui suivent la livraison (réponse Q11 du cadrage).

A. Garder imagetotext.info : la confidentialité des prix d'achat n'est pas un souci pour cet usage ponctuel
B. Reconnaissance de texte sur l'appareil, sans internet ni tiers — à valider pendant la preuve de concept
C. Pas de photo : saisie rapide au clavier uniquement (EF-U2-06 à EF-U2-12)
D. Photo seulement pour les désignations ; les prix sont saisis à la main
E. Pas encore défini
X. Other (please specify) ic je voulais juste un moyens d'entrer les produits pour la premiere fois sans perdre du temps a tout saisir , pour entrer les produits lors de la livraison on peut passer par un chez plus professionel avec un interface je vais mettre a disposition mes credetials pour context7

[Answer]:X

## Q8. Quel régime fiscal pour la facture A4 ?

Contexte : la facture A4 entre en V1 (réponse Q12 du cadrage). Le document la rattachait à U10, avec la facturation électronique, et DEC-10 laisse le régime fiscal de l'entreprise — impôt général synthétique ou régime du réel — à confirmer avant la mise en service. Les mentions obligatoires de la facture en dépendent.

A. Régime de l'impôt général synthétique confirmé : facture A4 simple, sans TVA
B. Régime du réel confirmé : facture A4 avec TVA à 19,25 % et mentions exigées par la DGI
C. Régime pas encore confirmé ; je le vérifie avant la mise en service
D. Finalement, la facture A4 sort de la V1
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Q9. Comment traiter les données personnelles des clients à crédit ?

Contexte : le crédit client, entré en V1 au cadrage, suppose de conserver des noms, des téléphones et des dettes de personnes, sur la caisse et sur le serveur européen. Le Cameroun a adopté fin 2024 une loi sur la protection des données personnelles (à vérifier), et l'hébergement dans l'Union européenne peut ajouter ses propres obligations. Je ne peux pas trancher la portée juridique : c'est un point à vérifier, et la question porte sur la façon de le traiter.

A. Je vérifie les obligations avant la mise en service du crédit
B. On minimise : nom et téléphone seulement, aucune autre donnée sur les clients
C. Les données clients ne sont pas synchronisées vers le serveur européen en V1
D. Pas de sujet particulier : le propriétaire tient déjà ces informations sur papier
E. Pas encore défini
X. Other (please specify)

[Answer]:B

## Q10. Le propriétaire et la boutique sont-ils disponibles pour tester ?

Contexte : la preuve de concept et la première mise en service exigent des essais en conditions réelles — coupure de courant, vitesse de vente, clôture de caisse. Le registre des produits, lui, n'arrivera que plus tard.

A. Disponibles pour tester dès que quelque chose est prêt
B. Disponibles seulement à certains moments — préciser lesquels
C. Essais d'abord hors boutique avec des données de démonstration, la boutique ensuite
D. Aucun essai en boutique avant la livraison complète
E. Pas encore défini
X. Other (please specify) c'est la boutique de mon pere je 

[Answer]:C

## Q11. Le tableau de bord du propriétaire sur son téléphone est-il nécessaire au 30/09 ?

Contexte : U6 prévoit une application du propriétaire distincte de la caisse, dont la plateforme n'est pas décidée — DEC-02 ne couvre que la caisse, et EF-U6-22 suppose une application installée, avec biométrie. C'est aussi ce tableau de bord qui rend le serveur nécessaire.

A. Oui, sous forme d'application installée sur son téléphone
B. Oui, mais une page web consultée depuis son téléphone suffit
C. Non au 30/09 : le rapport imprimé à la clôture suffit au début
D. Non, pas en V1
E. Pas encore défini
X. Other (please specify)

[Answer]:A

## Consolidated Summary Confirmation

Résumé de tes réponses, tel que je vais m'en servir pour écrire l'évaluation de faisabilité, le registre des contraintes et le registre des risques :

- **Cible de la première version** : le PC (Electron), démontré sur ton propre PC ; la tablette suit ensuite (Q2, Q6). À Q1 tu avais coché « les deux dès le premier jour » ; je retiens le PC d'abord, ta réponse la plus précise.
- **Échéance** : aucune date ferme ; le 30/09/2026 est un souhait. On démarre le développement et on avance par étapes (Q3, Q4).
- **Capacité de construction** : non précisée (Q3).
- **Budget** : pas une contrainte ; le matériel manquant est acheté au besoin (Q5).
- **Hébergement** : un serveur privé virtuel, uniquement pour la synchronisation (Q6).
- **Saisie initiale du catalogue** : un moyen rapide d'entrer les produits la première fois, via un service de reconnaissance de texte plus professionnel avec une interface, à choisir (Q7).
- **Facture A4** : régime de l'impôt général synthétique, facture simple sans TVA (Q8).
- **Données des clients à crédit** : nom et téléphone seulement (Q9).
- **Tests** : d'abord hors boutique avec des données de démonstration, ensuite dans la boutique (Q10).
- **Tableau de bord du propriétaire** : une application installée sur son téléphone (Q11).

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
