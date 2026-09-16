"""
TwinThink Signed Revision Chains (M3)
Cryptographically chains Twin revisions (R0 -> R1 -> R2),
binding graph state, author identity, and parent continuity.
"""

import json
import hashlib
import datetime
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field

from .identity import verify_signature, Keypair

class TwinRevisionRecord(BaseModel):
    twin_id: str
    revision: str = "R0"
    parent_revision: Optional[str] = None  # None for R0, or hash of parent revision record
    graph_hash: str  # SHA-256 structural hash of canonical product graph
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    author_identity: str  # did:twin:<hex_pubkey>
    mutation_notes: Optional[str] = None
    signature: str = ""  # Ed25519 hex signature over canonical JSON payload

    def to_signable_payload(self) -> Dict[str, Any]:
        """Returns deterministic dictionary representation for signing/hashing."""
        return {
            "twin_id": self.twin_id,
            "revision": self.revision,
            "parent_revision": self.parent_revision,
            "graph_hash": self.graph_hash,
            "created_at": self.created_at,
            "author_identity": self.author_identity,
            "mutation_notes": self.mutation_notes
        }

    def compute_hash(self) -> str:
        """Computes deterministic SHA-256 commit hash of this signed revision."""
        payload = self.to_signable_payload()
        payload["signature"] = self.signature
        serialized = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

def create_signed_revision(
    twin_id: str,
    revision_name: str,
    graph_hash: str,
    keypair: Keypair,
    parent_revision_hash: Optional[str] = None,
    mutation_notes: Optional[str] = None,
    created_at: Optional[str] = None
) -> TwinRevisionRecord:
    """Creates and signs a new immutable TwinRevisionRecord."""
    rec = TwinRevisionRecord(
        twin_id=twin_id,
        revision=revision_name,
        parent_revision=parent_revision_hash,
        graph_hash=graph_hash,
        author_identity=keypair.did,
        mutation_notes=mutation_notes,
        created_at=created_at or datetime.datetime.now(datetime.timezone.utc).isoformat(),
        signature=""
    )
    sig = keypair.sign(rec.to_signable_payload())
    rec.signature = sig
    return rec

def verify_revision(record: TwinRevisionRecord, expected_author_did: Optional[str] = None) -> bool:
    """Verifies that a revision's signature is valid and matches its author identity."""
    if expected_author_did and record.author_identity != expected_author_did:
        return False
    if not record.signature:
        return False
    payload = record.to_signable_payload()
    return verify_signature(record.author_identity, record.signature, payload)

def verify_revision_chain(revisions: List[TwinRevisionRecord]) -> Tuple[bool, Optional[str]]:
    """
    Verifies a linear sequence of revisions (e.g. [R0, R1, R2]):
    1. Every revision's author signature is cryptographically valid.
    2. R0 has parent_revision == None.
    3. Every subsequent revision R_i points to the exact commit hash of R_{i-1}.
    """
    if not revisions:
        return False, "Empty revision list"

    # Verify R0
    r0 = revisions[0]
    if not verify_revision(r0):
        return False, f"Invalid signature on initial revision {r0.revision}"
    if r0.parent_revision is not None:
        return False, f"Initial revision {r0.revision} must have parent_revision == None"

    last_hash = r0.compute_hash()

    for i in range(1, len(revisions)):
        current = revisions[i]
        if not verify_revision(current):
            return False, f"Invalid signature on revision {current.revision} (index {i})"
        if current.parent_revision != last_hash:
            return False, (
                f"Broken lineage at revision {current.revision} (index {i}): "
                f"expected parent {last_hash[:12]}..., got {str(current.parent_revision)[:12]}..."
            )
        last_hash = current.compute_hash()

    return True, None
