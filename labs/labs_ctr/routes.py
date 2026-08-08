from flask import Blueprint, render_template, request, flash, redirect, url_for

from . import core

bp = Blueprint("ctr", __name__, url_prefix="/ctr")

MAX_MESSAGE_CHARS = 500


@bp.get("/")
def index():
    return render_template(
        "ctr/index.html",
        default_message_a=core.DEFAULT_MESSAGE_A,
        default_message_b=core.DEFAULT_MESSAGE_B,
    )


@bp.post("/generate-keys")
def generate_keys():
    return {"key_hex": core.generate_hex16(), "nonce_hex": core.generate_hex16()}


@bp.post("/build")
def build():
    key_hex = request.form.get("key_hex", "")
    nonce_hex = request.form.get("nonce_hex", "")
    message_a = request.form.get("message_a", "")
    message_b = request.form.get("message_b", "")

    if len(message_a) > MAX_MESSAGE_CHARS or len(message_b) > MAX_MESSAGE_CHARS:
        flash(f"Keep each message under {MAX_MESSAGE_CHARS} characters for this demo.", "error")
        return redirect(url_for("ctr.index"))

    try:
        key = core.parse_hex16(key_hex, "Key")
        nonce = core.parse_hex16(nonce_hex, "Nonce")
        core.assert_ascii_only(message_a, "Message A")
        core.assert_ascii_only(message_b, "Message B")
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("ctr.index"))

    plaintext_a = message_a.encode("ascii")
    plaintext_b = message_b.encode("ascii")
    cipher_a = core.aes_ctr_encrypt(key, nonce, plaintext_a)
    cipher_b = core.aes_ctr_encrypt(key, nonce, plaintext_b)

    return render_template(
        "ctr/attack.html",
        key_hex=key_hex.strip(),
        nonce_hex=nonce_hex.strip(),
        message_a=message_a,
        message_b=message_b,
        cipher_a_hex=cipher_a.hex(),
        cipher_b_hex=cipher_b.hex(),
        overlap=min(len(cipher_a), len(cipher_b)),
    )


@bp.post("/attack")
def attack():
    cipher_a_hex = request.form.get("cipher_a_hex", "").strip()
    cipher_b_hex = request.form.get("cipher_b_hex", "").strip()
    crib = request.form.get("crib", "")
    target = request.form.get("target", "a")
    offset_raw = request.form.get("offset", "0")

    try:
        cipher_a = bytes.fromhex(cipher_a_hex)
        cipher_b = bytes.fromhex(cipher_b_hex)
    except ValueError:
        flash("Ciphertexts must be valid hex.", "error")
        return redirect(url_for("ctr.index"))

    try:
        offset = int(offset_raw)
    except ValueError:
        flash("Offset must be a whole number.", "error")
        return redirect(url_for("ctr.index"))

    try:
        result = core.recover_with_crib(cipher_a, cipher_b, crib, target, offset)
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("ctr.index"))

    return render_template(
        "ctr/result.html",
        result=result,
        cipher_a_hex=cipher_a.hex(),
        cipher_b_hex=cipher_b.hex(),
    )
