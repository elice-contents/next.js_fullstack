// app/api/posts/route.ts — Route Handler (Next.js 내장 API 엔드포인트)
//
// 브라우저 → Next.js(/api/posts) → FastAPI 흐름의 중간 서버
// FastAPI URL이 브라우저에 노출되지 않도록 서버에서 대신 호출함

export async function GET() {
  const res = await fetch(`${process.env.FASTAPI_URL}/posts`);

  if (!res.ok) {
    return Response.json(
      { detail: "게시글 목록을 불러오는 데 실패했습니다" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return Response.json(data);
}
