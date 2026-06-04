# main.py — FastAPI + SQLite Blog API
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, String, Text, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone
from typing import Optional

# ─── DB 설정 ────────────────────────────────────────────
DATABASE_URL = "sqlite:///./blog.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
class Base(DeclarativeBase):
    pass


# ─── 모델 (DB 테이블) ────────────────────────────────────
class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(bind=engine)


# ─── Pydantic 스키마 ────────────────────────────────────
class PostCreate(BaseModel):
    title: str
    content: str

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("제목은 비워둘 수 없습니다")
        return v.strip()


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── FastAPI 앱 & CORS ──────────────────────────────────
app = FastAPI(title="Blog API")

# [실습 1] Direct Fetch 방식에서 CORS 설정이 필요한 이유
#   브라우저(http://localhost:3000)가 다른 출처의 FastAPI(http://localhost:8000)를
#   직접 호출할 때, 브라우저의 동일 출처 정책(SOP)에 의해 요청이 차단됩니다.
#   → allow_origins 에 Next.js 주소를 등록해 허용합니다.
#
# [실습 1] Route Handler 방식에서는 CORS 불필요
#   브라우저 → Next.js Route Handler(같은 출처) → FastAPI 순서로 호출되며,
#   FastAPI 를 호출하는 주체가 브라우저가 아닌 서버이므로 CORS 제약이 없습니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # [실습 1] Direct Fetch 허용 출처
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── DB 세션 의존성 ──────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── GET /posts ──────────────────────────────────────────
@app.get("/posts", response_model=list[PostResponse])
def get_posts(db: Session = Depends(get_db)):
    return db.execute(select(Post)).scalars().all()


# ─── GET /posts/{post_id} ────────────────────────────────
@app.get("/posts/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.execute(select(Post).where(Post.id == post_id)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    return post


# ─── POST /posts ─────────────────────────────────────────
@app.post("/posts", response_model=PostResponse, status_code=201)
def create_post(data: PostCreate, db: Session = Depends(get_db)):
    try:
        post = Post(title=data.title, content=data.content)
        db.add(post)      # 트랜잭션에 추가 (아직 DB에 기록되지 않음)
        db.commit()       # DB에 영구 반영
        db.refresh(post)  # id, created_at 등 DB 자동 생성 값 재조회
        return post
    except Exception as e:
        db.rollback()     # 실패 시 변경사항 전체 취소
        raise HTTPException(status_code=500, detail=f"게시글 생성 실패: {str(e)}")


# ─── PUT /posts/{post_id} ────────────────────────────────
@app.put("/posts/{post_id}", response_model=PostResponse)
def update_post(post_id: int, data: PostUpdate, db: Session = Depends(get_db)):
    post = db.execute(select(Post).where(Post.id == post_id)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    try:
        if data.title is not None:
            post.title = data.title
        if data.content is not None:
            post.content = data.content
        db.commit()
        db.refresh(post)
        return post
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"게시글 수정 실패: {str(e)}")


# ─── DELETE /posts/{post_id} ─────────────────────────────
@app.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.execute(select(Post).where(Post.id == post_id)).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    try:
        db.delete(post)  # 삭제 대상으로 표시
        db.commit()      # DB에서 영구 삭제
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"게시글 삭제 실패: {str(e)}")
    # 204 No Content: 삭제 성공 시 응답 바디 없음
