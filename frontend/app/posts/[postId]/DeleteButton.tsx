"use client";

import { deletePost } from "@/app/actions";

export default function DeleteButton({ postId }: { postId: number }) {
  // bind로 postId를 미리 고정 — 클릭 시 deletePost(postId) 호출
  const boundDeletePost = deletePost.bind(null, postId);

  return (
    <form
      action={boundDeletePost}
      onSubmit={(e) => {
        // confirm은 브라우저 기본 다이얼로그 — JS 없이는 동작하지 않음
        if (!confirm("정말 삭제할까요?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
      >
        삭제하기
      </button>
    </form>
  );
}
