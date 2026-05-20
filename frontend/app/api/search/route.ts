// app/api/search/route.ts — Route Handler
//
// [실습 2 완성] 항상 전체 목록을 반환하는 Route Handler
//   흐름: 브라우저 → GET /api/search → FastAPI /posts (전체)
//
// [실습 3] TODO: 브라우저의 q 쿼리 파라미터를 FastAPI로 전달해보세요.
//
//   1. GET() 의 인자로 request: NextRequest 를 추가하세요.
//      → import { NextRequest, NextResponse } from "next/server"
//
//   2. request.nextUrl.searchParams.get("q") 로 검색어를 파싱하세요.
//
//   3. q 유무에 따라 FastAPI 호출 URL을 분기하세요.
//      → q 있음: `${fastapiUrl}/posts?q=${encodeURIComponent(q)}`
//      → q 없음: `${fastapiUrl}/posts`
//      (encodeURIComponent: 한글·공백·특수문자를 안전하게 인코딩)
//
//   4. 완성 후 아래 기존 fetch 라인을 교체하세요.

import { NextResponse } from "next/server";

export async function GET() {
  const fastapiUrl = process.env.FASTAPI_URL;

  if (!fastapiUrl) {
    return NextResponse.json(
      { error: "FASTAPI_URL 환경 변수가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  const res = await fetch(`${fastapiUrl}/posts`);

  if (!res.ok) {
    return NextResponse.json(
      { error: "게시글을 불러오는 데 실패했습니다" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
