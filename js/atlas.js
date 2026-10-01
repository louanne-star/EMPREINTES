import { EMPREINTES, MESSAGE_FINAL } from './empreintes.js';

// Collection du visiteur, gardée dans le navigateur (prototype).
const KEY = 'empreintes.atlas.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* stockage indisponible */ }
}

let collected = load();

// Seules les fresques déjà peintes comptent pour compléter l'Atlas
const disponibles = EMPREINTES.filter((e) => e.disponible);

export const atlas = {
  has: (id) => collected.includes(id),
  count: () => disponibles.filter((e) => collected.includes(e.id)).length,
  total: () => disponibles.length,
  complete: () => atlas.count() === atlas.total(),
  score: () => `${atlas.count()}/${atlas.total()}`,
  // Renvoie true si l'Empreinte est nouvelle
  add(id) {
    if (collected.includes(id)) return false;
    collected = [...collected, id];
    save(collected);
    return true;
  },
};

// Cartes photo des fresques sur l'accueil
export function renderCartes(el) {
  el.innerHTML = disponibles.map((e) => `
    <article class="carte">
      <img src="${e.vignette}" alt="Fresque ${e.fresque}" loading="lazy">
      <div class="carte-info">
        ${atlas.has(e.id) ? '<em class="badge">✓ Trouvée</em>' : ''}
        <strong>${e.fresque}</strong>
        <span>${capitale(e.personnage)} · ${e.molecule}</span>
      </div>
    </article>`).join('');
}

const capitale = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function fiche(e) {
  if (!e.disponible) {
    return `
      <li class="fiche soon">
        <strong>Fresque à venir</strong>
        ${e.fresque} · ${capitale(e.personnage)}
      </li>`;
  }
  const photo = `
    <div class="fiche-photo">
      <img src="${e.vignette}" alt="" loading="lazy">
      <div><strong>${atlas.has(e.id) ? e.nom : 'À trouver'}</strong><span>${e.fresque}</span></div>
    </div>`;
  if (!atlas.has(e.id)) return `<li class="fiche locked">${photo}</li>`;
  return `
    <li class="fiche">
      ${photo}
      <div class="stats">
        <div><span>Molécule</span><strong>${e.molecule}</strong></div>
        <div><span>Fonction</span><strong>${e.fonction}</strong></div>
        <div><span>Espèce</span><strong>${capitale(e.personnage.replace(/^(le|la|l')\s?/i, ''))}</strong></div>
      </div>
      ${e.dessin ? `<figure class="dessin"><img src="${e.dessin}" alt="Formule : ${e.molecule}"><figcaption>${e.legende}</figcaption></figure>` : ''}
      <p class="voix">« ${e.voix} »</p>
      <button class="pilule" data-ecouter="${e.id}">🔊 Écouter</button>
    </li>`;
}

export function renderAtlas(listEl, statsEl, finalEl) {
  listEl.innerHTML = EMPREINTES.map(fiche).join('');
  const aVenir = EMPREINTES.length - disponibles.length;
  statsEl.innerHTML = `
    <div><span>Empreintes</span><strong>${atlas.score()}</strong></div>
    <div><span>Fresques</span><strong>${disponibles.length}</strong></div>
    <div><span>À venir</span><strong>${aVenir}</strong></div>`;
  renderFinal(finalEl);
}

// Le message collectif, affiché seulement quand l'Atlas est complet
export function renderFinal(el) {
  el.hidden = !atlas.complete();
  el.innerHTML = `
    <h3>${MESSAGE_FINAL.titre}</h3>
    <p class="voix">« ${MESSAGE_FINAL.texte} »</p>
    <p class="fait">${MESSAGE_FINAL.suite}</p>`;
}
