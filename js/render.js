/* ── 내 예측 적중률 통계 패널 ── */
function renderMyStats(){
  const el=document.getElementById('my-stats-panel');
  if(!el)return;
  if(!ROOM_NICK||VIEW_MODE){el.style.display='none';return;}
  let correct=0,total=0;
  MATCHES.forEach(m=>{
    if(!m.score)return;
    const k=predKey(m);
    if(PREDS[k]===undefined)return;
    total++;
    if(matchResult(m)===PREDS[k])correct++;
  });
  if(total===0){el.style.display='none';return;}
  const pct=Math.round(correct/total*100);
  el.style.display='inline-flex';
  el.innerHTML=`<div class="my-stats-card">🎯 내 적중률 <b>${correct}/${total}</b> · <b>${pct}%</b></div>`;
}

/* ── 한국 경기 렌더 ── */
function renderKorea(){
  const kor=MATCHES.filter(m=>m.kr).sort((a,b)=>new Date(a.kst)-new Date(b.kst));
  document.getElementById('korea-list').innerHTML=kor.map(m=>{
    const h=TEAMS[m.home],a=TEAMS[m.away],d=new Date(m.kst);
    const st=matchStatus(m);
    const scoreHTML=m.score?`<span class="kr-mc-score">${m.score[0]}:${m.score[1]}</span>`:`<span class="kr-mc-vs">VS</span>`;
    return`<div class="kr-match-card">
      <div class="kr-mc-head">
        <span class="kr-mc-time">${hhmm(d)} KST</span>
        <span class="kr-mc-date">${d.getMonth()+1}/${d.getDate()}(${DOW[d.getDay()]})</span>
        <span class="kr-mc-city">📍 ${m.city}</span>
        <span class="st-badge ${st.cls}">${st.label}</span>
      </div>
      <div class="kr-mc-teams">
        <span>${h.emo} ${h.name}</span>${scoreHTML}<span>${a.emo} ${a.name}</span>
      </div>
      <div class="kr-mc-foot">
        ${m.tv.map(badge).join(' ')}
        <button class="kr-act-btn gcal" onclick="window.open('${gcalUrl(m)}','_blank')">📅 구글 캘린더</button>
        <button class="kr-act-btn share" onclick="copyShare(MATCHES.find(x=>x.kst==='${m.kst}'))">🔗 공유</button>
      </div>
    </div>`;
  }).join('');
}

/* ── 오늘/LIVE 경기 카드 (일정탭 수준) ── */
function todayMatchCard(m){
  const h=TEAMS[m.home],a=TEAMS[m.away],t=new Date(m.kst),st=matchStatus(m),now=new Date();
  const scoreHTML=m.score
    ?`<span class="m-score">${m.score[0]}:${m.score[1]}</span>`
    :`<span class="m-score pending">VS</span>`;
  const k=predKey(m),pred=PREDS[k],result=matchResult(m);
  const canClick=!m.score&&new Date(m.kst)>now&&!VIEW_MODE;
  const showBtns=canClick||(VIEW_MODE&&!m.score&&new Date(m.kst)>now);
  let predHTML='';
  if(showBtns){
    const dis=VIEW_MODE?' disabled':'';
    const sp=SCORE_PREDS[k];
    const[sh,sa]=sp?sp.split('-'):['',''];
    const scoreInput=pred&&!VIEW_MODE?`<div class="score-pred-row">
      <span class="score-pred-label">⚽ 스코어</span>
      <input class="score-inp" type="number" min="0" max="20" placeholder="0" value="${sh}" data-pkey="${k}" data-side="h" onchange="onScoreInput(this)">
      <span class="score-sep">:</span>
      <input class="score-inp" type="number" min="0" max="20" placeholder="0" value="${sa}" data-pkey="${k}" data-side="a" onchange="onScoreInput(this)">
      <span class="score-bonus">+3🪙</span>
    </div>`:'';
    predHTML=`<div class="pred-btns">
      <button class="pred-btn${pred==='h'?' sel-h':''}" data-pkey="${k}" data-pval="h"${dis} onclick="predict('${k}','h')">${h.name} 승</button>
      <button class="pred-btn${pred==='d'?' sel-d':''}" data-pkey="${k}" data-pval="d"${dis} onclick="predict('${k}','d')">무승부</button>
      <button class="pred-btn${pred==='a'?' sel-a':''}" data-pkey="${k}" data-pval="a"${dis} onclick="predict('${k}','a')">${a.name} 승</button>
    </div>${scoreInput}`;
  }else if(pred){
    const lbl=pred==='h'?h.name+' 승':pred==='d'?'무승부':a.name+' 승';
    const sp=SCORE_PREDS[k];
    const scoreTag=sp?` <span class="score-tag">⚽ ${sp.replace('-',':')}</span>`:'';
    if(result){
      const hit=pred===result;
      let scoreBadge='';
      if(sp&&m.score){const[ph,pa]=sp.split('-').map(Number);scoreBadge=ph===m.score[0]&&pa===m.score[1]?`<span class="score-hit">⚽ 스코어 적중 +3🪙</span>`:`<span class="score-miss">⚽ ${sp.replace('-',':')} 불일치</span>`;}
      predHTML=`<div class="pred-btns"><span class="${hit?'pred-hit':'pred-miss'}">${hit?'✓ 예측 적중':'✗ 예측 실패'} · ${lbl}</span>${scoreTag}${scoreBadge}</div>`;
    }else{
      predHTML=`<div class="pred-btns"><span class="pred-pending">🔒 ${lbl}${scoreTag} · 경기 대기 중</span></div>`;
    }
  }else if(new Date(m.kst)<=now&&!m.score){
    predHTML=`<div class="pred-btns"><span class="pred-pending">🔒 예측 마감</span></div>`;
  }
  let roomChipHTML='';
  if(ROOM_CODE){
    const rc=roomPredSummary(k);
    const rt=rc.h+rc.d+rc.a;
    const ek=k.replace(/'/g,"\\'");
    const ehn=h.name.replace(/'/g,"\\'"),ean=a.name.replace(/'/g,"\\'");
    const chipLabel=rt>0?`<span class="pred-chip-dot"></span> ${rt}명 예측 중 · 보기`:`✨ 예측 현황 보기`;
    roomChipHTML=`<button class="pred-chip" onclick="showPredModal('${ek}','${ehn}','${ean}')">${chipLabel}</button>`;
  }
  const isPast=new Date(m.kst).getTime()+2*3600000<now.getTime();
  return`<div class="match-card${m.kr?' kr':''}">
    <div class="m-time">${hhmm(t)}<small>KST</small></div>
    <div class="m-body">
      <div class="m-teams">
        <span class="m-flag">${h.emo}</span><span class="m-tname">${h.name}</span>
        ${scoreHTML}
        <span class="m-flag">${a.emo}</span><span class="m-tname">${a.name}</span>
        <span class="st-badge ${st.cls}" style="margin-left:auto">${st.label}</span>
      </div>
      <div class="m-meta">
        <span class="m-group">${m.group}조</span>
        <span class="m-city">${m.city}</span>
        ${m.tv.map(badge).join(' ')}
        <a href="https://www.google.com/search?q=${encodeURIComponent('fotmob '+h.name+' vs '+a.name)}" target="_blank" rel="noopener" class="b b-fotmob">📋 라인업</a>
        ${isPast?`<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(h.name+' '+a.name+' 하이라이트 2026')}" target="_blank" rel="noopener" class="b b-hl">🎬 하이라이트</a>`:''}
        ${matchDeadlineText(m)}
      </div>
      ${predHTML}${roomChipHTML}
      ${renderRxnBar(predKey(m))}
    </div>
  </div>`;
}

/* ── 다음/오늘/LIVE 경기 섹션 ── */
function renderNext(){
  const now=new Date();
  const todayStr=localDateStr(now);
  // 한국전 라이브 감지 (킥오프 후 105분 이내, 결과 없음)
  window._korLiveMatch=MATCHES.filter(m=>{
    if(!m.kr||m.score)return false;
    const diff=new Date(m.kst)-now;
    return diff<=0&&diff>-105*60*1000;
  }).sort((a,b)=>new Date(a.kst)-new Date(b.kst))[0]||null;
  const label=document.getElementById('next-label');
  const navTxt=document.getElementById('nav-today-txt');
  const box=document.getElementById('next');

  // 1. LIVE 경기
  const live=MATCHES.filter(m=>{
    if(m.score)return false;
    const diff=new Date(m.kst)-now;
    return diff<=0&&diff>-120*60*1000;
  }).sort((a,b)=>new Date(a.kst)-new Date(b.kst));
  if(live.length>0){
    if(label){label.textContent='🔴 LIVE 경기';label.className='next-section-label live';}
    if(navTxt)navTxt.textContent='LIVE';
    const upcoming=MATCHES.filter(m=>!m.score&&new Date(m.kst)>now&&m.kst.slice(0,10)===todayStr)
      .sort((a,b)=>new Date(a.kst)-new Date(b.kst));
    const upcomingHTML=upcoming.length>0
      ?`<div class="next-section-label" style="margin-top:14px">📅 오늘 예정 경기 · ${upcoming.length}경기</div>`+upcoming.map(todayMatchCard).join('')
      :'';
    box.innerHTML=live.map(todayMatchCard).join('')+upcomingHTML;
    applyTwemoji();
    const nextKorLive=MATCHES.filter(m=>m.kr&&!m.score&&new Date(m.kst)>now)
      .sort((a,b)=>new Date(a.kst)-new Date(b.kst))[0];
    return nextKorLive?new Date(nextKorLive.kst):null;
  }

  // 2. 오늘 경기
  const today=MATCHES.filter(m=>m.kst.slice(0,10)===todayStr)
    .sort((a,b)=>new Date(a.kst)-new Date(b.kst));
  if(today.length>0){
    const finished=today.filter(m=>m.score).length;
    const remaining=today.length-finished;
    if(label){
      label.textContent=`📅 오늘의 경기 · ${today.length}경기${remaining>0?' · '+remaining+'경기 예정':''}`;
      label.className='next-section-label';
    }
    if(navTxt)navTxt.textContent='오늘경기';
    box.innerHTML=today.map(todayMatchCard).join('');
    applyTwemoji();
    const nextKor=MATCHES.filter(m=>m.kr&&!m.score&&new Date(m.kst)>now)
      .sort((a,b)=>new Date(a.kst)-new Date(b.kst))[0];
    return nextKor?new Date(nextKor.kst):null;
  }

  // 3. 다음 한국 경기 (기존)
  const next=MATCHES.filter(m=>m.kr&&new Date(m.kst).getTime()+2*3600*1000>now)
    .sort((a,b)=>new Date(a.kst)-new Date(b.kst))[0];
  if(label){label.textContent='🇰🇷 다음 한국 경기';label.className='next-section-label';}
  if(navTxt)navTxt.textContent='다음경기';
  if(!next){box.innerHTML="<p style='text-align:center;padding:16px;color:var(--dim)'>예정된 한국전이 없습니다.</p>";return null;}
  const d=new Date(next.kst),h=TEAMS[next.home],a=TEAMS[next.away];
  const mid=next.score
    ?`<div class="nc-score">${next.score[0]} : ${next.score[1]}</div>`
    :`<div class="nc-vs"><div class="nc-time">${hhmm(d)}<small>${d.getMonth()+1}/${d.getDate()}(${DOW[d.getDay()]}) KST</small></div></div>`;
  box.innerHTML=`<div class="next-card">
    <div class="nc-label">🇰🇷 대한민국 다음 경기 · 그룹 ${next.group}</div>
    <div class="nc-match">
      <div class="nc-team"><div class="nc-flag">${h.emo}</div><div class="nc-name">${h.name}</div></div>
      ${mid}
      <div class="nc-team"><div class="nc-flag">${a.emo}</div><div class="nc-name">${a.name}</div></div>
    </div>
    <div class="nc-foot">${next.city} &nbsp;${next.tv.map(badge).join(' ')}</div>
  </div>`;
  return next.score?null:d;
}

/* ── 카운트다운 ── */
let _korLiveTick=null;
function _showKorLive(match){
  if(_korLiveTick){clearTimeout(_korLiveTick);_korLiveTick=null;}
  const panel=document.querySelector('.count-panel');
  if(!panel)return;
  const kickoff=new Date(match.kst);
  const h=TEAMS[match.home],a=TEAMS[match.away];
  const vs=`${h?h.emo:'🇰🇷'} vs ${a?a.emo:match.away}`;
  function tick(){
    const elapsed=Math.floor((new Date()-kickoff)/60000);
    let halfLabel,elapsedHtml;
    if(elapsed<45){
      halfLabel='전반전';
      elapsedHtml=`${elapsed}<span class="count-live-unit">분</span>`;
    }else if(elapsed<60){
      halfLabel='하프타임';
      elapsedHtml=`<span style="font-size:1.6rem">⏸</span>`;
    }else{
      halfLabel='후반전';
      elapsedHtml=`${elapsed-60}<span class="count-live-unit">분</span>`;
    }
    panel.innerHTML=`
      <div class="count-live-inner">
        <div class="count-live-badge">🔴 LIVE</div>
        <div class="count-live-teams">${vs}</div>
        <div class="count-live-half">${halfLabel}</div>
        <div class="count-live-elapsed">${elapsedHtml}</div>
        <a href="https://chzzk.naver.com/search?query=월드컵+한국" target="_blank" rel="noopener" class="count-chzzk-btn">📺 치지직 보러가기</a>
      </div>
    `;
    if(window.twemoji)twemoji.parse(panel);
    _korLiveTick=setTimeout(tick,20000);
  }
  tick();
}
function startCountdown(target){
  if(_korLiveTick){clearTimeout(_korLiveTick);_korLiveTick=null;}
  if(window._korLiveMatch){_showKorLive(window._korLiveMatch);return;}
  const el=document.getElementById('countdown'),lb=document.getElementById('count-label');
  if(!target){if(el)el.textContent='';if(lb)lb.textContent='';return;}
  // 일반 카운트다운 - count-panel 원래 구조 복원
  const panel=document.querySelector('.count-panel');
  if(panel&&!panel.querySelector('#countdown')){
    panel.innerHTML=`<div class="countdown-label" id="count-label">다음 한국전까지</div><div class="count-divider"><span></span><span></span></div><div id="countdown">--:--:--</div><div class="count-unit-row"><span>시간</span><span>분</span><span>초</span></div>`;
  }
  const el2=document.getElementById('countdown'),lb2=document.getElementById('count-label');
  function tick(){
    let diff=target-new Date();
    if(diff<=0){if(el2)el2.textContent='킥오프!';if(lb2)lb2.textContent='지금 경기 중';return;}
    const d=Math.floor(diff/86400000);diff%=86400000;
    const hh=String(Math.floor(diff/3600000)).padStart(2,"0");diff%=3600000;
    const mm=String(Math.floor(diff/60000)).padStart(2,"0");diff%=60000;
    const ss=String(Math.floor(diff/1000)).padStart(2,"0");
    if(el2)el2.textContent=`${d>0?d+'일 ':''}${hh}:${mm}:${ss}`;
    setTimeout(tick,1000);
  }
  tick();
}

/* ── 조별리그 진행 현황 바 ── */
function renderScheduleProgress(){
  const el=document.getElementById('schedule-progress');
  if(!el)return;
  const total=MATCHES.length; // 72
  const done=MATCHES.filter(m=>m.score).length;
  const remaining=total-done;
  const pct=Math.round(done/total*100);
  const now=new Date();
  const live=MATCHES.filter(m=>{
    if(m.score)return false;
    const diff=new Date(m.kst)-now;
    return diff<=0&&diff>-120*60*1000;
  }).length;
  const liveTag=live>0?`<span class="sp-live-badge">🔴 LIVE ${live}</span>`:'';
  el.innerHTML=`<div class="schedule-progress">
    <div class="sp-top">
      <div class="sp-left">
        <span class="sp-title">⚽ 조별리그 진행 현황</span>
        ${liveTag}
      </div>
      <div class="sp-right">
        <span class="sp-done-num">${done}</span>
        <span class="sp-done-total"> / ${total}경기</span>
      </div>
    </div>
    <div class="sp-bar-wrap">
      <div class="sp-bar-fill" style="width:${pct}%">
        <div class="sp-bar-shine"></div>
      </div>
    </div>
    <div class="sp-foot">
      <span class="sp-pct">${pct}<span style="font-size:.75rem;font-weight:400">%</span></span>
      <span class="sp-remain">${remaining > 0 ? `잔여 <b>${remaining}경기</b> 남음` : '🏁 조별리그 완료!'}</span>
    </div>
  </div>`;
}

/* ── 일정 ── */
function renderSchedule(){
  renderScheduleProgress();
  const wrap=document.getElementById('schedule-list');
  const now=new Date();
  const todayStr=localDateStr(now);
  const tomorrowStr=localDateStr(new Date(now.getTime()+86400000));
  let list=MATCHES.slice().sort((a,b)=>new Date(a.kst)-new Date(b.kst));
  if(scheduleFilter==='kor') list=list.filter(m=>m.kr);
  else if(scheduleFilter==='today') list=list.filter(m=>m.kst.slice(0,10)===todayStr);
  else if(scheduleFilter==='tomorrow') list=list.filter(m=>m.kst.slice(0,10)===tomorrowStr);
  else if(scheduleFilter==='date'&&scheduleDate) list=list.filter(m=>m.kst.slice(0,10)===scheduleDate);
  const isPast=m=>new Date(m.kst).getTime()+2*3600*1000<now.getTime();
  const pastList=scheduleFilter==='all'?list.filter(isPast):[];
  if(scheduleFilter==='all'&&!showPastMatches) list=list.filter(m=>!isPast(m)||m.kst.slice(0,10)===todayStr);
  if(!list.length){wrap.innerHTML=`<p style="color:var(--dim);padding:20px 0;text-align:center">해당하는 경기가 없습니다.</p>`;return;}
  const byDay={};
  list.forEach(m=>{const k=m.kst.slice(0,10);(byDay[k]=byDay[k]||[]).push(m);});
  wrap.innerHTML=Object.entries(byDay).map(([date,dayList])=>{
    const d=new Date(date+"T00:00");
    const rows=dayList.map(m=>{
      const h=TEAMS[m.home],a=TEAMS[m.away],t=new Date(m.kst);
      const st=matchStatus(m);
      const scoreHTML=m.score
        ?`<span class="m-score">${m.score[0]}:${m.score[1]}</span>`
        :`<span class="m-score pending">VS</span>`;
      const k=predKey(m),pred=PREDS[k],result=matchResult(m);
      const canClick=!m.score&&new Date(m.kst)>now&&!VIEW_MODE;
      const showBtns=canClick||(VIEW_MODE&&!m.score&&new Date(m.kst)>now);
      let predHTML='';
      if(showBtns){
        const dis=VIEW_MODE?' disabled':'';
        const isKO=!m.group;
        const sp=SCORE_PREDS[k];
        const[sh,sa]=sp?sp.split('-'):['',''];
        const scoreInput=pred&&!VIEW_MODE?`<div class="score-pred-row">
          <span class="score-pred-label">⚽ 스코어</span>
          <input class="score-inp" type="number" min="0" max="20" placeholder="0" value="${sh}" data-pkey="${k}" data-side="h" onchange="onScoreInput(this)">
          <span class="score-sep">:</span>
          <input class="score-inp" type="number" min="0" max="20" placeholder="0" value="${sa}" data-pkey="${k}" data-side="a" onchange="onScoreInput(this)">
          <span class="score-bonus">+3🪙</span>
        </div>`:'';
        predHTML=`<div class="pred-btns">
          <button class="pred-btn${pred==='h'?' sel-h':''}" data-pkey="${k}" data-pval="h"${dis} onclick="predict('${k}','h')">${h.name} 승</button>
          ${isKO?'':`<button class="pred-btn${pred==='d'?' sel-d':''}" data-pkey="${k}" data-pval="d"${dis} onclick="predict('${k}','d')">무승부</button>`}
          <button class="pred-btn${pred==='a'?' sel-a':''}" data-pkey="${k}" data-pval="a"${dis} onclick="predict('${k}','a')">${a.name} 승</button>
        </div>${scoreInput}`;
      }else if(pred){
        const lbl=pred==='h'?h.name+' 승':pred==='d'?'무승부':a.name+' 승';
        const sp=SCORE_PREDS[k];
        const scoreTag=sp?` <span class="score-tag">⚽ ${sp.replace('-',':')}</span>`:'';
        if(result){
          const hit=pred===result;
          let scoreBadge='';
          if(sp&&m.score){const[ph,pa]=sp.split('-').map(Number);scoreBadge=ph===m.score[0]&&pa===m.score[1]?`<span class="score-hit">⚽ 스코어 적중 +3🪙</span>`:`<span class="score-miss">⚽ ${sp.replace('-',':')} 불일치</span>`;}
          predHTML=`<div class="pred-btns"><span class="${hit?'pred-hit':'pred-miss'}">${hit?'✓ 예측 적중':'✗ 예측 실패'} · ${lbl}</span>${scoreTag}${scoreBadge}</div>`;
        }else{
          predHTML=`<div class="pred-btns"><span class="pred-pending">🔒 ${lbl}${scoreTag} · 경기 대기 중</span></div>`;
        }
      }else if(new Date(m.kst)<=now&&!m.score){
        predHTML=`<div class="pred-btns"><span class="pred-pending">🔒 예측 마감</span></div>`;
      }
      let roomChipHTML='';
      if(ROOM_CODE){
        const rc=roomPredSummary(k);
        const rt=rc.h+rc.d+rc.a;
        const ek=k.replace(/'/g,"\\'");
        const ehn=h.name.replace(/'/g,"\\'"),ean=a.name.replace(/'/g,"\\'");
        const chipLabel=rt>0?`<span class="pred-chip-dot"></span> ${rt}명 예측 중 · 보기`:`✨ 예측 현황 보기`;
        roomChipHTML=`<button class="pred-chip" onclick="showPredModal('${ek}','${ehn}','${ean}')">${chipLabel}</button>`;
      }
      return`<div class="match-card${m.kr?' kr':''}" onclick="if(!event.target.closest('button,a,.m-score,.score-pred-row,.score-inp'))window.goToGroup('${m.group}',event)" style="cursor:pointer">
        <div class="m-time">${hhmm(t)}<small>KST</small></div>
        <div class="m-body">
          <div class="m-teams">
            <span class="m-flag">${h.emo}</span><span class="m-tname">${h.name}</span>
            ${scoreHTML}
            <span class="m-flag">${a.emo}</span><span class="m-tname">${a.name}</span>
            <span class="st-badge ${st.cls}" style="margin-left:auto">${st.label}</span>
          </div>
          <div class="m-meta">
            <span class="m-group">${m.group}조</span>
            <span class="m-city">${m.city}</span>
            ${m.tv.map(badge).join(' ')}
            <a href="https://www.google.com/search?q=${encodeURIComponent('fotmob '+h.name+' vs '+a.name)}" target="_blank" rel="noopener" class="b b-fotmob">📋 라인업</a>
            ${isPast(m)?`<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(h.name+' '+a.name+' 하이라이트 2026')}" target="_blank" rel="noopener" class="b b-hl">🎬 하이라이트</a>`:''}
            ${matchDeadlineText(m)}
          </div>
          ${predHTML}${roomChipHTML}
          ${renderRxnBar(predKey(m))}
        </div>
      </div>`;
    }).join('');
    return`<div class="day">
      <div class="day-head">
        <span class="day-date">${d.getMonth()+1}.${d.getDate()}</span>
        <span class="day-dow">${DOW[d.getDay()]}요일</span>
        <span class="day-cnt">${dayList.length}경기</span>
      </div>${rows}</div>`;
  }).join('');
  if(scheduleFilter==='all'){
    if(pastList.length){
      const btn=document.createElement('button');
      btn.className='past-toggle-btn';
      btn.textContent=showPastMatches?`▲ 지난 경기 숨기기`:`▼ 지난 경기 보기 (${pastList.length}경기)`;
      btn.onclick=()=>{showPastMatches=!showPastMatches;renderSchedule();};
      wrap.prepend(btn);
    }
  }
  if(window.twemoji) twemoji.parse(wrap);
  renderMyStats();
  applyPredVisuals();
}

/* ── 카운트다운 자동 갱신 (48시간 이내 경기가 있을 때만 1분마다) ── */
function scheduleDeadlineRefresh(){
  if(deadlineRefreshTimer)return;
  const soon=MATCHES.some(m=>{
    if(m.score)return false;
    const diff=new Date(m.kst)-new Date();
    return diff>0&&diff<48*3600000;
  });
  if(!soon)return;
  deadlineRefreshTimer=setInterval(()=>{renderSchedule();},60000);
}

/* ── 순위 계산 ── */
function computeRecords(){
  const R={};
  Object.values(GROUPS).flat().forEach(id=>R[id]={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0});
  MATCHES.forEach(m=>{
    if(!m.score)return;
    const[hs,as]=m.score,H=R[m.home],A=R[m.away];
    H.p++;A.p++;H.gf+=hs;H.ga+=as;A.gf+=as;A.ga+=hs;
    if(hs>as){H.w++;H.pts+=3;A.l++;}
    else if(hs<as){A.w++;A.pts+=3;H.l++;}
    else{H.d++;A.d++;H.pts++;A.pts++;}
  });
  return R;
}
const sortRule=R=>(a,b)=>R[b].pts-R[a].pts||(R[b].gf-R[b].ga)-(R[a].gf-R[a].ga)||R[b].gf-R[a].gf;
const groupDone=g=>MATCHES.filter(m=>m.group===g).every(m=>m.score);
function rankOf(R,g,n){if(!groupDone(g))return null;return GROUPS[g].slice().sort(sortRule(R))[n-1];}
function thirdRanking(R){
  return Object.keys(GROUPS).filter(groupDone)
    .map(g=>({g,id:GROUPS[g].slice().sort(sortRule(R))[2]}))
    .sort((a,b)=>sortRule(R)(a.id,b.id));
}

/* ── 그룹 순위 모달 ── */
window.goToGroup=function(g,e){
  if(e){e.stopPropagation();e.preventDefault();}
  if(!g||g==='undefined')return;
  const ids=GROUPS[g];
  if(!ids)return;
  const sorted=ids.slice().sort(sortRule(R));
  const rows=sorted.map((id,i)=>{
    const t=TEAMS[id],r=R[id];
    const gd=r.gf-r.ga;
    const qual=i<2?'background:rgba(34,197,94,.1);border-left:3px solid #22c55e;':'border-left:3px solid transparent;';
    return`<tr style="${qual}border-bottom:1px solid rgba(255,255,255,.05)">
      <td style="padding:11px 6px;color:var(--dim);font-weight:700">${i+1}</td>
      <td style="padding:11px 6px">
        <span style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.25rem;line-height:1">${t.emo}</span>
          <span style="font-weight:700;font-size:.88rem;color:${id==='kor'?'var(--gold)':'#e2e8f0'};white-space:nowrap">${t.name}</span>
        </span>
      </td>
      <td style="padding:11px 6px;text-align:center;color:var(--dim)">${r.w}</td>
      <td style="padding:11px 6px;text-align:center;color:var(--dim)">${r.d}</td>
      <td style="padding:11px 6px;text-align:center;color:var(--dim)">${r.l}</td>
      <td style="padding:11px 6px;text-align:center;font-weight:700;color:${gd>0?'var(--green)':gd<0?'var(--red)':'var(--dim)'}">${gd>0?'+':''}${gd}</td>
      <td style="padding:11px 6px;text-align:center;font-weight:900;font-size:.95rem;color:#fff">${r.pts}</td>
    </tr>`;
  }).join('');
  const modal=document.getElementById('grp-modal');
  modal.innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeGrpModal()">
      <div class="pred-modal-box" style="max-width:560px;width:100%">
        <div class="pred-modal-handle"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div style="font-family:'Black Han Sans',sans-serif;font-size:1.3rem;color:var(--gold)">그룹 ${g}${g==='A'?' 🇰🇷':''} 순위</div>
          <button onclick="closeGrpModal()" style="background:rgba(255,255,255,.08);border:1px solid var(--border);color:#ccc;font-size:1rem;cursor:pointer;padding:4px 10px;border-radius:8px">✕ 닫기</button>
        </div>
        <div style="overflow-x:auto;margin:0 -4px">
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;min-width:320px">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:left">#</th>
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:left">팀</th>
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:center">승</th>
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:center">무</th>
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:center">패</th>
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:center">득실</th>
              <th style="padding:7px 6px;color:var(--dim);font-weight:600;text-align:center">승점</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        </div>
        <p style="margin-top:14px;font-size:.72rem;color:var(--dim);text-align:center">🟢 상위 2팀 32강 직행</p>
      </div>
    </div>`;
  modal.style.display='block';
  document.body.style.overflow='hidden';
  if(window.twemoji) twemoji.parse(modal);
};
window.closeGrpModal=function(){
  const modal=document.getElementById('grp-modal');
  modal.style.display='none';
  modal.innerHTML='';
  document.body.style.overflow='';
};

function renderGrpPredUI(g,ids){
  if(VIEW_MODE)return'';
  const locked=grpLocked(g);
  const done=groupDone(g);
  const pred=GRP_PREDS[g]||{};

  // 그룹 완료 후 결과 표시
  if(done){
    const sorted=ids.slice().sort(sortRule(R));
    const actual1=sorted[0],actual2=sorted[1];
    const hit1=pred.p1&&pred.p1===actual1;
    const hit2=pred.p2&&pred.p2===actual2;
    const bonus=hit1&&hit2;
    const earned=calcGrpPredCoins({[g]:pred});
    if(!pred.p1&&!pred.p2)return'';
    const t1=pred.p1?TEAMS[pred.p1]:null;
    const t2=pred.p2?TEAMS[pred.p2]:null;
    return`<div class="grp-pred-result">
      <span class="grp-pred-label">내 예측</span>
      <span class="grp-pred-tag ${hit1?'hit':'miss'}">${t1?t1.emo+t1.name:'미예측'} 1위 ${hit1?'✓':'✗'}</span>
      <span class="grp-pred-tag ${hit2?'hit':'miss'}">${t2?t2.emo+t2.name:'미예측'} 2위 ${hit2?'✓':'✗'}</span>
      ${earned>0?`<span class="grp-pred-coin">🪙+${earned}</span>`:''}
    </div>`;
  }

  // 예측 UI (팀 버튼)
  const deadline=grpDeadline(g);
  const deadlineStr=deadline?`${deadline.getMonth()+1}/${deadline.getDate()} ${String(deadline.getHours()).padStart(2,'0')}:${String(deadline.getMinutes()).padStart(2,'0')} 마감`:'';
  const teamBtns=ids.map(id=>{
    const t=TEAMS[id];
    const is1=pred.p1===id,is2=pred.p2===id;
    const sel=is1?'grp-pred-btn-1':is2?'grp-pred-btn-2':'';
    const lbl=is1?'1위':is2?'2위':'';
    const rank=is1?1:is2?2:(!pred.p1?1:2);
    return`<button class="grp-pred-team-btn ${sel}${locked?' locked':''}" onclick="${locked?'':'predictGrp(\''+g+'\','+rank+',\''+id+'\')'}">
      <span>${t.emo}</span><span>${t.name}</span>${lbl?`<span class="grp-pred-rank-badge">${lbl}</span>`:''}
    </button>`;
  }).join('');
  const hint=pred.p1&&pred.p2
    ?`<span class="grp-pred-done-hint">🪙 최대 +4코인 도전 중!</span>`
    :pred.p1||pred.p2
    ?`<span class="grp-pred-hint">2위 팀도 선택하세요</span>`
    :`<span class="grp-pred-hint">1위·2위 팀을 눌러 예측하세요</span>`;
  return`<div class="grp-pred-wrap${locked?' grp-pred-locked':''}">
    <div class="grp-pred-header">
      <span class="grp-pred-title">🏆 조 순위 예측</span>
      <span class="grp-pred-deadline">${locked?'🔒 마감':''}</span>
    </div>
    <div class="grp-pred-teams">${teamBtns}</div>
    <div class="grp-pred-footer">${hint}</div>
  </div>`;
}

/* ── 내 예측 분석 모달 ── */
function showMyAnalysis(){
  const{correct,settled,total,scoreHits,grpCoins,coins}=calcPredScore();
  const pct=settled>0?Math.round(correct/settled*100):0;
  const byGroup={};
  MATCHES.slice().sort((a,b)=>new Date(a.kst)-new Date(b.kst)).forEach(m=>{
    const k=predKey(m);
    if(!PREDS[k])return;
    if(!byGroup[m.group])byGroup[m.group]=[];
    byGroup[m.group].push(m);
  });
  const matchSections=Object.entries(byGroup).map(([g,matches])=>{
    const rows=matches.map(m=>{
      const k=predKey(m),pred=PREDS[k],h=TEAMS[m.home],a=TEAMS[m.away],result=matchResult(m);
      const lbl=pred==='h'?h.name+' 승':pred==='d'?'무승부':a.name+' 승';
      const sp=SCORE_PREDS[k];
      let sb='',spb='';
      if(result){
        sb=pred===result?`<span class="ma-hit">✓ 적중</span>`:`<span class="ma-miss">✗ 실패</span>`;
        if(sp&&m.score){const[ph,pa]=sp.split('-').map(Number);spb=ph===m.score[0]&&pa===m.score[1]?`<span class="ma-score-hit">⚽ ${sp.replace('-',':')} +3🪙</span>`:`<span class="ma-score-miss">⚽ ${sp.replace('-',':')}</span>`;}
      }else{sb=`<span class="ma-pending">대기</span>`;}
      const spTag=sp&&!result?`<span class="ma-score-pending">⚽ ${sp.replace('-',':')}</span>`:'';
      const sc=m.score?` <span style="color:var(--dim);font-size:.68rem">(${m.score[0]}:${m.score[1]})</span>`:'';
      return`<div class="ma-row"><div class="ma-teams">${h.emo}${h.name}<span class="ma-vs">vs</span>${a.emo}${a.name}${sc}</div><div class="ma-pred">${lbl} ${sb}${spb}${spTag}</div></div>`;
    }).join('');
    const grpCorrect=matches.filter(m=>{const k=predKey(m);return m.score&&PREDS[k]===matchResult(m);}).length;
    const grpSettled=matches.filter(m=>m.score&&PREDS[predKey(m)]).length;
    return`<div class="ma-group-section"><div class="ma-group-label">${g}조 ${grpSettled>0?`(${grpCorrect}/${grpSettled})`:''}  </div>${rows}</div>`;
  }).join('');
  const hasGrpPreds=Object.keys(GRP_PREDS).some(g=>GRP_PREDS[g].p1||GRP_PREDS[g].p2);
  const grpRows=Object.entries(GRP_PREDS).filter(([,p])=>p.p1||p.p2).map(([g,pred])=>{
    const ids=GROUPS[g],done=groupDone(g);
    const sorted=done?ids.slice().sort(sortRule(R)):null;
    const t1=pred.p1?TEAMS[pred.p1]:null,t2=pred.p2?TEAMS[pred.p2]:null;
    const b1=done?(pred.p1&&pred.p1===sorted[0]?`<span class="ma-hit">✓</span>`:`<span class="ma-miss">✗</span>`):`<span class="ma-pending">대기</span>`;
    const b2=done?(pred.p2&&pred.p2===sorted[1]?`<span class="ma-hit">✓</span>`:`<span class="ma-miss">✗</span>`):`<span class="ma-pending">대기</span>`;
    return`<div class="ma-grp-row"><span class="ma-grp-g">${g}조</span><span class="ma-grp-pred">🥇${t1?t1.emo+t1.name:'미예측'} ${b1}</span><span class="ma-grp-pred">🥈${t2?t2.emo+t2.name:'미예측'} ${b2}</span></div>`;
  }).join('');
  const modal=document.getElementById('nick-preds-modal');
  modal.innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeNickPreds()">
      <div class="pred-modal-box" style="max-width:480px;width:100%;max-height:85vh;overflow-y:auto">
        <div class="pred-modal-handle"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-weight:900;font-size:1.05rem">📊 내 예측 분석</div>
          <button onclick="closeNickPreds()" style="background:rgba(255,255,255,.08);border:1px solid var(--border);color:#ccc;cursor:pointer;padding:4px 10px;border-radius:8px">✕</button>
        </div>
        <div class="ma-stats-bar">
          <div class="ma-stat"><span class="ma-stat-num${coins>0?' gold':''}">${coins}</span><span class="ma-stat-label">🪙 코인</span></div>
          <div class="ma-stat"><span class="ma-stat-num">${settled>0?pct+'%':'-'}</span><span class="ma-stat-label">적중률</span></div>
          <div class="ma-stat"><span class="ma-stat-num">${correct}/${settled}</span><span class="ma-stat-label">결과 적중</span></div>
          ${scoreHits>0?`<div class="ma-stat"><span class="ma-stat-num green">${scoreHits}</span><span class="ma-stat-label">⚽ 스코어</span></div>`:''}
          ${grpCoins>0?`<div class="ma-stat"><span class="ma-stat-num gold">+${grpCoins}</span><span class="ma-stat-label">🏆 조예측</span></div>`:''}
        </div>
        ${Object.keys(byGroup).length>0?`<div class="ma-section-title">📅 경기 예측</div>${matchSections}`:'<div style="color:var(--dim);font-size:.82rem;padding:10px 0">아직 예측한 경기가 없어요.</div>'}
        ${hasGrpPreds?`<div class="ma-section-title" style="margin-top:14px">🏆 조 순위 예측</div><div class="ma-grp-list">${grpRows}</div>`:''}
      </div>
    </div>`;
  modal.style.display='';
  if(window.twemoji)twemoji.parse(modal);
}

function renderGrpStatHTML(g,ids){
  if(!ROOM_CODE)return'';
  const cnt1={},cnt2={};
  let total1=0,total2=0;
  Object.values(ROOM_PREDS).forEach(preds=>{
    const p1=preds[`grp-${g}-1`],p2=preds[`grp-${g}-2`];
    if(p1){cnt1[p1]=(cnt1[p1]||0)+1;total1++;}
    if(p2){cnt2[p2]=(cnt2[p2]||0)+1;total2++;}
  });
  if(total1===0&&total2===0)return'';
  const max1=Math.max(...ids.map(id=>cnt1[id]||0),1);
  const max2=Math.max(...ids.map(id=>cnt2[id]||0),1);
  function rows(cnt,total,max,cls){
    return ids.filter(id=>cnt[id]).sort((a,b)=>(cnt[b]||0)-(cnt[a]||0)).map(id=>{
      const t=TEAMS[id],n=cnt[id]||0,pct=Math.round(n/total*100),bw=Math.round(n/max*100);
      return`<div class="grp-stat-row"><span class="grp-stat-team">${t.emo} ${t.name}</span><div class="grp-stat-track"><div class="grp-stat-fill ${cls}" style="width:${bw}%"></div></div><span class="grp-stat-cnt">${n}명<span class="grp-stat-pct"> ${pct}%</span></span></div>`;
    }).join('');
  }
  return`<div class="grp-pred-stats">
    <div class="grp-stat-header">👥 방 예측 현황</div>
    ${total1>0?`<div class="grp-stat-rank">🥇 1위 예측<span class="grp-stat-total">${total1}명</span></div>${rows(cnt1,total1,max1,'')}` :''}
    ${total2>0?`<div class="grp-stat-rank">🥈 2위 예측<span class="grp-stat-total">${total2}명</span></div>${rows(cnt2,total2,max2,'rank2')}`:''}
  </div>`;
}

function renderAIChallenge(){
  const el=document.getElementById('ai-challenge-wrap');
  if(!el)return;
  const done=allGroupsDone();
  const myGrpPreds={};
  Object.entries(GRP_PREDS).forEach(([g,p])=>{if(p.p1||p.p2)myGrpPreds[g]=p;});
  const hasMyPreds=Object.keys(myGrpPreds).length>0;
  const aiScore=calcAICoins();

  // 조별리그 미완료: 예고 카드
  if(!done){
    const groupLetters=Object.keys(GROUPS);
    const previewRows=groupLetters.map(g=>{
      const ap=AI_PICKS[g]||{};
      const t1=ap.p1?TEAMS[ap.p1]:null,t2=ap.p2?TEAMS[ap.p2]:null;
      const grpDone=groupDone(g);
      return`<div class="aic-preview-row">
        <span class="aic-preview-g">${g}조</span>
        <span class="aic-preview-pick">${t1?t1.emo+t1.name:'?'} 1위</span>
        <span class="aic-preview-sep">·</span>
        <span class="aic-preview-pick">${t2?t2.emo+t2.name:'?'} 2위</span>
        ${grpDone?`<span class="aic-preview-done">✓</span>`:''}
      </div>`;
    }).join('');
    el.innerHTML=`<div class="aic-card aic-card-pending">
      <div class="aic-head">
        <span class="aic-robot">🤖</span>
        <div>
          <div class="aic-title">AI를 이겨라!</div>
          <div class="aic-subtitle">조별리그 예측에서 AI 점수를 뛰어넘으면 보너스 코인!</div>
        </div>
        <div class="aic-bonus-preview">
          <div class="aic-bonus-row"><span class="aic-bonus-label">이기면</span><span class="aic-bonus-val win">🪙 +10</span></div>
          <div class="aic-bonus-row"><span class="aic-bonus-label">비기면</span><span class="aic-bonus-val tie">🪙 +5</span></div>
        </div>
      </div>
      <details class="aic-details">
        <summary class="aic-summary">🤖 AI 예측 보기 (12조 전체)</summary>
        <div class="aic-preview-list">${previewRows}</div>
      </details>
    </div>`;
    return;
  }

  // 조별리그 완료: 결과 카드
  const myScore=hasMyPreds?calcGrpPredCoins(myGrpPreds):0;
  const bonus=hasMyPreds?calcAIBonus(myGrpPreds):0;
  const beatAI=myScore>aiScore,tieAI=myScore===aiScore;
  const resultLabel=!hasMyPreds?'<span class="aic-no-pred">조 순위 예측을 하지 않았어요</span>'
    :beatAI?`<span class="aic-result win">🎉 AI 격파! +${bonus}🪙 획득!</span>`
    :tieAI?`<span class="aic-result tie">🤝 AI와 동점! +${bonus}🪙 획득!</span>`
    :`<span class="aic-result lose">😅 AI가 앞서갔어요...</span>`;

  // 방 멤버 vs AI 랭킹
  let memberRows='';
  if(ROOM_CODE&&ROOM_MEMBERS.length>0){
    const memberResults=ROOM_MEMBERS.map(nick=>{
      const preds=ROOM_PREDS[nick]||{};
      const gp={};
      Object.entries(preds).forEach(([k,v])=>{
        const m=k.match(/^grp-([A-L])-([12])$/);
        if(!m)return;
        const[,g,rank]=m;
        if(!gp[g])gp[g]={};
        if(rank==='1')gp[g].p1=v;else gp[g].p2=v;
      });
      const sc=calcGrpPredCoins(gp);
      const b=calcAIBonus(gp);
      return{nick,sc,beat:sc>aiScore,tie:sc===aiScore};
    }).sort((a,b)=>b.sc-a.sc);
    const rows=memberResults.map(m=>{
      const icon=m.beat?'🔥':m.tie?'🤝':'💀';
      const cls=m.nick===ROOM_NICK?' aic-me':'';
      return`<div class="aic-member-row${cls}"><span class="aic-member-nick">${icon} ${m.nick}</span><span class="aic-member-score">${m.sc}점</span></div>`;
    }).join('');
    memberRows=`<div class="aic-members-section">
      <div class="aic-members-head">👥 방 멤버 vs AI (AI: ${aiScore}점)</div>
      ${rows}
    </div>`;
  }

  el.innerHTML=`<div class="aic-card aic-card-done">
    <div class="aic-head">
      <span class="aic-robot">🤖</span>
      <div>
        <div class="aic-title">AI 챌린지 결과</div>
        <div class="aic-scores">AI <b>${aiScore}점</b>${hasMyPreds?` · 나 <b class="${beatAI?'green':tieAI?'gold':'red'}">${myScore}점</b>`:''}</div>
      </div>
    </div>
    <div class="aic-result-row">${resultLabel}</div>
    ${memberRows}
  </div>`;
}

function renderStandings(R){
  document.getElementById('standings-wrap').innerHTML=Object.entries(GROUPS).map(([g,ids])=>{
    const sorted=ids.slice().sort(sortRule(R));
    const aiPick=AI_PICKS[g]||{};
    const rows=sorted.map((id,i)=>{
      const t=TEAMS[id],r=R[id];
      const isAI1=aiPick.p1===id,isAI2=aiPick.p2===id;
      const aiBadge=isAI1?`<span class="ai-pick-badge ai1">🤖1위</span>`:isAI2?`<span class="ai-pick-badge ai2">🤖2위</span>`:'';
      return`<tr class="${id==='kor'?'kr-row':''}">
        <td class="qual-bar ${i<2?'on':''}"></td>
        <td style="color:var(--dim);font-size:.75rem">${i+1}</td>
        <td class="t-team"><span><span>${t.emo}</span>${t.name}${aiBadge}</span></td>
        <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
        <td style="color:${r.gf-r.ga>0?'var(--green)':r.gf-r.ga<0?'var(--red)':'inherit'}">${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td>
        <td><b>${r.pts}</b></td>
      </tr>`;
    }).join('');
    return`<div class="grp-card${g==='A'?' grp-kr':''}" id="grp-${g}">
      <div class="grp-head">그룹 ${g}${g==='A'?' 🇰🇷':''}</div>
      <table>
        <thead><tr><th class="qual-bar"></th><th>#</th><th style="text-align:left">팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득실</th><th>승점</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${renderGrpPredUI(g,ids)}
      ${renderGrpStatHTML(g,ids)}
    </div>`;
  }).join('');
}

/* ── 3위 ── */
function renderThirds(R){
  const list=thirdRanking(R);
  const box=document.getElementById('thirds-wrap');
  if(!list.length){box.innerHTML=`<p style="color:var(--dim);font-size:.85rem">조별리그 결과가 반영되면 자동 표시됩니다.</p>`;return;}
  const rows=list.map((x,i)=>{
    const t=TEAMS[x.id],r=R[x.id];
    return`<tr class="${x.id==='kor'?'kr-row':''}">
      <td class="qual-bar ${i<8?'on':''}"></td><td>${i+1}</td>
      <td class="t-team"><span><span>${t.emo}</span>${t.name} <small style="color:var(--dim)">(${x.g}조)</small></span></td>
      <td>${r.pts}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td>${r.gf}</td>
      <td style="color:${i<8?'var(--green)':'var(--red)'};font-weight:700">${i<8?'진출':'탈락'}</td>
    </tr>`;
  }).join('');
  box.innerHTML=`<div class="thirds-table"><table>
    <thead><tr><th class="qual-bar"></th><th>#</th><th style="text-align:left">팀</th><th>승점</th><th>득실</th><th>득점</th><th>32강</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

/* ── 토너먼트 ── */
function drawBracketLines(){
  const body=document.querySelector('.br-body');
  if(!body)return;
  const old=body.querySelector('.br-svg');
  if(old)old.remove();
  const bRect=body.getBoundingClientRect();
  // [상단카드id, 하단카드id, 다음라운드카드id]
  const pairs=[
    // 32강→16강 (좌)
    [73,75,90],[74,77,89],[83,84,93],[81,82,94],
    // 32강→16강 (우)
    [76,78,91],[79,80,92],[86,88,95],[85,87,96],
    // 16강→8강
    [90,89,97],[93,94,98],[91,92,99],[95,96,100],
    // 8강→4강
    [97,98,101],[99,100,102]
  ];
  const simple=[[101,104],[102,104]];
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  svg.setAttribute('class','br-svg');
  const stroke='rgba(180,150,80,0.45)',sw='1.8';
  function mp(el,side){
    const r=el.getBoundingClientRect();
    return{x:(side==='r'?r.right:r.left)-bRect.left,y:(r.top+r.height/2)-bRect.top};
  }
  pairs.forEach(([id1,id2,nid])=>{
    const e1=document.getElementById(`br-${id1}`),e2=document.getElementById(`br-${id2}`),en=document.getElementById(`br-${nid}`);
    if(!e1||!e2||!en)return;
    const isLeft=e1.getBoundingClientRect().left+e1.getBoundingClientRect().width/2<bRect.left+bRect.width/2;
    const side=isLeft?'r':'l',nSide=isLeft?'l':'r';
    const p1=mp(e1,side),p2=mp(e2,side),pn=mp(en,nSide);
    const midX=(p1.x+pn.x)/2,midY=(p1.y+p2.y)/2;
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',`M${p1.x},${p1.y} H${midX} V${p2.y} H${p2.x} M${midX},${midY} H${pn.x}`);
    path.setAttribute('fill','none');path.setAttribute('stroke',stroke);path.setAttribute('stroke-width',sw);
    svg.appendChild(path);
  });
  simple.forEach(([fid,tid])=>{
    const ef=document.getElementById(`br-${fid}`),et=document.getElementById(`br-${tid}`);
    if(!ef||!et)return;
    const isLeft=ef.getBoundingClientRect().left+ef.getBoundingClientRect().width/2<bRect.left+bRect.width/2;
    const pf=mp(ef,isLeft?'r':'l'),pt=mp(et,isLeft?'l':'r');
    const line=document.createElementNS(ns,'line');
    line.setAttribute('x1',pf.x);line.setAttribute('y1',pf.y);line.setAttribute('x2',pt.x);line.setAttribute('y2',pt.y);
    line.setAttribute('stroke',stroke);line.setAttribute('stroke-width',sw);
    svg.appendChild(line);
  });
  body.appendChild(svg);
}

function resolveSlot(s,R){
  if(s.w!=null||s.l!=null){
    const ref=KO.find(k=>k.id===(s.w??s.l));
    if(ref&&ref.score){
      const wH=ref.score[0]>ref.score[1];
      const hid=resolveSlot(ref.home,R),aid=resolveSlot(ref.away,R);
      if(hid&&aid)return(s.w!=null)===wH?hid:aid;
    }
    return{label:`${s.w??s.l}번 ${s.w!=null?'승자':'패자'}`};
  }
  if(s.t==='3'){
    const koId=KO.find(k=>k.away===s||k.home===s).id;
    if(THIRD_ASSIGN[koId])return THIRD_ASSIGN[koId];
    return{label:`${s.cand.split('').join('/')}조 3위`};
  }
  return rankOf(R,s.g,+s.t)||{label:`${s.g}조 ${s.t}위`};
}
function slotHTML(s,R){
  const v=resolveSlot(s,R);
  if(typeof v==='string'){const t=TEAMS[v];return`<span class="ko-team${v==='kor'?' kr':''}">${t.emo} ${t.name}</span>`;}
  return`<span class="ko-tbd">${v.label}</span>`;
}
/* ── 우승팀 예측 섹션 ── */
function renderChampionPick(){
  const ready=champReady();
  const locked=champLocked();
  const myPick=PREDS['champion'];
  // 오픈 전
  if(!ready){
    return`<div class="champ-section champ-soon">
      <div class="champ-header">
        <div class="champ-title">🏆 우승팀 예측</div>
        <span class="champ-locked-badge">오픈 예정</span>
      </div>
      <div class="champ-soon-desc">6/28 조별리그 종료 후 32강 대진이 확정되면<br>우승팀 예측이 오픈됩니다 · 적중 시 <b style="color:#4ade80">+${CHAMP_COINS}🪙</b></div>
    </div>`;
  }
  const champWinner=getChampionWinner();

  // 방 픽 현황
  let roomPicksHTML='';
  if(ROOM_CODE){
    const pickCounts={};
    Object.values(ROOM_PREDS).forEach(p=>{if(p['champion'])pickCounts[p['champion']]=(pickCounts[p['champion']]||0)+1;});
    const total=Object.values(pickCounts).reduce((a,b)=>a+b,0);
    if(total>0){
      const rows=Object.entries(pickCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([tid,cnt])=>{
        const t=TEAMS[tid];if(!t)return'';
        const pct=Math.round(cnt/total*100);
        const isMe=tid===myPick;
        const isWin=champWinner&&tid===champWinner;
        return`<div class="champ-stat-row${isMe?' me':''}${isWin?' winner':''}">
          <span class="champ-stat-team">${t.emo} ${t.name}${isWin?' 🏆':''}</span>
          <div class="champ-stat-track"><div class="champ-stat-fill${isWin?' win':''}" style="width:${pct}%"></div></div>
          <span class="champ-stat-cnt">${cnt}명</span>
        </div>`;
      }).join('');
      roomPicksHTML=`<div class="champ-room-stats">
        <div class="champ-room-title">👥 방 픽 현황 · ${total}명 참여</div>
        ${rows}
      </div>`;
    }
  }

  // 내 픽 표시
  let myPickHTML='';
  if(myPick&&TEAMS[myPick]){
    const t=TEAMS[myPick];
    let resultHTML='';
    if(champWinner){
      const hit=myPick===champWinner;
      resultHTML=hit
        ?`<span class="champ-result hit">✓ 적중! +${CHAMP_COINS}🪙</span>`
        :`<span class="champ-result miss">✗ 실패 · 우승: ${TEAMS[champWinner]?.name||'?'}</span>`;
    }
    myPickHTML=`<div class="champ-my-pick">
      <span class="champ-my-label">내 픽</span>
      <span class="champ-my-team">${t.emo} ${t.name}</span>
      ${resultHTML}
      ${!locked&&!champWinner?`<button class="champ-change-btn" onclick="cancelChampPick()">✕ 변경</button>`:''}
    </div>`;
  }

  // 팀 그리드 (미픽 + 마감 전) — 32강 진출팀만 표시
  let gridHTML='';
  if(!myPick&&!locked){
    const ko32teams=[...new Set(
      KO.filter(k=>k.r==='32강').flatMap(k=>{
        const h=resolveSlot(k.home,R),a=resolveSlot(k.away,R);
        return[typeof h==='string'?h:null,typeof a==='string'?a:null].filter(Boolean);
      })
    )].sort((a,b)=>TEAMS[a]?.name.localeCompare(TEAMS[b]?.name,'ko'));
    const teamList=ko32teams.length>=16?ko32teams:Object.keys(TEAMS).sort((a,b)=>TEAMS[a]?.name.localeCompare(TEAMS[b]?.name,'ko'));
    gridHTML=`<div class="champ-grid">${teamList.map(tid=>{const t=TEAMS[tid];if(!t)return'';return`<button class="champ-team-btn${tid==='kor'?' kr':''}" onclick="predictChampion('${tid}')">${t.emo}<span>${t.name}</span></button>`;}).join('')}</div>`;
  }

  const d=CHAMP_DEADLINE;
  const deadlineStr=`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  return`<div class="champ-section">
    <div class="champ-header">
      <div class="champ-title">🏆 우승팀 예측</div>
      <div class="champ-meta">
        ${!locked?`<span class="champ-reward">적중 시 +${CHAMP_COINS}🪙</span><span class="champ-deadline">마감 ${deadlineStr}</span>`:`<span class="champ-locked-badge">마감</span>`}
      </div>
    </div>
    ${!myPick&&!locked?`<div class="champ-hint">48개국 중 우승할 팀 하나를 선택하세요</div>`:''}
    ${myPickHTML}
    ${gridHTML}
    ${roomPicksHTML}
  </div>`;
}

function renderBracket(R){
  const byId={};KO.forEach(k=>byId[k.id]=k);
  function slot(s){
    const v=resolveSlot(s,R);
    if(typeof v==='string'){const t=TEAMS[v];return{flag:t.emo,name:t.name,isKr:v==='kor'};}
    return{flag:'',name:v.label,isKr:false};
  }
  function card(id){
    const k=byId[id];
    if(!k)return`<div class="br-card br-tbd" id="br-${id}"><div class="br-row"><span class="br-ph"></span></div><div class="br-row"><span class="br-ph"></span></div></div>`;
    const h=slot(k.home),a=slot(k.away);
    const hw=k.score&&k.score[0]>k.score[1],aw=k.score&&k.score[1]>k.score[0];
    const hF=h.flag?`<span class="br-flag">${h.flag}</span>`:`<span class="br-ph"></span>`;
    const aF=a.flag?`<span class="br-flag">${a.flag}</span>`:`<span class="br-ph"></span>`;
    const hS=k.score!=null?`<span class="br-sc">${k.score[0]}</span>`:'';
    const aS=k.score!=null?`<span class="br-sc">${k.score[1]}</span>`:'';
    const kk=koKey(k);
    const myPred=PREDS[kk];
    const predH=myPred==='h',predA=myPred==='a';
    const clickable=!k.score&&!VIEW_MODE;
    const clickAttr=clickable?`onclick="openKOPred(${id})" style="cursor:pointer"`:'';
    const predDot=myPred&&!k.score?`<span class="br-pred-dot"></span>`:'';
    return`<div class="br-card${myPred&&!k.score?' br-predicted':''}" id="br-${id}" ${clickAttr}>
      <div class="br-row${h.isKr?' kr':''}${hw?' win':''}${predH&&!k.score?' br-pick':''}">${hF}${hS}</div>
      <div class="br-row${a.isKr?' kr':''}${aw?' win':''}${predA&&!k.score?' br-pick':''}">${aF}${aS}</div>
      ${predDot}
    </div>`;
  }
  const listRounds=(()=>{
    const cards=KO.filter(k=>k.r==='3·4위전').map(k=>{
      const sc=k.score?`<span class="ko-score">${k.score[0]}:${k.score[1]}</span>`:`<span class="ko-score pending">VS</span>`;
      return`<div class="ko-card"><div class="ko-meta">M${k.id} · ${k.d}${k.city?' · '+k.city:''}</div><div class="ko-line">${slotHTML(k.home,R)} ${sc} ${slotHTML(k.away,R)}</div></div>`;
    }).join('');
    return`<div class="ko-round" style="margin-top:20px"><div class="ko-round-title">3·4위전</div><div class="ko-grid">${cards}</div></div>`;
  })();
  const _coinBarHTML=(()=>{
    if(!isBoostOpen()||!ROOM_CODE||!ROOM_NICK){
      return !isBoostOpen()?`<div class="ko-coming-soon" style="margin-bottom:24px"><div class="ko-cs-icon">🏆</div><div class="ko-cs-title">토너먼트 부스트 배팅 오픈 예정!</div><div class="ko-cs-desc">32강부터 코인을 굴려 최대 X10 BOOST까지!</div><div class="ko-cs-leverage"><span>32강 <b><i>⚡X3 BOOST</i></b></span><span>16강 <b><i>⚡X5 BOOST</i></b></span><span>8강~ <b><i>⚡X10 BOOST</i></b></span></div><button class="bet-guide-btn" onclick="showBettingGuide()">📖 배팅 시스템 가이드 보기</button></div>`:'';
    }
    const tc=calcPredScore().coins;
    const pc=Object.values(MY_BETS).filter(b=>b&&!b.settled).reduce((s,b)=>s+b.amount,0);
    const av=Math.max(0,tc-pc);
    const bc=Object.values(MY_BETS).filter(b=>b&&!b.settled).length;
    return `<div class="coin-status-bar"><div class="csb-item"><span class="csb-label">총 적립</span><span class="csb-val gold">🪙 ${tc}</span></div><div class="csb-divider"></div><div class="csb-item"><span class="csb-label">배팅 중</span><span class="csb-val red">-${pc}</span></div><div class="csb-divider"></div><div class="csb-item"><span class="csb-label">사용 가능</span><span class="csb-val green">🪙 ${av}</span></div><button class="csb-btn" onclick="showMyBets()">📋 내 배팅 내역${bc>0?' · '+bc+'건':''}</button></div>`;
  })();
  document.getElementById('bracket-wrap').innerHTML=`
  ${renderChampionPick()}
  <div class="ko-hint-bar">⚽ 카드를 탭하면 승자를 예측할 수 있어요 · 조별리그 확정 후 팀이 표시됩니다</div>
  ${_coinBarHTML}
  <div class="br-outer">
    <div class="br-labels">
      <div class="br-lbl" style="flex:1.3">32강</div>
      <div class="br-lbl" style="flex:1">16강</div>
      <div class="br-lbl" style="flex:0.85">8강</div>
      <div class="br-lbl" style="flex:0.85">4강</div>
      <div class="br-lbl f" style="min-width:148px;padding:0 4px">결승</div>
      <div class="br-lbl" style="flex:0.85">4강</div>
      <div class="br-lbl" style="flex:0.85">8강</div>
      <div class="br-lbl" style="flex:1">16강</div>
      <div class="br-lbl" style="flex:1.3">32강</div>
    </div>
    <div class="br-body">
      <img src="icon.png" class="br-bg-icon" alt="">
      <div class="br-left">
        <div class="br-c32">
          <div class="br-pair">${card(73)}${card(75)}</div>
          <div class="br-pair">${card(74)}${card(77)}</div>
          <div class="br-pair">${card(83)}${card(84)}</div>
          <div class="br-pair">${card(81)}${card(82)}</div>
        </div>
        <div class="br-c16">
          <div class="br-pair">${card(90)}${card(89)}</div>
          <div class="br-pair">${card(93)}${card(94)}</div>
        </div>
        <div class="br-c8">${card(97)}${card(98)}</div>
        <div class="br-c4">${card(101)}</div>
      </div>
      <div class="br-cf"><div class="br-f-title">🏆 결승 · 7/20</div>${card(104)}</div>
      <div class="br-right">
        <div class="br-c4">${card(102)}</div>
        <div class="br-c8">${card(99)}${card(100)}</div>
        <div class="br-c16">
          <div class="br-pair">${card(91)}${card(92)}</div>
          <div class="br-pair">${card(95)}${card(96)}</div>
        </div>
        <div class="br-c32">
          <div class="br-pair">${card(76)}${card(78)}</div>
          <div class="br-pair">${card(79)}${card(80)}</div>
          <div class="br-pair">${card(86)}${card(88)}</div>
          <div class="br-pair">${card(85)}${card(87)}</div>
        </div>
      </div>
    </div>
  </div>
  ${listRounds}`;
  requestAnimationFrame(drawBracketLines);
}

/* ── 토너먼트 예측 모달 ── */
/* ── BOOST 배팅 UI 헬퍼 ── */
function boostBets(round){
  if(round==='32강') return [
    {label:'Safe Bet',mult:1},
    {label:'Risk Bet',mult:2},
    {label:'High Risk',mult:3}
  ];
  if(round==='16강') return [
    {label:'Safe Bet',mult:1},
    {label:'Risk Bet',mult:2},
    {label:'High Risk',mult:3},
    {label:'All-in',mult:5}
  ];
  return [
    {label:'Safe Bet',mult:1},
    {label:'Risk Bet',mult:3},
    {label:'High Risk',mult:5},
    {label:'Extreme',mult:10}
  ];
}
function selectBoostMult(mult){
  const steps=Array.from(document.querySelectorAll('.boost-slider-step'));
  steps.forEach(s=>s.classList.toggle('selected',parseInt(s.dataset.mult)===mult));
  document.querySelectorAll('.boost-slider-step-info').forEach(s=>s.classList.toggle('selected',parseInt(s.dataset.mult)===mult));
  const idx=steps.findIndex(s=>parseInt(s.dataset.mult)===mult);
  const fill=document.getElementById('boost-slider-fill');
  if(fill&&steps.length>1) fill.style.width=`${idx/(steps.length-1)*100}%`;
  updateBoostPreview();
}
function _selectedMult(){
  const step=document.querySelector('.boost-slider-step.selected');
  return step?parseInt(step.dataset.mult):1;
}
function updateBoostPreview(){
  const inp=document.getElementById('boost-amount-inp');
  const prev=document.getElementById('boost-preview');
  if(!inp||!prev)return;
  const amount=parseInt(inp.value)||0;
  const multiplier=_selectedMult();
  if(amount<=0){prev.innerHTML='';return;}
  prev.innerHTML=`적중 → <span style="color:#4ade80;font-weight:700">+${amount*multiplier}🪙</span> &nbsp;·&nbsp; 실패 → <span style="color:var(--red);font-weight:700">-${amount}🪙</span>`;
}
async function confirmBoost(koId,maxCoins,matchId){
  const inp=document.getElementById('boost-amount-inp');
  if(!inp)return;
  const amount=parseInt(inp.value);
  const multiplier=_selectedMult();
  if(!amount||amount<1){alert('배팅 금액을 입력해주세요.');return;}
  if(amount>maxCoins){alert(`보유 코인(${maxCoins})보다 많이 배팅할 수 없어요.`);return;}
  const myPred=PREDS[koId];
  if(!myPred){alert('먼저 팀을 예측해주세요.');return;}
  try{
    await saveBet(koId,myPred,amount,multiplier);
    closePredModal();
    showBoostConfirmToast(amount,multiplier);
  }catch(e){console.error('confirmBoost error:',e);alert('배팅 저장 실패. 다시 시도해주세요.');}
}
function showBoostConfirmToast(amount,multiplier){
  const el=document.createElement('div');
  el.className='boost-toast';
  el.innerHTML=`⚡ ${amount}코인 × ${multiplier}배 배팅 완료!<br><span style="font-size:.78rem;color:var(--gold)">적중 시 +${amount*multiplier}🪙 획득</span>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

/* ── 내 배팅 내역 모달 ── */
function showMyBets(){
  let modal=document.getElementById('my-bets-modal');
  if(!modal){modal=document.createElement('div');modal.id='my-bets-modal';document.body.appendChild(modal);}
  const bets=Object.entries(MY_BETS).filter(([,b])=>b)
    .sort((a,b)=>{const ia=parseInt(a[0].replace('ko-',''));const ib=parseInt(b[0].replace('ko-',''));return ia-ib;});
  const tc=calcPredScore().coins;
  const pendingBets=bets.filter(([,b])=>!b.settled);
  const pc=pendingBets.reduce((s,[,b])=>s+b.amount,0);
  const av=Math.max(0,tc-pc);
  const potReturn=pendingBets.reduce((s,[,b])=>s+b.amount*b.multiplier,0);
  const wonPnl=bets.filter(([,b])=>b.settled&&b.hit).reduce((s,[,b])=>s+(b.pnl||0),0);
  const betRows=bets.length===0?`<div class="bh-empty">아직 배팅한 경기가 없어요<br><span style="font-size:.72rem">경기 카드를 탭해서 배팅을 시작해보세요!</span></div>`:bets.map(([key,bet])=>{
    const ko=KO.find(k=>koKey(k)===key);
    if(!ko)return'';
    const hv=resolveSlot(ko.home,R),av2=resolveSlot(ko.away,R);
    const hName=typeof hv==='string'?TEAMS[hv].name:hv.label;
    const aName=typeof av2==='string'?TEAMS[av2].name:av2.label;
    const hEmo=typeof hv==='string'?TEAMS[hv].emo:'❓';
    const aEmo=typeof av2==='string'?TEAMS[av2].emo:'❓';
    const pickName=bet.val==='h'?hName:aName;
    const pickEmo=bet.val==='h'?hEmo:aEmo;
    let statusBadge='';
    if(bet.settled){
      statusBadge=bet.hit
        ?`<span class="bh-status-badge bh-status-win">✓ 적중 +${bet.pnl}🪙</span>`
        :`<span class="bh-status-badge bh-status-lose">✗ 실패 ${bet.pnl}🪙</span>`;
    }else{
      statusBadge=`<span class="bh-status-badge bh-status-pending">대기중</span>`;
    }
    return`<div class="bh-row">
      <div class="bh-info">
        <div class="bh-match">${hEmo} ${hName} vs ${aEmo} ${aName}</div>
        <div class="bh-round">${ko.r} · M${ko.id} · ${ko.d}</div>
        <div class="bh-team-pick">⚡ ${pickEmo} ${pickName} 승 ${statusBadge}</div>
      </div>
      <div class="bh-amounts">
        <span class="bh-bet-chip">×${bet.multiplier} · ${bet.amount}🪙</span>
        ${!bet.settled?`<span class="bh-expect">적중 시 +${bet.amount*bet.multiplier}🪙</span>`:''}
      </div>
    </div>`;
  }).join('');
  modal.innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeMyBets()">
      <div class="pred-modal-box" style="max-width:460px;width:100%;max-height:85vh;overflow-y:auto">
        <div class="pred-modal-handle"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-weight:900;font-size:1.05rem">⚡ 내 배팅 현황</div>
          <button onclick="closeMyBets()" style="background:rgba(255,255,255,.08);border:1px solid var(--border);color:#ccc;cursor:pointer;padding:4px 10px;border-radius:8px">✕</button>
        </div>
        <div class="my-bets-wrap">${betRows}</div>
        ${bets.length>0?`<div class="bh-footer">
          <div class="bh-foot-item"><span class="bh-foot-label">총 적립</span><span class="bh-foot-val gold">🪙 ${tc}</span></div>
          <div class="bh-foot-item"><span class="bh-foot-label">배팅 중</span><span class="bh-foot-val red">-${pc}🪙</span></div>
          <div class="bh-foot-item"><span class="bh-foot-label">사용 가능</span><span class="bh-foot-val green">🪙 ${av}</span></div>
          <div class="bh-foot-item"><span class="bh-foot-label">전부 적중 시</span><span class="bh-foot-val green">+${potReturn}🪙</span></div>
        </div>`:''}
      </div>
    </div>`;
  modal.style.display='';
  if(window.twemoji)twemoji.parse(modal);
}
function closeMyBets(){
  const el=document.getElementById('my-bets-modal');
  if(el)el.style.display='none';
}

function openKOPred(id){
  const ko=KO.find(k=>k.id===id);
  if(!ko||ko.score)return;
  const hv=resolveSlot(ko.home,R),av=resolveSlot(ko.away,R);
  const hName=typeof hv==='string'?TEAMS[hv].name:hv.label;
  const aName=typeof av==='string'?TEAMS[av].name:av.label;
  const hEmo=typeof hv==='string'?TEAMS[hv].emo:'❓';
  const aEmo=typeof av==='string'?TEAMS[av].emo:'❓';
  const kk=koKey(ko);
  const myPred=PREDS[kk];
  let statsHTML='';
  if(ROOM_CODE){
    const rc=roomPredSummary(kk);
    const rt=rc.h+rc.a;
    if(rt>0){
      const pct=v=>Math.round(v/rt*100);
      statsHTML=`<div class="ko-pred-stats">
        <div class="ko-pred-stats-title">👥 방 예측 현황 · ${rt}명</div>
        <div class="ko-pred-stat-row"><span>${hEmo} ${hName}</span><div class="ko-pred-track"><div class="ko-pred-fill" style="width:${pct(rc.h)}%"></div></div><span>${rc.h}명 ${pct(rc.h)}%</span></div>
        <div class="ko-pred-stat-row"><span>${aEmo} ${aName}</span><div class="ko-pred-track"><div class="ko-pred-fill ko-pred-fill-a" style="width:${pct(rc.a)}%"></div></div><span>${rc.a}명 ${pct(rc.a)}%</span></div>
      </div>`;
    }
  }
  const ek=kk.replace(/'/g,"\\'");
  const boostOpen=isBoostOpen();
  // BOOST 배팅 섹션
  let boostHTML='';
  if(boostOpen&&ROOM_CODE&&ROOM_NICK){
    const maxMult=boostMultiplier(ko.r);
    const existingBet=MY_BETS[kk];
    const avail=availableCoins();
    const _bets=boostBets(ko.r);
    const multBtns=`<div class="boost-slider"><div class="boost-slider-track"><div class="boost-slider-fill" id="boost-slider-fill" style="width:100%"></div><div class="boost-slider-steps">${_bets.map(b=>`<div class="boost-slider-step${b.mult===maxMult?' selected':''}" data-mult="${b.mult}" onclick="selectBoostMult(${b.mult})"><div class="boost-slider-dot"></div></div>`).join('')}</div></div><div class="boost-slider-labels">${_bets.map(b=>`<div class="boost-slider-step-info${b.mult===maxMult?' selected':''}" data-mult="${b.mult}"><div class="boost-slider-step-label">${b.label}</div><div class="boost-slider-step-x">×${b.mult}</div></div>`).join('')}</div></div>`;
    if(existingBet&&!existingBet.settled){
      const betTeam=existingBet.val==='h'?hName:aName;
      const bm=existingBet.multiplier||maxMult;
      boostHTML=`<div class="boost-section">
        <div class="boost-sec-title">⚡ BOOST 배팅 <span class="boost-badge boost-x${bm}">×${bm}</span></div>
        <div class="boost-current-row">
          <span class="boost-current-team">${betTeam} 승</span>
          <span class="boost-current-amount">${existingBet.amount}코인 배팅</span>
          <span class="boost-expected">적중 시 +${existingBet.amount*bm}🪙</span>
        </div>
        <button class="boost-cancel-btn" onclick="deleteBet('${ek}').then(()=>{renderBracket(R);openKOPred(${id})})">배팅 취소</button>
      </div>`;
    }else if(myPred){
      const _tc=calcPredScore().coins;
      const _pc=Object.values(MY_BETS).filter(b=>b&&!b.settled).reduce((s,b)=>s+b.amount,0);
      boostHTML=`<div class="boost-section">
        <div class="boost-sec-title">⚡ BOOST 배팅 <span style="color:#94a3b8;font-size:.8rem">최대 ×${maxMult}</span></div>
        <div class="boost-coin-bar">
          <div class="bcb-item"><span class="bcb-label">총 적립</span><span class="bcb-val gold">🪙 ${_tc}</span></div>
          <div class="bcb-item"><span class="bcb-label">배팅 중</span><span class="bcb-val red">-${_pc}</span></div>
          <div class="bcb-item bcb-avail"><span class="bcb-label">이 경기 가능</span><span class="bcb-val green">🪙 ${avail}</span></div>
        </div>
        ${multBtns}
        <div class="boost-input-row">
          <input type="number" id="boost-amount-inp" class="boost-amount-inp" min="1" max="${avail}" placeholder="배팅 금액" oninput="updateBoostPreview()">
          <span class="boost-inp-suffix">코인</span>
        </div>
        <div id="boost-preview" class="boost-preview"></div>
        <button class="boost-confirm-btn" onclick="confirmBoost('${ek}',${avail},${id})">⚡ 배팅 확정</button>
        <div class="boost-hint">배팅 없이 예측만 해도 됩니다</div>
      </div>`;
    }else{
      boostHTML=`<div class="boost-section boost-pending">
        <div class="boost-sec-title">⚡ BOOST 배팅 <span style="color:#94a3b8;font-size:.8rem">최대 ×${maxMult}</span></div>
        <div class="boost-hint">팀을 예측한 뒤 배팅할 수 있어요</div>
      </div>`;
    }
  }
  // 예측 버튼: boost open이면 모달 유지(재오픈), 아니면 닫기
  const predAction=boostOpen&&ROOM_CODE&&ROOM_NICK
    ?`renderBracket(R);openKOPred(${id})`
    :`renderBracket(R);closePredModal()`;
  document.getElementById('pred-modal').innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closePredModal()">
      <div class="pred-modal-box">
        <div class="pred-modal-handle"></div>
        <div class="pred-modal-teams">${hName} <span style="color:var(--dim);font-size:.85rem">VS</span> ${aName}</div>
        <div class="pred-modal-meta">M${ko.id} · ${ko.r} · ${ko.d}${ko.city?' · '+ko.city:''} · 연장 포함</div>
        <div class="ko-pred-btns">
          <button class="ko-pred-btn${myPred==='h'?' active':''}" onclick="predictKO('${ek}','h');${predAction}">${hEmo} ${hName} 승</button>
          <button class="ko-pred-btn${myPred==='a'?' active':''}" onclick="predictKO('${ek}','a');${predAction}">${aEmo} ${aName} 승</button>
        </div>
        ${myPred?`<div style="font-size:.72rem;color:var(--dim);text-align:center;margin-top:4px">현재 예측: ${myPred==='h'?hName:aName} 승 · 다시 클릭하면 취소</div>`:''}
        ${boostHTML}
        ${statsHTML}
        <button class="pred-modal-close" onclick="closePredModal()">닫기</button>
      </div>
    </div>`;
  document.getElementById('pred-modal').style.display='';
  if(window.twemoji)twemoji.parse(document.getElementById('pred-modal'));
}

/* ── 달력 ── */
let calYear=null,calMonth=null;
function openCalendar(){
  const now=new Date();
  calYear=calYear||now.getFullYear();
  calMonth=calMonth!=null?calMonth:now.getMonth();
  renderCalModal();
  document.getElementById('cal-modal').style.display='';
}
function closeCalendar(){
  document.getElementById('cal-modal').style.display='none';
}
function calNav(dir){calMonth+=dir;if(calMonth>11){calMonth=0;calYear++;}else if(calMonth<0){calMonth=11;calYear--;}renderCalModal();}
function renderCalModal(){
  const matchDates=new Set(MATCHES.map(m=>m.kst.slice(0,10)));
  const todayStr=localDateStr();
  const first=new Date(calYear,calMonth,1);
  const last=new Date(calYear,calMonth+1,0);
  const startDow=first.getDay();
  const totalDays=last.getDate();
  const DOW_KR=['일','월','화','수','목','금','토'];
  let cells='';
  for(let i=0;i<startDow;i++)cells+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=totalDays;d++){
    const ds=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const hasMatch=matchDates.has(ds);
    const isToday=ds===todayStr;
    const isSel=scheduleFilter==='date'&&scheduleDate===ds;
    const cls=`cal-cell${hasMatch?' has-match':''}${isToday?' today':''}${isSel?' selected':''}${hasMatch?'':' no-match'}`;
    const dot=hasMatch?`<span class="cal-dot"></span>`:'';
    cells+=`<div class="${cls}"${hasMatch?` onclick="pickDate('${ds}')" style="cursor:pointer"`:''}>${d}${dot}</div>`;
  }
  const MONTHS=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  document.getElementById('cal-modal').innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeCalendar()">
      <div class="pred-modal-box" style="max-width:360px;width:100%">
        <div class="pred-modal-handle"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <button onclick="calNav(-1)" class="cal-nav-btn">‹</button>
          <span style="font-weight:900;font-size:1.05rem;color:var(--gold)">${calYear}년 ${MONTHS[calMonth]}</span>
          <button onclick="calNav(1)" class="cal-nav-btn">›</button>
        </div>
        <div class="cal-grid-head">${DOW_KR.map(d=>`<div class="cal-dh">${d}</div>`).join('')}</div>
        <div class="cal-grid">${cells}</div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:center">
          <button onclick="pickDate(null)" class="cal-reset-btn">전체 보기</button>
          <button onclick="closeCalendar()" class="cal-reset-btn" style="background:rgba(255,255,255,.06)">닫기</button>
        </div>
      </div>
    </div>`;
}
function pickDate(ds){
  if(ds){
    scheduleDate=ds;
    scheduleFilter='date';
    document.querySelectorAll('.f-tab').forEach(b=>b.classList.remove('active'));
  }else{
    scheduleDate=null;
    scheduleFilter='all';
    document.querySelectorAll('.f-tab').forEach(b=>b.classList.toggle('active',b.dataset.f==='all'));
  }
  renderCalModal();
  renderSchedule();
  closeCalendar();
  showPage('schedule');
}

/* ── 닉네임 예측 보기 ── */
function showNickPreds(nick){
  const preds=ROOM_PREDS[nick]||{};
  const now=new Date();
  const rows=MATCHES.slice().sort((a,b)=>new Date(a.kst)-new Date(b.kst)).map(m=>{
    const k=predKey(m);
    const val=preds[k];
    if(!val)return'';
    const h=TEAMS[m.home],a=TEAMS[m.away];
    const result=matchResult(m);
    const lbl=val==='h'?h.name+' 승':val==='d'?'무승부':a.name+' 승';
    const sp=preds['s-'+k];
    let badge='';
    let scoreBadge='';
    if(result){
      badge=val===result?`<span style="color:var(--green);font-weight:700">✓ 적중</span>`:`<span style="color:var(--red);font-weight:700">✗ 실패</span>`;
      if(sp&&m.score){const[ph,pa]=sp.split('-').map(Number);scoreBadge=ph===m.score[0]&&pa===m.score[1]?`<span class="score-hit">⚽+3🪙</span>`:`<span class="score-miss">⚽ ${sp.replace('-',':')} 불일치</span>`;}
    }else if(new Date(m.kst)<now){
      badge=`<span style="color:var(--dim)">대기</span>`;
    }else{
      badge=`<span style="color:var(--dim)">예정</span>`;
    }
    const d=new Date(m.kst);
    const spTag=sp?`<span class="nick-score-badge">⚽ ${sp.replace('-',':')}</span>`:'';
    return`<div class="nick-pred-row">
      <div class="nick-pred-match">${h.emo}${h.name} <span style="color:var(--dim)">vs</span> ${a.emo}${a.name}</div>
      <div class="nick-pred-info">
        <span class="nick-pred-bet">${lbl}</span>${badge}${spTag}${scoreBadge}
        <span style="color:var(--dim);font-size:.7rem">${d.getMonth()+1}/${d.getDate()}</span>
      </div>
    </div>`;
  }).join('');
  const{correct,settled,total,scoreHits,coins}=Object.entries(preds).reduce((acc,[k,v])=>{
    if(k.startsWith('s-'))return acc;
    const m=MATCHES.find(x=>predKey(x)===k);if(!m)return acc;
    acc.total++;const r=matchResult(m);
    if(r){
      acc.settled++;
      if(r===v)acc.correct++;
      const sp=preds['s-'+k];
      if(sp&&m.score){const[ph,pa]=sp.split('-').map(Number);if(ph===m.score[0]&&pa===m.score[1])acc.scoreHits++;}
    }
    return acc;
  },{correct:0,settled:0,total:0,scoreHits:0});
  const coins2=correct+scoreHits*3;
  const scoreHitBadge=scoreHits>0?` · <span style="color:#4ade80">⚽ 스코어 적중 ${scoreHits}회</span>`:'';
  const scoreHTML=settled>0?`<span style="color:var(--gold);font-weight:900">🪙 ${coins2}코인</span> (결과 ${correct}/${settled}${scoreHitBadge}) · 예측 ${total}경기`:`예측 ${total}경기 · 경기 종료 후 채점`;
  const modal=document.getElementById('nick-preds-modal');
  modal.innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeNickPreds()">
      <div class="pred-modal-box" style="max-width:460px;width:100%;max-height:80vh;overflow-y:auto">
        <div class="pred-modal-handle"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div style="font-weight:900;font-size:1.05rem">👤 ${nick}의 예측</div>
          <button onclick="closeNickPreds()" style="background:rgba(255,255,255,.08);border:1px solid var(--border);color:#ccc;cursor:pointer;padding:4px 10px;border-radius:8px">✕</button>
        </div>
        <div style="font-size:.78rem;color:var(--dim);margin-bottom:14px">${scoreHTML}</div>
        <div class="nick-pred-list">${rows||'<div style="color:var(--dim);text-align:center;padding:20px">예측한 경기가 없어요.</div>'}</div>
      </div>
    </div>`;
  modal.style.display='';
  if(window.twemoji)twemoji.parse(modal);
}
function closeNickPreds(){
  document.getElementById('nick-preds-modal').style.display='none';
}
function onScoreInput(el){
  const key=el.dataset.pkey;
  const inputs=document.querySelectorAll(`.score-inp[data-pkey="${key}"]`);
  let h='',a='';
  inputs.forEach(b=>{if(b.dataset.side==='h')h=b.value;else a=b.value;});
  if(h!==''&&a!=='')predictScore(key,h,a);
}

function showBettingGuide(){
  const modal=document.getElementById('bet-guide-modal');
  modal.innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeBettingGuide()">
      <div class="bet-guide-box">
        <div class="pred-modal-handle"></div>
        <div class="bet-guide-header">
          <span class="bet-guide-trophy">🏆</span>
          <div>
            <div class="bet-guide-title">부스트 배팅 시스템</div>
            <div class="bet-guide-sub">32강부터 적용 · 코인을 굴려 최대 X10 BOOST까지</div>
          </div>
          <button onclick="closeBettingGuide()" class="bet-guide-close-btn">✕</button>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">📌 기본 개념</div>
          <p class="bet-guide-desc">조별리그에서 예측을 맞히면 <b style="color:#ffd700">🪙 코인</b>을 얻어요.<br>이 코인을 토너먼트 경기에 배팅하면 배수만큼 불릴 수 있어요.<br>단, 틀리면 배팅한 코인만큼 잃습니다.</p>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">⚡ 라운드별 최대 배수</div>
          <div class="bet-guide-mult-grid">
            <div class="bet-guide-mult-card blue">
              <div class="mult-round">32강</div>
              <div class="mult-val">×3</div>
              <div class="mult-desc"><i>⚡X3 BOOST</i></div>
            </div>
            <div class="bet-guide-mult-card purple">
              <div class="mult-round">16강</div>
              <div class="mult-val">×5</div>
              <div class="mult-desc"><i>⚡X5 BOOST</i></div>
            </div>
            <div class="bet-guide-mult-card gold">
              <div class="mult-round">8강~결승</div>
              <div class="mult-val">×10</div>
              <div class="mult-desc"><i>⚡X10 BOOST</i></div>
            </div>
          </div>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">💰 정산 방식</div>
          <div class="bet-guide-result-row win">
            <span class="result-icon">✅</span>
            <div><b>적중 시</b> — 배팅액 × 배수 획득<br><span class="result-ex">예) 3코인 배팅 × 3배 → +9코인</span></div>
          </div>
          <div class="bet-guide-result-row lose">
            <span class="result-icon">❌</span>
            <div><b>실패 시</b> — 배팅한 코인만 차감<br><span class="result-ex">예) 3코인 배팅 실패 → -3코인 (배팅액까지만 손실)</span></div>
          </div>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">📊 시뮬레이션 예시</div>
          <div class="bet-guide-sim">
            <div class="sim-row"><span class="sim-label">조별리그 적중 코인</span><span class="sim-val">🪙 10</span></div>
            <div class="sim-row win"><span class="sim-label">32강 A경기 · 3코인 배팅 · 적중</span><span class="sim-val">+9 → 🪙 19</span></div>
            <div class="sim-row lose"><span class="sim-label">32강 B경기 · 5코인 배팅 · 실패</span><span class="sim-val">-5 → 🪙 14</span></div>
            <div class="sim-row win"><span class="sim-label">16강 · 10코인 배팅 · 적중</span><span class="sim-val">+50 → 🪙 64</span></div>
            <div class="sim-row total"><span class="sim-label">최종 잔액</span><span class="sim-val gold">🪙 64코인</span></div>
          </div>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">📋 이용 규칙</div>
          <ul class="bet-guide-rules">
            <li>경기 시작 전까지 배팅 변경·취소 가능</li>
            <li>보유 코인 이상 배팅 불가</li>
            <li>코인 잔액은 0 이하로 내려가지 않음</li>
            <li>배팅 없이 예측만 해도 됨 (코인 유지)</li>
            <li>경기 종료 후 자동 정산</li>
          </ul>
        </div>

        <div class="bet-guide-coming">
          <span>🚀 32강 개막과 함께 오픈 예정!</span>
        </div>
      </div>
    </div>`;
  modal.style.display='';
  if(window.twemoji)twemoji.parse(modal);
}
function closeBettingGuide(){
  document.getElementById('bet-guide-modal').style.display='none';
}

/* ── 예측방 가이드 ── */
function showRoomGuide(){
  const modal=document.getElementById('room-guide-modal');
  modal.innerHTML=`
    <div class="pred-modal-overlay" onclick="if(event.target===this)closeRoomGuide()">
      <div class="bet-guide-box">
        <div class="pred-modal-handle"></div>
        <div class="bet-guide-header">
          <span class="bet-guide-trophy">👥</span>
          <div>
            <div class="bet-guide-title">예측방 시스템 가이드</div>
            <div class="bet-guide-sub">닉네임 하나로 전원과 실시간 경쟁</div>
          </div>
          <button onclick="closeRoomGuide()" class="bet-guide-close-btn">✕</button>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">📌 기본 개념</div>
          <p class="bet-guide-desc">닉네임을 입력하면 <b style="color:#ffd700">글로벌 예측방</b>에 자동 참여돼요.<br>경기·스코어·조 순위를 예측해 <b style="color:#ffd700">🪙 코인</b>을 모으고,<br>월드컵이 끝나면 최다 코인 보유자에게 <b>☕ 커피쿠폰</b>을 드립니다!</p>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">🪙 코인 획득 방법</div>
          <div class="bet-guide-mult-grid" style="grid-template-columns:1fr 1fr">
            <div class="bet-guide-mult-card blue" style="padding:12px 10px">
              <div class="mult-round">경기 결과 적중</div>
              <div class="mult-val" style="font-size:1.4rem">+1</div>
              <div class="mult-desc">승·무·패 예측</div>
            </div>
            <div class="bet-guide-mult-card purple" style="padding:12px 10px">
              <div class="mult-round">스코어 적중</div>
              <div class="mult-val" style="font-size:1.4rem">+3</div>
              <div class="mult-desc">정확한 스코어</div>
            </div>
            <div class="bet-guide-mult-card blue" style="padding:12px 10px">
              <div class="mult-round">조 1위 예측</div>
              <div class="mult-val" style="font-size:1.4rem">+2</div>
              <div class="mult-desc">그룹 1위 팀</div>
            </div>
            <div class="bet-guide-mult-card gold" style="padding:12px 10px">
              <div class="mult-round">조 1·2위 동시</div>
              <div class="mult-val" style="font-size:1.4rem">+4</div>
              <div class="mult-desc">보너스 포함</div>
            </div>
          </div>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">⏱ 예측 마감 규칙</div>
          <ul class="bet-guide-rules">
            <li>경기 예측 — 해당 경기 킥오프 전까지</li>
            <li>조 순위 예측 — 각 그룹 첫 경기 전까지</li>
            <li>마감 후에는 예측 변경 불가 (🔒 자동 잠금)</li>
          </ul>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">👥 실시간 기능</div>
          <ul class="bet-guide-rules">
            <li>참여자 닉네임 클릭 → 해당 사람 예측 내역 조회</li>
            <li>경기 카드 클릭 → 방 전체 예측 현황 확인</li>
            <li>순위표 실시간 갱신 (경기 종료 후 자동 반영)</li>
            <li>24시간 미접속 시 자동 퇴장 (재참여 가능)</li>
          </ul>
        </div>

        <div class="bet-guide-section">
          <div class="bet-guide-step-title">🏆 최종 보상</div>
          <div class="bet-guide-result-row win">
            <span class="result-icon">☕</span>
            <div><b>월드컵 종료 후 1위</b>에게 커피쿠폰 증정<br><span class="result-ex">코인이 같으면 예측 경기 수가 많은 사람 우선</span></div>
          </div>
        </div>

        <div class="bet-guide-section" style="border-top:1px solid rgba(16,185,129,.2);padding-top:14px;margin-top:4px">
          <div class="bet-guide-step-title" style="color:#34d399">⚖️ 공정성 안내</div>
          <p class="bet-guide-desc" style="color:#6ee7b7;line-height:1.7">
            모든 예측은 <b style="color:#a7f3d0">경기 시작 전 자동 마감</b>되며,<br>
            경기 결과 확정 후 <b style="color:#a7f3d0">공개된 규칙에 따라 자동 정산</b>됩니다.<br>
            관리자를 포함한 누구도 마감된 예측이나 정산 결과를 임의로 변경할 수 없습니다.
          </p>
          <ul class="bet-guide-rules" style="color:#6ee7b7;margin-top:6px">
            <li>예측 마감: 각 경기 킥오프 시각 기준 자동 잠금</li>
            <li>조 순위 예측 마감: 각 조 3번째 경기(2라운드) 킥오프 전</li>
            <li>정산 기준: football-data.org 공식 경기 결과 데이터</li>
            <li>코인은 실제 현금 가치가 없는 게임 포인트입니다</li>
          </ul>
        </div>
      </div>
    </div>`;
  modal.style.display='';
  if(window.twemoji)twemoji.parse(modal);
}
function closeRoomGuide(){
  document.getElementById('room-guide-modal').style.display='none';
}

/* ── 채팅 렌더 ── */
function renderChatMessages(){
  const el=document.getElementById('chat-messages');
  if(!el)return;
  if(!CHAT_MSGS.length){
    el.innerHTML='<div class="chat-empty">아직 메시지가 없어요. 첫 메시지를 남겨보세요! 👋</div>';
    return;
  }
  el.innerHTML=CHAT_MSGS.map(m=>{
    const isMe=m.nick===ROOM_NICK;
    const time=m.ts&&m.ts.toDate?(()=>{
      const d=m.ts.toDate();
      return d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
    })():'';
    return`<div class="chat-msg${isMe?' chat-me':''}">
      ${!isMe?`<span class="chat-nick">${escapeHtml(m.nick)}</span>`:''}
      <div class="chat-bubble${isMe?' chat-bubble-me':''}">${escapeHtml(m.msg)}</div>
      <span class="chat-time">${time}</span>
    </div>`;
  }).join('');
  el.scrollTop=el.scrollHeight;
  if(window.twemoji)twemoji.parse(el);
}

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── 경기 반응 바 ── */
function renderRxnBar(matchKey){
  if(!ROOM_CODE)return'';
  const rxn=RXNS[matchKey]||{};
  const emojis=[
    {key:'fire',emo:'🔥'},{key:'wow',emo:'😱'},{key:'goal',emo:'⚽'},
    {key:'skull',emo:'💀'},{key:'party',emo:'🎉'}
  ];
  const btns=emojis.map(({key,emo})=>{
    const arr=rxn[key]||[];
    const cnt=arr.length;
    const active=ROOM_NICK&&arr.includes(ROOM_NICK)?'rxn-active':'';
    const mk=matchKey.replace(/'/g,"\\'");
    return`<button class="rxn-btn ${active}" onclick="toggleRxn('${mk}','${key}')">${emo}${cnt>0?`<span class="rxn-cnt">${cnt}</span>`:''}</button>`;
  }).join('');
  return`<div class="rxn-bar">${btns}</div>`;
}

/* ── 피드 ── */
function renderFeed(){
  const el=document.getElementById('feed-list');
  if(!el)return;
  el.innerHTML=FEED_ITEMS.map((item,i)=>{
    const typeLbl=item.type==='update'?'업데이트':'WC 소식';
    const typeCls=item.type==='update'?'feed-badge-update':'feed-badge-news';
    const tags=item.tags.map(t=>`<span class="feed-tag">${t}</span>`).join('');
    return`<div class="feed-card" style="animation-delay:${i*60}ms">
      <div class="feed-card-body">
        <div class="feed-meta">
          <span class="feed-date">${item.date}</span>
          <span class="feed-badge ${typeCls}">${typeLbl}</span>
        </div>
        <div class="feed-title">${item.title}</div>
        <div class="feed-desc">${item.desc}</div>
        <div class="feed-tags">${tags}</div>
      </div>
      <div class="feed-icon-wrap">
        <span class="feed-icon">${item.icon}</span>
      </div>
    </div>`;
  }).join('');
  if(window.twemoji)twemoji.parse(el);
}
