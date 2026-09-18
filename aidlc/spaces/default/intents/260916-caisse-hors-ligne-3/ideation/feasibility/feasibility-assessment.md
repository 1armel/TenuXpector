# Évaluation de faisabilité — TenuXpector

Entrées : la déclaration d'intention (`aidlc/spaces/default/intents/260916-caisse-hors-ligne-3/ideation/intent-capture/intent-statement.md`), `docs/exigences-tenuxpector.md`, et les réponses confirmées de `feasibility-questions.md`.

## Verdict

**Faisable, sous quatre conditions.** Rien dans l'intention n'exige une technologie non éprouvée. Le socle retenu — base locale, journaux à ajout seul, arithmétique entière, synchronisation par file d'événements — est un schéma connu pour les applications hors ligne. Les difficultés sont ailleurs : un périmètre qui a grandi plus vite que ses exigences écrites, une application du propriétaire dont la plateforme n'est pas décidée, et un service de reconnaissance de texte encore à choisir.

Les quatre conditions :

1. **Le PC d'abord.** La première version cible uniquement le PC (Electron). La tablette (Capacitor) suit, sur le même code partagé.
2. **Une preuve de concept sur PC avant le socle (U0)** : base locale chiffrée, impression thermique USB, survie à une coupure de courant en pleine vente.
3. **Des exigences écrites avant de construire l'approvisionnement, le crédit et la facture A4.** La déclaration d'intention les place en V1, mais `docs/exigences-tenuxpector.md` ne les décrit pas encore.
4. **Une plateforme décidée pour l'application du propriétaire avant la synchronisation (U6).**

## Viabilité technique par domaine

| Domaine | Viabilité | Commentaire |
|---|---|---|
| Caisse hors ligne sur PC | Élevée | Electron donne un accès natif au fichier de base et aux ports USB. Le schéma « donnée + événement de synchronisation dans la même transaction » est éprouvé. |
| Base locale chiffrée | Moyenne | Le chiffrement SQLite sous Electron passe par un module natif à compiler pour Windows. C'est le premier point à prouver. |
| Impression thermique USB | Moyenne | Faisable depuis le processus principal d'Electron ; la reconnaissance du périphérique par le pilote Windows dépend du modèle. À prouver sur l'imprimante réelle. |
| Survie aux coupures | Moyenne | Garantie par des transactions courtes et une journalisation avant écriture. Le poste fixe exige un onduleur (ENF-17). À prouver par coupures forcées. |
| Arithmétique entière et journaux à ajout seul | Élevée | Contraintes de conception, sans verrou technologique. |
| Tablette Android | Élevée, différée | Même code, adaptateurs natifs distincts. La parité (ENF-15) double une partie des tests : c'est pour cela qu'elle vient après. |
| Approvisionnement et crédit client | Élevée sur le modèle, faible sur la spécification | Le cadrage d'origine prévoit déjà les tables (fournisseurs, achats, clients, mouvements de compte client). Ce qui manque, ce sont les règles : plafond de crédit, remboursement partiel, réception partielle, etc. |
| Facture A4 | Élevée | Impôt général synthétique : pas de TVA, mentions réduites. Générable hors ligne en PDF. |
| Synchronisation vers un serveur privé virtuel | Élevée | Optionnelle pour le fonctionnement de la caisse ; le serveur ne sert qu'à la synchronisation et au tableau de bord du propriétaire. |
| Application du propriétaire sur téléphone | Indéterminée | Souhaitée comme application installée, mais aucune plateforme n'est décidée. Capacitor permettrait de réutiliser le code React, à confirmer. |
| Saisie initiale du catalogue par photo | Indéterminée | Dépend du service de reconnaissance choisi. Usage ponctuel à l'installation, jamais sur le parcours de vente : aucun conflit avec le principe hors ligne d'abord. |

## Analyse des risques

Les risques sont détaillés et suivis dans `raid-log.md`. Les trois qui peuvent faire dérailler le projet :

- **Construire des activités non spécifiées.** Approvisionnement, crédit et facture A4 sont en V1 sans exigences détaillées. Coder avant de les écrire, c'est coder deux fois.
- **Les prix d'achat envoyés à un tiers.** Photographier le registre transmet les coûts d'achat à un service externe, alors que le §2.2 les cache même aux vendeurs.
- **Une capacité de construction inconnue.** Un développeur seul, sans temps disponible estimé : toute date reste une hypothèse.

## Recommandations

- Ordre de construction : preuve de concept PC → socle → domaine → catalogue → caisse → impression → audit et alertes → approvisionnement → crédit → facture A4 → synchronisation et application du propriétaire → tablette.
- Rédiger les exigences de l'approvisionnement, du crédit et de la facture A4 pendant que le socle et la caisse se construisent, pour qu'elles soient prêtes au moment voulu.
- Pour la saisie initiale du catalogue, retenir un service qui peut traiter des photos **recadrées sur les désignations et les prix de vente**, et saisir les prix d'achat à la main.
- Fixer un objectif de démonstration à court terme sur ton PC : la caisse qui vend, encaisse et clôture hors ligne, avec des données de démonstration.

## Traçabilité

| Élément de l'intention (`intent-statement.md`) | Couvert ici par |
|---|---|
| Problème : informatiser et rendre les écarts imputables | Caisse hors ligne, journaux à ajout seul |
| Produit revendable, la boutique d'abord | Ordre de construction centré sur la boutique |
| Périmètre V1 : approvisionnement, crédit, facture A4 | Condition 3, viabilité par domaine |
| Livraison d'un coup, échéance souhaitée | Recommandations ; date traitée comme souhait |
