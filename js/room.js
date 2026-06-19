/* ── 우승팀 예측 상수 ── */
const CHAMP_OPEN     = new Date('2026-06-28T14:00:00+09:00'); // 32강 대진 확정 후
const CHAMP_DEADLINE = new Date('2026-06-29T04:00:00+09:00'); // 32강 첫 경기 시작 전
const CHAMP_COINS = 20;
function champReady(){ return new Date() >= CHAMP_OPEN || localStorage.getItem('wc2026-preview')==='1'; }
function champLocked(){ return new Date() >= CHAMP_DEADLINE; }
function getChampionWinner(){
  const final=KO.find(k=>k.id===104);
  if(!final||!final.score)return null;
  const winnerSlot=final.score[0]>final.score[1]?final.home:final.away;
  const v=typeof resolveSlot==='function'?resolveSlot(winnerSlot,R):null;
  return typeof v==='string'?v:null;
}
async function predictChampion(teamId){
  if(champLocked())return;
  if(PREDS['champion']===teamId){delete PREDS['champion'];syncPredToRoom('champion',undefined);}
  else{PREDS['champion']=teamId;syncPredToRoom('champion',teamId);}
  localStorage.setItem('wc2026-preds',JSON.stringify(PREDS));
  persistClientStateBridge();
  renderBracket(R);
}
async function cancelChampPick(){
  if(champLocked())return;
  delete PREDS['champion'];
  syncPredToRoom('champion',undefined);
  localStorage.setItem('wc2026-preds',JSON.stringify(PREDS));
  persistClientStateBridge();
  renderBracket(R);
}

/* ── BOOST 배팅 상수 ── */
const BOOST_OPEN = new Date('2026-06-28T14:00:00+09:00');
function isBoostOpen(){ return new Date() >= BOOST_OPEN || localStorage.getItem('wc2026-preview')==='1'; }
function boostMultiplier(round){
  if(round==='32강') return 3;
  if(round==='16강') return 5;
  return 10;
}

/* ── Firebase 초기화 ── */
const FB_CONFIG={apiKey:"AIzaSyC93mYiLYMrF-5IsIzfYnlGQdnK0sdPEfE",authDomain:"ske-0004.firebaseapp.com",projectId:"ske-0004",storageBucket:"ske-0004.firebasestorage.app",messagingSenderId:"704127486318",appId:"1:704127486318:web:3b8c2c5562978231d3597f"};
let db=null;
function getDb(){
  if(!db){firebase.initializeApp(FB_CONFIG);db=firebase.firestore();}
  return db;
}

/* ── 예측방 상태 ── */
let ROOM_CODE=null,ROOM_NICK=null,ROOM_PREDS={},ROOM_MEMBERS=[],roomUnsub=null;

/* ── 채팅 상태 ── */
let chatUnsub=null,CHAT_MSGS=[];

/* ── 반응 상태 ── */
let rxnUnsub=null,RXNS={};

const GLOBAL_ROOM='GLOBAL';
const STATE_BRIDGE_KEY='wc2026_state';
const STATE_BRIDGE_VERSION=1;

function b64UrlEncode(str){
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64UrlDecode(str){
  const b64=(str||'').replace(/-/g,'+').replace(/_/g,'/');
  const pad=b64+'==='.slice((b64.length+3)%4);
  return decodeURIComponent(escape(atob(pad)));
}
function readJsonStorage(key, fallback){
  try{const s=localStorage.getItem(key);return s?JSON.parse(s):fallback;}catch(e){return fallback;}
}
function buildClientState(){
  return {
    v:STATE_BRIDGE_VERSION,
    room:readJsonStorage('wc2026-room',null),
    preds:readJsonStorage('wc2026-preds',{}),
    scores:readJsonStorage('wc2026-score-preds',{}),
    groups:readJsonStorage('wc2026-grp-preds',{}),
    bets:readJsonStorage('wc2026-bets',{})
  };
}
function compactState(state){
  const clean={v:STATE_BRIDGE_VERSION};
  if(state.room?.nick)clean.room={nick:String(state.room.nick).slice(0,10)};
  if(state.preds&&Object.keys(state.preds).length)clean.preds=state.preds;
  if(state.scores&&Object.keys(state.scores).length)clean.scores=state.scores;
  if(state.groups&&Object.keys(state.groups).length)clean.groups=state.groups;
  if(state.bets&&Object.keys(state.bets).length)clean.bets=state.bets;
  return clean;
}
function applyClientState(state){
  if(!state||typeof state!=='object')return false;
  if(state.room?.nick)localStorage.setItem('wc2026-room',JSON.stringify({nick:String(state.room.nick).slice(0,10)}));
  if(state.preds)localStorage.setItem('wc2026-preds',JSON.stringify(state.preds));
  if(state.scores)localStorage.setItem('wc2026-score-preds',JSON.stringify(state.scores));
  if(state.groups)localStorage.setItem('wc2026-grp-preds',JSON.stringify(state.groups));
  if(state.bets)localStorage.setItem('wc2026-bets',JSON.stringify(state.bets));
  return true;
}
function writeStateCookie(payload){
  document.cookie=`${STATE_BRIDGE_KEY}=${payload}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
}
function readStateCookie(){
  const item=document.cookie.split('; ').find(v=>v.startsWith(STATE_BRIDGE_KEY+'='));
  return item?item.slice(STATE_BRIDGE_KEY.length+1):'';
}
function persistClientStateBridge(){
  try{
    const payload=b64UrlEncode(JSON.stringify(compactState(buildClientState())));
    if(payload.length<3800)writeStateCookie(payload);
    refreshInstallManifest(payload);
  }catch(e){console.warn('state bridge persist:',e);}
}
function restoreClientStateBridge(){
  try{
    const url=new URL(location.href);
    const payload=url.searchParams.get('installState')||readStateCookie();
    if(!payload)return false;
    const restored=applyClientState(JSON.parse(b64UrlDecode(payload)));
    if(url.searchParams.has('installState')){
      url.searchParams.delete('installState');
      history.replaceState(null,'',url.pathname+(url.search||'')+(url.hash||''));
    }
    return restored;
  }catch(e){console.warn('state bridge restore:',e);return false;}
}
function refreshInstallManifest(payload){
  try{
    payload=payload||b64UrlEncode(JSON.stringify(compactState(buildClientState())));
    const start=new URL(location.href);
    if(payload.length<1800)start.searchParams.set('installState',payload);
    const manifest={
      name:'2026 FIFA 월드컵 한국 가이드',
      short_name:'WC2026 KOR',
      description:'2026 FIFA 월드컵 한국 일정, 중계, 순위, 예측',
      start_url:start.pathname+start.search+start.hash,
      scope:'/',
      display:'standalone',
      background_color:'#050b13',
      theme_color:'#07111f',
      icons:[
        {src:'icon.png',sizes:'192x192',type:'image/png'},
        {src:'icon.png',sizes:'512x512',type:'image/png'}
      ]
    };
    const blob=new Blob([JSON.stringify(manifest)],{type:'application/manifest+json'});
    const href=URL.createObjectURL(blob);
    const link=document.getElementById('app-manifest')||document.querySelector('link[rel="manifest"]');
    if(link){
      const old=link.dataset.blobHref;
      link.href=href;
      link.dataset.blobHref=href;
      if(old)setTimeout(()=>URL.revokeObjectURL(old),1000);
    }
  }catch(e){console.warn('manifest refresh:',e);}
}
function loadRoomState(){
  try{const s=localStorage.getItem('wc2026-room');if(s){const{nick}=JSON.parse(s);if(nick){ROOM_CODE=GLOBAL_ROOM;ROOM_NICK=nick;}}}catch(e){}
}
function saveRoomState(){
  if(ROOM_NICK)localStorage.setItem('wc2026-room',JSON.stringify({nick:ROOM_NICK}));
  else localStorage.removeItem('wc2026-room');
  persistClientStateBridge();
}
async function syncAllLocalPredsToRoom(){
  if(!ROOM_CODE||!ROOM_NICK)return;
  const upd={...PREDS};
  Object.entries(GRP_PREDS).forEach(([g,p])=>{
    if(p.p1)upd[`grp-${g}-1`]=p.p1;
    if(p.p2)upd[`grp-${g}-2`]=p.p2;
  });
  Object.entries(SCORE_PREDS).forEach(([k,v])=>{upd['s-'+k]=v;});
  Object.entries(MY_BETS).forEach(([k,v])=>{upd['bet-'+k]=v;});
  if(Object.keys(upd).length){
    await getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK)
      .set(upd,{merge:true}).catch(e=>console.warn('syncAllLocalPredsToRoom:',e));
  }
}

async function joinGlobalRoom(nick){
  nick=nick.trim().slice(0,10);
  if(!nick)throw new Error('닉네임을 입력해주세요.');
  const db=getDb();
  const roomRef=db.collection('wc2026_rooms').doc(GLOBAL_ROOM);
  const memberSnap=await roomRef.collection('members').doc(nick).get();
  if(memberSnap.exists)throw new Error(`"${nick}"은 이미 사용 중인 닉네임이에요.`);
  await roomRef.set({createdAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  const now=firebase.firestore.FieldValue.serverTimestamp();
  await roomRef.collection('members').doc(nick).set({joinedAt:now,lastSeen:now});
  const initPreds={...PREDS};
  Object.entries(GRP_PREDS).forEach(([g,p])=>{
    if(p.p1)initPreds[`grp-${g}-1`]=p.p1;
    if(p.p2)initPreds[`grp-${g}-2`]=p.p2;
  });
  Object.entries(SCORE_PREDS).forEach(([k,v])=>{initPreds['s-'+k]=v;});
  Object.entries(MY_BETS).forEach(([k,v])=>{initPreds['bet-'+k]=v;});
  if(Object.keys(initPreds).length>0)await roomRef.collection('predictions').doc(nick).set(initPreds,{merge:true});
  ROOM_CODE=GLOBAL_ROOM;ROOM_NICK=nick;
  saveRoomState();
  syncAllLocalPredsToRoom();
  listenRoom(GLOBAL_ROOM);
  startHeartbeat();
  renderRoomPanel();
  rerender();
}
async function rejoinGlobalRoom(nick){
  const db=getDb();
  const roomRef=db.collection('wc2026_rooms').doc(GLOBAL_ROOM);
  await roomRef.collection('members').doc(nick).update({lastSeen:firebase.firestore.FieldValue.serverTimestamp()});
  ROOM_CODE=GLOBAL_ROOM;ROOM_NICK=nick;
  saveRoomState();
  syncAllLocalPredsToRoom();
  listenRoom(GLOBAL_ROOM);
  startHeartbeat();
  renderRoomPanel();
  rerender();
}
async function doRejoinGlobal(nick){
  const msg=document.getElementById('join-nick-msg');
  const btn=document.querySelector('.room-cta-btn.primary');
  if(btn){btn.disabled=true;btn.textContent='복구 중...';}
  try{
    await rejoinGlobalRoom(nick);
  }catch(e){
    if(msg)msg.textContent=e.message||'복구에 실패했어요.';
    if(btn){btn.disabled=false;btn.textContent='🚀 예측 참여하기';}
  }
}
async function renameNick(newNick){
  newNick=newNick.trim().slice(0,10);
  if(!newNick)throw new Error('닉네임을 입력해주세요.');
  if(newNick===ROOM_NICK)throw new Error('현재 닉네임과 같아요.');
  const db=getDb(),roomRef=db.collection('wc2026_rooms').doc(GLOBAL_ROOM);
  const snap=await roomRef.collection('members').doc(newNick).get();
  if(snap.exists)throw new Error(`"${newNick}"은 이미 사용 중인 닉네임이에요.`);
  const predsSnap=await roomRef.collection('predictions').doc(ROOM_NICK).get();
  const predData=predsSnap.exists?predsSnap.data():{};
  const now=firebase.firestore.FieldValue.serverTimestamp();
  const batch=db.batch();
  batch.set(roomRef.collection('members').doc(newNick),{joinedAt:now,lastSeen:now});
  if(Object.keys(predData).length>0)batch.set(roomRef.collection('predictions').doc(newNick),predData);
  batch.delete(roomRef.collection('members').doc(ROOM_NICK));
  batch.delete(roomRef.collection('predictions').doc(ROOM_NICK));
  await batch.commit();
  ROOM_NICK=newNick;
  saveRoomState();
  renderRoomPanel();
  rerender();
}
async function doRenameNick(){
  const newNick=prompt(`새 닉네임을 입력해주세요 (최대 10자)\n현재: ${ROOM_NICK}`);
  if(newNick===null)return;
  try{await renameNick(newNick);}
  catch(e){alert(e.message||'오류가 발생했어요. 다시 시도해주세요.');}
}
function leaveRoom(){
  if(ROOM_NICK){
    const db=getDb();
    db.collection('wc2026_rooms').doc(GLOBAL_ROOM).collection('members').doc(ROOM_NICK).delete().catch(()=>{});
    db.collection('wc2026_rooms').doc(GLOBAL_ROOM).collection('predictions').doc(ROOM_NICK).delete().catch(()=>{});
  }
  if(roomUnsub){roomUnsub();roomUnsub=null;}
  if(chatUnsub){chatUnsub();chatUnsub=null;}
  if(rxnUnsub){rxnUnsub();rxnUnsub=null;}
  if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}
  ROOM_CODE=null;ROOM_NICK=null;ROOM_PREDS={};ROOM_MEMBERS=[];CHAT_MSGS=[];RXNS={};
  saveRoomState();
  renderRoomPanel();
  rerender();
}
function startHeartbeat(){
  if(heartbeatTimer)clearInterval(heartbeatTimer);
  heartbeatTimer=setInterval(()=>{
    if(!ROOM_CODE||!ROOM_NICK)return;
    getDb().collection('wc2026_rooms').doc(GLOBAL_ROOM).collection('members').doc(ROOM_NICK)
      .update({lastSeen:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});
  },5*60*1000);
}
async function cleanupStaleMembers(){
  const cutoff=new Date(Date.now()-45*24*60*60*1000); // 45일 (월드컵 기간)
  const snap=await getDb().collection('wc2026_rooms').doc(GLOBAL_ROOM).collection('members').get().catch(()=>null);
  if(!snap)return;
  snap.forEach(doc=>{
    const d=doc.data();
    const seen=(d.lastSeen||d.joinedAt)?.toDate();
    if(seen&&seen<cutoff)doc.ref.delete().catch(()=>{});
  });
}
function hydrateLocalPredsFromRoom(preds){
  if(!preds||VIEW_MODE)return false;
  let changed=false;
  Object.entries(preds).forEach(([k,v])=>{
    if(v===undefined||v===null)return;
    if(k.startsWith('s-')){
      const key=k.slice(2);
      if(SCORE_PREDS[key]!==v){SCORE_PREDS[key]=v;changed=true;}
      return;
    }
    if(k.startsWith('grp-')){
      const m=k.match(/^grp-([A-L])-([12])$/);
      if(!m)return;
      const g=m[1],rank=m[2];
      if(!GRP_PREDS[g])GRP_PREDS[g]={};
      const prop=rank==='1'?'p1':'p2';
      if(GRP_PREDS[g][prop]!==v){GRP_PREDS[g][prop]=v;changed=true;}
      return;
    }
    if(k.startsWith('bet-'))return;
    if(PREDS[k]!==v){PREDS[k]=v;changed=true;}
  });
  if(changed){
    localStorage.setItem('wc2026-preds',JSON.stringify(PREDS));
    localStorage.setItem('wc2026-score-preds',JSON.stringify(SCORE_PREDS));
    localStorage.setItem('wc2026-grp-preds',JSON.stringify(GRP_PREDS));
    persistClientStateBridge();
  }
  return changed;
}
function listenRoom(code){
  if(roomUnsub){roomUnsub();roomUnsub=null;}
  const db=getDb();
  cleanupStaleMembers();
  const predsUnsub=db.collection('wc2026_rooms').doc(code).collection('predictions').onSnapshot(snap=>{
    ROOM_PREDS={};
    snap.forEach(d=>{ROOM_PREDS[d.id]=d.data();});
    if(ROOM_NICK&&ROOM_PREDS[ROOM_NICK]){
      hydrateLocalPredsFromRoom(ROOM_PREDS[ROOM_NICK]);
      MY_BETS={};
      Object.entries(ROOM_PREDS[ROOM_NICK]).forEach(([k,v])=>{
        if(k.startsWith('bet-'))MY_BETS[k.slice(4)]=v;
      });
      saveBetsLocal();
    }
    renderSchedule();
    renderStandings(R);
    renderBracket(R);
    renderPredPanel();
    renderRoomPanel();
    applyTwemoji();
    setTimeout(()=>{
      document.querySelectorAll('.pred-bar-fill').forEach(el=>{
        el.classList.remove('flash');
        void el.offsetWidth;
        el.classList.add('flash');
      });
    },100);
  });
  const membersUnsub=db.collection('wc2026_rooms').doc(code).collection('members').onSnapshot(snap=>{
    ROOM_MEMBERS=snap.docs.map(d=>d.id);
    renderRoomPanel();
  });
  roomUnsub=()=>{predsUnsub();membersUnsub();};
  listenChat();
  listenRxns();
}
/* ── 채팅 리스너 ── */
function listenChat(){
  if(chatUnsub){chatUnsub();chatUnsub=null;}
  if(!ROOM_CODE)return;
  try{
    chatUnsub=getDb().collection('wc2026_rooms').doc(GLOBAL_ROOM)
      .collection('chat').orderBy('ts','asc').limitToLast(50)
      .onSnapshot(snap=>{
        CHAT_MSGS=snap.docs.map(d=>({id:d.id,...d.data()}));
        renderChatMessages();
      });
  }catch(error){
    console.error('채팅 리스너 오류:', error);
  }
}

async function sendChat(msg){
  msg=msg.trim();
  if(!msg||!ROOM_NICK||msg.length>100)return;
  try{
    await getDb().collection('wc2026_rooms').doc(GLOBAL_ROOM)
      .collection('chat').add({
        nick:ROOM_NICK,
        msg,
        ts:firebase.firestore.FieldValue.serverTimestamp()
      });
  }catch(error){
    console.error('채팅 전송 실패:', error);
    alert('메시지 전송에 실패했어요. 다시 시도해주세요.');
  }
}

/* ── 반응 리스너 ── */
function listenRxns(){
  if(rxnUnsub){rxnUnsub();rxnUnsub=null;}
  if(!ROOM_CODE)return;
  try{
    rxnUnsub=getDb().collection('wc2026_rooms').doc(GLOBAL_ROOM)
      .collection('rxns').onSnapshot(snap=>{
        RXNS={};
        snap.forEach(d=>{RXNS[d.id]=d.data();});
        renderSchedule();
      });
  }catch(error){
    console.error('반응 리스너 오류:', error);
  }
}

async function toggleRxn(matchKey,emoji){
  if(!ROOM_NICK)return;
  try{
    const ref=getDb().collection('wc2026_rooms').doc(GLOBAL_ROOM).collection('rxns').doc(matchKey);
    const snap=await ref.get();
    const data=snap.exists?snap.data():{};
    const arr=data[emoji]||[];
    if(arr.includes(ROOM_NICK)){
      await ref.set({[emoji]:firebase.firestore.FieldValue.arrayRemove(ROOM_NICK)},{merge:true});
    }else{
      await ref.set({[emoji]:firebase.firestore.FieldValue.arrayUnion(ROOM_NICK)},{merge:true});
    }
  }catch(error){
    console.error('반응 토글 실패:', error);
  }
}

/* ── 탭 전환 ── */
window.switchRoomTab=function(tab){
  const tabRank=document.getElementById('tab-rank');
  const tabChat=document.getElementById('tab-chat');
  const rankContent=document.getElementById('room-rank-content');
  const chatContent=document.getElementById('room-chat-content');
  if(!tabRank||!tabChat||!rankContent||!chatContent)return;
  tabRank.classList.toggle('active',tab==='rank');
  tabChat.classList.toggle('active',tab==='chat');
  rankContent.style.display=tab==='rank'?'':'none';
  chatContent.style.display=tab==='chat'?'':'none';
  if(tab==='chat')renderChatMessages();
};

window.doSendChat=async function(){
  const input=document.getElementById('chat-input');
  if(!input)return;
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';
  await sendChat(msg);
};

window.toggleRxn=toggleRxn;

async function syncPredToRoom(key,val){
  if(!ROOM_CODE||!ROOM_NICK)return;
  const ref=getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK);
  if(val===undefined){
    await ref.update({[key]:firebase.firestore.FieldValue.delete()}).catch(()=>{});
  }else{
    await ref.set({[key]:val},{merge:true});
  }
}
function roomPredSummary(k){
  const c={h:0,d:0,a:0};
  Object.values(ROOM_PREDS).forEach(p=>{if(p[k])c[p[k]]++;});
  return c;
}
function calcRoomRanking(){
  const scores={};
  ROOM_MEMBERS.forEach(nick=>{scores[nick]={correct:0,total:0};});
  Object.entries(ROOM_PREDS).forEach(([nick,preds])=>{
    if(!scores[nick])return; // ROOM_MEMBERS에 없는 탈퇴 유저 제외
    Object.entries(preds).forEach(([k,pred])=>{
      if(k.startsWith('s-'))return;
      const m=MATCHES.find(x=>predKey(x)===k);
      if(m){
        if(!m.score)return;
        scores[nick].total++;
        if(matchResult(m)===pred)scores[nick].correct++;
        const sp=preds['s-'+k];
        if(sp){const[ph,pa]=sp.split('-').map(Number);if(ph===m.score[0]&&pa===m.score[1])scores[nick].correct+=3;}
        return;
      }
      const ko=KO.find(x=>koKey(x)===k);
      if(ko){
        if(!ko.score)return;
        scores[nick].total++;
        if(koMatchResult(ko)===pred)scores[nick].correct++;
      }
    });
    // 그룹 예측 채점 (grp-A-1, grp-A-2 키)
    const grpPreds={};
    Object.entries(preds).forEach(([k,v])=>{
      const m=k.match(/^grp-([A-L])-([12])$/);
      if(!m)return;
      const[,g,rank]=m;
      if(!grpPreds[g])grpPreds[g]={};
      if(rank==='1')grpPreds[g].p1=v;
      else grpPreds[g].p2=v;
    });
    scores[nick].correct+=calcGrpPredCoins(grpPreds);
    scores[nick].correct+=calcAIBonus(grpPreds);
    if(isBoostOpen())scores[nick].correct+=calcBetPnl(nick);
    const champW=getChampionWinner();
    if(champW&&preds['champion']===champW)scores[nick].correct+=CHAMP_COINS;
  });
  return Object.entries(scores)
    .sort((a,b)=>b[1].correct-a[1].correct||b[1].total-a[1].total)
    .map(([nick,s])=>({nick,...s}));
}

function renderRoomPanel(){
  const el=document.getElementById('room-panel');
  if(!el)return;
  if(!ROOM_CODE){
    el.innerHTML=`<div class="room-wrap">
      <div class="room-promo">
        <div class="room-promo-title">☕ 월드컵 예측 챌린지</div>
        <div class="room-promo-desc">닉네임만 입력하면 바로 참여! 전 경기 승부를 예측하고<br>월드컵이 끝나면 <b style="color:var(--gold)">최다 적중자</b>에게 커피쿠폰을 쏩니다! ☕🏆</div>
        <div class="room-promo-badge">🎯 104경기 전 예측 가능 (조별72 + 토너먼트32)</div>
      </div>
      <div class="room-join-form">
        <input id="join-nick-input" class="room-modal-input" placeholder="닉네임 입력 (최대 10자)" maxlength="10"
          onkeydown="if(event.key==='Enter')doJoinGlobal()"
          oninput="this.value=this.value.slice(0,10)">
        <div id="join-nick-msg" style="font-size:.72rem;color:var(--red);min-height:16px;margin:4px 0 8px"></div>
        <button class="room-cta-btn primary" onclick="doJoinGlobal()">🚀 예측 참여하기</button>
      </div>
    </div>`;
    setTimeout(()=>document.getElementById('join-nick-input')&&document.getElementById('join-nick-input').focus(),50);
    return;
  }
  const chips=ROOM_MEMBERS.map((m,i)=>`<span class="room-member-chip${m===ROOM_NICK?' me':''}" style="animation-delay:${i*60}ms;${m!==ROOM_NICK?'cursor:pointer':''}" ${m!==ROOM_NICK?`onclick="showNickPreds('${m.replace(/'/g,"\\'")}')"`:''}>${m===ROOM_NICK?'👤 ':''}${m}</span>`).join('');
  const ranking=calcRoomRanking();
  const medals=['🥇','🥈','🥉'];
  const barColors=['rank-bar-gold','rank-bar-silver','rank-bar-bronze'];
  const coinColors=['gold','silver','bronze'];
  const hasSettled=ranking.some(r=>r.total>0);
  const maxCoins=hasSettled?Math.max(...ranking.map(r=>r.correct),1):1;
  const myRank=ranking.find(r=>r.nick===ROOM_NICK);
  const myCoins=myRank?myRank.correct:0;
  const myRankIdx=myRank?ranking.indexOf(myRank):-1;
  const podiumHTML=renderRankPodium(ranking,hasSettled);
  const rankRows=ranking.map((r,i)=>{
    const isMe=r.nick===ROOM_NICK;
    const num=i<3?`<span class="room-rank-num">${medals[i]}</span>`:`<span class="room-rank-num" style="color:var(--dim)">${i+1}</span>`;
    const crown=i===0&&r.correct>0?`<span class="room-rank-crown">👑</span>`:'';
    const barColor=i<3?barColors[i]:'rank-bar-default';
    const coinColor=i<3?coinColors[i]:'dim';
    const barPct=hasSettled?Math.round(r.correct/maxCoins*100):0;
    const rowClick=!isMe?`onclick="showNickPreds('${r.nick.replace(/'/g,"\\'")}')"`:'';
    const rowStyle=!isMe?`style="cursor:pointer"`:'';
    const nickPreds=isMe?PREDS:(ROOM_PREDS[r.nick]||{});
    const badges=calcBadges(r.nick,nickPreds);
    const mainBadge=badges[0];
    const subBadges=badges.slice(1);
    return`<div class="rank-item" ${rowClick} ${rowStyle}>
      <div class="room-rank-row${i===0&&r.correct>0?' top1':''}">
        ${num}<span class="room-rank-nick${isMe?' me':''}"><span class="room-rank-name">${r.nick}${isMe?' (나)':''}</span>${mainBadge?renderMainBadge(mainBadge):''}</span>${crown}
        <span class="room-rank-coin"><span class="coin-num ${coinColor}">${r.correct}</span>&nbsp;🪙<span class="room-rank-sub" style="margin-left:4px">/${r.total}</span></span>
      </div>
      ${subBadges.length?renderBadges(subBadges):''}
      ${hasSettled?`<div class="rank-bar-wrap"><div class="rank-bar-fill ${barColor}" style="width:${barPct}%"></div></div>`:''}
    </div>`;
  }).join('');
  const rankingHTML=`<div class="room-ranking">
    <div class="room-ranking-title" style="display:flex;align-items:center;justify-content:space-between">
      <span>🏆 예측 순위${!hasSettled?' · 경기 종료 후 업데이트':''}</span>
      ${myCoins>0?`<span style="font-size:.72rem;color:var(--gold);font-weight:700">내 코인 🪙${myCoins}${myRankIdx>=0?' · '+('🥇🥈🥉'.split('')[myRankIdx]||myRankIdx+1+'위'):''}</span>`:''}
    </div>
    ${podiumHTML}
    ${rankRows}
    ${!hasSettled?'<div style="font-size:.72rem;color:var(--dim);margin-top:6px">⏳ 경기 종료 후 코인이 반영됩니다</div>':''}
    <div style="font-size:.7rem;color:var(--dim);margin-top:8px;text-align:center">☕ 월드컵 종료 후 1위에게 커피쿠폰을 쏩니다!</div>
  </div>`;
  el.innerHTML=`<div class="room-wrap">
    <div class="room-active-wrap">
      <div class="room-top">
        <div style="display:flex;flex-direction:column;gap:4px">
          <div class="room-me-badge">👤 ${ROOM_NICK}${myCoins>0?` · 🪙${myCoins}코인`:''}<button class="room-rename-btn" onclick="doRenameNick()">✏️</button></div>
          <span class="room-live-dot" style="position:relative">LIVE · ${ROOM_MEMBERS.length}명 참여 중</span>
        </div>
        <button class="room-leave-btn" onclick="if(confirm('나가면 닉네임이 삭제됩니다. 나가시겠습니까?'))leaveRoom()">나가기</button>
      </div>
      <div class="room-members-row">${chips||'<span style="color:var(--dim);font-size:.75rem">로딩 중...</span>'}</div>
      <div class="room-tab-bar">
        <button class="room-tab active" id="tab-rank" onclick="switchRoomTab('rank')">🏆 랭킹</button>
        <button class="room-tab room-tab-chat-new" id="tab-chat" onclick="switchRoomTab('chat')">💬 채팅<span class="room-tab-new-badge">NEW</span></button>
      </div>
      <div id="room-rank-content">
        ${rankingHTML}
        <button class="room-guide-btn" onclick="showRoomGuide()">📖 예측방 시스템 가이드 보기</button>
        <div class="fairness-banner">
          <span class="fairness-icon">⚖️</span>
          <span class="fairness-text">모든 예측은 <b>경기 시작 전 자동 마감</b>되며, 공개된 규칙에 따라 <b>자동 정산</b>됩니다. 코인은 게임 포인트이며 실제 현금 가치가 없습니다. <a onclick="showRoomGuide()">공정성 안내 보기</a></span>
        </div>
      </div>
      <div id="room-chat-content" style="display:none">
        <div class="chat-container">
          <div id="chat-messages" class="chat-messages"></div>
          <div class="chat-input-wrap">
            <input id="chat-input" class="chat-input" placeholder="메시지 입력 (최대 100자)" maxlength="100"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();doSendChat()}"
              ${!ROOM_NICK?'disabled':''}>
            <button class="chat-send-btn" onclick="doSendChat()" ${!ROOM_NICK?'disabled':''}>전송</button>
          </div>
          ${!ROOM_NICK?'<div class="chat-login-hint">예측방에 참여하면 채팅할 수 있어요</div>':''}
        </div>
      </div>
    </div>
  </div>`;
  if(window.twemoji)twemoji.parse(el);
}
async function doJoinGlobal(){
  const input=document.getElementById('join-nick-input');
  const msg=document.getElementById('join-nick-msg');
  if(!input)return;
  const nick=input.value.trim();
  if(!nick){msg.textContent='닉네임을 입력해주세요.';return;}
  const btn=input.nextElementSibling.nextElementSibling;
  btn.disabled=true;btn.textContent='참여 중...';
  try{
    await joinGlobalRoom(nick);
  }catch(e){
    if(e.message&&e.message.includes('이미 사용 중')){
      const safeNick=nick.replace(/'/g,"\\'");
      msg.innerHTML=`<span>"${nick}" 닉네임이 이미 있어요.</span> <button onclick="doRejoinGlobal('${safeNick}')" style="color:var(--gold);font-weight:700;cursor:pointer;border:none;background:none;font-size:.72rem;text-decoration:underline;padding:0">기존 기록으로 복구 →</button>`;
    }else{
      msg.textContent=e.message||'오류가 발생했어요. 다시 시도해주세요.';
    }
    btn.disabled=false;btn.textContent='🚀 예측 참여하기';
  }
}
function showPredModal(k,hName,aName){
  const rc=roomPredSummary(k);
  const rt=rc.h+rc.d+rc.a;
  const pct=v=>rt>0?Math.round(v/rt*100):0;
  const whoFor=val=>Object.entries(ROOM_PREDS).filter(([,p])=>p[k]===val)
    .map(([nick])=>`<span class="room-who-chip${nick===ROOM_NICK?' me':''}">${nick}</span>`).join('');
  const barRow=(cls,lbl,val)=>`
    <div class="pred-modal-bar-wrap">
      <div class="pred-modal-bar-row">
        <span class="pred-modal-lbl">${lbl}</span>
        <div class="pred-modal-track"><div class="pred-modal-fill ${cls}" style="width:${pct(rc[val])}%"></div></div>
        <span class="pred-modal-cnt">${rc[val]}명</span>
      </div>
      ${rc[val]>0?`<div class="pred-modal-who">${whoFor(val)}</div>`:''}
    </div>`;
  const body=rt>0
    ?`<div class="pred-modal-bars">${barRow('h',hName,'h')}${barRow('d','무승부','d')}${barRow('a',aName,'a')}</div>`
    :`<div class="pred-modal-empty">아직 아무도 예측하지 않았어요.<br>먼저 예측해보세요!</div>`;
  document.getElementById('pred-modal').innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closePredModal()">
      <div class="pred-modal-box">
        <div class="pred-modal-handle"></div>
        <div class="pred-modal-teams">${hName} <span style="color:var(--dim);font-size:.85rem">VS</span> ${aName}</div>
        <div class="pred-modal-meta">👥 방 예측 현황 · 총 ${rt}명</div>
        ${body}
        <button class="pred-modal-close" onclick="closePredModal()">닫기</button>
      </div>
    </div>`;
  document.getElementById('pred-modal').style.display='';
}
function closePredModal(){
  document.getElementById('pred-modal').style.display='none';
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closePredModal();window.closeGrpModal&&window.closeGrpModal();}
});

/* ── KO 예측 헬퍼 ── */
function koKey(ko){return'ko-'+ko.id;}
function koMatchResult(ko){if(!ko.score)return null;return ko.score[0]>ko.score[1]?'h':'a';}
function koStartTime(ko){
  const m=ko.d.match(/^(\d+)\/(\d+)\s+(\d+):(\d+)$/);
  if(!m)return null;
  return new Date(`2026-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}T${m[3]}:${m[4]}`);
}
function predictKO(key,val){
  if(VIEW_MODE)return;
  if(PREDS[key]===val){delete PREDS[key];syncPredToRoom(key,undefined);}
  else{PREDS[key]=val;syncPredToRoom(key,val);}
  localStorage.setItem('wc2026-preds',JSON.stringify(PREDS));
  persistClientStateBridge();
  renderPredPanel();
  applyTwemoji();
}
function showKOPredModal(k,hName,aName){
  const rc=roomPredSummary(k);
  const rt=rc.h+rc.a;
  const pct=v=>rt>0?Math.round(v/rt*100):0;
  const whoFor=val=>Object.entries(ROOM_PREDS).filter(([,p])=>p[k]===val)
    .map(([nick])=>`<span class="room-who-chip${nick===ROOM_NICK?' me':''}">${nick}</span>`).join('');
  const barRow=(cls,lbl,val)=>`
    <div class="pred-modal-bar-wrap">
      <div class="pred-modal-bar-row">
        <span class="pred-modal-lbl">${lbl}</span>
        <div class="pred-modal-track"><div class="pred-modal-fill ${cls}" style="width:${pct(rc[val])}%"></div></div>
        <span class="pred-modal-cnt">${rc[val]}명</span>
      </div>
      ${rc[val]>0?`<div class="pred-modal-who">${whoFor(val)}</div>`:''}
    </div>`;
  const body=rt>0
    ?`<div class="pred-modal-bars">${barRow('h',hName+' 승','h')}${barRow('a',aName+' 승','a')}</div>`
    :`<div class="pred-modal-empty">아직 아무도 예측하지 않았어요.<br>먼저 예측해보세요!</div>`;
  document.getElementById('pred-modal').innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closePredModal()">
      <div class="pred-modal-box">
        <div class="pred-modal-handle"></div>
        <div class="pred-modal-teams">${hName} <span style="color:var(--dim);font-size:.85rem">VS</span> ${aName}</div>
        <div class="pred-modal-meta">👥 방 예측 현황 · 총 ${rt}명 · 토너먼트(연장전 포함)</div>
        ${body}
        <button class="pred-modal-close" onclick="closePredModal()">닫기</button>
      </div>
    </div>`;
  document.getElementById('pred-modal').style.display='';
}

/* ── 예측 시스템 ── */
function predKey(m){return`${m.home}-${m.away}`;}
function matchResult(m){if(!m.score)return null;return m.score[0]>m.score[1]?'h':m.score[0]<m.score[1]?'a':'d';}
/* ── 그룹 예측 마감 (각 그룹 첫 경기 킥오프) ── */
function grpDeadline(g){
  // 2라운드 첫 경기(3번째 경기) 킥오프 전까지 예측 가능
  const sorted=MATCHES.filter(m=>m.group===g).sort((a,b)=>new Date(a.kst)-new Date(b.kst));
  return sorted[2]?new Date(sorted[2].kst):null;
}
function grpLocked(g){const d=grpDeadline(g);return d&&new Date()>=d;}

/* ── 그룹 예측 저장/로드/sync ── */
function saveGrpPreds(){localStorage.setItem('wc2026-grp-preds',JSON.stringify(GRP_PREDS));persistClientStateBridge();}
function loadGrpPreds(){try{const s=localStorage.getItem('wc2026-grp-preds');if(s)GRP_PREDS=JSON.parse(s);}catch(e){GRP_PREDS={};}}
async function syncGrpPredToRoom(g,p1,p2){
  if(!ROOM_CODE||!ROOM_NICK)return;
  const ref=getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK);
  const upd={};
  if(p1!==undefined)upd[`grp-${g}-1`]=p1;
  if(p2!==undefined)upd[`grp-${g}-2`]=p2;
  await ref.set(upd,{merge:true});
}
function predictGrp(g,rank,teamId){
  if(VIEW_MODE||grpLocked(g))return;
  if(!GRP_PREDS[g])GRP_PREDS[g]={};
  const p=GRP_PREDS[g];
  if(rank===1){
    if(p.p1===teamId){delete p.p1;} // 재클릭 → 해제
    else{if(p.p2===teamId)delete p.p2;p.p1=teamId;}
  }else{
    if(p.p2===teamId){delete p.p2;} // 재클릭 → 해제
    else{if(p.p1===teamId)delete p.p1;p.p2=teamId;}
  }
  saveGrpPreds();
  syncGrpPredToRoom(g,GRP_PREDS[g].p1,GRP_PREDS[g].p2);
  renderStandings(R);
}

/* ── 배지 시스템 ── */
function calcBadges(nick, preds){
  const badges=[];
  if(!preds)return badges;
  // 코인왕
  const ranking=calcRoomRanking();
  if(ranking.length>0&&ranking[0].nick===nick&&ranking[0].correct>0)
    badges.push({icon:'💎',label:'코인왕',cls:'badge-gold'});
  // 한국전 전문가
  const korMs=MATCHES.filter(m=>m.home==='kor'||m.away==='kor');
  if(korMs.length>0&&korMs.every(m=>preds[predKey(m)]))
    badges.push({icon:'🇰🇷',label:'한국전 전문가',cls:'badge-red'});
  // 조별 마스터
  const grpDone=Object.keys(GROUPS).filter(g=>preds[`grp-${g}-1`]&&preds[`grp-${g}-2`]);
  if(grpDone.length>=12) badges.push({icon:'🧠',label:'조별 마스터',cls:'badge-purple'});
  // 스코어 킬러 (정확 적중 1회부터 표시)
  let scoreHits=0;
  MATCHES.forEach(m=>{
    const sp=preds['s-'+predKey(m)];
    if(sp&&m.score){const[ph,pa]=sp.split('-').map(Number);if(ph===m.score[0]&&pa===m.score[1])scoreHits++;}
  });
  if(scoreHits>=1) badges.push({icon:'⚽',label:`스코어 ${scoreHits}회`,cls:'badge-green'});
  // 연속 적중 — streak: 현재 진행 중인 연속, maxStreak: 역대 최고 연속
  let maxStreak=0,streak=0;
  const _isPast=m=>new Date(m.kst).getTime()+2*3600000<Date.now();
  MATCHES.filter(m=>_isPast(m)).sort((a,b)=>new Date(a.kst)-new Date(b.kst)).forEach(m=>{
    const k=predKey(m);
    if(!preds[k]){streak=0;return;}
    if(matchResult(m)===preds[k]){streak++;maxStreak=Math.max(maxStreak,streak);}else streak=0;
  });
  // streak===maxStreak 이면 최고 기록이 '현재 진행 중' → 반짝이는 이펙트 유지, 아니면 끊긴 상태 → '최대' 표기 + 정적 배지
  if(maxStreak>=3){
    if(streak===maxStreak){
      badges.push(maxStreak>=5
        ?{icon:'🔥',label:`${maxStreak}연속 적중`,cls:'badge-fire'}
        :{icon:'✨',label:`${maxStreak}연속 적중`,cls:'badge-yellow'});
    }else{
      badges.push({icon:'🎯',label:`최대 ${maxStreak}연속 적중`,cls:'badge-dim'});
    }
  }
  // 우승 예측 성공
  const champW=getChampionWinner();
  if(champW&&preds['champion']===champW) badges.push({icon:'🏆',label:'우승 예측 성공',cls:'badge-gold'});
  return badges;
}
function renderBadges(badges){
  if(!badges||!badges.length)return'';
  return`<div class="rank-badges">${badges.map(b=>`<span class="badge-chip ${b.cls}" title="${b.label}">${b.icon} ${b.label}</span>`).join('')}</div>`;
}
function renderMainBadge(badge){
  if(!badge)return'';
  return`<span class="rank-main-badge ${badge.cls}" title="${badge.label}"><span class="rank-main-badge-icon">${badge.icon}</span><span>${badge.label}</span></span>`;
}
function renderRankPodium(ranking,hasSettled){
  if(!ranking||!ranking.length)return'';
  const top=ranking.slice(0,3);
  const displayOrder=top.length>=3?[top[1],top[0],top[2]]:top;
  const medals=['1','2','3'];
  const medalIcons=['🥇','🥈','🥉'];
  const tiers=['gold','silver','bronze'];
  return`<div class="rank-podium" aria-label="TOP 3 예측 랭킹">
    ${displayOrder.map(r=>{
      const i=top.indexOf(r);
      const isMe=r.nick===ROOM_NICK;
      const nickPreds=isMe?PREDS:(ROOM_PREDS[r.nick]||{});
      const mainBadge=calcBadges(r.nick,nickPreds)[0];
      const click=!isMe?`onclick="showNickPreds('${r.nick.replace(/'/g,"\\'")}')"`:'';
      const hint=hasSettled?`${r.correct}코인 / ${r.total}`:'경기 종료 후 집계';
      return`<button type="button" class="rank-podium-card ${tiers[i]}${isMe?' me':''}" ${click}>
        <span class="rank-podium-crown">${i===0?'👑':'★'}</span>
        <span class="rank-medal medal-${tiers[i]}">${tiers[i]==='gold'?'<b class="medal-shimmer-ring"></b>':''}<span>${medals[i]}</span></span>
        <span class="rank-medal-stars">★ ★ ★</span>
        <span class="rank-podium-nick">${r.nick}${isMe?' (나)':''}</span>
        <span class="rank-podium-score">${medalIcons[i]} ${hint}</span>
        ${mainBadge?`<span class="rank-podium-badge ${mainBadge.cls}">${mainBadge.icon} ${mainBadge.label}</span>`:''}
      </button>`;
    }).join('')}
  </div>`;
}

/* ── AI 챌린지 ── */
function allGroupsDone(){
  return Object.keys(GROUPS).every(g=>groupDone(g));
}
function calcAICoins(){
  return calcGrpPredCoins(AI_PICKS);
}
function calcAIBonus(grpPreds){
  if(!allGroupsDone())return 0;
  const userGrp=calcGrpPredCoins(grpPreds);
  const aiGrp=calcAICoins();
  if(userGrp>aiGrp)return 10;
  if(userGrp===aiGrp)return 5;
  return 0;
}

/* ── 그룹 예측 채점 ── */
function calcGrpPredCoins(grpPreds){
  let coins=0;
  const currentR=typeof R!=='undefined'?R:computeRecords();
  Object.entries(grpPreds||{}).forEach(([g,pred])=>{
    if(!groupDone(g))return;
    const sorted=GROUPS[g].slice().sort(sortRule(currentR));
    const actual1=sorted[0],actual2=sorted[1];
    let hit1=pred.p1&&pred.p1===actual1;
    let hit2=pred.p2&&pred.p2===actual2;
    if(hit1)coins+=2;
    if(hit2)coins+=1;
    if(hit1&&hit2)coins+=1; // 보너스
  });
  return coins;
}

/* ── BOOST 배팅 저장/로드 ── */
function loadBets(){
  try{const s=localStorage.getItem('wc2026-bets');if(s)MY_BETS=JSON.parse(s);}catch(e){MY_BETS={};}
}
function saveBetsLocal(){
  localStorage.setItem('wc2026-bets',JSON.stringify(MY_BETS));
  persistClientStateBridge();
}
function availableCoins(){
  const total=calcPredScore().coins;
  let pending=0;
  Object.values(MY_BETS).forEach(b=>{if(b&&!b.settled)pending+=b.amount;});
  return Math.max(0,total-pending);
}
function calcBetPnl(nick){
  let pnl=0;
  if(nick===ROOM_NICK){
    Object.values(MY_BETS).forEach(b=>{if(b&&b.settled)pnl+=b.pnl||0;});
  }else{
    const preds=ROOM_PREDS[nick]||{};
    Object.entries(preds).forEach(([k,v])=>{
      if(!k.startsWith('bet-')||!v||!v.settled)return;
      pnl+=v.pnl||0;
    });
  }
  return pnl;
}
function playCoinJingle(count=1){
  try{
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    for(let i=0;i<Math.min(count,4);i++){
      const t=ctx.currentTime+i*0.08;
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type='sine';
      osc.frequency.setValueAtTime(1400+Math.random()*300,t);
      osc.frequency.exponentialRampToValueAtTime(700,t+0.12);
      gain.gain.setValueAtTime(0.22,t);
      gain.gain.exponentialRampToValueAtTime(0.001,t+0.18);
      osc.start(t);osc.stop(t+0.18);
    }
  }catch(e){}
}
function popCoinEffect(){
  // 화면 우상단 코인 튀김 파티클
  for(let i=0;i<6;i++){
    const el=document.createElement('div');
    el.textContent='🪙';
    el.style.cssText=`position:fixed;right:${60+Math.random()*80}px;top:${14+Math.random()*30}px;font-size:${14+Math.random()*10}px;pointer-events:none;z-index:9999;animation:coin-pop .7s ease-out forwards;animation-delay:${i*60}ms`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),800+i*60);
  }
}
if(!document.getElementById('coin-pop-style')){
  const s=document.createElement('style');
  s.id='coin-pop-style';
  s.textContent=`@keyframes coin-pop{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(${Math.random()>0.5?'':'-'}${20+Math.random()*40}px,-${40+Math.random()*60}px) scale(.4);opacity:0}}`;
  document.head.appendChild(s);
}
async function saveBet(koId,val,amount,multiplier){
  if(!ROOM_CODE||!ROOM_NICK)return;
  MY_BETS[koId]={val,amount,multiplier,settled:false};
  saveBetsLocal();
  playCoinJingle(Math.min(amount,4));
  popCoinEffect();
  const ref=getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK);
  await ref.set({[`bet-${koId}`]:MY_BETS[koId]},{merge:true});
}
async function deleteBet(koId){
  if(!ROOM_CODE||!ROOM_NICK)return;
  delete MY_BETS[koId];
  saveBetsLocal();
  const ref=getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK);
  await ref.update({[`bet-${koId}`]:firebase.firestore.FieldValue.delete()}).catch(()=>{});
}
async function settleBets(){
  if(!ROOM_CODE||!ROOM_NICK)return;
  const toSettle=Object.entries(MY_BETS).filter(([,b])=>b&&!b.settled);
  if(!toSettle.length)return;
  let changed=false;
  const updates={};
  toSettle.forEach(([koId,bet])=>{
    const ko=KO.find(x=>koKey(x)===koId);
    if(!ko||!ko.score)return;
    const result=koMatchResult(ko);
    const hit=result===bet.val;
    const pnl=hit?bet.amount*bet.multiplier:-bet.amount;
    MY_BETS[koId]={...bet,settled:true,hit,pnl};
    updates[`bet-${koId}`]=MY_BETS[koId];
    changed=true;
  });
  if(!changed)return;
  saveBetsLocal();
  await getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK)
    .set(updates,{merge:true}).catch(e=>console.warn('settleBets:',e));
  rerender();
}

function loadPreds(){
  try{
    const hash=location.hash;
    if(hash.startsWith('#pred=')){
      const dec=atob(hash.slice(6));
      PREDS={};
      dec.split('|').forEach(e=>{const[k,v]=e.split(':');if(k&&'hda'.includes(v))PREDS[k]=v;});
      VIEW_MODE=true;
    }else{
      const s=localStorage.getItem('wc2026-preds');
      if(s)PREDS=JSON.parse(s);
      const ss=localStorage.getItem('wc2026-score-preds');
      if(ss)SCORE_PREDS=JSON.parse(ss);
      loadGrpPreds();
      loadBets();
      const koKeys=Object.keys(PREDS).filter(k=>k.startsWith('ko-'));
      if(koKeys.length){
        koKeys.forEach(k=>delete PREDS[k]);
        localStorage.setItem('wc2026-preds',JSON.stringify(PREDS));
        persistClientStateBridge();
        setTimeout(()=>{
          if(!ROOM_CODE||!ROOM_NICK)return;
          const updates={};
          koKeys.forEach(k=>{updates[k]=firebase.firestore.FieldValue.delete();});
          getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK)
            .update(updates).catch(()=>{});
        },2000);
      }
    }
  }catch(e){PREDS={};}
}
function predictScore(key,h,a){
  if(VIEW_MODE)return;
  const score=`${parseInt(h)||0}-${parseInt(a)||0}`;
  SCORE_PREDS[key]=score;
  localStorage.setItem('wc2026-score-preds',JSON.stringify(SCORE_PREDS));
  persistClientStateBridge();
  syncScorePredToRoom(key,score);
}
async function syncScorePredToRoom(key,val){
  if(!ROOM_CODE||!ROOM_NICK)return;
  const ref=getDb().collection('wc2026_rooms').doc(ROOM_CODE).collection('predictions').doc(ROOM_NICK);
  await ref.set({['s-'+key]:val},{merge:true});
}
function applyPredVisuals(){
  Object.entries(PREDS).forEach(([key,val])=>{
    document.querySelectorAll(`.pred-btn[data-pkey="${key}"]`).forEach(btn=>{
      btn.classList.remove('sel-h','sel-d','sel-a','dimmed');
      if(btn.dataset.pval===val){
        btn.classList.add(val==='h'?'sel-h':val==='d'?'sel-d':'sel-a');
      }else{
        btn.classList.add('dimmed');
      }
    });
  });
}
function predict(key,val){
  if(VIEW_MODE)return;
  PREDS[key]=val;
  localStorage.setItem('wc2026-preds',JSON.stringify(PREDS));
  persistClientStateBridge();
  syncPredToRoom(key,PREDS[key]);
  renderSchedule();
  renderPredPanel();
  applyTwemoji();
}
function calcPredScore(){
  let correct=0,settled=0,total=0,scoreHits=0;
  MATCHES.forEach(m=>{
    const k=predKey(m);if(!PREDS[k])return;total++;
    const r=matchResult(m);
    if(r){
      settled++;
      if(PREDS[k]===r)correct++;
      if(SCORE_PREDS[k]&&m.score){
        const[ph,pa]=SCORE_PREDS[k].split('-').map(Number);
        if(ph===m.score[0]&&pa===m.score[1])scoreHits++;
      }
    }
  });
  KO.forEach(ko=>{const k=koKey(ko);if(!PREDS[k])return;total++;const r=koMatchResult(ko);if(r){settled++;if(PREDS[k]===r)correct++;}});
  const grpCoins=calcGrpPredCoins(GRP_PREDS);
  const betPnl=(isBoostOpen()&&ROOM_NICK)?calcBetPnl(ROOM_NICK):0;
  const champWinner=getChampionWinner();
  const champCoins=PREDS['champion']&&champWinner&&PREDS['champion']===champWinner?CHAMP_COINS:0;
  const aiBonus=calcAIBonus(GRP_PREDS);
  const coins=correct+scoreHits*3+grpCoins+betPnl+champCoins+aiBonus;
  return{correct,settled,total,scoreHits,grpCoins,betPnl,champCoins,aiBonus,coins};
}
function showCoinToast(count){
  const el=document.createElement('div');
  el.className='coin-toast';
  el.textContent=count===1?'🪙 +1 코인 획득!':`🪙 +${count} 코인 획득!`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2700);
}
function renderPredPanel(){
  const panel=document.getElementById('pred-panel');
  const banner=document.getElementById('view-banner');
  if(!panel)return;
  if(VIEW_MODE&&banner)banner.style.display='';
  const{correct,settled,total,scoreHits,grpCoins,coins}=calcPredScore();
  if(lastKnownCorrect>=0&&coins>lastKnownCorrect){
    showCoinToast(coins-lastKnownCorrect);
  }
  lastKnownCorrect=coins;
  const hasGrpPreds=Object.keys(GRP_PREDS).some(g=>GRP_PREDS[g].p1||GRP_PREDS[g].p2);
  if(total===0&&!hasGrpPreds&&!VIEW_MODE){panel.style.display='none';return;}
  panel.style.display='';
  const pct=settled>0?Math.round(correct/settled*100)+`%`:'-';
  const coinDisplay=coins>0?`<span style="font-size:.85rem;color:var(--gold);font-weight:900">🪙 ${coins}코인</span> · `:'';
  const scoreHitBadge=scoreHits>0?`<span style="font-size:.72rem;color:#4ade80;font-weight:700;margin-left:4px">⚽ 스코어 적중 ${scoreHits}회</span>`:'';
  const grpBadge=grpCoins>0?`<span style="font-size:.72rem;color:var(--gold);font-weight:700;margin-left:4px">🏆 조 예측 +${grpCoins}</span>`:'';
  const actionBtns=VIEW_MODE?'':`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-left:auto"><button class="pred-share-btn" style="margin-left:0" onclick="showMyAnalysis()">📊 분석</button><button class="pred-share-btn" onclick="sharePreds()">🔗 공유</button></div>`;
  panel.innerHTML=`<div class="pred-panel">
    <div><div class="pred-score-big">${settled>0?`${correct}/${settled}`:`${total>0?total+'경기':'예측 중'}`}</div>
    <div class="pred-lbl">${settled>0?`${coinDisplay}정답률 ${pct} · 예측 ${total}경기 중${scoreHitBadge}${grpBadge}`:'예측 진행 중 · 경기 종료 후 채점'}</div></div>
    ${actionBtns}
  </div>`;
}
function sharePreds(){
  const entries=Object.entries(PREDS).map(([k,v])=>`${k}:${v}`).join('|');
  if(!entries){alert('예측한 경기가 없어요! 일정에서 경기를 예측해보세요.');return;}
  const url=`${location.origin}${location.pathname}#pred=${btoa(entries)}`;
  navigator.clipboard.writeText(url)
    .then(()=>alert('링크 복사 완료! 친구에게 공유해보세요 🎉'))
    .catch(()=>prompt('아래 링크를 복사하세요:',url));
}
