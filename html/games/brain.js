/* =========================================================================
   Brain / puzzle games: digits, match, rings, tiles, defuse
   ========================================================================= */
(() => {
  const { U } = MG;

  // ---------------------------------------------------------------- digits
  MG.register('digits', {
    title: 'Number Memory',
    icon: 'hash',
    desc: 'Memorize the number, then type it from memory',
    start(ctx) {
      const o = ctx.cfg({ rounds: [3, 4, 5], begin: [4, 5, 6], per: [430, 350, 290], base: [900, 800, 700] });
      ctx.size(440);
      ctx.el.innerHTML = `
        <div class="dg">
          <div class="dg-label">MEMORIZE</div>
          <div class="dg-num"></div>
          <div class="dg-bar"><i></i></div>
          <div class="dg-in"></div>
        </div>`;
      const $ = (s) => ctx.el.querySelector(s);
      const label = $('.dg-label'), numEl = $('.dg-num'), bar = $('.dg-bar i'), inEl = $('.dg-in');
      const dots = ctx.dots(o.rounds);
      ctx.el.appendChild(dots.el);
      ctx.keys([['0–9', 'Type'], ['⌫', 'Erase']]);
      const timer = ctx.timer(8000);
      timer.pause();

      let round = 0, answer = '', typed = '', input = false;
      const renderIn = (state) => {
        inEl.innerHTML = [...answer].map((c, i) => {
          const t = typed[i];
          const cls = t ? (state === 'bad' && i === typed.length - 1 ? 'bad' : 'ok') : i === typed.length ? 'cur' : '';
          return `<span class="${cls}">${t ?? ''}</span>`;
        }).join('');
      };
      function next() {
        round++;
        ctx.status(`${round}/${o.rounds}`);
        dots.set(round - 1, 'cur');
        const len = o.begin + round - 1;
        answer = '';
        for (let i = 0; i < len; i++) answer += U.randi(i ? 0 : 1, 9);
        typed = '';
        input = false;
        timer.pause();
        label.textContent = 'MEMORIZE';
        numEl.textContent = answer;
        numEl.className = 'dg-num';
        inEl.innerHTML = '';
        const show = o.base + len * o.per;
        bar.style.transition = 'none';
        bar.style.width = '100%';
        void bar.offsetWidth;
        bar.style.transition = `width ${show}ms linear`;
        bar.style.width = '0%';
        ctx.after(show, () => {
          numEl.textContent = '•'.repeat(len);
          numEl.className = 'dg-num hide';
          label.textContent = 'TYPE IT';
          renderIn();
          input = true;
          timer.reset(5000 + len * 900);
        });
      }
      ctx.on('keydown', (k) => {
        if (!input) return;
        if (k === 'backspace') { typed = typed.slice(0, -1); return renderIn(); }
        if (!/^[0-9]$/.test(k)) return;
        const i = typed.length;
        typed += k;
        if (k !== answer[i]) {
          input = false;
          renderIn('bad');
          numEl.textContent = answer;
          numEl.className = 'dg-num reveal';
          return ctx.lose('Wrong number');
        }
        ctx.sfx.tone(520 + i * 40, 0.04, 'triangle', 0.06);
        renderIn();
        if (typed.length === answer.length) {
          input = false;
          timer.pause();
          dots.set(round - 1, 'on');
          ctx.sfx.ok(); ctx.flash('good');
          numEl.className = 'dg-num ok';
          numEl.textContent = answer;
          if (round >= o.rounds) return ctx.after(350, () => ctx.win('Perfect recall'));
          ctx.after(900, next);
        }
      });
      ctx.after(400, next);
    },
  });

  // ---------------------------------------------------------------- match
  const GLYPHS = ['◆', '●', '▲', '■', '★', '✚', '☾', '♥', '☀', '⚑', '✦', '♣'];
  MG.register('match', {
    title: 'Pair Match',
    icon: 'cards',
    desc: 'Flip the cards and find every matching pair',
    start(ctx) {
      const o = ctx.cfg({ pairs: [6, 8, 10], preview: [2400, 1800, 1300], misses: [9, 7, 6], time: [45000, 50000, 55000] });
      const cols = 4, S = 62;
      ctx.size(cols * (S + 8) + 64);
      const deck = U.shuffle(GLYPHS.slice(0, o.pairs).flatMap((g, i) => [{ g, i }, { g, i }]));
      ctx.el.innerHTML = `<div class="pm" style="grid-template-columns:repeat(${cols},${S}px)"></div>`;
      const grid = ctx.el.querySelector('.pm');
      const cards = deck.map((d, idx) => {
        const el = U.h('button', 'pm-card open', `<span class="pm-back"></span><span class="pm-face" data-c="${d.i % 6}">${d.g}</span>`);
        el.style.animationDelay = idx * 25 + 'ms';
        grid.appendChild(el);
        return { el, ...d, done: false };
      });
      let misses = 0, found = 0, open = [], lock = true;
      const upd = () => ctx.status(`${found}/${o.pairs} · ✕${misses}/${o.misses}`);
      upd();
      ctx.keys([['LMB', 'Flip card']]);
      ctx.after(o.preview, () => {
        cards.forEach((c) => c.el.classList.remove('open'));
        lock = false;
        ctx.timer(o.time);
      });
      cards.forEach((c) =>
        c.el.addEventListener('click', () => {
          if (lock || c.done || open.includes(c) || ctx.done) return;
          c.el.classList.add('open');
          ctx.sfx.tone(480, 0.04, 'triangle', 0.05);
          open.push(c);
          if (open.length < 2) return;
          const [a, b] = open;
          if (a.i === b.i) {
            a.done = b.done = true;
            a.el.classList.add('done'); b.el.classList.add('done');
            open = [];
            found++;
            ctx.sfx.ok();
            upd();
            if (found >= o.pairs) ctx.win('All pairs found');
          } else {
            lock = true;
            misses++;
            upd();
            ctx.sfx.bad();
            a.el.classList.add('bad'); b.el.classList.add('bad');
            ctx.after(650, () => {
              [a, b].forEach((x) => x.el.classList.remove('open', 'bad'));
              open = [];
              lock = false;
              if (misses > o.misses) ctx.lose('Too many mismatches');
            });
          }
        })
      );
    },
  });

  // ---------------------------------------------------------------- rings
  MG.register('rings', {
    title: 'Ring Alignment',
    icon: 'rings',
    desc: 'Rotate the rings until every gap lines up with the marker',
    start(ctx) {
      const o = ctx.cfg({ rings: [2, 3, 3], gap: [60, 44, 36], tol: [10, 7, 5], hold: [0.5, 0.6, 0.7], couple: [false, false, true], time: [32000, 38000, 44000] });
      ctx.size(420);
      const n = o.rings;
      const rad = (i) => 94 - i * 26;
      ctx.el.innerHTML = `
        <div class="rg">
          <div class="rg-pointer"></div>
          <svg viewBox="0 0 220 220" class="rg-svg">
            ${Array.from({ length: n }, (_, i) => `
              <g class="rg-ring" data-i="${i}">
                <circle cx="110" cy="110" r="${rad(i)}" class="rg-track"/>
                <g class="rg-rot"><path d="${U.arc(110, 110, rad(i), o.gap / 2, 360 - o.gap / 2)}" class="rg-arc"/></g>
              </g>`).join('')}
            <circle cx="110" cy="110" r="${rad(n - 1) - 20}" class="rg-core"/>
          </svg>
          <div class="rg-info"><b>0</b><small>/ ${n} ALIGNED</small></div>
        </div>`;
      const $ = (s) => ctx.el.querySelector(s);
      const groups = [...ctx.el.querySelectorAll('.rg-ring')];
      const rots = groups.map((g) => g.querySelector('.rg-rot'));
      const info = $('.rg-info b'), svg = $('.rg-svg');
      ctx.keys([[['W', 'S'], 'Select ring'], [['A', 'D'], 'Rotate'], ['WHEEL', '']]);
      ctx.timer(o.time);

      const ang = Array.from({ length: n }, () => U.rand(80, 280));
      let sel = 0, holdT = 0;
      const norm = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
      const select = (i) => { sel = U.clamp(i, 0, n - 1); groups.forEach((g, j) => g.classList.toggle('sel', j === sel)); };
      select(0);

      const rotate = (i, d) => {
        ang[i] += d;
        if (o.couple) {
          if (ang[i - 1] !== undefined) ang[i - 1] -= d * 0.5;
          if (ang[i + 1] !== undefined) ang[i + 1] -= d * 0.5;
        }
      };
      groups.forEach((g, i) => g.addEventListener('mousedown', () => select(i)));
      ctx.listen(ctx.el, 'wheel', (e) => { e.preventDefault(); rotate(sel, e.deltaY > 0 ? 5 : -5); }, { passive: false });
      ctx.on('keydown', (k) => {
        if (k === 'w' || k === 'arrowup') select(sel - 1);
        if (k === 's' || k === 'arrowdown') select(sel + 1);
      });
      ctx.loop((dt) => {
        const h = ctx.held;
        const dir = (h.has('d') || h.has('arrowright') ? 1 : 0) - (h.has('a') || h.has('arrowleft') ? 1 : 0);
        if (dir) rotate(sel, dir * 110 * dt);
        let ok = 0;
        ang.forEach((a, i) => {
          rots[i].setAttribute('transform', `rotate(${a} 110 110)`);
          const good = Math.abs(norm(a)) <= o.tol;
          groups[i].classList.toggle('ok', good);
          if (good) ok++;
        });
        info.textContent = ok;
        svg.classList.toggle('all', ok === n);
        holdT = ok === n ? holdT + dt : 0;
        if (holdT >= o.hold) { ctx.sfx.ok(); ctx.win('Rings aligned'); }
      });
    },
  });

  // ---------------------------------------------------------------- tiles
  MG.register('tiles', {
    title: 'Slide Puzzle',
    icon: 'tiles',
    desc: 'Slide the tiles back into numerical order',
    start(ctx) {
      const o = ctx.cfg({ size: [3, 3, 4], scramble: [18, 34, 46], time: [60000, 75000, 110000] });
      const N = o.size, S = N > 3 ? 70 : 82, G = 6;
      const box = N * S + (N - 1) * G;
      ctx.size(box + 70);
      const solved = [...Array(N * N).keys()].map((i) => (i + 1) % (N * N)); // last = 0 (empty)
      let board = solved.slice(), empty = N * N - 1, prev = -1;
      const neighbors = (e) => {
        const x = e % N, y = (e / N) | 0, r = [];
        if (x > 0) r.push(e - 1); if (x < N - 1) r.push(e + 1);
        if (y > 0) r.push(e - N); if (y < N - 1) r.push(e + N);
        return r;
      };
      const swap = (t) => { board[empty] = board[t]; board[t] = 0; prev = empty; empty = t; };
      let tries = 0;
      do {
        board = solved.slice(); empty = N * N - 1; prev = -1;
        for (let i = 0; i < o.scramble; i++) swap(U.pick(neighbors(empty).filter((x) => x !== prev)));
      } while (board.every((v, i) => v === solved[i]) && tries++ < 10);

      ctx.el.innerHTML = `<div class="tl" style="width:${box}px;height:${box}px"></div>`;
      const root = ctx.el.querySelector('.tl');
      const tiles = {};
      for (let v = 1; v < N * N; v++) {
        const t = U.h('button', 'tl-tile', `<span>${v}</span>`);
        t.style.width = t.style.height = S + 'px';
        root.appendChild(t);
        tiles[v] = t;
      }
      const place = () => {
        let right = 0;
        board.forEach((v, i) => {
          if (!v) return;
          tiles[v].style.transform = `translate(${(i % N) * (S + G)}px, ${((i / N) | 0) * (S + G)}px)`;
          const good = solved[i] === v;
          tiles[v].classList.toggle('ok', good);
          if (good) right++;
        });
        return right;
      };
      let moves = 0;
      const upd = (right) => ctx.status(`${right}/${N * N - 1} · ${moves} moves`);
      upd(place());
      ctx.timer(o.time);
      ctx.keys([['LMB', 'Slide tile'], [['↑', '↓', '←', '→'], 'Slide']]);

      function move(i) {
        if (ctx.done || !neighbors(empty).includes(i)) return;
        swap(i);
        moves++;
        ctx.sfx.tone(360, 0.04, 'triangle', 0.05);
        const right = place();
        upd(right);
        if (right === N * N - 1) ctx.after(300, () => ctx.win(`${moves} moves`));
      }
      Object.entries(tiles).forEach(([v, t]) => t.addEventListener('mousedown', () => move(board.indexOf(+v))));
      const arrow = { arrowup: N, arrowdown: -N, arrowleft: 1, arrowright: -1 };
      ctx.on('keydown', (k) => {
        if (!(k in arrow)) return;
        const t = empty + arrow[k];
        if (t < 0 || t >= N * N) return;
        if (Math.abs(arrow[k]) === 1 && ((t / N) | 0) !== ((empty / N) | 0)) return;
        move(t);
      });
    },
  });

  // ---------------------------------------------------------------- defuse
  MG.register('defuse', {
    title: 'Wire Cutter',
    icon: 'wire',
    desc: 'Cut the wires in the order the rule demands',
    start(ctx) {
      const o = ctx.cfg({ count: [4, 5, 6], time: [16000, 15000, 14000], penalty: [2000, 2500, 3000], rules: [['short', 'long'], ['short', 'long', 'color'], ['color']] });
      const palette = ['#ff4d6a', '#4d8dff', '#ffd24d', '#3ddc84', '#b36bff', '#ff8a3d', '#38e8e0'];
      const n = o.count;
      ctx.size(Math.max(400, n * 60 + 80));
      const colors = U.shuffle(palette).slice(0, n);
      const lens = U.shuffle(Array.from({ length: n }, (_, i) => 70 + i * (90 / (n - 1 || 1))));
      const rule = U.pick(o.rules);
      let order = [...Array(n).keys()];
      let text;
      if (rule === 'short') { order.sort((a, b) => lens[a] - lens[b]); text = 'Cut from <b>SHORTEST</b> to <b>LONGEST</b>'; }
      else if (rule === 'long') { order.sort((a, b) => lens[b] - lens[a]); text = 'Cut from <b>LONGEST</b> to <b>SHORTEST</b>'; }
      else { order = U.shuffle(order); text = 'Cut in this <b>COLOR ORDER</b>'; }

      ctx.el.innerHTML = `
        <div class="df">
          <div class="df-rule">${text}</div>
          <div class="df-chips">${order.map((i) => `<i style="background:${colors[i]}"></i>`).join('')}</div>
          <div class="df-board">
            <div class="df-block"></div>
            <div class="df-wires">${colors.map((c, i) => `
              <button class="df-wire" data-i="${i}"><span class="df-bar" style="height:${lens[i]}px;--c:${c}"><i class="a"></i><i class="b"></i></span></button>`).join('')}</div>
          </div>
        </div>`;
      const chips = [...ctx.el.querySelectorAll('.df-chips i')];
      if (rule !== 'color') ctx.el.querySelector('.df-chips').style.display = 'none';
      const timer = ctx.timer(o.time);
      ctx.keys([['LMB', 'Cut wire']]);
      let step = 0;
      const upd = () => { ctx.status(`${step}/${n}`); chips.forEach((c, i) => { c.classList.toggle('done', i < step); c.classList.toggle('cur', i === step); }); };
      upd();
      ctx.el.querySelectorAll('.df-wire').forEach((w) =>
        w.addEventListener('mousedown', () => {
          const i = +w.dataset.i;
          if (ctx.done || w.classList.contains('cut')) return;
          if (i !== order[step]) {
            timer.add(-o.penalty);
            w.classList.remove('wrong'); void w.offsetWidth; w.classList.add('wrong');
            ctx.sfx.bad(); ctx.flash('bad'); ctx.shake();
            ctx.pop(`-${(o.penalty / 1000).toFixed(1)}s`, 'bad');
            return;
          }
          w.classList.add('cut');
          step++;
          ctx.sfx.tone(900 - step * 40, 0.07, 'square', 0.06);
          upd();
          if (step >= n) { timer.stop(); ctx.win('All wires cut'); }
        })
      );
    },
  });
})();
