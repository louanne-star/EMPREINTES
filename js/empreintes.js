// Les 5 Empreintes du parcours (contenu issu de la fiche projet).
// disponible : la fresque existe sur le campus (compte pour compléter l'Atlas).
// lieu, gps : où trouver la fresque sur le campus (carte « Où nous trouver »).
// vignette : photo de la fresque (cartes de l'accueil et de l'Atlas).
// audio : fichier MP3 joué par le bouton « Écouter » (sinon voix du téléphone).
// dessin : formule de la molécule, générée depuis sa notation SMILES (voir molecules/).
export const EMPREINTES = [
  {
    id: 'carapace',
    lieu: "Mur à gauche du FabLab",
    gps: [-22.26225646889539, 166.40519669240635],
    vignette: './images/carte-tortue.jpg',
    disponible: true,
    dessin: './molecules/carapace.svg',
    legende: "Cystine : deux acides aminés de la kératine reliés par un pont soufre (S–S). Ces ponts rendent la carapace dure et résistante.",
    fresque: 'Les Architectes du Récif',
    personnage: 'la tortue',
    nom: 'Empreinte de Carapace',
    molecule: 'Kératine',
    fonction: 'Protection',
    couleur: 0xe6d3a3,
    audio: './audio/tortue.mp3',
    voix: "Je suis la tortue verte. Ma carapace est faite de kératine, la même protéine que vos ongles. Je peux vivre plus de 80 ans, si l'océan m'en laisse le temps.",
    fait: "La kératine protège la tortue depuis des millions d'années : une matière naturelle résistante, de la même famille moléculaire que nos ongles ou nos cheveux.",
  },
  {
    id: 'petale',
    lieu: "La terrasse à côté de Sister Food",
    gps: [-22.26316809139971, 166.403974778562],
    vignette: './images/carte-hibiscus.jpg',
    disponible: true,
    dessin: './molecules/petale.svg',
    legende: "Cyanidine : le pigment rouge-pourpre de l'hibiscus, la même formule que celle peinte sur la fresque.",
    fresque: 'La Chimie des Couleurs',
    personnage: 'le papillon',
    nom: 'Empreinte de Pétale',
    molecule: 'Cyanidine',
    fonction: 'Communication',
    couleur: 0xc2185b,
    audio: './audio/papillon.mp3',
    voix: "Je suis le papillon, messager de l'hibiscus. Sa couleur est révélée par la cyanidine, un pigment naturel qui m'attire depuis toujours. Sans fleurs, plus de messagers ; sans messagers, plus de fleurs.",
    fait: "La cyanidine est le pigment naturel responsable des teintes rouges et pourpres de nombreuses fleurs tropicales. Elle explique pourquoi l'hibiscus attire ses pollinisateurs.",
  },
  {
    id: 'plume',
    lieu: "Dans le patio, au niveau de la BU",
    gps: [-22.263152596669002, 166.40438047315288],
    vignette: './images/carte-loriquet.jpg',
    disponible: true,
    dessin: './molecules/plume.svg',
    legende: "DHICA : une des briques qui s'assemblent pour former la mélanine des plumes.",
    fresque: 'Le Langage des Plumes',
    personnage: 'le loriquet',
    nom: 'Empreinte de Plume',
    molecule: 'Mélanine et caroténoïdes',
    fonction: 'Adaptation',
    couleur: 0xff9800,
    audio: './audio/loriquet.mp3',
    voix: "Je suis le loriquet. Mes couleurs viennent de la mélanine et des caroténoïdes, une combinaison qui fait de moi unique à mon espèce. Sans forêt, plus de couleurs ; sans couleurs, plus de loriquet.",
    fait: "La mélanine et les caroténoïdes sont les pigments responsables des couleurs du plumage tropical, signature unique de l'espèce.",
  },
  {
    id: 'feuille',
    disponible: false, // fresque pas encore peinte
    dessin: null,
    legende: "Chlorophylle",
    fresque: 'Le Souffle de la Forêt',
    personnage: 'le cagou',
    nom: 'Empreinte de Feuille',
    molecule: 'Chlorophylle',
    fonction: 'Énergie',
    couleur: 0x2e7d32,
    voix: "Je suis le kauri. Ma sève circule grâce à la chlorophylle. Elle capte la lumière et la transforme en vie. Certains d'entre nous vivent depuis plus de 500 ans. Mais chaque arbre coupé, c'est une mémoire de plusieurs siècles qui disparaît.",
    fait: "La chlorophylle capte la lumière et la transforme en vie : le moteur invisible de tout l'écosystème.",
  },
  {
    id: 'armure',
    disponible: false, // fresque pas encore peinte
    dessin: './molecules/armure.svg',
    legende: "N-acétylglucosamine : la brique qui, répétée, forme la chitine de l'armure du crabe.",
    fresque: "L'Armure de la Mangrove",
    personnage: 'le crabe de cocotier',
    nom: "Empreinte d'Armure",
    molecule: 'Chitine',
    fonction: 'Structure',
    couleur: 0xc8642a,
    voix: "Je suis le crabe de cocotier. Mon armure est faite de chitine, une architecture vivante que je reconstruis à chaque mue. Je peux vivre plus de 60 ans, grimper aux arbres, ouvrir une noix de coco d'une seule pince. Mais la mangrove où je vis recule un peu plus chaque année.",
    fait: "Contrairement à un squelette interne, le crabe construit avec la chitine une armure externe et articulée, renouvelée à chaque mue.",
  },
];

// Message final, quand toutes les Empreintes disponibles sont réunies
export const MESSAGE_FINAL = {
  titre: 'Atlas complet',
  texte: "Nous sommes la tortue, le papillon et le loriquet. La mer, le jardin, le ciel. Chacun de nous porte une mémoire invisible, écrite dans nos molécules depuis des millions d'années. Tu l'as retrouvée, comprise et sauvegardée. Maintenant, transmets-la : une mémoire n'existe que si quelqu'un s'en souvient.",
  suite: "D'autres fresques arriveront bientôt sur le campus : l'Atlas continuera de grandir.",
};

export const getEmpreinte = (id) => EMPREINTES.find((e) => e.id === id);
