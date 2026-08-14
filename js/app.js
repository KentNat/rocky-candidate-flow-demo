/* Rocky candidate flow — static design demo, no backend.
   Screen navigation + a scripted interview simulation, wired with plain DOM
   calls (mirrors the real app's classes/markup so the CSS applies unchanged). */

/* ---------------- theme ---------------- */
function currentTheme() {
  return localStorage.getItem('rockyTheme') === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-icon-mirror, #theme-icon').forEach((icon) => {
    icon.className = icon.className.replace(/fa-(moon|sun)/, theme === 'light' ? 'fa-sun' : 'fa-moon');
    if (!/fa-(moon|sun)/.test(icon.className)) {
      icon.classList.add(theme === 'light' ? 'fa-sun' : 'fa-moon');
    }
  });
  const logo = theme === 'light' ? 'assets/rocky_logo_on_light.svg' : 'assets/rocky_logo_on_dark.svg';
  ['logo-login', 'logo-checklist', 'logo-done'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.src = logo;
  });
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem('rockyTheme', next);
  applyTheme(next);
}

applyTheme(currentTheme());

/* ---------------- screen navigation ---------------- */
function goToScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  document.body.classList.toggle('is-live-call', id === 'screen-interview');
  window.scrollTo({ top: 0 });
}

function togglePasswordVisibility() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('pw-eye-icon');
  const isPw = input.type === 'password';
  input.type = isPw ? 'text' : 'password';
  icon.className = isPw ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
}

function handleLogin(event) {
  event.preventDefault();
  goToScreen('screen-checklist');
  return false;
}

/* ---------------- checklist → prepare overlay → interview ---------------- */
function startInterview() {
  const overlay = document.getElementById('prepare-overlay');
  const fill = document.getElementById('prepare-progress-fill');
  const label = document.getElementById('prepare-progress-label');
  overlay.hidden = false;
  overlay.classList.add('is-visible');

  const steps = [
    'Menghubungkan ke Rocky…',
    'Menyiapkan ruang interview…',
    'Memuat profil kandidat…',
    'Hampir siap…',
  ];
  let i = 0;
  fill.style.width = '0%';
  const interval = setInterval(() => {
    i += 1;
    fill.style.width = Math.min(100, i * 25) + '%';
    label.textContent = steps[Math.min(i, steps.length - 1)];
    if (i >= 4) {
      clearInterval(interval);
      setTimeout(() => {
        overlay.classList.remove('is-visible');
        overlay.hidden = true;
        goToScreen('screen-interview');
        startLiveCallSimulation();
      }, 400);
    }
  }, 350);
}

/* ---------------- live interview call simulation ---------------- */
const SCRIPT = [
  { speaker: 'bot', text: 'Halo Sarah! Saya Allham dari PT Cakra Tekno Nusantara. Mau ngobrol santai soal posisi Python Developer. Kabarmu gimana? Siap mulai?' },
  { speaker: 'candidate', text: 'Halo Allham, kabar baik! Saya siap untuk mulai interviewnya.' },
  { speaker: 'bot', text: 'Bagus! Bisa ceritakan pengalamanmu bekerja dengan Python, khususnya di proyek backend atau API?' },
  { speaker: 'candidate', text: 'Tentu. Saya sudah 3 tahun bekerja dengan Python, terutama menggunakan Django dan FastAPI untuk membangun REST API.' },
  { speaker: 'bot', text: 'Menarik. Bagaimana pendekatanmu saat men-debug masalah performa di endpoint API yang lambat?' },
  { speaker: 'candidate', text: 'Saya biasanya mulai dari profiling query database, cek masalah N+1 query, lalu tambahkan caching atau indexing bila perlu.' },
  { speaker: 'bot', text: 'Baik Sarah, terima kasih atas waktunya. Kami hargai jawabanmu. Sukses selalu untuk kariermu ke depannya. Sampai jumpa!' },
];

let scriptIndex = 0;
let timerInterval = null;
let timerSeconds = 59 * 60 + 46;

function formatTimer(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function startLiveCallSimulation() {
  scriptIndex = 0;
  timerSeconds = 59 * 60 + 46;
  document.getElementById('live-chat-thread').innerHTML = '';
  document.getElementById('timer-text').textContent = formatTimer(timerSeconds);

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timerSeconds = Math.max(0, timerSeconds - 1);
    document.getElementById('timer-text').textContent = formatTimer(timerSeconds);
  }, 1000);

  appendBotTurn();
}

function chatBubble(speaker, text) {
  const isBot = speaker === 'bot';
  const wrap = document.createElement('div');
  wrap.className = `rv-timeline-item ${isBot ? 'bot' : 'candidate'}`;
  wrap.style.cssText = 'display:flex;gap:10px;margin-bottom:14px';
  wrap.innerHTML = `
    <div class="rv-timeline-bubble" style="background:${isBot ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.15)'};border:1px solid ${isBot ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.2)'};padding:10px 14px;border-radius:12px;flex:1">
      <div class="rv-timeline-bubble-header" style="display:flex;justify-content:space-between;font-size:11px;color:#8fa0b8;margin-bottom:4px">
        <span class="rv-timeline-name" style="font-weight:600">${isBot ? 'Allham' : 'Anda'}</span>
        <span class="rv-timeline-badge ${isBot ? 'interviewer' : 'candidate'}" style="color:${isBot ? '#2f7fa6' : '#10b981'};font-weight:700">${isBot ? 'INTERVIEWER' : 'KANDIDAT'}</span>
      </div>
      <p class="rv-timeline-text" style="font-size:13px;line-height:1.5;margin:0">${text}</p>
    </div>`;
  return wrap;
}

function setTurn(turn) {
  const dot = document.getElementById('turn-dot');
  const title = document.getElementById('turn-title');
  const sub = document.getElementById('turn-sub');
  const micBtn = document.getElementById('mic-btn');
  const micCta = document.getElementById('mic-cta');
  const botWaves = document.getElementById('bot-waves');
  const botCard = document.getElementById('bot-card');
  const botStatus = document.getElementById('bot-status-text');

  if (turn === 'candidate') {
    dot.style.background = '#10b981';
    title.textContent = 'Giliran Anda';
    sub.textContent = 'Jawab dengan suara, lalu klik tombol untuk kirim';
    micBtn.disabled = false;
    micBtn.style.cursor = 'pointer';
    micBtn.style.background = '#10b981';
    micBtn.style.borderColor = '#10b981';
    micCta.textContent = 'Klik untuk menjawab (simulasi)';
    botWaves.classList.remove('is-visible');
    botCard.classList.remove('is-speaking');
    botStatus.textContent = 'AI Interviewer';
  } else {
    dot.style.background = '#2f7fa6';
    title.textContent = 'Giliran Allham';
    sub.textContent = 'Dengarkan pertanyaan dari Allham';
    micBtn.disabled = true;
    micBtn.style.cursor = 'not-allowed';
    micBtn.style.background = 'rgba(255,255,255,0.05)';
    micBtn.style.borderColor = 'rgba(255,255,255,0.1)';
    micCta.textContent = `Menunggu Allham selesai berbicara…`;
    botWaves.classList.add('is-visible');
    botCard.classList.add('is-speaking');
    botStatus.textContent = 'Berbicara…';
  }
}

function appendBotTurn() {
  if (scriptIndex >= SCRIPT.length) {
    finishInterview();
    return;
  }
  const turn = SCRIPT[scriptIndex];
  if (turn.speaker !== 'bot') {
    setTurn('candidate');
    return;
  }
  setTurn('bot');
  setTimeout(() => {
    document.getElementById('live-chat-thread').appendChild(chatBubble('bot', turn.text));
    document.getElementById('live-chat-thread').scrollTop = 999999;
    scriptIndex += 1;
    if (scriptIndex >= SCRIPT.length) {
      setTimeout(finishInterview, 900);
    } else {
      setTurn('candidate');
    }
  }, 1100);
}

function handleMicClick() {
  const turn = SCRIPT[scriptIndex];
  if (!turn || turn.speaker !== 'candidate') return;
  document.getElementById('live-chat-thread').appendChild(chatBubble('candidate', turn.text));
  document.getElementById('live-chat-thread').scrollTop = 999999;
  scriptIndex += 1;
  setTimeout(appendBotTurn, 500);
}

function finishInterview() {
  clearInterval(timerInterval);
  const thread = document.getElementById('done-chat-thread');
  thread.innerHTML = '';
  SCRIPT.forEach((turn) => {
    const isBot = turn.speaker === 'bot';
    const item = document.createElement('div');
    item.className = `rv-timeline-item ${isBot ? '' : 'candidate'}`;
    item.innerHTML = `
      <div class="rv-timeline-node"></div>
      <div class="rv-timeline-bubble">
        <div class="rv-timeline-bubble-header">
          <span class="rv-timeline-name">${isBot ? 'Allham' : 'Anda'}</span>
          <span class="rv-timeline-badge ${isBot ? 'interviewer' : 'candidate'}">${isBot ? 'INTERVIEWER' : 'KANDIDAT'}</span>
          <span class="rv-timeline-time"></span>
        </div>
        <p class="rv-timeline-text">${turn.text}</p>
      </div>`;
    thread.appendChild(item);
  });
  goToScreen('screen-done');
}
