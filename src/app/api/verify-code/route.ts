import { NextResponse } from "next/server";

import {
  GATE_COOKIE,
  createGateToken,
  gateCookieOptions,
  verifyAccessCode,
} from "@/lib/access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let code = "";
  try {
    const body = (await request.json()) as { code?: string };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json(
      { ok: false, message: "잘못된 요청이에요." },
      { status: 400 }
    );
  }

  if (!verifyAccessCode(code)) {
    // 무차별 대입 속도를 늦추기 위한 약간의 지연
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { ok: false, message: "코드가 올바르지 않아요." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, createGateToken(), gateCookieOptions());
  return res;
}
