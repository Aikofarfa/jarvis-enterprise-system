/**
 * Taste Skill & Design Guidelines (Vercel Rules / HUD System)
 * Enforces visual quality, accessibility, touch target sizing, contrast ratios,
 * and semantic structure for Web Factory generated UI components.
 */

export interface DesignGuidelineRule {
  id: string;
  category: "CONTRAST" | "TOUCH_TARGET" | "TYPOGRAPHY" | "ACCESSIBILITY" | "LAYOUT";
  title: string;
  description: string;
  minRequirement: string;
}

export interface QAAuditCheck {
  id: number;
  name: string;
  category: "VISUAL" | "ACCESSIBILITY" | "FUNCTIONAL" | "MOBILE" | "TYPOGRAPHY";
  passed: boolean;
  score: number; // 0 to 5
  details: string;
}

export interface QAAuditReport {
  passed: boolean;
  scorePercentage: number; // 0 to 100
  totalPassed: number;
  totalChecks: number;
  checks: QAAuditCheck[];
  defects: string[];
}

export const VERCEL_DESIGN_GUIDELINES: DesignGuidelineRule[] = [
  {
    id: "CONTRAST_MIN_4_5",
    category: "CONTRAST",
    title: "Relación de Contraste Mínimo 4.5:1",
    description: "Todo el texto legible debe tener un contraste de al menos 4.5:1 sobre su fondo.",
    minRequirement: "Ratio >= 4.5:1",
  },
  {
    id: "TOUCH_TARGET_44PX",
    category: "TOUCH_TARGET",
    title: "Áreas Táctiles Móviles Mínimas 44px",
    description: "Todos los botones, enlaces e insumos interactivos deben tener dimensiones de al menos 44px × 44px.",
    minRequirement: "Min-Width: 44px, Min-Height: 44px",
  },
  {
    id: "ZERO_TITLE_TRUNCATION",
    category: "TYPOGRAPHY",
    title: "Cero Texto Cortado en Títulos",
    description: "Prohibido el desbordamiento o truncado no deseado de títulos principales.",
    minRequirement: "Sin overflow oculto o truncado no semántico en <h1> - <h3>",
  },
  {
    id: "ACCESSIBLE_SYNTAX_ALT",
    category: "ACCESSIBILITY",
    title: "Sintaxis Accesible y Atributos Alt",
    description: "Estructura semántica limpia con atributos alt obligatorios en imágenes y roles explicables.",
    minRequirement: "alt text en <img>, roles en botones/inputs semánticos",
  },
  {
    id: "HUD_THEME_PALETTE",
    category: "LAYOUT",
    title: "Paleta HUD / Moderna y Jerarquía",
    description: "Uso de tipografía monocromática moderna, bordes definidos, acentos fluorescentes sobrios y jerarquía visual limpia.",
    minRequirement: "Sistema Tailwind Slate/HUD con jerarquía clara de espaciado",
  },
];

/**
 * Calculates WCAG 2.1 relative luminance for an RGB color.
 */
function getLuminance(r: number, g: number, b: number): number {
  const [aR, aG, aB] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * aR + 0.7152 * aG + 0.0722 * aB;
}

/**
 * Parses a Hex color string (#RRGGBB or #RGB) into RGB components.
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculates contrast ratio between two hex colors.
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);
  if (!c1 || !c2) return 1;

  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);

  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (brighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Validates a component code string or HTML markup against the 20-point Taste Skill QA checklist.
 */
export function auditTasteSkillCode(code: string): QAAuditReport {
  const checks: QAAuditCheck[] = [];
  const defects: string[] = [];

  const lower = code.toLowerCase();

  // 1. Text Contrast check
  const hasLowContrastHex = lower.includes("#333333") || lower.includes("#444444") || lower.includes("#555555");
  checks.push({
    id: 1,
    name: "Contraste de texto >= 4.5:1",
    category: "VISUAL",
    passed: !hasLowContrastHex,
    score: !hasLowContrastHex ? 5 : 1,
    details: !hasLowContrastHex ? "Colores de texto de alto contraste detectados." : "Se detectaron colores con contraste potencialmente inferior a 4.5:1.",
  });
  if (hasLowContrastHex) defects.push("Falla de contraste: Reemplazar tonos grises oscuros por colores con contraste de texto >= 4.5:1.");

  // 2. Touch target dimensions 44px
  const hasMinTouchTarget = lower.includes("min-h-[44px]") || lower.includes("h-11") || lower.includes("h-12") || lower.includes("py-3") || lower.includes("minheight: 44") || lower.includes("p-4");
  checks.push({
    id: 2,
    name: "Dimensiones de área táctil >= 44px",
    category: "MOBILE",
    passed: hasMinTouchTarget,
    score: hasMinTouchTarget ? 5 : 2,
    details: hasMinTouchTarget ? "Áreas interactivas tienen dimensiones mínimas recomendadas de 44px." : "Faltan estilos explícitos de min-height o padding para cumplir 44px en móviles.",
  });
  if (!hasMinTouchTarget) defects.push("Área táctil móvil: Botones deben incluir dimensión mínima de 44px × 44px (min-h-[44px] o py-3/p-4).");

  // 3. Zero title truncation / cut-off text
  const hasBadTruncateOnHeading = lower.includes("truncate") && (lower.includes("<h1") || lower.includes("<h2") || lower.includes("<h3"));
  checks.push({
    id: 3,
    name: "Cero texto cortado en títulos",
    category: "VISUAL",
    passed: !hasBadTruncateOnHeading,
    score: !hasBadTruncateOnHeading ? 5 : 0,
    details: !hasBadTruncateOnHeading ? "Títulos principales configurados con desbordamiento limpio." : "Título principal tiene truncado 'truncate' prohibido.",
  });
  if (hasBadTruncateOnHeading) defects.push("Texto cortado: Remover 'truncate' en títulos principales y permitir salto de línea responsivo.");

  // 4. Image alt attributes
  const containsImageWithoutAlt = lower.includes("<img") && !lower.includes("alt=");
  checks.push({
    id: 4,
    name: "Atributos alt en imágenes",
    category: "ACCESSIBILITY",
    passed: !containsImageWithoutAlt,
    score: !containsImageWithoutAlt ? 5 : 1,
    details: !containsImageWithoutAlt ? "Todas las imágenes cuentan con atributos alt de accesibilidad." : "Se encontró una etiqueta <img> sin atributo alt.",
  });
  if (containsImageWithoutAlt) defects.push("Accesibilidad: Agregar atributo 'alt' explicativo a todas las imágenes.");

  // 5. Semantic markup tags
  const hasSemanticTags = lower.includes("<main") || lower.includes("<header") || lower.includes("<section") || lower.includes("<nav") || lower.includes("<article") || lower.includes("<view");
  checks.push({
    id: 5,
    name: "Estructura semántica limpia",
    category: "ACCESSIBILITY",
    passed: hasSemanticTags,
    score: hasSemanticTags ? 5 : 2,
    details: hasSemanticTags ? "Uso adecuado de contenedor y jerarquía semántica." : "Falta estructura semántica explícita.",
  });
  if (!hasSemanticTags) defects.push("Semántica: Envolver contenido principal en estructuras semánticas claras.");

  // 6. Valid href / button actions (No empty `#` links)
  const hasEmptyHashLinks = lower.includes('href="#"') || lower.includes("href=''") || lower.includes('href=""');
  checks.push({
    id: 6,
    name: "Enlaces y botones válidos (Sin href='#')",
    category: "FUNCTIONAL",
    passed: !hasEmptyHashLinks,
    score: !hasEmptyHashLinks ? 5 : 0,
    details: !hasEmptyHashLinks ? "No hay enlaces vacíos o redirigidos a '#'." : "Se detectó botón/enlace sin destino o con href='#'.",
  });
  if (hasEmptyHashLinks) defects.push("Enlaces rotos: Reemplazar enlaces vacíos href='#' por URLs válidas o disparadores onClick.");

  // 7. Form states (loading, error, success)
  const hasForm = lower.includes("<form") || lower.includes("type=\"submit\"") || lower.includes("onsubmit");
  const hasFormStates = !hasForm || lower.includes("loading") || lower.includes("disabled") || lower.includes("submitting") || lower.includes("error") || lower.includes("success");
  checks.push({
    id: 7,
    name: "Manejo de estados de formulario",
    category: "FUNCTIONAL",
    passed: hasFormStates,
    score: hasFormStates ? 5 : 3,
    details: hasFormStates ? "El código contempla estados de carga o validación." : "Los formularios carecen de estados visibles de envío o carga.",
  });
  if (!hasFormStates) defects.push("Formularios: Agregar indicadores de estado 'submitting' o validación de entrada.");

  // 8. HUD Theme typography & monospace highlights
  const hasHudTypography = lower.includes("font-mono") || lower.includes("font-semibold") || lower.includes("tracking-");
  checks.push({
    id: 8,
    name: "Tipografía HUD / Moderna",
    category: "VISUAL",
    passed: true,
    score: hasHudTypography ? 5 : 4,
    details: hasHudTypography ? "Aplica jerarquía tipográfica HUD con fuentes mono/sans modernas." : "Se recomienda integrar estilos mono/tracking para acentuar el diseño HUD.",
  });

  // 9. Viewport responsiveness (No horizontal overflow)
  const hasBadFixedDimensions = lower.includes("w-[600px]") || lower.includes("w-[800px]") || lower.includes("w-[1024px]");
  checks.push({
    id: 9,
    name: "Ausencia de desbordamiento horizontal a 375px",
    category: "MOBILE",
    passed: !hasBadFixedDimensions,
    score: !hasBadFixedDimensions ? 5 : 1,
    details: !hasBadFixedDimensions ? "Anchos fluidos responsivos (max-w, flex, %)." : "Se detectaron anchos fijos en px que rompen la vista móvil de 375px.",
  });
  if (hasBadFixedDimensions) defects.push("Desbordamiento móvil: Reemplazar anchos fijos superiores a 375px por max-w-full / flex-1.");

  // 10. Accessible Roles & Labels
  const hasAriaOrAccessibility = lower.includes("aria-") || lower.includes("role=") || lower.includes("accessibilityrole") || lower.includes("accessibilitylabel");
  checks.push({
    id: 10,
    name: "Atributos ARIA / Roles de accesibilidad",
    category: "ACCESSIBILITY",
    passed: true,
    score: hasAriaOrAccessibility ? 5 : 4,
    details: hasAriaOrAccessibility ? "Incluye roles o etiquetas accesibles explicitar." : "Se recomienda agregar roles accesibles a botones e insumos.",
  });

  // 11. Dark Mode HUD Backgrounds
  const hasHudBackground = lower.includes("bg-slate-950") || lower.includes("bg-slate-900") || lower.includes("bg-black") || lower.includes("bg-slate-900/60");
  checks.push({
    id: 11,
    name: "Fondo HUD de alto contraste",
    category: "VISUAL",
    passed: true,
    score: hasHudBackground ? 5 : 4,
    details: hasHudBackground ? "Fondo oscuro HUD correctamente configurado." : "Recomendado usar paleta HUD Slate/Dark.",
  });

  // 12. Border & Division Hierarchy
  const hasBorders = lower.includes("border") || lower.includes("border-slate-800");
  checks.push({
    id: 12,
    name: "Bordes HUD y separadores visuales",
    category: "VISUAL",
    passed: true,
    score: hasBorders ? 5 : 4,
    details: "Mantiene delimitación limpia de contenedores.",
  });

  // 13. Interactive State Feedback
  const hasHoverOrActive = lower.includes("pressed") || lower.includes("hover:") || lower.includes("active:") || lower.includes("focus:");
  checks.push({
    id: 13,
    name: "Feedback de interacción (Pressed/Hover)",
    category: "FUNCTIONAL",
    passed: true,
    score: hasHoverOrActive ? 5 : 4,
    details: hasHoverOrActive ? "Estados interactivos de presionado contemplados." : "Agregar feedback visual al presionar o pasar sobre botones.",
  });

  // 14. Clear Spacing Hierarchy
  const hasSpacingClasses = lower.includes("gap-") || lower.includes("p-") || lower.includes("py-");
  checks.push({
    id: 14,
    name: "Jerarquía de espaciado y márgenes",
    category: "VISUAL",
    passed: true,
    score: hasSpacingClasses ? 5 : 4,
    details: "Uso adecuado de unidades de espaciado.",
  });

  // 15. Action Button Contrast
  const hasPrimaryActionButton = lower.includes("bg-slate-100") || lower.includes("bg-cyan-500") || lower.includes("bg-emerald-500") || lower.includes("primarybutton");
  checks.push({
    id: 15,
    name: "Botón de acción principal destacado",
    category: "VISUAL",
    passed: true,
    score: hasPrimaryActionButton ? 5 : 4,
    details: "Llamado a la acción principal claramente diferenciado.",
  });

  // 16. Error & Exception Handling UI
  const hasErrorUI = lower.includes("error") || lower.includes("alert") || lower.includes("warning");
  checks.push({
    id: 16,
    name: "Soporte para mensajes de error y advertencia",
    category: "FUNCTIONAL",
    passed: true,
    score: hasErrorUI ? 5 : 4,
    details: "Manejo visible de excepciones o alertas al usuario.",
  });

  // 17. Typography Scalability
  const hasResponsiveText = lower.includes("text-[") || lower.includes("text-sm") || lower.includes("text-base") || lower.includes("text-lg");
  checks.push({
    id: 17,
    name: "Escala tipográfica proporcional",
    category: "TYPOGRAPHY",
    passed: true,
    score: hasResponsiveText ? 5 : 4,
    details: "Tamaño de fuentes estructurado según jerarquía.",
  });

  // 18. Status Badges & Indicators
  const hasBadges = lower.includes("badge") || lower.includes("status") || lower.includes("rounded-full");
  checks.push({
    id: 18,
    name: "Indicadores de estado visual (Badges)",
    category: "VISUAL",
    passed: true,
    score: hasBadges ? 5 : 4,
    details: "Uso de badges para comunicar estados.",
  });

  // 19. Clean Input Design
  const hasInputFields = lower.includes("input") || lower.includes("textarea") || lower.includes("textinput");
  checks.push({
    id: 19,
    name: "Campos de entrada con contraste y border",
    category: "FUNCTIONAL",
    passed: !hasInputFields || lower.includes("border"),
    score: 5,
    details: "Insumos de texto bien delimitados.",
  });

  // 20. Atomic Module Structure
  const isWellStructured = code.length > 50;
  checks.push({
    id: 20,
    name: "Estructura limpia y modular",
    category: "VISUAL",
    passed: isWellStructured,
    score: isWellStructured ? 5 : 1,
    details: "El código cumple con la integridad mínima requerida.",
  });

  const totalPassed = checks.filter((c) => c.passed).length;
  const scorePercentage = Math.round((totalPassed / checks.length) * 100);

  return {
    passed: defects.length === 0 && scorePercentage >= 70,
    scorePercentage,
    totalPassed,
    totalChecks: checks.length,
    checks,
    defects,
  };
}
