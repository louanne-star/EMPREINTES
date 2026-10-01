import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { FRESQUES, TARGETS_FILE } from './fresques.js';
import { createGame } from './game.js';
import { createControls } from './controls.js';
import { atlas, renderAtlas } from './atlas.js';

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
  $('#reveal').hidden = false;
}

function updateAtlasCount() {
  $('#atlas-count').textContent = `${atlas.count()}/${atlas.total()}`;
}

// --- Interface ---

updateAtlasCount();

$('#listen').addEventListener('click', () => {
  if (!active || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(active.empreinte.voix);
  u.lang = 'fr-FR';
  speechSynthesis.speak(u);
});

$('#replay').addEventListener('click', () => {
  $('#reveal').hidden = true;
  active?.replay();
});

const openAtlas = () => {
  renderAtlas($('#atlas-list'), $('#atlas-footer'));
  $('#atlas').hidden = false;
};
$('#atlas-btn').addEventListener('click', openAtlas);
$('#reveal-atlas').addEventListener('click', () => { $('#reveal').hidden = true; openAtlas(); });
$('#atlas-close').addEventListener('click', () => { $('#atlas').hidden = true; });

$('#start').addEventListener('click', async () => {
  const btn = $('#start');
  btn.disabled = true;
  btn.textContent = 'Chargement…';

  await Promise.all(games.map((g) => g.load()));
  await mindarThree.start();
  btn.hidden = true;
  $('#hint').hidden = false;

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    tick(Math.min(clock.getDelta(), 0.05));
    renderer.render(scene, camera);
  });
});
