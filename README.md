# URIGG Brand Kit

URIGG 유니버스(웹·바탕화면, 허브(데스크톱 앱), 크롬 확장, 봇, GitHub 프로필 등)가 함께 쓰는 로고·색·글꼴·리퀴드 글라스·부품·말투의 기준입니다.
전체 모습은 `index.html`(브랜드 페이지)에서 볼 수 있습니다.

## 들어 있는 것

| 경로 | 내용 |
|---|---|
| `tokens/urigg.css` | 색·글꼴·크기·간격·유리·움직임 값 (CSS 변수, 모두 `--u-`로 시작) |
| `tokens/urigg.json` | 같은 값의 JSON (JavaScript·봇·이미지 생성용) |
| `components/urigg-glass.css` | 유리 칸, 탭 알약, 유리 아이콘 버튼, 주요 버튼, 오로라 (클래스는 `u-`로 시작) |
| `logo/` | 엠블럼(320 webp, 512·1400 png), 마크 64, 파비콘 32·180·192 |
| `icons/` | 흰색 단색 아이콘 (simple-icons CC0, 드림핵은 공식 로고의 심볼) |
| `index.html` | 브랜드 페이지: 키트의 토큰과 부품으로 만든 견본 |

## 쓰는 법

다른 프로젝트에서는 jsDelivr로 바로 불러옵니다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/yde5536/URIGG-Brand@main/tokens/urigg.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/yde5536/URIGG-Brand@main/components/urigg-glass.css">
```

```html
<article class="u-tile">
  <div class="u-tile__head"><h2 class="u-tile__title">D-day</h2></div>
  …
</article>
```

글꼴은 각 페이지에서 따로 불러옵니다 (주소는 `tokens/urigg.json`의 `font.sources`).

## 규칙 요약

- 검정 바탕, 거의 흰 글자. 크림슨은 주요 버튼과 경고 글자에만.
- 영문 Switzer + 한글 Pretendard, 고정폭은 작은 라벨에만.
- 유리 칸은 꽤 투명하지만 맑지는 않게, 테두리는 얇은 빛 한 줄.
- 아이콘은 흰색 단색.
- 하지 않는 것: 초록 해커 테마, ASCII 배너, rim glow, 빨강이 많은 화면, 장식 사진, 진행률 게이지, 움직이는 탭 알약의 굴절 렌즈.
- 실명이나 학교 이름은 어디에도 넣지 않습니다.

값을 바꿀 때는 `tokens/urigg.css`와 `tokens/urigg.json`을 함께 고칩니다.
