// app/search/page.tsx — 게시글 검색 (Client Component)

// ✅ "use client" 선언 — 이 컴포넌트는 브라우저에서 실행됨
//    useState·useEffect 같은 React 훅과 이벤트 핸들러를 사용하려면 반드시 필요
//    Server Component(기본값)에서는 이 훅들을 쓸 수 없음
"use client";

// ─── [실습 3: 검색 기능 고도화하기 - import] ─────────────
// useSearchParams: 현재 URL의 쿼리 파라미터를 읽는 Next.js 훅
// useRouter: router.push()로 URL을 프로그래밍 방식으로 변경하는 Next.js 훅
// Suspense: useSearchParams() 사용 시 Next.js가 반드시 요구하는 래퍼 컴포넌트
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

// ─── SearchContent: useSearchParams를 사용하는 실제 컴포넌트 ──
// Next.js는 useSearchParams()를 사용하는 컴포넌트를 반드시 <Suspense>로 감싸도록 요구함
// → 검색 로직을 여기에 구현하고, 아래 SearchPage(기본 export)에서 Suspense로 감쌈
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ─── 상태 4개 선언 ────────────────────────────────────
  // useState<타입>(초기값) 형태로 선언

  // ─── [실습 3: 검색 기능 고도화하기] URL의 q 파라미터 값으로 초기화 ──
  // /search?q=react 로 직접 접근해도 검색어가 입력창에 반영됨
  // searchParams.get("q"): URL에 ?q=값이 없으면 null 반환 → ?? ""로 빈 문자열 폴백
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const [results, setResults] = useState<Post[]>([]);  // fetch한 게시글 목록
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
        // ─── [실습 3: 검색 기능 고도화하기] 검색어를 쿼리 파라미터로 전달 ──
        // query가 있으면 /api/posts?q=검색어, 없으면 /api/posts
        // encodeURIComponent: 한글·공백·특수문자를 URL 안전한 형태로 인코딩
        // 예) "Next.js 입문" → "Next.js%20%EC%9E%85%EB%AC%B8"
        const url = query
          ? `/api/posts?q=${encodeURIComponent(query)}`
          : `/api/posts`;
        const res = await axios.get<Post[]>(url);
        setResults(res.data);
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
      } finally {
        // 성공·실패에 관계없이 요청이 끝나면 로딩 상태 OFF
        setLoading(false);
      }
    }

    fetchPosts();

    // ─── [실습 3: 검색 기능 고도화하기] query를 의존성 배열에 추가 ──
    // query가 바뀔 때마다 fetchPosts()가 재실행 → 백엔드에 새 검색어 전달
  }, [query]);

  // ─── [실습 3: 검색 기능 고도화하기] 필터링은 백엔드가 담당 ──
  // results 자체가 이미 필터링된 결과 → filtered 변수 불필요
  // 아래 JSX에서 filtered 대신 results를 직접 사용

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
          두 방향을 합쳐 "양방향 바인딩(controlled input)"이라고 부름

          [실습 3: 검색 기능 고도화하기] State 업데이트 + URL 갱신을 동시에 수행
          router.push()로 URL을 바꾸면 브라우저 히스토리에 기록됨
          → 뒤로 가기로 이전 검색어로 돌아갈 수 있음              */}
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          router.push(`/search?q=${encodeURIComponent(e.target.value)}`);
        }}
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
          {/* [실습 3: 검색 기능 고도화하기] results.length 사용 — results가 곧 최종 결과 */}
          <p className="text-sm text-gray-400 mb-3">
            {query
              ? `"${query}" 검색 결과 ${results.length}건`
              : `전체 ${results.length}건`}
          </p>

          {/* [실습 3: 검색 기능 고도화하기] results.length === 0 */}
          {results.length === 0 ? (
            <p className="text-center text-gray-400 py-20">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="space-y-3">
              {/* [실습 3: 검색 기능 고도화하기] results.map — 백엔드에서 이미 필터링된 결과를 그대로 렌더링 */}
              {results.map((post) => (
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

// ─── SearchPage: SearchContent를 Suspense로 감싸는 래퍼 ──────
// Next.js에서 useSearchParams()를 사용하는 컴포넌트는
// 반드시 <Suspense>로 감싸야 빌드 오류가 발생하지 않음
// → 검색 로직(SearchContent)과 Suspense 래핑(SearchPage)을 분리
export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
