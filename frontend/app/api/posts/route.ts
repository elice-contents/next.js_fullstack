// app/api/posts/route.ts — Route Handler (Next.js 내장 API 엔드포인트)
//
// 역할: 브라우저 → Next.js(/api/posts) → FastAPI 흐름의 중간 서버
//
// 브라우저가 FastAPI를 직접 호출하는 대신 이 파일이 대신 호출함
// → FASTAPI_URL(접두사 없음)을 서버에서만 사용하므로 브라우저에 노출되지 않음
// → NEXT_PUBLIC_FASTAPI_URL 환경변수가 더 이상 필요 없어짐

// ─── [실습 3: 검색 기능 고도화하기] 브라우저에서 받은 q 파라미터를 FastAPI로 전달 ─
// GET(request: Request) → Next.js가 자동으로 현재 요청 객체를 인자로 주입
export async function GET(request: Request) {
  // new URL(request.url): 문자열 URL을 파싱 가능한 URL 객체로 변환
  // searchParams: URL의 쿼리 파라미터 전체를 담은 객체
  // .get("q"): ?q=검색어 에서 검색어 추출, 없으면 null 반환
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  // q가 있으면 FastAPI에 ?q=검색어 를 붙여 전달
  // q가 없으면 기존과 동일하게 /posts 만 호출
  const url = q
    ? `${process.env.FASTAPI_URL}/posts?q=${encodeURIComponent(q)}`
    : `${process.env.FASTAPI_URL}/posts`;
  // encodeURIComponent: 검색어에 한글·공백·특수문자가 포함된 경우 URL 안전한 형태로 인코딩
  // 예) "Next.js 입문" → "Next.js%20%EC%9E%85%EB%AC%B8"

  const res = await fetch(url);

  if (!res.ok) {
    return Response.json(
      { detail: "게시글 목록을 불러오는 데 실패했습니다" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return Response.json(data);
}
