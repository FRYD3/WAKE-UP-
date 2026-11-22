/**
 * =========================================================================
 * 1. STORAGE, THEMES & INDONESIAN TIMEZONE DEFINITIONS
 * =========================================================================
 */
const STORAGE_KEYS = {
  THEME_ID: 'wakeup_theme_id_v3',
  CUSTOM_COLOR: 'wakeup_custom_accent_v3',
  FORMAT: 'wakeup_time_format_v3',
  TIMEZONE: 'wakeup_id_timezone_v3',
  ALARMS: 'wakeup_alarms_list_v3',
  PRAYER_ALERTS: 'wakeup_prayer_alerts_v3',
  PRAYER_OFFSET: 'wakeup_prayer_offset_v3',
  LOCATION: 'wakeup_location_v3',
  PRAYER_API_CACHE: 'wakeup_prayer_api_cache_v3'
};

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

const THEME_PRESETS = [
  {
    id: 'putih-biru',
    name: 'Putih & Biru (Default)',
    desc: 'Putih bersih & biru cerah modern',
    bg1: '#CFE2FF',
    bg2: '#E8F1FF',
    bg3: '#F8FBFF',
    primary: '#2563EB',
    primary2: '#3B82F6',
    textMain: '#0F2952',
    textMuted: '#526D96',
    shellTop: 'rgba(255, 255, 255, 0.84)',
    shellBottom: 'rgba(240, 247, 255, 0.76)'
  },
  {
    id: 'lumora-periwinkle',
    name: 'Lumora Frosted Periwinkle',
    desc: 'Kaca buram biru-lavender lembut',
    bg1: '#B8C2F4',
    bg2: '#D9DFFA',
    bg3: '#EEF1FC',
    primary: '#5B6BE6',
    primary2: '#8574E8',
    textMain: '#1E245E',
    textMuted: '#656C9E',
    shellTop: 'rgba(244, 246, 255, 0.76)',
    shellBottom: 'rgba(235, 239, 254, 0.66)'
  },
  {
    id: 'biru-langit',
    name: 'Biru Langit & Putih Es',
    desc: 'Nuansa langit pagi yang segar',
    bg1: '#BAE6FD',
    bg2: '#E0F2FE',
    bg3: '#F8FAFC',
    primary: '#0284C7',
    primary2: '#38BDF8',
    textMain: '#0C4A6E',
    textMuted: '#476E8A',
    shellTop: 'rgba(255, 255, 255, 0.85)',
    shellBottom: 'rgba(240, 249, 255, 0.78)'
  },
  {
    id: 'biru-samudra',
    name: 'Biru Samudra & Mutiara',
    desc: 'Kontras elegan biru royal & putih',
    bg1: '#BFDBFE',
    bg2: '#DBEAFE',
    bg3: '#EFF6FF',
    primary: '#1D4ED8',
    primary2: '#2563EB',
    textMain: '#172554',
    textMuted: '#4B5E8C',
    shellTop: 'rgba(255, 255, 255, 0.86)',
    shellBottom: 'rgba(239, 246, 255, 0.78)'
  },
  {
    id: 'putih-minimalis',
    name: 'Putih Minimalis & Slate Blue',
    desc: 'Dominan putih bersih ultra-ringan',
    bg1: '#E2E8F0',
    bg2: '#F1F5F9',
    bg3: '#FFFFFF',
    primary: '#3B82F6',
    primary2: '#60A5FA',
    textMain: '#1E293B',
    textMuted: '#64748B',
    shellTop: 'rgba(255, 255, 255, 0.92)',
    shellBottom: 'rgba(248, 250, 252, 0.86)'
  }
];

const ID_TIMEZONES = {
  WIB: { code: 'WIB', name: 'Waktu Indonesia Barat', iana: 'Asia/Jakarta', offset: 7, utcLabel: 'UTC+7' },
  WITA: { code: 'WITA', name: 'Waktu Indonesia Tengah', iana: 'Asia/Makassar', offset: 8, utcLabel: 'UTC+8' },
  WIT: { code: 'WIT', name: 'Waktu Indonesia Timur', iana: 'Asia/Jayapura', offset: 9, utcLabel: 'UTC+9' }
};

const INDONESIAN_CITIES = [
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456, tz: 'WIB', temp: 30 },
  { name: 'Palembang', lat: -2.9761, lon: 104.7754, tz: 'WIB', temp: 29 },
  { name: 'Bandung', lat: -6.9175, lon: 107.6191, tz: 'WIB', temp: 24 },
  { name: 'Surabaya', lat: -7.2575, lon: 112.7521, tz: 'WIB', temp: 31 },
  { name: 'Yogyakarta', lat: -7.7956, lon: 110.3695, tz: 'WIB', temp: 28 },
  { name: 'Semarang', lat: -6.9667, lon: 110.4167, tz: 'WIB', temp: 30 },
  { name: 'Medan', lat: 3.5952, lon: 98.6722, tz: 'WIB', temp: 30 },
  { name: 'Banda Aceh', lat: 5.5483, lon: 95.3238, tz: 'WIB', temp: 29 },
  { name: 'Padang', lat: -0.9471, lon: 100.4172, tz: 'WIB', temp: 28 },
  { name: 'Pekanbaru', lat: 0.5071, lon: 101.4478, tz: 'WIB', temp: 30 },
  { name: 'Bandar Lampung', lat: -5.4292, lon: 105.2610, tz: 'WIB', temp: 29 },
  { name: 'Pontianak', lat: -0.0263, lon: 109.3425, tz: 'WIB', temp: 30 },
  { name: 'Makassar', lat: -5.1477, lon: 119.4327, tz: 'WITA', temp: 30 },
  { name: 'Denpasar', lat: -8.6705, lon: 115.2126, tz: 'WITA', temp: 29 },
  { name: 'Balikpapan', lat: -1.2379, lon: 116.8529, tz: 'WITA', temp: 29 },
  { name: 'Banjarmasin', lat: -3.3194, lon: 114.5908, tz: 'WITA', temp: 30 },
  { name: 'Manado', lat: 1.4748, lon: 124.8421, tz: 'WITA', temp: 28 },
  { name: 'Mataram', lat: -8.5833, lon: 116.1167, tz: 'WITA', temp: 29 },
  { name: 'Kupang', lat: -10.1772, lon: 123.6070, tz: 'WITA', temp: 31 },
  { name: 'Ambon', lat: -3.6954, lon: 128.1814, tz: 'WIT', temp: 28 },
  { name: 'Jayapura', lat: -2.5916, lon: 140.6690, tz: 'WIT', temp: 29 },
  { name: 'Sorong', lat: -0.8762, lon: 131.2558, tz: 'WIT', temp: 29 }
];

const state = {
  activeScreen: 'home',
  themeId: readStore(STORAGE_KEYS.THEME_ID, 'putih-biru'),
  customAccent: readStore(STORAGE_KEYS.CUSTOM_COLOR, null),
  timeFormat: readStore(STORAGE_KEYS.FORMAT, '24h'),
  timezone: readStore(STORAGE_KEYS.TIMEZONE, 'WIB'),
  alarmFilter: 'all',
  alarms: readStore(STORAGE_KEYS.ALARMS, [
    {
      id: 'wakeup-def-1',
      time: '05:30',
      label: 'Bangun Pagi & Push-Up',
      days: [1, 2, 3, 4, 5],
      tone: 'energetic',
      challenge: 'cam_pushup',
      enabled: true
    },
    {
      id: 'wakeup-def-2',
      time: '07:00',
      label: 'Smart Wake Up',
      days: [1, 2, 3, 4, 5],
      tone: 'classic',
      challenge: 'math',
      enabled: false
    }
  ]),
  prayerAlerts: readStore(STORAGE_KEYS.PRAYER_ALERTS, {
    Imsak: false,
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true
  }),
  prayerOffsetMin: readStore(STORAGE_KEYS.PRAYER_OFFSET, 0),
  location: readStore(STORAGE_KEYS.LOCATION, {
    mode: 'gps',
    lat: -6.2088,
    lon: 106.8456,
    city: 'Jakarta',
    temp: 30,
    source: 'Default'
  }),
  prayerTimes: null,
  lastPrayerDateStamp: '',
  triggeredKeys: new Set(),
  snoozeTarget: null,
  activeRinging: null,
  pendingDeleteId: null,
  activeCameraStream: null,
  cameraLoopId: null
};

/**
 * =========================================================================
 * 2. DETERMINISTIC INDONESIAN TIMEZONE CLOCK HELPER (WIB / WITA / WIT)
 * =========================================================================
 */
function pad2(n) {
  return String(n).padStart(2, '0');
}

function getIndonesianNow(tzKey = state.timezone) {
  const tzMeta = ID_TIMEZONES[tzKey] || ID_TIMEZONES.WIB;
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const targetDate = new Date(utcMs + tzMeta.offset * 3600000);

  const hours = targetDate.getHours();
  const minutes = targetDate.getMinutes();
  const seconds = targetDate.getSeconds();
  const dayOfWeek = targetDate.getDay();
  const day = targetDate.getDate();
  const month = targetDate.getMonth();
  const year = targetDate.getFullYear();

  return {
    hours,
    minutes,
    seconds,
    dayOfWeek,
    day,
    month,
    year,
    hhmm: `${pad2(hours)}:${pad2(minutes)}`,
    dateStamp: `${year}-${pad2(month + 1)}-${pad2(day)}`,
    ddmmyyyy: `${pad2(day)}-${pad2(month + 1)}-${year}`,
    offset: tzMeta.offset,
    code: tzMeta.code
  };
}

function formatHHMM(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return '--:--';
  const [hStr, mStr] = hhmm.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return hhmm;

  if (state.timeFormat === '24h') {
    return `${pad2(h)}:${pad2(m)}`;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad2(h12)}:${pad2(m)} ${ampm}`;
}

/**
 * =========================================================================
 * 3. WEB AUDIO API SYNTHESIZER
 * =========================================================================
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.loopTimer = null;
    this.isPlaying = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(freq, duration, type = 'sine', offsetSec = 0, gainVal = 0.24) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + offsetSec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  playRepSuccessChime() {
    this.playTone(659.25, 0.12, 'triangle', 0, 0.28);
    this.playTone(880.00, 0.18, 'triangle', 0.09, 0.3);
  }

  playCompleteFanfare() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
      this.playTone(f, 0.22, 'triangle', idx * 0.1, 0.28);
    });
  }

  triggerPattern(toneName) {
    if (toneName === 'classic') {
      [0, 0.16, 0.32, 0.48].forEach(off => this.playTone(880, 0.1, 'square', off, 0.15));
    } else if (toneName === 'energetic') {
      [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((f, i) => {
        this.playTone(f, 0.16, 'triangle', i * 0.14, 0.26);
      });
    } else if (toneName === 'urgent') {
      this.playTone(960, 0.24, 'sawtooth', 0, 0.16);
      this.playTone(720, 0.24, 'sawtooth', 0.26, 0.16);
      this.playTone(960, 0.24, 'sawtooth', 0.52, 0.16);
    } else if (toneName === 'gentle') {
      this.playTone(587.33, 0.6, 'sine', 0, 0.24);
      this.playTone(880.00, 0.7, 'sine', 0.24, 0.18);
      this.playTone(1174.66, 0.9, 'sine', 0.48, 0.14);
    } else if (toneName === 'adzan_chime') {
      const notes = [
        { f: 440.00, d: 0.45, t: 0.0 },
        { f: 466.16, d: 0.45, t: 0.42 },
        { f: 554.37, d: 0.55, t: 0.84 },
        { f: 587.33, d: 0.85, t: 1.35 },
        { f: 554.37, d: 0.45, t: 2.25 },
        { f: 466.16, d: 0.45, t: 2.70 },
        { f: 440.00, d: 1.00, t: 3.15 }
      ];
      notes.forEach(n => {
        this.playTone(n.f, n.d, 'sine', n.t, 0.22);
        this.playTone(n.f * 2, n.d * 0.8, 'sine', n.t, 0.05);
      });
    }
  }

  playSinglePreview(toneName) {
    this.stopLoop();
    this.triggerPattern(toneName);
  }

  startLoop(toneName) {
    this.stopLoop();
    this.isPlaying = true;
    this.triggerPattern(toneName);
    const interval = toneName === 'adzan_chime' ? 4600 : 1450;
    this.loopTimer = setInterval(() => {
      if (this.isPlaying) this.triggerPattern(toneName);
    }, interval);
  }

  stopLoop() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }
}

const soundEngine = new SoundEngine();

['click', 'touchstart', 'keydown'].forEach(evt => {
  document.addEventListener(evt, () => soundEngine.ensureContext(), { passive: true });
});

/**
 * =========================================================================
 * 4. TOAST NOTIFICATION & NAVIGATION
 * =========================================================================
 */
function showToast(msg, type = 'info') {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  const dotColor = type === 'success' ? 'bg-emerald-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-600';
  el.className = 'pointer-events-auto glass-card-strong rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs font-bold text-deep shadow-lg transition-all duration-300';
  el.innerHTML = `<span class="w-2.5 h-2.5 rounded-full ${dotColor} shrink-0"></span><span class="flex-1">${msg}</span>`;
  stack.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 280);
  }, 3000);
}

function switchScreen(screenName) {
  state.activeScreen = screenName;
  document.querySelectorAll('.screen-view').forEach(sec => {
    sec.classList.toggle('active', sec.id === `screen-${screenName}`);
  });
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    const isCurrent = btn.dataset.nav === screenName;
    if (isCurrent) {
      btn.classList.add('text-primary-accent', 'bg-white/75', 'shadow-2xs');
      btn.classList.remove('text-muted-soft');
    } else {
      btn.classList.remove('text-primary-accent', 'bg-white/75', 'shadow-2xs');
      btn.classList.add('text-muted-soft');
    }
  });
}

/**
 * =========================================================================
 * 5. SETTINGS: THEME CUSTOMIZER, FORMAT (24H/AM-PM), & TIMEZONE (WIB/WITA/WIT)
 * =========================================================================
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function lightenHex(hex, amount = 0.18) {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return '#' + [nr, ng, nb].map(v => v.toString(16).padStart(2, '0')).join('');
}

function applyTheme(themeId, customHex = null) {
  const preset = THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[0];
  state.themeId = preset.id;
  state.customAccent = customHex;
  writeStore(STORAGE_KEYS.THEME_ID, preset.id);
  writeStore(STORAGE_KEYS.CUSTOM_COLOR, customHex);

  const primaryHex = customHex || preset.primary;
  const primary2Hex = customHex ? lightenHex(customHex, 0.22) : preset.primary2;
  const { r, g, b } = hexToRgb(primaryHex);

  const root = document.documentElement;
  root.style.setProperty('--bg-grad-1', preset.bg1);
  root.style.setProperty('--bg-grad-2', preset.bg2);
  root.style.setProperty('--bg-grad-3', preset.bg3);
  root.style.setProperty('--primary', primaryHex);
  root.style.setProperty('--primary-2', primary2Hex);
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--text-main', preset.textMain);
  root.style.setProperty('--text-muted', preset.textMuted);
  root.style.setProperty('--pill-soft', `rgba(${r}, ${g}, ${b}, 0.12)`);
  root.style.setProperty('--shell-top', preset.shellTop);
  root.style.setProperty('--shell-bottom', preset.shellBottom);

  const picker = document.getElementById('custom-accent-picker');
  const hexLabel = document.getElementById('custom-accent-hex');
  if (picker) picker.value = primaryHex;
  if (hexLabel) hexLabel.textContent = primaryHex.toUpperCase();

  renderThemePresetsUI();
}

function renderThemePresetsUI() {
  const container = document.getElementById('theme-presets-list');
  if (!container) return;

  container.innerHTML = THEME_PRESETS.map(p => {
    const isSelected = state.themeId === p.id && !state.customAccent;
    return `
      <button type="button" onclick="applyTheme('${p.id}', null)" class="w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${isSelected ? 'bg-white border-blue-400 shadow-xs' : 'bg-white/60 border-white hover:bg-white/85'}">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl border border-white shadow-xs shrink-0 flex items-center justify-center" style="background: linear-gradient(135deg, ${p.bg1}, ${p.primary});">
            <span class="w-3 h-3 rounded-full bg-white/95"></span>
          </div>
          <div class="min-w-0">
            <span class="text-xs font-extrabold text-deep block truncate">${p.name}</span>
            <span class="text-[10px] text-muted-soft block truncate">${p.desc}</span>
          </div>
        </div>
        ${isSelected ? '<span class="text-xs font-extrabold text-primary-accent px-2">Aktif</span>' : ''}
      </button>
    `;
  }).join('');
}

function setTimeFormat(fmt) {
  state.timeFormat = fmt;
  writeStore(STORAGE_KEYS.FORMAT, fmt);

  const badge = document.getElementById('settings-format-badge');
  const btn24 = document.getElementById('btn-set-24h');
  const btn12 = document.getElementById('btn-set-12h');

  if (badge) badge.textContent = fmt === '24h' ? '24-Jam' : 'AM / PM';

  if (btn24 && btn12) {
    if (fmt === '24h') {
      btn24.className = 'py-2.5 px-3 rounded-2xl text-xs font-extrabold btn-primary-glow border-transparent transition-all';
      btn12.className = 'py-2.5 px-3 rounded-2xl text-xs font-bold bg-white/75 text-deep border-white hover:bg-white transition-all';
    } else {
      btn12.className = 'py-2.5 px-3 rounded-2xl text-xs font-extrabold btn-primary-glow border-transparent transition-all';
      btn24.className = 'py-2.5 px-3 rounded-2xl text-xs font-bold bg-white/75 text-deep border-white hover:bg-white transition-all';
    }
  }

  updateHomeAndClocks();
  renderAlarmsList();
  renderPrayerTimesUI();
  updateAlarmModalTimePreview();
}

function setIndonesianTimezone(tzKey, notify = false) {
  if (!ID_TIMEZONES[tzKey]) return;
  state.timezone = tzKey;
  writeStore(STORAGE_KEYS.TIMEZONE, tzKey);

  const tzMeta = ID_TIMEZONES[tzKey];

  document.querySelectorAll('.tz-switch-btn').forEach(btn => {
    const active = btn.dataset.tz === tzKey;
    if (active) {
      btn.className = 'tz-switch-btn py-1.5 rounded-full text-xs font-extrabold btn-primary-glow transition-all';
    } else {
      btn.className = 'tz-switch-btn py-1.5 rounded-full text-xs font-bold text-muted-soft hover:text-deep transition-all';
    }
  });

  document.querySelectorAll('.settings-tz-btn').forEach(btn => {
    const active = btn.dataset.tzOption === tzKey;
    const check = btn.querySelector('.tz-check');
    if (active) {
      btn.className = 'settings-tz-btn w-full p-3 rounded-2xl btn-primary-glow text-left flex items-center justify-between transition-all';
      if (check) check.classList.remove('opacity-0');
    } else {
      btn.className = 'settings-tz-btn w-full p-3 rounded-2xl bg-white/75 border-white text-deep hover:bg-white text-left flex items-center justify-between transition-all';
      if (check) check.classList.add('opacity-0');
    }
  });

  document.getElementById('hero-tz-pill').textContent = tzMeta.code;
  document.getElementById('tile-tz-code').textContent = tzMeta.code;
  document.getElementById('tile-tz-utc').textContent = tzMeta.utcLabel;
  document.getElementById('desktop-tz-badge').textContent = `${tzMeta.code} (${tzMeta.utcLabel})`;
  document.getElementById('modal-tz-label').textContent = tzMeta.code;

  refreshPrayerSchedule();
  updateHomeAndClocks();

  if (notify) {
    showToast(`Zona waktu diubah ke ${tzMeta.code} (${tzMeta.utcLabel})`, 'success');
  }
}

/**
 * =========================================================================
 * 6. HOME SCREEN & REAL-TIME CLOCK ENGINE
 * =========================================================================
 */
const SHORT_DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const SHORT_MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function updateHomeAndClocks() {
  const idNow = getIndonesianNow(state.timezone);
  const { hours, minutes, seconds, dayOfWeek, day, month, year, dateStamp } = idNow;

  if (state.lastPrayerDateStamp && state.lastPrayerDateStamp !== dateStamp) {
    refreshPrayerSchedule();
  }

  let greeting = 'Selamat Malam 🌙';
  if (hours >= 4 && hours < 11) greeting = 'Selamat Pagi ✨';
  else if (hours >= 11 && hours < 15) greeting = 'Selamat Siang ☀️';
  else if (hours >= 15 && hours < 18) greeting = 'Selamat Sore 🌤️';
  document.getElementById('home-greeting-text').textContent = greeting;

  const timeEl = document.getElementById('hero-clock-time');
  const ampmEl = document.getElementById('hero-clock-ampm');
  const secEl = document.getElementById('hero-clock-sec');

  if (state.timeFormat === '24h') {
    timeEl.textContent = `${pad2(hours)}:${pad2(minutes)}`;
    ampmEl.classList.add('hidden');
  } else {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    timeEl.textContent = `${pad2(h12)}:${pad2(minutes)}`;
    ampmEl.textContent = ampm;
    ampmEl.classList.remove('hidden');
  }
  secEl.textContent = `:${pad2(seconds)}`;

  const dateStr = `${SHORT_DAYS_ID[dayOfWeek]}, ${day} ${SHORT_MONTHS_ID[month]} ${year}`;
  document.getElementById('hero-clock-date').textContent = dateStr;
  const sholatDateBadge = document.getElementById('sholat-date-badge');
  if (sholatDateBadge) sholatDateBadge.textContent = `${day} ${SHORT_MONTHS_ID[month]} ${year}`;

  if (state.activeRinging) {
    document.getElementById('ringing-time-text').textContent = formatHHMM(idNow.hhmm);
  }

  const activeCount = state.alarms.filter(a => a.enabled).length;
  const masterToggle = document.getElementById('hero-master-toggle');
  const statusIcon = document.getElementById('hero-status-icon');
  const statusLabel = document.getElementById('hero-status-label');
  const desktopAlarmBadge = document.getElementById('desktop-alarm-badge');

  if (masterToggle) masterToggle.checked = activeCount > 0;
  if (desktopAlarmBadge) desktopAlarmBadge.textContent = `${activeCount} Alarm`;

  if (activeCount > 0) {
    statusIcon.textContent = '🔔';
    statusLabel.textContent = `Alarm Active (${activeCount})`;
  } else {
    statusIcon.textContent = '🔕';
    statusLabel.textContent = 'Alarm Off';
  }
}
