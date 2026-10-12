/* Top bar: turns solid after the hero and marks the section in view. */

const bar = document.querySelector<HTMLElement>(".bar");
const hero = document.querySelector<HTMLElement>(".hero");

if (bar && hero) {
  new IntersectionObserver(
    ([entry]) => bar.classList.toggle("is-solid", !entry.isIntersecting),
    { rootMargin: "-72px 0px 0px 0px" },
  ).observe(hero);
}

const navLinks = [...document.querySelectorAll<HTMLAnchorElement>(".bar__nav a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    });
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
document.querySelectorAll("main > section[id]").forEach((s) => sectionObserver.observe(s));
