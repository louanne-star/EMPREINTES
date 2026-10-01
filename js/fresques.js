// Toutes les fresques reconnues par l'app.
//
// TARGETS_FILE contient les images de TOUTES les fresques, compilées ensemble
// (mind-ar-js > Tools > Compile, en ajoutant les photos dans le même ordre que
// la liste ci-dessous). targetIndex = position de la photo dans ce fichier.
//
// Repère d'une fresque : largeur 1, centre en (0, 0), x vers la droite, y vers le
// haut, z vers le visiteur. Hauteur = hauteur / largeur de la photo.
export const TARGETS_FILE = './targets/tortue.mind';

export const FRESQUES = [
  {
    id: 'tortue',
    targetIndex: 0,
    empreinte: 'carapace',              // voir js/empreintes.js
    spawn: [-0.2, 0.03],                // où le personnage sort de la peinture
    heading: 0,                         // direction de départ (0 = vers la droite)
    bounds: { x: 0.6, y: 0.3 },         // zone de déplacement
    geluleZone: { x: 0.45, y: 0.17 },   // zone où la gélule peut apparaître
    depth: [0.06, 0.38],                // distance au mur : min, max
    speed: 0.14,                        // largeurs de fresque par seconde

    personnage: {
      // « Turtle » par 1674143 sur Sketchfab, licence CC-BY 4.0 (crédit obligatoire)
      model: './models/turtle.glb',
      length: 0.42,                     // taille, en largeurs de fresque
      // Orientation du modèle : dos face à la caméra, tête vers la droite.
      // Réglage pour un .glb standard (haut = +Y, avant = +Z).
      rotation: [Math.PI / 2, Math.PI / 2, 0],
      tilt34: 0.75,                     // vue de 3/4 (0 = de dos, 1.57 = profil)
      pitch: -0.15,                     // tête un peu relevée vers la caméra
      clip: /swim|nage/i,               // animation à jouer dans le modèle
    },

    molecule: {
      // « Water Molecule ball-and-stick model » par borkia sur Sketchfab, licence CC-BY-SA 4.0
      model: './models/molecule.glb',
      size: 0.09,
    },
  },

  {
    // La Chimie des Couleurs (hibiscus). Le papillon n'est pas peint sur la fresque :
    // il sort de la fleur. Zones et point de départ à ajuster avec la vraie photo.
    id: 'hibiscus',
    targetIndex: 1,
    empreinte: 'petale',
    spawn: [0, 0],
    heading: 0,
    bounds: { x: 0.6, y: 0.3 },
    geluleZone: { x: 0.45, y: 0.17 },
    depth: [0.08, 0.45],
    speed: 0.16,

    personnage: {
      // « BUTTERFLY » par Rukh3D sur Sketchfab, licence CC-BY 4.0 (crédit obligatoire)
      model: './models/butterfly.glb',
      length: 0.3,
      rotation: [Math.PI / 2, Math.PI / 2, 0],
      tilt34: 0.35,                     // surtout vu de dessus, pour voir les ailes
      pitch: -0.2,
      bob: 0.025,                       // vol plus sautillant que la nage de la tortue
      clip: /\|3$/,                     // animations du modèle : « 3 », « ! », « 2 »
    },

    molecule: {
      // Provisoire : même molécule que la tortue, en attendant la cyanidine
      model: './models/molecule.glb',
      size: 0.09,
    },
  },
];
