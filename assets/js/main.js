document.addEventListener("DOMContentLoaded", function () {
  var tableWrappers = [];

  document.querySelectorAll(".content table").forEach(function (table, index) {
    if (table.parentElement && table.parentElement.classList.contains("table-scroll")) {
      tableWrappers.push(table.parentElement);
      return;
    }

    var wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.dataset.tableLabel = "Scrollable data table " + (index + 1);
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    tableWrappers.push(wrapper);
  });

  function updateScrollableTables() {
    tableWrappers.forEach(function (wrapper) {
      var isScrollable = wrapper.scrollWidth > wrapper.clientWidth + 1;
      if (isScrollable) {
        wrapper.setAttribute("tabindex", "0");
        wrapper.setAttribute("role", "region");
        wrapper.setAttribute("aria-label", wrapper.dataset.tableLabel);
      } else {
        wrapper.removeAttribute("tabindex");
        wrapper.removeAttribute("role");
        wrapper.removeAttribute("aria-label");
      }
    });
  }

  updateScrollableTables();

  var resizeFrame = null;
  window.addEventListener("resize", function () {
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(function () {
      updateScrollableTables();
      resizeFrame = null;
    });
  });

  var toggle = document.querySelector(".nav-toggle");
  var sidebar = document.getElementById("sidebar");
  if (!toggle || !sidebar) return;

  var mobileNavigation = window.matchMedia("(max-width: 900px)");
  var focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

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

  function isSidebarOpen() {
    return mobileNavigation.matches && sidebar.classList.contains("is-open");
  }

  function setSidebarOpen(open, options) {
    var settings = options || {};
    var shouldOpen = mobileNavigation.matches && open;

    sidebar.classList.toggle("is-open", shouldOpen);
    toggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    toggle.setAttribute("aria-label", shouldOpen ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("nav-open", shouldOpen);

    if (mobileNavigation.matches && !shouldOpen) {
      sidebar.setAttribute("aria-hidden", "true");
      sidebar.setAttribute("inert", "");
    } else {
      sidebar.removeAttribute("aria-hidden");
      sidebar.removeAttribute("inert");
    }

    if (shouldOpen && settings.focusInside) {
      window.requestAnimationFrame(function () {
        var target = sidebar.querySelector(".sidenav-link.is-active") || sidebar.querySelector(focusableSelector);
        if (target) target.focus();
      });
    } else if (!shouldOpen && settings.returnFocus) {
      toggle.focus();
    }
  }

  function synchronizeViewport() {
    setSidebarOpen(false, {
      returnFocus: mobileNavigation.matches && sidebar.contains(document.activeElement)
    });
  }

  toggle.addEventListener("click", function () {
    var shouldOpen = !isSidebarOpen();
    setSidebarOpen(shouldOpen, { focusInside: shouldOpen });
  });

  sidebar.addEventListener("click", function (event) {
    var heading = event.target.closest(".sidenav-heading");
    if (heading) {
      var section = heading.closest(".sidenav-section");
      var isExpanded = section.classList.toggle("is-expanded");
      heading.setAttribute("aria-expanded", isExpanded ? "true" : "false");
      return;
    }

    if (event.target.closest("a")) {
      setSidebarOpen(false, { returnFocus: false });
    }
  });

  document.addEventListener("click", function (event) {
    if (!isSidebarOpen()) return;
    if (sidebar.contains(event.target) || toggle.contains(event.target)) return;
    setSidebarOpen(false, { returnFocus: true });
  });

  document.addEventListener("keydown", function (event) {
    if (!isSidebarOpen()) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setSidebarOpen(false, { returnFocus: true });
      return;
    }

    if (event.key !== "Tab") return;

    var focusable = Array.prototype.filter.call(
      sidebar.querySelectorAll(focusableSelector),
      function (element) {
        return element.getClientRects().length > 0;
      }
    );
    if (focusable.length === 0) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  if (typeof mobileNavigation.addEventListener === "function") {
    mobileNavigation.addEventListener("change", synchronizeViewport);
  } else {
    mobileNavigation.addListener(synchronizeViewport);
  }

  synchronizeViewport();
});
