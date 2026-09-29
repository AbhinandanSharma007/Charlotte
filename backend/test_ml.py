import asyncio
from app.database import async_session, init_db
from app.services.seed import seed_demo_data
from app.ml.training import train_pipeline

async def test():
    await init_db()
    await seed_demo_data()
    async with async_session() as session:
        res = await train_pipeline(session, 'test-v1')
        print("Training successful:", res)

if __name__ == "__main__":
    asyncio.run(test())
