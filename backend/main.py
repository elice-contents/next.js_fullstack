# main.py — FastAPI + SQLite Blog API
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, or_
# or_: SQLAlchemy에서 여러 조건을 OR로 연결할 때 사용하는 함수
# 예) or_(Post.title.ilike(...), Post.content.ilike(...))
#     → WHERE title LIKE ... OR content LIKE ...
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone
from typing import Optional

# ─── DB 설정 ────────────────────────────────────────────
DATABASE_URL = "sqlite:///./blog.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── 모델 (DB 테이블) ────────────────────────────────────
class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

# ─── [실습 1: Fetch 기반 검색 기능 구현하기] 쿼리 파라미터 없이 전체 반환 ────
# (실습 2에서도 동일하게 사용 — Axios 리팩토링은 프런트엔드만 변경)
# @app.get("/posts", response_model=list[PostResponse])
# def get_posts(db: Session = Depends(get_db)):
#     return db.query(Post).all()

# ─── [실습 3: 검색 기능 고도화하기] 검색어(q)가 있으면 필터링, 없으면 전체 반환 ──
@app.get("/posts", response_model=list[PostResponse])
def get_posts(q: Optional[str] = None, db: Session = Depends(get_db)):
    # q: URL 쿼리 파라미터 (?q=검색어)
    # FastAPI는 경로 파라미터({post_id})와 달리
    # 함수 인자로 선언하는 것만으로 쿼리 파라미터를 자동 파싱함
    # Optional[str] = None → 검색어가 없으면 None (기존 동작 유지)
    if q:
        # ilike: 대소문자 구분 없는 LIKE 검색 (case-insensitive)
        #        일반 like("%검색어%")는 대소문자를 구분함
        # f"%{q}%": '%검색어%' 패턴 → 앞뒤로 어떤 문자든 포함되면 매칭
        return db.query(Post).filter(
            or_(
                Post.title.ilike(f"%{q}%"),
                Post.content.ilike(f"%{q}%"),
            )
        ).all()

    # q가 없으면 기존과 동일하게 전체 반환
    return db.query(Post).all()


# ─── GET /posts/{post_id} ────────────────────────────────
@app.get("/posts/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
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
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    try:
        if data.title is not None:
            post.title = data.title # type : ignore
        if data.content is not None:
            post.content = data.content # type : ignore
        db.commit()
        db.refresh(post)
        return post
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"게시글 수정 실패: {str(e)}")


# ─── DELETE /posts/{post_id} ─────────────────────────────
@app.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    try:
        db.delete(post)  # 삭제 대상으로 표시
        db.commit()      # DB에서 영구 삭제
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"게시글 삭제 실패: {str(e)}")
    # 204 No Content: 삭제 성공 시 응답 바디 없음
