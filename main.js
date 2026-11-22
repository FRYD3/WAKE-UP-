/**
 * =========================================================================
 * 9. MUSLIM PRAYER TIMES ENGINE (KEMENAG RI + LIVE ONLINE SYNC + AUTO-UPDATE)
 * =========================================================================
 */
const PRAYER_ROWS = [
  { key: 'Imsak', name: 'Imsak', toggleable: true },
  { key: 'Fajr', name: 'Subuh', toggleable: true },
  { key: 'Sunrise', name: 'Terbit (Syuruq)', toggleable: false },
  { key: 'Dhuhr', name: 'Dzuhur', toggleable: true },
  { key: 'Asr', name: 'Ashar', toggleable: true },
  { key: 'Maghrib', name: 'Maghrib', toggleable: true },
  { key: 'Isha', name: 'Isya', toggleable: true }
];

function computeAstronomicalPrayers(lat, lon, tzOffsetHours) {
  const idNow = getIndonesianNow(state.timezone);
  const year = idNow.year;
  const month = idNow.month + 1;
  const day = idNow.day;

  const rad = d => (d * Math.PI) / 180;
  const deg = r => (r * 180) / Math.PI;

  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;

  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2 * g))) % 360;
  const e = 23.439 - 0.00000036 * d;

  const RA = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L))));
  const eqTime = (q / 15) - ((RA + 24) % 24);

  const dhuhrHour = 12 + tzOffsetHours - (lon / 15) - eqTime;

  function hourAngle(angleDeg) {
    const cosH = (Math.sin(rad(angleDeg)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) /
                 (Math.cos(rad(lat)) * Math.cos(rad(decl)));
    if (cosH > 1 || cosH < -1) return 0;
    return deg(Math.acos(cosH)) / 15;
  }

  const asrAngle = deg(Math.atan(1 / (1 + Math.tan(rad(Math.abs(lat - decl))))));

  function toHHMM(decimalHrs, ihtiyatMin = 2) {
    let totalMins = Math.round(decimalHrs * 60) + ihtiyatMin;
    totalMins = ((totalMins % 1440) + 1440) % 1440;
    return `${pad2(Math.floor(totalMins / 60))}:${pad2(totalMins % 60)}`;
  }

  const fajrDecimal = dhuhrHour - hourAngle(-20);
  return {
    Imsak: toHHMM(fajrDecimal, -8),
    Fajr: toHHMM(fajrDecimal, 2),
    Sunrise: toHHMM(dhuhrHour - hourAngle(-0.833), -1),
    Dhuhr: toHHMM(dhuhrHour, 2),
    Asr: toHHMM(dhuhrHour + hourAngle(asrAngle), 2),
    Maghrib: toHHMM(dhuhrHour + hourAngle(-0.833), 2),
    Isha: toHHMM(dhuhrHour + hourAngle(-18), 2)
  };
}

function normalizeApiTime(raw) {
  if (!raw) return null;
  const match = String(raw).match(/(\d{1,2}):(\d{2})/);
  return match ? `${pad2(parseInt(match[1], 10))}:${match[2]}` : null;
}

async function refreshPrayerSchedule() {
  const tzMeta = ID_TIMEZONES[state.timezone] || ID_TIMEZONES.WIB;
  const idNow = getIndonesianNow(state.timezone);
  state.lastPrayerDateStamp = idNow.dateStamp;

  state.prayerTimes = computeAstronomicalPrayers(state.location.lat, state.location.lon, tzMeta.offset);

  document.getElementById('sholat-city-display').textContent = `${state.location.city}, Indonesia`;
  document.getElementById('sholat-coords-display').textContent =
    `${state.location.lat.toFixed(4)}, ${state.location.lon.toFixed(4)} • ${tzMeta.code}`;
  document.getElementById('tile-gps-city').textContent = state.location.city;
  document.getElementById('tile-weather-temp').textContent = `${state.location.temp || 29}°C`;
  document.getElementById('desktop-city-badge').textContent = state.location.city;

  renderPrayerTimesUI();
  updateNextPrayerDisplay();

  const cacheKey = `${idNow.dateStamp}_${state.location.lat.toFixed(2)}_${state.location.lon.toFixed(2)}_${tzMeta.code}`;
  const cache = readStore(STORAGE_KEYS.PRAYER_API_CACHE, {});
  if (cache[cacheKey]) {
    state.prayerTimes = cache[cacheKey];
    document.getElementById('sholat-sync-subtitle').textContent = `Tersinkron Kemenag RI • ${tzMeta.code}`;
    renderPrayerTimesUI();
    updateNextPrayerDisplay();
    return;
  }

  try {
    const url = `https://api.aladhan.com/v1/timings/${idNow.ddmmyyyy}?latitude=${state.location.lat}&longitude=${state.location.lon}&method=20&timezonestring=${encodeURIComponent(tzMeta.iana)}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const t = json?.data?.timings;
      if (t && t.Fajr && t.Asr) {
        const synced = {
          Imsak: normalizeApiTime(t.Imsak) || state.prayerTimes.Imsak,
          Fajr: normalizeApiTime(t.Fajr) || state.prayerTimes.Fajr,
          Sunrise: normalizeApiTime(t.Sunrise) || state.prayerTimes.Sunrise,
          Dhuhr: normalizeApiTime(t.Dhuhr) || state.prayerTimes.Dhuhr,
          Asr: normalizeApiTime(t.Asr) || state.prayerTimes.Asr,
          Maghrib: normalizeApiTime(t.Maghrib) || state.prayerTimes.Maghrib,
          Isha: normalizeApiTime(t.Isha) || state.prayerTimes.Isha
        };
        state.prayerTimes = synced;
        writeStore(STORAGE_KEYS.PRAYER_API_CACHE, { [cacheKey]: synced });
        document.getElementById('sholat-sync-subtitle').textContent = `Live Kemenag RI • ${tzMeta.code}`;
        renderPrayerTimesUI();
        updateNextPrayerDisplay();
      }
    }
  } catch (e) {
    document.getElementById('sholat-sync-subtitle').textContent = `Hisab Kemenag RI (Offline) • ${tzMeta.code}`;
  }
}

function findNearestIndonesianCity(lat, lon) {
  let best = INDONESIAN_CITIES[0];
  let minDist = Infinity;
  for (const c of INDONESIAN_CITIES) {
    const dLat = c.lat - lat;
    const dLon = c.lon - lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDist) {
      minDist = dist;
      best = c;
    }
  }
  return best;
}

async function detectIndonesianGPS(showFeedback = false) {
  const statusEl = document.getElementById('sholat-gps-status');
  statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span><span>Melacak GPS...</span>`;

  if (!navigator.geolocation) {
    statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Kota Manual</span>`;
    refreshPrayerSchedule();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const nearest = findNearestIndonesianCity(lat, lon);
      let resolvedCity = nearest.name;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=id`);
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const found = addr.city || addr.town || addr.regency || addr.county || addr.state;
          if (found) resolvedCity = found.replace(/^Kota\s+/i, '').replace(/^Kabupaten\s+/i, '');
        }
      } catch (e) {}

      state.location = {
        mode: 'gps',
        lat,
        lon,
        city: resolvedCity,
        temp: nearest.temp,
        source: 'GPS Aktif'
      };
      writeStore(STORAGE_KEYS.LOCATION, state.location);

      setIndonesianTimezone(nearest.tz, false);
      statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>GPS Aktif</span>`;
      refreshPrayerSchedule();

      if (showFeedback) {
        showToast(`Lokasi GPS: ${resolvedCity} (${nearest.tz})`, 'success');
      }
    },
    () => {
      statusEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span><span>Mode Kota Manual</span>`;
      refreshPrayerSchedule();
      if (showFeedback) {
        showToast('GPS tidak diizinkan. Silakan pilih kota Indonesia secara manual.', 'warning');
      }
    },
    { enableHighAccuracy: true, timeout: 9000, maximumAge: 300000 }
  );
}

function togglePrayerReminder(key) {
  state.prayerAlerts[key] = !state.prayerAlerts[key];
  writeStore(STORAGE_KEYS.PRAYER_ALERTS, state.prayerAlerts);
  renderPrayerTimesUI();
  const row = PRAYER_ROWS.find(r => r.key === key);
  showToast(
    state.prayerAlerts[key] ? `Pengingat ${row?.name} aktif` : `Pengingat ${row?.name} dimatikan`,
    state.prayerAlerts[key] ? 'success' : 'info'
  );
}

function getUpcomingPrayer() {
  if (!state.prayerTimes) return null;
  const idNow = getIndonesianNow(state.timezone);
  const nowSec = idNow.hours * 3600 + idNow.minutes * 60 + idNow.seconds;

  const fardhuKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  for (const k of fardhuKeys) {
    const hhmm = state.prayerTimes[k];
    if (!hhmm) continue;
    const [h, m] = hhmm.split(':').map(Number);
    const targetSec = h * 3600 + m * 60;
    if (targetSec > nowSec) {
      return {
        key: k,
        name: PRAYER_ROWS.find(r => r.key === k).name,
        time: hhmm,
        diffSec: targetSec - nowSec
      };
    }
  }

  const fajrTime = state.prayerTimes.Fajr;
  const [fh, fm] = fajrTime.split(':').map(Number);
  const fajrSec = fh * 3600 + fm * 60;
  return {
    key: 'Fajr',
    name: 'Subuh',
    time: fajrTime,
    diffSec: (86400 - nowSec) + fajrSec
  };
}

function updateNextPrayerDisplay() {
  const next = getUpcomingPrayer();
  if (!next) return;

  const hrs = Math.floor(next.diffSec / 3600);
  const mins = Math.floor((next.diffSec % 3600) / 60);
  const secs = next.diffSec % 60;
  const cd = `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
  const formattedTime = formatHHMM(next.time);

  document.getElementById('sholat-next-name').textContent = next.name;
  document.getElementById('sholat-next-countdown').textContent = cd;
  document.getElementById('tile-prayer-time').textContent = formattedTime;
  document.getElementById('tile-prayer-name').textContent = next.name;
  document.getElementById('home-next-prayer-title').textContent =
    `Sholat Berikutnya: ${next.name} • ${formattedTime}`;
  document.getElementById('home-next-prayer-sub').textContent =
    `Hitung mundur ${cd} (${state.location.city}, ${state.timezone})`;
  document.getElementById('desktop-prayer-badge').textContent = `${next.name} ${formattedTime}`;
}

function renderPrayerTimesUI() {
  const list = document.getElementById('sholat-times-list');
  if (!list || !state.prayerTimes) return;

  const upcoming = getUpcomingPrayer();
  const nextKey = upcoming ? upcoming.key : '';

  list.innerHTML = PRAYER_ROWS.map(row => {
    const hhmm = state.prayerTimes[row.key] || '--:--';
    const isNext = row.key === nextKey;
    const isOn = !!state.prayerAlerts[row.key];

    return `
      <div class="glass-card rounded-[22px] px-4 py-3 flex items-center justify-between gap-3 ${isNext ? 'ring-2 ring-blue-400/70 bg-white/90' : ''}">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full ${isNext ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}"></span>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-extrabold text-deep">${row.name}</span>
              ${isNext ? '<span class="px-2 py-0.5 rounded-full btn-primary-glow text-[9px] font-extrabold">Berikutnya</span>' : ''}
            </div>
            <span class="text-[11px] text-muted-soft">${row.toggleable ? (isOn ? 'Adzan aktif' : 'Senyap') : 'Waktu terbit matahari'}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="font-mono-num text-base font-extrabold ${isNext ? 'text-primary-accent' : 'text-deep'}">
            ${formatHHMM(hhmm)}
          </span>

          ${row.toggleable ? `
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="lum-toggle-input sr-only" ${isOn ? 'checked' : ''} onchange="togglePrayerReminder('${row.key}')" />
              <div class="lum-toggle-track w-11 h-6 bg-slate-200/90 border border-white rounded-full p-0.5 transition-all flex items-center">
                <div class="lum-toggle-thumb w-5 h-5 bg-white rounded-full shadow-xs transition-transform"></div>
              </div>
            </label>
          ` : '<div class="w-11 text-center text-xs text-slate-300">—</div>'}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * =========================================================================
 * 10. REAL-TIME SCHEDULER
 * =========================================================================
 */
function subtractMinutesFromHHMM(hhmm, minusMins) {
  if (!minusMins) return hhmm;
  const [h, m] = hhmm.split(':').map(Number);
  let total = h * 60 + m - minusMins;
  total = ((total % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function evaluateSchedules() {
  const idNow = getIndonesianNow(state.timezone);
  const { hhmm, seconds, dayOfWeek, dateStamp } = idNow;

  if (state.snoozeTarget && Date.now() >= state.snoozeTarget.timestamp) {
    const snoozed = state.snoozeTarget.alarm;
    state.snoozeTarget = null;
    document.getElementById('snooze-strip').classList.add('hidden');
    launchRingingOverlay({
      type: 'alarm',
      title: `${snoozed?.label || 'WAKE UP!'} (Snooze)`,
      tone: snoozed?.tone || 'energetic',
      challenge: snoozed?.challenge || 'cam_pushup',
      alarmObj: snoozed
    });
    return;
  }

  if (seconds > 10 || state.activeRinging) return;

  for (const alarm of state.alarms) {
    if (!alarm.enabled) continue;
    if (alarm.time !== hhmm) continue;

    const dayMatch = !alarm.days || alarm.days.length === 0 || alarm.days.includes(dayOfWeek);
    if (!dayMatch) continue;

    const key = `alarm_${alarm.id}_${state.timezone}_${dateStamp}_${hhmm}`;
    if (state.triggeredKeys.has(key)) continue;
    state.triggeredKeys.add(key);

    if (!alarm.days || alarm.days.length === 0) {
      alarm.enabled = false;
      persistAlarms();
    }

    launchRingingOverlay({
      type: 'alarm',
      title: alarm.label || 'WAKE UP! Alarm',
      tone: alarm.tone || 'energetic',
      challenge: alarm.challenge || 'cam_pushup',
      alarmObj: alarm
    });
    return;
  }

  if (state.prayerTimes) {
    const keys = ['Imsak', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const pKey of keys) {
      if (!state.prayerAlerts[pKey]) continue;
      const rawTime = state.prayerTimes[pKey];
      if (!rawTime) continue;

      const triggerHHMM = subtractMinutesFromHHMM(rawTime, state.prayerOffsetMin);
      if (triggerHHMM !== hhmm) continue;

      const uKey = `prayer_${pKey}_${state.timezone}_${dateStamp}_${hhmm}`;
      if (state.triggeredKeys.has(uKey)) continue;
      state.triggeredKeys.add(uKey);

      const pName = PRAYER_ROWS.find(r => r.key === pKey)?.name || pKey;
      const offsetNote = state.prayerOffsetMin > 0 ? ` (${state.prayerOffsetMin} mnt lagi)` : '';

      launchRingingOverlay({
        type: 'prayer',
        title: `Waktu ${pName}${offsetNote} — ${state.location.city}`,
        tone: 'adzan_chime',
        challenge: 'none'
      });
      return;
    }
  }
}

/**
 * =========================================================================
 * 11. DRIFT-FREE STOPWATCH ENGINE
 * =========================================================================
 */
const sw = {
  running: false,
  startPerf: 0,
  accumulatedMs: 0,
  rafId: null,
  laps: []
};

function formatSwTime(ms) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hr = Math.floor(totalMin / 60);

  const main = hr > 0 ? `${pad2(hr)}:${pad2(min)}:${pad2(sec)}` : `${pad2(min)}:${pad2(sec)}`;
  const frac = `.${pad2(cs)}`;
  return { main, frac, full: `${main}${frac}` };
}

function getSwElapsed() {
  return sw.running ? sw.accumulatedMs + (performance.now() - sw.startPerf) : sw.accumulatedMs;
}

function renderStopwatchFrame() {
  const elapsed = getSwElapsed();
  const fmt = formatSwTime(elapsed);
  document.getElementById('sw-main').textContent = fmt.main;
  document.getElementById('sw-ms').textContent = fmt.frac;

  const prevTotal = sw.laps.length > 0 ? sw.laps[0].totalMs : 0;
  const lapCur = Math.max(0, elapsed - prevTotal);
  document.getElementById('sw-lap-live').textContent = `Lap ${sw.laps.length + 1}: ${formatSwTime(lapCur).full}`;

  if (sw.running) {
    sw.rafId = requestAnimationFrame(renderStopwatchFrame);
  }
}

function handleSwPrimary() {
  const btnPri = document.getElementById('btn-sw-primary');
  const btnSec = document.getElementById('btn-sw-secondary');

  if (!sw.running) {
    sw.running = true;
    sw.startPerf = performance.now();
    btnPri.textContent = 'Jeda';
    btnSec.textContent = 'Putaran (Lap)';
    btnSec.disabled = false;
    renderStopwatchFrame();
  } else {
    sw.accumulatedMs += performance.now() - sw.startPerf;
    sw.running = false;
    if (sw.rafId) cancelAnimationFrame(sw.rafId);
    btnPri.textContent = 'Lanjut';
    btnSec.textContent = 'Reset';
    btnSec.disabled = false;
    renderStopwatchFrame();
  }
}

function handleSwSecondary() {
  if (sw.running) {
    const totalMs = getSwElapsed();
    const prevTotal = sw.laps.length > 0 ? sw.laps[0].totalMs : 0;
    sw.laps.unshift({
      num: sw.laps.length + 1,
      lapMs: Math.max(0, totalMs - prevTotal),
      totalMs
    });
    renderSwLapsList();
  } else {
    sw.accumulatedMs = 0;
    sw.laps = [];
    document.getElementById('btn-sw-primary').textContent = 'Mulai';
    document.getElementById('btn-sw-secondary').textContent = 'Putaran (Lap)';
    document.getElementById('btn-sw-secondary').disabled = true;
    document.getElementById('sw-laps-wrapper').classList.add('hidden');
    renderStopwatchFrame();
  }
}

function renderSwLapsList() {
  const wrap = document.getElementById('sw-laps-wrapper');
  const list = document.getElementById('sw-laps-list');
  const badge = document.getElementById('sw-laps-total-badge');

  if (sw.laps.length === 0) {
    wrap.classList.add('hidden');
    return;
  }

  wrap.classList.remove('hidden');
  badge.textContent = `${sw.laps.length} Lap`;

  let minMs = Infinity;
  let maxMs = -Infinity;
  if (sw.laps.length >= 2) {
    sw.laps.forEach(l => {
      if (l.lapMs < minMs) minMs = l.lapMs;
      if (l.lapMs > maxMs) maxMs = l.lapMs;
    });
  }

  list.innerHTML = sw.laps.map(l => {
    let tag = '';
    if (sw.laps.length >= 2) {
      if (l.lapMs === minMs) tag = '<span class="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-sans font-extrabold">Tercepat</span>';
      else if (l.lapMs === maxMs) tag = '<span class="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-sans font-extrabold">Terlambat</span>';
    }
    return `
      <div class="py-2 flex items-center justify-between">
        <span class="font-bold text-deep">Lap ${pad2(l.num)}${tag}</span>
        <span class="font-bold text-primary-accent">${formatSwTime(l.lapMs).full}</span>
        <span class="text-muted-soft">${formatSwTime(l.totalMs).full}</span>
      </div>
    `;
  }).join('');
}

/**
 * =========================================================================
 * 12. MASTER CLOCK LOOP, VISIBILITY REFRESH & INITIALIZATION
 * =========================================================================
 */
function startMasterLoop() {
  function tick() {
    updateHomeAndClocks();
    updateNextPrayerDisplay();
    evaluateSchedules();
    const delay = 1000 - (Date.now() % 1000);
    setTimeout(tick, delay);
  }
  tick();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    refreshPrayerSchedule();
    updateHomeAndClocks();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.themeId, state.customAccent);
  setTimeFormat(state.timeFormat);
  setIndonesianTimezone(state.timezone, false);

  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchScreen(btn.dataset.nav));
  });

  document.querySelectorAll('.tz-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => setIndonesianTimezone(btn.dataset.tz, true));
  });

  document.getElementById('tile-cycle-tz').addEventListener('click', () => {
    const order = ['WIB', 'WITA', 'WIT'];
    const nextTz = order[(order.indexOf(state.timezone) + 1) % order.length];
    setIndonesianTimezone(nextTz, true);
  });

  document.getElementById('tile-refresh-gps').addEventListener('click', () => {
    detectIndonesianGPS(true);
  });

  document.getElementById('hero-master-toggle').addEventListener('change', e => {
    const turnOn = e.target.checked;
    if (state.alarms.length === 0) {
      e.target.checked = false;
      openNewAlarmModal();
      return;
    }
    if (turnOn) {
      state.alarms[0].enabled = true;
    } else {
      state.alarms.forEach(a => { a.enabled = false; });
    }
    persistAlarms();
    showToast(turnOn ? 'Alarm utama diaktifkan' : 'Semua alarm dimatikan', turnOn ? 'success' : 'info');
  });

  renderAlarmsList();

  document.querySelectorAll('.alarm-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.alarmFilter = btn.dataset.filter;
      document.querySelectorAll('.alarm-filter-btn').forEach(b => {
        if (b === btn) {
          b.className = 'alarm-filter-btn py-2 rounded-full text-xs font-bold bg-white text-deep shadow-xs transition-all';
        } else {
          b.className = 'alarm-filter-btn py-2 rounded-full text-xs font-semibold text-muted-soft hover:text-deep transition-all';
        }
      });
      renderAlarmsList();
    });
  });

  document.getElementById('btn-add-alarm').addEventListener('click', openNewAlarmModal);
  document.getElementById('btn-close-alarm-modal').addEventListener('click', closeAlarmModal);
  document.getElementById('btn-cancel-alarm-modal').addEventListener('click', closeAlarmModal);

  document.getElementById('btn-test-challenge-demo').addEventListener('click', () => {
    launchRingingOverlay({
      type: 'alarm',
      title: 'Test Kamera Push-Up 5x',
      tone: 'energetic',
      challenge: 'cam_pushup',
      alarmObj: state.alarms[0] || { label: 'WAKE UP!', challenge: 'cam_pushup' }
    });
  });

  document.getElementById('alarm-time-field').addEventListener('input', updateAlarmModalTimePreview);

  document.querySelectorAll('#alarm-days-pills .day-toggle-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = parseInt(btn.dataset.d, 10);
      if (modalSelectedDays.includes(d)) {
        modalSelectedDays = modalSelectedDays.filter(x => x !== d);
      } else {
        modalSelectedDays.push(d);
      }
      syncModalDaysUI();
    });
  });

  document.getElementById('alarm-challenge-field').addEventListener('change', e => {
    const info = CHALLENGE_INFO[e.target.value] || CHALLENGE_INFO.none;
    document.getElementById('challenge-hint-text').textContent = info.hint;
  });

  document.getElementById('btn-preview-ringtone').addEventListener('click', () => {
    soundEngine.playSinglePreview(document.getElementById('alarm-tone-field').value);
  });

  document.getElementById('alarm-editor-form').addEventListener('submit', e => {
    e.preventDefault();
    const editId = document.getElementById('alarm-id-field').value;
    const timeVal = document.getElementById('alarm-time-field').value;
    const labelVal = document.getElementById('alarm-label-field').value.trim();
    const toneVal = document.getElementById('alarm-tone-field').value;
    const challengeVal = document.getElementById('alarm-challenge-field').value;

    if (!timeVal) return;

    if (editId) {
      const idx = state.alarms.findIndex(a => a.id === editId);
      if (idx !== -1) {
        state.alarms[idx] = {
          ...state.alarms[idx],
          time: timeVal,
          label: labelVal || 'WAKE UP! Alarm',
          days: [...modalSelectedDays],
          tone: toneVal,
          challenge: challengeVal,
          enabled: true
        };
        showToast('Alarm diperbarui', 'success');
      }
    } else {
      state.alarms.push({
        id: 'alarm-' + Date.now(),
        time: timeVal,
        label: labelVal || 'WAKE UP! Alarm',
        days: [...modalSelectedDays],
        tone: toneVal,
        challenge: challengeVal,
        enabled: true
      });
      showToast(`Alarm ${formatHHMM(timeVal)} (${state.timezone}) disimpan`, 'success');
    }

    persistAlarms();
    closeAlarmModal();
  });

  document.getElementById('btn-delete-cancel').addEventListener('click', () => {
    state.pendingDeleteId = null;
    document.getElementById('delete-modal').classList.add('hidden');
  });

  document.getElementById('btn-delete-confirm').addEventListener('click', () => {
    if (state.pendingDeleteId) {
      state.alarms = state.alarms.filter(a => a.id !== state.pendingDeleteId);
      state.pendingDeleteId = null;
      persistAlarms();
      showToast('Alarm dihapus', 'info');
    }
    document.getElementById('delete-modal').classList.add('hidden');
  });

  document.getElementById('btn-snooze-alarm').addEventListener('click', snoozeCurrentAlarm);
  document.getElementById('btn-cancel-snooze').addEventListener('click', () => {
    state.snoozeTarget = null;
    document.getElementById('snooze-strip').classList.add('hidden');
    showToast('Tunda alarm dibatalkan');
  });

  document.getElementById('btn-sholat-gps').addEventListener('click', () => detectIndonesianGPS(true));

  document.getElementById('sholat-city-select').addEventListener('change', e => {
    const val = e.target.value;
    if (!val) return;
    if (val === 'gps') {
      detectIndonesianGPS(true);
      return;
    }
    const [latStr, lonStr, cityName, cityTz] = val.split(',');
    const found = INDONESIAN_CITIES.find(c => c.name === cityName);
    state.location = {
      mode: 'manual',
      lat: parseFloat(latStr),
      lon: parseFloat(lonStr),
      city: cityName,
      temp: found ? found.temp : 29,
      source: 'Manual'
    };
    writeStore(STORAGE_KEYS.LOCATION, state.location);
    setIndonesianTimezone(cityTz || 'WIB', false);
    document.getElementById('sholat-gps-status').innerHTML =
      `<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span><span>Kota Manual</span>`;
    refreshPrayerSchedule();
    showToast(`Kota sholat: ${cityName} (${cityTz})`, 'success');
  });

  const offsetSelect = document.getElementById('sholat-offset-select');
  offsetSelect.value = String(state.prayerOffsetMin || 0);
  offsetSelect.addEventListener('change', e => {
    state.prayerOffsetMin = parseInt(e.target.value, 10) || 0;
    writeStore(STORAGE_KEYS.PRAYER_OFFSET, state.prayerOffsetMin);
    showToast(
      state.prayerOffsetMin > 0
        ? `Pengingat diatur ${state.prayerOffsetMin} menit sebelum waktu sholat`
        : 'Pengingat diatur tepat waktu sholat',
      'success'
    );
  });

  refreshPrayerSchedule();
  if (state.location.mode === 'gps') {
    detectIndonesianGPS(false);
  }

  document.getElementById('btn-sw-primary').addEventListener('click', handleSwPrimary);
  document.getElementById('btn-sw-secondary').addEventListener('click', handleSwSecondary);

  document.getElementById('btn-set-24h').addEventListener('click', () => {
    setTimeFormat('24h');
    showToast('Format waktu diubah ke 24-Jam', 'success');
  });
  document.getElementById('btn-set-12h').addEventListener('click', () => {
    setTimeFormat('12h');
    showToast('Format waktu diubah ke AM / PM', 'success');
  });

  document.querySelectorAll('.settings-tz-btn').forEach(btn => {
    btn.addEventListener('click', () => setIndonesianTimezone(btn.dataset.tzOption, true));
  });

  document.getElementById('custom-accent-picker').addEventListener('input', e => {
    applyTheme(state.themeId, e.target.value);
  });

  document.getElementById('btn-reset-theme').addEventListener('click', () => {
    applyTheme('putih-biru', null);
    showToast('Tema dikembalikan ke Putih & Biru', 'success');
  });

  document.getElementById('btn-settings-test-alarm').addEventListener('click', () => {
    launchRingingOverlay({
      type: 'alarm',
      title: 'Uji Suara & Kamera Push-Up 5x',
      tone: 'energetic',
      challenge: 'cam_pushup',
      alarmObj: state.alarms[0] || { label: 'WAKE UP!', challenge: 'cam_pushup' }
    });
  });

  startMasterLoop();
});
