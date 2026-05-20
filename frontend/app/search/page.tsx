// app/search/page.tsx — 검색 페이지 (Client Component)
//
// [실습 3] 검색 기능 고도화
//   - 클라이언트 필터링 제거 → 서버사이드 필터링으로 전환
//   - useSearchParams + useRouter 로 URL 상태 동기화
//   - useSearchParams 사용 시 Next.js 요구사항: <Suspense> 래핑 필수
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

// useSearchParams()를 사용하는 실제 검색 로직 컴포넌트
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // URL의 q 파라미터 값으로 초기화 — /search?q=react 로 직접 접근해도 반영됨
  const [query, setQuery] = useState<string>(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // query 가 바뀔 때마다 서버에 검색 요청
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        const url = query
          ? `${BASE_PATH}/api/search?q=${encodeURIComponent(query)}`
          : `${BASE_PATH}/api/search`;
        const res = await axios.get<Post[]>(url);
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
  }, [query, BASE_PATH]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    // 입력 변경 시 URL을 동기화 — 뒤로가기·공유·새로고침 시 검색어 유지
    router.replace(
      value ? `${BASE_PATH}/search?q=${encodeURIComponent(value)}` : `${BASE_PATH}/search`
    );
  }

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
        onChange={handleChange}
        placeholder="제목 또는 내용으로 검색하세요"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {loading && (
        <p className="text-center text-gray-400 py-10">불러오는 중...</p>
      )}

      {error && (
        <p className="text-center text-red-500 py-10">{error}</p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-center text-gray-400 py-10">
          {query ? "검색 결과가 없습니다." : "게시글이 없습니다."}
        </p>
      )}

      {!loading && !error && results.length > 0 && (
        <ul className="space-y-3">
          {results.map((post) => (
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

// useSearchParams()를 사용하는 컴포넌트는 반드시 <Suspense>로 감싸야 함
export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-center text-gray-400 py-10">불러오는 중...</p>}>
      <SearchContent />
    </Suspense>
  );
}
