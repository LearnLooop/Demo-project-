import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./courseweaver.db")

# Render gives postgresql:// but SQLAlchemy async needs postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# SQLite needs check_same_thread, PostgreSQL doesn't
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    connect_args=connect_args
)

async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    logger.info("Database driver ready. Relational schema managed by Alembic.")

async def close_db():
    if engine is not None:
        await engine.dispose()
        logger.info("Database connection closed")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
