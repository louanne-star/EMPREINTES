// Joystick rond, analogique et tactile (+ flèches du clavier pour tester sur PC).
const DEADZONE = 0.12;

export function createControls(el) {
  const knob = el.querySelector('.knob');
  const stick = { x: 0, y: 0 };
  let pointerId = null;

  function move(e) {
    const r = el.getBoundingClientRect();
    const max = (r.width - knob.offsetWidth) / 2; // course maximale du bouton
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > max) { dx *= max / len; dy *= max / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    stick.x = dx / max;
    stick.y = -dy / max; // vers le haut de l'écran = vers le haut de la fresque
  }

  function release(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    stick.x = stick.y = 0;
    knob.style.transform = '';
    el.classList.remove('on');
  }

  el.addEventListener('pointerdown', (e) => {
    if (pointerId !== null) return;
    e.preventDefault();
    pointerId = e.pointerId;
    el.setPointerCapture(e.pointerId);
    el.classList.add('on');
    move(e);
  });
  el.addEventListener('pointermove', (e) => { if (e.pointerId === pointerId) move(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => el.addEventListener(t, release));

  const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
  const pressed = new Set();
  window.addEventListener('keydown', (e) => {
    if (keys[e.key]) { pressed.add(keys[e.key]); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (keys[e.key]) pressed.delete(keys[e.key]);
  });

  return {
    // Direction voulue dans le plan de la fresque, longueur de 0 à 1
    read(out) {
      if (pressed.size) {
        out.set(pressed.has('right') - pressed.has('left'), pressed.has('up') - pressed.has('down'));
        if (out.lengthSq() > 1) out.normalize();
        return out;
      }
      out.set(stick.x, stick.y);
      const len = out.length();
      if (len < DEADZONE) return out.set(0, 0);
      return out.multiplyScalar(Math.min((len - DEADZONE) / (1 - DEADZONE), 1) / len);
    },
    show() { el.hidden = false; },
    hide() {
      el.hidden = true;
      pressed.clear();
      if (pointerId !== null) release({ pointerId });
    },
  };
}
