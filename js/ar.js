import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
import { createTortue } from './tortue.js';
import { createGelule } from './gelule.js';
import { createControls } from './controls.js';
import { atlas, renderAtlas } from './atlas.js';
import { getEmpreinte } from './empreintes.js';

const $ = (sel) => document.querySelector(sel);

// Repère de la fresque : largeur 1, centre en (0, 0), y vers le haut.
// Hauteur = 244 / 644 (proportions de targets/tortue-source.jpg).
const BOUNDS = { x: 0.6, y: 0.3 };               // zone de nage (un peu plus large que la fresque)
const GELULE_ZONE = { x: 0.45, y: 0.17 };        // zone où la gélule peut apparaître
const GELULE_MIN_DIST = 0.35;                    // distance minimale à la tortue au départ
const SPAWN_POS = new THREE.Vector2(-0.2, 0.03); // la tortue peinte
// Profondeur (distance au mur, vers le visiteur) : la tortue fait des vagues entre
// Z_MIN et Z_MAX, uniquement quand elle nage. Immobile, elle garde sa profondeur.
const Z_MIN = 0.06;
const Z_MAX = 0.38;
const DEPTH_WAVE = 9;     // plus grand = vagues plus serrées (≈ 0,7 largeur de fresque par vague)
const SPEED = 0.14;       // largeurs de fresque par seconde
const ACCEL = 2.5;        // plus petit = plus d'inertie
const TURN = 3.5;         // vitesse à laquelle la tortue s'oriente
const TRACK_SMOOTH = 10;  // lissage du suivi de la fresque (plus petit = plus doux, plus de retard)
const CATCH_DIST = 0.07;  // tolérance dans le plan de la fresque
const CATCH_DEPTH = 0.07; // tolérance en profondeur
const SPAWN_TIME = 1.8;
const CATCH_TIME = 1.2;

const EMPREINTE = getEmpreinte('carapace');

const mindarThree = new MindARThree({
  container: $('#container'),
  imageTargetSrc: './targets/tortue.mind',
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

const anchor = mindarThree.addAnchor(0);

// Le jeu vit dans `world`, qui suit en douceur la position de la fresque tant
// qu'elle est visible, puis reste figé à l'écran quand on la perd : on peut
// continuer à jouer sans viser le mur (mode « Explorer »).
const world = new THREE.Group();
world.matrixAutoUpdate = false;
world.visible = false;
scene.add(world);

let tracking = false;
anchor.onTargetFound = () => { tracking = true; };
anchor.onTargetLost = () => { tracking = false; };

const controls = createControls($('#joystick'));
const tortuePromise = createTortue();
const gelulePromise = createGelule(EMPREINTE.couleur);
let tortue, gelule;

const pos = SPAWN_POS.clone();
const vel = new THREE.Vector2();
const input = new THREE.Vector2();
let heading = 0;
let depthPhase = 0; // 0 = contre le mur (Z_MIN), π = au plus près du visiteur (Z_MAX)
let depth = Z_MIN;
let state = 'scan'; // scan → spawn → play → catch → done
let stateTime = 0;

const track = {
  ready: false,
  pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3(),
  tPos: new THREE.Vector3(), tQuat: new THREE.Quaternion(), tScale: new THREE.Vector3(),
};

const easeOut = (p) => 1 - (1 - p) ** 3;
const easeOutBack = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
const damp = (dt, k) => 1 - Math.exp(-dt * k);

function setState(s) {
  state = s;
  stateTime = 0;
}

function followFresque(dt) {
  if (!tracking) return;
  anchor.group.matrix.decompose(track.tPos, track.tQuat, track.tScale);
  if (!track.ready) {
    track.pos.copy(track.tPos);
    track.quat.copy(track.tQuat);
    track.scale.copy(track.tScale);
    track.ready = true;
  } else {
    const k = damp(dt, TRACK_SMOOTH);
    track.pos.lerp(track.tPos, k);
    track.quat.slerp(track.tQuat, k);
    track.scale.lerp(track.tScale, k);
  }
  world.matrix.compose(track.pos, track.quat, track.scale);
  world.matrixWorldNeedsUpdate = true;
}

// La gélule apparaît à un endroit fixe, assez loin de la tortue
function placeGelule() {
  const g = gelule.root.position;
  do {
    g.x = THREE.MathUtils.randFloatSpread(2 * GELULE_ZONE.x);
    g.y = THREE.MathUtils.randFloatSpread(2 * GELULE_ZONE.y);
  } while (Math.hypot(g.x - pos.x, g.y - pos.y) < GELULE_MIN_DIST);
  gelule.depth = THREE.MathUtils.randFloat(Z_MIN + 0.04, Z_MAX - 0.04);
  gelule.root.scale.setScalar(0);
  gelule.root.visible = true;
}

function swim(dt, active) {
  controls.read(input).multiplyScalar(active ? SPEED : 0);
  vel.lerp(input, damp(dt, ACCEL));
  pos.addScaledVector(vel, dt);

  // Bords : on bloque la position et on annule la vitesse vers l'extérieur
  if (Math.abs(pos.x) > BOUNDS.x) { pos.x = Math.sign(pos.x) * BOUNDS.x; vel.x = 0; }
  if (Math.abs(pos.y) > BOUNDS.y) { pos.y = Math.sign(pos.y) * BOUNDS.y; vel.y = 0; }

  let turn = 0;
  if (vel.lengthSq() > 1e-4) {
    let diff = Math.atan2(vel.y, vel.x) - heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const step = diff * damp(dt, TURN);
    heading += step;
    turn = step / dt;
  }

  // Vagues en profondeur : avancent avec la distance parcourue
  depthPhase += vel.length() * dt * DEPTH_WAVE;
  const newDepth = Z_MIN + (Z_MAX - Z_MIN) * (0.5 - 0.5 * Math.cos(depthPhase));
  const climb = (newDepth - depth) / dt / SPEED; // > 0 quand elle vient vers le visiteur
  depth = newDepth;

  tortue.root.position.set(pos.x, pos.y, depth);
  tortue.root.rotation.z = heading;
  return { turn, climb };
}

function tick(dt) {
  stateTime += dt;
  followFresque(dt);

  if (state === 'scan') {
    if (!tracking) return;
    $('#hint').hidden = true;
    world.visible = true;
    placeGelule();
    setState('spawn');
  }

  const root = tortue.root;
  let turn = 0;
  let climb = 0;
  let excite = 0;

  if (state === 'spawn') {
    // La tortue sort de la peinture en tournoyant
    const p = Math.min(stateTime / SPAWN_TIME, 1);
    root.scale.setScalar(Math.max(easeOutBack(p), 0));
    root.position.set(pos.x, pos.y, depth * easeOut(p));
    root.rotation.z = heading + (1 - easeOut(p)) * Math.PI * 2;
    turn = -(1 - p) * 4; // elle penche dans sa vrille
    if (p === 1) {
      controls.show();
      setState('play');
    }
  }

  if (state === 'play') {
    gelule.root.scale.setScalar(Math.min(gelule.root.scale.x + dt * 1.5, 1));
    ({ turn, climb } = swim(dt, true));
    const g = gelule.root.position;
    if (Math.hypot(g.x - pos.x, g.y - pos.y) < CATCH_DIST && Math.abs(gelule.depth - depth) < CATCH_DEPTH) {
      controls.hide();
      setState('catch');
    }
  }

  if (state === 'catch' || state === 'done') {
    ({ turn, climb } = swim(dt, false)); // la tortue glisse sur son élan
  }

  if (state === 'catch') {
    // La gélule reste sur place : elle s'emballe, grossit, monte puis s'efface
    const p = Math.min(stateTime / CATCH_TIME, 1);
    excite = easeOut(p);
    gelule.root.scale.setScalar(p < 0.4 ? 1 + (p / 0.4) * 0.5 : 1.5 * (1 - easeOut((p - 0.4) / 0.6)));
    if (p === 1) {
      gelule.root.visible = false;
      onCollected();
      setState('done');
    }
  }

  tortue.update(dt, vel.length() / SPEED, turn, root.rotation.z, climb);
  if (gelule.root.visible) gelule.update(dt, excite);
}

function onCollected() {
  const isNew = atlas.add(EMPREINTE.id);
  updateAtlasCount();
  $('#reveal-status').textContent = isNew ? 'Nouvelle Empreinte sauvegardée dans ton Atlas' : 'Déjà dans ton Atlas';
  $('#reveal').hidden = false;
}

function updateAtlasCount() {
  $('#atlas-count').textContent = `${atlas.count()}/${atlas.total()}`;
}

// --- Interface ---

$('#reveal-title').textContent = EMPREINTE.nom;
$('#reveal-molecule').textContent = `${EMPREINTE.molecule} · ${EMPREINTE.fonction}`;
$('#reveal-voix').textContent = `« ${EMPREINTE.voix} »`;
$('#reveal-fait').textContent = EMPREINTE.fait;
updateAtlasCount();

$('#listen').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(EMPREINTE.voix);
  u.lang = 'fr-FR';
  speechSynthesis.speak(u);
});

$('#replay').addEventListener('click', () => {
  $('#reveal').hidden = true;
  placeGelule();
  controls.show();
  setState('play');
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

  [tortue, gelule] = await Promise.all([tortuePromise, gelulePromise]);
  tortue.root.scale.setScalar(0);
  world.add(tortue.root);
  gelule.root.visible = false;
  world.add(gelule.root);

  await mindarThree.start();
  btn.hidden = true;
  $('#hint').hidden = false;

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    tick(Math.min(clock.getDelta(), 0.05));
    renderer.render(scene, camera);
  });
});
