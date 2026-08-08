from flask import Blueprint, render_template, request, flash, redirect, url_for

from . import core

bp = Blueprint("cbc", __name__, url_prefix="/cbc")


@bp.get("/")
def index():
    return render_template(
        "cbc/index.html",
        block1=core.BLOCK1_TEMPLATE.decode("ascii"),
        block2=core.BLOCK2_TEMPLATE.decode("ascii"),
    )


@bp.post("/generate-keys")
def generate_keys():
    return {"key_hex": core.generate_hex16(), "iv_hex": core.generate_hex16()}


@bp.post("/build")
def build():
    key_hex = request.form.get("key_hex", "")
    iv_hex = request.form.get("iv_hex", "")
    try:
        key = core.parse_hex16(key_hex, "Key")
        iv = core.parse_hex16(iv_hex, "IV")
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("cbc.index"))

    plaintext = core.build_plaintext()
    ciphertext = core.aes_cbc_encrypt(key, iv, plaintext)

    return render_template(
        "cbc/attack.html",
        key_hex=key_hex.strip(),
        iv_hex=iv_hex.strip(),
        ciphertext_hex=ciphertext.hex(),
        plaintext_blocks=[b.decode("ascii") for b in core.split_blocks(plaintext)],
        ciphertext_blocks=[b.hex() for b in core.split_blocks(ciphertext)],
    )


@bp.post("/flip")
def flip():
    key_hex = request.form.get("key_hex", "")
    iv_hex = request.form.get("iv_hex", "")
    ciphertext_hex = request.form.get("ciphertext_hex", "")
    mode = request.form.get("mode", "guided")

    try:
        key = core.parse_hex16(key_hex, "Key")
        iv = core.parse_hex16(iv_hex, "IV")
        ciphertext = bytes.fromhex(ciphertext_hex.strip())
    except (core.LabError, ValueError) as e:
        flash(str(e) if isinstance(e, core.LabError) else "Ciphertext must be valid hex.", "error")
        return redirect(url_for("cbc.index"))

    try:
        if mode == "guided":
            result = core.flip_isadmin(ciphertext, iv)
        else:
            block_index = int(request.form.get("block_index", 2))
            offset = int(request.form.get("offset", 0))
            new_char = request.form.get("new_char", "")
            result = core.compute_flip(ciphertext, iv, block_index, offset, new_char)
    except core.LabError as e:
        flash(str(e), "error")
        return redirect(url_for("cbc.index"))

    decrypted = core.aes_cbc_decrypt(key, result["new_iv"], result["new_ciphertext"])
    decrypted_blocks = core.split_blocks(decrypted)

    def render_block(b: bytes) -> str:
        try:
            return b.decode("ascii")
        except UnicodeDecodeError:
            return None

    rendered_blocks = [
        {"hex": b.hex(), "text": render_block(b)}
        for b in decrypted_blocks
    ]

    return render_template(
        "cbc/result.html",
        result=result,
        original_ciphertext_hex=ciphertext.hex(),
        new_ciphertext_hex=result["new_ciphertext"].hex(),
        original_iv_hex=iv.hex(),
        new_iv_hex=result["new_iv"].hex(),
        decrypted_blocks=rendered_blocks,
        target_block_0idx=result["target_block"] - 1,
    )
