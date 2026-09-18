# Déclaration d'intention — TenuXpector

Chaque affirmation porte sa source : `[desc]` pour la description initiale du projet, `[Q<n>]` pour la réponse confirmée à la question n de `intent-capture-questions.md`, `[scope]` pour le plan de travail choisi.

## Énoncé du problème

TenuXpector est un logiciel de caisse et de gestion de stock hors ligne d'abord, destiné au commerce de détail, dont le premier client est une quincaillerie familiale à Douala. [desc]

Le problème à résoudre a deux faces d'importance égale : informatiser la boutique, et rendre chaque écart imputable à une personne. [Q1]

Le projet vise en même temps un produit revendable à d'autres commerces, la boutique familiale servant de terrain d'essai. [Q1]

Quand les besoins de la boutique et ceux du produit revendable tirent dans deux directions, la boutique l'emporte : on livre ce dont elle a besoin, on généralise ensuite. [Q14]

L'application doit prendre en charge l'approvisionnement et le crédit, parce que la boutique fonctionne déjà ainsi ; sans eux, elle ne serait pas réellement utilisée. [Q9]

## Client cible

Aujourd'hui, le client est le propriétaire de la boutique familiale de Douala : il ne peut pas savoir qui a pris de l'argent ou de la marchandise, parce que plusieurs personnes se relaient à la caisse. [Q2]

Demain, ce sont d'autres commerçants de détail, le premier client servant de pilote. [Q2]

## Indicateurs de succès

- Chaque unité de travail atteint son critère de fin — par exemple une journée complète de ventes réelles tenue sans réseau pour la caisse, ou le propriétaire qui voit une vente sur son téléphone en moins de 60 secondes pour la synchronisation. [Q3]
- Chaque écart de clôture de caisse au-delà du seuil de 500 FCFA est rattaché, sans exception, à une session et à un opérateur identifiés. [Q3]
- Les seuils d'alerte sont revus une fois, après une semaine d'utilisation. [Q4]

## Déclencheur de l'initiative

- Des pertes d'argent ou de marchandise, constatées ou soupçonnées, sans pouvoir savoir qui en est responsable. [Q5]
- La rotation des personnes à la caisse, qui rend impossible tout contrôle informel. [Q5]
- Une opportunité : construire un produit revendable là où les solutions existantes supposent une connexion permanente. [Q5]

## Premier signal de périmètre

**Plan de travail retenu** (workflow-selected) : `spec-driven-dual-target-ops`. [scope]

**Périmètre du produit confirmé par le propriétaire** :

- La description initiale fixait la V1 aux unités U0 à U6. [desc]
- Ce périmètre est élargi à l'approvisionnement et au crédit. [Q9] [Q15]
- La facture A4 entre aussi en V1. [Q12]
- Les exigences détaillées de ces activités ajoutées seront écrites par le développeur dans `docs/exigences-tenuxpector.md`, avant l'étape de définition du périmètre. [Q13]

**Mode de livraison et échéance** :

- Tout livrer d'un coup, puis saisir le registre des produits et des prix et tester dans les semaines qui suivent, le registre n'étant fourni qu'après la livraison. [Q11]
- Date cible de la V1 complète : 30/09/2026. [Q15]

## Assumptions & Open Questions

- [assumption] L'échéance du 30/09/2026 paraît très difficile à tenir pour une V1 qui couvre désormais la caisse hors ligne, l'approvisionnement, le crédit, la facture A4, deux cibles d'exécution et un serveur de production. Le risque a été signalé au propriétaire, qui a maintenu la date ; il est à réévaluer à la faisabilité et à la définition du périmètre.
- [assumption] La livraison « tout d'un coup » est à réconcilier avec la règle du document d'exigences qui fait démarrer chaque unité seulement après l'usage réel de la précédente en boutique ; cette règle n'a pas été explicitement retirée.
- [assumption] Les exigences détaillées de l'approvisionnement, du crédit et de la facture A4 n'existent pas encore ; tant qu'elles ne sont pas écrites, ces activités n'ont pas de contenu vérifiable.
