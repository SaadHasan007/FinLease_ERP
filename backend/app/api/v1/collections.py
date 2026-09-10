from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.dependencies import get_db, require_role
from app.schemas.collection import CollectionCaseCreate, CollectionCaseUpdate, CollectionCaseResponse, CollectionActionCreate, CollectionActionResponse
from app.services.collection_service import CollectionService

router = APIRouter(prefix="/collections", tags=["collections"])

@router.post("/cases", response_model=CollectionCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(case_in: CollectionCaseCreate, db: AsyncSession = Depends(get_db)):
    service = CollectionService(db)
    return await service.create_case(case_in)

@router.get("/cases", response_model=List[CollectionCaseResponse])
async def get_all_cases(db: AsyncSession = Depends(get_db)):
    service = CollectionService(db)
    return await service.get_all_cases()

@router.get("/cases/{case_id}", response_model=CollectionCaseResponse)
async def get_case(case_id: int, db: AsyncSession = Depends(get_db)):
    service = CollectionService(db)
    case = await service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Collection case not found")
    return case

@router.put("/cases/{case_id}", response_model=CollectionCaseResponse)
async def update_case(case_id: int, case_in: CollectionCaseUpdate, db: AsyncSession = Depends(get_db)):
    service = CollectionService(db)
    case = await service.update_case(case_id, case_in)
    if not case:
        raise HTTPException(status_code=404, detail="Collection case not found")
    return case

@router.post("/actions", response_model=CollectionActionResponse, status_code=status.HTTP_201_CREATED)
async def create_action(action_in: CollectionActionCreate, db: AsyncSession = Depends(get_db)):
    service = CollectionService(db)
    return await service.create_action(action_in)

@router.get("/actions", response_model=List[CollectionActionResponse])
async def get_all_actions(db: AsyncSession = Depends(get_db)):
    service = CollectionService(db)
    return await service.get_all_actions()
