// app/api/search/route.ts — Route Handler
//
// [실습 1] Route Handler 방식
//   흐름: 브라우저 → GET /api/search (이 파일) → FastAPI
//
//   브라우저가 /api/search 로 요청하면, 이 서버 사이드 핸들러가
//   FastAPI 를 대신 호출하고 결과를 브라우저에 반환합니다.
//   → 브라우저 입장에서는 같은 서버(Next.js)와만 통신 → CORS 불필요

import { NextResponse } from "next/server";

export async function GET() {
  // FASTAPI_URL 은 서버 사이드 환경 변수 (.env.local)
  // 서버에서 실행되므로 NEXT_PUBLIC_ 접두사 없어도 접근 가능
  const fastapiUrl = process.env.FASTAPI_URL;

  if (!fastapiUrl) {
    return NextResponse.json(
      { error: "FASTAPI_URL 환경 변수가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  // Route Handler → FastAPI 호출
  const res = await fetch(`${fastapiUrl}/posts`);

  if (!res.ok) {
    return NextResponse.json(
      { error: "게시글을 불러오는 데 실패했습니다" },
      { status: res.status }
    );
  }

  const data = await res.json();

  // FastAPI 응답을 그대로 브라우저에 전달
  return NextResponse.json(data);
}
