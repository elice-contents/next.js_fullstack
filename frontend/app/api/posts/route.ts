// app/api/posts/route.ts — Route Handler (Next.js 내장 API 엔드포인트)
//
// 역할: 브라우저 → Next.js(/api/posts) → FastAPI 흐름의 중간 서버
//
// 브라우저가 FastAPI를 직접 호출하는 대신 이 파일이 대신 호출함
// → FASTAPI_URL(접두사 없음)을 서버에서만 사용하므로 브라우저에 노출되지 않음
// → NEXT_PUBLIC_FASTAPI_URL 환경변수가 더 이상 필요 없어짐

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
