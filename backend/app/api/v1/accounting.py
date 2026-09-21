from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict
from decimal import Decimal
from app.core.dependencies import get_db
from app.schemas.accounting import AccountResponse, AccountCreate, JournalEntryResponse, JournalEntryCreate
from app.services.accounting_service import AccountingService
from app.core.dependencies import require_role

router = APIRouter()

@router.get("/accounts", response_model=List[AccountResponse], dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def list_accounts(db: AsyncSession = Depends(get_db)):
    """List all accounts."""
    service = AccountingService(db)
    return await service.list_accounts()

@router.post("/accounts", response_model=AccountResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def create_account(account_in: AccountCreate, db: AsyncSession = Depends(get_db)):
    """Create a new account."""
    service = AccountingService(db)
    return await service.create_account(account_in)

@router.get("/trial-balance", response_model=Dict[str, Decimal], dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def get_trial_balance(db: AsyncSession = Depends(get_db)):
    """Get trial balance."""
    service = AccountingService(db)
    return await service.get_trial_balance()

@router.get("/journal-entries", response_model=List[JournalEntryResponse], dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def list_journal_entries(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """List all journal entries."""
    service = AccountingService(db)
    return await service.list_journal_entries(skip=skip, limit=limit)

@router.post("/journal-entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role(["SUPER_ADMIN", "MANAGER", "ACCOUNTANT"]))])
async def post_journal_entry(entry_in: JournalEntryCreate, db: AsyncSession = Depends(get_db)):
    """Post a journal entry."""
    service = AccountingService(db)
    return await service.post_journal_entry(entry_in)
