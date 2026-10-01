// Génère les formules des molécules (molecules/*.svg) à partir de leur notation SMILES.
// Usage : npm install smiles-drawer@2.1.7 jsdom   puis   node outils/dessiner-molecules.js molecules
const { JSDOM } = require('jsdom');
const fs = require('fs');
const dom = new JSDOM('<!DOCTYPE html><body></body>');
global.window = dom.window; global.document = dom.window.document;
global.navigator = dom.window.navigator; global.XMLSerializer = dom.window.XMLSerializer;
// Mesure du texte approximative (pas de canvas hors navigateur)
dom.window.HTMLCanvasElement.prototype.getContext = function () {
  let size = 10;
  return {
    set font(f) { size = parseFloat(f) * 1.33; }, get font() { return ''; },
    measureText: (t) => ({ width: t.length * size * 0.6, actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: t.length * size * 0.6, actualBoundingBoxAscent: size * 0.7 }),
  };
};
const SmilesDrawer = require('smiles-drawer');
const out = process.argv[2];
// Couleurs des atomes, accordées au thème clair de l'app
const THEME = {
  C: '#1f2a24', O: '#b23a2b', N: '#1f5c8a', F: '#1f2a24', CL: '#1f2a24', BR: '#1f2a24', I: '#1f2a24',
  P: '#8b5a2b', S: '#a0761a', B: '#1f2a24', SI: '#1f2a24', H: '#5e6b63', BACKGROUND: '#ffffff',
};
const mols = {
  carapace: 'NC(CSSCC(C(=O)O)N)C(=O)O',
  petale: 'OC1=CC(O)=C2C=C(O)C(=[O+]C2=C1)C1=CC(O)=C(O)C=C1',
  plume: 'OC(=O)C1=CC2=CC(O)=C(O)C=C2N1',
  armure: 'CC(=O)NC1C(O)C(O)C(CO)OC1O',
};
for (const [id, smi] of Object.entries(mols)) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.appendChild(svg);
  const drawer = new SmilesDrawer.SvgDrawer({ width: 320, height: 220, bondThickness: 1.4, padding: 12, themes: { empreintes: THEME } });
  SmilesDrawer.parse(smi, (tree) => {
    drawer.draw(tree, svg, 'empreintes');
    // Marge autour du dessin pour ne pas couper les étiquettes (OH, COOH…)
    const [x, y, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    const m = 28;
    svg.setAttribute('viewBox', `${x - m} ${y - m} ${w + 2 * m} ${h + 2 * m}`);
    fs.writeFileSync(`${out}/${id}.svg`, new XMLSerializer().serializeToString(svg));
    console.log('ok', id);
  }, (err) => console.log('ERR', id, err));
}
