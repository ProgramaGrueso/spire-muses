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
  function limiter(a) {   // evita saturar al subir el volumen
    const l = a.createDynamicsCompressor();
    l.threshold.value = -4; l.knee.value = 0; l.ratio.value = 20; l.attack.value = 0.003; l.release.value = 0.15;
    l.connect(a.destination); return l;
  }
  /* Si el navegador suspende el audio (autoplay, pestaña en segundo plano, interrupción), se avisa y se reanuda con el siguiente toque. */
  function onCtxState() {
    let tip = document.getElementById('audiotip');
    if (ctx && ctx.state === 'running') { if (tip) tip.remove(); return; }
    if (!SM._lastReq || tip || !document.body) return;
    tip = document.createElement('div'); tip.id = 'audiotip';
    tip.textContent = '🔇 Toca la pantalla para activar el sonido';
    tip.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);background:#000c;color:#ffd24a;border:1px solid #ffd24a88;border-radius:20px;padding:8px 16px;font:600 14px sans-serif;z-index:9998;pointer-events:none';
    document.body.appendChild(tip);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ac(); });
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 1.8; master.connect(limiter(ctx)); ctx.onstatechange = onCtxState; } catch (e) { return null; }
    }
    if (ctx.state !== 'running') { try { const r = ctx.resume(); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
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
  /* Música en streaming: cada pista es un <audio> (el navegador la descarga y decodifica poco a poco, sin cargar
     la canción entera en memoria) conectado al reloj de Web Audio para subir el volumen con un limitador.
     Antes de que acabe la pista, la misma pista vuelve a entrar con un fundido cruzado (saltando la introducción). */
  const XF = 7;                 // segundos de fundido cruzado
  const players = []; SM._players = players;           // { a, g, vol, goal, rate, name }
  let ticker = null, lastTick = 0, bus = null;
  const musicLevel = () => SM.settings.music * 2.5;
  function waBus() {
    const a = ac(); if (!a) return null;
    if (!bus) { bus = a.createGain(); bus.connect(limiter(a)); }
    bus.gain.value = musicLevel();
    return bus;
  }
  const trackGain = (name) => Math.max(0.5, Math.min(4, (root.SM_GAINS && root.SM_GAINS[name]) || 1));
  function applyVol(p) {
    const v = Math.max(0, p.vol);
    if (p.g) p.g.gain.value = v * trackGain(p.name);
    else p.a.volume = Math.max(0, Math.min(1, v * SM.settings.music));
  }
  function killPlayer(p) {
    try { p.a.pause(); p.a.removeAttribute('src'); p.a.load(); } catch (e) {}
    try { if (p.src) p.src.disconnect(); if (p.g) p.g.disconnect(); } catch (e) {}
  }
  function startTicker() {
    if (ticker) return;
    ticker = setInterval(() => {
      if (!ticker) return;
      const now = performance.now(), dt = Math.min(1, (now - (lastTick || now)) / 1000 || 0.05); lastTick = now;
      for (let i = players.length - 1; i >= 0; i--) {
        const p = players[i];
        if (p.vol < p.goal) p.vol = Math.min(p.goal, p.vol + p.rate * dt);
        else if (p.vol > p.goal) p.vol = Math.max(p.goal, p.vol - p.rate * dt);
        applyVol(p);
        if (p.goal === 0 && p.vol <= 0.001) { killPlayer(p); players.splice(i, 1); continue; }
        const d = p.a.duration;
        if (p.goal > 0 && !p.next && isFinite(d) && d > XF * 2.5 && d - p.a.currentTime <= XF) {
          p.next = true;
          const start = Math.min(d * 0.1, 14);
          spawn(p.name, XF, start, [p]);
        }
      }
      if (!players.length) { clearInterval(ticker); ticker = null; lastTick = 0; }
    }, 50);
  }
  function spawn(name, fadeSecs, startAt, outgoing) {
    const a = new Audio(SM.asset('music/' + name + '.' + SM.musicExt));
    a.loop = false; a.preload = 'auto';
    const p = { a, vol: 0, goal: 1, rate: 1 / fadeSecs, name };
    const out = outgoing || [];
    const b = waBus();
    if (b) {
      try { p.src = ctx.createMediaElementSource(a); p.g = ctx.createGain(); p.g.gain.value = 0; p.src.connect(p.g); p.g.connect(b); a.volume = 1; }
      catch (e) { p.src = p.g = null; a.volume = 0; }
    } else a.volume = 0;
    out.forEach((o) => { o.next = true; });
    a.addEventListener('playing', () => { out.forEach((o) => { o.goal = 0; o.rate = 1 / Math.max(fadeSecs, 0.5); }); }, { once: true });
    a.addEventListener('loadedmetadata', () => { if (startAt) { try { a.currentTime = startAt; } catch (e) {} } });
    a.addEventListener('ended', () => { if (players.includes(p) && p.goal > 0 && !p.next) { p.next = true; spawn(name, 0.5, 0, [p]); } });
    a.addEventListener('error', () => { if (players.includes(p) && p.goal > 0) { out.forEach((o) => { o.goal = 0; }); curName = ''; } });
    const pr = a.play(); if (pr && pr.catch) pr.catch((err) => { if (p.goal <= 0 || (err && err.name === 'AbortError')) return; SM._pendingMusic = SM._lastReq; curName = ''; const k = players.indexOf(p); if (k >= 0) players.splice(k, 1); killPlayer(p); onCtxState(); });
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
    const old = players.filter((p) => p.goal > 0);
    old.forEach((p) => { p.goal = 0; p.rate = 1 / 1.8; p.next = true; });
    spawn(name, 1.8, 0, []);
  };
  SM.applyMusicVolume = () => { if (bus) bus.gain.value = musicLevel(); for (const p of players) applyVol(p); };
  SM.unlockAudio = () => {
    ac();
    for (const p of players) if (p.goal > 0 && p.a.paused) { const r = p.a.play(); if (r && r.catch) r.catch(() => {}); }
    if (SM._pendingMusic) { const [k, a, x] = SM._pendingMusic; SM._pendingMusic = null; SM.music(k, a, x); }
  };
})();
