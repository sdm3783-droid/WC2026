/* ── 전역 상태 변수 ── */
let scheduleFilter = 'all';
let scheduleDate = null;
let showPastMatches = false;
let PREDS = {};
let SCORE_PREDS = {};
let GRP_PREDS = {}; // { A: {p1:'kor', p2:'mex'}, ... }
let MY_BETS = {}; // { 'ko-73': { val:'h', amount:3, multiplier:3, settled:false } }
let VIEW_MODE = false;
let R = {}; // 전역 순위 캐시 (KO 팀명 해석용)
let heartbeatTimer = null;
let lastKnownCorrect = -1; // -1: 초기화 전 (첫 로드 시 토스트 미표시)
let lastFetch = null;
let fetchTimer = null;
let deadlineRefreshTimer = null;
