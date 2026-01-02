from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Convert standard postgres URL to asyncpg format
db_url = settings.database_url
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Configure connection pooling for better performance
engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    pool_size=5,           # Number of connections to keep open
    max_overflow=10,       # Additional connections when pool is exhausted
    pool_pre_ping=True,    # Verify connections before use
    pool_recycle=300,      # Recycle connections after 5 minutes
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
