document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var sidebar = document.getElementById("sidebar");
  if (!toggle || !sidebar) return;

  var activeLink = sidebar.querySelector(".sidenav-link.is-active");
  if (activeLink) {
    var section = activeLink.closest(".sidenav-section");
    while (section) {
      section.classList.add("is-expanded");
      var heading = section.querySelector(":scope > .sidenav-heading");
      if (heading) heading.setAttribute("aria-expanded", "true");
      section = section.parentElement ? section.parentElement.closest(".sidenav-section") : null;
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
