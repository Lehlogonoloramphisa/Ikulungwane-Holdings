const FONT_STACKS = {
  Outfit: "'Outfit', system-ui, sans-serif",
  Inter: "'Inter', system-ui, sans-serif",
  Manrope: "'Manrope', system-ui, sans-serif",
  Montserrat: "'Montserrat', system-ui, sans-serif",
  Poppins: "'Poppins', system-ui, sans-serif",
  Lora: "'Lora', Georgia, serif",
  "Playfair Display": "'Playfair Display', Georgia, serif",
  "Cormorant Garamond": "'Cormorant Garamond', Georgia, serif",
  "Bebas Neue": "'Bebas Neue', Impact, sans-serif",
};

const fontStack = (name, fallback = FONT_STACKS.Outfit) => FONT_STACKS[name] || fallback;

const clampNumber = (value, min, max, fallback) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

const setCssVar = (name, value) => {
  if (typeof document === "undefined" || value === undefined || value === null || value === "") return;
  document.documentElement.style.setProperty(name, value);
};

const hexToHsl = (hex) => {
  const clean = String(hex || "").replace("#", "").trim();
  if (![3, 6].includes(clean.length)) return "";

  const full = clean.length === 3
    ? clean.split("").map((char) => `${char}${char}`).join("")
    : clean;

  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return "";

  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue /= 6;
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
};

export const applyBrandingVariables = (branding = {}) => {
  const primaryColor = branding.accentColor || branding.primaryColor || "#e11d2e";
  const secondaryColor = branding.secondaryColor || "#39d6c2";
  const primaryHsl = hexToHsl(primaryColor);

  setCssVar("--ashley-accent", primaryColor);
  setCssVar("--ashley-teal", secondaryColor);

  if (primaryHsl) {
    setCssVar("--primary", primaryHsl);
    setCssVar("--accent", primaryHsl);
    setCssVar("--ring", primaryHsl);
    setCssVar("--gold", primaryHsl);
    setCssVar("--sidebar-primary", primaryHsl);
  }

  setCssVar("--font-body", fontStack(branding.bodyFont || branding.typography));
  setCssVar("--font-heading", fontStack(branding.headingFont || branding.typography));
  setCssVar("--font-display", fontStack(branding.displayFont || branding.typography));
  setCssVar("--site-logo-text-size", `${clampNumber(branding.textSizes?.logo, 18, 24, 22)}px`);
  setCssVar("--site-footer-logo-text-size", `${clampNumber(branding.textSizes?.footerLogo, 22, 30, 28)}px`);
  setCssVar("--site-nav-text-size", `${clampNumber(branding.textSizes?.navigation, 10, 12, 11)}px`);
  setCssVar("--site-hero-heading-size", `${clampNumber(branding.textSizes?.heroHeading, 46, 76, 72)}px`);
  setCssVar("--site-section-heading-size", `${clampNumber(branding.textSizes?.sectionHeading, 30, 46, 42)}px`);
  setCssVar("--site-body-text-size", `${clampNumber(branding.textSizes?.body, 14, 16, 15)}px`);
};
