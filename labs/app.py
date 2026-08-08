import os

from flask import Flask, render_template

from labs_ecb.routes import bp as ecb_bp
from labs_cbc.routes import bp as cbc_bp
from labs_ctr.routes import bp as ctr_bp

LABS = [
    {
        "slug": "ecb",
        "title": "ECB codebook attack",
        "description": "AES-128-ECB encrypts identical plaintext blocks to identical ciphertext blocks, every time, under a fixed key. Build a reference codebook and read someone else's secret off it without ever touching their key.",
        "url": "/ecb/",
    },
    {
        "slug": "cbc",
        "title": "CBC bit-flipping (integrity)",
        "description": "AES-CBC keeps data secret but never checks integrity on its own. Flip a bit in one ciphertext block and watch the exact same bit flip in the next block's decrypted plaintext — no key required, no error raised.",
        "url": "/cbc/",
    },
    {
        "slug": "ctr",
        "title": "CTR nonce reuse (two-time pad)",
        "description": "AES-CTR turns into a keystream generator. Reuse the same key and nonce for two messages, and XORing the ciphertexts together cancels the keystream out entirely — recover one plaintext from a guess about the other, no key involved.",
        "url": "/ctr/",
    },
]


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", os.urandom(32))
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 MB, generous for this demo

    app.register_blueprint(ecb_bp)
    app.register_blueprint(cbc_bp)
    app.register_blueprint(ctr_bp)

    @app.get("/")
    def index():
        return render_template("index.html", labs=LABS)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)
