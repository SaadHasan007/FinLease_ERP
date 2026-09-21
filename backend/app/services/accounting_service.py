from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from decimal import Decimal
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.schemas.accounting import JournalEntryCreate, AccountCreate, AccountResponse, JournalEntryResponse
from app.repositories.accounting_repository import AccountRepository, JournalEntryRepository
from app.models.accounting import AccountType, JournalEntryStatus, Account, JournalEntry, JournalEntryLine

class AccountingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.account_repo = AccountRepository(session)
        self.journal_repo = JournalEntryRepository(session)

    async def list_accounts(self) -> List[Account]:
        return await self.account_repo.get_all()

    async def create_account(self, account_in: AccountCreate) -> Account:
        existing = await self.account_repo.get_by_code(account_in.code) if hasattr(self.account_repo, "get_by_code") else None
        account = Account(
            code=account_in.code,
            name=account_in.name,
            account_type=account_in.account_type,
            current_balance=account_in.current_balance
        )
        return await self.account_repo.create(account)

    async def list_journal_entries(self, skip: int = 0, limit: int = 100) -> List[JournalEntry]:
        return await self.journal_repo.get_all_with_lines(offset=skip, limit=limit)

    async def get_trial_balance(self) -> Dict[str, Decimal]:
        accounts = await self.account_repo.get_all()
        trial_balance = {
            "ASSET": Decimal('0'),
            "LIABILITY": Decimal('0'),
            "EQUITY": Decimal('0'),
            "REVENUE": Decimal('0'),
            "EXPENSE": Decimal('0')
        }
        for account in accounts:
            if account.account_type in trial_balance:
                trial_balance[account.account_type] += Decimal(str(account.current_balance or 0))
        return trial_balance

    async def post_journal_entry(self, entry_in: JournalEntryCreate) -> JournalEntry:
        total_debit = sum(line.debit for line in entry_in.lines)
        total_credit = sum(line.credit for line in entry_in.lines)
        
        if total_debit != total_credit:
            raise HTTPException(status_code=400, detail="Debits and credits must be equal")

        new_entry = JournalEntry(
            date=entry_in.date,
            reference=entry_in.reference,
            description=entry_in.description,
            status=entry_in.status if isinstance(entry_in.status, str) else entry_in.status.value
        )
        self.session.add(new_entry)
        await self.session.flush()

        for line_in in entry_in.lines:
            account = await self.account_repo.get_by_id(line_in.account_id)
            if not account:
                raise HTTPException(status_code=404, detail=f"Account {line_in.account_id} not found")

            # Create line
            new_line = JournalEntryLine(
                journal_entry_id=new_entry.id,
                account_id=account.id,
                debit=line_in.debit,
                credit=line_in.credit
            )
            self.session.add(new_line)

            # Update account balance
            # Assets and Expenses increase with Debits
            # Liabilities, Equity, and Revenue increase with Credits
            balance_change = line_in.debit - line_in.credit
            if account.account_type in [AccountType.LIABILITY.value, AccountType.EQUITY.value, AccountType.REVENUE.value]:
                balance_change = line_in.credit - line_in.debit

            account.current_balance = Decimal(str(account.current_balance or 0)) + balance_change

        await self.session.flush()

        # Reload with lines
        stmt = select(JournalEntry).options(selectinload(JournalEntry.lines)).where(JournalEntry.id == new_entry.id)
        res = await self.session.execute(stmt)
        return res.scalar_one()
