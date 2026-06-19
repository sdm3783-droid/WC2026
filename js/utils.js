/* ── 로컬 날짜 문자열 (YYYY-MM-DD, 기기 로컬 타임존 기준) ── */
function localDateStr(d){const t=d||new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}

/* ── 경기 상태 ── */
function matchStatus(m){
  if(m.score)return{label:'종료',cls:'st-end'};
  const now=new Date(),start=new Date(m.kst),diff=start-now;
  if(diff>0)return{label:'예정',cls:'st-upcoming'};
  if(diff>-120*60*1000)return{label:'LIVE',cls:'st-live'};
  return{label:'종료',cls:'st-end'};
}

/* ── 구글 캘린더 URL ── */
function gcalUrl(m){
  const [date,time]=m.kst.split('T');
  const [y,mo,d]=date.split('-').map(Number);
  const [h,min]=time.split(':').map(Number);
  let uh=h-9,ud=d;if(uh<0){uh+=24;ud-=1;}
  const pad=n=>String(n).padStart(2,'0');
  const s=`${y}${pad(mo)}${pad(ud)}T${pad(uh)}${pad(min)}00Z`;
  const e=new Date(Date.UTC(y,mo-1,ud,uh,min,0)+7200000).toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  const title=`${TEAMS[m.home].name} vs ${TEAMS[m.away].name} (WC2026)`;
  return`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${s}/${e}&details=${encodeURIComponent(m.tv.join(', ')+' 중계')}&location=${encodeURIComponent(m.city)}`;
}

/* ── ICS 다운로드 ── */
function downloadICS(){
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WC2026 KOREA//KO','CALSCALE:GREGORIAN'];
  MATCHES.filter(m=>m.kr).forEach(m=>{
    const [date,time]=m.kst.split('T');
    const [y,mo,d]=date.split('-').map(Number);
    const [h,min]=time.split(':').map(Number);
    let uh=h-9,ud=d;if(uh<0){uh+=24;ud-=1;}
    const pad=n=>String(n).padStart(2,'0');
    const s=`${y}${pad(mo)}${pad(ud)}T${pad(uh)}${pad(min)}00Z`;
    const e=new Date(Date.UTC(y,mo-1,ud,uh,min,0)+7200000).toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
    const title=`${TEAMS[m.home].name} vs ${TEAMS[m.away].name} (WC2026)`;
    lines.push('BEGIN:VEVENT',`DTSTART:${s}`,`DTEND:${e}`,`SUMMARY:${title}`,`LOCATION:${m.city}`,`DESCRIPTION:${m.tv.join(', ')} 중계`,'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'}));
  a.download='WC2026_대한민국.ics';a.click();
}

/* ── 공유 (navigator.share 우선, 폴백 클립보드) ── */
function copyShare(m){
  const h=TEAMS[m.home],a=TEAMS[m.away],d=new Date(m.kst);
  const text=`${h.emo} ${h.name} vs ${a.emo} ${a.name}\n⏰ ${d.getMonth()+1}/${d.getDate()}(${DOW[d.getDay()]}) ${hhmm(d)} KST\n📍 ${m.city}\n📺 ${m.tv.join(' · ')}\n🔗 https://ske-0004.web.app/wc2026/`;
  if(navigator.share){
    navigator.share({title:'WC2026 경기 일정',text}).catch(()=>{});
  }else{
    navigator.clipboard.writeText(text).then(()=>{alert('복사됐어요!');}).catch(()=>{alert(text);});
  }
}

/* ── 예측 마감 카운트다운 텍스트 ── */
function matchDeadlineText(m){
  if(m.score)return'';
  const diff=new Date(m.kst)-new Date();
  if(diff<=0)return'';
  const h=Math.floor(diff/3600000);
  const min=Math.floor((diff%3600000)/60000);
  if(h>=48)return'';
  const cls=h<1?'pred-deadline urgent':'pred-deadline';
  const txt=h>=1?`${h}시간 ${min}분 후 마감`:`${min}분 후 마감!`;
  return`<span class="${cls}">⏱ ${txt}</span>`;
}

/* ── 방송 뱃지 ── */
const BADGE_URLS = {
  "치지직 무료": "https://chzzk.naver.com/",
  "치지직": "https://chzzk.naver.com/",
  "KBS": "https://myK.kbs.co.kr/",
  "JTBC": "https://www.jtbc.co.kr/tv"
};
function badge(t){
  const cls=t.includes("무료")?"b-free":t.includes("KBS")?"b-kbs":t.includes("JTBC")?"b-jtbc":"b-chzzk";
  const url=BADGE_URLS[t]||'#';
  return `<a href="${url}" target="_blank" rel="noopener" class="b ${cls}" style="cursor:pointer">${t}</a>`;
}

function hhmm(d){return`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}

function applyTwemoji(){
  if(window.twemoji) twemoji.parse(document.body);
}
