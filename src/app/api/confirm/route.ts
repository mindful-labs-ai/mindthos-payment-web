import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { GATE_COOKIE, verifyGateToken } from "@/lib/access";
import { getProduct, vatIncludedAmount } from "@/lib/products";
import {
  TossApiError,
  approveBillingPayment,
  issueBillingKey,
} from "@/lib/toss";

export const runtime = "nodejs";

interface ConfirmBody {
  authKey?: string;
  customerKey?: string;
  planId?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
}

const ORDER_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

export async function POST(request: Request) {
  // 1) 입장 세션 확인 — 게이트를 통과한 요청만 결제 가능
  const cookieStore = await cookies();
  if (!verifyGateToken(cookieStore.get(GATE_COOKIE)?.value)) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "입장 코드 인증이 필요해요." },
      { status: 401 }
    );
  }

  // 2) 입력 파싱/검증
  let body: ConfirmBody;
  try {
    body = (await request.json()) as ConfirmBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "잘못된 요청이에요." },
      { status: 400 }
    );
  }

  const { authKey, customerKey, planId, orderId, customerName, customerEmail } =
    body;

  if (!authKey || !customerKey || !planId || !orderId) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "결제 정보가 누락됐어요." },
      { status: 400 }
    );
  }

  if (!ORDER_ID_RE.test(orderId)) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "주문번호 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }

  // 3) 금액은 클라이언트가 아니라 서버 카탈로그에서 결정 (위변조 방지)
  const product = getProduct(planId);
  if (!product) {
    return NextResponse.json(
      { ok: false, code: "BAD_REQUEST", message: "존재하지 않는 상품이에요." },
      { status: 400 }
    );
  }

  try {
    // 4) 빌링키 발급
    const { billingKey } = await issueBillingKey({ authKey, customerKey });

    // 5) 빌링키로 실제 결제 승인 (부가세 포함 금액으로 청구)
    const chargeAmount = vatIncludedAmount(product.amount);
    const payment = await approveBillingPayment({
      billingKey,
      customerKey,
      amount: chargeAmount,
      orderId,
      orderName: product.orderName,
      customerName,
      customerEmail,
    });

    // 6) 결제내역 로그 (독립형 — 토스 대시보드 + 서버 로그로 확인)
    console.info("[payment] success", {
      orderId: payment.orderId,
      orderName: payment.orderName,
      amount: payment.amount,
      planId,
      customerEmail,
      approvedAt: payment.approvedAt,
    });

    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    if (error instanceof TossApiError) {
      console.error("[payment] toss error", {
        orderId,
        planId,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }

    console.error("[payment] unexpected error", error);
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: "결제 처리 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
