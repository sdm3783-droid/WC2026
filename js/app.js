/* ── 페이지 전환 ── */
const _PAGES=['next-wrap','korea','room','feed','schedule','guide','standings','thirds','bracket'];
function showPage(id){
  _PAGES.forEach(p=>{const el=document.getElementById(p);if(el)el.style.display='none';});
  const el=document.getElementById(id);if(el)el.style.display='';
  if(id==='standings'){const t=document.getElementById('thirds');if(t)t.style.display='';}
  document.querySelectorAll('.sb-nav a').forEach(a=>{
    a.classList.toggle('nav-active',a.getAttribute('href')==='#'+id);
  });
  if(window.innerWidth<=640){
    const hero=document.getElementById('top');
    if(hero)hero.style.display=id==='next-wrap'?'':'none';
  }
  window.scrollTo(0,0);
  if(id==='bracket')setTimeout(()=>{typeof drawBracketLines==='function'&&drawBracketLines();},80);
}

/* ── 필터 탭 ── */
function setFilter(f){
  scheduleFilter=f;
  document.querySelectorAll('.f-tab').forEach(b=>b.classList.toggle('active',b.dataset.f===f));
  renderSchedule();
}

/* ── 상태바 텍스트 ── */
function setStatus(msg,type=''){
  const el=document.getElementById('update-status');
  const hd=document.getElementById('hd-status');
  el.textContent=msg; el.className=type;
  if(hd) hd.textContent=type==='ok'?'LIVE ✓':'...';
}

/* ── 팀 코드 변환 ── */
function resolveTeamCode(apiTeam){
  if(!apiTeam) return null;
  return TLA_MAP[apiTeam.tla?.toUpperCase()]||EN_NAME_MAP[apiTeam.name]||EN_NAME_MAP[apiTeam.shortName]||null;
}

/* ── 자동 점수 업데이트 ── */
async function fetchScores(manual=false){
  setStatus('점수 불러오는 중...');
  try{
    const res=await fetch('https://shy-flower-68a1.sdm3783.workers.dev/');
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data=await res.json();
    let updated=0;
    (data.matches||[]).forEach(apiM=>{
      const hc=resolveTeamCode(apiM.homeTeam), ac=resolveTeamCode(apiM.awayTeam);
      if(!hc||!ac) return;
      const m=MATCHES.find(x=>x.home===hc&&x.away===ac);
      if(!m) return;
      const ft=apiM.score?.fullTime;
      if(ft?.home!=null&&ft?.away!=null){m.score=[ft.home,ft.away];updated++;}
    });
    lastFetch=new Date();
    const t=lastFetch.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
    setStatus(`✓ ${t} 업데이트 · ${updated}경기 반영`,'ok');
    rerender();
    if(typeof settleBets==='function') settleBets();
    if(manual) scheduleNextFetch();
  }catch(e){
    setStatus(`업데이트 실패 (${e.message})`,'err');
    console.warn('fetchScores:',e);
  }
}

function scheduleNextFetch(){
  clearTimeout(fetchTimer);
  fetchTimer=setTimeout(()=>fetchScores().then(scheduleNextFetch),5*60*1000);
}

/* ── 전체 렌더 ── */
function rerender(){
  const nd=renderNext();
  startCountdown(nd);
  renderKorea();
  R=computeRecords();
  renderSchedule();
  renderFeed();
  renderStandings(R);
  renderAIChallenge();
  renderThirds(R);
  renderBracket(R);
  renderPredPanel();
  renderRoomPanel();
  applyTwemoji();
}

/* ── BOOST 오픈 팝업 ── */
function showBoostAnnouncePopup(){
  if(!isBoostOpen())return;
  if(sessionStorage.getItem('wc2026-boost-announce-v1'))return;
  const el=document.getElementById('announce-popup');
  el.innerHTML=`
    <div class="announce-overlay" onclick="if(event.target===this)closeAnnouncePopup()">
      <div class="announce-box boost-announce-box">
        <div class="boost-announce-spark">⚡</div>
        <div class="announce-new-badge" style="background:linear-gradient(90deg,#d97706,#f59e0b);color:#1a0f00">OPEN</div>
        <div class="boost-announce-icon">🏆</div>
        <div class="announce-title" style="color:#fbbf24">BOOST 배팅 오픈!</div>
        <div class="announce-desc">
          조별리그에서 모은 코인을<br>
          토너먼트 경기에 <b style="color:#fbbf24">배수로 불릴 수 있어요!</b>
        </div>
        <div class="announce-reward-wrap boost-announce-wrap">
          <div class="announce-reward-section-label" style="color:#fbbf24">⚡ 라운드별 최대 배수</div>
          <div class="announce-reward-row">
            <span class="announce-reward-item" style="background:rgba(96,165,250,.15);border-color:rgba(96,165,250,.3);color:#93c5fd">32강</span>
            <span class="announce-reward-coin" style="font-size:1rem;font-weight:900;color:#93c5fd">× 3</span>
          </div>
          <div class="announce-reward-row">
            <span class="announce-reward-item" style="background:rgba(251,146,60,.15);border-color:rgba(251,146,60,.3);color:#fb923c">16강</span>
            <span class="announce-reward-coin" style="font-size:1rem;font-weight:900;color:#fb923c">× 5</span>
          </div>
          <div class="announce-reward-row total">
            <span class="announce-reward-item" style="background:linear-gradient(90deg,rgba(245,158,11,.2),rgba(239,68,68,.2));border-color:rgba(245,158,11,.4);color:#fbbf24">8강 · 4강 · 결승</span>
            <span class="announce-reward-coin gold" style="font-size:1rem;font-weight:900">× 10 🔥</span>
          </div>
          <div class="announce-reward-section-label" style="margin-top:10px;color:var(--dim)">💰 정산 방식</div>
          <div class="announce-reward-row">
            <span class="announce-reward-item blue">적중 시</span>
            <span class="announce-reward-coin" style="color:#4ade80">배팅액 × 배수 획득</span>
          </div>
          <div class="announce-reward-row">
            <span class="announce-reward-item" style="background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.25);color:#f87171">실패 시</span>
            <span class="announce-reward-coin" style="color:#f87171">배팅액만 차감</span>
          </div>
          <div class="announce-reward-section-label" style="margin-top:10px;color:#fbbf24">🏆 우승팀 예측 <span style="font-size:.65rem;background:rgba(74,222,128,.15);color:#4ade80;padding:2px 6px;border-radius:4px;border:1px solid rgba(74,222,128,.3)">NEW</span></div>
          <div class="announce-reward-row total">
            <span class="announce-reward-item" style="background:rgba(217,119,6,.15);border-color:rgba(217,119,6,.35);color:#fbbf24">우승국 단 1팀 적중</span>
            <span class="announce-reward-coin gold" style="font-size:1rem;font-weight:900">🪙 +20!</span>
          </div>
        </div>
        <div class="announce-hint" style="color:var(--dim)">토너먼트 탭에서 배팅 · 우승팀 예측을 동시에! 👇</div>
        <button class="announce-cta" style="background:linear-gradient(90deg,#d97706,#f59e0b);color:#1a0f00" onclick="closeAnnouncePopup();showPage('bracket')">⚡ 토너먼트 배팅하러 가기</button>
        <button class="announce-close-txt" onclick="closeAnnouncePopup()">나중에 할게요</button>
      </div>
    </div>`;
  el.style.display='';
  sessionStorage.setItem('wc2026-boost-announce-v1','1');
  if(window.twemoji)twemoji.parse(el);
}

/* ── 신기능 공지 팝업 ── */
function showAnnouncePopup(){
  if(sessionStorage.getItem('wc2026-announce-v4'))return;
  const el=document.getElementById('announce-popup');
  el.innerHTML=`
    <div class="announce-overlay" onclick="if(event.target===this)closeAnnouncePopup()">
      <div class="announce-box">
        <div class="announce-spark">✨</div>
        <div class="announce-new-badge">NEW</div>
        <div class="announce-icon">⚽</div>
        <div class="announce-title">코인 획득 방법 총정리!</div>
        <div class="announce-desc">
          경기 예측부터 조 순위 예측까지<br>
          코인을 최대한 모아보세요!
        </div>
        <div class="announce-reward-wrap">
          <div class="announce-reward-section-label">📅 경기 예측</div>
          <div class="announce-reward-row">
            <span class="announce-reward-item blue">결과 적중</span>
            <span class="announce-reward-coin">🪙 +1</span>
          </div>
          <div class="announce-reward-row">
            <span class="announce-reward-item gold">스코어 적중</span>
            <span class="announce-reward-coin gold">🪙 +3 보너스</span>
          </div>
          <div class="announce-reward-section-label" style="margin-top:10px">🏆 조 순위 예측 <span style="font-size:.65rem;color:var(--gold);font-weight:900">NEW</span></div>
          <div class="announce-reward-row">
            <span class="announce-reward-item blue">1위 팀 적중</span>
            <span class="announce-reward-coin">🪙 +2</span>
          </div>
          <div class="announce-reward-row">
            <span class="announce-reward-item">2위 팀 적중</span>
            <span class="announce-reward-coin">🪙 +1</span>
          </div>
          <div class="announce-reward-row total">
            <span class="announce-reward-item">1·2위 둘 다 맞추면</span>
            <span class="announce-reward-coin gold">🪙 +4! (그룹당)</span>
          </div>
          <div class="announce-reward-section-label" style="margin-top:10px;color:#c4b5fd">🤖 AI를 이겨라! <span style="font-size:.65rem;background:rgba(99,102,241,.2);color:#a5b4fc;padding:2px 6px;border-radius:4px;border:1px solid rgba(99,102,241,.35)">NEW</span></div>
          <div class="announce-reward-row">
            <span class="announce-reward-item" style="background:rgba(99,102,241,.15);border-color:rgba(99,102,241,.3);color:#a5b4fc">AI 점수 초과</span>
            <span class="announce-reward-coin" style="color:#4ade80">🪙 +10 보너스</span>
          </div>
          <div class="announce-reward-row">
            <span class="announce-reward-item" style="background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.2);color:#a5b4fc">AI와 동점</span>
            <span class="announce-reward-coin" style="color:#fbbf24">🪙 +5 보너스</span>
          </div>
        </div>
        <div class="announce-hint">순위표 탭에서 AI 예측을 확인하고 1위·2위를 예측해보세요 👇</div>
        <button class="announce-cta" onclick="closeAnnouncePopup();showPage('standings')">🤖 AI 챌린지 참여하기</button>
        <button class="announce-close-txt" onclick="closeAnnouncePopup()">다음에 할게요</button>
      </div>
    </div>`;
  el.style.display='';
  sessionStorage.setItem('wc2026-announce-v4','1');
  if(window.twemoji)twemoji.parse(el);
}
function closeAnnouncePopup(){
  document.getElementById('announce-popup').style.display='none';
}

/* ── 초기화 ── */
restoreClientStateBridge();
loadRoomState();
loadPreds();
persistClientStateBridge();
rerender();
(()=>{const el=document.getElementById('nav-date-icon');if(el)el.textContent=new Date().getDate();})();
showPage('next-wrap');
scheduleDeadlineRefresh();
if(ROOM_CODE){listenRoom(ROOM_CODE);startHeartbeat();ensureMemberDoc();}
fetchScores().then(scheduleNextFetch);
setTimeout(()=>{ isBoostOpen() ? showBoostAnnouncePopup() : showAnnouncePopup(); }, 800);
window.addEventListener('pagehide',()=>{
  sessionStorage.removeItem('wc2026-boost-announce-v1');
  sessionStorage.removeItem('wc2026-announce-v4');
});

if('serviceWorker' in navigator){
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(refreshing) return;
    refreshing=true;
    location.reload();
  });
  navigator.serviceWorker.getRegistrations().then(regs=>{
    regs.forEach(reg=>{
      if(new URL(reg.scope).pathname.startsWith('/wc2026/')) reg.unregister();
    });
  }).finally(()=>{
    navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(reg=>{
      reg.update();
      if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
      reg.addEventListener('updatefound',()=>{
        const nw=reg.installing;
        nw.addEventListener('statechange',()=>{
          if(nw.state==='installed'&&navigator.serviceWorker.controller){
            nw.postMessage({type:'SKIP_WAITING'});
          }
        });
      });
    });
  });
}
