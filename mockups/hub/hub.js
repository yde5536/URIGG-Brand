// 허브 시안 동작: 시계, 지지직 제목, 타임라인('지금' 고정), 터미널, 사이드바 칸 불러오기(날아가서 커짐 · Esc로 날아서 복귀),
// 아래 영역(D-day·알림·잔디·키워드), 설정(창 크기), 잠금 화면.
// 주소 뒤 ?scene=lock / summon / net / settings 로 그 장면을 바로 연다 (스크린샷용).
(() => {
  const D = window.HUB, $ = (s) => document.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const kst = (d = new Date()) => new Date(d.getTime() + (9 * 60 + d.getTimezoneOffset()) * 60000);
  const two = (n) => String(n).padStart(2, '0');
  const DAY = 86400000;
  const daysTo = (iso) => Math.round((new Date(iso + 'T00:00:00+09:00') - new Date(kst().toISOString().slice(0, 10) + 'T00:00:00+09:00')) / DAY);
  const ddLabel = (n) => (n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`);
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 사이드바 칸 목록 ─────────────────────────
     새 칸은 여기에 한 줄 더하면 된다: 사이드바 버튼, 'open <id>' 명령, Tab 자동 완성, 날아가는 움직임이 알아서 붙는다.
     id: 명령 이름 · title: 사이드바와 큰 칸의 제목 · status(): 제목 옆 상태 · body(): 가운데에 크게 그릴 내용 */
  const okMs = D.net.ms.filter((v) => v != null);
  const PANELS = [
    { id: 'news', title: 'Security News', status: () => ({ text: `${D.news.length}건` }),
      body: () => `<ol class="rows">${D.news.map((x) => `<li><span>${esc(x.s)}</span><span>${esc(x.t)}</span><time>${x.ago}</time></li>`).join('')}</ol>` },
    { id: 'kev', title: 'KEV', status: () => ({ text: '2 new', warn: true }),
      body: () => `<ol class="rows">${D.kev.map((x) => `<li><span>${esc(x.v)}</span><span>${esc(x.c)} · ${esc(x.p)}</span><time>${x.ago}</time></li>`).join('')}</ol>` },
    { id: 'vuln', title: 'Vuln', status: () => ({ text: D.vuln.alias }),
      body: () => `<div><p style="font-size:2.25rem;font-weight:700;letter-spacing:-0.03em">${esc(D.vuln.alias)}</p><p style="color:var(--u-muted);margin-top:4px">${D.vuln.cve} · ${esc(D.vuln.target)} · ${D.vuln.type} · CVSS ${D.vuln.cvss}</p><p style="margin-top:18px;font-size:var(--u-step-lead);line-height:1.6;max-width:60ch">${esc(D.vuln.desc)}</p></div>` },
    { id: 'ctf', title: 'CTF', status: () => ({ text: `${D.ctf.length}개 · 초보 ${D.ctf.filter((x) => x.beginner).length}` }),
      body: () => `<ul class="rows ctf">${D.ctf.map((x) => `<li><span>${esc(x.t)}${x.beginner ? '<b class="chip">초보</b>' : ''}</span><time>${x.when} · ${x.len}</time></li>`).join('')}</ul>` },
    { id: 'net', title: 'Network', status: () => ({ text: `${okMs.at(-1)} ms` }), body: () => netBig() },
  ];

  /* 시계 · 날짜 · D-day */
  const tick = () => {
    const t = kst();
    $('#clock').textContent = `${two(t.getHours())}:${two(t.getMinutes())}:${two(t.getSeconds())}`;
    $('#lock-clock').textContent = `${two(t.getHours())}:${two(t.getMinutes())}`;
    $('#date').textContent = `${t.getMonth() + 1}월 ${t.getDate()}일 ${WEEK[t.getDay()]}요일`;
  };
  tick(); setInterval(tick, 1000);
  // D-day: 하나가 메인. 아래 D-day 영역에서 메인 지정·삭제, 터미널에서 추가
  let dds = [{ ...D.dday.main, main: true }, ...D.dday.list.map((d) => ({ ...d }))];
  const mainDd = () => dds.find((d) => d.main) || dds[0];
  const mdLabel = (iso) => { const x = new Date(iso); return `${x.getMonth() + 1}월 ${x.getDate()}일`; };
  const drawSideDday = () => {
    const m = mainDd();
    $('#dday-main').textContent = m ? ddLabel(daysTo(m.date)) : '—';
    $('#dday-name').textContent = m ? `${m.title} · ${mdLabel(m.date)}` : 'D-day 없음';
  };
  drawSideDday();

  /* 지지직 제목: URIGG ↔ Security.log HUB, 15초마다 */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#';
  const title = $('#title');
  const scramble = (to) => {
    const len = Math.max(title.textContent.length, to.length), t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 700);
      title.textContent = [...Array(len)].map((_, i) => (i < to.length * k ? to[i] || '' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (k < 1) requestAnimationFrame(step); else title.textContent = to;
    };
    requestAnimationFrame(step);
  };
  let titleAt = 1; const TITLES = ['URIGG', 'Security.log HUB'];
  setInterval(() => { titleAt = 1 - titleAt; scramble(TITLES[titleAt]); }, 15000);

  /* 타임라인: '지금'은 위에서 1/3에 고정, 일정이 시간에 따라 위로 흐른다 (1시간 = 44px) */
  const tl = $('#timeline'), PX_H = 44;
  const drawTimeline = () => {
    const t = kst(), now = t.getHours() * 60 + t.getMinutes(), H = tl.clientHeight, nowY = H * 0.33;
    const y = (min) => nowY + ((min - now) / 60) * PX_H;
    $('#allday').innerHTML = D.today.filter((e) => e.allDay).map((e) => `<span>종일 · ${esc(e.title)}</span>`).join('');
    let html = '';
    // 시각 눈금이 '지금' 줄과 30분 안으로 가까우면 겹치므로 그리지 않는다
    for (const h of [0, 3, 6, 9, 12, 15, 18, 21, 24].filter((hh) => Math.abs(hh * 60 - now) > 30)) html +=`<div class="tl__item is-day" style="top:${y(h * 60)}px"><i></i><time>${two(h % 24)}:00</time><span>${h === 24 ? '내일' : ''}</span></div>`;
    for (const e of D.today.filter((x) => !x.allDay)) {
      const [hh, mm] = e.at.split(':').map(Number), min = hh * 60 + mm;
      html += `<div class="tl__item${min < now ? ' is-past' : ''}" style="top:${y(min)}px"><i></i><time>${e.at}</time><span>${esc(e.title)}</span></div>`;
    }
    D.tomorrow.forEach((e, i) => { html += `<div class="tl__item" style="top:${y(24 * 60 + 60 + i * 40)}px"><i></i><time>내일</time><span>${esc(e.title)}</span></div>`; });
    html += `<div class="tl__now"><i></i><b>지금 ${two(t.getHours())}:${two(t.getMinutes())}</b></div>`;
    tl.innerHTML = html;
  };
  drawTimeline(); setInterval(drawTimeline, 30000); addEventListener('resize', drawTimeline);

  /* Network 크게: 바탕화면 Network 탭의 정보 전부 + 지연 시간 꺾은선 */
  function netBig() {
    const W = 600, H = 200, max = Math.max(50, Math.ceil(Math.max(...okMs) / 50) * 50);
    const x = (i) => (i / (D.net.ms.length - 1)) * W, y = (v) => H - 4 - (v / max) * (H - 8);
    let d = '', pen = false, gaps = '';
    D.net.ms.forEach((v, i) => { if (v == null) { pen = false; gaps += `<line class="gap" x1="${x(i)}" x2="${x(i)}" y1="0" y2="${H}"/>`; return; } d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`; pen = true; });
    const avg = Math.round(okMs.reduce((a, b) => a + b, 0) / okMs.length), n = D.net;
    return `<div class="netbig">
      <dl>
        <div><dt>공인 IP</dt><dd class="ip">${n.ip}</dd></div>
        <div><dt>통신사</dt><dd>${n.isp} <span style="color:var(--u-muted)">AS${n.asn}</span></dd></div>
        <div><dt>위치</dt><dd>${n.city}, ${n.country}</dd></div>
        <div><dt>VPN·프록시</dt><dd>${n.vpn ? '사용 중 (추정)' : '안 씀 (추정)'}</dd></div>
        <div><dt>연결</dt><dd>${n.http} · ${n.tls} · Cloudflare ${n.colo}</dd></div>
        <div><dt>브라우저</dt><dd>${n.conn}</dd></div>
      </dl>
      <div class="chart">
        <div class="chart__head"><span>지연 시간 · 최근 30분 · 30초마다</span><b>${okMs.at(-1)} ms</b></div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line class="grid" x1="0" x2="${W}" y1="4" y2="4"/><line class="grid" x1="0" x2="${W}" y1="${H - 4}" y2="${H - 4}"/>${gaps}<path class="line" d="${d}"/></svg>
        <p class="chart__stats">최저 ${Math.min(...okMs)} · 평균 ${avg} · 최고 ${Math.max(...okMs)} ms · 눈금 ${max} ms · 점선은 끊긴 때</p>
      </div>
    </div>`;
  }

  /* 사이드바 유리 렌즈 (크롬·엣지): 웹 상단 바와 같은 방식. 가장자리 띠에서 뒤를 안쪽으로 당겨 굴절,
     빨강·초록·파랑을 조금씩 다르게 당겨 프리즘처럼 갈라지게 한다. 지도는 화면 배율만큼 키워 그린다 */
  if (window.chrome) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('style', 'position:absolute;width:0;height:0');
    svg.innerHTML = `<filter id="dock-lens" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feImage result="map" preserveAspectRatio="none"/>${
      [['r', 1, '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0'], ['g', 0.88, '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0'], ['b', 0.76, '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0']]
        .map(([c, k, m]) => `<feDisplacementMap in="SourceGraphic" in2="map" data-k="${k}" xChannelSelector="R" yChannelSelector="G"/><feColorMatrix type="matrix" values="${m}" result="${c}"/>`).join('')
    }<feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen" result="lens"/><feGaussianBlur in="lens" stdDeviation="1.2"/></filter>`;
    document.body.append(svg);
    const f = svg.querySelector('filter'), img = f.querySelector('feImage');
    const buildLens = () => {
      const el = $('.dock'), dpr = devicePixelRatio || 1, w = el.offsetWidth, h = el.offsetHeight;
      if (!w || !h) return;
      const W = Math.round(w * dpr), H = Math.round(h * dpr), R = 26, BAND = 34;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d'), data = ctx.createImageData(W, H);
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        // 둥근 사각형의 가장자리까지 거리와 바깥 방향
        const px = (xx + 0.5) / dpr - w / 2, py = (yy + 0.5) / dpr - h / 2;
        const qx = Math.abs(px) - (w / 2 - R), qy = Math.abs(py) - (h / 2 - R);
        let nx, ny, depth;
        if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy) || 1; depth = R - l; nx = Math.sign(px) * qx / l; ny = Math.sign(py) * qy / l; }
        else if (w / 2 - Math.abs(px) < h / 2 - Math.abs(py)) { depth = w / 2 - Math.abs(px); nx = Math.sign(px); ny = 0; }
        else { depth = h / 2 - Math.abs(py); nx = 0; ny = Math.sign(py); }
        const t = Math.max(0, 1 - depth / BAND), mag = t * t, i = (yy * W + xx) * 4;
        data.data[i] = 128 - nx * mag * 127; data.data[i + 1] = 128 - ny * mag * 127; data.data[i + 2] = 128; data.data[i + 3] = 255;
      }
      ctx.putImageData(data, 0, 0);
      for (const n of [f, img]) { n.setAttribute('x', 0); n.setAttribute('y', 0); n.setAttribute('width', W); n.setAttribute('height', H); }
      img.setAttribute('href', cv.toDataURL());
      f.querySelectorAll('feDisplacementMap').forEach((d) => d.setAttribute('scale', 70 * dpr * d.dataset.k));
    };
    buildLens();
    addEventListener('resize', buildLens);
    document.documentElement.classList.add('lens-on');
  }

  /* 사이드바 그리기 */
  const dock = $('#dock');
  dock.innerHTML = PANELS.map((p) => { const s = p.status(); return `<li><button type="button" class="dock__item" data-id="${p.id}"><b>${esc(p.title)}</b><span class="${s.warn ? 'is-warn' : ''}">${esc(s.text)}</span></button></li>`; }).join('');
  dock.addEventListener('click', (e) => { const b = e.target.closest('.dock__item'); if (b) summon(b.dataset.id); });

  /* 불러오기: 사이드바 버튼 자리에서 터미널 자리로 날아가며 커진다. Esc면 반대로 */
  const stage = $('#stage');
  let open = null, flying = false;
  const FLY = 420;
  const flyFrames = (from, to) => [
    { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0.6 },
    { transform: 'none', opacity: 1 },
  ];
  function summon(id) {
    const p = PANELS.find((x) => x.id === id);
    if (!p || flying || open === id) return;
    if (open) back(true);
    const btn = dock.querySelector(`[data-id="${id}"]`);
    const el = document.createElement('article');
    el.className = 'u-tile big';
    el.innerHTML = `<div class="u-tile__head"><h2 class="u-tile__title" style="font-size:1.75rem">${esc(p.title)}</h2><button type="button" class="big__esc"><kbd>Esc</kbd> 터미널로</button></div><div class="big__body">${p.body()}</div>`;
    el.querySelector('.big__esc').onclick = () => back();
    stage.append(el);
    stage.classList.add('is-summoned');
    btn.classList.add('is-away');
    open = id;
    if (!reduced) {
      flying = true;
      el.animate(flyFrames(btn.getBoundingClientRect(), el.getBoundingClientRect()), { duration: FLY, easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)' }).onfinish = () => { flying = false; };
      el.querySelector('.big__body').animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: FLY });
    }
  }
  function back(instant) {
    if (!open) return;
    const el = stage.querySelector('.big'), btn = dock.querySelector(`[data-id="${open}"]`);
    open = null;
    stage.classList.remove('is-summoned');
    const done = () => { el.remove(); btn.classList.remove('is-away'); $('#cmd')?.focus(); };
    if (reduced || instant) { flying = false; return done(); }
    flying = true;
    // 돌아갈 때: 들어올 때와 같은 시간, 처음과 끝이 모두 부드러운 곡선 (끝에서 급하게 빨라지지 않게)
    el.querySelector('.big__body').animate([{ opacity: 1 }, { opacity: 0, offset: 0.35 }, { opacity: 0 }], { duration: FLY + 60, fill: 'forwards' });
    el.animate(flyFrames(btn.getBoundingClientRect(), el.getBoundingClientRect()).reverse(), { duration: FLY + 60, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' }).onfinish = () => { flying = false; done(); };
  }

  /* 단축키 */
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!$('#settings').hidden) $('#settings').hidden = true; else back(); }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); lock(); }
    if (e.ctrlKey && e.key === ',') { e.preventDefault(); $('#settings').hidden = false; }
  });

  /* 터미널 (명령어는 나중에 정함, 지금은 예시) */
  const body = $('#term-body');
  const PS1 = '<span class="ps1"><b>urigg@hub</b>:<em>~</em>$</span>';
  const t0 = kst();
  body.innerHTML = `<p class="muted">Last login: ${WEEK[t0.getDay()]} ${t0.getMonth() + 1}/${t0.getDate()} 09:12 on hub</p>`;
  const inputRow = document.createElement('p');
  inputRow.className = 'term__input';
  inputRow.innerHTML = `${PS1}<input id="cmd" aria-label="명령어" autocomplete="off" spellcheck="false">`;
  body.append(inputRow);
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'help 명령 목록 · open <칸> 크게 보기 · Tab 자동 완성 · ↑↓ 이전 명령 · Esc 터미널로';
  body.append(hint);
  const line = (html, cls = '') => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; inputRow.before(p); body.scrollTop = body.scrollHeight; };
  const IDS = PANELS.map((p) => p.id);
  const CMDS = {
    help: () => [`open <칸>      칸을 가운데로   (${IDS.join(' · ')})`, 'today          오늘 일정', 'dday           D-day 목록   dday add <이름> <YYYY-MM-DD>', 'status · kw · ip · ping · lock · clear', '<span class="muted">명령어는 아직 정하는 중 (시안)</span>'].join('\n'),
    status: () => [`오늘 일정 ${D.today.length}개`, '<span class="warn">KEV 새 항목 2</span>  Ivanti Connect Secure', '<span class="ok">초보 CTF</span>  CSCTF 2026 · 11/6 22:00 시작 (D-3)', `${mainDd().title} ${ddLabel(daysTo(mainDd().date))}`].join('\n'),
    today: () => D.today.map((e) => `${e.allDay ? ' 종일' : e.at}  ${esc(e.title)}`).join('\n'),
    dday: (a) => {
      if (a[0] === 'add') {
        const date = a.at(-1), name = a.slice(1, -1).join(' ');
        if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '<span class="warn">사용법: dday add 이름 YYYY-MM-DD</span>';
        dds.push({ title: name, date }); drawDdays();
        return `<span class="ok">✓</span> D-day 추가: ${esc(name)} · ${ddLabel(daysTo(date))}  <span class="muted">(아래 D-day에도 들어갔어요)</span>`;
      }
      return dds.map((d) => `${ddLabel(daysTo(d.date)).padEnd(6)}  ${esc(d.title)}${d.main ? ' · 메인' : ''}  <span class="muted">${d.date}</span>`).join('\n');
    },
    kw: () => `<b>${esc(D.keyword[0])}</b>  <span class="muted">${esc(D.keyword[1])}</span>\n${esc(D.keyword[2])}`,
    ip: () => `${D.net.ip}  <span class="muted">${D.net.isp} · VPN 안 씀 (추정)</span>`,
    ping: () => `cloudflare  ${okMs.at(-1)} ms`,
    open: (a) => {
      const k = a[0];
      if (['cal', 'calendar', 'dday', 'today', 'alerts', 'kw', 'grass'].includes(k)) return '그건 가운데로 불러오지 않아요. 아래로 스크롤하면 있어요.';
      if (!IDS.includes(k)) return `<span class="warn">open: 모르는 칸 '${esc(k || '')}'</span>  <span class="muted">${IDS.join(' · ')}</span>`;
      setTimeout(() => summon(k), 40);
      return `<span class="muted">${k} → 가운데 · Esc로 돌아와요</span>`;
    },
    lock: () => { setTimeout(lock, 200); return '<span class="muted">잠그는 중…</span>'; },
    clear: () => { body.querySelectorAll('p:not(.term__input):not(.hint)').forEach((p) => p.remove()); return null; },
  };
  const history = []; let hAt = 0;
  const exec = (raw) => {
    const [c, ...a] = raw.trim().split(/\s+/);
    line(`${PS1} ${esc(raw)}`);
    if (!c) return;
    const out = CMDS[c] ? CMDS[c](a) : `<span class="warn">bash: ${esc(c)}: command not found</span>`;
    if (out) line(out);
  };
  const cmd = $('#cmd');
  cmd.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const v = cmd.value; if (v.trim()) { history.push(v); hAt = history.length; } cmd.value = ''; exec(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hAt > 0) cmd.value = history[--hAt]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hAt = Math.min(history.length, hAt + 1); cmd.value = history[hAt] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = cmd.value.split(' '), last = parts.at(-1), pool = parts.length === 1 ? Object.keys(CMDS) : parts[0] === 'open' ? IDS : [];
      const hit = pool.filter((x) => x.startsWith(last));
      if (hit.length === 1) { parts[parts.length - 1] = hit[0]; cmd.value = parts.join(' ') + ' '; } else if (hit.length > 1) line(hit.join('  '), 'muted');
    }
  });
  body.addEventListener('click', () => cmd.focus());

  /* 아래: D-day · 알림 · 잔디 · 키워드 */
  // 웹·바탕화면 D-day 칸과 같은 모양: 메인은 크게, 나머지는 목록 (메인 지정 · 삭제)
  function drawDdays() {
    const m = mainDd();
    $('#dday-big').innerHTML = m
      ? `<p class="dday__big">${ddLabel(daysTo(m.date))}</p><div><p class="dday__name">${esc(m.title)}</p><p class="dday__date">${mdLabel(m.date)} · 메인</p></div>`
      : '<p class="dday__date">D-day가 없어요. 아래에서 추가하세요.</p>';
    $('#dday-list').innerHTML = dds.filter((d) => d !== m).sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => `<li data-i="${dds.indexOf(d)}"><b>${ddLabel(daysTo(d.date))}</b><span>${esc(d.title)}</span><time>${mdLabel(d.date)}</time><button type="button" class="dday__btn" data-act="main">메인</button><button type="button" class="dday__btn" data-act="del" aria-label="삭제">×</button></li>`).join('');
    drawSideDday();
  }
  $('#dday-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.closest('li').dataset.i;
    if (b.dataset.act === 'main') dds.forEach((d, k) => { d.main = k === i; });
    else dds.splice(i, 1);
    drawDdays();
  });
  drawDdays();
  $('#alert-rows').innerHTML = D.alerts.map((a) => `<li class="${a.warn ? 'is-warn' : ''}"><b>${a.warn ? '!' : '·'}</b><span>${esc(a.text)}</span><time>${a.time}</time></li>`).join('');
  $('#btn-alerts').onclick = () => $('#alerts-section').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  $('#kw-term').textContent = D.keyword[0];
  $('#kw-name').textContent = D.keyword[1];
  $('#kw-desc').textContent = D.keyword[2];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  $('#grass').innerHTML = Array.from({ length: 53 * 7 }, (_, i) => { const v = rnd() * (i / 7 > 40 ? 1.3 : 0.7); return `<i class="${v > 0.95 ? 'l3' : v > 0.75 ? 'l2' : v > 0.5 ? 'l1' : ''}"></i>`; }).join('');

  /* 설정: 창 크기 (시안은 화면 폭을 그 크기로 줄여 보여 줌) */
  $('#btn-settings').onclick = () => { $('#settings').hidden = !$('#settings').hidden; };
  $('#settings-close').onclick = () => { $('#settings').hidden = true; };
  $('#win-size').onchange = (e) => {
    const v = e.target.value;
    $('.hub').style.maxWidth = v === 'fit' ? '' : `${v.split('x')[0]}px`;
    drawTimeline();
  };

  /* 잠금: 뒤 화면은 스크롤 안 됨 */
  const lockEl = $('#lock'), pin = $('#pin');
  function lock() { back(true); $('#settings').hidden = true; scrollTo(0, 0); lockEl.hidden = false; document.body.classList.add('is-locked'); pin.value = ''; setTimeout(() => pin.focus(), 50); }
  pin.addEventListener('input', () => { pin.value = pin.value.replace(/\D/g, ''); if (pin.value.length === 6) { lockEl.hidden = true; document.body.classList.remove('is-locked'); cmd.focus(); } });
  $('#btn-lock').onclick = lock;

  // 처음 열었을 때 보이는 예시 기록
  ['status', 'today'].forEach(exec);
  const scene = new URLSearchParams(location.search).get('scene');
  if (scene === 'lock') lock();
  else if (scene === 'summon') summon('kev');
  else if (scene === 'net') summon('net');
  else if (scene === 'settings') $('#settings').hidden = false;
  else cmd.focus();
})();
