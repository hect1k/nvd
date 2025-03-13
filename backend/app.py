import csv
from io import StringIO
from typing import Annotated, Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import JSONResponse, StreamingResponse

import auth
import config
import database
import models
import utils

settings = config.get_settings()

app = FastAPI(
    title="CVE History API",
    description="An API for fetching, storing, and querying CVE history data from NVD.",
    version="1.0.0",
)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.init_db()
    await utils.fetch_and_store_cve_data()


#############################
## STATUS ENDPOINTS
#############################

@app.get("/", tags=["Status"], status_code=200)
async def welcome():
    return {"message": "Welcome to the CVE History API!"}

@app.get("/status", tags=["Status"], status_code=200)
async def status(db: AsyncSession = Depends(database.get_db)):
    try:
        # NOTE: ignore LSP error
        await db.get(models.CVEChange, 1)
        return {"status": "OK"}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}

#############################
## CVE ENDPOINTS
#############################

@app.get("/cves", tags=["CVE"], status_code=200, responses={401: {"model": models.ErrorResponse}, 500: {"model": models.ErrorResponse}})
async def get_cves(
    page: int = Query(1, ge=1, description="Page number"),
    cve_id: Optional[str] = Query(None, description="Filter by CVE ID"),
    event_name: Optional[str] = Query(None, description="Filter by Event Name"),
    db: AsyncSession = Depends(database.get_db),
    token: str = Depends(auth.oauth2_scheme),
):
    try:
        payload = auth.verify_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        result = await db.execute(select(models.User).where(models.User.email == payload["sub"]))
        existing_user = result.scalars().first()

        if existing_user is None:
            raise HTTPException(status_code=401, detail="Unauthorized")

        page_size = settings.max_page_size

        stmt = select(models.CVEChange).order_by(models.CVEChange.created.desc())

        if cve_id:
            stmt = stmt.where(models.CVEChange.cve_id.ilike(f"%{cve_id}%"))
        if event_name:
            stmt = stmt.where(models.CVEChange.event_name.ilike(f"%{event_name}%"))

        total_count = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar()

        stmt = stmt.offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(stmt)
        cves = result.scalars().all()

        return JSONResponse(status_code=200, content={
            "page": page,
            "page_size": page_size,
            "total_records": total_count,
            "total_pages": ((total_count if total_count else 0) + page_size - 1) // page_size,
            "cves": [cve.as_dict() for cve in cves]
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/export", tags=["CVE"], status_code=200, responses={401: {"model": models.ErrorResponse}, 500: {"model": models.ErrorResponse}})
async def export_cves(
    cve_id: Optional[str] = Query(None, description="Filter by CVE ID"),
    event_name: Optional[str] = Query(None, description="Filter by Event Name"),
    db: AsyncSession = Depends(database.get_db),
    token: str = Depends(auth.oauth2_scheme),
):
    try:
        payload = auth.verify_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        result = await db.execute(select(models.User).where(models.User.email == payload["sub"]))
        existing_user = result.scalars().first()

        if existing_user is None:
            raise HTTPException(status_code=401, detail="Unauthorized")

        stmt = select(models.CVEChange).order_by(models.CVEChange.created.desc())

        if cve_id:
            stmt = stmt.where(models.CVEChange.cve_id == cve_id)
        if event_name:
            stmt = stmt.where(models.CVEChange.event_name.ilike(f"%{event_name}%"))

        result = await db.execute(stmt)
        cves = result.scalars().all()

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "CVE ID", "Event Name", "Source Identifier", "Created", "Details"])

        for cve in cves:
            writer.writerow([
                cve.id, cve.cve_id, cve.event_name, 
                cve.source_identifier, cve.created, 
                cve.details if isinstance(cve.details, str) else str(cve.details)
            ])
        output.seek(0)
        return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=cve_export.csv"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats", tags=["CVE"], status_code=200, responses={500: {"model": models.ErrorResponse}})
async def get_stats(
    db: AsyncSession = Depends(database.get_db),
    token: str = Depends(auth.oauth2_scheme),
):
    try:
        payload = auth.verify_access_token(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        result = await db.execute(select(models.User).where(models.User.email == payload["sub"]))
        existing_user = result.scalars().first()

        if existing_user is None:
            raise HTTPException(status_code=401, detail="Unauthorized")

        stmt = select(
            models.CVEChange.event_name, 
            func.count(models.CVEChange.id)
        ).group_by(models.CVEChange.event_name)

        result = await db.execute(stmt)
        cves_per_event = {row.event_name: row.count for row in result.all()}

        stmt = select(
            func.date_trunc("month", models.CVEChange.created).label("month"), 
            func.count(models.CVEChange.id)
        ).group_by("month").order_by("month")

        result = await db.execute(stmt)
        cves_over_time = {row.month.strftime("%Y-%m"): row.count for row in result.all()}

        return {
            "cves_per_event": dict(cves_per_event),
            "cves_over_time": dict(cves_over_time)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#############################
## AUTH ENDPOINTS
#############################

@app.post(
    "/register",
    tags=["Auth"],
    status_code=201,
    responses={
        429: {"model": models.ErrorResponse},
        409: {"model": models.ErrorResponse},
        500: {"model": models.ErrorResponse},
    },
)
async def register(
    email: Annotated[str, Form()],
    password: Annotated[str, Form()],
    db: AsyncSession = Depends(database.get_db),
):
    result = await db.execute(select(models.User).where(models.User.email == email))
    existing_user = result.scalars().first()

    if existing_user is not None:
        raise HTTPException(status_code=409, detail="User already exists")

    hashed_password = auth.hash_password(password)
    new_user = models.User(email=email, hashed_password=hashed_password)
    db.add(new_user)

    try:
        await db.commit()
        await db.refresh(new_user)
        return JSONResponse(content={"message": "User registered successfully"}, status_code=201)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login", tags=["Auth"], status_code=200, responses={401: {"model": models.ErrorResponse}, 500: {"model": models.ErrorResponse}})
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(database.get_db),
):
    try:
        email = form_data.username
        password = form_data.password

        result = await db.execute(select(models.User).where(models.User.email == email))
        user = result.scalars().first() or None

        if user is None or not auth.verify_password(password, str(user.hashed_password)):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = auth.create_access_token({"sub": email})
        return JSONResponse(status_code=200, content={"access_token": token, "token_type": "bearer"})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
