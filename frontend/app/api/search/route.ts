// app/api/search/route.ts — Route Handler
//
// [실습 3] 검색 기능 고도화
//   흐름: 브라우저 → GET /api/search?q=검색어 → FastAPI?q=검색어
//
//   브라우저가 q 쿼리 파라미터를 포함해 요청하면,
//   이 핸들러가 동일한 q를 FastAPI로 전달하여 서버사이드 필터링을 수행합니다.

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const fastapiUrl = process.env.FASTAPI_URL;

  if (!fastapiUrl) {
    return NextResponse.json(
      { error: "FASTAPI_URL 환경 변수가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  // 브라우저 요청에서 q 쿼리 파라미터 파싱
  const q = request.nextUrl.searchParams.get("q");

  // q 유무에 따라 FastAPI 호출 URL 분기
  // encodeURIComponent: 한글·특수문자·공백이 포함된 검색어를 안전하게 인코딩
  const url = q
    ? `${fastapiUrl}/posts?q=${encodeURIComponent(q)}`
    : `${fastapiUrl}/posts`;

  const res = await fetch(url);

  if (!res.ok) {
    return NextResponse.json(
      { error: "게시글을 불러오는 데 실패했습니다" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
