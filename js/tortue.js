import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Modèle « Turtle » par 1674143 sur Sketchfab, licence CC-BY 4.0 (crédit obligatoire).
// Sans ce fichier, une tortue provisoire est dessinée en code.
export const MODEL_URL = './models/turtle.glb';

// Longueur de la tortue, en largeurs de fresque (1 = toute la fresque).
const LENGTH = 0.24;

// Orientation du modèle : on veut le dos face à la caméra et la tête vers la droite.
// Réglage par défaut pour un .glb standard (haut = +Y, avant = +Z).
// Si ta tortue arrive de travers, c'est ces angles qu'il faut changer.
const MODEL_ROTATION = new THREE.Euler(Math.PI / 2, Math.PI / 2, 0, 'XYZ');

// Vue de trois quarts comme la tortue peinte : la carapace bascule vers le haut de
// l'écran et on voit son flanc. TILT_34 = angle de bascule (0 = vue de dos, 1.57 = profil).
const TILT_34 = 0.75;
const TILT_PITCH = -0.15; // relève un peu la tête vers la caméra
const MAX_BANK = 0.2;     // roulis maximal dans les virages
const MAX_NOSE = 0.4;     // tête qui pique vers le visiteur ou vers le mur pendant les vagues

// Renvoie { root, update(dt, effort, turn, heading, climb) } : root se place et s'oriente dans le
// plan de la fresque (tête vers +X, dos vers +Z). effort va de 0 (immobile) à 1 (pleine nage),
// turn est la vitesse de virage en rad/s (positive = vers la gauche), heading l'orientation
// actuelle (sert à garder le dos tourné vers le haut de l'écran).
export async function createTortue() {
  try {
    return await loadModel();
  } catch (err) {
    console.info('Pas de modèle 3D trouvé, tortue provisoire utilisée.', err?.message ?? '');
    return createPlaceholder();
  }
}

// Mouvements du corps communs aux deux tortues : inclinaison, roulis, ondulation.
function createPose(body) {
  let t = 0;
  let bank = 0;
  let effortSmooth = 0;
  let nose = 0;
  return (dt, effort, turn, heading, climb) => {
    effortSmooth += (effort - effortSmooth) * (1 - Math.exp(-dt * 3));
    t += dt * (1.2 + effortSmooth * 2.2);
    const targetBank = THREE.MathUtils.clamp(-turn * 0.12, -MAX_BANK, MAX_BANK);
    bank += (targetBank - bank) * (1 - Math.exp(-dt * 3));
    // Tête vers le visiteur quand elle s'approche, vers le mur quand elle s'éloigne
    const targetNose = THREE.MathUtils.clamp(-climb * 0.5, -MAX_NOSE, MAX_NOSE);
    nose += (targetNose - nose) * (1 - Math.exp(-dt * 3));

    // Vers la droite : bascule d'un côté ; vers la gauche : de l'autre ;
    // vers le haut ou le bas : vue de dos. Le dos reste ainsi toujours vers le haut.
    const tilt = -TILT_34 * Math.cos(heading);

    const stroke = Math.sin(t);
    body.rotation.set(
      tilt + bank + Math.sin(t * 0.5) * 0.04,
      TILT_PITCH + nose + stroke * (0.05 + effortSmooth * 0.1) - effortSmooth * 0.1,
      Math.sin(t * 0.7) * 0.06,
    );
    body.position.z = Math.sin(t + 0.6) * 0.008;
    return { t, effort: effortSmooth };
  };
}

async function loadModel() {
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  const model = gltf.scene;

  // Modèle à squelette : sa boîte englobante bouge avec l'animation, on évite
  // qu'il soit masqué à tort près des bords de l'écran.
  model.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });

  // Recentre et met à l'échelle, quelle que soit la taille d'origine
  // (les os doivent être positionnés avant de mesurer un modèle à squelette)
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);

  const fit = new THREE.Group();
  fit.scale.setScalar(LENGTH / Math.max(size.x, size.y, size.z));
  fit.rotation.copy(MODEL_ROTATION);
  fit.add(model);

  const root = new THREE.Group();
  const body = new THREE.Group();
  body.add(fit);
  root.add(body);
  const pose = createPose(body);

  // Joue l'animation de nage du modèle s'il en a une
  let mixer = null;
  if (gltf.animations.length) {
    mixer = new THREE.AnimationMixer(model);
    const clip = gltf.animations.find((c) => /swim|nage/i.test(c.name)) ?? gltf.animations[0];
    mixer.clipAction(clip).play();
  }

  return {
    root,
    update(dt, effort, turn = 0, heading = 0, climb = 0) {
      const p = pose(dt, effort, turn, heading, climb);
      if (mixer) {
        mixer.timeScale = 0.6 + p.effort * 1.0;
        mixer.update(dt);
      }
    },
  };
}

function createPlaceholder() {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const pose = createPose(body);

  const shellMat = new THREE.MeshStandardMaterial({ color: 0x6b5a2e, roughness: 0.6 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x8a9a5b, roughness: 0.8 });
  const sphere = new THREE.SphereGeometry(1, 24, 16);

  const shell = new THREE.Mesh(sphere, shellMat);
  shell.scale.set(0.09, 0.07, 0.03);
  body.add(shell);

  const head = new THREE.Mesh(sphere, skinMat);
  head.scale.set(0.032, 0.024, 0.018);
  head.position.set(0.11, 0, 0.005);
  body.add(head);

  // side = 1 à gauche, -1 à droite
  const flipper = (x, side, len, baseAngle) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, side * 0.05, 0);
    const mesh = new THREE.Mesh(sphere, skinMat);
    mesh.scale.set(len, len * 0.3, 0.006);
    mesh.position.set(-len * 0.4, side * len * 0.8, 0);
    mesh.rotation.z = side * 0.6;
    pivot.add(mesh);
    body.add(pivot);
    return { pivot, side, baseAngle };
  };

  const front = [flipper(0.04, 1, 0.065, 0.2), flipper(0.04, -1, 0.065, 0.2)];
  const back = [flipper(-0.06, 1, 0.032, -0.3), flipper(-0.06, -1, 0.032, -0.3)];

  return {
    root,
    update(dt, effort, turn = 0, heading = 0, climb = 0) {
      const { t, effort: e } = pose(dt, effort, turn, heading, climb);
      const amp = 0.25 + e * 0.45;
      for (const f of front) {
        f.pivot.rotation.z = f.side * (f.baseAngle + Math.sin(t) * amp);
        f.pivot.rotation.x = f.side * Math.cos(t) * 0.3;
      }
      for (const f of back) {
        f.pivot.rotation.z = f.side * (f.baseAngle + Math.sin(t + 1) * amp * 0.5);
      }
    },
  };
}
