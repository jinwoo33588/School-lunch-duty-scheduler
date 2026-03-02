# 급식 당번 프로젝트 (School Lunch Duty Scheduler)

교내 급식 당번을 자동으로 배정하고, 결과를 달력/표 형태로 확인할 수 있는 스케줄 생성 서비스입니다.  
(예: 입구 / 내부1 / 내부2 포지션을 고정 순서로 표시)

## 주요 기능
- 교사 목록 및 가능 요일 기반 스케줄 생성
- 포지션 고정 순서 출력: **입구 → 내부1 → 내부2**
- 결과 페이지에서 특정 교사 선택 시 해당 교사의 당번 일정 하이라이트/필터링
- (추가 예정) 예외 규칙, 휴일/행사일 반영, 내보내기(Excel/CSV)

## 데모 화면
> 스크린샷/짧은 GIF를 여기에 추가하면 이해가 확 빨라집니다.
- `/docs` 폴더에 이미지 넣고 아래처럼 링크:
  - `![result](docs/result.png)`

## 기술 스택
### Frontend
- React / Vite
- TypeScript
- (UI) (사용 중인 라이브러리 있으면 추가: Tailwind, MUI 등)

### Backend
- Node.js
- Express
- TypeScript

## 폴더 구조
```txt
.
├─ frontend/
└─ backend/
