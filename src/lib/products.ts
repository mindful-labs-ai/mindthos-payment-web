/**
 * 기관 전용 결제 상품 카탈로그.
 *
 * 결제 금액은 서버에서 이 카탈로그를 기준으로 결정합니다.
 * (클라이언트가 보낸 금액을 신뢰하지 않고, planId 로만 금액을 조회)
 */

export type PlanId = "plus" | "pro";

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

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}
