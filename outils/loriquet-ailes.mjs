// Étape 2/3 de la préparation du loriquet : carte des ailes (attribut _WING, 0 = corps, 1 = aile).
// Étape 1 : npx obj2gltf -i models/originaux/12242_Australian_Rainbow_Lorikeet_v1_l3.obj -o lori-raw.glb
// Usage : node outils/loriquet-ailes.mjs lori-raw.glb lori.glb apercus/ '{"x0":0.45,"x1":0.8,"u0":0.15,"u1":0.45,"tTip0":-32,"tTip1":-24,"tSh0":10,"tSh1":16}'
// Dépendances : npm install @gltf-transform/core@4 @gltf-transform/extensions@4
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs';
const [,, src, dst, previewDir] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION');
const n = pos.getCount();
const P = []; for (let i = 0; i < n; i++) P.push(pos.getElement(i, []));
// Repère de l'oiseau (modèle Z vers le haut, tête vers +Y, penché à 45°)
const s = [0, Math.SQRT1_2, Math.SQRT1_2];      // queue → tête
const b = [0, -Math.SQRT1_2, Math.SQRT1_2];     // ventre → dos
const O = [0, -9.9, 1.65];                       // milieu du corps
const dot = (a, c) => a[0]*c[0] + a[1]*c[1] + a[2]*c[2];
const rel = p => [p[0]-O[0], p[1]-O[1], p[2]-O[2]];
const T = P.map(p => dot(rel(p), s)), U = P.map(p => dot(rel(p), b));
// demi-largeur et étendue dos/ventre par tranche le long du corps
const bins = 40, tmin = Math.min(...T), tmax = Math.max(...T);
const bi = t => Math.min(bins-1, Math.floor((t - tmin) / (tmax - tmin) * bins));
const hw = Array(bins).fill(0.01), umin = Array(bins).fill(1e9), umax = Array(bins).fill(-1e9);
for (let i = 0; i < n; i++) { const k = bi(T[i]); hw[k] = Math.max(hw[k], Math.abs(P[i][0])); umin[k] = Math.min(umin[k], U[i]); umax[k] = Math.max(umax[k], U[i]); }
console.log('t range', tmin.toFixed(1), tmax.toFixed(1));
for (let k = 0; k < bins; k += 2) console.log('t', (tmin + (k+.5)*(tmax-tmin)/bins).toFixed(1), 'hw', hw[k].toFixed(1), 'u', umin[k].toFixed(1), umax[k].toFixed(1));
if (process.argv[5] === 'stats') process.exit(0);
const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t*t*(3-2*t); };
const cfg = JSON.parse(process.argv[5]);
const W = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const k = bi(T[i]);
  const side = sm(cfg.x0, cfg.x1, Math.abs(P[i][0]) / hw[k]);                 // sur les flancs
  const uN = (U[i] - umin[k]) / Math.max(1e-3, umax[k] - umin[k]);             // 0 ventre … 1 dos
  const back = sm(cfg.u0, cfg.u1, uN);                                         // plutôt côté dos
  const along = sm(cfg.tTip0, cfg.tTip1, T[i]) * (1 - sm(cfg.tSh0, cfg.tSh1, T[i])); // entre pointe et épaule
  W[i] = side * back * along;
}
const acc = doc.createAccessor('aile').setType('SCALAR').setArray(W).setBuffer(doc.getRoot().listBuffers()[0]);
prim.setAttribute('_WING', acc);
await io.write(dst, doc);
// Aperçus : vue de dos (x, t) et de profil (u, t), couleur = poids
const svg = (name, fx, fy) => {
  const xs = P.map((p,i) => fx(i)), ys = P.map((p,i) => fy(i));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), sc = 8;
  const H = (y1-y0)*sc+20, Wd = H;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${H}" style="background:#fff">`;
  for (let i = 0; i < n; i += 2) {
    const c = `rgb(${Math.round(40+200*W[i])},${Math.round(90-40*W[i])},${Math.round(70-40*W[i])})`;
    out += `<circle cx="${((xs[i]-x0)*sc+10).toFixed(1)}" cy="${(H-((ys[i]-y0)*sc+10)).toFixed(1)}" r="1" fill="${c}" fill-opacity="0.5"/>`;
  }
  fs.writeFileSync(`${previewDir}/${name}.svg`, out + '</svg>');
};
svg('mask_dos', i => P[i][0], i => T[i]);
svg('mask_profil', i => U[i], i => T[i]);
console.log('wing vertices >0.5:', W.filter(w => w > 0.5).length, 'of', n);
