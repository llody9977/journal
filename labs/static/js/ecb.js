document.addEventListener("DOMContentLoaded", function () {
  const keyInput = document.getElementById("key-hex");
  const secretInput = document.getElementById("secret-text");
  const genBtn = document.getElementById("gen-key-btn");

  function updateCommandSnippets() {
    const key = keyInput.value.trim() || "<your key>";
    const secret = (secretInput ? secretInput.value : "").replace(/'/g, "'\\''") || "<your secret>";
    document.querySelectorAll("code.cmd[data-template]").forEach(function (el) {
      el.textContent = el.getAttribute("data-template")
        .replace("{KEY}", key)
        .replace("{SECRET}", secret);
    });
    document.querySelectorAll(".key-mirror").forEach(function (el) { el.value = keyInput.value.trim(); });
    document.querySelectorAll(".secret-mirror").forEach(function (el) { el.value = secretInput ? secretInput.value : ""; });
  }

  if (keyInput) keyInput.addEventListener("input", updateCommandSnippets);
  if (secretInput) secretInput.addEventListener("input", updateCommandSnippets);

  if (genBtn) {
    genBtn.addEventListener("click", function () {
      fetch(genBtn.closest("body") ? "/ecb/generate-key" : "", { method: "POST" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          keyInput.value = data.key_hex;
          updateCommandSnippets();
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

  updateCommandSnippets();
});
