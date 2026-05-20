// app/search/page.tsx — 검색 페이지 (Client Component)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // BASE_PATH: 런박스 환경에서 Client Component가 Route Handler 경로를 올바르게 구성하기 위해 필요합니다. 
  // .env.local 파일에 NEXT_PUBLIC_BASE_PATH='/proxy/3000'이 포함되어 있는지 확인해주세요.
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // ===========================================================================
  // [실습 1] Direct Fetch 방식
  //   흐름: 브라우저 → FastAPI (NEXT_PUBLIC_FASTAPI_URL/posts) 직접 호출
  //   TODO: 아래 useEffect 블록을 완성해보세요.완성 후 Route Handler 방식(아래)은 주석 처리하세요.
  // ===========================================================================
  /*
    useEffect(() => {
      setLoading(true);
      setError(null);
  
      // TODO: process.env.NEXT_PUBLIC_FASTAPI_URL 을 사용해 /posts 를 fetch 하세요.
      //       성공 시 setResults, 실패 시 setError, 완료 시 setLoading(false) 처리.
  
    }, []);
  */

  // ===========================================================================
  // [실습 1] Route Handler 방식
  //   흐름: 브라우저 → /api/search (Route Handler) → FastAPI
  //   TODO: 아래 useEffect 블록을 완성해보세요.
  // ===========================================================================
  useEffect(() => {
    setLoading(true);
    setError(null);

    // TODO: `${BASE_PATH}/api/search` 를 fetch 하세요.
    //       성공 시 setResults, 실패 시 setError, 완료 시 setLoading(false) 처리.

  }, []);

  // ===========================================================================
  // TODO: results 배열을 query 로 필터링하는 로직을 구현해보세요.
  //       post.title 또는 post.content 에 query 가 포함된 게시글만 남기세요.
  // ===========================================================================
  const filtered: Post[] = results;

  return (
    <main>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`${BASE_PATH}/posts`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">검색</h1>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목 또는 내용으로 검색하세요"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {loading && (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      )}

      {error && (
        <p className="text-center text-red-500 py-10">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-10">
          {query ? "검색 결과가 없습니다." : "게시글이 없습니다."}
        </p>
      )}

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
