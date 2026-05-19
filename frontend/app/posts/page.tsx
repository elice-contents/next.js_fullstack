// app/posts/page.tsx — 게시글 목록 (Server Component)
import Link from "next/link";
import { bp } from "@/app/lib/path";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default async function PostsPage() {
  // ✅ Server Component → FastAPI 직접 호출 (Route Handler 경유 금지)
  const res = await fetch(`${process.env.FASTAPI_URL}/posts`, {
    next: { tags: ["posts-list"] },
  });

  if (!res.ok) {
    throw new Error("게시글 목록을 불러오는 데 실패했습니다");
  }

  const posts: Post[] = await res.json();

  return (
    <main>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">게시글 목록</h1>

      {posts.length === 0 ? (
        <p className="text-center text-gray-400 py-20">
          아직 작성된 게시글이 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={bp(`/posts/${post.id}`)}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-elice-muted hover:shadow-sm transition-all"
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
    </main>
  );
}
