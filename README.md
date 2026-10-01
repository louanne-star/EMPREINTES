# Empreintes — Fresque tortue : AR + mini-jeu + Atlas

## Lancer
Dans ce dossier :  npx serve
Puis ouvrir http://localhost:3000 sur le PC (la caméra exige localhost ou HTTPS).

## Parcours
1. « Scanner la fresque » → viser la fresque.
2. La tortue 3D sort de la peinture en tournoyant.
3. Le joystick rond apparaît (glisser le pouce), la gélule-molécule apparaît à un endroit fixe.
   Sur PC, les flèches du clavier marchent aussi.
4. On peut détourner le téléphone : la scène reste figée à l'écran (mode Explorer).
5. Gélule attrapée → carte « voix de l'espèce » + sauvegarde dans l'Atlas (bouton en haut à droite).

## Tortue 3D
Modèle : `models/turtle.glb` — « Turtle » par 1674143 sur Sketchfab
(https://sketchfab.com/3d-models/turtle-161e0529cd064993984fe5eee42105dc), licence CC-BY 4.0 :
le crédit doit rester visible (il est affiché en bas de l'Atlas).
Sans ce fichier, une tortue provisoire est dessinée en code.
- Taille et centrage sont automatiques.
- Si le modèle contient une animation (nommée idéalement « swim » ou « nage »), elle est jouée.
- S'il arrive de travers : changer MODEL_ROTATION dans js/tortue.js.

Gélule : `models/molecule.glb` — « Water Molecule ball-and-stick model » par borkia sur Sketchfab
(https://sketchfab.com/3d-models/water-molecule-ball-and-stick-model-b3b508a8fde242ddb4d5baa8988ee090),
licence CC-BY-SA 4.0 (crédit affiché en bas de l'Atlas).

Réglages de feeling : constantes en haut de js/ar.js (SPEED, ACCEL, TURN, TRACK_SMOOTH)
et de js/tortue.js (TILT_34, TILT_PITCH, MAX_BANK).

## À savoir
- targets/tortue.mind vient de la photo du dossier de Kuby (basse résolution).
  Pour le vrai mur : photo nette et de face, recompiler (mind-ar-js > Tools > Compile), remplacer tortue.mind.
- L'Atlas est enregistré dans le navigateur du téléphone (localStorage) pour le prototype.
- Pour remettre l'Atlas à zéro : dans la console, localStorage.removeItem('empreintes.atlas.v1')
