from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
from decimal import Decimal
from app.core.dependencies import get_db
from app.schemas.accounting import AccountResponse, JournalEntryResponse, JournalEntryCreate
from app.services.accounting_service import AccountingService
from app.core.dependencies import require_role

router = APIRouter()

@router.get("/accounts", response_model=List[AccountResponse], dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    """List all accounts."""
    service = AccountingService(db)
    return await service.list_accounts()

@router.get("/trial-balance", response_model=Dict[str, Decimal], dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def get_trial_balance(db: AsyncSession = Depends(get_db)):
    """Get trial balance."""
    service = AccountingService(db)
    return await service.get_trial_balance()

@router.post("/journal-entries", response_model=JournalEntryResponse, dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def post_journal_entry(entry_in: JournalEntryCreate, db: AsyncSession = Depends(get_db)):
    """Post a journal entry."""
    service = AccountingService(db)
    return await service.post_journal_entry(entry_in)
