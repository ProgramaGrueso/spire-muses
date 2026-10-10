/* Spire Muses — progreso entre partidas: estadísticas, Galería y Pesadilla. */
(function () {
  const SM = window.SM;
  const KEY = 'meta';
  const def = () => ({ s: {}, relics: [], gal: [], nmUnlocked: 0, seenEnding: false });
  let M = Object.assign(def(), SM.store.get(KEY, {}) || {});
  M.s = M.s || {}; M.relics = M.relics || []; M.gal = M.gal || [];
  let saveT = null, checkT = null;
  const queue = [];
  const listeners = [];

  function save() { clearTimeout(saveT); saveT = setTimeout(() => SM.store.set(KEY, M), 250); }
  function metaView() { return { s: M.s, relics: M.relics, unlocked: M.gal.filter((x) => x !== 'ultima').length }; }
  function check() {
    clearTimeout(checkT);
    checkT = setTimeout(() => {
      const v = metaView();
      for (const l of SM.LORE) {
        if (M.gal.includes(l.id)) continue;
        if (l.v(v) >= l.t) { M.gal.push(l.id); queue.push(l); }
        v.unlocked = M.gal.filter((x) => x !== 'ultima').length;
      }
      if (queue.length) { save(); listeners.forEach((f) => f()); }
    }, 200);
  }
  const Meta = {
    get data() { return M; },
    add(k, n) { M.s[k] = (M.s[k] || 0) + (n === undefined ? 1 : n); save(); check(); },
    max(k, n) { if (n > (M.s[k] || 0)) { M.s[k] = n; save(); check(); } },
    seeRelic(id) { if (!M.relics.includes(id)) { M.relics.push(id); save(); check(); } },
    isUnlocked: (id) => M.gal.includes(id),
    progress(l) { return Math.min(l.t, l.v(metaView())); },
    takeUnlocked() { return queue.splice(0); },
    onUnlock(f) { listeners.push(f); },
    nmUnlocked: () => M.nmUnlocked || 0,
    winRun(char, nm) {
      M.s.wins = (M.s.wins || 0) + 1; M.s['win_' + char] = (M.s['win_' + char] || 0) + 1;
      if (nm >= 1) M.s.nm = Math.max(M.s.nm || 0, nm);
      M.nmUnlocked = Math.max(M.nmUnlocked || 0, Math.min(10, nm + 1));
      save(); check();
    },
    reset() { M = def(); save(); },
  };
  SM.Meta = Meta;
})();
