"use client";

import { useEffect, useState } from "react";

import { BrandHeader } from "@/components/Brand";

export default function PaymentFailPage() {
  const [message, setMessage] = useState("결제가 취소되었거나 실패했어요.");
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("message");
    const c = params.get("code");
    if (msg) setMessage(msg);
    if (c) setCode(c);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <BrandHeader />

        <div className="mt-6 rounded-2xl border border-[color:var(--color-line)] bg-white p-7 text-center shadow-sm">
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
              <h1 className="text-lg font-semibold">결제를 진행하지 못했어요</h1>
              <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
                {message}
              </p>
              {code ? (
                <p className="mt-1 font-mono text-xs text-[color:var(--color-ink-muted)]">
                  ({code})
                </p>
              ) : null}
            </div>

            <a
              href="/"
              className="w-full rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              다시 시도하기
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
