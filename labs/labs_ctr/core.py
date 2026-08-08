import secrets

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

NONCE_SIZE = 16  # openssl's -iv for -aes-128-ctr is a full 16-byte initial counter block
PRINTABLE_ASCII = "".join(chr(c) for c in range(32, 127))  # space .. ~, 95 chars

DEFAULT_MESSAGE_A = "Transfer $100 to Bob!!!"
DEFAULT_MESSAGE_B = "Meet me at 9pm sharp!!!"


class LabError(ValueError):
    """Raised for any user-facing input problem."""


def generate_hex16() -> str:
    return secrets.token_hex(16)


def parse_hex16(value: str, label: str) -> bytes:
    value = value.strip()
    try:
        parsed = bytes.fromhex(value)
    except ValueError:
        raise LabError(f"{label} must be hex-encoded (0-9, a-f only).")
    if len(parsed) != NONCE_SIZE:
        raise LabError(f"{label} must be 16 bytes (32 hex characters) — got {len(parsed)} bytes.")
    return parsed


def assert_ascii_only(text: str, label: str) -> None:
    bad = sorted({c for c in text if c not in PRINTABLE_ASCII})
    if bad:
        shown = ", ".join(repr(c) for c in bad[:10])
        raise LabError(f"{label}: only printable ASCII (space through ~) is supported. Unsupported character(s): {shown}")
    if not text:
        raise LabError(f"{label} can't be empty.")


def aes_ctr_encrypt(key: bytes, nonce: bytes, plaintext: bytes) -> bytes:
    encryptor = Cipher(algorithms.AES(key), modes.CTR(nonce)).encryptor()
    return encryptor.update(plaintext) + encryptor.finalize()


def xor_bytes(a: bytes, b: bytes) -> bytes:
    """XOR over the overlapping length only -- the two-time-pad relationship only holds there."""
    n = min(len(a), len(b))
    return bytes(x ^ y for x, y in zip(a[:n], b[:n]))


def recover_with_crib(cipher_a: bytes, cipher_b: bytes, crib: str, target: str, offset: int) -> dict:
    """
    Given XOR(Ca, Cb) == XOR(Pa, Pb) (true whenever the same key+nonce encrypted both),
    a known/guessed slice of one plaintext at `offset` peels off the corresponding slice
    of the *other* plaintext -- no key involved anywhere in this function.
    """
    if target not in ("a", "b"):
        raise LabError("target must be 'a' or 'b'.")
    assert_ascii_only(crib, "Guess")

    overlap = min(len(cipher_a), len(cipher_b))
    if offset < 0 or offset + len(crib) > overlap:
        raise LabError(
            f"Guess of length {len(crib)} at offset {offset} runs past the overlapping "
            f"{overlap}-byte region the two ciphertexts share."
        )

    crib_bytes = crib.encode("ascii")
    xor_c = xor_bytes(cipher_a, cipher_b)
    window = xor_c[offset:offset + len(crib_bytes)]
    recovered = bytes(x ^ y for x, y in zip(window, crib_bytes))

    try:
        recovered_text = recovered.decode("ascii")
        printable = all(c in PRINTABLE_ASCII for c in recovered_text)
    except UnicodeDecodeError:
        recovered_text, printable = None, False

    other = "b" if target == "a" else "a"

    return {
        "target": target,
        "other": other,
        "offset": offset,
        "crib": crib,
        "xor_c_hex": xor_c.hex(),
        "recovered_hex": recovered.hex(),
        "recovered_text": recovered_text if printable else None,
    }
