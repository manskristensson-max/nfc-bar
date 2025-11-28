import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const { firebaseConfig, BAR_ID } = window.__CONFIG__;
const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// ---- WebAudio: enkel "ding" ----
let audioCtx = null;
let soundEnabled = false;

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playDing() {
  if (!soundEnabled) return;
  const ctx = ensureAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  // liten “ding”-sekvens: två toner
  const now = ctx.currentTime;
  o.frequency.setValueAtTime(880, now);         // A5
  o.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // snabb pitch upp
  g.gain.setValueAtTime(0.001, now);
  g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  o.connect(g); g.connect(ctx.destination);
  o.start(now);
  o.stop(now + 0.26);
}

// Användargest: aktivera ljud
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('soundBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      ensureAudioCtx();
      try { await audioCtx.resume(); } catch {}
      soundEnabled = true;
      // test-pling direkt så du vet att det funkar
      playDing();
      btn.textContent = '🔊 Ljud aktiverat';
      btn.style.opacity = '0.8';
    }, { passive: true });
  }
});

const fmt = (ms) => {
  if (!ms || ms < 0) return '';
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const sec = s%60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
};

(async () => {
  try { await signInAnonymously(auth); } catch(e){ console.error('Auth failed', e); }

  const grid   = document.getElementById('grid');
  const tables = Array.from({ length: 10 }, (_, i) => String(i + 1));
  const state  = {}; // { [tableId]: { status, updatedAtMs } }

  function renderTable(tId){
    const el = document.createElement('div');
    el.className = 'table idle';
    el.dataset.table = tId;
    el.innerHTML = `
      <div class="name">Bord ${tId}</div>
      <div class="status">idle</div>
      <div class="timer"></div>
    `;
    el.addEventListener('click', async () => {
      await setDoc(doc(collection(db,'bars',BAR_ID,'tables'), tId), {
        status: 'idle',
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    return el;
  }

  // init
  tables.forEach(t => grid.appendChild(renderTable(t)));

  // realtid
  tables.forEach(t => {
    const ref = doc(collection(db,'bars',BAR_ID,'tables'), t);
    onSnapshot(ref, (snap) => {
      const el = grid.querySelector(`.table[data-table="${t}"]`);
      if (!el) return;
      const data = snap.data() || { status:'idle' };

      const prevRed = el.className.includes('needs_service');
      const status  = data.status || 'idle';
      const ts      = data.updatedAt?.seconds ? data.updatedAt.seconds*1000 : null;

      state[t] = { status, updatedAtMs: ts };

      el.className = 'table ' + status;
      el.querySelector('.status').textContent = status;

      const timerEl = el.querySelector('.timer');
      timerEl.textContent = (status === 'needs_service' && ts) ? `väntat: ${fmt(Date.now()-ts)}` : '';

      if (!prevRed && status === 'needs_service') {
        playDing();
      }
    });
  });

  // uppdatera timer varje sekund
  setInterval(() => {
    const now = Date.now();
    tables.forEach(t => {
      const el = grid.querySelector(`.table[data-table="${t}"]`);
      const info = state[t];
      if (!el || !info) return;
      const timerEl = el.querySelector('.timer');
      if (info.status === 'needs_service' && info.updatedAtMs) {
        timerEl.textContent = `väntat: ${fmt(now - info.updatedAtMs)}`;
      } else {
        timerEl.textContent = '';
      }
    });
  }, 1000);
})();
