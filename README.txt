Alienation

Concept du jeu :
Alienation est un jeu narratif évolutif dans lequel chaque décision du joueur influence directement sa créature.

À chaque question ou situation, le joueur choisit une réponse.
Chaque réponse donne des points dans une ou plusieurs statistiques de la créature.
Ces statistiques représentent les tendances, instincts, mutations, comportements ou directions d’évolution de la créature.

Quand une ou plusieurs statistiques atteignent certains paliers, la créature évolue visuellement.

Le cœur du game design repose donc sur :
- les choix du joueur ;
- l’accumulation progressive de points dans différentes statistiques ;
- des paliers d’évolution ;
- une créature qui change selon les décisions prises ;
- une progression courte et satisfaisante, bornée ici à 10 protocoles de questions.

Intention narrative actuelle :
- Le jeu doit pousser implicitement le joueur à continuer l'expérience.
- Le Professeur Chen présente chaque nouveau test comme une occasion de mieux comprendre, stabiliser ou améliorer la créature.
- Le piège moral est de croire qu'en continuant, on pourra créer une forme idéale : plus forte, plus intelligente, plus empathique, plus adaptable.
- La vraie victoire consiste à arrêter le protocole au bon moment, accepter que la créature soit imparfaite, et refuser de transformer un être vivant en projet d'optimisation.
- Si le joueur cherche trop longtemps la perfection, le protocole finit par produire des anomalies.
- La morale finale est donc : la perfection n'existe pas, et vouloir corriger sans fin ce qui vit peut finir par le détruire.

Arc narratif des tests :
- Les premiers tests évaluent d'abord le soldat, pas explicitement la créature.
- Le professeur laisse entendre qu'il cherche autre chose derrière les réponses.
- Après le test 2, une mutation normale doit apparaître : ce n'est pas encore une anomalie.
- Chen comprend progressivement que les réponses, les valeurs morales et les projections mentales du soldat orientent le développement de la créature.
- Les anomalies doivent arriver plus tard, quand le joueur force trop une direction ou tente de tout optimiser en même temps.

Principes d'écriture :
- Rester subtil au début : ne pas annoncer trop vite que le vrai sujet est la créature.
- Le test 1 doit poser le mystère en évaluant officiellement le soldat, tout en laissant sentir que Chen a une idée derrière la tête.
- Éviter d'expliquer la morale trop tôt. La leçon doit émerger des conséquences, pas d'un discours initial.
- Les choix doivent ressembler à des valeurs morales ou à des décisions de situation, pas à des boutons de build.
- Aucune réponse ne doit être objectivement parfaite : force, intelligence, exploration et conciliation doivent toutes avoir un coût possible.
- Chen doit être tentateur. Il doit donner envie de continuer : encore un test, une meilleure stabilité, une correction possible, une forme plus aboutie.
- Le joueur doit sentir qu'il peut améliorer la créature, puis comprendre progressivement que cette quête peut l'abîmer.
- Les hints d'interface trop méta ont été retirés pour garder l'ambiance : pas de phrase du type "Choisis..." ou "Lis le message suivant...".
- Le bouton Arrêter n'est plus un simple retour menu : c'est une vraie fin viable, où le joueur refuse la perfection et accepte la créature imparfaite.

Résolution fixe :
- 1344x756

Important :
- Tout est fixe.
- Il n'y a plus de scale automatique.
- Si la fenêtre du navigateur est trop petite, le jeu est coupé.

Structure des dialogues :
- data/fr.json et data/en.json restent les fichiers d'entrée de chaque langue.
- Ils contiennent l'UI, le lore, les avatars, les textes de résultat et la liste des tests.
- Chaque conversation est dans son propre fichier :
  - data/fr/tests/test-01.json
  - data/en/tests/test-01.json
- Pour modifier un dilemme précis, ouvrir le fichier du test concerné.
- Dans un fichier de test, les noeuds sont locaux :
  - intro
  - dilemme_01
  - dilemme_02 si besoin
  - decision_finale
- Les choix gardent leurs effets dans effects avec uniquement :
  force, exploration, conciliation, intelligence.

Structure de l'apparence :
- data/appearance.json est commun à toutes les langues.
- Il contient la base de la créature, les slots du corps et les règles de déblocage.
- Chaque règle indique le slot, le tier, la stat, le seuil min, le libellé et l'asset à superposer.
- L'ordre des slots est important. Il sert de départage quand plusieurs parties ont le même niveau de priorité :
  - mouths ;
  - ears ;
  - eyes ;
  - tails.
- Le bloc unlockDifficulty ajoute une difficulté interne non affichée au joueur :
  - chaque partie active d'un même tier augmente le seuil de la prochaine partie de ce tier ;
  - la queue est ignorée par défaut pour ne pas durcir les autres paliers visuels ;
  - les seuils de base actuels sont tier 1 = 3, tier 2 = 6, tier 3 = 9.
- Si plusieurs parties d'un même slot sont débloquées au même tier, je garde la première déjà verrouillée.
- Si une partie d'un tier plus haut est débloquée, elle remplace la partie verrouillée sur ce slot.

Règles de mutation actuelles :
- Une seule nouvelle partie du corps peut être débloquée ou améliorée à la fin d'un test.
- Le test 1 reste diagnostique : aucune mutation visible n'est verrouillée à la fin de cette première batterie.
- La première mutation visible arrive à partir du test 2, et doit rester une mutation normale.
- Les points peuvent permettre plusieurs déblocages en même temps, mais le système n'en applique qu'un seul.
- Les autres déblocages restent possibles pour les tests suivants.
- Tant qu'aucune anomalie n'est éligible, la priorité va à la partie du corps la moins avancée :
  - une partie absente compte comme T0 ;
  - une partie en tier 1 compte comme T1 ;
  - une partie en tier 2 compte comme T2 ;
  - etc.
- Exemple : si la bouche est déjà T2, mais que les yeux sont absents, les yeux passent avant une bouche T3.
- En cas d'égalité de tier actuel, le palier cible le plus bas passe avant les paliers supérieurs.
- Si le palier cible est aussi identique, l'ordre des slots départage :
  - bouche avant oreilles ;
  - oreilles avant yeux ;
  - yeux avant queue.
- Si deux mutations du même slot et du même tier sont disponibles, la stat la plus haute départage.
- Si une anomalie est éligible, elle passe avant les mutations normales.
- Si plusieurs anomalies sont éligibles, le stage le plus grave passe en premier, afin que la grosse anomalie soit visible dès que le système l'a réellement atteinte.
- Le panneau Mutations affiche toutes les parties actuellement actives de la créature, pas seulement la dernière mutation obtenue.

Règles d'anomalie :
- Une anomalie n'est pas une mutation normale.
- Elle ne doit pas apparaître au début du jeu.
- Le test 2 doit produire une mutation normale, pas une anomalie.
- Les anomalies apparaissent plus tard si :
  - le joueur spécialise trop une statistique ;
  - le joueur pousse très haut plusieurs statistiques en même temps pour chercher une créature "parfaite" ;
  - le protocole est poursuivi trop longtemps malgré les signes.
- Une fois une anomalie révélée, elle reste un fait biologique : elle ne disparaît pas simplement parce que les choix suivants sont plus calmes.
- Les seuils de stage actuels sont :
  - stage 1 = 10 ;
  - stage 2 = 14 ;
  - stage 3 = 17.
- Le stage 3 correspond à la grosse anomalie / dégénérescence critique.

Fins et progression :
- Le bouton Arrêter devient une vraie conclusion narrative à partir du test 4.
- Cette fin d'arrêt varie maintenant selon l'état de stabilité :
  - stable : vraie victoire, le joueur refuse la perfection à temps ;
  - sous tension : victoire viable, arrêt avant la fracture ;
  - anomalie : victoire marquée, le joueur arrête les dégâts ;
  - critique : arrêt tardif, ce n'est plus une victoire pure.
- Le test 10 ne revient plus directement au menu.
- Après le test 10, le bouton final affiche une fin dédiée du protocole.
- Cette fin dédiée varie aussi selon stable, sous tension, anomalie ou critique.
- Les barres de statistiques de l'écran créature se recalibrent sur le score le plus haut du run, pour éviter qu'elles saturent trop tôt.

Fichiers clés du dernier changement :
- js/config.js :
  - FIRST_VISIBLE_MUTATION_TEST_INDEX verrouille la première mutation visible au test 2.
- js/state.js :
  - bloque les mutations visibles avant le test 2 ;
  - priorise les anomalies dès qu'elles sont disponibles ;
  - priorise le stage d'anomalie le plus grave.
- js/screens/creature.js :
  - ajoute la fin dédiée du protocole ;
  - choisit les variantes de fin d'arrêt ;
  - recalibre les barres de stats.
- data/fr.json et data/en.json :
  - contiennent les variantes de stopEndings et protocolEndings.

Lancement local :
1. Ouvrir un terminal dans le dossier qui contient index.html.
2. Lancer :
   py -m http.server 8000 --bind 127.0.0.1
3. Ouvrir :
   http://127.0.0.1:8000/index.html

  cd /d "D:\Téléchargement\PROJET_CREATURE\alienation"
