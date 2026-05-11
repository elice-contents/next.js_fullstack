// app/posts/new/page.tsx — 새 게시글 작성 폼 (Server Component)
import Link from "next/link";
import { createPost } from "@/app/actions";

export default function NewPostPage() {
  return (
    <main>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/posts" className="text-gray-400 hover:text-gray-600 text-sm">
          ← 목록으로
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">새 게시글 작성</h1>
      </div>

      <form action={createPost} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            제목
          </label>
          <input
            id="title"
            name="title"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            내용
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="내용을 입력하세요"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          작성하기
        </button>
      </form>
    </main>
  );
}
