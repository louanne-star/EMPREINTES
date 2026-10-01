import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { FRESQUES, TARGETS_FILE } from './fresques.js';
import { createGame } from './game.js';
import { createControls } from './controls.js';
import { atlas, renderAtlas, renderFinal } from './atlas.js';
import { voix, verifierFichiers } from './voix.js';
import { EMPREINTES } from './empreintes.js';

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
  $('#reveal-title').textContent = empreinte.nom;
  $('#reveal-molecule').textContent = `${empreinte.molecule} · ${empreinte.fonction}`;
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
  const score = `${atlas.count()}/${atlas.total()}`;
  $('#atlas-count').textContent = score;
  $('#accueil-atlas').textContent = `Mon Atlas · ${score}`;
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
  renderAtlas($('#atlas-list'), $('#atlas-footer'), $('#atlas-final'));
  $('#atlas').scrollTop = 0;
  $('#atlas').hidden = false;
};
$('#atlas-btn').addEventListener('click', openAtlas);
$('#reveal-atlas').addEventListener('click', () => { voix.arreter(); $('#reveal').hidden = true; openAtlas(); });
$('#atlas-close').addEventListener('click', () => { $('#atlas').hidden = true; });

$('#accueil-atlas').addEventListener('click', openAtlas);

// Le bouton « ? » rouvre la page d'accueil ; l'expérience continue derrière
$('#aide-btn').addEventListener('click', () => { $('#accueil').hidden = false; });

let started = false;
$('#start').addEventListener('click', async () => {
  const btn = $('#start');
  if (started) {
    $('#accueil').hidden = true;
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Chargement…';
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
    btn.textContent = "Commencer l'exploration";
    return;
  }

  started = true;
  btn.disabled = false;
  btn.textContent = "Reprendre l'exploration";
  $('#accueil').hidden = true;
  $('#hint').hidden = active !== null;

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    tick(Math.min(clock.getDelta(), 0.05));
    renderer.render(scene, camera);
  });
});
