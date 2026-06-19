# 클로드 코드 작업 지시서 — WC2026 예측방 2026 리디자인 적용

이 폴더의 `theme-2026.css`를 실제 앱(`js/` 바닐라 PWA)에 입히는 작업이다.
앱 구조(바닐라 JS, `render.js`가 `innerHTML`로 그림)는 **유지**하고, **비주얼만** 새 디자인 시스템으로 바꾼다. React 컴포넌트(.jsx)는 옮기지 않는다 — 토큰/스타일만 이식한다.

## 0. 파일 배치
- `theme-2026.css`를 앱 루트(`index.html`과 같은 위치)에 복사한다.
- 이 파일은 Pretendard·JetBrains Mono 폰트(@font-face, jsDelivr CDN)와 전체 토큰을 모두 포함한 **단일 합본**이다. 별도 import 불필요.

## 1. index.html 수정 (핵심)
`<head>`에서 **기존 앱 스타일시트보다 먼저** 토큰을, **나중에** 브리지가 이기도록 한 줄만 추가:

```html
<!-- 기존 <head> 안, 기존 CSS <link>/<style> 보다 뒤에 둘 것 -->
<link rel="stylesheet" href="theme-2026.css" />
```

`theme-2026.css`는 맨 아래 "레거시 변수 브리지"에서 기존 `:root` 변수(--bg, --gold, --dim, --border …)를 새 팔레트로 재정의한다. 따라서 **기존 CSS가 이 변수들을 쓰고 있었다면**, link 한 줄만으로 색·배경·라인이 새 시스템으로 바뀐다.

> ⚠️ 먼저 실제 `index.html`(또는 기존 CSS 파일)의 `:root`를 열어 **진짜 변수 이름**을 확인하라. `theme-2026.css` 하단 브리지의 이름(--gold, --dim, --bg 등)은 코드에서 관찰한 추정치다. 다르면 브리지의 좌변 이름을 실제 이름에 맞춰 고친다.

## 2. 다크/라이트 테마 스위치
새 토큰은 `[data-theme="light"]`에서 라이트 팔레트로 전환된다. `<html>`에 속성을 토글:

```js
document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark'); // 기본 dark
```

기존에 테마 토글이 없으면 헤더에 🌙/☀️ 버튼 하나만 추가하면 된다(선택).

## 3. 액센트 분리 — 유일하게 손이 가는 구조 변경
기존 앱은 `--gold` 하나를 **버튼/CTA**와 **코인** 양쪽에 썼다. 리디자인은 이걸 둘로 나눈다:

| 용도 | 기존 | 새 토큰 |
|---|---|---|
| 버튼·CTA·선택·활성 탭·포커스 | `--gold` | **`--c-brand`** (인디고 #635bf0) |
| 코인🪙·보상·트로피·우승예측·🇰🇷강조 | `--gold` | **`--c-coin`** (골드, 유지) |

→ `render.js`에서 버튼/선택 상태를 그리는 부분의 색을 `var(--c-brand)`로 바꾸고, 코인·리워드 표시에만 `var(--c-coin)`/`var(--gold)`을 남긴다. (단순 변수 매핑으로는 한 변수를 둘로 못 나누므로 이 부분만 직접 수정.)

## 4. 컴포넌트 룩 맞추기 (선택, 점진적)
디자인 시스템과 똑같은 디테일을 원하면 기존 클래스 CSS를 아래 토큰으로 조정:
- 카드: `border-radius: var(--r-md); border: 1px solid var(--c-border); box-shadow: var(--shadow-sm); background: var(--c-surface);`
- 배지/칩/코인: `border-radius: var(--r-pill);`
- 디스플레이 텍스트(카운트다운·스코어·페이지 제목): `font-family: var(--font-sans); font-weight: var(--fw-display);`
- 스코어·코인 숫자: `font-family: var(--font-mono); font-variant-numeric: tabular-nums;`
- 본문: `font: var(--type-body);`

각 컴포넌트의 정확한 비주얼 스펙은 디자인 시스템 탭의 카드들과 `components/*/*.prompt.md`를 레퍼런스로 본다.

## 5. 폰트
`theme-2026.css`가 Pretendard를 CDN에서 로드한다. 오프라인/프로덕션이면 woff2를 자기 서버에 받아 두고 파일 상단 @font-face의 `src` url만 교체한다.

## 6. 이모지/국기
기존 앱은 이미 Twemoji를 쓰므로 그대로 둔다. 새 디자인도 이모지를 아이콘 언어로 쓴다(라인 아이콘 세트 도입 금지).

## 검수 체크리스트
- [ ] `theme-2026.css` link 추가 후 배경이 딥 잉크(#0b0e16)로 바뀌었나
- [ ] 버튼/활성 탭이 **인디고**, 코인 표시가 **골드**로 분리됐나
- [ ] 한글이 Pretendard로 렌더되나
- [ ] `data-theme="light"`로 토글 시 전체가 라이트로 전환되나
- [ ] 스코어·코인 숫자가 자리 안 흔들리나(tabular)

---
참고: 이 디자인 시스템 프로젝트의 `readme.md`에 색/타입/간격/보이스 가이드 전체가 있다. 막히면 그걸 본다.
