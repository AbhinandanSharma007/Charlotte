import { animate } from "animejs";

/**
 * Animates a numeric readout from 0 up to `value`, formatting each frame.
 * Used by the Energy Ledger signature element on the home screen so the
 * supplied / billed / loss figures feel like a live meter rather than
 * static text.
 */
export function animateCounter(
  el: HTMLElement | null,
  value: number,
  opts: { duration?: number; suffix?: string; decimals?: number } = {}
) {
  if (!el) return;
  const { duration = 1400, suffix = "", decimals = 0 } = opts;
  const counter = { value: 0 };

  animate(counter, {
    value,
    duration,
    easing: "easeOutExpo",
    update: () => {
      el.textContent = `${counter.value.toFixed(decimals)}${suffix}`;
    },
  });
}

/** Runs a looping pulse of dots along an SVG path, used for the topology diagram. */
export function pulseAlongPath(selector: string, delay = 0) {
  animate(selector, {
    offsetDistance: ["0%", "100%"],
    easing: "linear",
    duration: 2200,
    delay,
    loop: true,
  });
}
