// app/posts/[postId]/page.tsx — 게시글 상세 (Server Component)
import Link from "next/link";
import DeleteButton from "./DeleteButton";

type Post = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>; // Next.js 15: params는 Promise
}) {
  const { postId } = await params;

  const res = await fetch(`${process.env.FASTAPI_URL}/posts/${postId}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    return (
      <div className="text-center py-20 text-gray-400">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }
  if (!res.ok) {
    throw new Error("게시글을 불러오는 데 실패했습니다");
  }

  const post: Post = await res.json();

  return (
    <main>
      <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-600">
        ← 목록으로
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date(post.created_at).toLocaleDateString("ko-KR")}
        </p>
        <p className="mt-6 text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="flex gap-3 mt-4">
        <Link
          href={`/posts/${post.id}/edit`}
          className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          수정하기
        </Link>
        {/* 삭제는 confirm 다이얼로그가 필요하므로 Client Component로 분리 */}
        <DeleteButton postId={post.id} />
      </div>
    </main>
  );
}
