/* Reveal on scroll. Content is visible without JS; see `.js .reveal` in the CSS. */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
);

document.querySelectorAll<HTMLElement>(".reveal").forEach((node, i) => {
  node.style.transitionDelay = `${(i % 3) * 90}ms`;
  revealObserver.observe(node);
});
