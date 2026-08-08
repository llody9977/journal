from flask import Blueprint, render_template, request, send_file, flash, redirect, url_for
import io

from . import core

bp = Blueprint("ecb", __name__, url_prefix="/ecb")

MAX_SECRET_CHARS = 500


@bp.get("/")
def index():
    return render_template("ecb/index.html", charset=core.PRINTABLE_ASCII)


@bp.post("/generate-key")
def generate_key():
    return {"key_hex": core.generate_key_hex()}


@bp.post("/build-codebook")
def build_codebook():
    try:
        key = core.parse_key_hex(request.form.get("key_hex", ""))
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("ecb.index"))

    plaintext = core.build_codebook_plaintext()
    ciphertext = core.aes_ecb_encrypt(key, plaintext)
    return send_file(
        io.BytesIO(ciphertext),
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name="ref-cipher.bin",
    )


@bp.post("/build-secret")
def build_secret():
    key_hex = request.form.get("key_hex", "")
    secret_text = request.form.get("secret_text", "")

    if len(secret_text) > MAX_SECRET_CHARS:
        flash(f"Keep it under {MAX_SECRET_CHARS} characters for this demo.", "error")
        return redirect(url_for("ecb.index"))

    try:
        key = core.parse_key_hex(key_hex)
        plaintext = core.encode_secret_plaintext(secret_text)
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("ecb.index"))

    ciphertext = core.aes_ecb_encrypt(key, plaintext)
    return send_file(
        io.BytesIO(ciphertext),
        mimetype="application/octet-stream",
        as_attachment=True,
        download_name="secret.bin",
    )


@bp.post("/deduce")
def deduce():
    ref_file = request.files.get("ref_cipher")
    secret_file = request.files.get("secret_cipher")

    if not ref_file or not ref_file.filename:
        flash("Upload the reference codebook ciphertext (ref-cipher.bin).", "error")
        return redirect(url_for("ecb.index"))
    if not secret_file or not secret_file.filename:
        flash("Upload the secret ciphertext (secret.bin).", "error")
        return redirect(url_for("ecb.index"))

    ref_bytes = ref_file.read()
    secret_bytes = secret_file.read()

    if len(ref_bytes) > 1_000_000 or len(secret_bytes) > 1_000_000:
        flash("File too large for this demo.", "error")
        return redirect(url_for("ecb.index"))

    try:
        result = core.deduce(ref_bytes, secret_bytes)
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("ecb.index"))

    return render_template("ecb/result.html", result=result)
