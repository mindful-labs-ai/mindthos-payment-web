"use client";

import { useState } from "react";

import { BrandHeader } from "./Brand";

export function CodeGate({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (res.ok && data.ok) {
        onUnlock();
      } else {
        setError(data.message ?? "코드가 올바르지 않아요.");
      }
    } catch {
      setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="rounded-2xl border border-[color:var(--color-line)] bg-white p-7 shadow-sm">
        <BrandHeader />

        <div className="mt-7 text-center">
          <h1 className="text-lg font-semibold">코드를 입력해 주세요</h1>
          <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
            전달받은 입장 코드를 입력하면
            <br />
            결제 상품을 확인할 수 있어요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            inputMode="text"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="입장 코드"
            aria-label="입장 코드"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-center text-base tracking-wide outline-none transition focus:ring-2 ${
              error
                ? "animate-shake border-red-300 focus:ring-red-200"
                : "border-[color:var(--color-line)] focus:border-primary-400 focus:ring-primary-100"
            }`}
          />

          {error ? (
            <p className="text-center text-sm text-red-500">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-white/40 border-t-white" />
            ) : null}
            {loading ? "확인 중..." : "확인"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-[color:var(--color-ink-muted)]">
        코드를 받지 못하셨다면 담당자에게 문의해 주세요.
      </p>
    </div>
  );
}
