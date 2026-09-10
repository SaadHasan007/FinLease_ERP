"""Authentication service — login, register, token management."""
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    ValidationException,
)
from app.core.logging_config import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

logger = get_logger("auth_service")

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30


class AuthService:
    """Handles authentication workflows."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.role_repo = RoleRepository(session)

    async def register(self, data: RegisterRequest) -> User:
        """Register a new user."""
        if await self.user_repo.email_exists(data.email):
            raise ConflictException(
                message=f"Email '{data.email}' is already registered.",
                code="USER_002",
            )

        # Resolve roles
        roles = await self.role_repo.get_by_names(data.role_names)
        if len(roles) != len(data.role_names):
            found = {r.name for r in roles}
            missing = set(data.role_names) - found
            raise ValidationException(
                message=f"Roles not found: {', '.join(missing)}",
                code="ROLE_001",
            )

        user = User(
            email=data.email,
            password_hash=hash_password(data.password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            status="ACTIVE",
        )
        user.roles = roles

        created_user = await self.user_repo.create(user)
        logger.info("User registered: %s", created_user.email)
        return created_user

    async def login(self, data: LoginRequest) -> TokenResponse:
        """Authenticate user and return JWT tokens."""
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise UnauthorizedException("Invalid email or password.")

        # Check lockout
        if user.locked_until and user.locked_until > datetime.now(timezone.utc):
            raise UnauthorizedException(
                "Account is temporarily locked due to too many failed attempts."
            )

        # Verify password
        if not verify_password(data.password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                from datetime import timedelta
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
                logger.warning("Account locked: %s", user.email)
            await self.session.flush()
            raise UnauthorizedException("Invalid email or password.")

        if user.status != "ACTIVE":
            raise UnauthorizedException(f"Account is {user.status.lower()}.")

        # Reset failed attempts and update last login
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login_at = datetime.now(timezone.utc)
        await self.session.flush()

        # Generate tokens
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "roles": user.role_names,
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        logger.info("User logged in: %s", user.email)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Issue a new access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type for refresh.")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Token missing subject.")

        import uuid
        user = await self.user_repo.get_by_id_with_roles(uuid.UUID(user_id))
        if not user or user.status != "ACTIVE":
            raise UnauthorizedException("User not found or inactive.")

        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "roles": user.role_names,
        }
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
        )
