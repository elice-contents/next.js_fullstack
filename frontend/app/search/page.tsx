// app/search/page.tsx — 검색 페이지 (Client Component)
"use client";

import { useState, useEffect } from "react";
// [실습 3] TODO: useSearchParams, useRouter, Suspense 를 추가로 import 하세요.
//   - useSearchParams : URL의 ?q= 값을 읽는 Next.js 훅
//   - useRouter       : router.replace()로 URL을 업데이트하는 Next.js 훅
//   - Suspense        : useSearchParams() 사용 시 Next.js가 요구하는 래퍼 컴포넌트
import Link from "next/link";
import axios from "axios";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

// [실습 3] TODO: 아래 SearchPage 컴포넌트를 두 개로 분리해보세요.
//
//   1. SearchContent 함수 선언
//      - useSearchParams(), useRouter() 를 호출하세요.
//      - query 초기값을 searchParams.get("q") ?? "" 로 설정하세요.
//      - useEffect 의 의존성 배열에 query 를 추가하세요.
//      - axios 호출 URL에 q 파라미터를 포함하세요.
//        → query 있음: `${BASE_PATH}/api/search?q=${encodeURIComponent(query)}`
//        → query 없음: `${BASE_PATH}/api/search`
//      - input onChange 핸들러에서 setQuery + router.replace 로 URL도 동기화하세요.
//      - 클라이언트 필터링(results.filter) 을 제거하고 results 를 바로 렌더링하세요.
//
//   2. SearchPage 함수 수정
//      - <Suspense> 로 <SearchContent /> 를 감싸서 반환하세요.

export default function SearchPage() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // [실습 2 완성] axios 방식 — 전체 목록 조회 후 클라이언트 필터링
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get<Post[]>(`${BASE_PATH}/api/search`);
        setResults(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.detail ?? "게시글을 불러오는 데 실패했습니다");
        } else {
          setError("알 수 없는 오류가 발생했습니다");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  // [실습 3] TODO: 클라이언트 필터링을 제거하세요. (서버가 처리)
  const filtered = results.filter(
    (post) => post.title.includes(query) || post.content.includes(query)
  );

  return (
    <main>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`${BASE_PATH}/posts`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">검색</h1>
      </div>

      {/* [실습 3] TODO: onChange 에서 router.replace 로 URL도 동기화하세요. */}
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
