document.addEventListener("DOMContentLoaded", function () {
  const keyInput = document.getElementById("key-hex");
  const ivInput = document.getElementById("iv-hex");
  const genBtn = document.getElementById("gen-btn");

  function updateMirrors() {
    document.querySelectorAll(".key-mirror").forEach(function (el) { el.value = keyInput ? keyInput.value.trim() : ""; });
    document.querySelectorAll(".iv-mirror").forEach(function (el) { el.value = ivInput ? ivInput.value.trim() : ""; });
    document.querySelectorAll("code.cmd[data-template]").forEach(function (el) {
      const key = (keyInput && keyInput.value.trim()) || "<key>";
      const iv = (ivInput && ivInput.value.trim()) || "<iv>";
      el.textContent = el.getAttribute("data-template")
        .replace("{KEY}", key)
        .replace("{IV}", iv);
    });
  }

  if (keyInput) keyInput.addEventListener("input", updateMirrors);
  if (ivInput) ivInput.addEventListener("input", updateMirrors);

  if (genBtn) {
    genBtn.addEventListener("click", function () {
      fetch("/cbc/generate-keys", { method: "POST" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (keyInput) keyInput.value = data.key_hex;
          if (ivInput) ivInput.value = data.iv_hex;
          updateMirrors();
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

  updateMirrors();
});
