/* Spire Muses — recursos, sonido sintetizado y música. */
(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const SM = (root.SM = root.SM || {});

  // En la versión de un solo archivo, SM_ASSETS mapea ruta -> data URI.
  SM.asset = (p) => (root.SM_ASSETS && root.SM_ASSETS[p]) || ('assets/' + p);
  // Safari/iOS antiguos no leen .ogg: se usa .m4a (AAC) si el navegador no soporta Vorbis.
  const _au = typeof Audio !== 'undefined' ? new Audio() : null;
  SM.musicExt = !root.SM_ASSETS && _au && !_au.canPlayType('audio/ogg; codecs="vorbis"') && _au.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? 'm4a' : 'ogg';
  SM.hasAsset = (p) => (root.SM_ASSETS ? !!root.SM_ASSETS[p] : root.SM_FILES ? root.SM_FILES.includes(p) : true);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('sm_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sm_' + k, JSON.stringify(v)); } catch (e) {} },
  };
  SM.store = store;
  SM.settings = { music: store.get('music', 0.5), sfx: store.get('sfx', 0.7), confirm: store.get('confirm', true), fast: store.get('fast', false) };
  SM.saveSettings = () => { for (const k in SM.settings) store.set(k, SM.settings[k]); };

  /* ---------- Efectos ---------- */
  let ctx = null, master = null;
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.connect(ctx.destination); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f0, f1, dur, type, vol, delay) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((vol || 0.3) * SM.settings.sfx, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, hp, delay) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + (delay || 0);
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = a.createBufferSource(); s.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 800;
    const g = a.createGain(); g.gain.value = (vol || 0.3) * SM.settings.sfx;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  const SFX = {
    click: () => tone(520, 700, 0.07, 'triangle', 0.18),
    select: () => tone(380, 520, 0.08, 'sine', 0.2),
    card: () => { noise(0.12, 0.25, 1500); tone(300, 180, 0.1, 'triangle', 0.15); },
    hit: () => { noise(0.18, 0.5, 400); tone(160, 60, 0.18, 'square', 0.25); },
    bigHit: () => { noise(0.3, 0.6, 200); tone(110, 40, 0.3, 'sawtooth', 0.3); },
    hurt: () => { noise(0.2, 0.4, 300); tone(200, 80, 0.25, 'sawtooth', 0.25); },
    block: () => { tone(900, 500, 0.12, 'square', 0.15); tone(1300, 800, 0.1, 'triangle', 0.1, 0.03); },
    heal: () => { tone(500, 800, 0.15, 'sine', 0.2); tone(750, 1100, 0.2, 'sine', 0.15, 0.08); },
    buff: () => { tone(400, 800, 0.25, 'triangle', 0.2); tone(600, 1200, 0.25, 'sine', 0.12, 0.05); },
    debuff: () => { tone(500, 200, 0.3, 'sawtooth', 0.15); },
    die: () => { noise(0.4, 0.5, 200); tone(200, 40, 0.5, 'sawtooth', 0.3); },
    end: () => { tone(300, 220, 0.18, 'triangle', 0.2); },
    coin: () => { tone(1200, 1600, 0.08, 'square', 0.12); tone(1600, 2000, 0.12, 'square', 0.1, 0.07); },
    win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.25, 'triangle', 0.22, i * 0.12)); },
    lose: () => { [400, 330, 260, 180].forEach((f, i) => tone(f, f * 0.9, 0.4, 'sawtooth', 0.2, i * 0.2)); },
    potion: () => { tone(300, 900, 0.3, 'sine', 0.2); noise(0.15, 0.15, 3000, 0.1); },
    error: () => tone(160, 120, 0.15, 'square', 0.15),
    fire: () => { noise(0.35, 0.4, 600); tone(120, 300, 0.3, 'sawtooth', 0.15); },
    poison: () => { tone(220, 330, 0.25, 'sawtooth', 0.12); noise(0.2, 0.15, 2500); },
  };
  SM.sfx = (n) => { try { if (SFX[n]) SFX[n](); } catch (e) {} };

  /* ---------- Música ---------- */
  let curName = '';
  const ZONE = ['underdocks', 'overgrowth', 'hive'];
  // devuelve { list, random }: si random, se elige al azar entre las pistas disponibles
  function candidates(kind, act, extra) {
    const z = ZONE[(act || 1) - 1];
    switch (kind) {
      case 'menu': return { list: ['menu_' + (extra || ''), 'glory_explore', 'explore'], random: false };
      case 'map': return { list: [z + '_explore', 'travel1', 'travel2', 'explore'], random: true };
      case 'combat': return { list: extra ? ['nightmare', z + '_combat', z + '_combat2', 'combat'] : [z + '_combat', z + '_combat2', 'combat'], random: true };
      case 'elite': return { list: ['combat', z + '_combat2', z + '_combat', 'boss'], random: true };
      case 'boss': return { list: ['boss_' + z, 'boss', z + '_combat2'], random: false };
      case 'event': return { list: ['event', z + '_explore', 'explore'], random: false };
      case 'shop': return { list: ['shop', z + '_explore', 'explore'], random: false };
      case 'rest': return { list: ['rest', z + '_explore', 'explore'], random: false };
      case 'ending': return { list: ['ending', 'glory_explore', 'explore'], random: false };
      case 'victory': return { list: ['glory_combat', 'glory_explore', 'explore'], random: false };
      case 'nightmare': return { list: ['nightmare', 'boss'], random: false };
      default: return { list: ['explore'], random: false };
    }
  }
  /* Reproductor con bucle suave: antes de que acabe la pista, la misma pista vuelve a entrar
     con un fundido cruzado (saltando la introducción), así no hay cortes ni silencios. */
  const XF = 7;                 // segundos de fundido cruzado
  const players = []; SM._players = players;           // { a, vol, goal, rate, name, kind, looped }
  let ticker = null;
  function startTicker() {
    if (ticker) return;
    ticker = setInterval(() => {
      const dt = 0.05;
      for (let i = players.length - 1; i >= 0; i--) {
        const p = players[i];
        if (p.vol < p.goal) p.vol = Math.min(p.goal, p.vol + p.rate * dt);
        else if (p.vol > p.goal) p.vol = Math.max(p.goal, p.vol - p.rate * dt);
        p.a.volume = Math.max(0, Math.min(1, p.vol * SM.settings.music));
        if (p.goal === 0 && p.vol <= 0.001) { try { p.a.pause(); } catch (e) {} players.splice(i, 1); continue; }
        // ¿se acerca el final de la pista que suena? entra la siguiente vuelta
        const d = p.a.duration;
        if (p.goal > 0 && !p.next && isFinite(d) && d > XF * 2.5 && d - p.a.currentTime <= XF) {
          p.next = true;
          const start = Math.min(d * 0.1, 14);       // se salta la introducción en las vueltas siguientes
          spawn(p.name, XF, start, p);
          p.goal = 0; p.rate = 1 / XF;
        }
      }
      if (!players.length) { clearInterval(ticker); ticker = null; }
    }, 50);
  }
  function spawn(name, fadeSecs, startAt, from) {
    const a = new Audio(SM.asset('music/' + name + '.' + SM.musicExt));
    a.loop = false; a.volume = 0;
    const p = { a, vol: 0, goal: 1, rate: 1 / fadeSecs, name };
    a.addEventListener('loadedmetadata', () => { if (startAt) { try { a.currentTime = startAt; } catch (e) {} } });
    a.addEventListener('ended', () => { if (players.includes(p) && p.goal > 0 && !p.next) { p.next = true; spawn(name, 0.5, 0, p); } });
    const pr = a.play(); if (pr && pr.catch) pr.catch(() => { SM._pendingMusic = SM._lastReq; curName = ''; players.splice(players.indexOf(p), 1); });
    players.push(p); startTicker();
    return p;
  }
  SM.music = function (kind, act, extra) {
    const c = candidates(kind, act, extra);
    const avail = c.list.filter((n) => SM.hasAsset('music/' + n + '.ogg'));
    if (!avail.length) return;
    SM._lastReq = [kind, act, extra];
    let name;
    if (c.random) {
      let pool = avail.filter((n) => n !== curName && n !== SM._lastTrack);
      if (!pool.length) pool = avail;
      name = pool[Math.floor(Math.random() * pool.length)];
    } else name = avail[0];
    if (name === curName) return;
    SM._lastTrack = curName; curName = name;
    for (const p of players) { p.goal = 0; p.rate = 1 / 1.6; p.next = true; }   // lo anterior se desvanece
    spawn(name, 1.8, 0);
  };
  SM.applyMusicVolume = () => { for (const p of players) p.a.volume = Math.max(0, Math.min(1, p.vol * SM.settings.music)); };
  SM.unlockAudio = () => { ac(); if (SM._pendingMusic) { const [k, a, x] = SM._pendingMusic; SM._pendingMusic = null; SM.music(k, a, x); } };
})();
