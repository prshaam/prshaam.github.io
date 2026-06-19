(function () {
  const STORAGE_KEY = "page-nav";
  const DURATION = 400;
  const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isInternalLink(anchor) {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return false;
    }
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
      return false;
    }
    try {
      const url = new URL(href, window.location.href);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function getDirection(anchor) {
    return anchor.classList.contains("page-back") ? "back" : "forward";
  }

  function exitClass(direction) {
    return direction === "back" ? "page-exit-back" : "page-exit-forward";
  }

  function enterClass(direction) {
    return direction === "back" ? "page-enter-back" : "page-enter-forward";
  }

  function navigate(href, direction) {
    if (reducedMotion) {
      window.location.href = href;
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ direction, href }));
    document.body.classList.add(exitClass(direction));

    window.setTimeout(() => {
      window.location.href = href;
    }, DURATION);
  }

  function playEnterAnimation() {
    if (reducedMotion) {
      sessionStorage.removeItem(STORAGE_KEY);
      document.documentElement.classList.remove("page-arriving", "page-arriving-forward", "page-arriving-back");
      return;
    }

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    sessionStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove("page-arriving", "page-arriving-forward", "page-arriving-back");

    const direction = data.direction === "back" ? "back" : "forward";
    document.body.classList.add(enterClass(direction));

    window.setTimeout(() => {
      document.body.classList.remove("page-enter-forward", "page-enter-back");
    }, DURATION + 50);
  }

  function onClick(event) {
    const anchor = event.target.closest("a");
    if (!anchor || !isInternalLink(anchor)) return;

    const href = anchor.href;
    if (href === window.location.href) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    navigate(href, getDirection(anchor));
  }

  document.addEventListener("click", onClick);
  window.addEventListener("pageshow", playEnterAnimation);
  document.addEventListener("DOMContentLoaded", playEnterAnimation);
})();
