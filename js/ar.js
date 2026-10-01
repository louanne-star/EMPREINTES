import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { FRESQUES, TARGETS_FILE } from './fresques.js';
import { createGame } from './game.js';
import { createControls } from './controls.js';
import { atlas, renderAtlas, renderFinal, renderCartes } from './atlas.js';
import { voix, verifierFichiers } from './voix.js';
import { EMPREINTES, getEmpreinte } from './empreintes.js';

const $ = (sel) => document.querySelector(sel);

const mindarThree = new MindARThree({
  container: $('#container'),
  imageTargetSrc: TARGETS_FILE,
  uiScanning: 'no', // on gère notre propre message, la scène reste visible hors champ
  // Filtre anti-tremblement de MindAR, plus doux que celui par défaut
  filterMinCF: 0.0001,
  filterBeta: 0.001,
});
const { renderer, scene, camera } = mindarThree;

scene.add(new THREE.HemisphereLight(0xffffff, 0x335566, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(0.5, 1, 2);
scene.add(sun);

const controls = createControls($('#joystick'));
const games = FRESQUES.map((f) => createGame(f, mindarThree, { controls, onCaught }));
let active = null; // la partie en cours

function tick(dt) {
  for (const g of games) g.follow(dt);

  // Une autre fresque est filmée : on bascule dessus (sauf pendant une capture)
  const seen = games.find((g) => g.tracking && g !== active);
  if (seen && active?.state !== 'catch') {
    active?.stop();
    controls.hide();
    voix.arreter();
    $('#reveal').hidden = true;
    $('#hint').hidden = true;
    active = seen;
    active.start();
  }

  active?.tick(dt);
}

function onCaught(empreinte) {
  const isNew = atlas.add(empreinte.id);
  updateAtlasCount();
  $('#reveal-lieu').textContent = empreinte.fresque;
  $('#reveal-title').textContent = empreinte.nom;
  $('#reveal-molecule').textContent = empreinte.molecule;
  $('#reveal-fonction').textContent = empreinte.fonction;
  $('#reveal-score').textContent = atlas.score();
  $('#reveal-voix').textContent = `« ${empreinte.voix} »`;
  $('#reveal-fait').textContent = empreinte.fait;
  $('#reveal-status').textContent = isNew ? 'Nouvelle Empreinte sauvegardée dans ton Atlas' : 'Déjà dans ton Atlas';

  const dessin = $('#reveal-dessin');
  dessin.hidden = !empreinte.dessin;
  if (empreinte.dessin) {
    dessin.querySelector('img').src = empreinte.dessin;
    dessin.querySelector('img').alt = `Formule : ${empreinte.molecule}`;
    dessin.querySelector('figcaption').textContent = empreinte.legende;
  }

  // Dernière Empreinte trouvée : le message collectif s'affiche directement
  if (isNew) renderFinal($('#reveal-final'));
  else $('#reveal-final').hidden = true;

  $('#reveal').hidden = false;
  $('#reveal').scrollTop = 0;
}

function updateAtlasCount() {
  $('#atlas-count').textContent = atlas.score();
  $('#accueil-score').textContent = atlas.score();
  $('#nb-fresques').textContent = `${atlas.total()} sur le campus`;
  renderCartes($('#cartes'));
}

// --- Interface ---

updateAtlasCount();
verifierFichiers(EMPREINTES.map((e) => e.audio));

const ECOUTER = '🔊 Écouter';
$('#listen').addEventListener('click', () => {
  if (!active) return;
  if (voix.enCours) return voix.arreter();
  $('#listen').textContent = '⏹ Arrêter';
  voix.jouer(active.empreinte, () => { $('#listen').textContent = ECOUTER; });
});

$('#replay').addEventListener('click', () => {
  voix.arreter();
  $('#reveal').hidden = true;
  active?.replay();
});

const openAtlas = () => {
  renderAtlas($('#atlas-list'), $('#atlas-stats'), $('#atlas-final'));
  $('#atlas').scrollTop = 0;
  $('#atlas').hidden = false;
};
$('#atlas-btn').addEventListener('click', openAtlas);
$('#reveal-atlas').addEventListener('click', () => { voix.arreter(); $('#reveal').hidden = true; openAtlas(); });
$('#atlas-close').addEventListener('click', () => { voix.arreter(); $('#atlas').hidden = true; });

// « Écouter » sur chaque fiche de l'Atlas
$('#atlas-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-ecouter]');
  if (!btn) return;
  const enCoursIci = btn.textContent.startsWith('⏹');
  voix.arreter();
  if (enCoursIci) return;
  btn.textContent = '⏹ Arrêter';
  voix.jouer(getEmpreinte(btn.dataset.ecouter), () => { btn.textContent = ECOUTER; });
});

// Écran de bienvenue → accueil : glisser le rond « Go » vers le haut (ou le toucher)
function entrer() {
  $('#splash').hidden = true;
  ouvrirAccueil();
}

// La carte est chargée à part : si elle échoue (réseau), le jeu fonctionne quand même
function ouvrirAccueil() {
  $('#accueil').hidden = false;
  import('./carte.js')
    .then((m) => m.afficherCarte($('#plan-carte'), $('#plan-lieux')))
    .catch((err) => console.warn('Carte indisponible', err));
}
{
  const go = $('#splash-go');
  const rond = go.querySelector('span');
  const COURSE = 70;          // distance max du rond vers le haut (px)
  let depart = null;
  let dy = 0;
  go.addEventListener('pointerdown', (e) => {
    depart = e.clientY;
    dy = 0;
    go.setPointerCapture(e.pointerId);
    go.classList.add('glisse');
  });
  go.addEventListener('pointermove', (e) => {
    if (depart === null) return;
    dy = Math.max(-COURSE, Math.min(0, e.clientY - depart));
    rond.style.transform = `translateY(${dy}px)`;
  });
  const lacher = () => {
    if (depart === null) return;
    depart = null;
    go.classList.remove('glisse');
    // Glissé assez haut, ou simple toucher : on entre
    if (dy < -COURSE * 0.6 || Math.abs(dy) < 4) entrer();
    else rond.style.transform = '';
  };
  go.addEventListener('pointerup', lacher);
  go.addEventListener('pointercancel', () => { depart = null; go.classList.remove('glisse'); rond.style.transform = ''; });
}

$('#accueil-atlas').addEventListener('click', openAtlas);

// Le bouton « maison » rouvre la page d'accueil ; l'expérience continue derrière
$('#aide-btn').addEventListener('click', ouvrirAccueil);

let started = false;
$('#start').addEventListener('click', async () => {
  const btn = $('#start');
  if (started) {
    $('#accueil').hidden = true;
    return;
  }
  btn.disabled = true;
  btn.classList.add('charge');
  $('#start-label').textContent = 'Chargement…';
  $('#accueil-erreur').hidden = true;

  try {
    await Promise.all(games.map((g) => g.load()));
    await mindarThree.start();
  } catch (err) {
    console.error(err);
    $('#accueil-erreur').textContent =
      "Impossible d'ouvrir la caméra. Vérifie que tu as autorisé son accès, puis réessaie.";
    $('#accueil-erreur').hidden = false;
    btn.disabled = false;
    btn.classList.remove('charge');
    $('#start-label').textContent = "Commencer l'exploration";
    return;
  }

  started = true;
  btn.disabled = false;
  btn.classList.remove('charge');
  $('#start-label').textContent = "Reprendre l'exploration";
  $('#accueil').hidden = true;
  $('#hint').hidden = active !== null;

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    tick(Math.min(clock.getDelta(), 0.05));
    renderer.render(scene, camera);
  });
});
