"""
TwinThink Cryptographic Subsystem (M3)
Verifiable identity, signed revision chains, capability tokens,
AES-256-GCM envelope encryption, and portable .twin bundles.
"""

from .identity import (
    IdentityDocument,
    Keypair,
    verify_signature,
    get_or_create_default_identity,
    DEFAULT_KEYSTORE_DIR,
)

from .revision import (
    TwinRevisionRecord,
    create_signed_revision,
    verify_revision,
    verify_revision_chain,
)

from .capability import (
    CapabilityToken,
    RevocationRecord,
    issue_capability,
    verify_capability,
    VALID_PERMISSIONS,
)

from .envelope import (
    EncryptedSegment,
    WrappedKey,
    generate_segment_key,
    encrypt_segment,
    decrypt_segment,
    wrap_key_for_recipient,
    unwrap_key_with_private_key,
)

from .bundle import (
    pack_twin_bundle,
    verify_twin_bundle,
    TwinBundleVerificationResult,
)

__all__ = [
    "IdentityDocument",
    "Keypair",
    "verify_signature",
    "get_or_create_default_identity",
    "DEFAULT_KEYSTORE_DIR",
    "TwinRevisionRecord",
    "create_signed_revision",
    "verify_revision",
    "verify_revision_chain",
    "CapabilityToken",
    "RevocationRecord",
    "issue_capability",
    "verify_capability",
    "VALID_PERMISSIONS",
    "EncryptedSegment",
    "WrappedKey",
    "generate_segment_key",
    "encrypt_segment",
    "decrypt_segment",
    "wrap_key_for_recipient",
    "unwrap_key_with_private_key",
    "pack_twin_bundle",
    "verify_twin_bundle",
    "TwinBundleVerificationResult",
]
