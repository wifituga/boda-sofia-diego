(() => {
  const page = document.querySelector('main');
  if (!page || !('IntersectionObserver' in window)) return;

  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const details = page.querySelectorAll('.calendar, .story-photos figure');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .12) continue;
      if (motion.matches) entry.target.classList.add('detail-in-view');
      observer.unobserve(entry.target);
    }
  }, { threshold: .12 });

  function observeDetails() {
    details.forEach(detail => observer.observe(detail));
  }

  if (page.inert) {
    const gate = new MutationObserver(() => {
      if (page.inert) return;
      gate.disconnect();
      observeDetails();
    });
    gate.observe(page, { attributes: true, attributeFilter: ['inert'] });
  } else {
    observeDetails();
  }
})();
