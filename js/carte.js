import * as L from 'leaflet';
import { EMPREINTES } from './empreintes.js';

// Carte « Où nous trouver » : les fresques du campus sur un fond OpenStreetMap.
const fresques = EMPREINTES.filter((e) => e.disponible && e.gps);
const itineraire = ([lat, lng]) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;

let carte = null;
const marqueurs = [];

// À appeler quand le bloc est visible (Leaflet a besoin de connaître sa taille)
export function afficherCarte(el, listeEl) {
  if (carte) {
    carte.invalidateSize();
    return;
  }
  const tactile = matchMedia('(pointer: coarse)').matches;
  carte = L.map(el, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,
    dragging: !tactile,   // au doigt, on laisse la page défiler ; zoom avec + / −
    tap: false,
  });
  // Vue satellite Esri (gratuite, crédit obligatoire)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 19,
    maxZoom: 20,
    attribution: 'Imagerie © Esri, Maxar, Earthstar Geographics',
  }).addTo(carte);

  fresques.forEach((e, i) => {
    const icone = L.divIcon({ className: 'repere', html: `<span>${i + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
    const m = L.marker(e.gps, { icon: icone, title: e.fresque }).addTo(carte);
    m.bindPopup(`<strong>${e.fresque}</strong><br>${e.lieu}<br><a href="${itineraire(e.gps)}" target="_blank" rel="noopener">Itinéraire</a>`);
    marqueurs.push(m);
  });
  carte.fitBounds(L.latLngBounds(fresques.map((e) => e.gps)), { padding: [40, 40], maxZoom: 18 });

  // Liste sous la carte : toucher une ligne centre la carte sur la fresque
  listeEl.innerHTML = fresques.map((e, i) => `
    <li class="lieu-ligne" data-i="${i}">
      <span class="repere-mini">${i + 1}</span>
      <img src="${e.vignette}" alt="">
      <div><strong>${e.fresque}</strong><span>${e.lieu}</span></div>
      <a class="rond noir petit-rond" href="${itineraire(e.gps)}" target="_blank" rel="noopener" aria-label="Itinéraire vers ${e.fresque}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
      </a>
    </li>`).join('');
  listeEl.addEventListener('click', (ev) => {
    if (ev.target.closest('a')) return;
    const li = ev.target.closest('[data-i]');
    if (!li) return;
    const m = marqueurs[+li.dataset.i];
    carte.setView(m.getLatLng(), 19, { animate: true });
    m.openPopup();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
