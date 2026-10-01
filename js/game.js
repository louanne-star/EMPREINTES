import * as THREE from 'three';
import { createPersonnage } from './personnage.js';
import { createGelule } from './gelule.js';
import { getEmpreinte } from './empreintes.js';

// Réglages communs à toutes les fresques (ceux propres à une fresque sont dans js/fresques.js)
const ACCEL = 2.5;          // plus petit = plus d'inertie
const TURN = 3.5;           // vitesse à laquelle le personnage s'oriente
const DEPTH_WAVE = 9;       // plus grand = vagues en profondeur plus serrées
const TRACK_SMOOTH = 10;    // lissage du suivi de la fresque (plus petit = plus doux, plus de retard)
const CATCH_DIST = 0.11;    // tolérance dans le plan de la fresque
const CATCH_DEPTH = 0.09;   // tolérance en profondeur
const GELULE_MIN_DIST = 0.35; // distance minimale au personnage quand la gélule apparaît
const SPAWN_TIME = 1.8;
const CATCH_TIME = 1.2;

const easeOut = (p) => 1 - (1 - p) ** 3;
const easeOutBack = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
const damp = (dt, k) => 1 - Math.exp(-dt * k);

// Une partie sur une fresque : personnage, gélule et leur déroulement.
// États : idle → spawn → play → catch → done
export function createGame(cfg, mindarThree, { controls, onCaught }) {
  const empreinte = getEmpreinte(cfg.empreinte);
  const anchor = mindarThree.addAnchor(cfg.targetIndex);
  const [zMin, zMax] = cfg.depth;

  // La partie vit dans `world`, qui suit en douceur la fresque tant qu'elle est
  // visible, puis reste figé à l'écran quand on la perd : on peut continuer à jouer
  // sans viser le mur (mode « Explorer »).
  const world = new THREE.Group();
  world.matrixAutoUpdate = false;
  world.visible = false;
  mindarThree.scene.add(world);

  let tracking = false;
  anchor.onTargetFound = () => { tracking = true; };
  anchor.onTargetLost = () => { tracking = false; };

  let perso, gelule;
  const spawn = new THREE.Vector2(...cfg.spawn);
  const pos = new THREE.Vector2();
  const vel = new THREE.Vector2();
  const input = new THREE.Vector2();
  let heading = 0;
  let depthPhase = 0; // 0 = contre le mur (zMin), π = au plus près du visiteur (zMax)
  let depth = zMin;
  let state = 'idle';
  let stateTime = 0;

  const track = {
    ready: false,
    pos: new THREE.Vector3(), quat: new THREE.Quaternion(), scale: new THREE.Vector3(),
    tPos: new THREE.Vector3(), tQuat: new THREE.Quaternion(), tScale: new THREE.Vector3(),
  };

  function setState(s) {
    state = s;
    stateTime = 0;
  }

  function follow(dt) {
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

  function reset() {
    pos.copy(spawn);
    vel.set(0, 0);
    heading = cfg.heading;
    depthPhase = 0;
    depth = zMin;
    perso.root.scale.setScalar(0);
    gelule.root.visible = false;
  }

  // La gélule apparaît à un endroit fixe, assez loin du personnage
  function placeGelule() {
    const g = gelule.root.position;
    do {
      g.x = THREE.MathUtils.randFloatSpread(2 * cfg.geluleZone.x);
      g.y = THREE.MathUtils.randFloatSpread(2 * cfg.geluleZone.y);
    } while (Math.hypot(g.x - pos.x, g.y - pos.y) < GELULE_MIN_DIST);
    gelule.depth = THREE.MathUtils.randFloat(zMin + 0.04, zMax - 0.04);
    gelule.root.scale.setScalar(0);
    gelule.root.visible = true;
  }

  function move(dt, active) {
    controls.read(input).multiplyScalar(active ? cfg.speed : 0);
    vel.lerp(input, damp(dt, ACCEL));
    pos.addScaledVector(vel, dt);

    // Bords : on bloque la position et on annule la vitesse vers l'extérieur
    if (Math.abs(pos.x) > cfg.bounds.x) { pos.x = Math.sign(pos.x) * cfg.bounds.x; vel.x = 0; }
    if (Math.abs(pos.y) > cfg.bounds.y) { pos.y = Math.sign(pos.y) * cfg.bounds.y; vel.y = 0; }

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
    const newDepth = zMin + (zMax - zMin) * (0.5 - 0.5 * Math.cos(depthPhase));
    const climb = (newDepth - depth) / dt / cfg.speed; // > 0 quand il vient vers le visiteur
    depth = newDepth;

    perso.root.position.set(pos.x, pos.y, depth);
    perso.root.rotation.z = heading;
    return { turn, climb };
  }

  return {
    id: cfg.id,
    empreinte,
    get tracking() { return tracking; },
    get state() { return state; },

    async load() {
      [perso, gelule] = await Promise.all([
        createPersonnage(cfg.personnage),
        createGelule(empreinte.couleur, cfg.molecule),
      ]);
      world.add(perso.root, gelule.root);
      reset();
    },

    follow,

    start() {
      reset();
      world.visible = true;
      placeGelule();
      setState('spawn');
    },

    stop() {
      world.visible = false;
      reset();
      setState('idle');
    },

    replay() {
      placeGelule();
      controls.show();
      setState('play');
    },

    tick(dt) {
      if (state === 'idle') return;
      stateTime += dt;
      const root = perso.root;
      let turn = 0;
      let climb = 0;
      let excite = 0;

      if (state === 'spawn') {
        // Le personnage sort de la peinture en tournoyant
        const p = Math.min(stateTime / SPAWN_TIME, 1);
        root.scale.setScalar(Math.max(easeOutBack(p), 0));
        root.position.set(pos.x, pos.y, depth * easeOut(p));
        root.rotation.z = heading + (1 - easeOut(p)) * Math.PI * 2;
        turn = -(1 - p) * 4; // il penche dans sa vrille
        if (p === 1) {
          controls.show();
          setState('play');
        }
      }

      if (state === 'play') {
        gelule.root.scale.setScalar(Math.min(gelule.root.scale.x + dt * 1.5, 1));
        ({ turn, climb } = move(dt, true));
        const g = gelule.root.position;
        if (Math.hypot(g.x - pos.x, g.y - pos.y) < CATCH_DIST && Math.abs(gelule.depth - depth) < CATCH_DEPTH) {
          controls.hide();
          setState('catch');
        }
      }

      if (state === 'catch' || state === 'done') {
        ({ turn, climb } = move(dt, false)); // le personnage glisse sur son élan
      }

      if (state === 'catch') {
        // La gélule reste sur place : elle s'emballe, grossit, monte puis s'efface
        const p = Math.min(stateTime / CATCH_TIME, 1);
        excite = easeOut(p);
        gelule.root.scale.setScalar(p < 0.4 ? 1 + (p / 0.4) * 0.5 : 1.5 * (1 - easeOut((p - 0.4) / 0.6)));
        if (p === 1) {
          gelule.root.visible = false;
          setState('done');
          onCaught(empreinte);
        }
      }

      perso.update(dt, vel.length() / cfg.speed, turn, root.rotation.z, climb);
      if (gelule.root.visible) gelule.update(dt, excite);
    },
  };
}
