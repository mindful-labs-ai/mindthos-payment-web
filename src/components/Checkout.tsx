"use client";

import { useState } from "react";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

import { BrandHeader } from "./Brand";
import {
  type Product,
  formatKRW,
  vatAmount,
  vatIncludedAmount,
} from "@/lib/products";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

/** sessionStorage 에 임시 보관할 결제 컨텍스트 (리다이렉트 후 success 페이지에서 사용) */
export interface PendingCheckout {
  planId: string;
  orderId: string;
  customerKey: string;
  customerName: string;
  customerEmail: string;
}

export const PENDING_KEY = "mt_pending_checkout";

function makeCustomerKey(): string {
  // 충분히 무작위적인 고유 값 (토스 권장: UUID)
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `mt_${uuid}`;
}

function makeOrderId(planId: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `MT-${planId}-${Date.now()}-${rand}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function Checkout({
  product,
  onBack,
}: {
  product: Product;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 && isValidEmail(email.trim()) && agree && !loading;

  async function handlePay() {
    setError(null);

    if (!CLIENT_KEY) {
      setError("결제 설정이 올바르지 않아요. (클라이언트 키 누락)");
      return;
    }
    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("올바른 이메일을 입력해 주세요.");
      return;
    }
    if (!agree) {
      setError("결제 진행에 동의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const customerKey = makeCustomerKey();
      const orderId = makeOrderId(product.id);
      const customerName = name.trim();
      const customerEmail = email.trim();

      const pending: PendingCheckout = {
        planId: product.id,
        orderId,
        customerKey,
        customerName,
        customerEmail,
      };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey });

      const successUrl = new URL("/payment/success", window.location.origin);
      successUrl.searchParams.set("planId", product.id);
      successUrl.searchParams.set("orderId", orderId);

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: successUrl.toString(),
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail,
        customerName,
      });
      // requestBillingAuth 는 결제창으로 리다이렉트되므로 이후 코드는 실행되지 않습니다.
    } catch (err) {
      // 사용자가 결제창을 닫는 등의 경우
      const message =
        err instanceof Error ? err.message : "결제를 시작하지 못했어요.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <BrandHeader />

      <div className="mt-6 rounded-2xl border border-[color:var(--color-line)] bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[color:var(--color-ink-muted)] transition hover:text-[color:var(--color-ink)] disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          상품 다시 선택
        </button>

        {/* 주문 요약 */}
        <div className="rounded-xl bg-primary-50 p-4">
          <p className="text-sm font-medium text-primary-700">
            {product.name} · {product.period}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-ink-muted)]">
            {product.orderName}
          </p>
          <div className="mt-3 flex flex-col gap-1.5 border-t border-primary-100 pt-3">
            <div className="flex items-center justify-between text-sm text-[color:var(--color-ink-muted)]">
              <span>공급가액</span>
              <span>{formatKRW(product.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-[color:var(--color-ink-muted)]">
              <span>부가세 (10%)</span>
              <span>{formatKRW(vatAmount(product.amount))}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-primary-100 pt-2">
              <span className="text-sm font-medium text-[color:var(--color-ink)]">
                총 결제 금액
              </span>
              <span className="text-2xl font-bold text-primary-600">
                {formatKRW(vatIncludedAmount(product.amount))}
              </span>
            </div>
          </div>
        </div>

        {/* 구매자 정보 */}
        <div className="mt-5 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">이름 / 기관명</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="결제자 이름 또는 기관명"
              autoComplete="name"
              className="w-full rounded-xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-base outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="결제내역(영수증)을 받을 이메일"
              autoComplete="email"
              inputMode="email"
              className="w-full rounded-xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-base outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>

        <label className="mt-4 flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[color:var(--color-primary-500)]"
          />
          <span className="text-sm text-[color:var(--color-ink-muted)]">
            결제 진행 및 카드 정보 제공에 동의합니다. 결제 시 입력한 카드로
            이용권 금액이 즉시 결제됩니다.
          </span>
        </label>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handlePay}
          disabled={!canSubmit}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />
          ) : null}
          {loading
            ? "결제창 여는 중..."
            : `${formatKRW(vatIncludedAmount(product.amount))} 결제하기`}
        </button>

        <p className="mt-3 text-center text-xs text-[color:var(--color-ink-muted)]">
          토스페이먼츠로 안전하게 결제됩니다.
        </p>
      </div>
    </div>
  );
}
