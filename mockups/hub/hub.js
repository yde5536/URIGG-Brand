// 허브 시안 동작: 시계, 지지직 제목, 타임라인('지금' 고정), 터미널 명령, 칸 불러오기(Esc로 복귀), 잠금 화면.
// 주소 뒤 ?scene=lock 은 잠금 화면, ?scene=summon 은 KEV를 불러온 상태로 연다 (스크린샷용).
(() => {
  const D = window.HUB, $ = (s) => document.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const kst = (d = new Date()) => new Date(d.getTime() + (9 * 60 + d.getTimezoneOffset()) * 60000);
  const two = (n) => String(n).padStart(2, '0');
  const DAY = 86400000;
  const daysTo = (iso) => Math.round((new Date(iso + 'T00:00:00+09:00') - new Date(kst().toISOString().slice(0, 10) + 'T00:00:00+09:00')) / DAY);
  const ddLabel = (n) => (n === 0 ? 'D-DAY' : n > 0 ? `D-${n}` : `D+${-n}`);

  /* 시계 · 날짜 · D-day */
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  const tick = () => {
    const t = kst();
    $('#clock').textContent = `${two(t.getHours())}:${two(t.getMinutes())}:${two(t.getSeconds())}`;
    $('#lock-clock').textContent = `${two(t.getHours())}:${two(t.getMinutes())}`;
    $('#date').textContent = `${t.getMonth() + 1}월 ${t.getDate()}일 ${WEEK[t.getDay()]}요일`;
  };
  tick(); setInterval(tick, 1000);
  const main = D.dday.main, md = new Date(main.date);
  $('#dday-main').textContent = ddLabel(daysTo(main.date));
  $('#dday-name').textContent = `${main.title} · ${md.getMonth() + 1}월 ${md.getDate()}일`;

  /* 지지직 제목: URIGG ↔ Security.log HUB, 15초마다 */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#';
  const title = $('#title');
  const scramble = (to) => {
    const from = title.textContent, len = Math.max(from.length, to.length), t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 700);
      title.textContent = [...Array(len)].map((_, i) => (i < to.length * k ? to[i] || '' : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
      if (k < 1) requestAnimationFrame(step); else title.textContent = to;
    };
    requestAnimationFrame(step);
  };
  let titleAt = 1; const TITLES = ['URIGG', 'Security.log HUB'];
  setInterval(() => { titleAt = 1 - titleAt; scramble(TITLES[titleAt]); }, 15000);

  /* 타임라인: '지금'은 위에서 1/3에 고정, 일정은 시간에 따라 위로 흐른다 (1시간 = 46px) */
  const tl = $('#timeline'), PX_H = 46;
  const drawTimeline = () => {
    const t = kst(), now = t.getHours() * 60 + t.getMinutes(), H = tl.clientHeight, nowY = H * 0.33;
    const items = D.today.filter((e) => !e.allDay).map((e) => { const [h, m] = e.at.split(':').map(Number); return { ...e, min: h * 60 + m }; });
    const y = (min) => nowY + ((min - now) / 60) * PX_H;
    $('#allday').innerHTML = D.today.filter((e) => e.allDay).map((e) => `<span>종일 · ${esc(e.title)}</span>`).join('');
    let html = '';
    for (const h of [0, 3, 6, 9, 12, 15, 18, 21, 24]) html += `<div class="tl__item is-day" style="top:${y(h * 60)}px"><i></i><time>${two(h % 24)}:00</time><span>${h === 24 ? '내일' : ''}</span></div>`;
    for (const e of items) html += `<div class="tl__item${e.min < now ? ' is-past' : ''}" style="top:${y(e.min)}px"><i></i><time>${e.at}</time><span>${esc(e.title)}</span></div>`;
    D.tomorrow.forEach((e, i) => { html += `<div class="tl__item" style="top:${y(24 * 60 + 60 + i * 40)}px"><i></i><time>11/4</time><span>${esc(e.title)}</span></div>`; });
    html += `<div class="tl__now"><i></i><b>지금 ${two(t.getHours())}:${two(t.getMinutes())}</b></div>`;
    tl.innerHTML = html;
  };
  drawTimeline(); setInterval(drawTimeline, 30000); addEventListener('resize', drawTimeline);

  /* 오른쪽 칸들 */
  const newsRows = (n = 6) => D.news.slice(0, n).map((x) => `<li><span>${esc(x.s)}</span><span>${esc(x.t)}</span><time>${x.ago}</time></li>`).join('');
  const ctfRows = (n = 4) => D.ctf.slice(0, n).map((x) => `<li><span>${esc(x.t)}${x.beginner ? '<b class="chip">초보</b>' : ''}</span><time>${x.when} · ${x.len}</time></li>`).join('');
  const alertRows = () => D.alerts.map((a) => `<li class="${a.warn ? 'is-warn' : ''}"><b>${a.warn ? '!' : '·'}</b><span>${esc(a.text)}</span><time>${a.time}</time></li>`).join('');
  const keyHtml = (size) => D.shortcuts.map((k, i) => `<a class="u-key" href="#"><span class="u-key__glass"${size ? ` style="width:${size}px"` : ''}><img src="../../icons/${k}.svg" alt=""></span>${D.shortcutNames[i]}</a>`).join('');
  const sparkPath = (ms, w = 240, h = 40) => { const max = Math.max(50, ...ms); return ms.map((v, i) => `${i ? 'L' : 'M'}${(i / (ms.length - 1)) * w} ${h - 3 - (v / max) * (h - 6)}`).join(''); };
  $('#news-rows').innerHTML = newsRows(D.news.length);
  $('#ctf-rows').innerHTML = ctfRows();
  $('#alert-rows').innerHTML = alertRows();
  $('#keys').innerHTML = keyHtml();
  $('#kw-term').textContent = D.keyword[0];
  $('#kw-name').textContent = D.keyword[1];
  $('#spark').innerHTML = `<path d="${sparkPath(D.net.ms)}"/>`;
  $('#net-ms').textContent = `${D.net.ms.at(-1)} ms`;
  document.querySelectorAll('.u-tabs').forEach((g) => {
    const pill = g.querySelector('.u-tabs__pill'), on = g.querySelector('[aria-selected="true"]');
    const move = () => { pill.style.width = `${on.offsetWidth}px`; pill.style.transform = `translateX(${on.offsetLeft}px)`; };
    document.fonts?.ready.then(move); move();
  });

  /* 불러온 칸의 큰 모습 */
  const BIG = {
    news: ['Security News', `<ol class="rows">${newsRows(D.news.length)}</ol>`],
    kev: ['KEV · 실제 악용 중인 취약점', `<ol class="rows">${D.kev.map((x) => `<li><span>${esc(x.v)}</span><span>${esc(x.c)} · ${esc(x.p)}</span><time>${x.ago}</time></li>`).join('')}</ol>`],
    vuln: [`Vuln · ${D.vuln.alias}`, `<div class="rows"><p class="muted" style="color:var(--u-muted)">${D.vuln.cve} · ${esc(D.vuln.target)} · ${D.vuln.type} · CVSS ${D.vuln.cvss}</p><p style="margin-top:14px;font-size:var(--u-step-lead);line-height:1.6;max-width:62ch">${esc(D.vuln.desc)}</p></div>`],
    ctf: ['CTF · 다가오는 대회', `<ul class="rows" id="big-ctf">${ctfRows(4)}</ul>`],
    alerts: ['알림', `<ul class="rows alerts">${alertRows()}</ul>`],
    keyword: ['Keyword · 오늘의 보안 키워드', `<div><p style="font-size:3.5rem;font-weight:700;letter-spacing:-0.04em">${esc(D.keyword[0])}</p><p style="color:var(--u-muted)">${esc(D.keyword[1])}</p><p style="margin-top:18px;font-size:var(--u-step-lead)">${esc(D.keyword[2])}</p></div>`],
    net: ['Network · 지연 시간', `<div><p class="net-ip" style="font-size:2rem">${D.net.ip} <span style="font-family:var(--u-font);font-size:1rem;color:var(--u-muted)">${D.net.isp}</span></p><svg class="spark" viewBox="0 0 600 160" preserveAspectRatio="none" style="height:55%;margin-top:24px"><path d="${sparkPath(D.net.ms, 600, 160)}"/></svg></div>`],
    shortcuts: ['Shortcuts', `<div class="keys" style="grid-template-columns:repeat(9,1fr);align-content:center;height:100%">${keyHtml(96)}</div>`],
  };
  const SLOT_OF = { news: 'news', kev: 'news', vuln: 'news', ctf: 'ctf', alerts: 'alerts', keyword: 'keyword', net: 'net', shortcuts: 'shortcuts' };
  const stage = $('#stage');
  let open = null;
  const back = () => {
    if (!open) return;
    stage.querySelector('.big')?.remove();
    document.querySelector(`.slot[data-key="${SLOT_OF[open]}"]`)?.classList.remove('is-away');
    stage.classList.remove('is-summoned');
    open = null;
    $('#cmd')?.focus();
  };
  const summon = (key) => {
    back();
    const [name, body] = BIG[key];
    const el = document.createElement('article');
    el.className = 'u-tile big';
    el.innerHTML = `<div class="u-tile__head"><h2 class="u-tile__title" style="font-size:1.75rem">${esc(name)}</h2><button type="button" class="big__esc"><kbd>Esc</kbd> 터미널로</button></div>${body}`;
    el.querySelector('.big__esc').onclick = back;
    stage.append(el);
    stage.classList.add('is-summoned');
    document.querySelector(`.slot[data-key="${SLOT_OF[key]}"]`)?.classList.add('is-away');
    open = key;
  };
  document.querySelectorAll('.slot').forEach((s) => s.addEventListener('click', (e) => { if (!e.target.closest('a')) summon(s.dataset.key); }));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') back();
    if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); lock(); }
  });

  /* 터미널 */
  const body = $('#term-body');
  const PS1 = '<span class="ps1"><b>urigg@hub</b> <em>~ %</em></span>';
  const line = (html, cls = '') => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; inputRow.before(p); body.scrollTop = body.scrollHeight; };
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

  const NAMES = Object.keys(BIG);
  const RUN = { vmware: 'VMware', explorer: '파일 탐색기', code: 'VS Code', chrome: 'Chrome', claude: 'Claude' };
  const CMDS = {
    help: () => [
      'open <칸>        칸을 가운데로 크게   (news · kev · vuln · ctf · alerts · keyword · net · shortcuts)',
      'back            터미널로 돌아오기 (Esc)',
      'status          오늘 요약',
      'today           오늘 일정',
      'dday            D-day 목록     dday add <이름> <YYYY-MM-DD>',
      'ip · ping       내 공인 IP, 지금 지연 시간',
      'kw · vuln       오늘의 키워드, 취약점 해설',
      'run <앱>        vmware · explorer · code · chrome · claude',
      'lock · clear',
    ].map(esc).join('\n'),
    status: () => {
      const next = D.today.filter((e) => !e.allDay).map((e) => e).find((e) => e.at > `${two(kst().getHours())}:${two(kst().getMinutes())}`);
      return [
        `오늘 일정 ${D.today.length}개${next ? ` · 다음 <b>${next.at} ${esc(next.title)}</b>` : ''}`,
        `<span class="warn">KEV 새 항목 2</span>  Ivanti Connect Secure`,
        `<span class="ok">초보 CTF</span>  CSCTF 2026 · 11/6 22:00 시작 (D-3)`,
        `${main.title} ${ddLabel(daysTo(main.date))}`,
      ].join('\n');
    },
    today: () => D.today.map((e) => `${e.allDay ? ' 종일 ' : e.at}  ${esc(e.title)}`).join('\n'),
    dday: (args) => {
      if (args[0] === 'add') {
        const date = args.at(-1), name = args.slice(1, -1).join(' ');
        if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return '<span class="warn">사용법: dday add 이름 YYYY-MM-DD</span>';
        D.dday.list.push({ title: name, date }); drawDdays();
        return `<span class="ok">✓</span> D-day 추가: ${esc(name)} · ${ddLabel(daysTo(date))}  <span class="muted">(아래 달력 칸에도 들어갔어요)</span>`;
      }
      return [main, ...D.dday.list].map((d) => `${ddLabel(daysTo(d.date)).padEnd(6)}  ${esc(d.title)}  <span class="muted">${d.date}</span>`).join('\n');
    },
    ip: () => `${D.net.ip}  <span class="muted">${D.net.isp} · VPN 안 씀 (추정)</span>`,
    ping: () => `cloudflare  ${D.net.ms.at(-1)} ms  <span class="muted">최근 30분 평균 ${Math.round(D.net.ms.reduce((a, b) => a + b, 0) / D.net.ms.length)} ms</span>`,
    kw: () => `<b>${esc(D.keyword[0])}</b>  <span class="muted">${esc(D.keyword[1])}</span>\n${esc(D.keyword[2])}`,
    vuln: () => `<b>${D.vuln.alias}</b>  <span class="muted">${D.vuln.cve} · CVSS ${D.vuln.cvss}</span>\n${esc(D.vuln.desc)}`,
    run: (args) => (RUN[args[0]] ? `<span class="ok">↗</span> ${RUN[args[0]]} 실행  <span class="muted">(시안이라 실제로는 열지 않아요)</span>` : `<span class="warn">run: 모르는 앱 '${esc(args[0] || '')}'</span>`),
    open: (args) => {
      const k = args[0];
      if (k === 'cal' || k === 'calendar' || k === 'dday') return '달력과 D-day 설정은 가운데로 불러오지 않아요. 아래로 스크롤하면 있어요. <span class="muted">(today, dday 명령은 여기서 돼요)</span>';
      if (!BIG[k]) return `<span class="warn">open: 모르는 칸 '${esc(k || '')}'</span>  <span class="muted">${NAMES.join(' · ')}</span>`;
      setTimeout(() => summon(k), 60);
      return `<span class="muted">${k} 칸을 가운데로 불러왔어요 · Esc로 돌아와요</span>`;
    },
    back: () => { back(); return ''; },
    lock: () => { setTimeout(lock, 200); return '<span class="muted">잠그는 중…</span>'; },
    clear: () => { body.querySelectorAll('p:not(.term__input):not(.hint)').forEach((p) => p.remove()); return null; },
  };
  const history = []; let hAt = 0;
  const exec = (raw) => {
    const [cmd, ...args] = raw.trim().split(/\s+/);
    line(`${PS1} ${esc(raw)}`);
    if (!cmd) return;
    const out = CMDS[cmd] ? CMDS[cmd](args) : `<span class="warn">zsh: command not found: ${esc(cmd)}</span>  <span class="muted">help 를 쳐 보세요</span>`;
    if (out) line(out);
  };
  const cmd = $('#cmd');
  cmd.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const v = cmd.value; if (v.trim()) { history.push(v); hAt = history.length; } cmd.value = ''; exec(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hAt > 0) cmd.value = history[--hAt]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hAt = Math.min(history.length, hAt + 1); cmd.value = history[hAt] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = cmd.value.split(' '), last = parts.at(-1), pool = parts.length === 1 ? Object.keys(CMDS) : parts[0] === 'open' ? NAMES : parts[0] === 'run' ? Object.keys(RUN) : [];
      const hit = pool.filter((x) => x.startsWith(last));
      if (hit.length === 1) { parts[parts.length - 1] = hit[0]; cmd.value = parts.join(' ') + ' '; }
      else if (hit.length > 1) line(hit.join('  '), 'muted');
    }
  });
  body.addEventListener('click', () => cmd.focus());

  /* 아래: 달력 + D-day 설정 */
  const drawMonth = () => {
    const t = kst(), y = t.getFullYear(), m = t.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const evs = { [t.getDate()]: D.today.map((e) => e.title), 4: D.tomorrow.map((e) => e.title) };
    const dd = {}; [main, ...D.dday.list].forEach((d) => { const x = new Date(d.date); if (x.getMonth() === m) dd[x.getDate()] = d.title; });
    let html = WEEK.map((w) => `<span>${w}</span>`).join('');
    for (let i = 0; i < first; i++) html += '<div class="is-out"></div>';
    for (let d = 1; d <= days; d++) {
      html += `<div class="${d === t.getDate() ? 'is-today' : ''}"><b>${d}</b>${dd[d] ? `<em class="is-dday">${esc(dd[d])}</em>` : ''}${(evs[d] || []).slice(0, 2).map((s) => `<em>${esc(s)}</em>`).join('')}</div>`;
    }
    const rest = (7 - ((first + days) % 7)) % 7;
    for (let i = 0; i < rest; i++) html += '<div class="is-out"></div>';
    $('#month').innerHTML = html;
  };
  const drawDdays = () => {
    $('#dday-list').innerHTML = [main, ...D.dday.list].sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => `<li class="${d === main ? 'is-main' : ''}"><b>${ddLabel(daysTo(d.date))}</b><span>${esc(d.title)}${d === main ? ' · 메인' : ''}</span><time>${d.date.slice(5).replace('-', '/')}</time></li>`).join('');
    drawMonth();
  };
  drawDdays();

  /* 잔디 1년 (시안: 고정된 무작위 값) */
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  $('#grass').innerHTML = Array.from({ length: 53 * 7 }, (_, i) => { const w = i / 7; const v = rnd() * (w > 40 ? 1.3 : 0.7); return `<i class="${v > 0.95 ? 'l3' : v > 0.75 ? 'l2' : v > 0.5 ? 'l1' : ''}"></i>`; }).join('');

  /* 잠금 화면 */
  const lockEl = $('#lock'), pin = $('#pin');
  function lock() { back(); lockEl.hidden = false; pin.value = ''; setTimeout(() => pin.focus(), 50); }
  pin.addEventListener('input', () => { pin.value = pin.value.replace(/\D/g, ''); if (pin.value.length === 6) { lockEl.hidden = true; cmd.focus(); } });
  $('#btn-lock').onclick = lock;

  // 처음 열었을 때 보이는 예시 기록 (달력 그리기가 준비된 뒤에)
  ['status', 'today', 'dday add 기말고사 2026-12-01'].forEach(exec);

  const scene = new URLSearchParams(location.search).get('scene');
  if (scene === 'lock') lock();
  else if (scene === 'summon') summon('kev');
  else cmd.focus();
})();
