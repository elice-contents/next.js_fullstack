// app/search/page.tsx — 게시글 검색 (Client Component)

// ✅ "use client" 선언 — 이 컴포넌트는 브라우저에서 실행됨
//    useState·useEffect 같은 React 훅과 이벤트 핸들러를 사용하려면 반드시 필요
//    Server Component(기본값)에서는 이 훅들을 쓸 수 없음
"use client";

import { useState, useEffect } from "react";

// ─── axios import ─────────────────────────────────────
// axios: fetch보다 간결한 HTTP 클라이언트 라이브러리
// fetch는 브라우저 내장이라 import 불필요하지만,
// axios는 별도 패키지이므로 반드시 import 필요 (npm install axios)
import axios from "axios";
import Link from "next/link";

// ─── 타입 정의 ───────────────────────────────────────────
// FastAPI /posts 응답의 각 게시글 객체 형태
type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function SearchPage() {
  // ─── 상태 4개 선언 ────────────────────────────────────
  // useState<타입>(초기값) 형태로 선언
  const [query, setQuery] = useState("");              // 검색어 입력값
  const [results, setResults] = useState<Post[]>([]);  // fetch한 전체 게시글 목록
  const [loading, setLoading] = useState(false);       // API 요청 진행 여부
  const [error, setError] = useState<string | null>(null); // 에러 메시지 (없으면 null)

  // ─── 데이터 fetch ─────────────────────────────────────
  useEffect(() => {
    // useEffect 안에서 async 함수를 별도로 정의한 뒤 즉시 호출하는 패턴
    // ※ useEffect의 콜백 자체를 async로 선언하면 안 됨 (cleanup 반환값과 충돌)
    async function fetchPosts() {
      setLoading(true);   // 요청 시작 → 로딩 상태 ON
      setError(null);     // 이전 에러 초기화

      try {
        // ─── [fetch] 직접 호출 방식 (NEXT_PUBLIC_ 환경변수 필요) ──
        // 브라우저가 FastAPI 서버를 직접 호출
        // NEXT_PUBLIC_ 접두사 덕분에 빌드 시 번들에 포함되어 브라우저에서도 접근 가능
        // (접두사 없는 FASTAPI_URL은 서버 측에서만 유효 → 여기선 undefined가 됨)
        // const base = process.env.NEXT_PUBLIC_FASTAPI_URL;
        // const res = await fetch(`${base}/posts`);

        // ─── [fetch] Route Handler 방식 (NEXT_PUBLIC_ 환경변수 불필요) ─
        // 브라우저가 Next.js Route Handler(/api/posts)를 호출
        // Route Handler가 서버에서 FastAPI를 대신 호출하므로
        // FastAPI URL이 브라우저에 노출되지 않음
        // const res = await fetch("/api/posts");

        // ─── [fetch] HTTP 에러 수동 처리 ─────────────────────────
        // fetch는 네트워크 오류만 throw하고, 4xx·5xx는 정상 응답으로 간주함
        // → res.ok를 직접 확인해서 에러를 수동으로 throw해야 함
        // if (!res.ok) {
        //   throw new Error("게시글 목록을 불러오는 데 실패했습니다");
        // }
        // const data: Post[] = await res.json();
        // setResults(data);

        // ─── [axios] Route Handler 방식 ──────────────────────────
        // axios.get<타입>(URL) → 응답 데이터가 res.data에 바로 담김
        // fetch처럼 res.json()을 별도로 호출할 필요 없음
        // axios는 4xx·5xx 응답을 자동으로 throw → res.ok 체크 불필요
        const res = await axios.get<Post[]>("/api/posts");
        setResults(res.data); // ← fetch의 res.json() 없이 바로 데이터 접근
      } catch (err) {
        // ─── axios 에러 처리 ──────────────────────────────────────
        // axios.isAxiosError(err): axios가 던진 에러인지 확인하는 타입 가드
        // err.response?.data?.detail: FastAPI가 반환한 에러 메시지 (있는 경우)
        // err.message: axios 기본 에러 메시지 (예: "Network Error")
        // 그 외: 알 수 없는 오류 문구로 폴백
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.detail ?? err.message ?? "알 수 없는 오류가 발생했습니다"
          );
        } else {
          setError("알 수 없는 오류가 발생했습니다");
        }

        // ─── [fetch] 에러 처리 방식 (참고용) ────────────────────
        // fetch는 axios.isAxiosError 같은 헬퍼가 없어 instanceof Error로만 구분
        // err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다"
      } finally {
        // 성공·실패에 관계없이 요청이 끝나면 로딩 상태 OFF
        setLoading(false);
      }
    }

    fetchPosts();
  }, []); // 빈 배열 → 컴포넌트가 처음 화면에 나타날 때(마운트) 딱 한 번만 실행

  // ─── 검색어 기반 실시간 필터링 ───────────────────────
  // results(전체 목록)를 query로 걸러냄 — 추가 네트워크 요청 없이 클라이언트에서 처리
  const filtered = results.filter(
    (post) =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main>
      {/* ─── 헤더 ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">게시글 검색</h1>
        <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600">
          ← 목록으로
        </Link>
      </div>

      {/* ─── 검색 입력창 ─────────────────────────────────
          value={query}          → State를 화면에 반영 (단방향)
          onChange → setQuery()  → 입력을 State에 반영 (역방향)
          두 방향을 합쳐 "양방향 바인딩(controlled input)"이라고 부름       */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목 또는 내용으로 검색..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors mb-6"
      />

      {/* ─── 로딩 스피너 ─────────────────────────────────
          loading이 true일 때만 렌더링 (조건부 렌더링)
          animate-spin: Tailwind 클래스 → CSS로 360° 회전 애니메이션 적용
          border-t-blue-600: 상단 테두리만 진한 색 → 회전 시 스피너처럼 보임  */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ─── 에러 메시지 ─────────────────────────────────
          로딩이 끝났고 error State에 값이 있을 때만 표시              */}
      {!loading && error && (
        <p className="text-center text-red-400 py-20">{error}</p>
      )}

      {/* ─── 검색 결과 목록 ──────────────────────────────
          로딩도 아니고 에러도 없을 때 결과를 렌더링                    */}
      {!loading && !error && (
        <>
          {/* 검색어 유무에 따라 안내 문구를 다르게 표시 */}
          <p className="text-sm text-gray-400 mb-3">
            {query
              ? `"${query}" 검색 결과 ${filtered.length}건`
              : `전체 ${results.length}건`}
          </p>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-20">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {/* filtered 배열을 map으로 순회하며 각 게시글 카드 렌더링 */}
              {filtered.map((post) => (
                // key: React가 리스트 항목을 추적할 때 사용하는 고유 식별자
                <li key={post.id}>
                  <Link
                    href={`/posts/${post.id}`}
                    className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
                  >
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(post.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
