// Étape 3/3 de la préparation du loriquet : corrige le matériau issu du .mtl.
// Usage : node outils/loriquet-finir.mjs lori.glb models/loriquet.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [,, src, dst] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
// Le .mtl d'origine déclare « Ke 1 1 1 » (émission blanche) : l'oiseau serait tout blanc
for (const m of doc.getRoot().listMaterials()) m.setEmissiveFactor([0, 0, 0]).setRoughnessFactor(0.75).setMetallicFactor(0);
await io.write(dst, doc);
console.log('ok');
