import os
import secrets

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

BLOCK_SIZE = 16
PRINTABLE_ASCII = "".join(chr(c) for c in range(32, 127))  # space .. ~, 95 chars


class LabError(ValueError):
    """Raised for any user-facing input problem (bad key, non-ASCII text, wrong file size)."""


def generate_key_hex() -> str:
    return secrets.token_hex(16)


def parse_key_hex(key_hex: str) -> bytes:
    key_hex = key_hex.strip()
    try:
        key = bytes.fromhex(key_hex)
    except ValueError:
        raise LabError("Key must be hex-encoded (0-9, a-f only).")
    if len(key) != 16:
        raise LabError(f"AES-128 needs a 16-byte key — got {len(key)} bytes ({len(key_hex)} hex chars). Expected 32 hex chars.")
    return key


def assert_ascii_only(text: str) -> None:
    bad = sorted({c for c in text if c not in PRINTABLE_ASCII})
    if bad:
        shown = ", ".join(repr(c) for c in bad[:10])
        raise LabError(f"Only printable ASCII (space through ~) is supported by this lab. Unsupported character(s): {shown}")


def build_codebook_plaintext() -> bytes:
    """One 16-byte block per printable ASCII character, that character repeated 16 times."""
    return b"".join(c.encode("ascii") * BLOCK_SIZE for c in PRINTABLE_ASCII)


def encode_secret_plaintext(text: str) -> bytes:
    """Same encoding as the codebook: one block per character, so ciphertext blocks are directly comparable."""
    assert_ascii_only(text)
    return b"".join(c.encode("ascii") * BLOCK_SIZE for c in text)


def aes_ecb_encrypt(key: bytes, plaintext: bytes) -> bytes:
    if len(plaintext) % BLOCK_SIZE != 0:
        raise LabError(f"Plaintext must be a multiple of {BLOCK_SIZE} bytes for -nopad ECB (got {len(plaintext)}).")
    encryptor = Cipher(algorithms.AES(key), modes.ECB()).encryptor()
    return encryptor.update(plaintext) + encryptor.finalize()


def split_blocks(data: bytes) -> list[bytes]:
    return [data[i:i + BLOCK_SIZE] for i in range(0, len(data), BLOCK_SIZE)]


def build_lookup_table(codebook_cipher: bytes) -> dict[bytes, str]:
    blocks = split_blocks(codebook_cipher)
    if len(blocks) != len(PRINTABLE_ASCII):
        raise LabError(
            f"Reference codebook is the wrong size — expected {len(PRINTABLE_ASCII) * BLOCK_SIZE} bytes "
            f"({len(PRINTABLE_ASCII)} blocks), got {len(codebook_cipher)} bytes ({len(blocks)} blocks)."
        )
    return {block: char for block, char in zip(blocks, PRINTABLE_ASCII)}


def deduce(codebook_cipher: bytes, secret_cipher: bytes) -> dict:
    """Match each secret ciphertext block against the reference codebook -- no key involved at all."""
    lookup = build_lookup_table(codebook_cipher)
    secret_blocks = split_blocks(secret_cipher)

    rows = []
    deduced_chars = []
    for index, block in enumerate(secret_blocks):
        char = lookup.get(block)
        rows.append({
            "index": index,
            "ciphertext_hex": block.hex(),
            "matched": char is not None,
            "char": char,
        })
        deduced_chars.append(char if char is not None else "�")

    return {
        "deduced_text": "".join(deduced_chars),
        "rows": rows,
        "block_count": len(secret_blocks),
        "matched_count": sum(1 for r in rows if r["matched"]),
    }
