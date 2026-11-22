/**
 * =========================================================================
 * 7. SMART ALARMS CRUD & FILTERING
 * =========================================================================
 */
const CHALLENGE_INFO = {
  cam_pushup: {
    short: '📷 Kamera Push-Up 5x',
    hint: 'Kamera depan melacak gerakan naik-turun tubuh saat push-up sebanyak 5 kali.'
  },
  cam_squat: {
    short: '📷 Kamera Squat 5x',
    hint: 'Berdiri di depan kamera dan lakukan 5 kali gerakan squat naik-turun.'
  },
  cam_wave: {
    short: '📷 Lambaian Tangan 8x',
    hint: 'Tantangan ringan: lambaikan tangan di depan kamera hingga cincin penuh 8/8.'
  },
  math: {
    short: '🧮 Hitung Cepat (3 Soal)',
    hint: 'Selesaikan 3 soal matematika ringan untuk mematikan alarm.'
  },
  tap15: {
    short: '⚡ Ketuk Cepat 15x',
    hint: 'Ketuk lingkaran energi bercahaya sebanyak 15 kali untuk bangun.'
  },
  none: {
    short: 'Tanpa Tantangan',
    hint: 'Alarm dapat langsung dimatikan dengan menekan tombol Matikan.'
  }
};

const DAY_NAMES_SHORT = { 1: 'Sen', 2: 'Sel', 3: 'Rab', 4: 'Kam', 5: 'Jum', 6: 'Sab', 0: 'Min' };

function formatRepeatDays(days) {
  if (!days || days.length === 0) return 'Sekali saja';
  if (days.length === 7) return 'Setiap Hari';
  const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  if (sorted.join(',') === '1,2,3,4,5') return 'Sen – Jum';
  if (sorted.join(',') === '6,0') return 'Sab – Min';
  return sorted.map(d => DAY_NAMES_SHORT[d]).join(', ');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function persistAlarms() {
  writeStore(STORAGE_KEYS.ALARMS, state.alarms);
  renderAlarmsList();
  updateHomeAndClocks();
}

function renderAlarmsList() {
  const container = document.getElementById('alarms-list');
  if (!container) return;

  let filtered = [...state.alarms].sort((a, b) => a.time.localeCompare(b.time));
  if (state.alarmFilter === 'active') filtered = filtered.filter(a => a.enabled);
  else if (state.alarmFilter === 'inactive') filtered = filtered.filter(a => !a.enabled);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card rounded-[26px] p-8 text-center space-y-2">
        <div class="text-2xl">⏰</div>
        <h3 class="text-sm font-extrabold text-deep">Tidak Ada Alarm di Kategori Ini</h3>
        <p class="text-xs text-muted-soft">Tekan tombol <span class="font-bold text-primary-accent">+</span> di kanan atas untuk menambah alarm baru.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(alarm => {
    const hourNum = parseInt(alarm.time.split(':')[0], 10);
    const isMorning = hourNum >= 5 && hourNum < 18;
    const iconEmoji = isMorning ? '☀️' : '🌙';
    const cInfo = CHALLENGE_INFO[alarm.challenge] || CHALLENGE_INFO.none;

    return `
      <div class="glass-card rounded-[26px] p-4 transition-all ${alarm.enabled ? 'opacity-100' : 'opacity-70'}">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-2xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-xl shrink-0">
              ${iconEmoji}
            </div>
            <div class="min-w-0">
              <div class="font-mono-num text-2xl sm:text-3xl font-extrabold text-deep leading-none">
                ${formatHHMM(alarm.time)}
              </div>
              <p class="text-xs font-bold text-deep truncate mt-1">
                ${escapeHtml(alarm.label || 'WAKE UP! Alarm')}
              </p>
              <div class="flex items-center gap-1.5 flex-wrap mt-1">
                <span class="text-[11px] font-semibold text-muted-soft">${formatRepeatDays(alarm.days)}</span>
                <span class="text-slate-300">•</span>
                <span class="px-2 py-0.5 rounded-full glass-pill-soft text-[10px] font-extrabold">
                  ${cInfo.short}
                </span>
              </div>
            </div>
          </div>

          <label class="relative inline-flex items-center cursor-pointer shrink-0">
            <input type="checkbox" class="lum-toggle-input sr-only" ${alarm.enabled ? 'checked' : ''} onchange="toggleAlarmItem('${alarm.id}')" />
            <div class="lum-toggle-track w-12 h-7 bg-slate-200/90 border border-white rounded-full p-1 transition-all flex items-center">
              <div class="lum-toggle-thumb w-5 h-5 bg-white rounded-full shadow-md transition-transform"></div>
            </div>
          </label>
        </div>

        <div class="mt-3 pt-2.5 border-t border-white/70 flex items-center justify-end gap-2">
          <button type="button" onclick="triggerTestAlarmById('${alarm.id}')" class="px-3 py-1 rounded-full glass-pill-soft text-[11px] font-extrabold hover:opacity-80">
            Tes
          </button>
          <button type="button" onclick="openEditAlarm('${alarm.id}')" class="px-3 py-1 rounded-full bg-white/85 text-deep text-[11px] font-bold hover:bg-white">
            Edit
          </button>
          <button type="button" onclick="askDeleteAlarm('${alarm.id}')" class="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-100">
            Hapus
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAlarmItem(id) {
  const alarm = state.alarms.find(a => a.id === id);
  if (!alarm) return;
  alarm.enabled = !alarm.enabled;
  persistAlarms();
  showToast(
    alarm.enabled ? `Alarm ${formatHHMM(alarm.time)} (${state.timezone}) aktif` : `Alarm ${formatHHMM(alarm.time)} dimatikan`,
    alarm.enabled ? 'success' : 'info'
  );
}

let modalSelectedDays = [];

function syncModalDaysUI() {
  document.querySelectorAll('#alarm-days-pills .day-toggle-pill').forEach(btn => {
    const d = parseInt(btn.dataset.d, 10);
    if (modalSelectedDays.includes(d)) {
      btn.className = 'day-toggle-pill py-2 rounded-xl text-xs font-extrabold btn-primary-glow transition-all';
    } else {
      btn.className = 'day-toggle-pill py-2 rounded-xl text-xs font-bold bg-white/85 text-muted-soft border border-white transition-all';
    }
  });
}

function applyDayPreset(preset) {
  if (preset === 'once') modalSelectedDays = [];
  else if (preset === 'weekdays') modalSelectedDays = [1, 2, 3, 4, 5];
  else if (preset === 'daily') modalSelectedDays = [1, 2, 3, 4, 5, 6, 0];
  syncModalDaysUI();
}

function updateAlarmModalTimePreview() {
  const val = document.getElementById('alarm-time-field')?.value || '06:00';
  const hint = document.getElementById('alarm-time-formatted-hint');
  if (hint) hint.textContent = `Tampilan Aktif: ${formatHHMM(val)} (${state.timezone})`;
}

function openNewAlarmModal() {
  document.getElementById('alarm-modal-heading').textContent = 'Tambah Alarm Baru';
  document.getElementById('alarm-id-field').value = '';
  document.getElementById('alarm-time-field').value = '06:00';
  document.getElementById('alarm-label-field').value = '';
  document.getElementById('alarm-tone-field').value = 'energetic';
  document.getElementById('alarm-challenge-field').value = 'cam_pushup';
  document.getElementById('challenge-hint-text').textContent = CHALLENGE_INFO.cam_pushup.hint;
  modalSelectedDays = [];
  syncModalDaysUI();
  updateAlarmModalTimePreview();
  document.getElementById('alarm-modal').classList.remove('hidden');
}

function openEditAlarm(id) {
  const alarm = state.alarms.find(a => a.id === id);
  if (!alarm) return;
  document.getElementById('alarm-modal-heading').textContent = 'Edit Alarm';
  document.getElementById('alarm-id-field').value = alarm.id;
  document.getElementById('alarm-time-field').value = alarm.time;
  document.getElementById('alarm-label-field').value = alarm.label || '';
  document.getElementById('alarm-tone-field').value = alarm.tone || 'energetic';
  document.getElementById('alarm-challenge-field').value = alarm.challenge || 'cam_pushup';
  document.getElementById('challenge-hint-text').textContent = (CHALLENGE_INFO[alarm.challenge] || CHALLENGE_INFO.none).hint;
  modalSelectedDays = [...(alarm.days || [])];
  syncModalDaysUI();
  updateAlarmModalTimePreview();
  document.getElementById('alarm-modal').classList.remove('hidden');
}

function closeAlarmModal() {
  soundEngine.stopLoop();
  document.getElementById('alarm-modal').classList.add('hidden');
}

function askDeleteAlarm(id) {
  const alarm = state.alarms.find(a => a.id === id);
  if (!alarm) return;
  state.pendingDeleteId = id;
  document.getElementById('delete-modal-text').textContent =
    `Hapus alarm "${alarm.label || 'Alarm'}" pukul ${formatHHMM(alarm.time)}?`;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function triggerTestAlarmById(id) {
  const alarm = state.alarms.find(a => a.id === id);
  if (!alarm) return;
  launchRingingOverlay({
    type: 'alarm',
    title: `${alarm.label || 'WAKE UP!'} (Mode Uji)`,
    tone: alarm.tone || 'energetic',
    challenge: alarm.challenge || 'cam_pushup',
    alarmObj: alarm
  });
}

/**
 * =========================================================================
 * 8. RINGING OVERLAY + LIVE CAMERA CV TRACKING
 * =========================================================================
 */
function cleanupCameraResources() {
  if (state.cameraLoopId) {
    cancelAnimationFrame(state.cameraLoopId);
    state.cameraLoopId = null;
  }
  if (state.activeCameraStream) {
    state.activeCameraStream.getTracks().forEach(track => {
      try { track.stop(); } catch (e) {}
    });
    state.activeCameraStream = null;
  }
}

function launchRingingOverlay(config) {
  if (state.activeRinging) return;
  state.activeRinging = config;

  const screen = document.getElementById('ringing-screen');
  const badge = document.getElementById('ringing-badge');
  const timeDisp = document.getElementById('ringing-time-text');
  const titleDisp = document.getElementById('ringing-title-text');
  const snoozeArea = document.getElementById('ringing-snooze-area');

  const idNow = getIndonesianNow(state.timezone);
  timeDisp.textContent = `${formatHHMM(idNow.hhmm)} ${state.timezone}`;
  titleDisp.textContent = config.title;

  if (config.type === 'prayer') {
    badge.textContent = '🕌 PENGINGAT WAKTU SHOLAT';
    snoozeArea.classList.add('hidden');
  } else {
    badge.textContent = '⏰ WAKE UP! ANTI-SLEEP';
    snoozeArea.classList.remove('hidden');
  }

  renderChallengeStage(config.challenge || 'none');
  screen.classList.remove('hidden');
  soundEngine.startLoop(config.tone || 'energetic');
}

function completeAndDismissRinging() {
  cleanupCameraResources();
  soundEngine.stopLoop();
  soundEngine.playCompleteFanfare();
  state.activeRinging = null;
  document.getElementById('ringing-screen').classList.add('hidden');
  showToast('Mantap, Bos! Alarm dimatikan. Selamat beraktivitas!', 'success');
}

function snoozeCurrentAlarm() {
  if (!state.activeRinging || state.activeRinging.type !== 'alarm') return;
  const alarmObj = state.activeRinging.alarmObj;
  cleanupCameraResources();
  soundEngine.stopLoop();
  state.activeRinging = null;
  document.getElementById('ringing-screen').classList.add('hidden');

  const targetMs = Date.now() + 5 * 60 * 1000;
  state.snoozeTarget = { timestamp: targetMs, alarm: alarmObj };

  const snoozeIdNow = new Date(targetMs + (ID_TIMEZONES[state.timezone].offset * 3600000) + (new Date().getTimezoneOffset() * 60000));
  const snoozeHHMM = `${pad2(snoozeIdNow.getHours())}:${pad2(snoozeIdNow.getMinutes())}`;

  document.getElementById('snooze-strip-text').textContent =
    `Alarm "${alarmObj?.label || 'WAKE UP!'}" ditunda 5 mnt (${formatHHMM(snoozeHHMM)} ${state.timezone})`;
  document.getElementById('snooze-strip').classList.remove('hidden');
  showToast('Alarm ditunda 5 menit (Snooze)', 'warning');
}

function renderChallengeStage(challengeType) {
  cleanupCameraResources();
  const stage = document.getElementById('ringing-stage');

  if (challengeType === 'none') {
    stage.innerHTML = `
      <div class="text-center space-y-3 py-2">
        <p class="text-xs text-muted-soft">Sentuh tombol di bawah untuk mematikan alarm.</p>
        <button type="button" onclick="completeAndDismissRinging()" class="w-full py-4 rounded-full btn-primary-glow font-extrabold text-sm">
          Matikan Alarm
        </button>
      </div>
    `;
    return;
  }

  if (challengeType === 'cam_pushup' || challengeType === 'cam_squat' || challengeType === 'cam_wave') {
    const isWave = challengeType === 'cam_wave';
    const isSquat = challengeType === 'cam_squat';
    const targetReps = isWave ? 8 : 5;
    const labelTitle = isWave ? 'Lambaian Tangan 8x' : isSquat ? 'Kamera Squat 5x' : 'Kamera Push-Up 5x';
    const initialInstruction = isWave
      ? 'Lambaikan tangan di depan kamera hingga penuh!'
      : isSquat
        ? 'Posisikan tubuh di kamera: Jongkok (Turun) lalu Berdiri (Naik)!'
        : 'Posisikan wajah/tubuh di kamera: Turun Push-Up lalu Dorong Naik!';

    stage.innerHTML = `
      <div class="space-y-3 text-center">
        <div class="flex items-center justify-between text-xs font-extrabold">
          <span class="text-primary-accent uppercase">${labelTitle}</span>
          <span id="cam-rep-badge" class="font-mono-num px-2.5 py-0.5 rounded-full glass-pill-soft text-deep">0 / ${targetReps}</span>
        </div>

        <div class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div id="cam-rep-bar" class="h-full btn-primary-glow transition-all duration-200" style="width: 0%"></div>
        </div>

        <div id="cam-viewport-box" class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-white shadow-inner">
          <video id="challenge-video" autoplay playsinline muted class="w-full h-full object-cover transform -scale-x-100"></video>
          <canvas id="challenge-hud-canvas" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

          <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            <span id="cam-phase-pill" class="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-bold">
              Menyiapkan kamera...
            </span>
            <span class="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-extrabold">
              LIVE CV
            </span>
          </div>
        </div>

        <p id="cam-guide-text" class="text-xs font-semibold text-deep">
          ${initialInstruction}
        </p>

        <button id="btn-switch-no-cam" type="button" class="text-[11px] font-bold text-muted-soft hover:text-primary-accent underline">
          Kamera bermasalah? Gunakan Mode Tanpa Kamera
        </button>
      </div>
    `;

    document.getElementById('btn-switch-no-cam').addEventListener('click', () => {
      cleanupCameraResources();
      renderNoCameraRhythmicFallback(stage, targetReps, isWave ? 'Lambaian / Ketuk Cepat' : isSquat ? 'Squat Tanpa Kamera' : 'Push-Up Tanpa Kamera');
    });

    startLiveCameraMotionTracker({
      mode: challengeType,
      targetReps,
      stageEl: stage
    });
    return;
  }

  if (challengeType === 'math') {
    let solved = 0;
    const needed = 3;
    let answer = 0;

    function nextMathQuestion() {
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let a, b;
      if (op === '+') {
        a = Math.floor(Math.random() * 28) + 11;
        b = Math.floor(Math.random() * 28) + 10;
        answer = a + b;
      } else if (op === '-') {
        a = Math.floor(Math.random() * 35) + 22;
        b = Math.floor(Math.random() * 18) + 4;
        answer = a - b;
      } else {
        a = Math.floor(Math.random() * 8) + 3;
        b = Math.floor(Math.random() * 8) + 3;
        answer = a * b;
      }

      stage.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-extrabold">
            <span class="text-primary-accent uppercase">🧮 Hitung Cepat</span>
            <span class="px-2.5 py-0.5 rounded-full glass-pill-soft">Soal ${solved + 1} / ${needed}</span>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-100 text-center shadow-2xs">
            <span class="font-mono-num text-3xl font-extrabold text-deep">${a} ${op} ${b} = ?</span>
          </div>
          <form id="math-challenge-form" class="flex gap-2">
            <input id="math-answer-input" type="number" inputmode="numeric" required placeholder="Jawaban" class="flex-1 px-4 py-3 rounded-2xl border border-slate-200 font-mono-num text-lg font-extrabold text-center focus:outline-none" />
            <button type="submit" class="btn-primary-glow px-5 py-3 rounded-2xl text-xs font-extrabold">
              Jawab
            </button>
          </form>
          <p id="math-error-msg" class="hidden text-xs text-center font-bold text-rose-600">Kurang tepat, coba hitung lagi!</p>
        </div>
      `;

      const inp = document.getElementById('math-answer-input');
      setTimeout(() => inp && inp.focus(), 40);

      document.getElementById('math-challenge-form').addEventListener('submit', e => {
        e.preventDefault();
        if (parseInt(inp.value, 10) === answer) {
          solved++;
          soundEngine.playRepSuccessChime();
          if (solved >= needed) completeAndDismissRinging();
          else nextMathQuestion();
        } else {
          document.getElementById('math-error-msg').classList.remove('hidden');
          inp.value = '';
          inp.focus();
        }
      });
    }

    nextMathQuestion();
    return;
  }

  if (challengeType === 'tap15') {
    let taps = 0;
    const goal = 15;

    stage.innerHTML = `
      <div class="space-y-3 text-center py-1">
        <div class="flex items-center justify-between text-xs font-extrabold">
          <span class="text-primary-accent uppercase">⚡ Ketuk Energi 15x</span>
          <span id="tap15-badge" class="font-mono-num px-2.5 py-0.5 rounded-full glass-pill-soft">0 / ${goal}</span>
        </div>
        <button id="btn-tap15-orb" type="button" class="w-32 h-32 rounded-full btn-primary-glow mx-auto flex flex-col items-center justify-center font-extrabold text-white shadow-xl active:scale-90 transition-transform select-none">
          <span class="text-2xl">⚡</span>
          <span id="tap15-btn-label" class="text-sm mt-1">KETUK!</span>
        </button>
        <p class="text-xs text-muted-soft">Ketuk lingkaran biru di atas 15 kali untuk mematikan alarm.</p>
      </div>
    `;

    document.getElementById('btn-tap15-orb').addEventListener('click', () => {
      taps++;
      document.getElementById('tap15-badge').textContent = `${taps} / ${goal}`;
      document.getElementById('tap15-btn-label').textContent = `${goal - taps} Lagi`;
      if (taps >= goal) completeAndDismissRinging();
    });
  }
}

async function startLiveCameraMotionTracker({ mode, targetReps, stageEl }) {
  const videoEl = document.getElementById('challenge-video');
  const hudCanvas = document.getElementById('challenge-hud-canvas');
  const phasePill = document.getElementById('cam-phase-pill');
  const guideText = document.getElementById('cam-guide-text');
  const repBadge = document.getElementById('cam-rep-badge');
  const repBar = document.getElementById('cam-rep-bar');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    renderNoCameraRhythmicFallback(stageEl, targetReps, 'Mode Tanpa Kamera (Perangkat Tidak Mendukung Webcam)');
    return;
  }

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false
    });
  } catch (err) {
    renderNoCameraRhythmicFallback(stageEl, targetReps, 'Izin Kamera Ditolak — Mode Cadangan Aktif');
    return;
  }

  if (!state.activeRinging) {
    stream.getTracks().forEach(t => t.stop());
    return;
  }

  state.activeCameraStream = stream;
  videoEl.srcObject = stream;

  try {
    await videoEl.play();
  } catch (e) {}

  const procW = 64;
  const procH = 48;
  const procCanvas = document.createElement('canvas');
  procCanvas.width = procW;
  procCanvas.height = procH;
  const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });

  let prevFrame = null;
  let reps = 0;
  let lastRepTimestamp = 0;

  let baselineY = null;
  let smoothY = 0.38;
  let movementPhase = 'UP';
  let downEnteredAt = 0;
  let lastWavePulseAt = 0;

  phasePill.textContent = mode === 'cam_wave' ? 'Siap! Lambaikan tangan...' : 'Posisi Siap (Atas) • Mulai Turun!';

  function processFrame() {
    if (!state.activeRinging || !state.activeCameraStream) return;

    if (videoEl.readyState >= 2) {
      procCtx.save();
      procCtx.scale(-1, 1);
      procCtx.drawImage(videoEl, -procW, 0, procW, procH);
      procCtx.restore();

      const imgData = procCtx.getImageData(0, 0, procW, procH).data;
      const gray = new Float32Array(procW * procH);

      for (let i = 0, p = 0; i < imgData.length; i += 4, p++) {
        gray[p] = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
      }

      if (prevFrame) {
        let motionPixelCount = 0;
        let weightedY = 0;

        for (let y = 0; y < procH; y++) {
          for (let x = 0; x < procW; x++) {
            const idx = y * procW + x;
            const diff = Math.abs(gray[idx] - prevFrame[idx]);
            if (diff > 22) {
              motionPixelCount++;
              weightedY += y * diff;
            }
          }
        }

        const totalPixels = procW * procH;
        const motionRatio = motionPixelCount / totalPixels;
        const nowTs = performance.now();

        if (hudCanvas.width !== hudCanvas.clientWidth || hudCanvas.height !== hudCanvas.clientHeight) {
          hudCanvas.width = hudCanvas.clientWidth || 320;
          hudCanvas.height = hudCanvas.clientHeight || 240;
        }
        const hCtx = hudCanvas.getContext('2d');
        hCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);

        if (mode === 'cam_wave') {
          const energyPct = Math.min(100, Math.round((motionRatio / 0.18) * 100));
          hCtx.fillStyle = 'rgba(37, 99, 235, 0.25)';
          hCtx.fillRect(0, hudCanvas.height - (hudCanvas.height * energyPct / 100), hudCanvas.width, hudCanvas.height);

          if (motionRatio > 0.11 && nowTs - lastWavePulseAt > 480) {
            lastWavePulseAt = nowTs;
            reps++;
            soundEngine.playRepSuccessChime();
            repBadge.textContent = `${reps} / ${targetReps}`;
            repBar.style.width = `${Math.min(100, (reps / targetReps) * 100)}%`;
            phasePill.textContent = `Lambaian Terdeteksi! (${reps}/${targetReps})`;

            if (reps >= targetReps) {
              completeAndDismissRinging();
              return;
            }
          }
        } else {
          if (motionPixelCount > 18) {
            const rawNormY = (weightedY / (motionPixelCount * 35)) / procH;
            const clampedY = Math.max(0.08, Math.min(0.92, rawNormY));
            smoothY = smoothY * 0.65 + clampedY * 0.35;

            if (baselineY === null) {
              baselineY = smoothY;
            } else if (movementPhase === 'UP' && smoothY < baselineY) {
              baselineY = baselineY * 0.92 + smoothY * 0.08;
            }
          }

          const base = baselineY !== null ? baselineY : 0.35;
          const triggerDownY = Math.min(0.82, base + 0.14);
          const triggerUpY = base + 0.065;

          const lineYpx = triggerDownY * hudCanvas.height;
          hCtx.strokeStyle = movementPhase === 'DOWN' ? '#10B981' : '#60A5FA';
          hCtx.lineWidth = 3;
          hCtx.setLineDash([8, 6]);
          hCtx.beginPath();
          hCtx.moveTo(16, lineYpx);
          hCtx.lineTo(hudCanvas.width - 16, lineYpx);
          hCtx.stroke();
          hCtx.setLineDash([]);

          hCtx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          hCtx.fillRect(16, lineYpx - 20, 128, 17);
          hCtx.fillStyle = '#FFFFFF';
          hCtx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
          hCtx.fillText('BATAS TURUN ↓', 22, lineYpx - 8);

          const dotYpx = smoothY * hudCanvas.height;
          const dotXpx = hudCanvas.width / 2;
          hCtx.beginPath();
          hCtx.arc(dotXpx, dotYpx, 12, 0, Math.PI * 2);
          hCtx.fillStyle = movementPhase === 'DOWN' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(37, 99, 235, 0.9)';
          hCtx.fill();
          hCtx.lineWidth = 3;
          hCtx.strokeStyle = '#FFFFFF';
          hCtx.stroke();

          if (movementPhase === 'UP' && smoothY >= triggerDownY && motionPixelCount > 16) {
            movementPhase = 'DOWN';
            downEnteredAt = nowTs;
            phasePill.textContent = 'Bagus! Sekarang Dorong Naik ↑';
            guideText.textContent = 'Posisi bawah tercapai — dorong naik ke posisi awal!';
          } else if (movementPhase === 'DOWN' && smoothY <= triggerUpY && (nowTs - downEnteredAt) > 180) {
            movementPhase = 'UP';
            if (nowTs - lastRepTimestamp > 650) {
              lastRepTimestamp = nowTs;
              reps++;
              soundEngine.playRepSuccessChime();
              repBadge.textContent = `${reps} / ${targetReps}`;
              repBar.style.width = `${Math.min(100, (reps / targetReps) * 100)}%`;
              phasePill.textContent = `Mantap! ${reps} / ${targetReps} Selesai`;
              guideText.textContent = reps < targetReps
                ? `Lanjut! Turun lagi untuk repetisi ke-${reps + 1}...`
                : 'Selesai!';

              if (reps >= targetReps) {
                completeAndDismissRinging();
                return;
              }
            }
          }
        }
      }

      prevFrame = gray;
    }

    state.cameraLoopId = requestAnimationFrame(processFrame);
  }

  state.cameraLoopId = requestAnimationFrame(processFrame);
}

function renderNoCameraRhythmicFallback(stageEl, targetReps, titleLabel) {
  let reps = 0;
  let isHoldingDown = false;
  let holdTimer = null;

  stageEl.innerHTML = `
    <div class="space-y-3 text-center">
      <div class="flex items-center justify-between text-xs font-extrabold">
        <span class="text-primary-accent uppercase">${titleLabel}</span>
        <span id="fb-rep-badge" class="font-mono-num px-2.5 py-0.5 rounded-full glass-pill-soft">0 / ${targetReps}</span>
      </div>
      <div class="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div id="fb-rep-bar" class="h-full btn-primary-glow transition-all duration-200" style="width: 0%"></div>
      </div>
      <p id="fb-guide-text" class="text-xs text-muted-soft">
        Tekan & tahan tombol selama 0.5 detik (simulasi turun), lalu lepaskan (naik) sebanyak ${targetReps}x!
      </p>
      <button id="btn-fb-pushup" type="button" class="w-full py-5 rounded-2xl btn-primary-glow font-extrabold text-sm select-none">
        TAHAN (TURUN) → LEPAS (NAIK)
      </button>
    </div>
  `;

  const btn = document.getElementById('btn-fb-pushup');
  const badge = document.getElementById('fb-rep-badge');
  const bar = document.getElementById('fb-rep-bar');
  const guide = document.getElementById('fb-guide-text');

  function startDown() {
    if (isHoldingDown) return;
    isHoldingDown = true;
    btn.textContent = 'Menahan posisi bawah...';
    holdTimer = setTimeout(() => {
      btn.textContent = 'SIAP! LEPASKAN SEKARANG ↑';
      btn.dataset.ready = '1';
    }, 420);
  }

  function finishUp() {
    if (!isHoldingDown) return;
    isHoldingDown = false;
    clearTimeout(holdTimer);
    if (btn.dataset.ready === '1') {
      btn.dataset.ready = '0';
      reps++;
      soundEngine.playRepSuccessChime();
      badge.textContent = `${reps} / ${targetReps}`;
      bar.style.width = `${Math.min(100, (reps / targetReps) * 100)}%`;
      guide.textContent = `Bagus! ${reps} / ${targetReps} repetisi selesai.`;
      if (reps >= targetReps) {
        completeAndDismissRinging();
        return;
      }
    } else {
      guide.textContent = 'Tahan sedikit lebih lama (~0.5 detik) sebelum dilepas!';
    }
    btn.textContent = 'TAHAN (TURUN) → LEPAS (NAIK)';
  }

  btn.addEventListener('mousedown', startDown);
  btn.addEventListener('touchstart', e => { e.preventDefault(); startDown(); }, { passive: false });
  btn.addEventListener('mouseup', finishUp);
  btn.addEventListener('mouseleave', finishUp);
  btn.addEventListener('touchend', finishUp);
}
