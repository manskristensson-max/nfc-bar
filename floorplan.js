import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const { firebaseConfig, BAR_ID } = window.__CONFIG__;
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const auth = getAuth(app);

// Små hjälpare
const fmt = (ms) => {
  if (!ms || ms < 0) return '';
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const sec = s%60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
};

(async () => {
  try { await signInAnonymously(auth); } catch(e){ console.error('Auth failed', e); }

  const grid  = document.getElementById('grid');
  const audio = document.getElementById('ding');
  const tables = Array.from({ length: 10 }, (_, i) => String(i + 1));

  const state = {}; // { [tableId]: { status, updatedAtMs } }

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

  // realtidslyssning
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

      // Timer renderas i separat loop, men poppa initialt
      const timerEl = el.querySelector('.timer');
      timerEl.textContent = status === 'needs_service' && ts ? `väntat: ${fmt(Date.now()-ts)}` : '';

      // Ljud på växling till rött
      if (!prevRed && status === 'needs_service') {
        audio?.play?.().catch(()=>{});
      }
    });
  });

  // uppdatera tider varje sekund
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
