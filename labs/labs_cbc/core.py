import secrets

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

BLOCK_SIZE = 16

# Same fake session token used in the Field Journal's own CBC write-up, so this
# interactive version and the static walkthrough agree byte-for-byte.
BLOCK1_TEMPLATE = b"user=alice;role="  # the block that gets sacrificed to noise
BLOCK2_TEMPLATE = b"user;isadmin=0;;"  # the block containing the flag being attacked
PLAINTEXT_BLOCKS = [BLOCK1_TEMPLATE, BLOCK2_TEMPLATE]

ISADMIN_BLOCK = 2       # 1-indexed
ISADMIN_OFFSET = 13     # position of '0' within block 2
ISADMIN_OLD_CHAR = "0"
ISADMIN_NEW_CHAR = "1"


class LabError(ValueError):
    """Raised for any user-facing input problem."""


def build_plaintext() -> bytes:
    return BLOCK1_TEMPLATE + BLOCK2_TEMPLATE


def generate_hex16() -> str:
    return secrets.token_hex(16)


def parse_hex16(value: str, label: str) -> bytes:
    value = value.strip()
    try:
        parsed = bytes.fromhex(value)
    except ValueError:
        raise LabError(f"{label} must be hex-encoded (0-9, a-f only).")
    if len(parsed) != 16:
        raise LabError(f"{label} must be 16 bytes (32 hex characters) — got {len(parsed)} bytes.")
    return parsed


def aes_cbc_encrypt(key: bytes, iv: bytes, plaintext: bytes) -> bytes:
    if len(plaintext) % BLOCK_SIZE != 0:
        raise LabError(f"Plaintext must be a multiple of {BLOCK_SIZE} bytes for -nopad CBC.")
    encryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    return encryptor.update(plaintext) + encryptor.finalize()


def aes_cbc_decrypt(key: bytes, iv: bytes, ciphertext: bytes) -> bytes:
    if len(ciphertext) % BLOCK_SIZE != 0:
        raise LabError(f"Ciphertext must be a multiple of {BLOCK_SIZE} bytes for -nopad CBC.")
    decryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
    return decryptor.update(ciphertext) + decryptor.finalize()


def split_blocks(data: bytes) -> list[bytes]:
    return [data[i:i + BLOCK_SIZE] for i in range(0, len(data), BLOCK_SIZE)]


def known_plaintext_char(block_index: int, offset: int) -> str:
    """block_index is 1-indexed against PLAINTEXT_BLOCKS."""
    if block_index < 1 or block_index > len(PLAINTEXT_BLOCKS):
        raise LabError(f"This demo only has blocks 1-{len(PLAINTEXT_BLOCKS)}.")
    if offset < 0 or offset > 15:
        raise LabError("Byte offset must be between 0 and 15.")
    return chr(PLAINTEXT_BLOCKS[block_index - 1][offset])


def compute_flip(ciphertext: bytes, iv: bytes, block_index: int, offset: int, new_char: str) -> dict:
    """
    Flip one plaintext byte in `block_index` (1-indexed) to `new_char`, by XORing
    a delta into whatever produced that block during decryption -- the IV for
    block 1, or the preceding ciphertext block for anything after it. No key
    involved anywhere in this function.
    """
    if len(new_char) != 1 or not (32 <= ord(new_char) <= 126):
        raise LabError("New character must be a single printable ASCII character.")

    old_char = known_plaintext_char(block_index, offset)
    delta = ord(old_char) ^ ord(new_char)

    new_ciphertext = bytearray(ciphertext)
    new_iv = bytearray(iv)

    if block_index == 1:
        new_iv[offset] ^= delta
        touched_surface = "IV"
        touched_block_label = "IV"
    else:
        touched_ct_block = block_index - 2  # 0-indexed ciphertext block that precedes this plaintext block
        pos = touched_ct_block * BLOCK_SIZE + offset
        new_ciphertext[pos] ^= delta
        touched_surface = f"ciphertext block {touched_ct_block + 1}"
        touched_block_label = f"ciphertext block {touched_ct_block + 1}"

    return {
        "new_ciphertext": bytes(new_ciphertext),
        "new_iv": bytes(new_iv),
        "old_char": old_char,
        "new_char": new_char,
        "delta_hex": f"{delta:02x}",
        "touched_surface": touched_surface,
        "touched_block_label": touched_block_label,
        "touched_offset": offset,
        "target_block": block_index,
    }


def flip_isadmin(ciphertext: bytes, iv: bytes) -> dict:
    return compute_flip(ciphertext, iv, ISADMIN_BLOCK, ISADMIN_OFFSET, ISADMIN_NEW_CHAR)
