"""Seed database with realistic demo records across all FinLease ERP modules."""
import asyncio
import datetime
import logging
import os
import sys
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.models.base import Base
from app.models.user import Role, User
from app.models.customer import Customer, CustomerType, CustomerStatus, RiskCategory
from app.models.asset import Asset, AssetCategory, AssetStatus
from app.models.application import FinanceApplication, ApplicationDecision
from app.models.contract import Contract
from app.models.payment import PaymentSchedule
from app.models.accounting import Account, JournalEntry, JournalEntryLine
from app.models.collection import CollectionCase, CollectionAction
import app.db.base  # noqa: F401

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


async def seed_database() -> None:
    """Seed comprehensive dataset for local development and demos."""
    db_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    engine_kwargs = {"echo": False}
    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        
    engine = create_async_engine(db_url, **engine_kwargs)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    logger.info("Starting database seed on: %s", db_url)

    async with session_factory() as session:
        # 1. Seed Roles
        role_data = [
            ("SUPER_ADMIN", "Full system administrative access"),
            ("FINANCE_OFFICER", "Financial operations and ledger management"),
            ("CREDIT_OFFICER", "Credit evaluation and risk underwriting"),
            ("LEASING_OFFICER", "Origination and asset leasing"),
            ("COLLECTIONS_OFFICER", "Collections and recovery tracking"),
            ("ACCOUNTANT", "General ledger and financial statements"),
            ("MANAGER", "Executive oversight and high-tier approvals"),
            ("CUSTOMER", "External portal access"),
        ]
        roles = {}
        for name, desc in role_data:
            existing = (await session.execute(select(Role).where(Role.name == name))).scalar_one_or_none()
            if not existing:
                existing = Role(name=name, description=desc, is_system=True)
                session.add(existing)
                await session.flush()
            roles[name] = existing

        # 2. Seed Super Admin User
        admin = (await session.execute(select(User).where(User.email == "admin@finlease.com"))).scalar_one_or_none()
        if not admin:
            admin = User(
                email="admin@finlease.com",
                password_hash=hash_password("Admin@123!"),
                first_name="Super",
                last_name="Admin",
                status="ACTIVE",
                roles=[roles["SUPER_ADMIN"], roles["MANAGER"]],
            )
            session.add(admin)
            await session.flush()

        # 3. Seed Chart of Accounts
        chart_of_accounts = [
            ("1010", "Cash & Operating Bank", "ASSET", Decimal("2500000.0000")),
            ("1200", "Lease Receivables", "ASSET", Decimal("1850000.0000")),
            ("1500", "Leased Asset Portfolio", "ASSET", Decimal("4200000.0000")),
            ("2010", "Accounts Payable - Vendors", "LIABILITY", Decimal("350000.0000")),
            ("2200", "Customer Security Deposits", "LIABILITY", Decimal("180000.0000")),
            ("3010", "Owner Equity / Paid-in Capital", "EQUITY", Decimal("6000000.0000")),
            ("4010", "Lease Finance Income", "REVENUE", Decimal("420000.0000")),
            ("5010", "Asset Depreciation Expense", "EXPENSE", Decimal("95000.0000")),
            ("5020", "Bad Debt Provision Expense", "EXPENSE", Decimal("25000.0000")),
        ]
        accounts_map = {}
        for code, name, acc_type, init_bal in chart_of_accounts:
            existing = (await session.execute(select(Account).where(Account.code == code))).scalar_one_or_none()
            if not existing:
                existing = Account(code=code, name=name, account_type=acc_type, current_balance=init_bal)
                session.add(existing)
                await session.flush()
            accounts_map[code] = existing

        # 4. Seed Customers
        customers_data = [
            (CustomerType.CORPORATE, None, None, "Apex Logistics Corp", "billing@apexlogistics.com", "+1-415-555-0190", CustomerStatus.ACTIVE, RiskCategory.LOW),
            (CustomerType.CORPORATE, None, None, "Horizon BioTech LLC", "finance@horizonbio.com", "+1-650-555-0142", CustomerStatus.ACTIVE, RiskCategory.LOW),
            (CustomerType.INDIVIDUAL, "Marcus", "Vance", None, "m.vance@vancetech.io", "+1-212-555-0177", CustomerStatus.ACTIVE, RiskCategory.MEDIUM),
            (CustomerType.INDIVIDUAL, "Elena", "Rostova", None, "elena.rostova@gmail.com", "+1-312-555-0188", CustomerStatus.ACTIVE, RiskCategory.LOW),
            (CustomerType.CORPORATE, None, None, "Titan Heavy Industries", "accounts@titanheavy.com", "+1-713-555-0112", CustomerStatus.ACTIVE, RiskCategory.HIGH),
        ]
        created_customers = []
        for ctype, fname, lname, cname, email, phone, status, risk in customers_data:
            existing = (await session.execute(select(Customer).where(Customer.email == email))).scalar_one_or_none()
            if not existing:
                existing = Customer(
                    customer_type=ctype,
                    first_name=fname,
                    last_name=lname,
                    company_name=cname,
                    email=email,
                    phone=phone,
                    status=status,
                    risk_category=risk,
                )
                session.add(existing)
                await session.flush()
            created_customers.append(existing)

        # 5. Seed Assets
        assets_data = [
            (AssetCategory.VEHICLE, "Freightliner", "Cascadia Heavy Semi", 2024, "VIN-FL2024-88901", AssetStatus.ALLOCATED, Decimal("145000.0000")),
            (AssetCategory.EQUIPMENT, "Caterpillar", "CAT 320 Hydraulic Excavator", 2023, "CAT-320-EX-4412", AssetStatus.ALLOCATED, Decimal("210000.0000")),
            (AssetCategory.VEHICLE, "Tesla", "Model Y Long Range Fleet", 2024, "TSLA-MY-2024-9918", AssetStatus.AVAILABLE, Decimal("48500.0000")),
            (AssetCategory.REAL_ESTATE, "Prologis", "Bay Industrial Warehouse #4", 2022, "RE-IND-BAY4-7721", AssetStatus.ALLOCATED, Decimal("850000.0000")),
            (AssetCategory.EQUIPMENT, "Siemens", "Healthineers MRI Scanner", 2023, "SIEM-MRI-2023-112", AssetStatus.AVAILABLE, Decimal("420000.0000")),
        ]
        created_assets = []
        for cat, make, model, year, sn, astatus, val in assets_data:
            existing = (await session.execute(select(Asset).where(Asset.serial_number == sn))).scalar_one_or_none()
            if not existing:
                existing = Asset(
                    category=cat,
                    make=make,
                    model_name=model,
                    year=year,
                    serial_number=sn,
                    status=astatus,
                    current_value=val,
                )
                session.add(existing)
                await session.flush()
            created_assets.append(existing)

        # 6. Seed Finance Applications & Decisions
        if created_customers and created_assets:
            app1 = (await session.execute(
                select(FinanceApplication).where(FinanceApplication.customer_id == created_customers[0].id)
            )).scalars().first()
            if not app1:
                app1 = FinanceApplication(
                    customer_id=created_customers[0].id,
                    asset_id=created_assets[0].id,
                    requested_amount=Decimal("130000.0000"),
                    down_payment=Decimal("15000.0000"),
                    tenure_months=36,
                    status="APPROVED",
                    notes="Commercial fleet expansion. Credit verified with 3-year audited financials.",
                )
                session.add(app1)
                await session.flush()

                # Decision audit entry
                decision = ApplicationDecision(
                    application_id=app1.id,
                    previous_status="UNDER_REVIEW",
                    new_status="APPROVED",
                    reason="Strong balance sheet and Tier-1 logistics vendor contracts verified.",
                    decided_by=admin.id,
                    decided_at=datetime.datetime.now(datetime.timezone.utc),
                )
                session.add(decision)
                await session.flush()

            app2 = (await session.execute(
                select(FinanceApplication).where(FinanceApplication.customer_id == created_customers[1].id)
            )).scalars().first()
            if not app2:
                app2 = FinanceApplication(
                    customer_id=created_customers[1].id,
                    asset_id=created_assets[1].id,
                    requested_amount=Decimal("190000.0000"),
                    down_payment=Decimal("20000.0000"),
                    tenure_months=48,
                    status="UNDER_REVIEW",
                    notes="Specialized equipment lease pending collateral inspection.",
                )
                session.add(app2)
                await session.flush()

            # 7. Seed Contract & Payment Schedules for Approved Application
            if app1:
                existing_contract = (await session.execute(
                    select(Contract).where(Contract.application_id == app1.id)
                )).scalar_one_or_none()
                if not existing_contract:
                    today = datetime.date.today()
                    contract = Contract(
                        application_id=app1.id,
                        principal_amount=Decimal("130000.0000"),
                        interest_rate=Decimal("0.0550"),
                        tenure_months=36,
                        status="ACTIVE",
                        start_date=today.replace(day=1),
                        end_date=(today + datetime.timedelta(days=365 * 3)),
                    )
                    session.add(contract)
                    await session.flush()

                    # Seed 6 schedule installments
                    for i in range(1, 7):
                        due = today.replace(day=1) + datetime.timedelta(days=30 * i)
                        schedule = PaymentSchedule(
                            contract_id=contract.id,
                            due_date=due,
                            principal_amount=Decimal("3611.1100"),
                            interest_amount=Decimal("595.8300"),
                            total_amount=Decimal("4206.9400"),
                            status="PAID" if i <= 2 else ("OVERDUE" if i == 3 else "PENDING"),
                        )
                        session.add(schedule)
                    await session.flush()

                    # 8. Seed Collection Case for Overdue Installment
                    case = (await session.execute(
                        select(CollectionCase).where(CollectionCase.contract_id == contract.id)
                    )).scalar_one_or_none()
                    if not case:
                        case = CollectionCase(
                            contract_id=contract.id,
                            status="OPEN",
                            assigned_to=admin.id,
                            outstanding_amount=Decimal("4206.9400"),
                        )
                        session.add(case)
                        await session.flush()

                        action = CollectionAction(
                            case_id=case.id,
                            action_type="PHONE",
                            notes="Contacted CFO regarding 30-day past due installment. Promised payment next Friday.",
                            promise_amount=Decimal("4206.9400"),
                            promise_date=today + datetime.timedelta(days=7),
                            performed_by=admin.id,
                        )
                        session.add(action)
                        await session.flush()

            # 9. Seed Sample Journal Entry
            entry = (await session.execute(
                select(JournalEntry).where(JournalEntry.reference == "JE-2026-INIT")
            )).scalar_one_or_none()
            if not entry and "1010" in accounts_map and "1200" in accounts_map:
                entry = JournalEntry(
                    date=datetime.date.today(),
                    reference="JE-2026-INIT",
                    description="Initial capital allocation & receivables setup",
                    status="POSTED",
                )
                session.add(entry)
                await session.flush()

                line1 = JournalEntryLine(
                    journal_entry_id=entry.id,
                    account_id=accounts_map["1010"].id,
                    debit=Decimal("50000.0000"),
                    credit=Decimal("0.0000"),
                )
                line2 = JournalEntryLine(
                    journal_entry_id=entry.id,
                    account_id=accounts_map["1200"].id,
                    debit=Decimal("0.0000"),
                    credit=Decimal("50000.0000"),
                )
                session.add_all([line1, line2])
                await session.flush()

        await session.commit()
    await engine.dispose()
    logger.info("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_database())

