'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const stages = ['prep', 'before', 'flight', 'arrival', 'day2', 'tickets'];
const labels = { prep: '準備編', before: '出発前', flight: '飛行機', arrival: '到着後', day2: '2日目', tickets: 'eチケット' };
const storageKey = 'hk2026-stage-guide';

function readState() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

let state = { checks: [], hotel: '', notes: '', ...readState() };
if (!Array.isArray(state.checks)) state.checks = [];

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function suggestedStage(now = new Date()) {
  if (now.getTime() < Date.parse('2026-10-27T15:00:00Z')) return 'prep';
  const depart = Date.parse('2026-10-28T23:05:00Z');
  const arrive = Date.parse('2026-10-29T03:45:00Z');
  const dayTwo = Date.parse('2026-10-29T16:00:00Z');
  if (now.getTime() < depart) return 'before';
  if (now.getTime() < arrive) return 'flight';
  if (now.getTime() < dayTwo) return 'arrival';
  return 'day2';
}

let recommended = suggestedStage();

function openStage(stage, options = {}) {
  const valid = stages.includes(stage);
  $('#home-view').hidden = valid;
  $$('.stage-view').forEach(view => { view.hidden = view.dataset.stage !== stage; });
  $('#stage-nav').hidden = !valid;
  $$('#stage-nav [data-open-stage]').forEach(button => {
    if (button.dataset.openStage === stage) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#trip-status').textContent = valid ? labels[stage] : labels[recommended];
  document.title = valid ? `${labels[stage]}｜香港 FIELD GUIDE` : '香港 FIELD GUIDE｜いま必要な旅の案内';
  const hash = valid ? `#${stage}` : location.pathname + location.search;
  if (!options.fromHistory) {
    if (valid) history.pushState({ stage }, '', hash);
    else history.pushState({}, '', hash);
  }
  window.scrollTo({ top: 0, behavior: options.instant ? 'auto' : 'smooth' });
  if (valid) setTimeout(() => $(`#stage-${stage} h1`)?.focus({ preventScroll: true }), 250);
}

$$('[data-open-stage]').forEach(button => button.addEventListener('click', () => openStage(button.dataset.openStage)));
$$('[data-go-home]').forEach(button => button.addEventListener('click', () => openStage('')));
$('#open-current').addEventListener('click', () => openStage(recommended));
$('#current-label').textContent = `${labels[recommended]}を開く`;
$$('.entrance').forEach(card => card.classList.toggle('is-now', card.dataset.openStage === recommended));

window.addEventListener('popstate', () => openStage(location.hash.slice(1), { fromHistory: true, instant: true }));

function renderHotel() {
  const host = $('#selected-hotel');
  host.className = 'selected-hotel';
  host.innerHTML = `<small>宿泊先確定・10/29〜10/30</small><h3>威利来ホテル 香港 / Rai Lei Hostel</h3><p>香港威利萊賓館。旺角駅近くの拠点。15:00以降チェックイン・12:00までチェックアウト。</p><p>Flat A, 4/F, Rex Building, 648–652 Nathan Road, Mong Kok, Kowloon, Hong Kong</p><p>香港九龍旺角彌敦道648–652號 皇上皇大廈4樓A室</p><p><a href="https://www.google.com/maps/search/?api=1&amp;query=Rai%20Lei%20Hostel%20648%20652%20Nathan%20Road%20Mong%20Kok" target="_blank" rel="noopener">宿の地図 ↗</a>　<a href="https://hk.trip.com/hotels/hong-kong-hotel-detail-1912720/rai-lei-hotel/" target="_blank" rel="noopener">施設の掲載情報 ↗</a></p>`;
}
renderHotel();

function renderPrepProgress(saved) {
  const inputs = $$('#stage-prep [data-checklist] input');
  const done = inputs.filter(input => input.checked).length;
  $('#prep-count').textContent = `${done} / ${inputs.length} 完了`;
  $('#prep-progress').max = inputs.length;
  $('#prep-progress').value = done;
  if (saved !== undefined) $('#prep-save-status').textContent = saved ? 'この端末・ブラウザーに保存しました。' : '保存できませんでした。この画面を閉じると変更が失われる場合があります。';
}
$$('[data-checklist] input').forEach(input => {
  input.checked = state.checks.includes(input.value);
  input.addEventListener('change', () => {
    state.checks = input.checked ? [...new Set([...state.checks, input.value])] : state.checks.filter(value => value !== input.value);
    const saved = saveState();
    renderPrepProgress(saved);
  });
});
renderPrepProgress();

const drawer = $('#trip-drawer');
$('#open-drawer').addEventListener('click', () => drawer.showModal());
$('#close-drawer').addEventListener('click', () => drawer.close());
drawer.addEventListener('click', event => {
  const rect = drawer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) drawer.close();
});

const notes = $('#notes');
notes.value = state.notes || '';
let noteTimer;
notes.addEventListener('input', () => {
  clearTimeout(noteTimer);
  $('#save-status').textContent = '保存中…';
  noteTimer = setTimeout(() => {
    state.notes = notes.value;
    $('#save-status').textContent = saveState() ? 'この端末に保存しました。' : '保存できませんでした。';
  }, 400);
});

const initial = stages.includes(location.hash.slice(1)) ? location.hash.slice(1) : '';
openStage(initial, { fromHistory: true, instant: true });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
