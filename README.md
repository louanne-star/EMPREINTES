# Empreintes — AR sur les fresques du campus, mini-jeu et Atlas

## Lancer
Dans ce dossier :  npx serve
Puis ouvrir http://localhost:3000 sur le PC (la caméra exige localhost ou HTTPS).
En ligne (HTTPS, pour le téléphone) : GitHub Pages.

## Parcours
1. « Scanner la fresque » → viser n'importe quelle fresque du parcours.
2. L'app reconnaît laquelle c'est : son personnage 3D sort de la peinture.
3. Le joystick rond apparaît (glisser le pouce), la molécule apparaît à un endroit fixe.
   Sur PC, les flèches du clavier marchent aussi.
4. On peut détourner le téléphone : la scène reste figée à l'écran (mode Explorer).
   Filmer une autre fresque bascule sur sa partie.
5. Molécule attrapée → carte « voix de l'espèce » + sauvegarde dans l'Atlas (bouton en haut à droite).

## Organisation
- js/fresques.js : une fiche de réglages par fresque (personnage, molécule, tailles, zones…)
- js/empreintes.js : textes des 5 Empreintes
- js/game.js : déroulement d'une partie (commun à toutes les fresques)
- js/personnage.js, js/gelule.js : chargement et animation des modèles 3D
- js/ar.js : reconnaissance des fresques et interface

## Ajouter une fresque
1. Photo nette et de face de la fresque dans targets/.
2. Compiler TOUTES les photos ensemble dans un seul fichier .mind
   (mind-ar-js > Tools > Compile), dans le même ordre que la liste de js/fresques.js.
3. Mettre ce fichier dans targets/ et son chemin dans TARGETS_FILE (js/fresques.js).
4. Modèles .glb du personnage et de la molécule dans models/.
5. Copier le bloc de la tortue dans js/fresques.js, mettre targetIndex: 1 et adapter.
6. Ajouter le crédit des modèles en bas de l'Atlas (index.html) s'ils viennent de Sketchfab.

## Modèles 3D et crédits
- models/turtle.glb — « Turtle » par 1674143 sur Sketchfab
  (https://sketchfab.com/3d-models/turtle-161e0529cd064993984fe5eee42105dc), licence CC-BY 4.0
- models/molecule.glb — « Water Molecule ball-and-stick model » par borkia sur Sketchfab
  (https://sketchfab.com/3d-models/water-molecule-ball-and-stick-model-b3b508a8fde242ddb4d5baa8988ee090),
  licence CC-BY-SA 4.0
Les crédits sont affichés en bas de l'Atlas et doivent y rester.
Si un modèle manque, l'app dessine une version provisoire en code.

## Réglages
- Par fresque (js/fresques.js) : taille (length, size), vitesse (speed), vue de 3/4 (tilt34),
  orientation du modèle (rotation), profondeur (depth), zones (bounds, geluleZone).
- Communs (haut de js/game.js) : inertie, virages, tolérance de capture, lissage du suivi.

## À savoir
- targets/tortue.mind vient de la photo du dossier de Kuby (basse résolution).
  Pour le vrai mur : photo nette et de face, recompiler, remplacer.
- L'Atlas est enregistré dans le navigateur du téléphone (localStorage) pour le prototype.
- Pour remettre l'Atlas à zéro : dans la console, localStorage.removeItem('empreintes.atlas.v1')
