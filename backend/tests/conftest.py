import pytest
import pytest_asyncio
from httpx import AsyncClient
from server import app
from database import engine, Base
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import User, generate_uuid
from utils.auth import get_password_hash

# Use an in-memory or alternative db for tests if preferred, here we just show the structure

@pytest_asyncio.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def db_session():
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    user = User(
        id=generate_uuid(),
        email="test@courseweaver.com",
        password_hash=get_password_hash("password123"),
        name="Test User",
        role="student"
    )
    db_session.add(user)
    await db_session.commit()
    return user
