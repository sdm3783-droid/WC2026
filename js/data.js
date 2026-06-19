/* ── 데이터 ── */
const TEAMS = {
  kor:{name:"대한민국",emo:"🇰🇷"}, cze:{name:"체코",emo:"🇨🇿"},
  mex:{name:"멕시코",emo:"🇲🇽"},  rsa:{name:"남아공",emo:"🇿🇦"},
  ned:{name:"네덜란드",emo:"🇳🇱"}, jpn:{name:"일본",emo:"🇯🇵"},
  can:{name:"캐나다",emo:"🇨🇦"},  bih:{name:"보스니아",emo:"🇧🇦"},
  usa:{name:"미국",emo:"🇺🇸"},    par:{name:"파라과이",emo:"🇵🇾"},
  qat:{name:"카타르",emo:"🇶🇦"},  sui:{name:"스위스",emo:"🇨🇭"},
  bra:{name:"브라질",emo:"🇧🇷"},  mar:{name:"모로코",emo:"🇲🇦"},
  hai:{name:"아이티",emo:"🇭🇹"},  sco:{name:"스코틀랜드",emo:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
  aus:{name:"호주",emo:"🇦🇺"},    tur:{name:"튀르키예",emo:"🇹🇷"},
  ger:{name:"독일",emo:"🇩🇪"},    cuw:{name:"퀴라소",emo:"🇨🇼"},
  civ:{name:"코트디부아르",emo:"🇨🇮"}, ecu:{name:"에콰도르",emo:"🇪🇨"},
  swe:{name:"스웨덴",emo:"🇸🇪"},  tun:{name:"튀니지",emo:"🇹🇳"},
  bel:{name:"벨기에",emo:"🇧🇪"},  egy:{name:"이집트",emo:"🇪🇬"},
  irn:{name:"이란",emo:"🇮🇷"},    nzl:{name:"뉴질랜드",emo:"🇳🇿"},
  esp:{name:"스페인",emo:"🇪🇸"},  cpv:{name:"카보베르데",emo:"🇨🇻"},
  ksa:{name:"사우디",emo:"🇸🇦"},  uru:{name:"우루과이",emo:"🇺🇾"},
  fra:{name:"프랑스",emo:"🇫🇷"},  sen:{name:"세네갈",emo:"🇸🇳"},
  irq:{name:"이라크",emo:"🇮🇶"},  nor:{name:"노르웨이",emo:"🇳🇴"},
  arg:{name:"아르헨티나",emo:"🇦🇷"}, alg:{name:"알제리",emo:"🇩🇿"},
  aut:{name:"오스트리아",emo:"🇦🇹"}, jor:{name:"요르단",emo:"🇯🇴"},
  por:{name:"포르투갈",emo:"🇵🇹"}, cod:{name:"DR콩고",emo:"🇨🇩"},
  uzb:{name:"우즈베키스탄",emo:"🇺🇿"}, col:{name:"콜롬비아",emo:"🇨🇴"},
  eng:{name:"잉글랜드",emo:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"}, cro:{name:"크로아티아",emo:"🇭🇷"},
  gha:{name:"가나",emo:"🇬🇭"},    pan:{name:"파나마",emo:"🇵🇦"}
};

const TLA_MAP = {
  KOR:'kor',KRE:'kor',CZE:'cze',MEX:'mex',RSA:'rsa',ZAF:'rsa',
  NED:'ned',JPN:'jpn',CAN:'can',BIH:'bih',USA:'usa',PAR:'par',PRY:'par',
  QAT:'qat',SUI:'sui',BRA:'bra',MAR:'mar',HAI:'hai',HTI:'hai',
  SCO:'sco',AUS:'aus',TUR:'tur',GER:'ger',CUW:'cuw',CIV:'civ',
  ECU:'ecu',SWE:'swe',TUN:'tun',BEL:'bel',EGY:'egy',IRN:'irn',
  NZL:'nzl',ESP:'esp',CPV:'cpv',KSA:'ksa',SAU:'ksa',URU:'uru',
  FRA:'fra',SEN:'sen',IRQ:'irq',NOR:'nor',ARG:'arg',ALG:'alg',DZA:'alg',
  AUT:'aut',JOR:'jor',POR:'por',COD:'cod',UZB:'uzb',COL:'col',
  ENG:'eng',CRO:'cro',GHA:'gha',PAN:'pan'
};

const EN_NAME_MAP = {
  'Korea Republic':'kor','South Korea':'kor','Czech Republic':'cze','Czechia':'cze',
  'Mexico':'mex','South Africa':'rsa','Netherlands':'ned','Japan':'jpn',
  'Canada':'can','Bosnia and Herzegovina':'bih','USA':'usa','United States':'usa',
  'Paraguay':'par','Qatar':'qat','Switzerland':'sui','Brazil':'bra',
  'Morocco':'mar','Haiti':'hai','Scotland':'sco','Australia':'aus',
  'Turkey':'tur','Türkiye':'tur','Germany':'ger','Curaçao':'cuw',
  "Côte d'Ivoire":'civ',"Ivory Coast":'civ','Ecuador':'ecu','Sweden':'swe',
  'Tunisia':'tun','Belgium':'bel','Egypt':'egy','Iran':'irn','New Zealand':'nzl',
  'Spain':'esp','Cape Verde':'cpv','Saudi Arabia':'ksa','Uruguay':'uru',
  'France':'fra','Senegal':'sen','Iraq':'irq','Norway':'nor','Argentina':'arg',
  'Algeria':'alg','Austria':'aut','Jordan':'jor','Portugal':'por',
  'DR Congo':'cod','Congo DR':'cod','Uzbekistan':'uzb','Colombia':'col',
  'England':'eng','Croatia':'cro','Ghana':'gha','Panama':'pan'
};

const KR_TV = ["치지직 무료","KBS","JTBC"];
const MATCHES = [
  {kst:"2026-06-12T04:00",home:"mex",away:"rsa",group:"A",city:"멕시코시티",tv:["치지직"],score:null},
  {kst:"2026-06-12T11:00",home:"kor",away:"cze",group:"A",city:"과달라하라",tv:KR_TV,score:null,kr:true},
  {kst:"2026-06-13T04:00",home:"can",away:"bih",group:"B",city:"토론토",tv:["치지직"],score:null},
  {kst:"2026-06-13T10:00",home:"usa",away:"par",group:"D",city:"로스앤젤레스",tv:["치지직"],score:null},
  {kst:"2026-06-14T04:00",home:"qat",away:"sui",group:"B",city:"샌프란시스코",tv:["치지직"],score:null},
  {kst:"2026-06-14T07:00",home:"bra",away:"mar",group:"C",city:"뉴욕",tv:["치지직"],score:null},
  {kst:"2026-06-14T10:00",home:"hai",away:"sco",group:"C",city:"보스턴",tv:["치지직"],score:null},
  {kst:"2026-06-14T13:00",home:"aus",away:"tur",group:"D",city:"밴쿠버",tv:["치지직"],score:null},
  {kst:"2026-06-15T02:00",home:"ger",away:"cuw",group:"E",city:"휴스턴",tv:["치지직"],score:null},
  {kst:"2026-06-15T05:00",home:"ned",away:"jpn",group:"F",city:"댈러스",tv:["치지직"],score:null},
  {kst:"2026-06-15T08:00",home:"civ",away:"ecu",group:"E",city:"필라델피아",tv:["치지직"],score:null},
  {kst:"2026-06-15T11:00",home:"swe",away:"tun",group:"F",city:"몬테레이",tv:["치지직"],score:null},
  {kst:"2026-06-16T01:00",home:"esp",away:"cpv",group:"H",city:"애틀랜타",tv:["치지직"],score:null},
  {kst:"2026-06-16T04:00",home:"bel",away:"egy",group:"G",city:"시애틀",tv:["치지직"],score:null},
  {kst:"2026-06-16T07:00",home:"ksa",away:"uru",group:"H",city:"마이애미",tv:["치지직"],score:null},
  {kst:"2026-06-16T10:00",home:"irn",away:"nzl",group:"G",city:"로스앤젤레스",tv:["치지직"],score:null},
  {kst:"2026-06-17T04:00",home:"fra",away:"sen",group:"I",city:"뉴욕",tv:["치지직"],score:null},
  {kst:"2026-06-17T07:00",home:"irq",away:"nor",group:"I",city:"보스턴",tv:["치지직"],score:null},
  {kst:"2026-06-17T10:00",home:"arg",away:"alg",group:"J",city:"캔자스시티",tv:["치지직"],score:null},
  {kst:"2026-06-17T13:00",home:"aut",away:"jor",group:"J",city:"샌프란시스코",tv:["치지직"],score:null},
  {kst:"2026-06-18T02:00",home:"por",away:"cod",group:"K",city:"휴스턴",tv:["치지직"],score:null},
  {kst:"2026-06-18T05:00",home:"eng",away:"cro",group:"L",city:"댈러스",tv:["치지직"],score:null},
  {kst:"2026-06-18T08:00",home:"gha",away:"pan",group:"L",city:"토론토",tv:["치지직"],score:null},
  {kst:"2026-06-18T11:00",home:"uzb",away:"col",group:"K",city:"멕시코시티",tv:["치지직"],score:null},
  {kst:"2026-06-19T01:00",home:"cze",away:"rsa",group:"A",city:"애틀랜타",tv:["치지직"],score:null},
  {kst:"2026-06-19T04:00",home:"sui",away:"bih",group:"B",city:"로스앤젤레스",tv:["치지직"],score:null},
  {kst:"2026-06-19T07:00",home:"can",away:"qat",group:"B",city:"밴쿠버",tv:["치지직"],score:null},
  {kst:"2026-06-19T10:00",home:"mex",away:"kor",group:"A",city:"과달라하라",tv:KR_TV,score:null,kr:true},
  {kst:"2026-06-20T04:00",home:"usa",away:"aus",group:"D",city:"시애틀",tv:["치지직"],score:null},
  {kst:"2026-06-20T07:00",home:"sco",away:"mar",group:"C",city:"보스턴",tv:["치지직"],score:null},
  {kst:"2026-06-20T10:00",home:"bra",away:"hai",group:"C",city:"필라델피아",tv:["치지직"],score:null},
  {kst:"2026-06-20T13:00",home:"tur",away:"par",group:"D",city:"샌프란시스코",tv:["치지직"],score:null},
  {kst:"2026-06-21T02:00",home:"ned",away:"swe",group:"F",city:"휴스턴",tv:["치지직"],score:null},
  {kst:"2026-06-21T05:00",home:"ger",away:"civ",group:"E",city:"토론토",tv:["치지직"],score:null},
  {kst:"2026-06-21T09:00",home:"ecu",away:"cuw",group:"E",city:"캔자스시티",tv:["치지직"],score:null},
  {kst:"2026-06-21T13:00",home:"tun",away:"jpn",group:"F",city:"몬테레이",tv:["치지직"],score:null},
  {kst:"2026-06-22T01:00",home:"esp",away:"ksa",group:"H",city:"애틀랜타",tv:["치지직"],score:null},
  {kst:"2026-06-22T04:00",home:"bel",away:"irn",group:"G",city:"로스앤젤레스",tv:["치지직"],score:null},
  {kst:"2026-06-22T07:00",home:"uru",away:"cpv",group:"H",city:"마이애미",tv:["치지직"],score:null},
  {kst:"2026-06-22T10:00",home:"nzl",away:"egy",group:"G",city:"밴쿠버",tv:["치지직"],score:null},
  {kst:"2026-06-23T02:00",home:"arg",away:"aut",group:"J",city:"댈러스",tv:["치지직"],score:null},
  {kst:"2026-06-23T06:00",home:"fra",away:"irq",group:"I",city:"필라델피아",tv:["치지직"],score:null},
  {kst:"2026-06-23T09:00",home:"nor",away:"sen",group:"I",city:"뉴욕",tv:["치지직"],score:null},
  {kst:"2026-06-23T12:00",home:"jor",away:"alg",group:"J",city:"샌프란시스코",tv:["치지직"],score:null},
  {kst:"2026-06-24T02:00",home:"por",away:"uzb",group:"K",city:"휴스턴",tv:["치지직"],score:null},
  {kst:"2026-06-24T05:00",home:"eng",away:"gha",group:"L",city:"보스턴",tv:["치지직"],score:null},
  {kst:"2026-06-24T08:00",home:"pan",away:"cro",group:"L",city:"토론토",tv:["치지직"],score:null},
  {kst:"2026-06-24T11:00",home:"col",away:"cod",group:"K",city:"과달라하라",tv:["치지직"],score:null},
  {kst:"2026-06-25T04:00",home:"sui",away:"can",group:"B",city:"밴쿠버",tv:["치지직"],score:null},
  {kst:"2026-06-25T04:00",home:"bih",away:"qat",group:"B",city:"시애틀",tv:["치지직"],score:null},
  {kst:"2026-06-25T07:00",home:"sco",away:"bra",group:"C",city:"마이애미",tv:["치지직"],score:null},
  {kst:"2026-06-25T07:00",home:"mar",away:"hai",group:"C",city:"애틀랜타",tv:["치지직"],score:null},
  {kst:"2026-06-25T10:00",home:"rsa",away:"kor",group:"A",city:"몬테레이",tv:KR_TV,score:null,kr:true},
  {kst:"2026-06-25T10:00",home:"cze",away:"mex",group:"A",city:"멕시코시티",tv:["치지직"],score:null},
  {kst:"2026-06-26T05:00",home:"ecu",away:"ger",group:"E",city:"뉴욕",tv:["치지직"],score:null},
  {kst:"2026-06-26T05:00",home:"cuw",away:"civ",group:"E",city:"필라델피아",tv:["치지직"],score:null},
  {kst:"2026-06-26T08:00",home:"jpn",away:"swe",group:"F",city:"댈러스",tv:["치지직"],score:null},
  {kst:"2026-06-26T08:00",home:"tun",away:"ned",group:"F",city:"캔자스시티",tv:["치지직"],score:null},
  {kst:"2026-06-26T11:00",home:"tur",away:"usa",group:"D",city:"로스앤젤레스",tv:["치지직"],score:null},
  {kst:"2026-06-26T11:00",home:"par",away:"aus",group:"D",city:"샌프란시스코",tv:["치지직"],score:null},
  {kst:"2026-06-27T04:00",home:"nor",away:"fra",group:"I",city:"보스턴",tv:["치지직"],score:null},
  {kst:"2026-06-27T04:00",home:"sen",away:"irq",group:"I",city:"토론토",tv:["치지직"],score:null},
  {kst:"2026-06-27T09:00",home:"cpv",away:"ksa",group:"H",city:"휴스턴",tv:["치지직"],score:null},
  {kst:"2026-06-27T09:00",home:"uru",away:"esp",group:"H",city:"과달라하라",tv:["치지직"],score:null},
  {kst:"2026-06-27T12:00",home:"egy",away:"irn",group:"G",city:"시애틀",tv:["치지직"],score:null},
  {kst:"2026-06-27T12:00",home:"nzl",away:"bel",group:"G",city:"밴쿠버",tv:["치지직"],score:null},
  {kst:"2026-06-28T06:00",home:"pan",away:"eng",group:"L",city:"뉴욕",tv:["치지직"],score:null},
  {kst:"2026-06-28T06:00",home:"cro",away:"gha",group:"L",city:"필라델피아",tv:["치지직"],score:null},
  {kst:"2026-06-28T08:30",home:"col",away:"por",group:"K",city:"마이애미",tv:["치지직"],score:null},
  {kst:"2026-06-28T08:30",home:"cod",away:"uzb",group:"K",city:"애틀랜타",tv:["치지직"],score:null},
  {kst:"2026-06-28T11:00",home:"alg",away:"aut",group:"J",city:"캔자스시티",tv:["치지직"],score:null},
  {kst:"2026-06-28T11:00",home:"jor",away:"arg",group:"J",city:"댈러스",tv:["치지직"],score:null}
];

const GROUPS = {
  A:["mex","kor","cze","rsa"],B:["can","bih","qat","sui"],
  C:["bra","mar","hai","sco"],D:["usa","par","aus","tur"],
  E:["ger","cuw","civ","ecu"],F:["ned","jpn","swe","tun"],
  G:["bel","egy","irn","nzl"],H:["esp","cpv","ksa","uru"],
  I:["fra","sen","irq","nor"],J:["arg","alg","aut","jor"],
  K:["por","cod","uzb","col"],L:["eng","cro","gha","pan"]
};

// 🤖 AI 조별 순위 예측 (파워랭킹 기반)
const AI_PICKS = {
  A:{p1:'mex',p2:'kor'}, // 멕시코 1위 · 한국 2위
  B:{p1:'can',p2:'sui'}, // 캐나다 홈 이점 · 스위스
  C:{p1:'bra',p2:'mar'}, // 브라질 · 모로코
  D:{p1:'usa',p2:'tur'}, // 미국 홈 이점 · 튀르키예
  E:{p1:'ger',p2:'civ'}, // 독일 · 코트디부아르
  F:{p1:'ned',p2:'jpn'}, // 네덜란드 · 일본
  G:{p1:'bel',p2:'irn'}, // 벨기에 · 이란
  H:{p1:'esp',p2:'uru'}, // 스페인 · 우루과이
  I:{p1:'fra',p2:'nor'}, // 프랑스 · 노르웨이(홀란드)
  J:{p1:'arg',p2:'aut'}, // 아르헨티나 · 오스트리아
  K:{p1:'por',p2:'col'}, // 포르투갈 · 콜롬비아
  L:{p1:'eng',p2:'cro'}, // 잉글랜드 · 크로아티아
};

const KO = [
  {id:73,r:"32강",d:"6/29 04:00",city:"LA",home:{t:"2",g:"A"},away:{t:"2",g:"B"},score:null},
  {id:76,r:"32강",d:"6/30 02:00",city:"휴스턴",home:{t:"1",g:"C"},away:{t:"2",g:"F"},score:null},
  {id:74,r:"32강",d:"6/30 05:30",city:"보스턴",home:{t:"1",g:"E"},away:{t:"3",cand:"ABCDF"},score:null},
  {id:75,r:"32강",d:"6/30 10:00",city:"몬테레이",home:{t:"1",g:"F"},away:{t:"2",g:"C"},score:null},
  {id:78,r:"32강",d:"7/1 02:00",city:"댈러스",home:{t:"2",g:"E"},away:{t:"2",g:"I"},score:null},
  {id:77,r:"32강",d:"7/1 06:00",city:"뉴욕",home:{t:"1",g:"I"},away:{t:"3",cand:"CDFGH"},score:null},
  {id:79,r:"32강",d:"7/1 10:00",city:"멕시코시티",home:{t:"1",g:"A"},away:{t:"3",cand:"CEFHI"},score:null},
  {id:80,r:"32강",d:"7/2 01:00",city:"애틀랜타",home:{t:"1",g:"L"},away:{t:"3",cand:"EHIJK"},score:null},
  {id:82,r:"32강",d:"7/2 05:00",city:"시애틀",home:{t:"1",g:"G"},away:{t:"3",cand:"AEHIJ"},score:null},
  {id:81,r:"32강",d:"7/2 09:00",city:"샌프란시스코",home:{t:"1",g:"D"},away:{t:"3",cand:"BEFIJ"},score:null},
  {id:84,r:"32강",d:"7/3 04:00",city:"LA",home:{t:"1",g:"H"},away:{t:"2",g:"J"},score:null},
  {id:83,r:"32강",d:"7/3 08:00",city:"토론토",home:{t:"2",g:"K"},away:{t:"2",g:"L"},score:null},
  {id:85,r:"32강",d:"7/3~4",city:"",home:{t:"1",g:"B"},away:{t:"3",cand:"EFGIJ"},score:null},
  {id:86,r:"32강",d:"7/4 07:00",city:"",home:{t:"1",g:"J"},away:{t:"2",g:"H"},score:null},
  {id:87,r:"32강",d:"7/4",city:"캔자스시티",home:{t:"1",g:"K"},away:{t:"3",cand:"DEIJL"},score:null},
  {id:88,r:"32강",d:"7/3~4",city:"",home:{t:"2",g:"D"},away:{t:"2",g:"G"},score:null},
  {id:90,r:"16강",d:"7/5 02:00",city:"휴스턴",home:{w:73},away:{w:75},score:null},
  {id:89,r:"16강",d:"7/5 06:00",city:"필라델피아",home:{w:74},away:{w:77},score:null},
  {id:91,r:"16강",d:"7/6 05:00",city:"뉴욕",home:{w:76},away:{w:78},score:null},
  {id:92,r:"16강",d:"7/6 09:00",city:"멕시코시티",home:{w:79},away:{w:80},score:null},
  {id:93,r:"16강",d:"7/7 04:00",city:"댈러스",home:{w:83},away:{w:84},score:null},
  {id:94,r:"16강",d:"7/7 09:00",city:"시애틀",home:{w:81},away:{w:82},score:null},
  {id:95,r:"16강",d:"7/8 01:00",city:"애틀랜타",home:{w:86},away:{w:88},score:null},
  {id:96,r:"16강",d:"7/8 05:00",city:"밴쿠버",home:{w:85},away:{w:87},score:null},
  {id:97,r:"8강",d:"7/10 05:00",city:"보스턴",home:{w:89},away:{w:90},score:null},
  {id:98,r:"8강",d:"7/10~11",city:"LA",home:{w:93},away:{w:94},score:null},
  {id:99,r:"8강",d:"7/11~12",city:"마이애미",home:{w:91},away:{w:92},score:null},
  {id:100,r:"8강",d:"7/11~12",city:"캔자스시티",home:{w:95},away:{w:96},score:null},
  {id:101,r:"4강",d:"7/15",city:"댈러스",home:{w:97},away:{w:98},score:null},
  {id:102,r:"4강",d:"7/16",city:"애틀랜타",home:{w:99},away:{w:100},score:null},
  {id:103,r:"3·4위전",d:"7/19 06:00",city:"마이애미",home:{l:101},away:{l:102},score:null},
  {id:104,r:"결승",d:"7/20 04:00",city:"뉴욕",home:{w:101},away:{w:102},score:null}
];

const THIRD_ASSIGN = {};
const DOW = ["일","월","화","수","목","금","토"];

const FEED_ITEMS = [
  {
    date:'2026.06.28', type:'update', icon:'⚡',
    title:'BOOST 배팅 + 우승팀 예측 오픈!',
    desc:'조별리그 코인을 32강 경기에 베팅하세요! ×3 배수. 우승팀 예측도 오픈 — 적중 시 +20🪙. 마감은 29일 04시.',
    tags:['#BOOST오픈','#32강','#우승팀예측'],
  },
  {
    date:'2026.06.28', type:'news', icon:'🏆',
    title:'32강 대진 확정 — 오늘 14시부터 예측 시작',
    desc:'조별리그가 마무리됐습니다. 32강 대진표를 확인하고 우승팀을 예측해보세요!',
    tags:['#32강','#토너먼트','#대진표'],
  },
  {
    date:'2026.06.18', type:'update', icon:'🥇',
    title:'1등 포디움 강조 효과 추가!',
    desc:'예측 순위 1위 금메달에 회전 shimmer 링 + 골드 발광 효과가 적용됩니다. 예측방 랭킹 탭에서 확인해보세요!',
    tags:['#포디움','#1등효과','#업데이트'],
  },
  {
    date:'2026.06.18', type:'update', icon:'🏟️',
    title:'히어로 배경 실사 경기장으로 교체',
    desc:'메인 화면 상단 배경이 실제 경기장 사진으로 바뀌었습니다. 월드컵 현장 분위기를 느껴보세요!',
    tags:['#디자인','#배경','#업데이트'],
  },
  {
    date:'2026.06.18', type:'news', icon:'⚔️',
    title:'내일 한국 vs 멕시코 — A조 최대 고비',
    desc:'6월 19일 10:00 KST, 과달라하라에서 멕시코와 맞대결! 멕시코는 홈 대륙의 강호, 승점 3점이 절실한 한국의 결전.',
    tags:['#한국','#멕시코','#A조'],
  },
  {
    date:'2026.06.18', type:'news', icon:'🇰🇷',
    title:'한국 A조 일정 총정리',
    desc:'1차전 체코(6/12) → 2차전 멕시코(6/19) → 3차전 남아공(6/25). 상위 2팀이 32강 진출. 매 경기가 결승전이다!',
    tags:['#한국일정','#A조','#32강'],
  },
  {
    date:'2026.06.17', type:'update', icon:'💬',
    title:'예측방 채팅 오픈!',
    desc:'예측방 멤버들과 실시간으로 대화할 수 있어요. 랭킹 탭 옆 채팅 탭을 눌러보세요!',
    tags:['#채팅','#실시간','#예측방'],
  },
  {
    date:'2026.06.17', type:'update', icon:'🔥',
    title:'경기별 이모지 반응 추가!',
    desc:'경기 카드 아래 🔥😱⚽💀🎉 버튼으로 반응을 남겨보세요. 예측방 참여자 모두가 실시간으로 볼 수 있어요!',
    tags:['#이모지반응','#경기카드','#실시간'],
  },
  {
    date:'2026.06.17', type:'update', icon:'🤖',
    title:'AI를 이겨라! 챌린지 오픈',
    desc:'조 순위 예측에서 AI 점수를 뛰어넘으면 보너스 코인! 12개 조 AI 예측을 순위표에서 확인해보세요.',
    tags:['#AI챌린지','#보너스코인','#조순위예측'],
  },
  {
    date:'2026.06.17', type:'update', icon:'⚡',
    title:'BOOST 배팅 시스템 — 6/28 오픈 예정',
    desc:'조별리그가 끝나면 모은 코인을 토너먼트에 베팅! 32강 ×3, 16강 ×5, 8강 이상 ×10 배수로 불릴 수 있어요.',
    tags:['#BOOST배팅','#토너먼트','#코인배수'],
  },
  {
    date:'2026.06.17', type:'update', icon:'🏆',
    title:'우승팀 예측 — 6/28 오픈, 적중 시 🪙+20',
    desc:'32강 대진이 확정되는 6월 28일 14시부터 우승국을 예측할 수 있어요. 단 하나의 팀, 맞추면 보너스 20코인!',
    tags:['#우승팀예측','#챔피언','#대박코인'],
  },
  {
    date:'2026.06.15', type:'update', icon:'📊',
    title:'조 순위 예측 기능 추가 — 그룹당 최대 +4🪙',
    desc:'순위표 탭에서 각 조의 1위·2위를 예측하세요. 1위 적중 +2, 2위 적중 +1, 둘 다 맞추면 +4코인!',
    tags:['#조순위예측','#코인획득','#순위표'],
  },
  {
    date:'2026.06.11', type:'news', icon:'🌍',
    title:'2026 FIFA 북중미 월드컵 개막!',
    desc:'역대 최초 48개국, 104경기의 대장정 시작. 미국·캐나다·멕시코 3국 공동 개최. 한국은 A조 배정.',
    tags:['#WC2026','#개막','#48개국'],
  },
  {
    date:'2026.06.11', type:'news', icon:'🇰🇷',
    title:'한국, A조 배정 — 멕시코·체코·남아공과 격돌',
    desc:'대한민국은 A조에서 멕시코·체코·남아공과 경쟁합니다. A조 1·2위 팀이 32강 직행!',
    tags:['#대한민국','#A조','#조별리그'],
  },
  {
    date:'2026.06.10', type:'update', icon:'👥',
    title:'예측방 오픈 — 친구들과 코인 배틀!',
    desc:'닉네임만 입력하면 바로 참여! 전 경기 승부를 예측하고 최다 적중자에게 커피쿠폰을 쏩니다 ☕',
    tags:['#예측방','#코인배틀','#커피쿠폰'],
  },
];

