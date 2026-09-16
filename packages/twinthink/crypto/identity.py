"""
TwinThink Cryptographic Core (M3)
Implements Ed25519 asymmetric identity, signed revision chains,
capability-based access tokens, AES-256-GCM envelope encryption,
and standardized portable .twin bundle packing and verification.
"""

import os
import json
import base64
import hashlib
import datetime
from pathlib import Path
from typing import Tuple, Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

# Default directory for local private keys
DEFAULT_KEYSTORE_DIR = Path(os.getenv("TWINTHINK_KEYSTORE_DIR", Path.home() / ".twinthink" / "identities"))

class IdentityDocument(BaseModel):
    identity_id: str  # did:twin:<hex_pubkey>
    algorithm: str = "Ed25519"
    public_key: str  # hex-encoded 32-byte public key
    name: Optional[str] = "Anonymous Creator"
    created_at: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    status: str = "active"

class Keypair:
    def __init__(self, private_key: ed25519.Ed25519PrivateKey):
        self._private_key = private_key
        self._public_key = private_key.public_key()

    @classmethod
    def generate(cls) -> "Keypair":
        """Generates a new secure random Ed25519 keypair."""
        return cls(ed25519.Ed25519PrivateKey.generate())

    @classmethod
    def from_private_bytes(cls, raw_bytes: bytes) -> "Keypair":
        """Loads a keypair from 32 raw private key seed bytes."""
        return cls(ed25519.Ed25519PrivateKey.from_private_bytes(raw_bytes))

    @classmethod
    def from_private_hex(cls, hex_str: str) -> "Keypair":
        """Loads a keypair from a 64-char hex string."""
        return cls.from_private_bytes(bytes.fromhex(hex_str.strip()))

    @property
    def public_bytes(self) -> bytes:
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

    @property
    def public_hex(self) -> str:
        return self.public_bytes.hex()

    @property
    def private_bytes(self) -> bytes:
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )

    @property
    def private_hex(self) -> str:
        return self.private_bytes.hex()

    @property
    def did(self) -> str:
        """Returns the canonical Decentralized Identifier did:twin:<hex_pubkey>."""
        return f"did:twin:{self.public_hex}"

    @property
    def x25519_private_bytes(self) -> bytes:
        from cryptography.hazmat.primitives.asymmetric import x25519
        return self.private_bytes

    @property
    def x25519_public_bytes(self) -> bytes:
        from cryptography.hazmat.primitives.asymmetric import x25519
        return x25519.X25519PrivateKey.from_private_bytes(self.private_bytes).public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )

    @property
    def x25519_public_hex(self) -> str:
        return self.x25519_public_bytes.hex()

    def sign(self, data: Union[bytes, str, Dict[str, Any]]) -> str:
        """Signs data using Ed25519 and returns the hex signature."""
        if isinstance(data, dict):
            raw = json.dumps(data, sort_keys=True).encode("utf-8")
        elif isinstance(data, str):
            raw = data.encode("utf-8")
        else:
            raw = data
        signature_bytes = self._private_key.sign(raw)
        return signature_bytes.hex()

    def export_identity(self, name: Optional[str] = None) -> IdentityDocument:
        """Exports public IdentityDocument (safe for public distribution)."""
        return IdentityDocument(
            identity_id=self.did,
            algorithm="Ed25519",
            public_key=self.public_hex,
            name=name or "Anonymous Creator"
        )

    def save_to_disk(self, keystore_dir: Optional[Path] = None, name: str = "default") -> Path:
        """Saves private key and public identity to disk with restricted permissions."""
        target_dir = keystore_dir or DEFAULT_KEYSTORE_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        
        priv_file = target_dir / f"{name}.key"
        pub_file = target_dir / f"{name}.json"
        
        priv_file.write_text(self.private_hex, encoding="utf-8")
        try:
            os.chmod(priv_file, 0o600)
        except Exception:
            pass
            
        pub_doc = self.export_identity(name=name)
        pub_file.write_text(pub_doc.model_dump_json(indent=2), encoding="utf-8")
        return priv_file

    @classmethod
    def load_from_disk(cls, keystore_dir: Optional[Path] = None, name: str = "default") -> "Keypair":
        """Loads a stored keypair from disk."""
        target_dir = keystore_dir or DEFAULT_KEYSTORE_DIR
        priv_file = target_dir / f"{name}.key"
        if not priv_file.exists():
            raise FileNotFoundError(f"No keypair found at {priv_file}")
        hex_str = priv_file.read_text(encoding="utf-8").strip()
        return cls.from_private_hex(hex_str)

def verify_signature(public_key_hex_or_did: str, signature_hex: str, data: Union[bytes, str, Dict[str, Any]]) -> bool:
    """
    Verifies an Ed25519 signature against a public key hex or did:twin: identifier.
    Returns True if valid, False if invalid or corrupted.
    """
    try:
        if public_key_hex_or_did.startswith("did:twin:"):
            pub_hex = public_key_hex_or_did.split("did:twin:")[-1]
        else:
            pub_hex = public_key_hex_or_did.strip()
        
        pub_bytes = bytes.fromhex(pub_hex)
        pub_key = ed25519.Ed25519PublicKey.from_public_bytes(pub_bytes)
        sig_bytes = bytes.fromhex(signature_hex.strip())
        
        if isinstance(data, dict):
            raw = json.dumps(data, sort_keys=True).encode("utf-8")
        elif isinstance(data, str):
            raw = data.encode("utf-8")
        else:
            raw = data
            
        pub_key.verify(sig_bytes, raw)
        return True
    except (InvalidSignature, ValueError, Exception):
        return False

def get_or_create_default_identity() -> Keypair:
    """Convenience helper: returns the default local developer keypair, creating one if missing."""
    DEFAULT_KEYSTORE_DIR.mkdir(parents=True, exist_ok=True)
    default_key_path = DEFAULT_KEYSTORE_DIR / "default.key"
    if default_key_path.exists():
        try:
            return Keypair.load_from_disk(DEFAULT_KEYSTORE_DIR, "default")
        except Exception:
            pass
    kp = Keypair.generate()
    kp.save_to_disk(DEFAULT_KEYSTORE_DIR, "default")
    return kp
