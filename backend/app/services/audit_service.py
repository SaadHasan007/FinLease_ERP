"""Audit logging service — records important system events."""
import uuid
from typing import Any

from app.core.logging_config import get_logger

logger = get_logger("audit")


class AuditService:
    """Records audit events. In Phase 1, logs to structured logger.
    In later phases, persists to audit_logs table."""

    @staticmethod
    async def log(
        action: str,
        entity_name: str,
        entity_id: uuid.UUID | str | None = None,
        performed_by: uuid.UUID | str | None = None,
        old_values: dict[str, Any] | None = None,
        new_values: dict[str, Any] | None = None,
        ip_address: str | None = None,
    ) -> None:
        """Record an audit event."""
        logger.info(
            "AUDIT | action=%s entity=%s entity_id=%s actor=%s",
            action,
            entity_name,
            entity_id,
            performed_by,
            extra={
                "action": action,
                "entity_name": entity_name,
                "entity_id": str(entity_id) if entity_id else None,
                "performed_by": str(performed_by) if performed_by else None,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": ip_address,
            },
        )
