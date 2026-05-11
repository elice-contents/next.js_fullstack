"use client"; // Error Boundary는 Client Component에서만 동작하므로 필수

export default function Error({ error }: { error: Error }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
      <p className="font-medium">오류가 발생했습니다</p>
      <p className="text-sm mt-1 text-red-500">{error.message}</p>
    </div>
  );
}
