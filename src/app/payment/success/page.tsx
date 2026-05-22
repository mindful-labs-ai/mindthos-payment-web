"use client";

import { useEffect, useRef, useState } from "react";

import { BrandHeader } from "@/components/Brand";
import { PENDING_KEY, type PendingCheckout } from "@/components/Checkout";
import { formatKRW } from "@/lib/products";

type Phase = "processing" | "done" | "error";

interface PaymentResult {
  orderId: string;
  orderName: string;
  amount: number;
  approvedAt: string;
  method: string;
  receiptUrl?: string;
}

export default function PaymentSuccessPage() {
  const [phase, setPhase] = useState<Phase>("processing");
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function confirm() {
      const params = new URLSearchParams(window.location.search);
      const customerKey = params.get("customerKey");
      const authKey = params.get("authKey");
      const planId = params.get("planId");
      const orderId = params.get("orderId");

      // 구매자 정보 (리다이렉트 전에 저장해 둔 값)
      let pending: PendingCheckout | null = null;
      try {
        const raw = sessionStorage.getItem(PENDING_KEY);
        if (raw) pending = JSON.parse(raw) as PendingCheckout;
      } catch {
        // ignore
      }

      if (!customerKey || !authKey || !planId || !orderId) {
        setErrorMsg("결제 정보가 누락됐어요. 처음부터 다시 시도해 주세요.");
        setPhase("error");
        return;
      }

      try {
        const res = await fetch("/api/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerKey,
            authKey,
            planId,
            orderId,
            customerName: pending?.customerName,
            customerEmail: pending?.customerEmail,
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          payment?: PaymentResult;
          message?: string;
        };

        if (res.ok && data.ok && data.payment) {
          sessionStorage.removeItem(PENDING_KEY);
          setResult(data.payment);
          setPhase("done");
        } else {
          setErrorMsg(data.message ?? "결제를 완료하지 못했어요.");
          setPhase("error");
        }
      } catch {
        setErrorMsg("결제 처리 중 네트워크 오류가 발생했어요.");
        setPhase("error");
      }
    }

    confirm();
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <BrandHeader />

        <div className="mt-6 rounded-2xl border border-[color:var(--color-line)] bg-white p-7 text-center shadow-sm">
          {phase === "processing" ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <span className="h-10 w-10 animate-spin-slow rounded-full border-4 border-primary-100 border-t-primary-500" />
              <div>
                <h1 className="text-lg font-semibold">결제를 처리하고 있어요</h1>
                <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
                  잠시만 기다려 주세요. 창을 닫지 말아 주세요.
                </p>
              </div>
            </div>
          ) : null}

          {phase === "done" && result ? (
            <div className="flex flex-col items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <svg
                  className="h-8 w-8 text-primary-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>

              <div>
                <h1 className="text-xl font-bold">결제가 완료됐어요</h1>
                <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
                  마음토스 이용권 결제가 정상 처리됐어요.
                </p>
              </div>

              <dl className="mt-2 w-full rounded-xl bg-[color:var(--color-canvas)] p-4 text-sm">
                <Row label="상품" value={result.orderName} />
                <Row label="결제 금액" value={formatKRW(result.amount)} strong />
                <Row label="결제 수단" value={result.method} />
                <Row label="주문번호" value={result.orderId} mono />
                <Row
                  label="결제 일시"
                  value={new Date(result.approvedAt).toLocaleString("ko-KR")}
                />
              </dl>

              {result.receiptUrl ? (
                <a
                  href={result.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl border border-[color:var(--color-line)] px-4 py-3 text-sm font-semibold text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-canvas)]"
                >
                  영수증 보기
                </a>
              ) : null}

              <p className="text-xs text-[color:var(--color-ink-muted)]">
                결제내역은 입력하신 이메일로도 전송됩니다.
              </p>
            </div>
          ) : null}

          {phase === "error" ? (
            <div className="flex flex-col items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <svg
                  className="h-8 w-8 text-red-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </span>
              <div>
                <h1 className="text-lg font-semibold">결제를 완료하지 못했어요</h1>
                <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
                  {errorMsg}
                </p>
              </div>
              <a
                href="/"
                className="w-full rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
              >
                처음으로 돌아가기
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-[color:var(--color-ink-muted)]">{label}</dt>
      <dd
        className={`text-right ${strong ? "font-bold text-primary-600" : ""} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
