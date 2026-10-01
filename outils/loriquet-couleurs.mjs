// Étape 3/3 : couleurs provisoires par zone (COLOR_0), en attendant la texture du modèle.
// Usage : node outils/loriquet-couleurs.mjs lori.glb models/loriquet.glb
// Quand la texture (.mtl + image) sera disponible : refaire l'étape 1 avec, puis l'étape 2, et sauter celle-ci.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [,, src, dst] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
const prim = doc.getRoot().listMeshes()[0].listPrimitives()[0];
const pos = prim.getAttribute('POSITION'), n = pos.getCount();
const s = [0, Math.SQRT1_2, Math.SQRT1_2], b = [0, -Math.SQRT1_2, Math.SQRT1_2], O = [0, -9.9, 1.65];
const dot = (a, c) => a[0]*c[0] + a[1]*c[1] + a[2]*c[2];
const lin = h => [0,2,4].map(i => { const c = parseInt(h.slice(1+i, 3+i), 16) / 255; return c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055) ** 2.4; });
const C = { tete: lin('#2a4fb8'), bec: lin('#e2461f'), col: lin('#b8d433'), poitrine: lin('#f07a16'),
            ventre: lin('#23307a'), dos: lin('#2f9a46'), pattes: lin('#7d7f86') };
const mix = (a, c, k) => a.map((x, i) => x + (c[i] - x) * k);
const cols = new Float32Array(n * 4);
for (let i = 0; i < n; i++) {
  const p = pos.getElement(i, []), r = [p[0]-O[0], p[1]-O[1], p[2]-O[2]];
  const t = dot(r, s), u = dot(r, b);
  let c;
  if (t > 28 && u < -0.8) c = C.bec;                       // bec, à l'avant de la tête
  else if (t > 21) c = C.tete;
  else if (t > 17.5) c = C.col;                           // collier
  else if (u < -4.5 && t > -2) c = C.pattes;              // pattes, côté ventre
  else if (u < 2.5 && t > 2) c = mix(C.poitrine, C.dos, Math.min(1, Math.max(0, (u - 0) / 2.5)));
  else if (u < 2.5 && t > -12) c = C.ventre;
  else c = C.dos;                                         // dos, ailes, queue
  cols.set([...c, 1], i * 4);
}
prim.setAttribute('COLOR_0', doc.createAccessor('couleurs').setType('VEC4').setArray(cols).setBuffer(doc.getRoot().listBuffers()[0]));
prim.getMaterial().setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.7).setMetallicFactor(0);
await io.write(dst, doc);
console.log('ok');
