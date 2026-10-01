// « Voix de l'espèce » : joue le fichier empreinte.audio s'il existe (voix enregistrée ou générée),
// sinon lit le texte avec la meilleure voix française du téléphone.

let audio = null;
let onStop = null;
const fichiers = {}; // chemin → true si le fichier audio existe

// À appeler au démarrage : sur iPhone, la voix du téléphone doit démarrer pendant le
// toucher, il faut donc savoir à l'avance s'il y a un fichier audio.
export async function verifierFichiers(chemins) {
  await Promise.all(chemins.filter(Boolean).map(async (chemin) => {
    try {
      const r = await fetch(chemin, { method: 'HEAD' });
      fichiers[chemin] = r.ok;
    } catch {
      fichiers[chemin] = false;
    }
  }));
}

// Voix de synthèse les plus naturelles selon les appareils (iPhone, Android, Chrome, Edge)
const PREFEREES = /premium|enhanced|amélioré|natural|neural|google|audrey|amélie|thomas|marie|denise|henri/i;

function meilleureVoix() {
  if (!('speechSynthesis' in window)) return null;
  const fr = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('fr'));
  return fr.find((v) => /premium|enhanced|amélioré|natural|neural/i.test(v.name))
    ?? fr.find((v) => PREFEREES.test(v.name) && v.lang === 'fr-FR')
    ?? fr.find((v) => v.lang === 'fr-FR')
    ?? fr[0] ?? null;
}
// Certaines plateformes chargent la liste des voix après coup
if ('speechSynthesis' in window) speechSynthesis.getVoices();

function lireTexte(texte, fin) {
  if (!('speechSynthesis' in window)) return fin();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = 'fr-FR';
  u.voice = meilleureVoix();
  u.rate = 0.95;
  u.onend = u.onerror = fin;
  speechSynthesis.speak(u);
}

export const voix = {
  get enCours() { return onStop !== null; },

  // fin() est appelée quand la lecture se termine ou est arrêtée
  async jouer(empreinte, fin = () => {}) {
    voix.arreter();
    onStop = fin;
    const termine = () => { if (onStop === fin) { onStop = null; fin(); } };
    if (!fichiers[empreinte.audio]) return lireTexte(empreinte.voix, termine);
    audio = new Audio(empreinte.audio);
    audio.onended = termine;
    try {
      await audio.play();
    } catch {
      // Lecture refusée : voix du téléphone
      audio = null;
      if (onStop === fin) lireTexte(empreinte.voix, termine);
    }
  },

  arreter() {
    if (audio) { audio.pause(); audio = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    const fin = onStop;
    onStop = null;
    fin?.();
  },
};
