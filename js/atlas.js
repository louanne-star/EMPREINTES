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
  // Renvoie true si l'Empreinte est nouvelle
  add(id) {
    if (collected.includes(id)) return false;
    collected = [...collected, id];
    save(collected);
    return true;
  },
};

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

function slot(e) {
  if (!e.disponible) {
    return `
      <li class="slot soon">
        <span class="capsule" style="--c:#555"></span>
        <div><strong>Fresque à venir</strong><small>${e.fresque}</small></div>
      </li>`;
  }
  if (!atlas.has(e.id)) {
    return `
      <li class="slot locked">
        <span class="capsule" style="--c:#555"></span>
        <div><strong>???</strong><small>${e.fresque} · à trouver</small></div>
      </li>`;
  }
  return `
    <li class="slot ok">
      <span class="capsule" style="--c:${hex(e.couleur)}"></span>
      <div>
        <strong>${e.nom}</strong>
        <small>${e.fresque} · ${e.molecule} · ${e.fonction}</small>
        ${e.dessin ? `<figure class="dessin"><img src="${e.dessin}" alt="Formule : ${e.molecule}"><figcaption>${e.legende}</figcaption></figure>` : ''}
        <p>« ${e.voix} »</p>
      </div>
    </li>`;
}

export function renderAtlas(listEl, footerEl, finalEl) {
  listEl.innerHTML = EMPREINTES.map(slot).join('');
  footerEl.textContent = `${atlas.count()} / ${atlas.total()} Empreintes collectées`;
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
