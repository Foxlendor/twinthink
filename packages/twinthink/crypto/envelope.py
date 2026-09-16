"""
TwinThink Envelope Encryption (M3)
Implements AES-256-GCM symmetric segment encryption and
X25519 ECDH key wrapping for capability-based selective disclosure.
"""

import os
import json
import base64
from typing import Dict, Any, Optional, Tuple, Union
from pydantic import BaseModel, Field

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes, serialization

class EncryptedSegment(BaseModel):
    segment_name: str  # e.g. "design", "evidence", "bom"
    algorithm: str = "AES-256-GCM"
    nonce_hex: str
    ciphertext_b64: str
    content_sha256: str  # SHA-256 of plaintext before encryption

class WrappedKey(BaseModel):
    recipient_did: str
    ephemeral_public_hex: str
    nonce_hex: str
    wrapped_key_hex: str

def generate_segment_key() -> bytes:
    """Generates a random 256-bit AES-GCM symmetric key."""
    return AESGCM.generate_key(bit_length=256)

def encrypt_segment(
    segment_name: str,
    data: Union[bytes, str, Dict[str, Any]],
    key_bytes: Optional[bytes] = None
) -> Tuple[EncryptedSegment, bytes]:
    """
    Encrypts a data segment using AES-256-GCM.
    Returns (EncryptedSegment metadata with ciphertext, the raw 32-byte key used).
    """
    if isinstance(data, dict):
        raw = json.dumps(data, sort_keys=True).encode("utf-8")
    elif isinstance(data, str):
        raw = data.encode("utf-8")
    else:
        raw = data

    import hashlib
    content_hash = hashlib.sha256(raw).hexdigest()
    
    key = key_bytes or generate_segment_key()
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, raw, None)

    segment = EncryptedSegment(
        segment_name=segment_name,
        algorithm="AES-256-GCM",
        nonce_hex=nonce.hex(),
        ciphertext_b64=base64.b64encode(ciphertext).decode("utf-8"),
        content_sha256=content_hash
    )
    return segment, key

def decrypt_segment(
    segment: EncryptedSegment,
    key_bytes: bytes
) -> bytes:
    """Decrypts an EncryptedSegment using the provided 32-byte key."""
    nonce = bytes.fromhex(segment.nonce_hex)
    ciphertext = base64.b64decode(segment.ciphertext_b64)
    aesgcm = AESGCM(key_bytes)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext

def wrap_key_for_recipient(
    segment_key: bytes,
    recipient_x25519_public_bytes: bytes,
    recipient_did: str
) -> WrappedKey:
    """Wraps a 32-byte segment key for a recipient's X25519 public key using ephemeral ECDH."""
    recip_pub = x25519.X25519PublicKey.from_public_bytes(recipient_x25519_public_bytes)
    ephem_priv = x25519.X25519PrivateKey.generate()
    
    shared = ephem_priv.exchange(recip_pub)
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"twinthink-segment-wrap"
    )
    wrapping_key = hkdf.derive(shared)
    
    nonce = os.urandom(12)
    aesgcm = AESGCM(wrapping_key)
    wrapped = aesgcm.encrypt(nonce, segment_key, None)
    
    ephem_pub_bytes = ephem_priv.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    
    return WrappedKey(
        recipient_did=recipient_did,
        ephemeral_public_hex=ephem_pub_bytes.hex(),
        nonce_hex=nonce.hex(),
        wrapped_key_hex=wrapped.hex()
    )

def unwrap_key_with_private_key(
    wrapped: WrappedKey,
    recipient_x25519_private_bytes: bytes
) -> bytes:
    """Unwraps a segment key using recipient's X25519 private key."""
    recip_priv = x25519.X25519PrivateKey.from_private_bytes(recipient_x25519_private_bytes)
    ephem_pub = x25519.X25519PublicKey.from_public_bytes(bytes.fromhex(wrapped.ephemeral_public_hex))
    
    shared = recip_priv.exchange(ephem_pub)
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"twinthink-segment-wrap"
    )
    wrapping_key = hkdf.derive(shared)
    
    nonce = bytes.fromhex(wrapped.nonce_hex)
    wrapped_bytes = bytes.fromhex(wrapped.wrapped_key_hex)
    aesgcm = AESGCM(wrapping_key)
    segment_key = aesgcm.decrypt(nonce, wrapped_bytes, None)
    return segment_key
