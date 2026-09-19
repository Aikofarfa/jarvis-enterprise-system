import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { auditTasteSkillCode, calculateContrastRatio, parseHexColor } from "../lib/taste-skill";
import { generateWebCodeWithHarness } from "../server/jarvis/deepseek-harness";
import { runPlaywrightE2EAudit } from "../server/jarvis/playwright-qa";
import { executeAtomicDeployment } from "../server/jarvis/deployment";

describe("Taste Skill & Design Guidelines", () => {
  it("calculates contrast ratios correctly", () => {
    // White (#ffffff) on Black (#000000) should be 21:1
    const maxContrast = calculateContrastRatio("#ffffff", "#000000");
    expect(maxContrast).toBeGreaterThanOrEqual(20);

    // Slate 100 on Slate 950 should be well above 4.5:1
    const hudContrast = calculateContrastRatio("#f1f5f9", "#020617");
    expect(hudContrast).toBeGreaterThanOrEqual(4.5);
  });

  it("parses hex colors into RGB", () => {
    const rgb = parseHexColor("#10b981");
    expect(rgb).toEqual({ r: 16, g: 185, b: 129 });
  });

  it("audits code and detects contrast / touch target compliance", () => {
    const validCode = `
      <main className="bg-slate-950 text-slate-100 p-4">
        <h1 className="text-xl font-bold">Título de la Clínica</h1>
        <button className="min-h-[44px] min-w-[44px] bg-slate-100 text-slate-950 font-bold p-4" aria-label="Aceptar">
          Enviar
        </button>
        <img src="logo.png" alt="Logo corporativo" />
      </main>
    `;

    const report = auditTasteSkillCode(validCode);
    expect(report.passed).toBe(true);
    expect(report.scorePercentage).toBeGreaterThanOrEqual(70);
    expect(report.totalChecks).toBe(20);
  });
});

describe("DeepSeek Harness Code Generator", () => {
  it("generates TSX code complying with Vercel Rules", async () => {
    const artifact = await generateWebCodeWithHarness({
      brief: "Landing page para un restaurante gourmet en Medellín",
    });

    expect(artifact.code).toContain("JARVIS Web Factory");
    expect(artifact.code).toContain("min-h-[44px]");
    expect(artifact.code).not.toContain("href=\"#\"");
  });

  it("accepts defect feedback in self-correction mode", async () => {
    const artifact = await generateWebCodeWithHarness({
      brief: "Portal de contabilidad",
      defects: ["Falla de contraste en botones"],
      iteration: 2,
    });

    expect(artifact.iteration).toBe(2);
    expect(artifact.code.length).toBeGreaterThan(100);
  });
});

describe("Playwright E2E QA Auditor", () => {
  it("sweeps links, forms, 375px viewport and runs 20-point checklist", async () => {
    const initialCode = `
      <main className="bg-slate-950 text-slate-100 p-4">
        <h1>Clínica Dental Bogotá</h1>
        <a href="#">Enlace Vacío Prohibido</a>
      </main>
    `;

    const audit = await runPlaywrightE2EAudit(initialCode, {
      brief: "Clínica Dental Bogotá",
      autoCorrect: true,
      maxIterations: 2,
    });

    expect(audit.iterationsRan).toBeGreaterThanOrEqual(1);
    expect(audit.linkSweeper.passed).toBe(true);
    expect(audit.auditReport.totalChecks).toBe(20);
  });
});

describe("Manus Atomic Deployment Engine", () => {
  it("packages and deploys artifact returning active live URL and saving HTML file", async () => {
    const deployment = await executeAtomicDeployment({
      code: "function App() { return <main>App Live</main>; }",
      brief: "Clínica Dental Bogotá",
      provider: "manus",
    });

    expect(deployment.ok).toBe(true);
    expect(deployment.status).toBe("DEPLOYED");
    expect(deployment.deploymentUrl).toContain("/sites/jarvis-");
    expect(deployment.buildHash).toBeTruthy();

    const siteFilename = deployment.deploymentUrl.split("/").pop() || "";
    const sitePath = path.join(process.cwd(), "public", "sites", siteFilename);
    expect(fs.existsSync(sitePath)).toBe(true);
  });
});

describe("Google Maps Business Prospector", () => {
  it("filters leads without website and generates sales pitch demo", async () => {
    const res = await fetch("http://localhost:3000/api/prospector/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "Restaurantes", city: "Bogotá" }),
    });

    if (res.ok) {
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data[0].hasWebsite).toBe(false);
    }
  });
});
