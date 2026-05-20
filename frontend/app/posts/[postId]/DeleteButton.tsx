"use client";

export default function DeleteButton({ postId }: { postId: number }) {
  const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  async function handleDelete() {
    if (!confirm("정말 삭제할까요?")) return;

    const res = await fetch(`${BASE_PATH}/api/posts/${postId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      window.location.href = `${BASE_PATH}/posts`;
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
    >
      삭제하기
    </button>
  );
}
