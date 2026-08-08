document.addEventListener("DOMContentLoaded", function () {
  const keyInput = document.getElementById("key-hex");
  const nonceInput = document.getElementById("nonce-hex");
  const msgAInput = document.getElementById("message-a");
  const msgBInput = document.getElementById("message-b");
  const genBtn = document.getElementById("gen-btn");

  function updateAll() {
    const key = (keyInput && keyInput.value.trim()) || "<key>";
    const nonce = (nonceInput && nonceInput.value.trim()) || "<nonce>";
    const msgA = (msgAInput && msgAInput.value) || "";
    const msgB = (msgBInput && msgBInput.value) || "";
    const escaped = function (s) { return s.replace(/'/g, "'\\''"); };

    document.querySelectorAll("code.cmd[data-template]").forEach(function (el) {
      el.textContent = el.getAttribute("data-template")
        .replace(/{KEY}/g, key)
        .replace(/{NONCE}/g, nonce)
        .replace(/{MSGA}/g, escaped(msgA) || "<message A>")
        .replace(/{MSGB}/g, escaped(msgB) || "<message B>");
    });

    document.querySelectorAll(".key-mirror").forEach(function (el) { el.value = keyInput ? keyInput.value.trim() : ""; });
    document.querySelectorAll(".nonce-mirror").forEach(function (el) { el.value = nonceInput ? nonceInput.value.trim() : ""; });
    document.querySelectorAll(".message-a-mirror").forEach(function (el) { el.value = msgA; });
    document.querySelectorAll(".message-b-mirror").forEach(function (el) { el.value = msgB; });
  }

  [keyInput, nonceInput, msgAInput, msgBInput].forEach(function (el) {
    if (el) el.addEventListener("input", updateAll);
  });

  if (genBtn) {
    genBtn.addEventListener("click", function () {
      fetch("/ctr/generate-keys", { method: "POST" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (keyInput) keyInput.value = data.key_hex;
          if (nonceInput) nonceInput.value = data.nonce_hex;
          updateAll();
        });
    });
  }

  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const group = btn.closest(".step");
      const target = btn.getAttribute("data-tab");
      group.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("is-active"); });
      group.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
      btn.classList.add("is-active");
      group.querySelector('.tab-panel[data-panel="' + target + '"]').classList.add("is-active");
    });
  });

  updateAll();
});
