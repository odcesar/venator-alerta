// Widget do StreamElements: toca o alerta do Venator a cada novo inscrito (e a cada "Emulate" de inscrito no painel).
window.VENATOR_BASE = 'https://odcesar.github.io/venator-alerta/';
let mostrarNome = true;
window.addEventListener('onWidgetLoad', (obj) => {
  const f = obj.detail.fieldData || {};
  window.VENATOR_VOLUME = (f.volume ?? 80) / 100;
  mostrarNome = f.mostrarNome !== false;
  const s = document.createElement('script'); s.src = window.VENATOR_BASE + 'alerta.js'; document.head.appendChild(s);
});
window.addEventListener('onEventReceived', (obj) => {
  const d = obj.detail || {};
  if (d.listener !== 'subscriber-latest') return;
  const nome = mostrarNome ? (d.event && (d.event.displayName || d.event.name)) : '';
  if (window.VenatorAlerta) window.VenatorAlerta.tocar({ nome });
});
