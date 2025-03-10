from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from config import get_settings
from models import Base

settings = get_settings()

DATABASE_URL = f"postgresql+asyncpg://{settings.pg_db_user}:{settings.pg_db_password}@{settings.pg_db_host}:{settings.pg_db_port}/{settings.pg_db_name}"

engine = create_async_engine(DATABASE_URL, echo=True)

# NOTE: ignore LSP error
async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    # NOTE: ignore LSP error
    async with async_session() as session:
        yield session
