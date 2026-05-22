"use client";

import { useState } from "react";

import { CodeGate } from "@/components/CodeGate";
import { ProductList } from "@/components/ProductList";
import { Checkout } from "@/components/Checkout";
import { PRODUCTS, type Product } from "@/lib/products";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      {!unlocked ? (
        <CodeGate onUnlock={() => setUnlocked(true)} />
      ) : !selected ? (
        <ProductList products={PRODUCTS} onSelect={setSelected} />
      ) : (
        <Checkout product={selected} onBack={() => setSelected(null)} />
      )}
    </main>
  );
}
