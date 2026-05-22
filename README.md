# 마음토스 기관 전용 결제창

기관에 전달한 **입장 코드**를 입력하면 마음토스 12개월 이용권 상품이 노출되고,
상품을 선택하면 **토스페이먼츠 자동결제(빌링)** 로 결제되는 독립형 결제 페이지입니다.

- **스택**: Next.js (App Router) + React 19 + Tailwind CSS v4 + TypeScript
- **결제**: 토스페이먼츠 빌링 결제 (`@tosspayments/tosspayments-sdk` + 서버 API)
- **상품** (금액은 부가세 별도 / 결제 시 부가세 10% 포함 청구)
  - 플러스 플랜 12개월 이용권 — **300,000원** (부가세 포함 330,000원)
  - 프로 플랜 12개월 이용권 — **500,000원** (부가세 포함 550,000원)

## 화면 흐름

```
[/] 코드 입력  →  상품 선택  →  결제 정보 입력  →  토스 결제창
                                                        │
                                  성공 → [/payment/success] → 빌링키 발급 + 결제 승인 → 완료
                                  실패 → [/payment/fail]
```

1. **코드 입력** (`/`): 전달받은 입장 코드를 입력. `POST /api/verify-code` 가 코드를
   검증하고 1시간짜리 서명 쿠키(`mt_gate`)를 발급.
2. **상품 선택**: 플러스/프로 12개월 이용권 카드 노출.
3. **결제 정보 입력**: 이름/기관명·이메일 입력 후 `requestBillingAuth()` 로 토스 결제창 호출.
4. **결제 승인** (`/payment/success`): 토스가 돌려준 `authKey`·`customerKey` 로
   `POST /api/confirm` 호출 → 서버에서 **빌링키 발급 → 실제 결제 승인** 처리.

> 결제 금액은 클라이언트 값을 신뢰하지 않고, 서버가 `planId` 로 카탈로그(`src/lib/products.ts`)에서
> 직접 결정합니다. 결제 API 는 입장 쿠키가 유효할 때만 동작합니다.

## 토스페이먼츠 빌링 결제 연동

| 단계 | 위치 | API |
| --- | --- | --- |
| 카드 인증 | `src/components/Checkout.tsx` | SDK `payment.requestBillingAuth({ method: "CARD" })` |
| 빌링키 발급 | `src/lib/toss.ts` | `POST /v1/billing/authorizations/issue` |
| 결제 승인(charge) | `src/lib/toss.ts` | `POST /v1/billing/{billingKey}` |

시크릿 키는 서버에서만 사용하며 `Authorization: Basic base64("{시크릿키}:")` 헤더로 인증합니다.

## 환경변수

`.env.example` 을 복사해 `.env.local` 을 만들고 값을 채우세요.

```bash
cp .env.example .env.local
```

| 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 클라이언트 키 (브라우저 노출). 자동결제 계약된 키여야 함 |
| `TOSS_SECRET_KEY` | 토스 시크릿 키 (**서버 전용, 절대 노출 금지**). 위 클라이언트 키와 매칭되는 키 |
| `ACCESS_CODE` | 입장 코드. 콤마(`,`)로 여러 개 등록 가능 |
| `SESSION_SECRET` | 입장 세션 쿠키 서명용 무작위 문자열 (`openssl rand -hex 32`) |

> ⚠️ **모든 키/코드는 `.env.local` (git 추적 제외)에만 설정하세요.**
> 클라이언트 키와 시크릿 키는 토스 개발자센터 > API 키에서 **같은 상점(MID)** 의
> 매칭되는 한 쌍을 사용해야 하며, 시크릿 키는 절대 저장소에 커밋하지 마세요.

## 개발 / 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
```

### 테스트 키로 안전하게 검증하기

실제 결제 없이 흐름을 확인하려면 `.env.local` 의 두 키를 토스 **테스트 키**로 바꾸세요.

```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
```

테스트 결제창에서는 본인인증 번호로 `000000` 을 입력하면 됩니다.

## 배포 (Vercel)

1. 이 디렉토리를 Git 저장소로 만들고 Vercel 프로젝트에 연결.
2. Vercel 프로젝트 설정 > Environment Variables 에 위 4개 변수를 등록.
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`, `ACCESS_CODE`, `SESSION_SECRET`
3. 배포. (`successUrl`/`failUrl` 은 배포 도메인 기준으로 자동 생성됩니다.)

## 참고/주의

- 결제 내역은 **토스페이먼츠 대시보드** 와 서버 로그(`[payment] success` 등)로 확인합니다.
  (별도 DB 연동 없음 — 독립형)
- 토스 자동결제는 정기 구독형 서비스 대상으로 **추가 계약**이 필요합니다.
  본 페이지는 발급한 빌링키로 12개월 이용권 금액을 **1회 결제**합니다.
- 본 결제창은 결제까지만 담당합니다. 결제 후 기관 사용자에게 이용권을 부여하는
  프로비저닝(계정 생성/권한 부여)은 별도 작업이 필요합니다.
