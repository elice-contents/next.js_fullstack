// app/api/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    const { postId } = await params;

    const res = await fetch(`${process.env.FASTAPI_URL}/posts/${postId}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        return NextResponse.json(
            { detail: "게시글 삭제에 실패했습니다" },
            { status: res.status }
        );
    }

    return new NextResponse(null, { status: 204 });
}