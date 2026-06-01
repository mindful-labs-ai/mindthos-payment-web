"use client";

import { useState } from "react";

import { CodeGate } from "@/components/CodeGate";
import { Checkout } from "@/components/Checkout";
import { HYANGDONG_PRODUCT } from "@/lib/products";

/**
 * 향동고등학교 전용 결제 페이지.
 *
 * 입장 코드는 메인 결제 페이지와 동일하게 사용하고,
 * 코드를 통과하면 상품 선택 없이 향동고등학교 전용 상품의 결제 화면으로 바로 이동해요.
 */
export default function HyangdongPage() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      {!unlocked ? (
        <CodeGate onUnlock={() => setUnlocked(true)} />
      ) : (
        <Checkout product={HYANGDONG_PRODUCT} />
      )}
    </main>
  );
}
