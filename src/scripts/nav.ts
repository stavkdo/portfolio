/* Top bar: turns solid after the hero and marks the section in view. */

const bar = document.querySelector<HTMLElement>(".bar");
const hero = document.querySelector<HTMLElement>(".hero");

if (bar && hero) {
  // Big screens: the bar stays clear over the hero and turns solid once the hero has gone.
  // Phones: the hero text sits right under the bar, so the bar turns solid the moment the page
  // scrolls; otherwise the name in the bar would slide over the hero's text.
  const phone = window.matchMedia("(max-width: 600px)");
  let heroGone = false;
  const update = () => bar.classList.toggle("is-solid", heroGone || (phone.matches && window.scrollY > 4));
  new IntersectionObserver(
    ([entry]) => { heroGone = !entry.isIntersecting; update(); },
    { rootMargin: "-72px 0px 0px 0px" },
  ).observe(hero);
  window.addEventListener("scroll", update, { passive: true });
  phone.addEventListener("change", update);
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
document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));
