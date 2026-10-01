import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Modèle « Water Molecule ball-and-stick model » par borkia sur Sketchfab,
// licence CC-BY-SA 4.0 (crédit obligatoire). Sans ce fichier : gélule dessinée en code.
const MODEL_URL = './models/molecule.glb';
const SIZE = 0.045; // en largeurs de fresque
const HOVER_Z = 0.08;

function haloTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

async function loadModel() {
  const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  const model = gltf.scene;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(box.getCenter(new THREE.Vector3()));
  const fit = new THREE.Group();
  fit.scale.setScalar(SIZE / Math.max(size.x, size.y, size.z));
  fit.add(model);
  return fit;
}

function createCapsule(color) {
  const capsule = new THREE.Group();
  const geo = new THREE.CapsuleGeometry(0.016, 0.03, 8, 16);
  const tint = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.25,
  });
  const pearl = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2, metalness: 0.2, roughness: 0.2,
  });
  // Deux moitiés de couleurs différentes, comme une vraie gélule
  const top = new THREE.Mesh(geo, tint);
  const bottom = new THREE.Mesh(geo, pearl);
  top.scale.y = bottom.scale.y = 0.5;
  top.position.y = 0.0155;
  bottom.position.y = -0.0155;
  capsule.add(top, bottom);
  return capsule;
}

// L'Empreinte : la molécule qui tourne sur elle-même, entourée d'un halo.
// Elle reste à sa place : c'est au joueur d'aller la chercher.
export async function createGelule(color) {
  const root = new THREE.Group();
  let shape;
  try {
    shape = await loadModel();
  } catch (err) {
    console.info('Pas de modèle de molécule trouvé, gélule dessinée en code.', err?.message ?? '');
    shape = createCapsule(color);
  }
  const spinner = new THREE.Group();
  spinner.add(shape);
  root.add(spinner);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTexture(), color, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  root.add(halo);

  let t = 0;
  return {
    root,
    depth: HOVER_Z, // distance au mur, réglée par le jeu
    // excite de 0 à 1 : la molécule s'emballe quand on l'attrape
    update(dt, excite = 0) {
      t += dt;
      spinner.rotation.y += dt * (1.2 + excite * 10);
      spinner.rotation.x = Math.sin(t * 0.8) * 0.4;
      root.position.z = this.depth + Math.sin(t * 2) * 0.008 + excite * 0.12;
      halo.scale.setScalar(0.075 + Math.sin(t * 3) * 0.01 + excite * 0.06);
    },
  };
}
