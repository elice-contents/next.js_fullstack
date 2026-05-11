"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

// ─── 게시글 생성 ─────────────────────────────────────────
export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const res = await fetch(`${process.env.FASTAPI_URL}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "게시글 생성에 실패했습니다");
  }

  revalidateTag("posts-list");
  redirect("/posts");
  // ✅ redirect()는 반드시 try-catch 바깥에서 호출
  //    내부적으로 NEXT_REDIRECT를 throw하므로
  //    catch 블록 안에 있으면 잡혀서 동작하지 않음
}

// ─── 게시글 수정 ─────────────────────────────────────────
export async function updatePost(postId: number, formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const res = await fetch(`${process.env.FASTAPI_URL}/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "게시글 수정에 실패했습니다");
  }

  revalidateTag("posts-list");
  redirect(`/posts/${postId}`);
}

// ─── 게시글 삭제 ─────────────────────────────────────────
export async function deletePost(postId: number) {
  const res = await fetch(`${process.env.FASTAPI_URL}/posts/${postId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    // 204 No Content가 아닌 경우에만 에러 처리
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail ?? "게시글 삭제에 실패했습니다");
  }

  revalidateTag("posts-list");
  redirect("/posts");
}
