/* =========================================================================
   Minigames core — runner, context API, audio, UI shell
   ========================================================================= */
(() => {
  'use strict';

  const RES = typeof GetParentResourceName === 'function' ? GetParentResourceName() : null;

  // ------------------------------------------------------------------ utils
  const U = {
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    ease: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    h(tag, cls, html) {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    },
    svg(tag, attrs = {}) {
      const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    },
    // Arc path, angles in degrees clockwise from 12 o'clock
    arc(cx, cy, r, a0, a1) {
      const p = (a) => {
        const rad = ((a - 90) * Math.PI) / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
      };
      const [x0, y0] = p(a0);
      const [x1, y1] = p(a1);
      return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
    },
    svgPoint(svg, e) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    },
    localPos(el, e) {
      const r = el.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * el.offsetWidth,
        y: ((e.clientY - r.top) / r.height) * el.offsetHeight,
      };
    },
    keyName(e) {
      if (e.key === ' ' || e.code === 'Space') return 'space';
      return String(e.key || '').toLowerCase();
    },
    keyLabel(k) {
      return (
        {
          space: 'SPACE', arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→',
          enter: 'ENTER', escape: 'ESC', backspace: '⌫', shift: 'SHIFT',
        }[k] || String(k).toUpperCase()
      );
    },
    hexToRgb(hex) {
      const m = String(hex).replace('#', '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!m) return null;
      let h = m[1];
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const n = parseInt(h, 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    },
  };

  // ------------------------------------------------------------------ icons
  const ICONS = {
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    wave: '<path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0"/><path d="M20 12h2"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    pipe: '<path d="M3 8h8a3 3 0 0 1 3 3v10"/><path d="M3 14h5a0 0 0 0 1 0 0v7"/><path d="M14 3v2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    fish: '<path d="M3 12c3-5 9-6 14-2l4-3v10l-4-3c-5 4-11 3-14-2z"/><circle cx="8" cy="11" r=".8"/>',
    hand: '<path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.5V12a1.5 1.5 0 0 1 3 0v1"/>',
    dial: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    maze: '<path d="M3 3h18v18H3z"/><path d="M7 3v10h4M15 7v14M11 17h4M7 17v4M15 7h6"/>',
    arrows: '<path d="M12 20V4M5 11l7-7 7 7"/>',
    math: '<path d="M5 7h6M8 4v6M14 7h5M5 14l5 5M10 14l-5 5M14 15h5M14 19h5"/>',
    cups: '<path d="M6 7h12l-2 13H8z"/><path d="M4.5 7h15"/>',
    wire: '<path d="M3 6h4c5 0 5 12 10 12h4"/><path d="M3 18h4c2 0 3-2 4-4"/><path d="M14 9c1-2 2-3 3-3h4"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s2-1 4-1a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/>',
    type: '<path d="M4 7V5h16v2M9 19h6M12 5v14"/>',
    hash: '<path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/>',
    balance: '<path d="M12 3v18M5 21h14M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z"/>',
    crosshair: '<circle cx="12" cy="12" r="8"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>',
    battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M7 10v4M11 10v4"/>',
    cards: '<rect x="3" y="5" width="8" height="14" rx="1.5"/><rect x="13" y="5" width="8" height="14" rx="1.5"/>',
    rings: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v3"/>',
    tiles: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    stack: '<rect x="4" y="15" width="16" height="5" rx="1"/><rect x="7" y="9" width="12" height="5" rx="1"/><rect x="5" y="3" width="10" height="5" rx="1"/>',
    stopwatch: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6M12 2v3"/>',
    laser: '<path d="M3 12h18M3 6h8M13 18h8"/>',
    simon: '<path d="M12 3a9 9 0 0 1 9 9h-9z"/><path d="M3 12a9 9 0 0 1 9-9v9z"/><path d="M12 21a9 9 0 0 1-9-9h9z"/><path d="M21 12a9 9 0 0 1-9 9v-9z"/>',
  };

  // ------------------------------------------------------------------ audio
  const sfx = (() => {
    let ac = null;
    const get = () => {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    function tone(freq, dur = 0.08, type = 'sine', vol = 0.08, slide = 0, delay = 0) {
      const v = vol * settings.volume;
      if (v <= 0) return;
      try {
        const a = get();
        if (!a) return;
        const t0 = a.currentTime + delay;
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(a.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.03);
      } catch (_) { /* audio optional */ }
    }
    return {
      tone,
      tick: () => tone(1800, 0.025, 'square', 0.025),
      click: () => tone(720, 0.05, 'triangle', 0.07),
      ok: () => tone(760, 0.12, 'sine', 0.09, 380),
      bad: () => tone(200, 0.2, 'sawtooth', 0.06, -60),
      perfect: () => { tone(880, 0.08, 'sine', 0.08); tone(1320, 0.14, 'sine', 0.08, 0, 0.07); },
      win: () => { tone(523, 0.12, 'triangle', 0.09); tone(659, 0.12, 'triangle', 0.09, 0, 0.1); tone(988, 0.26, 'triangle', 0.09, 0, 0.2); },
      lose: () => { tone(320, 0.18, 'sawtooth', 0.06, -80); tone(190, 0.32, 'sawtooth', 0.06, -60, 0.15); },
    };
  })();

  // ------------------------------------------------------------------ state
  const settings = { accent: null, volume: 0.6, scale: null, position: 'center' };
  const games = {};
  let run = null;

  function post(name, data) {
    if (!RES) {
      window.dispatchEvent(new CustomEvent('mg:' + name, { detail: data }));
      return;
    }
    fetch(`https://${RES}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data || {}),
    }).catch(() => {});
  }

  function autoScale() {
    if (settings.scale) return settings.scale;
    return U.clamp(window.innerHeight / 1080, 0.7, 1.6);
  }

  // ------------------------------------------------------------------ runner
  function start(id, opts = {}) {
    if (run) end(run, false, 'interrupted', true);
    document.querySelectorAll('.mg-wrap').forEach((w) => w.remove());

    const ids = Object.keys(games);
    if (!id || id === 'random') id = U.pick(Array.isArray(opts.games) && opts.games.length ? opts.games : ids);
    const def = games[id];
    if (!def) {
      console.warn('[minigames] unknown game:', id);
      post('finish', { success: false, game: id, reason: 'unknown_game' });
      return;
    }

    let d = 1;
    const dv = opts.difficulty;
    if (typeof dv === 'string') d = { easy: 0, normal: 1, medium: 1, hard: 2 }[dv.toLowerCase()] ?? 1;
    else if (typeof dv === 'number') d = U.clamp(Math.round(dv) - 1, 0, 2);

    const wrap = U.h('div', 'mg-wrap pos-' + (opts.position || settings.position || 'center'));
    const accent = opts.accent || settings.accent;
    const rgb = accent && U.hexToRgb(accent);
    if (rgb) {
      wrap.style.setProperty('--accent', accent);
      wrap.style.setProperty('--accent-rgb', rgb);
    }
    wrap.style.setProperty('--scale', opts.scale || autoScale());
    wrap.innerHTML = `
      <div class="mg-scale">
        <div class="mg-panel" data-game="${id}">
          <div class="mg-head">
            <div class="mg-icon"><svg viewBox="0 0 24 24">${ICONS[def.icon] || ICONS.cpu}</svg></div>
            <div class="mg-titles">
              <div class="mg-title"></div>
              <div class="mg-sub"></div>
            </div>
            <div class="mg-status"></div>
          </div>
          <div class="mg-body"></div>
          <div class="mg-foot">
            <div class="mg-hints"></div>
            <div class="mg-foot-r"><span class="mg-esc"><kbd>ESC</kbd>Cancel</span><span class="mg-time"></span></div>
          </div>
          <div class="mg-timer"><i></i></div>
          <div class="mg-flash"></div>
          <div class="mg-result"></div>
        </div>
      </div>`;
    app.appendChild(wrap);

    const $ = (s) => wrap.querySelector(s);
    const panel = $('.mg-panel');
    const body = $('.mg-body');
    $('.mg-title').textContent = opts.title || def.title;
    $('.mg-sub').innerHTML = opts.subtitle || def.desc || '';
    if (opts.cancelable === false) $('.mg-esc').remove();

    const R = {
      id, def, opts, d, wrap, panel, body,
      done: false, started: performance.now(),
      timeouts: new Set(), intervals: new Set(), loops: new Set(), listeners: [],
      handlers: { keydown: [], keyup: [] }, held: new Set(), raf: 0, last: 0,
    };
    run = R;

    const tick = (t) => {
      if (R.done) return;
      const dt = Math.min(0.05, (t - (R.last || t)) / 1000);
      R.last = t;
      for (const fn of [...R.loops]) {
        fn(dt, t);
        if (R.done) return;
      }
      R.raf = requestAnimationFrame(tick);
    };
    R.raf = requestAnimationFrame(tick);

    const timerEl = $('.mg-timer');
    const timerBar = timerEl.firstElementChild;
    const timeText = $('.mg-time');
    const flashEl = $('.mg-flash');

    const ctx = {
      id, el: body, panel, opts, d, U, sfx,
      get held() { return R.held; },
      get done() { return R.done; },

      /** Resolve per-difficulty defaults: arrays of length 3 = [easy, normal, hard]. opts override. */
      cfg(defs) {
        const o = {};
        for (const k in defs) {
          const v = defs[k];
          o[k] = opts[k] !== undefined ? opts[k] : Array.isArray(v) && v.length === 3 ? v[d] : v;
        }
        return o;
      },
      size(w) { panel.style.setProperty('--w', w + 'px'); },
      status(t) { $('.mg-status').innerHTML = t ?? ''; },
      hint(html) { $('.mg-sub').innerHTML = html; },
      keys(list) {
        $('.mg-hints').innerHTML = list
          .map(([k, l]) => `<span>${[].concat(k).map((x) => `<kbd>${x}</kbd>`).join('')}${l}</span>`)
          .join('');
      },

      after(ms, fn) {
        const id = setTimeout(() => { R.timeouts.delete(id); if (!R.done) fn(); }, ms);
        R.timeouts.add(id);
        return id;
      },
      every(ms, fn) {
        const id = setInterval(() => { if (!R.done) fn(); }, ms);
        R.intervals.add(id);
        return id;
      },
      clear(id) {
        clearTimeout(id); clearInterval(id);
        R.timeouts.delete(id); R.intervals.delete(id);
      },
      loop(fn) { R.loops.add(fn); return () => R.loops.delete(fn); },
      on(type, fn) { (R.handlers[type] || (R.handlers[type] = [])).push(fn); },
      listen(target, type, fn, o) {
        target.addEventListener(type, fn, o);
        R.listeners.push([target, type, fn, o]);
      },

      timer(ms, onEnd) {
        const t = {
          total: ms, left: ms, running: true,
          add(x) {
            t.left = Math.max(0, Math.min(t.total, t.left + x));
            if (x < 0) { timerEl.classList.remove('hit'); void timerEl.offsetWidth; timerEl.classList.add('hit'); }
          },
          stop() { t.running = false; timerEl.classList.remove('on'); timeText.textContent = ''; },
          pause() { t.running = false; },
          resume() { t.running = true; timerEl.classList.add('on'); },
          reset(ms2) { t.total = t.left = ms2 ?? t.total; t.running = true; timerEl.classList.add('on'); },
        };
        timerEl.classList.add('on');
        ctx.loop((dt) => {
          if (!t.running) return;
          t.left -= dt * 1000;
          const p = U.clamp(t.left / t.total, 0, 1);
          timerBar.style.transform = `scaleX(${p})`;
          timerEl.classList.toggle('low', p < 0.25);
          timeText.textContent = (Math.max(0, t.left) / 1000).toFixed(1) + 's';
          timeText.classList.toggle('low', p < 0.25);
          if (t.left <= 0) {
            t.running = false;
            (onEnd || (() => ctx.lose('Out of time')))();
          }
        });
        return t;
      },

      dots(n, cls = '') {
        const el = U.h('div', 'mg-dots ' + cls);
        for (let i = 0; i < n; i++) el.appendChild(U.h('i'));
        return {
          el,
          set(i, state) { const x = el.children[i]; if (x) x.className = state || ''; },
        };
      },
      flash(kind = 'good') {
        flashEl.className = 'mg-flash';
        void flashEl.offsetWidth;
        flashEl.className = 'mg-flash ' + kind;
      },
      shake(el = body) {
        el.classList.remove('mg-shake');
        void el.offsetWidth;
        el.classList.add('mg-shake');
      },
      pop(text, kind = '', parent = body, x, y) {
        const p = U.h('div', 'mg-pop ' + kind, text);
        if (x != null) { p.style.left = x + 'px'; p.style.top = y + 'px'; }
        parent.appendChild(p);
        setTimeout(() => p.remove(), 900);
      },

      win(msg) { end(R, true, msg); },
      lose(msg) { end(R, false, msg); },
    };
    R.ctx = ctx;

    try {
      def.start(ctx);
    } catch (err) {
      console.error('[minigames] error in', id, err);
      end(R, false, 'error');
    }
  }

  function end(R, success, reason, silent) {
    if (R.done) return;
    R.done = true;
    cancelAnimationFrame(R.raf);
    R.timeouts.forEach(clearTimeout);
    R.intervals.forEach(clearInterval);
    R.listeners.forEach(([t, ty, fn, o]) => t.removeEventListener(ty, fn, o));
    R.loops.clear();

    const result = {
      success: !!success,
      game: R.id,
      difficulty: ['easy', 'normal', 'hard'][R.d],
      reason: reason || (success ? 'completed' : 'failed'),
      time: Math.round(performance.now() - R.started),
    };
    let posted = false;
    const flush = () => {
      if (posted) return;
      posted = true;
      if (run === R) run = null;
      post('finish', result);
    };

    if (silent) {
      R.wrap.remove();
      flush();
      return;
    }

    success ? sfx.win() : sfx.lose();
    const res = R.wrap.querySelector('.mg-result');
    const label = success ? 'Success' : 'Failed';
    const detail = reason && !['completed', 'failed'].includes(reason) ? reason : success ? 'Completed' : '';
    res.innerHTML = `
      <div class="mg-ring">
        <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/>
          <path d="${success ? 'M15 27l7 7 15-16' : 'M18 18l16 16M34 18 18 34'}"/></svg>
      </div>
      <b>${label}</b>${detail ? `<small>${detail}</small>` : ''}`;
    R.panel.classList.add(success ? 'is-win' : 'is-lose');
    R.wrap.querySelector('.mg-timer').classList.remove('on');

    const hold = R.opts.resultTime ?? 1000;
    setTimeout(() => {
      R.panel.classList.add('out');
      setTimeout(() => { R.wrap.remove(); flush(); }, 240);
    }, hold);
  }

  // ------------------------------------------------------------------ input
  window.addEventListener('keydown', (e) => {
    const R = run;
    if (!R || R.done) return;
    const k = U.keyName(e);
    if (k === 'escape') {
      if (R.opts.cancelable !== false) end(R, false, 'Cancelled');
      return;
    }
    if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab', 'enter'].includes(k)) e.preventDefault();
    R.held.add(k);
    if (e.repeat) return;
    for (const fn of R.handlers.keydown) {
      fn(k, e);
      if (R.done) break;
    }
  });
  window.addEventListener('keyup', (e) => {
    const R = run;
    if (!R || R.done) return;
    const k = U.keyName(e);
    R.held.delete(k);
    for (const fn of R.handlers.keyup) {
      fn(k, e);
      if (R.done) break;
    }
  });
  window.addEventListener('blur', () => run && run.held.clear());
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // ------------------------------------------------------------------ NUI bridge
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    switch (m.action) {
      case 'start':
        start(m.game, m.options || {});
        break;
      case 'stop':
        if (run) end(run, false, 'stopped', true);
        break;
      case 'config':
        if (m.accent !== undefined) settings.accent = m.accent;
        if (typeof m.volume === 'number') settings.volume = m.volume;
        if (m.scale !== undefined) settings.scale = m.scale || null;
        if (m.position) settings.position = m.position;
        break;
    }
  });

  const app = document.getElementById('app');

  window.MG = {
    U, sfx, ICONS, games, settings,
    register(id, def) { def.id = id; games[id] = def; },
    start,
    stop() { if (run) end(run, false, 'stopped', true); },
    get running() { return !!run; },
    inGame: !!RES,
  };

  window.addEventListener('DOMContentLoaded', () => post('ready', { games: Object.keys(games) }));
})();
