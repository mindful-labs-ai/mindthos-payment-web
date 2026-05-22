/**
 * 토스페이먼츠 자동결제(빌링) 서버 연동 헬퍼.
 *
 * 흐름 (mindthos-web 의 기존 빌링 결제와 동일한 원리):
 *   1) 클라이언트 SDK 의 requestBillingAuth() 로 카드 인증 → authKey 획득
 *   2) issueBillingKey(authKey, customerKey) → billingKey 발급
 *   3) approveBillingPayment(billingKey, ...) → 실제 결제 승인(charge)
 *
 * 시크릿 키는 서버에서만 사용하며, Basic base64("{secretKey}:") 헤더로 인증합니다.
 * @see https://docs.tosspayments.com/guides/v2/billing/integration
 */

const TOSS_API_BASE = "https://api.tosspayments.com";

export class TossApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "TossApiError";
    this.code = code;
    this.status = status;
  }
}

function getSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new TossApiError(
      "CONFIG_ERROR",
      "TOSS_SECRET_KEY 환경변수가 설정되어 있지 않아요.",
      500
    );
  }
  return secretKey;
}

function authHeader(): string {
  // 시크릿 키 뒤에 콜론(:)을 붙이고 base64 인코딩 — 토스 Basic 인증 규약
  const encoded = Buffer.from(`${getSecretKey()}:`).toString("base64");
  return `Basic ${encoded}`;
}

async function parseError(res: Response): Promise<TossApiError> {
  let code = "UNKNOWN_ERROR";
  let message = "결제 처리 중 오류가 발생했어요.";
  try {
    const data = (await res.json()) as { code?: string; message?: string };
    if (data.code) code = data.code;
    if (data.message) message = data.message;
  } catch {
    // 응답 본문이 JSON 이 아닐 수 있음
  }
  return new TossApiError(code, message, res.status);
}

export interface IssueBillingKeyParams {
  authKey: string;
  customerKey: string;
}

export interface BillingKeyResult {
  billingKey: string;
  cardCompany?: string;
  cardNumber?: string;
}

/** authKey + customerKey 로 빌링키 발급 (POST /v1/billing/authorizations/issue) */
export async function issueBillingKey(
  params: IssueBillingKeyParams
): Promise<BillingKeyResult> {
  const res = await fetch(
    `${TOSS_API_BASE}/v1/billing/authorizations/issue`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authKey: params.authKey,
        customerKey: params.customerKey,
      }),
    }
  );

  if (!res.ok) throw await parseError(res);

  const data = (await res.json()) as {
    billingKey: string;
    cardCompany?: string;
    cardNumber?: string;
    card?: { number?: string };
  };

  return {
    billingKey: data.billingKey,
    cardCompany: data.cardCompany,
    cardNumber: data.cardNumber ?? data.card?.number,
  };
}

export interface ApproveBillingParams {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
}

export interface PaymentResult {
  orderId: string;
  orderName: string;
  amount: number;
  status: string;
  approvedAt: string;
  method: string;
  cardCompany?: string;
  receiptUrl?: string;
}

/** 빌링키로 자동결제 승인 — 실제 결제 (POST /v1/billing/{billingKey}) */
export async function approveBillingPayment(
  params: ApproveBillingParams
): Promise<PaymentResult> {
  const res = await fetch(
    `${TOSS_API_BASE}/v1/billing/${encodeURIComponent(params.billingKey)}`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        // 동일 주문번호 중복 결제 방지
        "Idempotency-Key": params.orderId,
      },
      body: JSON.stringify({
        customerKey: params.customerKey,
        amount: params.amount,
        orderId: params.orderId,
        orderName: params.orderName,
        ...(params.customerName ? { customerName: params.customerName } : {}),
        ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}),
      }),
    }
  );

  if (!res.ok) throw await parseError(res);

  const data = (await res.json()) as {
    orderId: string;
    orderName: string;
    totalAmount: number;
    status: string;
    approvedAt: string;
    method: string;
    card?: { issuerCode?: string };
    receipt?: { url?: string };
  };

  return {
    orderId: data.orderId,
    orderName: data.orderName,
    amount: data.totalAmount,
    status: data.status,
    approvedAt: data.approvedAt,
    method: data.method,
    receiptUrl: data.receipt?.url,
  };
}
