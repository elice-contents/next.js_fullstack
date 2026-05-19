// app/search/page.tsx — 게시글 검색 (Client Component)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { bp } from "@/app/lib/path";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        // NEXT_PUBLIC_ 접두사가 있어야 빌드 시 브라우저 번들에 포함됨
        const base = process.env.NEXT_PUBLIC_FASTAPI_URL;
        const res = await fetch(`${base}/posts`);
        // fetch는 4xx·5xx를 정상 응답으로 간주하므로 res.ok를 직접 확인해야 함
        if (!res.ok) {
          throw new Error("게시글 목록을 불러오는 데 실패했습니다");
        }
        const data: Post[] = await res.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다");
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []); // 마운트 시 1회만 실행 — 전체 목록을 가져온 뒤 클라이언트에서 필터링

  // 클라이언트 사이드 필터링 — 추가 네트워크 요청 없이 브라우저에서 처리
  const filtered = results.filter(
    (post) =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.content.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">게시글 검색</h1>
        <Link href={bp("/posts")} className="text-sm text-gray-400 hover:text-gray-600">
          ← 목록으로
        </Link>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목 또는 내용으로 검색..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors mb-6"
      />

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <p className="text-center text-red-400 py-20">{error}</p>
      )}

      {!loading && !error && (
        <>
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
              {filtered.map((post) => (
                <li key={post.id}>
                  <Link
                    href={bp(`/posts/${post.id}`)}
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
