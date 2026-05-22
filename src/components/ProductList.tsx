"use client";

import { BrandHeader } from "./Brand";
import { type Product, formatKRW } from "@/lib/products";

export function ProductList({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  return (
    <div className="w-full max-w-md animate-fade-in">
      <BrandHeader />

      <div className="mt-7 text-center">
        <h1 className="text-lg font-semibold">이용권을 선택해 주세요</h1>
        <p className="mt-1.5 text-sm text-[color:var(--color-ink-muted)]">
          마음토스 12개월 이용권이에요.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product)}
            className={`group relative flex flex-col gap-4 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
              product.highlight
                ? "border-primary-300 ring-1 ring-primary-100"
                : "border-[color:var(--color-line)]"
            }`}
          >
            {product.highlight ? (
              <span className="absolute -top-2.5 right-5 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                추천
              </span>
            ) : null}

            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-base font-semibold">{product.name}</p>
                <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">
                  {product.period} 이용권
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-600">
                  {formatKRW(product.amount)}
                </p>
                <p className="mt-0.5 text-xs text-[color:var(--color-ink-muted)]">
                  부가세 별도
                </p>
              </div>
            </div>

            <p className="text-sm text-[color:var(--color-ink-muted)]">
              {product.tagline}
            </p>

            <ul className="flex flex-col gap-1.5">
              {product.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-[color:var(--color-ink)]"
                >
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <span className="mt-1 inline-flex items-center justify-center rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-700 transition group-hover:bg-primary-100">
              이 상품 결제하기
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-primary-500"
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
  );
}
