"""Import all models here so Alembic can detect them."""
from app.models.base import Base, AuditMixin
from app.models.user import User, Role, Permission
from app.models.customer import Customer
from app.models.asset import Asset
from app.models.application import FinanceApplication, ApplicationDecision
from app.models.contract import Contract
from app.models.payment import PaymentSchedule
from app.models.accounting import Account, JournalEntry, JournalEntryLine
from app.models.collection import CollectionCase, CollectionAction
from app.models.notification import Notification
