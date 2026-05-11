// app/posts/[postId]/edit/page.tsx — 게시글 수정 폼 (Server Component)
import Link from "next/link";
import { updatePost } from "@/app/actions";

type Post = {
  id: number;
  title: string;
  content: string;
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ postId: string }>; // Next.js 15: params는 Promise
}) {
  const { postId } = await params;

  const res = await fetch(`${process.env.FASTAPI_URL}/posts/${postId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div className="text-center py-20 text-gray-400">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  const post: Post = await res.json();

  // bind(null, post.id): updatePost의 첫 번째 인자(postId)를 미리 고정
  const boundUpdatePost = updatePost.bind(null, post.id);

  return (
    <main>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/posts/${post.id}`}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 상세로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">게시글 수정</h1>
      </div>

      <form
        action={boundUpdatePost}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-5"
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            제목
          </label>
          <input
            id="title"
            name="title"
            defaultValue={post.title}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            내용
          </label>
          <textarea
            id="content"
            name="content"
            defaultValue={post.content}
            required
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          수정하기
        </button>
      </form>
    </main>
  );
}
