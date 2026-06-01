/**
 * 기관 전용 결제 상품 카탈로그.
 *
 * 결제 금액은 서버에서 이 카탈로그를 기준으로 결정합니다.
 * (클라이언트가 보낸 금액을 신뢰하지 않고, planId 로만 금액을 조회)
 */

export type PlanId = "plus" | "pro" | "hyangdong";

export interface Product {
  /** 결제 식별자 (URL/주문번호에 사용) */
  id: PlanId;
  /** 화면에 표시되는 짧은 이름 */
  name: string;
  /** 토스 결제내역에 표시되는 주문명 */
  orderName: string;
  /** 결제 금액 (원, KRW) */
  amount: number;
  /** 이용 기간 라벨 */
  period: string;
  /** 한 줄 소개 */
  tagline: string;
  /** 주요 제공 내역 */
  features: string[];
  /** 추천(강조) 표시 여부 */
  highlight?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "plus",
    name: "플러스 플랜",
    orderName: "마음토스 플러스 플랜 12개월 이용권",
    amount: 300_000,
    period: "12개월",
    tagline: "효율적으로 축어록을 쓰는 분들에게 가장 합리적인 플랜이에요.",
    features: [
      "음성 변환 월 2,000분",
      "AI 상담 요약 월 200회",
      "AI 상담노트 무제한",
      "12개월 정기 이용권",
    ],
  },
  {
    id: "pro",
    name: "프로 플랜",
    orderName: "마음토스 프로 플랜 12개월 이용권",
    amount: 500_000,
    period: "12개월",
    tagline: "상담량이 많은 상담사를 위한 대용량 플랜이에요.",
    features: [
      "음성 변환 월 5,000분",
      "AI 상담 요약 월 1,000회",
      "AI 상담노트 무제한",
      "12개월 정기 이용권",
    ],
    highlight: true,
  },
];

/**
 * 기관 맞춤형(전용 링크) 상품.
 *
 * 홈 화면(`PRODUCTS`)에는 노출하지 않고, 해당 기관 전용 페이지에서만 사용합니다.
 * 결제 금액은 일반 상품과 동일하게 서버에서 이 카탈로그를 기준으로 결정해요.
 */
export const INSTITUTION_PRODUCTS: Product[] = [
  {
    id: "hyangdong",
    name: "향동고등학교",
    orderName: "마음토스 기관 이용권",
    amount: 180_000,
    period: "",
    tagline: "향동고등학교 전용 결제 링크예요.",
    features: ["AI 상담노트 무제한"],
  },
];

/** 향동고등학교 전용 상품 (전용 페이지에서 사용) */
export const HYANGDONG_PRODUCT = INSTITUTION_PRODUCTS[0];

/** 전용 상품을 포함한 전체 카탈로그 (서버 금액 조회용) */
const ALL_PRODUCTS: Product[] = [...PRODUCTS, ...INSTITUTION_PRODUCTS];

export function getProduct(id: string): Product | null {
  return ALL_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** 부가가치세율 (10%) */
export const VAT_RATE = 0.1;

/** 부가세 포함 총 결제 금액 (실제 청구 금액) */
export function vatIncludedAmount(supplyAmount: number): number {
  return Math.round(supplyAmount * (1 + VAT_RATE));
}

/** 부가세 금액 */
export function vatAmount(supplyAmount: number): number {
  return vatIncludedAmount(supplyAmount) - supplyAmount;
}

export function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}
