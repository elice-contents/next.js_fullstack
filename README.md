# 검색 기능 구현 실습 정리

Next.js(프런트엔드) + FastAPI(백엔드) 풀스택 환경에서 검색 기능을 단계적으로 구현한 실습입니다.  
총 3단계 실습을 거치며 Fetch → Axios 전환, 클라이언트 필터링 → 서버 필터링 고도화까지의 흐름을 다룹니다.

---

## 프로젝트 구조

```
fullstack-practice-copy/
├── backend/
│   └── main.py              # FastAPI 서버 (GET /posts 검색 API 포함)
└── frontend/
    └── app/
        ├── api/posts/
        │   └── route.ts     # Next.js Route Handler (프록시 서버 역할)
        └── search/
            └── page.tsx     # 검색 페이지 (Client Component)
```

### 요청 흐름

```
브라우저 (page.tsx)
    ↓  HTTP 요청 (/api/posts?q=검색어)
Next.js Route Handler (route.ts)
    ↓  서버에서 FastAPI 호출
FastAPI 서버 (main.py)
    ↓  DB 조회 결과 반환
```

> **왜 브라우저가 FastAPI를 직접 호출하지 않나요?**  
> 브라우저에서 직접 호출하려면 FastAPI URL을 `NEXT_PUBLIC_` 환경변수로 노출해야 합니다.  
> Route Handler를 중간에 두면 FastAPI URL이 서버 측에서만 사용되므로 브라우저에 노출되지 않습니다.

---

## 실습 1 — Fetch 기반 검색 기능 구현하기

### 목표

브라우저 내장 `fetch` API를 사용해 게시글 목록을 불러오고, **클라이언트 사이드**에서 검색어로 필터링하는 검색 기능을 구현합니다.

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/app/search/page.tsx` | fetch로 전체 게시글 목록 불러오기 + 클라이언트 필터링 구현 |
| `frontend/app/api/posts/route.ts` | Route Handler 초기 구현 (q 파라미터 없이 전체 반환) |

### 구현 내용

**① 두 가지 fetch 방식 비교**

처음에는 브라우저에서 FastAPI를 직접 호출하는 방식을 시도합니다.

```typescript
// 방식 1 — 직접 호출 (NEXT_PUBLIC_ 환경변수 필요)
const base = process.env.NEXT_PUBLIC_FASTAPI_URL;
const res = await fetch(`${base}/posts`);
```

`NEXT_PUBLIC_` 접두사가 있어야 빌드 시 브라우저 번들에 포함됩니다. 접두사가 없는 `FASTAPI_URL`은 서버 측에서만 유효하므로 브라우저에서는 `undefined`가 됩니다.

이후 Route Handler를 통한 방식으로 개선합니다.

```typescript
// 방식 2 — Route Handler 경유 (NEXT_PUBLIC_ 불필요)
const res = await fetch("/api/posts");
```

**② fetch의 에러 처리 방식**

`fetch`는 네트워크 오류만 예외를 던지고, `4xx` / `5xx` 응답은 정상으로 간주합니다.  
따라서 `res.ok`를 직접 확인해서 에러를 수동으로 처리해야 합니다.

```typescript
if (!res.ok) {
  throw new Error("게시글 목록을 불러오는 데 실패했습니다");
}
const data: Post[] = await res.json();
setResults(data);
```

**③ 클라이언트 사이드 필터링**

전체 게시글 목록을 한 번에 받아온 뒤, 브라우저에서 직접 검색어로 걸러냅니다.

```typescript
const filtered = results.filter(
  (post) =>
    post.title.toLowerCase().includes(query.toLowerCase()) ||
    post.content.toLowerCase().includes(query.toLowerCase())
);
```

**④ useEffect 의존성 배열**

마운트 시 1회만 전체 목록을 불러오고, 이후 필터링은 클라이언트에서만 처리합니다.

```typescript
useEffect(() => {
  fetchPosts();
}, []); // 빈 배열: 마운트 시 1회 실행
```

### 핵심 개념 정리

- **`NEXT_PUBLIC_` 환경변수**: 브라우저에서 접근 가능한 환경변수. 빌드 시 번들에 포함됨
- **Route Handler**: `app/api/` 경로에 위치한 서버 전용 API 엔드포인트. 외부 서버 URL을 숨기는 프록시 역할
- **클라이언트 사이드 필터링**: 서버에서 전체 데이터를 받아 브라우저에서 필터링. 추가 네트워크 요청 없이 빠르지만, 데이터가 많아지면 성능 문제가 발생할 수 있음

---

## 실습 2 — Axios로 검색 기능 리팩토링하기

### 목표

실습 1에서 `fetch`로 작성한 코드를 `axios`로 교체하며, 두 라이브러리의 차이점을 이해합니다.  
**검색 로직(클라이언트 필터링)은 그대로 유지**하고 HTTP 클라이언트만 교체합니다.

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/app/search/page.tsx` | fetch → axios 교체 |

> `route.ts`와 `main.py`는 변경 없음 — Axios 리팩토링은 프런트엔드 내부 변경  
> Route Handler(`route.ts`)는 서버에서 실행되어 Node.js 내장 `fetch`로 충분하므로, axios는 클라이언트(`search/page.tsx`)에서만 사용합니다.

### 구현 내용

**① axios 설치 및 import**

`axios`는 브라우저 내장 API가 아니므로 별도 설치가 필요합니다.

```bash
npm install axios
```

```typescript
import axios from "axios";
```

**② fetch → axios 코드 비교**

```typescript
// fetch 방식
const res = await fetch("/api/posts");
if (!res.ok) throw new Error("...");
const data: Post[] = await res.json();
setResults(data);

// axios 방식
const res = await axios.get<Post[]>("/api/posts");
setResults(res.data);
```

**③ axios 에러 처리**

`axios`는 `4xx` / `5xx` 응답을 자동으로 예외로 던지기 때문에 `res.ok` 체크가 필요 없습니다.  
`axios.isAxiosError()`로 axios가 던진 에러인지 구분할 수 있습니다.

```typescript
if (axios.isAxiosError(err)) {
  setError(
    err.response?.data?.detail ?? err.message ?? "알 수 없는 오류가 발생했습니다"
  );
} else {
  setError("알 수 없는 오류가 발생했습니다");
}
```

### fetch vs axios 비교

| 항목 | fetch | axios |
|------|-------|-------|
| 설치 | 브라우저 내장, 불필요 | `npm install axios` 필요 |
| 응답 데이터 파싱 | `await res.json()` 별도 호출 | `res.data`에 자동 파싱 |
| 4xx / 5xx 처리 | 정상 응답으로 간주 → `res.ok` 수동 확인 필요 | 자동으로 예외 throw |
| 에러 타입 구분 | `err instanceof Error` | `axios.isAxiosError(err)` |
| TypeScript 지원 | 별도 타입 지정 필요 | `axios.get<타입>(url)` 제네릭 지원 |

---

## 실습 3 — 검색 기능 고도화하기

### 목표

클라이언트 사이드 필터링의 한계를 넘어, 검색어를 백엔드로 전달해 **서버에서 직접 필터링**하도록 구조를 변경합니다.  
추가로 검색어를 URL 쿼리 파라미터(`?q=...`)로 관리해 새로고침·공유·뒤로가기에도 검색 상태가 유지되도록 개선합니다.

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `backend/main.py` | `GET /posts`에 `q` 쿼리 파라미터 추가, DB에서 직접 필터링 |
| `frontend/app/api/posts/route.ts` | 브라우저에서 받은 `q` 파라미터를 FastAPI로 전달 |
| `frontend/app/search/page.tsx` | URL 상태 관리, 검색어를 API 요청에 포함, Suspense 래핑 |

### 구현 내용

**① FastAPI — DB 서버 사이드 필터링**

`q` 파라미터가 있으면 제목과 내용을 동시에 검색하고, 없으면 전체를 반환합니다.

```python
from sqlalchemy import or_

@app.get("/posts", response_model=list[PostResponse])
def get_posts(q: Optional[str] = None, db: Session = Depends(get_db)):
    if q:
        return db.query(Post).filter(
            or_(
                Post.title.ilike(f"%{q}%"),   # 대소문자 구분 없는 부분 일치
                Post.content.ilike(f"%{q}%"),
            )
        ).all()
    return db.query(Post).all()
```

- `ilike`: 대소문자를 구분하지 않는 `LIKE` 검색 (일반 `like`는 대소문자 구분)
- `or_`: 두 조건을 `OR`로 연결 (`WHERE title LIKE ... OR content LIKE ...`)
- FastAPI는 함수 인자로 선언하는 것만으로 쿼리 파라미터를 자동 파싱함 (`?q=검색어`)

**② Route Handler — q 파라미터 FastAPI로 전달**

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q"); // ?q=검색어 추출, 없으면 null

  const url = q
    ? `${process.env.FASTAPI_URL}/posts?q=${encodeURIComponent(q)}`
    : `${process.env.FASTAPI_URL}/posts`;

  const res = await fetch(url);
  // ...
}
```

- `new URL(request.url)`: 문자열 URL을 파싱 가능한 URL 객체로 변환
- `encodeURIComponent`: 한글·공백·특수문자를 URL 안전한 형태로 인코딩  
  예) `"Next.js 입문"` → `"Next.js%20%EC%9E%85%EB%AC%B8"`

**③ 검색 페이지 — URL 상태 관리 도입**

`useSearchParams`와 `useRouter`를 추가해 검색어를 URL에 반영합니다.

```typescript
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const searchParams = useSearchParams();
const router = useRouter();

// URL의 ?q=값으로 초기 검색어 세팅 → 직접 URL 접근 시에도 검색어 유지
const [query, setQuery] = useState(searchParams.get("q") ?? "");
```

입력창에서 검색어가 바뀔 때마다 URL도 함께 갱신합니다.

```typescript
onChange={(e) => {
  setQuery(e.target.value);
  router.push(`/search?q=${encodeURIComponent(e.target.value)}`);
}}
```

`router.push()`로 URL을 바꾸면 브라우저 히스토리에 기록되어 **뒤로 가기로 이전 검색어**로 돌아갈 수 있습니다.

**④ useEffect 의존성 배열 변경**

클라이언트 필터링이 사라졌으므로, 검색어가 바뀔 때마다 새로 API를 호출해야 합니다.

```typescript
// 실습 1, 2: 마운트 시 1회만 실행
// }, []);

// 실습 3: query가 바뀔 때마다 재실행 → 새 검색어로 API 재요청
}, [query]);
```

**⑤ Suspense 래핑**

`useSearchParams()`를 사용하는 컴포넌트는 Next.js 빌드 규칙상 반드시 `<Suspense>`로 감싸야 합니다.  
검색 로직(`SearchContent`)과 Suspense 래핑(`SearchPage`)을 분리하는 패턴을 사용합니다.

```typescript
function SearchContent() {
  // useSearchParams() 사용 — 검색 로직 전체
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
```

### 클라이언트 필터링 vs 서버 필터링 비교

| 항목 | 클라이언트 필터링 (실습 1, 2) | 서버 필터링 (실습 3) |
|------|-------------------------------|----------------------|
| 필터링 위치 | 브라우저 (JavaScript) | DB 쿼리 (`WHERE LIKE`) |
| 네트워크 요청 | 전체 목록 1회 로드 후 재요청 없음 | 검색어가 바뀔 때마다 재요청 |
| 데이터 양 | 데이터가 많으면 초기 로딩이 무거워짐 | 필요한 결과만 반환 |
| URL 공유 | 검색어가 URL에 없어 공유 불가 | `?q=검색어`로 URL 공유 가능 |
| 뒤로 가기 | 검색어 복원 안 됨 | 히스토리에 기록되어 복원됨 |

---

## 실습별 변경 요약

```
실습 1 — Fetch 기반 검색 기능 구현하기
  └─ page.tsx: fetch로 전체 목록 로드 + 클라이언트 사이드 필터링
  └─ route.ts: Route Handler 초기 구현 (q 파라미터 없음)

실습 2 — Axios로 검색 기능 리팩토링하기
  └─ page.tsx: fetch → axios 교체 (그 외 로직 동일)

실습 3 — 검색 기능 고도화하기
  └─ main.py:   GET /posts에 q 파라미터 추가, DB ilike 필터링
  └─ route.ts:  q 파라미터를 받아 FastAPI로 전달
  └─ page.tsx:  useSearchParams / useRouter로 URL 상태 관리
                axios 요청에 q 파라미터 포함
                useEffect 의존성 배열에 query 추가
                Suspense로 SearchContent 래핑
```
