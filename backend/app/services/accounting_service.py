from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from decimal import Decimal
from typing import List, Dict, Any
from app.schemas.accounting import JournalEntryCreate, AccountCreate, AccountResponse, JournalEntryResponse
from app.repositories.accounting_repository import AccountRepository, JournalEntryRepository
from app.models.accounting import AccountType, JournalEntryStatus
from sqlalchemy import select, func
from app.models.accounting import Account, JournalEntry, JournalEntryLine
import uuid

class AccountingService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.account_repo = AccountRepository()
        self.journal_repo = JournalEntryRepository()

    async def list_accounts(self) -> List[Account]:
        return await self.account_repo.get_all(self.session)

    async def get_trial_balance(self) -> Dict[str, Decimal]:
        accounts = await self.account_repo.get_all(self.session)
        trial_balance = {
            "ASSET": Decimal('0'),
            "LIABILITY": Decimal('0'),
            "EQUITY": Decimal('0'),
            "REVENUE": Decimal('0'),
            "EXPENSE": Decimal('0')
        }
        for account in accounts:
            trial_balance[account.account_type] += Decimal(str(account.current_balance))
        return trial_balance

    async def post_journal_entry(self, entry_in: JournalEntryCreate) -> JournalEntry:
        total_debit = sum(line.debit for line in entry_in.lines)
        total_credit = sum(line.credit for line in entry_in.lines)
        
        if total_debit != total_credit:
            raise HTTPException(status_code=400, detail="Debits and credits must be equal")

        new_entry = JournalEntry(
            id=str(uuid.uuid4()),
            date=entry_in.date,
            reference=entry_in.reference,
            description=entry_in.description,
            status=entry_in.status.value
        )
        self.session.add(new_entry)

        for line_in in entry_in.lines:
            account = await self.account_repo.get(self.session, line_in.account_id)
            if not account:
                raise HTTPException(status_code=404, detail=f"Account {line_in.account_id} not found")

            # Create line
            new_line = JournalEntryLine(
                id=str(uuid.uuid4()),
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

            account.current_balance = Decimal(str(account.current_balance)) + balance_change

        await self.session.commit()
        await self.session.refresh(new_entry)
        return new_entry
