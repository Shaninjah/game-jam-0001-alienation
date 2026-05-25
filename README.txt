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
- Le bloc unlockDifficulty ajoute une difficulté interne non affichée au joueur :
  - chaque partie active d'un même tier augmente le seuil de la prochaine partie de ce tier ;
  - la queue est ignorée par défaut, car elle sert de base visible ;
  - les seuils de base actuels sont tier 1 = 3, tier 2 = 6, tier 3 = 9.
- Si plusieurs parties d'un même slot sont débloquées au même tier, je garde la première déjà verrouillée.
- Si une partie d'un tier plus haut est débloquée, elle remplace la partie verrouillée sur ce slot.

Lancement local :
1. Ouvrir un terminal dans le dossier qui contient index.html.
2. Lancer :
   py -m http.server 8000 --bind 127.0.0.1
3. Ouvrir :
   http://127.0.0.1:8000/index.html

  cd /d "D:\Téléchargement\PROJET_CREATURE\alienation"
