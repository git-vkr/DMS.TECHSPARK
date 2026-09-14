"""
MongoDB connection manager using Motor (async driver).
Handles connection failures gracefully for development.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

client: AsyncIOMotorClient = None
db: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    """Create MongoDB connection on app startup."""
    global client, db
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,  # 5s timeout instead of 30s
        )
        db = client[settings.MONGODB_DB_NAME]

        # Ping to verify the connection is actually alive
        await client.admin.command("ping")

        # Create indexes for users collection
        await db.users.create_index("phone", unique=True)
        await db.users.create_index("email", unique=True, sparse=True)

        print(f"[OK] Connected to MongoDB: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        print(f"[WARN] MongoDB connection failed: {e}")
        print("   The server will start, but database operations will fail.")
        print("   Install MongoDB locally or set MONGODB_URL to a MongoDB Atlas URI.")
        # Don't crash — allow the health endpoint and docs to still work
        db = None


async def close_mongo_connection():
    """Close MongoDB connection on app shutdown."""
    global client
    if client:
        client.close()
        print("[CLOSED] MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance. Raises if not connected."""
    if db is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="Database not available. Check MongoDB connection.",
        )
    return db
