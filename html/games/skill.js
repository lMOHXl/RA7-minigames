/* =========================================================================
   Skill games: stack, stopwatch, tracker, whack, laser
   ========================================================================= */
(() => {
  const { U } = MG;

  // ---------------------------------------------------------------- stack
  MG.register('stack', {
    title: 'Tower Stack',
    icon: 'stack',
    desc: 'Drop each block so it lands on the one below',
    start(ctx) {
      const o = ctx.cfg({ layers: [8, 10, 12], speed: [170, 230, 300], width: [150, 130, 110], tol: [7, 5, 4], key: 'space' });
      const W = 320, H = 340, BH = 24;
      ctx.size(W + 40);
      ctx.el.innerHTML = `<div class="sk" style="width:${W}px;height:${H}px"><div class="sk-floor"></div></div>`;
      const root = ctx.el.querySelector('.sk');
      ctx.keys([[U.keyLabel(o.key), 'Drop'], ['LMB', 'Drop']]);
      const updStatus = (n) => ctx.status(`${n}/${o.layers}`);
      updStatus(0);

      const mk = (x, w, row, cls = '') => {
        const b = U.h('div', 'sk-block ' + cls);
        Object.assign(b.style, { left: x + 'px', width: w + 'px', bottom: row * BH + 'px', height: BH - 2 + 'px' });
        root.appendChild(b);
        return b;
      };
      let px = (W - o.width) / 2, pw = o.width, row = 1;
      mk(px, pw, 0, 'base');
      let x = 0, dir = 1, speed = o.speed, cur = null, active = false, w = pw;

      function spawn() {
        w = pw;
        x = dir > 0 ? 0 : W - w;
        cur = mk(x, w, row, 'cur');
        active = true;
      }
      ctx.loop((dt) => {
        if (!active) return;
        x += dir * speed * dt;
        if (x + w >= W) { x = W - w; dir = -1; }
        if (x <= 0) { x = 0; dir = 1; }
        cur.style.left = x + 'px';
      });

      function drop() {
        if (!active) return;
        active = false;
        const left = Math.max(x, px), right = Math.min(x + w, px + pw);
        const ov = right - left;
        if (ov <= 1) {
          cur.classList.add('fall');
          ctx.sfx.bad(); ctx.flash('bad'); ctx.shake();
          return ctx.lose('Missed the tower');
        }
        const perfect = Math.abs(x - px) <= o.tol;
        let nx = left, nw = ov;
        if (perfect) { nx = px; nw = pw; ctx.pop('PERFECT', '', root, W / 2, H - row * BH - 40); ctx.sfx.perfect(); }
        else {
          ctx.sfx.tone(380 + row * 40, 0.08, 'triangle', 0.07);
          const cutW = w - ov, cx = x < px ? x : px + pw;
          const chunk = mk(cx, cutW, row, 'chunk');
          requestAnimationFrame(() => chunk.classList.add('fall'));
          setTimeout(() => chunk.remove(), 700);
        }
        cur.classList.remove('cur');
        cur.style.left = nx + 'px';
        cur.style.width = nw + 'px';
        if (perfect) { cur.classList.add('perfect'); }
        px = nx; pw = nw;
        updStatus(row);
        if (row >= o.layers) return ctx.after(250, () => ctx.win(`${o.layers} layers`));
        row++;
        speed *= 1.045;
        dir = Math.random() < 0.5 ? 1 : -1;
        ctx.after(120, spawn);
      }
      ctx.on('keydown', (k) => { if (k === o.key) drop(); });
      ctx.listen(root, 'mousedown', drop);
      ctx.after(400, spawn);
    },
  });

  // ---------------------------------------------------------------- stopwatch
  MG.register('stopwatch', {
    title: 'Inner Clock',
    icon: 'stopwatch',
    desc: 'The clock disappears — stop it at exactly the target time',
    start(ctx) {
      const o = ctx.cfg({ rounds: [3, 3, 4], target: [3, 4, 5], show: [1400, 900, 500], tol: [360, 260, 170], key: 'space' });
      ctx.size(400);
      ctx.el.innerHTML = `
        <div class="swc">
          <div class="swc-target"><label>TARGET</label><b></b></div>
          <div class="swc-face"><div class="swc-time">0.00</div><div class="swc-sub">GET READY</div></div>
          <div class="swc-track"><div class="swc-win"></div><div class="swc-mark"></div></div>
        </div>`;
      const $ = (s) => ctx.el.querySelector(s);
      const face = $('.swc-face'), timeEl = $('.swc-time'), sub = $('.swc-sub'), targetEl = $('.swc-target b');
      const win = $('.swc-win'), mark = $('.swc-mark');
      const dots = ctx.dots(o.rounds);
      ctx.el.appendChild(dots.el);
      ctx.keys([[U.keyLabel(o.key), 'Stop clock']]);

      let round = 0, t0 = 0, phase = 'idle', target = 0;
      const fmt = (ms) => (ms / 1000).toFixed(2);
      function next() {
        round++;
        ctx.status(`${round}/${o.rounds}`);
        dots.set(round - 1, 'cur');
        target = (o.target + U.randi(-1, 1) * 0.5) * 1000;
        targetEl.textContent = fmt(target) + 's';
        const span = target * 1.6;
        win.style.left = ((target - o.tol) / span) * 100 + '%';
        win.style.width = ((o.tol * 2) / span) * 100 + '%';
        mark.style.left = '0%';
        mark.dataset.span = span;
        face.className = 'swc-face';
        sub.textContent = 'WATCH';
        timeEl.textContent = '0.00';
        t0 = performance.now();
        phase = 'run';
      }
      ctx.loop(() => {
        if (phase !== 'run') return;
        const e = performance.now() - t0;
        const hidden = e > o.show;
        face.classList.toggle('hidden', hidden);
        timeEl.textContent = hidden ? '?.??' : fmt(e);
        if (hidden) sub.textContent = 'COUNTING IN YOUR HEAD';
        mark.style.left = '0%';
        if (e > target + o.tol * 2.2) {
          phase = 'idle';
          face.classList.add('bad');
          timeEl.textContent = fmt(e);
          ctx.lose('Too late');
        }
      });
      ctx.on('keydown', (k) => {
        if (k !== o.key || phase !== 'run') return;
        phase = 'idle';
        const e = performance.now() - t0, diff = e - target;
        timeEl.textContent = fmt(e);
        face.classList.remove('hidden');
        mark.style.left = U.clamp((e / mark.dataset.span) * 100, 0, 100) + '%';
        if (Math.abs(diff) > o.tol) {
          face.classList.add('bad');
          sub.textContent = `${diff > 0 ? '+' : ''}${Math.round(diff)} ms`;
          return ctx.lose(diff > 0 ? 'Too late' : 'Too early');
        }
        face.classList.add('ok');
        sub.textContent = `${diff > 0 ? '+' : ''}${Math.round(diff)} ms`;
        ctx.sfx.ok(); ctx.flash('good');
        if (Math.abs(diff) < o.tol * 0.3) ctx.pop('PERFECT');
        dots.set(round - 1, 'on');
        if (round >= o.rounds) return ctx.after(500, () => ctx.win('In sync'));
        ctx.after(1100, next);
      });
      ctx.after(600, next);
    },
  });

  // ---------------------------------------------------------------- tracker
  MG.register('tracker', {
    title: 'Target Tracking',
    icon: 'crosshair',
    desc: 'Keep your cursor on the moving target',
    start(ctx) {
      const o = ctx.cfg({ need: [5, 7, 9], radius: [44, 36, 29], speed: [90, 135, 175], leak: [0.35, 0.5, 0.7], time: [24000, 26000, 28000] });
      const W = 460, H = 280;
      ctx.size(W + 32);
      ctx.el.innerHTML = `
        <div class="tr" style="width:${W}px;height:${H}px"><div class="tr-grid"></div><div class="tr-target"><i></i></div></div>
        <div class="tr-bar"><i></i></div>`;
      const arena = ctx.el.querySelector('.tr'), tgt = ctx.el.querySelector('.tr-target'), bar = ctx.el.querySelector('.tr-bar i');
      const R = o.radius;
      Object.assign(tgt.style, { width: R * 2 + 'px', height: R * 2 + 'px' });
      ctx.keys([['MOUSE', 'Stay on target']]);
      ctx.timer(o.time);

      let x = W / 2, y = H / 2, wx = x, wy = y, mx = -999, my = -999, prog = 0;
      ctx.listen(arena, 'mousemove', (e) => { const p = U.localPos(arena, e); mx = p.x; my = p.y; });
      ctx.listen(arena, 'mouseleave', () => { mx = my = -999; });
      const pick = () => { wx = U.rand(R + 8, W - R - 8); wy = U.rand(R + 8, H - R - 8); };
      pick();
      ctx.loop((dt) => {
        const dx = wx - x, dy = wy - y, d = Math.hypot(dx, dy);
        if (d < 6) pick();
        else { x += (dx / d) * o.speed * dt; y += (dy / d) * o.speed * dt; }
        tgt.style.transform = `translate(${x - R}px, ${y - R}px)`;
        const inside = Math.hypot(mx - x, my - y) <= R;
        prog = U.clamp(prog + (inside ? dt / o.need : -dt * o.leak / o.need), 0, 1);
        tgt.classList.toggle('on', inside);
        bar.style.width = prog * 100 + '%';
        ctx.status(Math.floor(prog * 100) + '%');
        if (prog >= 1) ctx.win('Tracking complete');
      });
    },
  });

  // ---------------------------------------------------------------- whack
  MG.register('whack', {
    title: 'Signal Hunt',
    icon: 'bolt',
    desc: 'Hit the green signals — avoid the red ones',
    start(ctx) {
      const o = ctx.cfg({ hits: [10, 14, 18], life: [1200, 900, 700], spawn: [650, 520, 420], misses: [3, 3, 2], bombs: [0, 0.18, 0.28] });
      const cols = 4, rows = 3, S = 78;
      ctx.size(cols * (S + 8) + 60);
      ctx.el.innerHTML = `<div class="wh" style="grid-template-columns:repeat(${cols},${S}px)"></div>`;
      const grid = ctx.el.querySelector('.wh');
      const cells = Array.from({ length: cols * rows }, () => ({ el: grid.appendChild(U.h('button', 'wh-cell', '<i></i>')), busy: false }));
      ctx.keys([['LMB', 'Hit green']]);
      let hits = 0, misses = 0, spawnT = 0.5;
      const upd = () => ctx.status(`${hits}/${o.hits} · ✕${misses}/${o.misses}`);
      upd();

      const miss = () => {
        misses++;
        ctx.sfx.bad(); ctx.flash('bad');
        upd();
        if (misses > o.misses) ctx.lose('Too many mistakes');
      };
      function spawn() {
        const free = cells.filter((c) => !c.busy);
        if (!free.length) return;
        const c = U.pick(free);
        const bomb = Math.random() < o.bombs;
        c.busy = true;
        c.bomb = bomb;
        c.el.className = 'wh-cell ' + (bomb ? 'bomb' : 'on');
        c.el.style.animationDuration = o.life + 'ms';
        c.timer = ctx.after(o.life, () => {
          c.busy = false;
          c.el.className = 'wh-cell';
          if (!bomb) miss();
        });
      }
      cells.forEach((c) =>
        c.el.addEventListener('mousedown', () => {
          if (ctx.done || !c.busy) return;
          ctx.clear(c.timer);
          c.busy = false;
          if (c.bomb) {
            c.el.className = 'wh-cell hitbad';
            ctx.shake(grid);
            return miss();
          }
          c.el.className = 'wh-cell hit';
          hits++;
          ctx.sfx.tone(900 + hits * 20, 0.05, 'square', 0.05);
          upd();
          if (hits >= o.hits) ctx.win(`${hits} signals`);
        })
      );
      ctx.loop((dt) => {
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = (o.spawn * U.rand(0.7, 1.25)) / 1000; spawn(); }
      });
    },
  });

  // ---------------------------------------------------------------- laser
  MG.register('laser', {
    title: 'Laser Grid',
    icon: 'laser',
    desc: 'Dodge the lasers until the system resets',
    start(ctx) {
      const o = ctx.cfg({ time: [12000, 16000, 20000], lives: [3, 2, 2], gap: [0.95, 0.7, 0.5], warn: [0.85, 0.65, 0.5], speed: [200, 230, 260] });
      const W = 460, H = 280, P = 9;
      ctx.size(W + 32);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.el.innerHTML = `<div class="lz"><canvas width="${W * dpr}" height="${H * dpr}" style="width:${W}px;height:${H}px"></canvas></div>`;
      const cv = ctx.el.querySelector('canvas'), g = cv.getContext('2d');
      g.scale(dpr, dpr);
      ctx.keys([[['W', 'A', 'S', 'D'], 'Move'], [['↑', '←', '↓', '→'], '']]);
      let px = W / 2, py = H / 2, lives = o.lives, inv = 0, spawnT = 0.5;
      const beams = [];
      const upd = () => ctx.status(`♥${lives}`);
      upd();
      ctx.timer(o.time, () => ctx.win('System reset'));

      function fire() {
        const horiz = Math.random() < 0.5;
        const near = Math.random() < 0.55;
        let pos = horiz ? (near ? py : U.rand(14, H - 14)) : (near ? px : U.rand(14, W - 14));
        beams.push({ horiz, pos: pos + (near ? U.rand(-18, 18) : 0), t: 0, warn: o.warn, on: 0.32, hit: false });
      }
      ctx.loop((dt) => {
        const h = ctx.held;
        const dx = (h.has('d') || h.has('arrowright') ? 1 : 0) - (h.has('a') || h.has('arrowleft') ? 1 : 0);
        const dy = (h.has('s') || h.has('arrowdown') ? 1 : 0) - (h.has('w') || h.has('arrowup') ? 1 : 0);
        const n = dx && dy ? 0.7071 : 1;
        px = U.clamp(px + dx * n * o.speed * dt, P, W - P);
        py = U.clamp(py + dy * n * o.speed * dt, P, H - P);
        inv = Math.max(0, inv - dt);
        spawnT -= dt;
        if (spawnT <= 0) { spawnT = o.gap * U.rand(0.8, 1.2); fire(); }

        g.clearRect(0, 0, W, H);
        g.strokeStyle = 'rgba(255,255,255,.04)';
        g.lineWidth = 1;
        for (let x = 0; x <= W; x += 23) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
        for (let y = 0; y <= H; y += 23) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

        for (let i = beams.length - 1; i >= 0; i--) {
          const b = beams[i];
          b.t += dt;
          const firing = b.t >= b.warn;
          if (b.t > b.warn + b.on) { beams.splice(i, 1); continue; }
          const x0 = b.horiz ? 0 : b.pos, y0 = b.horiz ? b.pos : 0, x1 = b.horiz ? W : b.pos, y1 = b.horiz ? b.pos : H;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
          if (!firing) {
            g.strokeStyle = `rgba(255,77,106,${0.15 + 0.25 * Math.abs(Math.sin(b.t * 18))})`;
            g.setLineDash([8, 8]); g.lineWidth = 2; g.stroke(); g.setLineDash([]);
          } else {
            g.shadowColor = '#ff4d6a'; g.shadowBlur = 18;
            g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.stroke();
            g.strokeStyle = 'rgba(255,77,106,.55)'; g.lineWidth = 12; g.stroke();
            g.shadowBlur = 0;
            const dist = b.horiz ? Math.abs(py - b.pos) : Math.abs(px - b.pos);
            if (dist < P + 5 && !b.hit && inv <= 0) {
              b.hit = true; inv = 0.9; lives--;
              ctx.sfx.bad(); ctx.flash('bad'); ctx.shake();
              upd();
              if (lives <= 0) return ctx.lose('Fried by the grid');
            }
          }
        }
        const blink = inv > 0 && Math.floor(inv * 14) % 2 === 0;
        g.shadowColor = '#38e8c6'; g.shadowBlur = 14;
        g.fillStyle = blink ? 'rgba(255,255,255,.35)' : getComputedStyle(ctx.panel).getPropertyValue('--accent').trim() || '#38e8c6';
        g.beginPath(); g.arc(px, py, P, 0, Math.PI * 2); g.fill();
        g.shadowBlur = 0;
      });
    },
  });
})();
