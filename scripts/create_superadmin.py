"""Script to create the initial super admin user.

Usage:
    python -m scripts.create_superadmin
"""
import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.security import hash_password
from app.db.session import async_session_factory
from app.models.user import Role, User


SUPERADMIN_EMAIL = os.getenv("SUPERADMIN_EMAIL", "admin@finlease.com")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "Admin@123!")

DEFAULT_ROLES = [
    ("SUPER_ADMIN", "Full system access"),
    ("FINANCE_OFFICER", "Finance operations"),
    ("CREDIT_OFFICER", "Credit assessment and approval"),
    ("LEASING_OFFICER", "Asset and leasing management"),
    ("COLLECTIONS_OFFICER", "Overdue account management"),
    ("ACCOUNTANT", "Financial records and reporting"),
    ("MANAGER", "Operations oversight and approvals"),
    ("CUSTOMER", "External customer access"),
]


async def create_superadmin() -> None:
    """Seed roles and create the super admin user."""
    async with async_session_factory() as session:
        async with session.begin():
            from sqlalchemy import select

            # Seed roles
            for role_name, description in DEFAULT_ROLES:
                existing = await session.execute(
                    select(Role).where(Role.name == role_name)
                )
                if not existing.scalar_one_or_none():
                    session.add(Role(
                        name=role_name,
                        description=description,
                        is_system=True,
                    ))
                    print(f"  Created role: {role_name}")

            await session.flush()

            # Check if admin exists
            result = await session.execute(
                select(User).where(User.email == SUPERADMIN_EMAIL)
            )
            if result.scalar_one_or_none():
                print(f"Super admin already exists: {SUPERADMIN_EMAIL}")
                return

            # Get SUPER_ADMIN role
            role_result = await session.execute(
                select(Role).where(Role.name == "SUPER_ADMIN")
            )
            admin_role = role_result.scalar_one()

            admin = User(
                email=SUPERADMIN_EMAIL,
                password_hash=hash_password(SUPERADMIN_PASSWORD),
                first_name="Super",
                last_name="Admin",
                status="ACTIVE",
            )
            admin.roles = [admin_role]
            session.add(admin)

            print(f"Super admin created: {SUPERADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(create_superadmin())
