"""
TwinThink Capability-Based Access Control (M3)
Implements granular segment-level delegation tokens and revocation checks.
"""

import uuid
import json
import datetime
from typing import List, Dict, Any, Optional, Tuple, Set
from pydantic import BaseModel, Field

from .identity import verify_signature, Keypair

VALID_PERMISSIONS = {
    "read:envelope",
    "read:design",
    "read:bom",
    "read:manufacturing",
    "read:evidence",
    "read:financials",
    "read:attachments",
    "write:tests",
    "write:metadata"
}

class CapabilityToken(BaseModel):
    token_id: str = Field(default_factory=lambda: f"cap_{uuid.uuid4().hex[:12]}")
    subject: str  # did:twin:<hex_pubkey> of grantee
    twin_id: str
    permissions: List[str]  # e.g. ["read:design", "read:bom"]
    issued_by: str  # did:twin:<hex_pubkey> of creator/granter
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    expires_at: Optional[str] = None  # ISO-8601 or None for non-expiring
    signature: str = ""  # Ed25519 signature by issued_by

    def to_signable_payload(self) -> Dict[str, Any]:
        return {
            "token_id": self.token_id,
            "subject": self.subject,
            "twin_id": self.twin_id,
            "permissions": sorted(self.permissions),
            "issued_by": self.issued_by,
            "created_at": self.created_at,
            "expires_at": self.expires_at
        }

class RevocationRecord(BaseModel):
    token_id: str
    revoked_by: str
    revoked_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    reason: Optional[str] = "Revoked by issuer"

def issue_capability(
    issuer_keypair: Keypair,
    subject_did: str,
    twin_id: str,
    permissions: List[str],
    expires_in_seconds: Optional[int] = None,
    expires_at: Optional[str] = None
) -> CapabilityToken:
    """Issues a cryptographically signed CapabilityToken to a subject DID."""
    invalid_perms = [p for p in permissions if p not in VALID_PERMISSIONS]
    if invalid_perms:
        raise ValueError(f"Invalid permission scopes requested: {invalid_perms}")

    exp_str = expires_at
    if exp_str is None and expires_in_seconds is not None:
        dt = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=expires_in_seconds)
        exp_str = dt.isoformat()

    token = CapabilityToken(
        subject=subject_did,
        twin_id=twin_id,
        permissions=sorted(permissions),
        issued_by=issuer_keypair.did,
        expires_at=exp_str
    )
    token.signature = issuer_keypair.sign(token.to_signable_payload())
    return token

def verify_capability(
    token: CapabilityToken,
    required_permission: Optional[str] = None,
    revocation_set: Optional[Set[str]] = None,
    target_twin_id: Optional[str] = None,
    expected_subject_did: Optional[str] = None,
    reference_time: Optional[datetime.datetime] = None
) -> Tuple[bool, Optional[str]]:
    """
    Verifies that a CapabilityToken is:
    1. Signed correctly by issued_by.
    2. Not revoked.
    3. Not expired.
    4. Matches target twin_id and subject if specified.
    5. Includes the required_permission scope.
    """
    # 1. Signature
    if not token.signature:
        return False, "Missing capability signature"
    if not verify_signature(token.issued_by, token.signature, token.to_signable_payload()):
        return False, "Invalid capability token signature"

    # 2. Revocation
    if revocation_set and token.token_id in revocation_set:
        return False, f"Capability token {token.token_id} has been revoked"

    # 3. Expiration
    if token.expires_at:
        try:
            exp_dt = datetime.datetime.fromisoformat(token.expires_at)
            now_dt = reference_time or datetime.datetime.now(datetime.timezone.utc)
            if now_dt > exp_dt:
                return False, f"Capability token expired at {token.expires_at}"
        except Exception as e:
            return False, f"Invalid expiration timestamp format: {e}"

    # 4. Target constraints
    if target_twin_id and token.twin_id != target_twin_id:
        return False, f"Capability granted for twin {token.twin_id}, not {target_twin_id}"
    if expected_subject_did and token.subject != expected_subject_did:
        return False, f"Capability granted to subject {token.subject}, not {expected_subject_did}"

    # 5. Permission scope
    if required_permission and required_permission not in token.permissions:
        return False, f"Capability lacks required scope '{required_permission}' (has: {token.permissions})"

    return True, None
