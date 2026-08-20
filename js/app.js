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
  document.querySelectorAll('.theme-toggle input[type="checkbox"]').forEach((cb) => {
    cb.checked = theme === 'dark';
  });
  const logo = theme === 'light' ? 'assets/rocky_logo_on_light.svg' : 'assets/rocky_logo_on_dark.svg';
  ['logo-login', 'logo-done'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.src = logo;
  });
  // Checklist/questionnaire screens sit on rocky-ui.css's own --card surface
  // (light in light mode, dark elevated in dark mode) rather than the
  // candidate app's always-dark rv-bg, so their logos need the same
  // light/dark swap as the login/done screens -- just via a shared class
  // since there can be more than one per screen (topbar + job-mini card).
  document.querySelectorAll('.js-logo-swap').forEach((el) => {
    el.src = logo;
  });
}

function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem('rockyTheme', next);
  applyTheme(next);
}

applyTheme(currentTheme());

/* ---------------- live-call mic/speaker toggles ---------------- */
let hudMicOn = true;
let hudSpeakerOn = true;
function toggleHudMic() {
  hudMicOn = !hudMicOn;
  const btn = document.getElementById('hud-mic-toggle');
  btn.classList.toggle('is-off', !hudMicOn);
  btn.innerHTML = mi(hudMicOn ? 'mic' : 'mic_off', 14);
  btn.setAttribute('aria-label', hudMicOn ? 'Matikan mikrofon' : 'Nyalakan mikrofon');
}
function toggleHudSpeaker() {
  hudSpeakerOn = !hudSpeakerOn;
  const btn = document.getElementById('hud-speaker-toggle');
  btn.classList.toggle('is-off', !hudSpeakerOn);
  btn.innerHTML = mi(hudSpeakerOn ? 'volume_up' : 'volume_off', 14);
  btn.setAttribute('aria-label', hudSpeakerOn ? 'Matikan speaker' : 'Nyalakan speaker');
}

/* ---------------- screen navigation ---------------- */
function goToScreen(id) {
  const leavingQuestionnaire = document.getElementById('screen-questionnaire').classList.contains('is-active') && id !== 'screen-questionnaire';
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  document.body.classList.toggle('is-live-call', id === 'screen-interview');
  if (id === 'screen-questionnaire') resetQuestionnaireTimer();
  if (leavingQuestionnaire) stopQuestionnaireTimer();
  window.scrollTo({ top: 0 });
}

/* ---------------- 4-stage journey indicator (checklist + questionnaire) ---------------- */
const JOURNEY_STAGES = ['Persiapan', 'Pertanyaan', 'Interview', 'Selesai'];

function renderJourney(containerId, activeIndex) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = JOURNEY_STAGES.map((label, i) => {
    const state = i < activeIndex ? 'is-done' : i === activeIndex ? 'is-active' : '';
    const sep = i < JOURNEY_STAGES.length - 1 ? '<span class="pf-journey-sep"></span>' : '';
    return `<span class="pf-journey-step ${state}"><span class="pf-journey-dot"></span>${label}</span>${sep}`;
  }).join('');
}

renderJourney('journey-checklist', 0);
renderJourney('journey-questionnaire', 1);

function togglePasswordVisibility() {
  const input = document.getElementById('login-password');
  const icon = document.getElementById('pw-eye-icon');
  const isPw = input.type === 'password';
  input.type = isPw ? 'text' : 'password';
  icon.innerHTML = mi(isPw ? 'visibility_off' : 'visibility', 16);
}

function handleLogin(event) {
  event.preventDefault();
  goToScreen('screen-checklist');
  return false;
}

/* ---------------- checklist wizard (5 equipment-check steps) ---------------- */
const PF_STEP_COUNT = 5;

function goToPfStep(step) {
  document.querySelectorAll('.pf-step-item').forEach((item) => {
    const n = Number(item.dataset.step);
    item.classList.toggle('active', n === step);
  });
  document.querySelectorAll('.pf-step-panel').forEach((panel) => {
    panel.classList.toggle('is-active', Number(panel.dataset.panel) === step);
  });
  document.getElementById('screen-checklist').scrollTop = 0;
  const scrollEl = document.querySelector('#screen-checklist .pf-scroll');
  if (scrollEl) scrollEl.scrollTop = 0;
}

function completePfStep(step) {
  const item = document.querySelector(`.pf-step-item[data-step="${step}"]`);
  if (item) item.classList.add('done');
  if (step < PF_STEP_COUNT) {
    goToPfStep(step + 1);
  }
}

/* ---------------- pre-interview questionnaire (from HR) ---------------- */
const answeredQuestions = new Set();
const QUESTION_COUNT = 5;
let qTimerInterval = null;
let qTimerSeconds = 0;

function startQuestionnaireTimer() {
  if (qTimerInterval) return; // already running
  const el = document.getElementById('q-timer');
  el.hidden = false;
  qTimerSeconds = 0;
  qTimerInterval = setInterval(() => {
    qTimerSeconds += 1;
    const m = Math.floor(qTimerSeconds / 60);
    const s = qTimerSeconds % 60;
    document.getElementById('q-timer-text').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

function stopQuestionnaireTimer() {
  clearInterval(qTimerInterval);
  qTimerInterval = null;
}

function resetQuestionnaireTimer() {
  stopQuestionnaireTimer();
  qTimerSeconds = 0;
  const el = document.getElementById('q-timer');
  if (el) el.hidden = true;
  const text = document.getElementById('q-timer-text');
  if (text) text.textContent = '00:00';
}

function onQuestionAnswered(n) {
  const q = document.querySelector(`.pf-question[data-q="${n}"]`);
  const value = new FormData(document.getElementById('questionnaire-form')).get(`q${n}`);
  const isAnswered = !!(value && String(value).trim());
  if (q) q.classList.toggle('is-answered', isAnswered);
  if (isAnswered) answeredQuestions.add(n);
  else answeredQuestions.delete(n);

  if (answeredQuestions.size > 0) startQuestionnaireTimer();

  const pct = Math.round((answeredQuestions.size / QUESTION_COUNT) * 100);
  document.getElementById('q-progress-fill').style.width = pct + '%';
  document.getElementById('q-progress-text').textContent = `${answeredQuestions.size} dari ${QUESTION_COUNT} terjawab`;
  document.getElementById('q-submit-btn').disabled = answeredQuestions.size < QUESTION_COUNT;
}

function handleQuestionnaireSubmit(event) {
  event.preventDefault();
  if (answeredQuestions.size < QUESTION_COUNT) return false;
  stopQuestionnaireTimer();
  startInterview();
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
  // Reuses the same .rv-timeline-* classes as the Selesai screen (no inline
  // colors) so these bubbles pick up --rv-text/--rv-accent/--rv-success,
  // which already flip correctly with the light/dark toggle.
  const isBot = speaker === 'bot';
  const wrap = document.createElement('div');
  wrap.className = `rv-timeline-item ${isBot ? 'bot' : 'candidate'}`;
  wrap.style.cssText = 'display:flex;gap:10px;margin-bottom:14px';
  wrap.innerHTML = `
    <div class="rv-timeline-bubble" style="flex:1">
      <div class="rv-timeline-bubble-header">
        <span class="rv-timeline-name">${isBot ? 'Allham' : 'Anda'}</span>
        <span class="rv-timeline-badge ${isBot ? 'interviewer' : 'candidate'}">${isBot ? 'INTERVIEWER' : 'KANDIDAT'}</span>
      </div>
      <p class="rv-timeline-text">${text}</p>
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
