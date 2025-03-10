import asyncio
from datetime import datetime

import aiohttp
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import CVEChange

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cvehistory/2.0"
ENTRIES_TO_FETCH = 200000
RESULTS_PER_PAGE = 5000
DELAY_BETWEEN_REQUESTS = 0

async def fetch_nvd_data(session: aiohttp.ClientSession, start_index: int):
    url = f"{NVD_API_URL}/?resultsPerPage={RESULTS_PER_PAGE}&startIndex={start_index}"
    async with session.get(url) as response:
        if response.status == 200:
            return await response.json()
        else:
            error_message = f"Failed to fetch data at start_index {start_index}. " \
                            f"Status: {response.status}, Reason: {await response.text()}"
            raise RuntimeError(error_message)

async def store_cve_data(db: AsyncSession, cve_data):
    if not cve_data or "cveChanges" not in cve_data:
        return

    records = [
        CVEChange(
            cve_id=change["change"]["cveId"],
            event_name=change["change"]["eventName"],
            source_identifier=change["change"]["sourceIdentifier"],
            created=datetime.strptime(change["change"]["created"], "%Y-%m-%dT%H:%M:%S.%f"),
            details=change["change"]["details"],
        )
        for change in cve_data["cveChanges"]
    ]
    db.add_all(records)
    await db.commit()

async def fetch_and_store_cve_data():
    async with aiohttp.ClientSession() as session:
        async for db in get_db():
            await db.execute(CVEChange.__table__.delete())
            for start_index in range(0, ENTRIES_TO_FETCH, RESULTS_PER_PAGE):
                data = await fetch_nvd_data(session, start_index)
                await store_cve_data(db, data)
                await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
