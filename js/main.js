/* Spire Muses — arranque. */
(function () {
  const SM = window.SM, UI = SM.UI, { $ } = UI;
  const stage = $('#stage');
  function fit() {
    const vv = window.visualViewport, W = vv ? vv.width : window.innerWidth, H = vv ? vv.height : window.innerHeight;
    const s = Math.min(W / 1280, H / 720);
    stage.style.transform = `scale(${s})`;
  }
  window.addEventListener('resize', fit); window.addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();
  if (!document.documentElement.requestFullscreen) $('#tb_full').classList.add('hidden');
  UI.initTips(stage);
  document.addEventListener('pointerdown', () => SM.unlockAudio(), { once: false });
  document.addEventListener('keydown', (e) => { SM.unlockAudio(); UI.onKey(e); });
  $('#tb_deck').onclick = () => { SM.sfx('click'); UI.viewCards('Tu mazo', SM.run.deck.slice().sort((a, b) => a.id.localeCompare(b.id))); };
  $('#tb_menu').onclick = () => { SM.sfx('click'); UI.pauseMenu(); };
  $('#tb_help').onclick = () => { SM.sfx('click'); UI.help(); };
  $('#tb_opt').onclick = () => { SM.sfx('click'); UI.options(); };
  $('#tb_full').onclick = () => { SM.sfx('click'); if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); };
  window.addEventListener('contextmenu', (e) => { if (e.target.closest('#hand')) e.preventDefault(); });
  /* ---- Mando (Gamepad): cruceta/stick = flechas, A = Enter, B = Esc, Y = terminar turno, Start = pausa,
         X / Select = cursor libre (stick/cruceta mueven, A = clic) para ver estados, menús superiores y tooltips ---- */
  const padHeld = {};
  let cursorOn = false, cx = 640, cy = 360, lastT = 0, lastEl = null, lastMove = 0;
  const cur = document.createElement('div');
  cur.id = 'padcur'; cur.style.cssText = 'position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border:3px solid #fff;border-radius:50%;background:#ffd24a99;box-shadow:0 0 0 2px #000,0 0 14px #000;z-index:9999;pointer-events:none;display:none';
  document.body.appendChild(cur);
  function setCursor(on) {
    cursorOn = on; cur.style.display = on ? 'block' : 'none';
    if (on) {
      const r = stage.getBoundingClientRect(); cx = Math.min(Math.max(cx, r.left), r.right); cy = Math.min(Math.max(cy, r.top), r.bottom);
      if (!cx && !cy) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
      UI.toast && UI.toast('Cursor libre: stick/cruceta mueven · A clic · X o B salen');
    } else { UI.hideTip && UI.hideTip(); lastEl = null; }
    SM.sfx('select');
  }
  function curMoveEvents() {
    cur.style.transform = `translate(${cx}px,${cy}px)`;
    const el = document.elementFromPoint(cx, cy);
    if (el) el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
    if (el !== lastEl) {
      if (lastEl) lastEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: cx, clientY: cy }));
      if (el) el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
      lastEl = el;
    }
  }
  function curClick() {
    const el = document.elementFromPoint(cx, cy); if (!el) return;
    for (const t of ['mousedown', 'mouseup', 'click']) el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, clientX: cx, clientY: cy, button: 0 }));
  }
  function padKey(key) {
    SM.unlockAudio();
    const act = document.activeElement;
    const inOverlayOrScreen = document.querySelector('.overlay') || UI.current !== 'combat';
    if ((key === 'Enter') && inOverlayOrScreen && act && act !== document.body && act.closest && act.closest('.overlay, .screen') && (act.tagName === 'BUTTON' || act.matches('[tabindex="0"]'))) { act.click(); return; }
    UI.onKey({ key, pad: true, target: act, preventDefault() {} });
  }
  function padPoll(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    for (const gp of pads) {
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (cursorOn) {
        const dx = (b(15) ? 1 : 0) - (b(14) ? 1 : 0) + (Math.abs(ax) > 0.15 ? ax : 0) + (Math.abs(gp.axes[2] || 0) > 0.15 ? gp.axes[2] : 0);
        const dy = (b(13) ? 1 : 0) - (b(12) ? 1 : 0) + (Math.abs(ay) > 0.15 ? ay : 0) + (Math.abs(gp.axes[3] || 0) > 0.15 ? gp.axes[3] : 0);
        if (dx || dy) { cx = Math.min(innerWidth - 1, Math.max(0, cx + dx * 650 * dt)); cy = Math.min(innerHeight - 1, Math.max(0, cy + dy * 650 * dt)); curMoveEvents(); }
        else if (t - lastMove > 400) { curMoveEvents(); }
        if (dx || dy) lastMove = t;
      }
      const st = cursorOn ? { Click: b(0), CurOff: b(1) || b(2) || b(9) } : {
        ArrowLeft: b(14) || ax < -0.55, ArrowRight: b(15) || ax > 0.55, ArrowUp: b(12) || ay < -0.55, ArrowDown: b(13) || ay > 0.55,
        Enter: b(0), Escape: b(1) || b(9), e: b(3), CurOn: b(2) || b(8), Tab: b(5),
      };
      if (cursorOn && b(8)) st.CurOff = true;
      for (const [k, on] of Object.entries(st)) {
        const key = gp.index + k, h = padHeld[key];
        if (!on) { delete padHeld[key]; continue; }
        const rep = k.startsWith('Arrow');
        if (!h) {
          padHeld[key] = t + 380;
          if (k === 'CurOn') setCursor(true); else if (k === 'CurOff') setCursor(false); else if (k === 'Click') curClick(); else padKey(k);
        } else if (rep && t >= h) { padHeld[key] = t + 140; padKey(k); }
      }
    }
    requestAnimationFrame(padPoll);
  }
  requestAnimationFrame(padPoll);
  UI.title();
})();
