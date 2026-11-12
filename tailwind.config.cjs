// Compiled by build.mjs into dist/pointscanner.css. Colour values live in
// assets/css/styles.css as CSS variables (light + dark); Tailwind only
// references them, so dark mode is a variable swap, not a class per element.
function ramp(name, steps) {
  return Object.fromEntries(steps.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));
}
const full = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

module.exports = {
  content: { relative: true, files: ['./index.html', './assets/js/**/*.js'] },
  theme: {
    extend: {
      colors: {
        ink: ramp('ink', [0, ...full]),
        brand: ramp('brand', full),
        accent: ramp('accent', full),
        good: ramp('good', [100, 600, 800]),
        bad: ramp('bad', [100, 600, 800]),
      },
      fontFamily: {
        sans: ['Inter Variable', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono Variable', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
};
