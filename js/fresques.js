// Toutes les fresques reconnues par l'app.
//
// TARGETS_FILE contient les images de TOUTES les fresques, compilées ensemble
// (mind-ar-js > Tools > Compile, en ajoutant les photos dans le même ordre que
// la liste ci-dessous). targetIndex = position de la photo dans ce fichier.
//
// Repère d'une fresque : largeur 1, centre en (0, 0), x vers la droite, y vers le
// haut, z vers le visiteur. Hauteur = hauteur / largeur de la photo.
// Contenu attendu : 0 = tortue.jpg, 1 = hibiscus.jpg, 2 = loriquet.jpg
export const TARGETS_FILE = './targets/fresques.mind';

export const FRESQUES = [
  {
    // Les Architectes du Récif, photo : targets/tortue.jpg (hauteur 0,388)
    id: 'tortue',
    targetIndex: 0,
    empreinte: 'carapace',              // voir js/empreintes.js
    spawn: [-0.22, 0.03],               // où le personnage sort de la peinture (la carapace)
    heading: 0,                         // direction de départ (0 = vers la droite)
    bounds: { x: 0.6, y: 0.3 },         // zone de déplacement
    geluleZone: { x: 0.45, y: 0.17 },   // zone où la gélule peut apparaître
    depth: [0.06, 0.38],                // distance au mur : min, max
    speed: 0.18,                        // largeurs de fresque par seconde

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
    // La Chimie des Couleurs (hibiscus), photo : targets/hibiscus.jpg (hauteur 0,657).
    // Le papillon n'est pas peint sur la fresque : il sort du pistil du grand
    // hibiscus rouge, à droite, à côté de la formule de la cyanidine.
    id: 'hibiscus',
    targetIndex: 1,
    empreinte: 'petale',
    spawn: [0.19, -0.15],
    heading: Math.PI,                   // part vers la gauche, vers le centre de la fresque
    bounds: { x: 0.6, y: 0.4 },
    geluleZone: { x: 0.42, y: 0.26 },
    depth: [0.08, 0.45],
    speed: 0.3,

    personnage: {
      // « BUTTERFLY » par Rukh3D sur Sketchfab, licence CC-BY 4.0 (crédit obligatoire)
      model: './models/butterfly.glb',
      length: 0.3,
      rotation: [Math.PI / 2, Math.PI / 2, 0],
      tilt34: 0.35,                     // surtout vu de dessus, pour voir les ailes
      pitch: -0.2,
      bob: 0.025,                       // vol plus sautillant que la nage de la tortue
      animSpeed: 2.5,                   // battements d'ailes accélérés (1 = vitesse d'origine)
      clip: /\|3$/,                     // animations du modèle : « 3 », « ! », « 2 »
    },

    molecule: {
      // Provisoire : même molécule que la tortue, en attendant la cyanidine
      model: './models/molecule.glb',
      size: 0.09,
    },
  },

  // Le Langage des Plumes (loriquet) : targetIndex 2 dans fresques.mind,
  // en attente du nouveau modèle 3D.
];
