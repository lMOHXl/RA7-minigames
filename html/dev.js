/* Browser preview menu — only active outside FiveM. */
(() => {
  if (MG.inGame) return;
  document.body.classList.add('dev');
  const menu = MG.U.h('div', 'dev-menu', `
    <h1>MINIGAMES</h1>
    <p>Browser preview. In FiveM this menu is hidden and the page is fully transparent.</p>
    <div class="dev-row" data-diff>
      <button data-d="easy">Easy</button><button data-d="normal" class="on">Normal</button><button data-d="hard">Hard</button>
    </div>
    <div class="dev-list"></div>
    <div class="dev-row"><button data-random>Random</button></div>
    <div class="dev-log"></div>`);
  document.body.appendChild(menu);
  let diff = 'normal';
  menu.querySelectorAll('[data-d]').forEach((b) =>
    b.addEventListener('click', () => {
      diff = b.dataset.d;
      menu.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('on', x === b));
    })
  );
  const list = menu.querySelector('.dev-list');
  Object.entries(MG.games).forEach(([id, g]) => {
    const b = MG.U.h('button', '', `${g.title}<small>${id}</small>`);
    b.addEventListener('click', () => MG.start(id, { difficulty: diff }));
    list.appendChild(b);
  });
  menu.querySelector('[data-random]').addEventListener('click', () => MG.start('random', { difficulty: diff }));
  const log = menu.querySelector('.dev-log');
  window.addEventListener('mg:finish', (e) => {
    const r = e.detail;
    const line = MG.U.h('div', r.success ? 'ok' : 'bad', `${r.game} [${r.difficulty}] ${r.success ? 'OK' : 'FAIL'} · ${r.reason} · ${(r.time / 1000).toFixed(1)}s`);
    log.prepend(line);
  });
  const q = new URLSearchParams(location.search);
  if (q.get('scale')) MG.settings.scale = +q.get('scale');
  if (q.get('game')) MG.start(q.get('game'), { difficulty: q.get('d') || 'normal' });
})();
