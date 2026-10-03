export const blogPosts = [
  {
    slug: "membangun-api-user-management-fastapi-postgresql",
    title: "Membangun API User Management dengan FastAPI: CRUD, JWT Auth, dan PostgreSQL Lokal",
    excerpt:
      "Panduan step-by-step membangun backend user management dengan FastAPI: virtual environment, konfigurasi .env, model SQLAlchemy 2.0, hash password, JWT, endpoint CRUD, migrasi Alembic, sampai testing di Swagger.",
    category: "Backend",
    publishedAt: "2026-09-26",
    readTime: "18 menit",
    icon: "server",
    colorPalette: "green",
    sections: [
      {
        id: "visi",
        title: "1. Visi: apa yang akan dibangun",
        blocks: [
          {
            type: "paragraph",
            content:
              "Target akhirnya adalah satu backend REST API yang bisa langsung dipakai frontend mana pun. Scope-nya sengaja dijaga kecil: registrasi, login dengan token, dan operasi CRUD pada user. Fitur lain seperti refresh token, email verification, role, dan rate limit bisa ditambahkan setelah alur dasar ini benar.",
          },
          {
            type: "code",
            language: "text",
            content: `POST   /api/v1/auth/register     -> buat user baru
POST   /api/v1/auth/login        -> login (form, untuk Swagger Authorize)
POST   /api/v1/auth/login/json   -> login (JSON, untuk frontend)
GET    /api/v1/users             -> daftar user (butuh token)
GET    /api/v1/users/{id}        -> detail satu user (butuh token)
PATCH  /api/v1/users/{id}        -> update user (butuh token)
DELETE /api/v1/users/{id}        -> hapus user (butuh token)
GET    /health                   -> cek service hidup`,
          },
          {
            type: "table",
            columns: ["Poin", "Keputusan"],
            rows: [
              ["ORM", "SQLAlchemy 2.0 dengan Mapped/mapped_column, bukan declarative_base() lama."],
              ["Driver PostgreSQL", "psycopg 3 (postgresql+psycopg), bukan psycopg2."],
              ["Driver password", "pwdlib dengan Argon2, mengikuti tutorial resmi FastAPI terbaru."],
              ["Token", "JWT HS256, payload sub berisi id user dan exp berisi waktu kedaluwarsa."],
              ["Migrasi", "Alembic dengan autogenerate, bukan create_all manual."],
              ["Dokumentasi", "Swagger UI otomatis dari docstring dan response_model."],
            ],
          },
          {
            type: "callout",
            title: "Semua kode di artikel ini bisa dijalankan apa adanya",
            content:
              "Nama file, nama variabel, dan urutan langkahnya konsisten dari awal sampai akhir. Ikuti urutan yang sama, jangan lompat ke bagian model sebelum config selesai.",
          },
        ],
      },
      {
        id: "stack",
        title: "2. Stack teknologi dan prasyarat",
        blocks: [
          {
            type: "paragraph",
            content:
              "Semua yang dibutuhkan sudah cukup banyak untuk production-grade tanpa complicate. Pastikan tiga hal sudah siap sebelum mulai: Python 3.11 atau lebih baru, PostgreSQL yang sudah terinstall dan servicenya jalan, dan satu terminal untuk menjalankan server.",
          },
          {
            type: "list",
            items: [
              "Python 3.11+ untuk mendukung sintaks union type seperti str | None.",
              "PostgreSQL 14+ yang sudah terinstall di mesin lokal.",
              "psql atau pg_isready untuk mengecek status server database.",
              "Editor kode dengan ekstensi Python.",
              "Knowledge dasar tentang HTTP: method, status code, dan JSON.",
            ],
          },
          {
            type: "callout",
            title: "Kenapa SQLAlchemy 2.0 dan bukan 1.4",
            content:
              "SQLAlchemy 2.0 memakai deklarasi kolom bertipe dengan Mapped dan mapped_column, serta query memakai select() lalu db.scalars(). Gaya ini memberi autocomplete yang benar dan tidak deprecated. Jangan memulai project baru dengan execute(\"SELECT ...\") raw string.",
          },
        ],
      },
      {
        id: "environment",
        title: "3. Langkah 1 — virtual environment dan dependency",
        blocks: [
          {
            type: "steps",
            items: [
              "Buka terminal, pindah ke folder baru, lalu buat virtual environment.",
              "Aktifkan environment tersebut supaya semua install masuk ke folder project.",
              "Install satu per paket dengan nama paket yang bisa dibaca, bukan requirements freeze.",
              "Verifikasi versi FastAPI dan SQLAlchemy yang benar-benar terpasang.",
            ],
          },
          {
            type: "code",
            language: "bash",
            content: `mkdir fastapi-user-management
cd fastapi-user-management

python -m venv .venv
.venv/Scripts/activate

pip install fastapi "uvicorn[standard]"
pip install sqlalchemy alembic "psycopg[binary]"
pip install pydantic-settings pyjwt "pwdlib[argon2]" email-validator python-multipart`,
          },
          {
            type: "code",
            language: "bash",
            content: `python -c "import fastapi, sqlalchemy; print(fastapi.__version__, sqlalchemy.__version__)"`,
          },
          {
            type: "list",
            items: [
              "fastapi menyediakan framework web dan dokumentasi otomatis.",
              "uvicorn adalah ASGI server untuk menjalankan aplikasi.",
              "sqlalchemy adalah ORM dan engine database.",
              "alembic adalah tool migrasi skema.",
              "psycopg[binary] adalah driver PostgreSQL versi 3 plus binary wheel agar tidak perlu kompilasi.",
              "pydantic-settings membaca konfigurasi dari environment dan file .env.",
              "pyjwt membuat dan memverifikasi token JWT.",
              "pwdlib[argon2] adalah library hashing password yang direkomendasikan FastAPI.",
              "email-validator dipakai oleh tipe EmailStr di Pydantic.",
              "python-multipart dibutuhkan supaya endpoint login bisa menerima form data.",
            ],
          },
          {
            type: "callout",
            title: "Soal passlib dan bcrypt",
            content:
              "Banyak tutorial lama memakai passlib[bcrypt]. Passlib 1.7.4 sudah tidak kompatibel dengan bcrypt 4.1 ke atas dan memicu error __about__. Pakai pwdlib saja, atau kalau memang harus pakai passlib, kunci bcrypt ke versi 4.0.1.",
          },
        ],
      },
      {
        id: "postgres",
        title: "4. Langkah 2 — siapkan PostgreSQL lokal",
        blocks: [
          {
            type: "paragraph",
            content:
              "Buat database khusus untuk project ini. Jangan memakai database postgres default karena isinya sudah dipakai utility internal PostgreSQL dan nanti sulit dibersihkan.",
          },
          {
            type: "code",
            language: "bash",
            content: `pg_isready
createdb -U postgres user_management
psql -U postgres -l`,
          },
          {
            type: "paragraph",
            content:
              "pg_isready harus balas PGPORT 5432, Accepted. Kalau psql tidak ditemukan, berarti bin folder PostgreSQL belum ada di PATH. Tambahkan folder ini ke PATH lalu buka terminal baru:",
          },
          {
            type: "code",
            language: "text",
            content: `C:\\Program Files\\PostgreSQL\\16\\bin

# atau jalankan perintah dengan path penuh
& "C:\\Program Files\\PostgreSQL\\16\\bin\\createdb.exe" -U postgres user_management`,
          },
          {
            type: "table",
            columns: ["Keluhan", "Penyebab", "Solusi"],
            rows: [
              ["psql: command not found", "Bin folder PostgreSQL belum di PATH.", "Tambahkan bin folder ke PATH, buka terminal baru."],
              ["createdb: error: connection refused", "Service PostgreSQL belum jalan.", "Buka Services Windows, start PostgreSQL, atau jalankan pg_ctl start."],
              ["password authentication failed", "Password user postgres berbeda dengan asumsi.", "Reset password lewat pgAdmin atau psql dengan user lokal."],
              ["database already exists", "Database pernah dibuat sebelumnya.", "Aman, pakai database itu saja atau jalankan dropdb lalu createdb lagi."],
            ],
          },
          {
            type: "callout",
            title: "Pakai database name yang spesifik per project",
            content:
              "Kalau nanti punya beberapa project, pisahkan dengan nama seperti user_management, workflow_studio, atau app_builder_dev. Dengan begitu dump, reset, dan drop tidak pernah menimpa database lain.",
          },
        ],
      },
      {
        id: "struktur",
        title: "5. Langkah 3 — struktur folder",
        blocks: [
          {
            type: "paragraph",
            content:
              "Pisahkan concern utama: config, koneksi database, model, schema, keamanan, dan route. Pemisahan ini yang membuat aplikasi tetap rapi ketika endpoint bertambah banyak.",
          },
          {
            type: "code",
            language: "text",
            content: `fastapi-user-management/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py
│   └── api/
│       ├── __init__.py
│       ├── deps.py
│       └── routes/
│           ├── __init__.py
│           ├── auth.py
│           └── users.py
├── .env
├── alembic.ini
└── requirements.txt`,
          },
          {
            type: "list",
            items: [
              "core berisi konfigurasi dan keamanan, tidak boleh menyentuh HTTP request.",
              "db berisi engine, session, dan Base, tidak boleh berisi logika bisnis.",
              "models berisi definisi tabel SQLAlchemy.",
              "schemas berisi validasi input dan bentuk output JSON.",
              "api/routes berisi endpoint HTTP.",
              "api/deps.py berisi dependency yang dipakai bersama banyak endpoint.",
            ],
          },
        ],
      },
      {
        id: "config",
        title: "6.Langkah 4 — konfigurasi .env dan config.py",
        blocks: [
          {
            type: "paragraph",
            content:
              "Tidak ada satu pun password atau secret yang boleh ditulis langsung di kode. Semua konfigurasi masuk ke file .env, lalu dibaca satu kali lewat Settings.",
          },
          {
            type: "code",
            language: "text",
            content: `DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/user_management
JWT_SECRET_KEY=hasil-dari-perintah-dibawah
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=["http://localhost:3000"]
API_V1_PREFIX=/api/v1`,
          },
          {
            type: "code",
            language: "bash",
            content: `python -c "import secrets; print(secrets.token_urlsafe(48))"`,
          },
          {
            type: "code",
            language: "python",
            content: `from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()`,
          },
          {
            type: "list",
            items: [
              "Prefix postgresql+psycopg wajib dipakai agar SQLAlchemy memilih driver psycopg 3.",
              "Kalau pakai psycopg2, prefix-nya postgresql+psycopg2.",
              "CORS_ORIGINS ditulis sebagai JSON array karena bertipe list[str].",
              "lru_cache memastikan Settings hanya dibuat satu kali per proses, bukan setiap request.",
              "Extra ignore mencegah aplikasi crash kalau ada variabel lain di .env.",
            ],
          },
          {
            type: "callout",
            title: "Tambahkan .env ke .gitignore sekarang juga",
            content:
              "File .env berisi password database dan secret key. Commit file ini berarti membocorkan kredensial production ke repository. Tambahkan .env ke .gitignore sebelum commit pertama.",
          },
        ],
      },
      {
        id: "koneksi",
        title: "7. Langkah 5 — engine, session, dan Base",
        blocks: [
          {
            type: "paragraph",
            content:
              "Engine adalah koneksi ke database. Session adalah tempat bekerja di dalam satu request. Base adalah fondasi tempat semua model mendaftarkan tabelnya.",
          },
          {
            type: "code",
            language: "python",
            content: `# app/db/base.py
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass`,
          },
          {
            type: "code",
            language: "python",
            content: `# app/db/session.py
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    echo=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`,
          },
          {
            type: "list",
            items: [
              "pool_pre_ping=True mengecek koneksi masih hidup sebelum dipakai, penting untuk koneksi yang sering idle.",
              "autoflush=False memberi kontrol penuh kapan query dieksekusi.",
              "get_db adalah generator dependency, blok finally menjamin session selalu ditutup.",
              "echo=True berguna saat development untuk melihat SQL yang benar-benar dikirim.",
              "Ubah echo menjadi False di production karena log jadi sangatnoi noise.",
            ],
          },
        ],
      },
      {
        id: "model",
        title: "8. Langkah 6 — model User",
        blocks: [
          {
            type: "paragraph",
            content:
              "Model menentukan bentuk tabel di PostgreSQL. Yang paling penting di tabel user adalah unikitas email dan tidak pernah menyimpan password dalam bentuk plain text.",
          },
          {
            type: "code",
            language: "python",
            content: `# app/models/user.py
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default="true", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )`,
          },
          {
            type: "table",
            columns: ["Kolom", "Tipe", "Catatan"],
            rows: [
              ["id", "integer PK", "Auto increment dari sequence PostgreSQL."],
              ["email", "varchar(255)", "UNIQUE plus index untuk lookup cepat saat login."],
              ["full_name", "varchar(255) NULL", "Boleh kosong, tidak semua user punya nama lengkap."],
              ["hashed_password", "varchar(255)", "Hash Argon2, bukan password asli."],
              ["is_active", "boolean", "Soft disable tanpa menghapus data."],
              ["created_at", "timestamptz", "Dihandle server lewat func.now()."],
              ["updated_at", "timestamptz", "Diperbarui otomatis setiap kali baris diubah."],
            ],
          },
          {
            type: "callout",
            title: "Length 255 untuk hash Argon2 cukup",
            content:
              "Hash Argon2 yang dihasilkan pwdlib punya panjang sekitar 97 karakter. Kolom 255 memberi ruang yang nyaman tanpa boros, dan VARCHAR 255 tidak menambah beban penyimpanan di PostgreSQL karena tipe variable-length.",
          },
        ],
      },
      {
        id: "schema",
        title: "9. Langkah 7 — schema Pydantic",
        blocks: [
          {
            type: "paragraph",
            content:
              "Model SQLAlchemy mengatur database, schema Pydantic mengatur kontrak API. Pemisahan ini membuat kolom hashed_password tidak pernah ikut terkirim ke client karena tidak ada di schema output.",
          },
          {
            type: "code",
            language: "python",
            content: `# app/schemas/user.py
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"`,
          },
          {
            type: "list",
            items: [
              "EmailStr memvalidasi format email sebelum query apa pun dijalankan.",
              "Field min_length=8 menolak password kosong atau terlalu pendek di sisi server.",
              "ConfigDict(from_attributes=True) adalah wajib agar Pydantic bisa membaca atribut objek SQLAlchemy.",
              "UserUpdate memakai Optional semua karena PATCH hanya mengubah field yang dikirim.",
              "Token memiliki token_type=bearer sesuai standar Authorization header.",
            ],
          },
          {
            type: "callout",
            title: "Password tidak boleh ada di UserRead",
            content:
              "Jangan pernah menambahkan hashed_password ke schema response. Edit schema output nanti akanercebut data sensitif ikut terkirim karena ada field baru di model.",
          },
        ],
      },
      {
        id: "security",
        title: "10. Langkah 8 — hash password dan JWT",
        blocks: [
          {
            type: "paragraph",
            content:
              "Password disimpan sebagai hash one-way dengan salt internal. Saat login, password dari user di-hash ulang dengan salt yang sama lalu dibandingkan. Password asli tidak pernah menyentuh database maupun log.",
          },
          {
            type: "code",
            language: "python",
            content: `# app/core/security.py
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings

settings = get_settings()

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(subject: int, expires_minutes: int | None = None) -> str:
    minutes = expires_minutes or settings.access_token_expire_minutes
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )`,
          },
          {
            type: "table",
            columns: ["Isi payload", "Fungsi"],
            rows: [
              ["sub", "Subject token, diisi id user dalam bentuk string."],
              ["exp", "Waktu kedaluwarsa, diverifikasi otomatis oleh library JWT."],
              ["type", "Penanda access token, prepping untuk refresh token nanti."],
            ],
          },
          {
            type: "list",
            items: [
              "PasswordHash.recommended() memilih Argon2 sebagai algoritma default.",
              "Hash harus disimpan sebagai string VARCHAR, bukan tipe Bytes.",
              "exp dibuat dalam UTC karena library JWT memverifikasi dalam UTC.",
              "subject diubah ke str karena klaim JWT wajib berupa string.",
              "verify_password otomatis aman terhadap timing attack.",
            ],
          },
        ],
      },
      {
        id: "deps",
        title: "11. Langkah 9 — dependency untuk user yang sedang login",
        blocks: [
          {
            type: "paragraph",
            content:
              "Dependency membuat proteksi endpoint hanya perlu satu baris parameter. Token dibaca, diverifikasi, lalu user terkait diambil dari database untuk sisa request.",
          },
          {
            type: "code",
            language: "python",
            content: `# app/api/deps.py
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession,
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError:
        raise credentials_error

    subject = payload.get("sub")
    if subject is None:
        raise credentials_error

    user = db.get(User, int(subject))
    if user is None:
        raise credentials_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User sedang tidak aktif",
        )

    return user`,
          },
          {
            type: "callout",
            title: "Token tidak pernah dipercaya begitu saja",
            content:
              "Walaupun signature token valid, tetap ambil user dari database. Dengan begitu user yang di-disable atau sudah dihapus langsung kehilangan akses tanpa perlu menunggu token-nya kedaluwarsa.",
          },
          {
            type: "list",
            items: [
              "OAuth2PasswordBearer membuat header Authorization otomatis dan mengisi tombol Authorize di Swagger.",
              "tokenUrl harus cocok dengan path endpoint login relatif terhadap root, tanpa slash di depan.",
              "Annotated dengan Depends membuat parameter endpoint cukup ditulis CurrentUser saja.",
              "Pisahkan 401 untuk token bermasalah dan 403 untuk user yang valid tapi tidak berwenang.",
            ],
          },
        ],
      },
      {
        id: "auth-route",
        title: "12. Langkah 10 — endpoint register dan login",
        blocks: [
          {
            type: "code",
            language: "python",
            content: `# app/api/routes/auth.py
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.deps import DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import LoginRequest, Token, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def _authenticate(db: DbSession, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: DbSession) -> User:
    email = payload.email.lower()

    if db.scalar(select(User).where(User.email == email)) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email sudah terdaftar",
        )

    user = User(
        email=email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
) -> Token:
    user = _authenticate(db, form.username, form.password)
    return Token(access_token=create_access_token(user.id))


@router.post("/login/json", response_model=Token)
def login_json(payload: LoginRequest, db: DbSession) -> Token:
    user = _authenticate(db, payload.email, payload.password)
    return Token(access_token=create_access_token(user.id))`,
          },
          {
            type: "list",
            items: [
              "Email dinormalisasi dengan lower() supaya Admin@Mail.com dan admin@mail.com dianggap sama.",
              "Cek duplikat di aplikasi, tapi UNIQUE constraint di database tetap menjadi deklarasi penutup terakhir.",
              "Status 409 Conflict lebih tepat daripada 400 untuk kasus email sudah terdaftar.",
              "Endpoint /login menerima form karena dibutuhkan tombol Authorize di Swagger.",
              "Endpoint /login/json memakai JSON body yang lebih natural untuk frontend seperti fetch atau axios.",
              "verify_password hanya dipanggil kalau user ditemukan, supaya waktu respons tidak membocorkan email mana yang terdaftar.",
            ],
          },
          {
            type: "callout",
            title: "Jangan pernah balas berbeda antara email tidak ada dan password salah",
            content:
              "Kalau response untuk email tidak ada memberi 404 sementara password salah memberi 401, penyerang bisa menebak email mana yang terdaftar. Selalu balas pesan yang sama.",
          },
        ],
      },
      {
        id: "user-route",
        title: "13. Langkah 11 — endpoint CRUD user",
        blocks: [
          {
            type: "code",
            language: "python",
            content: `# app/api/routes/users.py
from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[User]:
    stmt = select(User).order_by(User.id).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: DbSession, current_user: CurrentUser) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")

    data = payload.model_dump(exclude_unset=True)

    new_email = data.get("email")
    if new_email is not None:
        new_email = new_email.lower()
        clash = db.scalar(select(User).where(User.email == new_email, User.id != user_id))
        if clash is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email sudah dipakai user lain",
            )
        data["email"] = new_email

    if "password" in data:
        data["hashed_password"] = hash_password(data.pop("password"))

    for field, value in data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: DbSession, current_user: CurrentUser) -> Response:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")
    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)`,
          },
          {
            type: "table",
            columns: ["Keputusan", "Alasan"],
            rows: [
              ["PATCH, bukan PUT", "PATCH hanya mengubah field yang dikirim, lebih aman untuk form parsial."],
              ["model_dump(exclude_unset=True)", "Field yang tidak dikirim tidak ikut di-update."],
              ["Password diubah lewat hashed_password", "Kolom password asli tidak pernah ada di model database."],
              ["204 untuk delete", "Tidak ada body, jadi tidak perlu response_model."],
              ["skip dan limit dengan batas", "Mencegah client meminta seluruh tabel sekaligus."],
              ["Order by id", "Pagination tanpa order_by tidak stabil antar-request."],
            ],
          },
          {
            type: "callout",
            title: "Batas izin per user belum ada di sini",
            content:
              "Saat ini semua user yang punya token bisa mengubah semua user. Sebelum dipakai production, tambahkan pemeriksaan seperti current_user.id != user_id except untuk admin, atau tambahkan role. Endpoint ini sengaja dibuat sederhana supaya mudah dipahami dulu.",
          },
        ],
      },
      {
        id: "main",
        title: "14. Langkah 12 — main.py dan CORS",
        blocks: [
          {
            type: "code",
            language: "python",
            content: `# app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, users
from app.core.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db.init_db import init_db

    init_db()
    yield


app = FastAPI(
    title="User Management API",
    version="1.0.0",
    description="CRUD user dengan JWT auth dan PostgreSQL.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}`,
          },
          {
            type: "code",
            language: "python",
            content: `# app/db/init_db.py
from app.db.base import Base
from app.db.session import engine
from app.models.user import User  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)`,
          },
          {
            type: "list",
            items: [
              "Lifespan adalah cara modern menjalankan kode saat start dan stop, menggantikan event handler yang deprecated.",
              "Import model di dalam init_db penting supaya tabel ikut terdaftar di metadata.",
              "CORS mengizinkan frontend Next.js di port 3000 memanggil API ini.",
              "Endpoint /health berguna untuk mengecek service hidup tanpa perlu token.",
              "Swagger otomatis tersedia di /docs, ReDoc di /redoc, dan schema OpenAPI di /openapi.json.",
            ],
          },
          {
            type: "callout",
            title: "create_all bukan pengganti migrasi",
            content:
              "create_all hanya membuat tabel yang belum ada dan tidak pernah mengubah tabel yang sudah ada. begitu ada perubahan kolom, kamu wajib Alembic. Tetap jalankan create_all supaya proyek baru bisa hidup tanpa migrasi.",
          },
        ],
      },
      {
        id: "alembic",
        title: "15. Langkah 13 — migrasi Alembic",
        blocks: [
          {
            type: "steps",
            items: [
              "Inisialisasi konfigurasi Alembic di folder project.",
              "Edit env.py supaya membaca konfigurasi dari app.core.config, bukan dari file terpisah.",
              "Buat revision pertama dengan autogenerate.",
              "Periksa file migration yang dihasilkan sebelum dijalankan.",
              "Jalankan upgrade head untuk menerapkan ke database.",
              "Jalankan uvicorn lalu pastikan tabel users benar-benar ada di psql.",
            ],
          },
          {
            type: "code",
            language: "bash",
            content: `alembic init alembic`,
          },
          {
            type: "code",
            language: "python",
            content: `# alembic/env.py, bagian konfigurasi
from app.core.config import get_settings
from app.db.base import Base
from app.models.user import User  # noqa: F401
from app.db.session import engine

settings = get_settings()

target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", settings.database_url)`,
          },
          {
            type: "code",
            language: "bash",
            content: `alembic revision --autogenerate -m "create users table"
alembic upgrade head
alembic current`,
          },
          {
            type: "code",
            language: "bash",
            content: `psql -U postgres -d user_management -c "\\d users"`,
          },
          {
            type: "list",
            items: [
              "Autogenerate membandingkan model dengan state database, jadi hasilnya harus selalu dibaca manual.",
              "alembic current menampilkan revision mana yang sudah diterapkan.",
              "Tabel alembic_version menyimpan riwayat revision dalam database itu sendiri.",
              "Kolom yang tidak sengaja diubah Sometimes terdeteksi, periksa file migration sebelum upgrade.",
              "Untuk rollback gunakan alembic downgrade -1, dan jalankan downgrade sebelum upgrade kalau salah.",
            ],
          },
          {
            type: "callout",
            title: "Pisahkan database development dan testing",
            content:
              "Migration diuji di database development dulu. Jalankan alambic downgrade base lalu upgrade head untuk memastikan migration bisa diulang dua arah tanpa error.",
          },
        ],
      },
      {
        id: "jalankan",
        title: "16. Langkah 14 — jalankan dan verifikasi",
        blocks: [
          {
            type: "code",
            language: "bash",
            content: `uvicorn app.main:app --reload --port 8000`,
          },
          {
            type: "steps",
            items: [
              "Buka http://localhost:8000/docs untuk melihat Swagger UI.",
              "Coba endpoint /health lebih dulu, harus balas status ok tanpa token.",
              "Klik Try it out pada /api/v1/auth/register, isi email, password, dan full name, lalu Execute.",
              "Ulangi dengan email yang sama, harus dapat 409 Conflict. Ini membuktikan validasi duplikat bekerja.",
              "Klik Authorize, masukkan email dan password, lalu Authorize. Ini memakai endpoint /login versi form.",
              "Jalankan /api/v1/users, harus dapat daftar user. Tombol Authorize membuat ini tidak mungkin tanpa token.",
              "Coba hapus baris Authorization dari header secara manual di /api/v1/users/{id}, harus dapat 401.",
            ],
          },
          {
            type: "code",
            language: "bash",
            content: `# Alternatif tanpa Swagger, memakai curl
curl -X POST http://localhost:8000/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d "{\\"email\\": \\"budi@mail.com\\", \\"password\\": \\"rahasia123\\", \\"full_name\\": \\"Budi\\"}"

curl -X POST http://localhost:8000/api/v1/auth/login/json \\
  -H "Content-Type: application/json" \\
  -d "{\\"email\\": \\"budi@mail.com\\", \\"password\\": \\"rahasia123\\"}"

curl http://localhost:8000/api/v1/users \\
  -H "Authorization: Bearer TOKEN_DARI_LOGIN"`,
          },
          {
            type: "table",
            columns: ["Uji", "Harapan", "Kalau gagal"],
            rows: [
              ["/health tanpa token", "200 status ok", "Server belum start atau import error."],
              ["Register email baru", "201 dengan data user", "Periksa format email dan panjang password minimal 8."],
              ["Register email sama", "409 Conflict", "Kalau lolos, berarti unique constraint belum dibuat."],
              ["Login password salah", "401 Email atau password salah", "Pastikan endpoint menerima form atau JSON sesuai yang dipanggil."],
              ["Authorize di Swagger", "Dialog tertutup, tombol logout muncul", "tokenUrl harus tanpa slash di depan."],
              ["/users dengan token", "200 daftar user", "Cek Authorization header memakai prefix Bearer."],
              ["/users tanpa token", "401 Token tidak valid", "Kalau 403, berarti user-nya yang bermasalah."],
            ],
          },
          {
            type: "callout",
            title: "Baca log terminal, jangan hanya baca response",
            content:
              "Dengan echo=True semua SQL yang dikirim ke PostgreSQL tercetak di terminal. Kalau endpoint mengembalikan 500, biasanya jawabannya ada di sana: kolom tidak ada, constraint dilanggar, atau kolom tidak bisa null.",
          },
        ],
      },
      {
        id: "next",
        title: "17. Menyambung ke frontend Next.js",
        blocks: [
          {
            type: "paragraph",
            content:
              "Panggil API dari client component dengan fetch. Token disimpan sementara di memory atau localStorage, lalu dikirim sebagai header Authorization pada setiap request yang butuh proteksi.",
          },
          {
            type: "code",
            language: "javascript",
            content: `const API = "http://localhost:8000/api/v1";

const token = localStorage.getItem("access_token");

const res = await fetch(\`\${API}/users\`, {
  headers: token ? { Authorization: \`Bearer \${token}\` } : {},
});

if (!res.ok) {
  throw new Error((await res.json()).detail ?? "Request gagal");
}

const users = await res.json();`,
          },
          {
            type: "list",
            items: [
              "Backend dikonfigurasi mengizinkan origin http://localhost:3000, jadi request dari Next.js tidak diblokir browser.",
              "Jangan pernah memanggil API dari server component memakai localStorage karena tidak ada di server.",
              "Simpan token di httpOnly cookie lebih aman daripada localStorage dari sisi XSS.",
              "Pastikan NEXT_PUBLIC_API_URL ada di environment frontend kalau base URL dipakai di banyak tempat.",
            ],
          },
        ],
      },
      {
        id: "pitfalls",
        title: "18. Kesalahan umum",
        blocks: [
          {
            type: "list",
            items: [
              "Menulis password user dalam bentuk plain text karena malas hash.",
              "Menaruh hashed_password di schema response sehingga ikut terkirim ke client.",
              "Lupa server_default pada kolom timestamp sehingga created_time null saat insert manual.",
              "Memakai passlib 1.7.4 dengan bcrypt versi terbaru dan mendapat AttributeError __about__.",
              "Menjalankan create_all lalu mengira migrasi tidak perlu sama sekali.",
              "Menerima JSON di endpoint login, lalu tombol Authorize di Swagger tidak bisa dipakai.",
              "Menaruh allow_origins=['*'] bersama allow_credentials=True, yang ditolak browser.",
              "Tidak mengimpor model di alembic/env.py sehingga autogenerate selalu menghasilkan tabel kosong.",
              "Mencari user hanya dari token tanpa cek database, sehingga user yang sudah di-disable tetap punya akses.",
              "Menjalankan uvicorn dari folder yang salah sehingga app tidak bisa diimpor.",
            ],
          },
          {
            type: "callout",
            title: "Urutan prioritas pengerjaan",
            content:
              "Selesaikan hashing password dan validasi token dulu, baru endpoint CRUD, baru CORS dan testing frontend. Latihan ini urutan yang sama dengan yang dipakai pada project app builder: correctness data lebih dulu, kemudian interaksi, terakhir visual polish.",
          },
        ],
      },
      {
        id: "next-step",
        title: "19. Apa yang perlu ditambahkan berikutnya",
        blocks: [
          {
            type: "steps",
            items: [
              "Tambahkan role dan permission check supaya endpoint tidak terbuka untuk semua user.",
              "Tambahkan refresh token agar user tidak perlu login ulang setiap 60 menit.",
              "Tambahkan pagination berbasis keyset untuk dataset yang jauh lebih besar.",
              "Tambahkan pytest dan httpx untuk tes otomatis endpoint.",
              "Pindahkan hash dari Argon2 ke argon2 dengan parameter cost yang lebih tinggi untuk production.",
              "Tambahkan rate limit pada endpoint login untuk menahan serangan brute force.",
            ],
          },
          {
            type: "paragraph",
            content:
              "Semua tambahan itu tidak mengubah struktur yang sudah dibuat. Config, session, model, dan schema sudah cukup stabil untuk menjadi fondasi, sehingga penetration fitur besar tidak perlu mengubah arsitektur.",
          },
        ],
      },
    ],
  },
  {
    slug: "membangun-app-builder-react-flow-drag-drop",
    title: "Membangun App Builder dengan React Flow: Drag-and-Drop, Layout, dan Database",
    excerpt:
      "Panduan rinci untuk mengubah canvas React Flow menjadi editor aplikasi: node, edge, context menu, properties, layout, routing, dan penyimpanan data.",
    category: "Arsitektur",
    publishedAt: "2026-09-24",
    readTime: "15 menit",
    icon: "layout",
    colorPalette: "blue",
    sections: [
      {
        id: "visi",
        title: "1. Visi: dari workflow editor menjadi app builder",
        blocks: [
          {
            type: "paragraph",
            content:
              "React Flow awalnya dipakai untuk menampilkan diagram node dan edge. Untuk dijadikan app builder, canvas tidak hanya menampilkan relasi; canvas juga menjadi tempat user menyusun layout, memilih komponen, mengatur properties, dan mendefinisikan aksi ketika aplikasi dijalankan.",
          },
          {
            type: "callout",
            title: "Prinsip utama",
            content:
              "Pisahkan data editor dari data aplikasi. Editor menyimpan node, edge, dan konfigurasi layout. Runtime membaca konfigurasi itu untuk merender aplikasi tanpa editor.",
          },
          {
            type: "list",
            items: [
              "Sisi kiri canvas menjadi workspace untuk menyusun screen dan component.",
              "Sidebar kiri menjadi palette component, data source, atau template.",
              "Context menu menjadi tempat user memberikan action pada node, table, atau component.",
              "Properties panel menjadi editor konfigurasi component yang sedang dipilih.",
              "Preview menjadi aplikasi runtime yang dapat diuji tanpa menyimpan perubahan.",
            ],
          },
        ],
      },
      {
        id: "arsitektur",
        title: "2. Arsitektur aplikasi",
        blocks: [
          {
            type: "paragraph",
            content:
              "Gunakan beberapa lapisan yang terpisah. Lapisan data menyimpan canonical state, lapisan editor mengubah state tersebut, dan lapisan runtime merender state menjadi UI. Pemisahan ini mencegah business logic bercampur dengan visual editor.",
          },
          {
            type: "code",
            language: "text",
            content: `App Builder
├── Data Layer
│   ├── canvases
│   ├── canvas_nodes
│   ├── canvas_ports
│   └── canvas_edges
├── Editor Layer
│   ├── React Flow Canvas
│   ├── Component Palette
│   ├── Properties Panel
│   └── Context Menu
└── Runtime Layer
    ├── App Shell
    ├── Router
    ├── Component Renderer
    └── Action Handler`,
          },
          {
            type: "table",
            columns: ["Lapisan", "Tanggung jawab"],
            rows: [
              ["Data Layer", "Menyimpan canvas, node, port, edge, dan konfigurasi aplikasi."],
              ["Editor Layer", "Mengubah data melalui drag, drop, selection, dan form properties."],
              ["Runtime Layer", "Menjalankan aplikasi hasil konfigurasi tanpa menampilkan editor."],
            ],
          },
        ],
      },
      {
        id: "model-data",
        title: "3. Model data minimum",
        blocks: [
          {
            type: "paragraph",
            content:
              "Untuk MVP, model database tidak perlu langsung memiliki user, workspace, asset, atau versioning. Empat tabel sudah cukup untuk menyimpan isi canvas secara normalisasi.",
          },
          {
            type: "code",
            language: "sql",
            content: `canvases
  └── canvas_nodes
        └── canvas_ports
  └── canvas_edges ── source_port_id / target_port_id`,
          },
          {
            type: "list",
            items: [
              "canvases menyimpan root diagram, nama, deskripsi, dan timestamp.",
              "canvas_nodes menyimpan posisi, ukuran, gambar, style, dan metadata node.",
              "canvas_ports menyimpan sisi, posisi persentase, jenis, dan arah port.",
              "canvas_edges menyimpan source port, target port, style, dan waypoint.",
              "client_key atau id frontend dipakai untuk upsert yang stabil.",
            ],
          },
          {
            type: "paragraph",
            content:
              "Direction efektif port sebaiknya dihitung dari edge yang terhubung. Field direction tetap dapat disimpan sebagai nilai yang dipilih user, tetapi view database dapat menampilkan effective direction untuk validasi dan debugging.",
          },
        ],
      },
      {
        id: "react-flow",
        title: "4. React Flow sebagai canvas editor",
        blocks: [
          {
            type: "paragraph",
            content:
              "Setiap node pada React Flow sebaiknya memiliki data domain, bukan hanya data visual. Data domain dapat berisi componentType, dataSourceId, layout, dan actions. Dengan begitu node tetap punya makna ketika editor dibuka kembali.",
          },
          {
            type: "code",
            language: "javascript",
            content: `const nodeTypes = {
  appPage: AppPageNode,
  table: DataTableNode,
  form: FormNode,
  chart: ChartNode,
  button: ActionButtonNode,
};

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  nodesDraggable={editorMode === "layout"}
  nodesConnectable={editorMode === "logic"}
  onNodesChange={applyNodeChanges}
  onEdgesChange={applyEdgeChanges}
  onConnect={createConnection}
  onSelectionChange={syncSelection}
/>`,
          },
          {
            type: "list",
            items: [
              "Node draggable untuk mengatur posisi dan layout component.",
              "Handle source dan target untuk membuat hubungan data atau layout.",
              "Edge menyimpan relasi logic, parent-child hierarchy, atau navigasi.",
              "Selection state menentukan component yang tampil di properties panel.",
              "Viewport zoom dan pan hanya mengubah tampilan, bukan data aplikasi.",
            ],
          },
        ],
      },
      {
        id: "drag-drop",
        title: "5. Alur drag-and-drop component",
        blocks: [
          {
            type: "paragraph",
            content:
              "Drag-and-drop memiliki dua jenis operasi. Pertama, user memindahkan node yang sudah ada. Kedua, user membuat node baru dari palette. Jangan menganggap keduanya sebagai event yang sama karena sumber datanya berbeda.",
          },
          {
            type: "steps",
            items: [
              "User membuka palette component dari sidebar kiri.",
              "User drag preview component ke area canvas.",
              "Runtime menghitung posisi drop dari event client coordinate.",
              "Posisi flow disimpan pada node baru.",
              "Node baru dipilih dan properties panel langsung terbuka.",
              "User mengisi data source, props, dan action.",
            ],
          },
          {
            type: "code",
            language: "javascript",
            content: `function onDrop(event) {
  event.preventDefault();
  const componentType = event.dataTransfer.getData("app-component");
  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  addComponent({
    componentType,
    position,
    parentId: selectedParentId,
  });
}`,
          },
          {
            type: "callout",
            title: "Hal yang perlu dihindari",
            content:
              "Jangan menyimpan posisi berdasarkan pixel viewport. Konversi event ke flow coordinate agar layout tetap sama ketika canvas di-zoom atau di-pan.",
          },
        ],
      },
      {
        id: "context-menu",
        title: "6. Context menu sebagai konfigurasi interaksi",
        blocks: [
          {
            type: "paragraph",
            content:
              "Context menu sebaiknya melekat pada component, bukan dibuat sebagai menu global. Table dapat memiliki menu baris, node dapat memiliki menu node, dan component library dapat memiliki menu template. Dengan begitu setiap context memiliki action yang relevan.",
          },
          {
            type: "code",
            language: "json",
            content: `{
  "componentId": "table-orders",
  "contextMenu": {
    "items": [
      { "label": "Buka", "action": "navigate" },
      { "label": "Duplikat", "action": "duplicateComponent" },
      { "label": "Hapus", "action": "deleteComponent", "color": "red" }
    ]
  }
}`,
          },
          {
            type: "list",
            items: [
              "Buka detail atau pindah ke route tujuan.",
              "Duplikat component beserta konfigurasi properties.",
              "Tambah child component di dalam container.",
              "Hapus component setelah konfirmasi.",
              "Copy konfigurasi JSON untuk template berikutnya.",
            ],
          },
        ],
      },
      {
        id: "layout-routing",
        title: "7. Layout, sidebar, navbar, dan routing",
        blocks: [
          {
            type: "paragraph",
            content:
              "Layout app sebaiknya disimpan sebagai konfigurasi terpisah dari component tree. Dengan begitu user dapat mengganti sidebar menjadi sidebar kanan, mengunci navbar, atau memakai layout full canvas tanpa mengubah isi page.",
          },
          {
            type: "code",
            language: "json",
            content: `{
  "layout": "app-shell",
  "navigation": {
    "navbar": { "title": "Workflow Manager" },
    "sidebar": {
      "position": "left",
      "items": [
        { "label": "Dashboard", "route": "/dashboard" },
        { "label": "Canvas", "route": "/canvases" }
      ]
    }
  },
  "content": ["page-home"]
}`,
          },
          {
            type: "paragraph",
            content:
              "Runtime dapat memakai route generik seperti /app/[...slug]. Route menerima slug, mencari page configuration, lalu merender layout dan component tree. Untuk MVP, route Next.js eksplisit masih lebih mudah dipahami.",
          },
        ],
      },
      {
        id: "properties",
        title: "8. Properties panel dan dynamic form",
        blocks: [
          {
            type: "paragraph",
            content:
              "Properties panel tidak harus dibuat untuk setiap component secara manual. Buat schema properties yang dapat dideskripsikan sebagai data, lalu render field berdasarkan tipe field.",
          },
          {
            type: "code",
            language: "json",
            content: `{
  "label": "Table Orders",
  "fields": [
    { "key": "dataSource", "type": "select", "label": "Data Source" },
    { "key": "pageSize", "type": "number", "label": "Rows per page" },
    { "key": "showFilters", "type": "boolean", "label": "Show filters" }
  ]
}`,
          },
          {
            type: "list",
            items: [
              "Field text, number, select, boolean, color, dan JSON.",
              "Validation dilakukan sebelum patch dikirim ke store.",
              "Perubahan position atau size melakukan update node secara lokal.",
              "Perubahan data source melakukan request ke backend.",
              "Panel menampilkan status dirty agar user tahu perubahan belum tersimpan.",
            ],
          },
        ],
      },
      {
        id: "preview",
        title: "9. Preview dan runtime mode",
        blocks: [
          {
            type: "paragraph",
            content:
              "Editor dan preview perlu berada pada dua mode. Mode editor menampilkan node, handle, selection, grid, dan properties. Mode runtime menampilkan aplikasi yang akan dilihat pengguna akhir.",
          },
          {
            type: "table",
            columns: ["Mode", "Yang ditampilkan"],
            rows: [
              ["Editor", "Canvas, node, edge, handle, palette, properties, dan context menu."],
              ["Preview", "App shell, route, data table, form, action, dan layout runtime."],
            ],
          },
          {
            type: "callout",
            title: "Gunakan state yang sama",
            content:
              "Preview harus membaca canonical graph state, bukan membuat salinan data. Dengan begitu perubahan yang terlihat di preview selalu sama dengan data yang akan disimpan.",
          },
        ],
      },
      {
        id: "save-backend",
        title: "10. Save payload dan backend",
        blocks: [
          {
            type: "paragraph",
            content:
              "Frontend dapat mengirim satu payload graph, tetapi backend tidak boleh langsung mempercayai semua field. Backend melakukan validasi canvas, node, port, dan edge dalam satu database transaction.",
          },
          {
            type: "code",
            language: "json",
            content: `{
  "canvas": {
    "id": "canvas-1",
    "name": "Order Management"
  },
  "nodes": [],
  "ports": [],
  "edges": [],
  "layout": {
    "navbar": {},
    "sidebar": {},
    "content": []
  }
}`,
          },
          {
            type: "list",
            items: [
              "Validasi node dan port owned by canvas yang sama.",
              "Validasi edge tidak membentuk self-loop.",
              "Validasi edge hanya menggunakan regular port.",
              "Upsert berdasarkan client key agar tidak membuat duplicate.",
              "Kembalikan graph hasil normalisasi setelah transaction berhasil.",
            ],
          },
        ],
      },
      {
        id: "roadmap",
        title: "11. Roadmap MVP",
        blocks: [
          {
            type: "steps",
            items: [
              "Selesaikan satu template App Shell dengan navbar, sidebar, dan content.",
              "Buat palette untuk Page, Table, Form, Button, dan Chart.",
              "Simpan component tree sebagai JSONB.",
              "Tambahkan selection dan properties panel.",
              "Tambahkan context menu untuk navigate, duplicate, dan delete.",
              "Tambahkan preview runtime tanpa editor chrome.",
              "Barukan tambahkan database eksternal, auth, dan multi-user.",
            ],
          },
          {
            type: "paragraph",
            content:
              "MVP berhasil ketika satu orang dapat membuat page, melihat preview, menyimpan canvas, lalu membuka kembali hasil yang sama. Jangan memulai dari real-time collaboration atau version history sebelum alur dasar ini stabil.",
          },
        ],
      },
      {
        id: "pitfalls",
        title: "12. Kesalahan umum",
        blocks: [
          {
            type: "list",
            items: [
              "Menyimpan posisi dalam pixel viewport, bukan flow coordinates.",
              "Mencampur data visual, data domain, dan data runtime dalam satu object tanpa batas.",
              "Menghapus node tanpa menghapus port dan edge terkait.",
              "Menjalankan delete action hanya dari frontend tanpa validasi server.",
              "Menyimpan semua properties sebagai satu object besar yang sulit dimigrasikan.",
              "Mengaktifkan editor controls dan runtime controls bersamaan.",
            ],
          },
          {
            type: "callout",
            title: "Urutan prioritas",
            content:
              "Utamakan correctness data, lalu layout, lalu interactions, baru visual polish. App builder yang elegan tetapi menyimpan state yang salah akan lebih sulit diperbaiki daripada editor yang sederhana tetapi konsisten.",
          },
        ],
      },
    ],
  },
];

export function getBlogPost(slug) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}
