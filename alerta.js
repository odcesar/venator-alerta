// Alerta de inscrito do Venator: knockback com fogo, som do Gutshot sincronizado e uma fala do Ira Domini sorteada,
// com a legenda em português. Usado pela página do OBS (index.html) e pelo widget do StreamElements.
(function () {
  const BASE = window.VENATOR_BASE ? window.VENATOR_BASE.replace(/\/?$/, '/') : '';   // sem base: caminhos relativos à página
  const FPS = 30, QUADRO_TIRO = 15;                 // tempos.json do render: o clarão acende no quadro 15
  const T_TIRO = (QUADRO_TIRO - 1) / FPS;           // 0,467 s
  const T_ENGATILHA = Math.max(0, T_TIRO - 0.36);   // "Delay": o engatilhar toca um pouco antes do disparo
  const T_FALA = T_TIRO + 0.55;                     // a fala entra depois do estampido

  const FALAS = [
    { arq: 'priest_use_power4_01.mp3', pt: 'Um pastor protege o rebanho.' },
    { arq: 'priest_use_power4_02.mp3', pt: 'O mal morre hoje.' },
    { arq: 'priest_use_power4_03.mp3', pt: 'Em nome do Pai, do Filho e do Espírito Santo.' },
    { arq: 'priest_use_power4_04.mp3', pt: 'Eu sou a ira do Senhor.' },
    { arq: 'priest_use_power4_05.mp3', pt: 'Senhor, protegei-me enquanto mato os ímpios.' },
    { arq: 'priest_use_power4_06.mp3', pt: 'Eles vão aprender a me temer.' },
    { arq: 'priest_use_power4_07.mp3', pt: 'Podem correr, mas só vão adiar o inevitável.' },
    { arq: 'priest_use_power4_08.mp3', pt: 'Hora de acabar com essa existência miserável!' },
    { arq: 'priest_use_power4_09.mp3', pt: 'Um Venator não negocia misericórdia.' },
    { arq: 'priest_use_power4_10.mp3', pt: 'A ira vem atrás deles.' },
  ];
  const ENGATILHA = ['priest_a2_gutshot_cock_01.mp3', 'priest_a2_gutshot_cock_02.mp3', 'priest_a2_gutshot_cock_03.mp3'];
  const TIRO = ['priest_a2_gutshot_fire_01.mp3', 'priest_a2_gutshot_fire_02.mp3', 'priest_a2_gutshot_fire_03.mp3'];

  const FUNDO = 'priest_witching_hour_blessed_lp_01.mp3', FUNDO_VOL = 0.45;   // volume do fundo em relação ao resto
  const sorteia = (l) => l[Math.floor(Math.random() * l.length)];
  let ultima = -1;
  function sorteiaFala() {            // nunca repete a mesma fala duas vezes seguidas
    let i; do { i = Math.floor(Math.random() * FALAS.length); } while (FALAS.length > 1 && i === ultima);
    ultima = i; return FALAS[i];
  }
  function som(arq, vol) {
    const a = new Audio(BASE + 'audio/' + arq); a.volume = vol; a.preload = 'auto'; return a;
  }
  // pré-carrega tudo para o primeiro alerta já sair sincronizado
  [...FALAS.map((f) => f.arq), ...ENGATILHA, ...TIRO, FUNDO].forEach((n) => { const a = som(n, 0); a.load(); });

  const fila = []; let tocando = false;

  function tocar(opcoes = {}) {
    fila.push(opcoes); if (!tocando) proximo();
  }

  function proximo() {
    const op = fila.shift(); if (!op) { tocando = false; return; }
    tocando = true;
    const vol = Math.min(1, Math.max(0, op.volume ?? window.VENATOR_VOLUME ?? 0.8));
    const raiz = document.getElementById('venator-alerta');
    const video = raiz.querySelector('video');
    const legenda = raiz.querySelector('.legenda');
    const nome = raiz.querySelector('.nome');
    const fala = sorteiaFala();
    const sEng = som(sorteia(ENGATILHA), vol), sTiro = som(sorteia(TIRO), vol), sFala = som(fala.arq, vol);
    legenda.textContent = fala.pt; legenda.classList.remove('mostra');
    nome.textContent = op.nome ? op.nome : ''; nome.classList.toggle('vazio', !op.nome);
    video.pause(); video.currentTime = 0;
    raiz.classList.add('ativo');
    const timers = [];
    const em = (s, fn) => timers.push(setTimeout(fn, s * 1000));
    video.play().catch(() => {});
    // fundo: Blessed Loop do jogo (priest_witching_hour_blessed_lp_01), entra em fade e fica abaixo da fala e do tiro
    const fundo = som(FUNDO, 0); fundo.loop = true; fundo.play().catch(() => {});
    const alvoFundo = vol * FUNDO_VOL;
    const rampa = (de, ate, ms, depois) => {
      const t0 = performance.now();
      const passo = () => {
        const k = Math.min(1, (performance.now() - t0) / ms); fundo.volume = de + (ate - de) * k;
        if (k < 1) setTimeout(passo, 30); else if (depois) depois();
      };
      passo();
    };
    rampa(0, alvoFundo, 400);
    em(T_ENGATILHA, () => sEng.play().catch(() => {}));
    em(T_TIRO, () => sTiro.play().catch(() => {}));
    em(T_FALA, () => {
      legenda.classList.add('mostra');
      sFala.play().catch(() => {});
    });
    const fim = () => {
      legenda.classList.remove('mostra');
      rampa(fundo.volume, 0, 900, () => fundo.pause());
      setTimeout(() => {
        raiz.classList.remove('ativo');
        setTimeout(() => { timers.forEach(clearTimeout); proximo(); }, 600);
      }, 350);
    };
    // termina quando a fala acaba (ou pelo menos quando o vídeo acaba)
    let falaAcabou = false, videoAcabou = false;
    const confere = () => { if (falaAcabou && videoAcabou) setTimeout(fim, 500); };
    sFala.addEventListener('ended', () => { falaAcabou = true; confere(); }, { once: true });
    sFala.addEventListener('error', () => { falaAcabou = true; confere(); }, { once: true });
    video.addEventListener('ended', () => { videoAcabou = true; confere(); }, { once: true });
    em(9, () => { falaAcabou = videoAcabou = true; confere(); });   // trava de segurança
  }

  window.VenatorAlerta = { tocar, FALAS };
})();
