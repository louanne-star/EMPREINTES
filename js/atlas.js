import { EMPREINTES } from './empreintes.js';

// Collection du visiteur, gardée dans le navigateur (prototype).
const KEY = 'empreintes.atlas.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* stockage indisponible */ }
}

let collected = load();

export const atlas = {
  has: (id) => collected.includes(id),
  count: () => collected.length,
  total: () => EMPREINTES.length,
  // Renvoie true si l'Empreinte est nouvelle
  add(id) {
    if (collected.includes(id)) return false;
    collected = [...collected, id];
    save(collected);
    return true;
  },
};

const hex = (n) => '#' + n.toString(16).padStart(6, '0');

export function renderAtlas(listEl, footerEl) {
  listEl.innerHTML = EMPREINTES.map((e) => {
    const ok = atlas.has(e.id);
    return `
      <li class="slot ${ok ? 'ok' : 'locked'}">
        <span class="capsule" style="--c:${ok ? hex(e.couleur) : '#555'}"></span>
        <div>
          <strong>${ok ? e.nom : '???'}</strong>
          <small>${e.fresque}${ok ? ` · ${e.molecule} · ${e.fonction}` : ''}</small>
          ${ok ? `<p>« ${e.voix} »</p>` : ''}
        </div>
      </li>`;
  }).join('');

  footerEl.textContent = atlas.count() === atlas.total()
    ? "Atlas complet : la mémoire vivante du monde calédonien est sauvée."
    : `${atlas.count()} / ${atlas.total()} Empreintes collectées`;
}
