document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var sidebar = document.getElementById("sidebar");
  if (!toggle || !sidebar) return;

  var activeLink = sidebar.querySelector(".sidenav-link.is-active");
  if (activeLink) {
    var ancestorSection = activeLink.closest(".sidenav-section");
    if (ancestorSection) {
      ancestorSection.classList.add("is-expanded");
      var ancestorHeading = ancestorSection.querySelector(":scope > .sidenav-heading");
      if (ancestorHeading) ancestorHeading.setAttribute("aria-expanded", "true");
    }
  }

  toggle.addEventListener("click", function () {
    var isOpen = sidebar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  sidebar.addEventListener("click", function (event) {
    var heading = event.target.closest(".sidenav-heading");
    if (heading) {
      var section = heading.closest(".sidenav-section");
      var isExpanded = section.classList.toggle("is-expanded");
      heading.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      return;
    }

    if (event.target.tagName === "A") {
      sidebar.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
});
