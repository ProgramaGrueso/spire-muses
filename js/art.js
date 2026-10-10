/* Spire Muses — animación de las musas con hojas de sprites + utilidades de imagen. */
(function () {
  const root = window;
  const SM = (root.SM = root.SM || {});
  const FPS = 12;
  const sheets = {};
  function loadSheet(muse, anim) {
    const k = muse + '_' + anim;
    if (!sheets[k]) {
      const img = new Image();
      img.src = SM.asset('sprites/' + k + '.webp');
      sheets[k] = img;
    }
    return sheets[k];
  }
  SM.preloadMuse = (muse) => Object.keys(SM.SPRITES[muse].anims).forEach((a) => loadSheet(muse, a));

  const live = new Set();
  let last = 0, acc = 0;
  function tick(t) {
    const dt = Math.min(0.1, (t - last) / 1000); last = t; acc += dt;
    if (acc >= 1 / FPS) { acc = 0; live.forEach((s) => s.step()); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  class Sprite {
    constructor(muse, heightPx) {
      this.muse = muse;
      const m = SM.SPRITES[muse];
      this.m = m;
      this.canvas = document.createElement('canvas');
      this.canvas.width = m.w; this.canvas.height = m.h;
      this.canvas.className = 'sprite';
      const hp = heightPx || m.h;
      this.canvas.style.height = hp + 'px';
      this.canvas.style.width = Math.round((m.w / m.h) * hp) + 'px';
      this.g = this.canvas.getContext('2d');
      this.anim = 'idle'; this.f = 0; this.dir = 1; this.loop = true; this.onEnd = null; this.dead = false;
      live.add(this);
      this.draw();
    }
    play(anim, onEnd) {
      if (this.dead) return;
      const n = this.m.anims[anim];
      if (!n) { if (onEnd) onEnd(); return; }
      this.anim = anim; this.f = 0; this.dir = 1; this.loop = anim === 'idle' || anim === 'idleWait'; this.onEnd = onEnd || null;
      this.draw();
    }
    step() {
      const n = this.m.anims[this.anim];
      if (this.anim === 'idle') {
        this.f += this.dir;
        if (this.f >= n - 1) { this.f = n - 1; this.dir = -1; }
        else if (this.f <= 0) { this.f = 0; this.dir = 1; }
      } else {
        if (this.f < n - 1) this.f++;
        else if (this.anim === 'die') { this.dead = true; }
        else { const cb = this.onEnd; this.onEnd = null; this.anim = 'idle'; this.f = 0; this.dir = 1; if (cb) cb(); }
      }
      this.draw();
    }
    draw() {
      const img = loadSheet(this.muse, this.anim);
      if (!img.complete || !img.naturalWidth) return;
      const { w, h } = this.m;
      this.g.clearRect(0, 0, w, h);
      this.g.drawImage(img, this.f * w, 0, w, h, 0, 0, w, h);
    }
    destroy() { live.delete(this); }
  }
  SM.Sprite = Sprite;
})();
