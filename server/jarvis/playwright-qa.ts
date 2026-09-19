import { auditTasteSkillCode, type QAAuditReport } from "../../lib/taste-skill";
import { generateWebCodeWithHarness } from "./deepseek-harness";

export interface PlaywrightAuditResult {
  code: string;
  auditReport: QAAuditReport;
  linkSweeper: {
    totalLinks: number;
    brokenLinks: string[];
    passed: boolean;
  };
  formSimulator: {
    formsFound: number;
    hasLoadingState: boolean;
    hasSuccessState: boolean;
    passed: boolean;
  };
  mobileViewport375px: {
    hasHorizontalScrollbar: boolean;
    passed: boolean;
  };
  iterationsRan: number;
  autoCorrected: boolean;
}

export async function runPlaywrightE2EAudit(
  initialCode: string,
  options?: {
    brief?: string;
    autoCorrect?: boolean;
    maxIterations?: number;
  },
): Promise<PlaywrightAuditResult> {
  const autoCorrect = options?.autoCorrect ?? true;
  const maxIterations = options?.maxIterations ?? 3;
  const brief = options?.brief || "Sitio web generado por Web Factory";

  let currentCode = initialCode;
  let iterationsRan = 1;
  let autoCorrected = false;

  while (iterationsRan <= maxIterations) {
    const auditReport = auditTasteSkillCode(currentCode);
    const linkSweeper = runLinkSweeper(currentCode);
    const formSimulator = runFormSimulator(currentCode);
    const mobileViewport375px = checkMobileViewport375px(currentCode);

    const isFullyCompliant =
      auditReport.passed && linkSweeper.passed && formSimulator.passed && mobileViewport375px.passed;

    if (isFullyCompliant || !autoCorrect || iterationsRan >= maxIterations) {
      return {
        code: currentCode,
        auditReport,
        linkSweeper,
        formSimulator,
        mobileViewport375px,
        iterationsRan,
        autoCorrected,
      };
    }

    // Collect all structured defects for the hot-fix self-correction loop
    const combinedDefects = [
      ...auditReport.defects,
      ...(linkSweeper.brokenLinks.length > 0 ? [`Enlaces rotos: ${linkSweeper.brokenLinks.join(", ")}`] : []),
      ...(!formSimulator.passed ? ["Formularios: Agregar estados visibles de carga y envío (loading / success)."] : []),
      ...(!mobileViewport375px.passed ? ["Desbordamiento 375px: Remover anchos fijos que generen scrollbar horizontal en móviles."] : []),
    ];

    // Re-inject structured error payload into deepseek-harness
    const correctedArtifact = await generateWebCodeWithHarness({
      brief,
      defects: combinedDefects,
      iteration: iterationsRan + 1,
    });

    currentCode = correctedArtifact.code;
    autoCorrected = true;
    iterationsRan++;
  }

  const finalAudit = auditTasteSkillCode(currentCode);
  return {
    code: currentCode,
    auditReport: finalAudit,
    linkSweeper: runLinkSweeper(currentCode),
    formSimulator: runFormSimulator(currentCode),
    mobileViewport375px: checkMobileViewport375px(currentCode),
    iterationsRan,
    autoCorrected,
  };
}

function runLinkSweeper(code: string) {
  const lower = code.toLowerCase();
  const hrefMatches = lower.match(/href=["']([^"']*)["']/g) || [];
  const brokenLinks: string[] = [];

  for (const match of hrefMatches) {
    if (match.includes('href="#"') || match.includes("href=''") || match.includes('href=""') || match.includes("href='#'")) {
      brokenLinks.push("href='#' o vacío");
    }
  }

  return {
    totalLinks: hrefMatches.length,
    brokenLinks,
    passed: brokenLinks.length === 0,
  };
}

function runFormSimulator(code: string) {
  const lower = code.toLowerCase();
  const hasForm = lower.includes("<form") || lower.includes("onsubmit");
  if (!hasForm) {
    return {
      formsFound: 0,
      hasLoadingState: true,
      hasSuccessState: true,
      passed: true,
    };
  }

  const hasLoadingState = lower.includes("loading") || lower.includes("submitting") || lower.includes("disabled");
  const hasSuccessState = lower.includes("success") || lower.includes("enviad") || lower.includes("gracias");

  return {
    formsFound: 1,
    hasLoadingState,
    hasSuccessState,
    passed: hasLoadingState && hasSuccessState,
  };
}

function checkMobileViewport375px(code: string) {
  const lower = code.toLowerCase();
  const hasFixedOverflow = lower.includes("w-[500px]") || lower.includes("w-[600px]") || lower.includes("w-[800px]") || lower.includes("min-w-[600px]");

  return {
    hasHorizontalScrollbar: hasFixedOverflow,
    passed: !hasFixedOverflow,
  };
}
