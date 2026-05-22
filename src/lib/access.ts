/**
 * 입장 코드(패스워드) 검증 + 입장 세션 쿠키 발급/검증.
 *
 * 입장 코드가 맞으면 HMAC 서명된 짧은 만료의 쿠키를 발급하고,
 * 결제 승인 API(/api/confirm)는 이 쿠키가 유효할 때만 동작합니다.
 * (게이트를 건너뛰고 결제 API 를 직접 호출하는 것을 방지)
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const GATE_COOKIE = "mt_gate";
const GATE_TTL_MS = 60 * 60 * 1000; // 1시간

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET 환경변수가 설정되어 있지 않아요.");
  }
  return secret;
}

/** 입장 코드 검증 (콤마로 여러 코드 등록 가능, 상수시간 비교) */
export function verifyAccessCode(input: string): boolean {
  const raw = process.env.ACCESS_CODE;
  if (!raw) return false;

  const candidate = input.trim();
  if (!candidate) return false;

  const codes = raw
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  let matched = false;
  for (const code of codes) {
    // 길이가 달라도 timingSafeEqual 이 throw 하지 않도록 동일 길이 버퍼로 비교
    const a = Buffer.from(code);
    const b = Buffer.from(candidate);
    const max = Math.max(a.length, b.length, 1);
    const pa = Buffer.alloc(max);
    const pb = Buffer.alloc(max);
    a.copy(pa);
    b.copy(pb);
    if (a.length === b.length && timingSafeEqual(pa, pb)) {
      matched = true;
    }
  }
  return matched;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

/** 입장 세션 토큰 생성 (payload.signature 형태) */
export function createGateToken(): string {
  const exp = Date.now() + GATE_TTL_MS;
  const payload = Buffer.from(`granted:${exp}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** 입장 세션 토큰 검증 */
export function verifyGateToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const [tag, expStr] = decoded.split(":");
    if (tag !== "granted") return false;
    const exp = Number(expStr);
    return Number.isFinite(exp) && exp > Date.now();
  } catch {
    return false;
  }
}

/** 쿠키 설정에 쓸 옵션 */
export function gateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: GATE_TTL_MS / 1000,
  };
}
