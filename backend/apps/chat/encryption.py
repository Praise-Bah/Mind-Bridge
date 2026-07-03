"""AES-256 Fernet encryption for chat message content.

Uses Django's SECRET_KEY to derive a Fernet encryption key via PBKDF2.
Messages are encrypted at rest — encrypted on save, decrypted on read.
"""
import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings


def _get_fernet() -> Fernet:
    """Derive a Fernet key from Django's SECRET_KEY."""
    key_material = hashlib.pbkdf2_hmac(
        'sha256',
        settings.SECRET_KEY.encode(),
        b'mindbridge-chat-encryption-salt',
        iterations=100_000,
    )
    fernet_key = base64.urlsafe_b64encode(key_material[:32])
    return Fernet(fernet_key)


def encrypt_message(plaintext: str) -> str:
    """Encrypt a message string. Returns base64-encoded ciphertext."""
    if not plaintext:
        return plaintext
    f = _get_fernet()
    return f.encrypt(plaintext.encode('utf-8')).decode('utf-8')


def decrypt_message(ciphertext: str) -> str:
    """Decrypt an encrypted message string. Returns plaintext."""
    if not ciphertext:
        return ciphertext
    try:
        f = _get_fernet()
        return f.decrypt(ciphertext.encode('utf-8')).decode('utf-8')
    except Exception:
        # If decryption fails, the message may be stored in plaintext (pre-encryption)
        return ciphertext
