// app/search/page.tsx — 검색 페이지 (Client Component)
//
// 이 파일에는 두 가지 방식의 구현이 담겨 있습니다
//   [실습 1] Direct Fetch   : 브라우저 → FastAPI 직접 호출 (주석 처리됨)
//   [실습 2] axios          : 브라우저 → Route Handler → FastAPI (활성)

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function SearchPage() {
  // ─────────────────────────────────────────────────────────────────────────
  // [실습 1] state 선언
  //   - query   : 검색 입력값
  //   - results : FastAPI에서 받아온 전체 게시글 목록
  //   - loading : 데이터 로딩 중 여부
  //   - error   : 에러 메시지
  // ─────────────────────────────────────────────────────────────────────────
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // [실습 1] Direct Fetch 방식
  //   흐름: 브라우저 → FastAPI (http://localhost:8000/posts) 직접 호출
  //
  //   포인트:
  //   - 클라이언트(브라우저)에서 읽으려면 환경 변수에 NEXT_PUBLIC_ 접두사 필요
  //     → .env.local 의 NEXT_PUBLIC_FASTAPI_URL 사용
  //   - 브라우저가 다른 출처(8000포트)로 요청하므로 CORS 설정 필수
  //     → backend/main.py 의 allow_origins 에 "http://localhost:3000" 등록 확인
  // =========================================================================
  /*
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${process.env.NEXT_PUBLIC_FASTAPI_URL}/posts`)
      .then((res) => {
        if (!res.ok) throw new Error("게시글을 불러오는 데 실패했습니다");
        return res.json();
      })
      .then((data: Post[]) => setResults(data))
      .catch((err: Error) => setError(err.message))   // [실습 1] catch 블록: 에러 상태 업데이트
      .finally(() => setLoading(false));               // [실습 1] finally 블록: 로딩 상태 해제
  }, []);
  */

  // =========================================================================
  // [실습 2] axios 방식
  //   흐름: 브라우저 → /api/search (Route Handler) → FastAPI
  //
  //   포인트:
  //   - fetch 대신 axios를 사용하도록 리팩토링
  //   - axios.isAxiosError()로 HTTP 에러와 네트워크 에러를 구분하여 처리
  // =========================================================================

  // BASE_PATH: 클라이언트에서 Route Handler 경로를 올바르게 구성하기 위해 필요
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  useEffect(() => {
    setLoading(true);
    setError(null);

    axios
      .get<Post[]>(`${BASE_PATH}/api/search`)
      .then((res) => setResults(res.data))
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.detail ?? "게시글을 불러오는 데 실패했습니다");
        } else {
          setError("알 수 없는 오류가 발생했습니다");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // [실습 1] filter + includes 로 클라이언트 사이드 검색 필터링
  //   - title 또는 content 에 검색어(query)가 포함된 게시글만 추출
  // ─────────────────────────────────────────────────────────────────────────
  const filtered = results.filter(
    (post) =>
      post.title.includes(query) || post.content.includes(query)
  );

  return (
    <main>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`${BASE_PATH}/posts`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">검색</h1>
      </div>

      {/* 검색어 입력 필드 — 입력할 때마다 query state 를 업데이트 */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목 또는 내용으로 검색하세요"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* loading state 가 true 일 때 로딩 메시지 표시 */}
      {loading && (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      )}

      {/* error state 에 메시지가 있을 때 에러 표시 */}
      {error && (
        <p className="text-center text-red-500 py-10">{error}</p>
      )}

      {/* 로딩·에러 없고 결과도 없을 때 안내 메시지 */}
      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-10">
          {query ? "검색 결과가 없습니다." : "게시글이 없습니다."}
        </p>
      )}

      {/* 필터링된 게시글 목록 렌더링 */}
      {!loading && !error && filtered.length > 0 && (
        <ul className="space-y-3">
          {filtered.map((post) => (
            <li key={post.id}>
              <Link
                href={`${BASE_PATH}/posts/${post.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <p className="font-medium text-gray-900">{post.title}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {post.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
