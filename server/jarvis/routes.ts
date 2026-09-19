import type { Express } from "express";
import { orchestrate, orchestrateInput, validateMarginAndAuthorize } from "./orchestrator";
import { harnessInputSchema, generateWebCodeWithHarness } from "./deepseek-harness";
import { runPlaywrightE2EAudit } from "./playwright-qa";
import { deployInputSchema, executeAtomicDeployment } from "./deployment";
import { VERCEL_DESIGN_GUIDELINES } from "../../lib/taste-skill";

export function registerJarvisRoutes(app: Express) {
  app.post("/api/orchestrate", async (req, res) => {
    const parsed = orchestrateInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: "Invalid input", details: parsed.error.flatten() });
      return;
    }

    try {
      res.json({ ok: true, data: await orchestrate(parsed.data) });
    } catch (error) {
      console.error("[jarvis] orchestration failed", error);
      res.status(502).json({ ok: false, error: "Orchestration providers unavailable" });
    }
  });

  app.post("/api/costs/margin", (req, res) => {
    const values = req.body as Partial<Record<"salePrice" | "hostingCost" | "tokenCost" | "apiCosts", unknown>>;
    const numeric = ["salePrice", "hostingCost", "tokenCost", "apiCosts"] as const;
    if (numeric.some((key) => typeof values[key] !== "number" || !Number.isFinite(values[key] as number))) {
      res.status(400).json({ ok: false, error: "salePrice, hostingCost, tokenCost and apiCosts must be finite numbers" });
      return;
    }
    const costKeys = ["hostingCost", "tokenCost", "apiCosts"] as const;
    if ((values.salePrice as number) <= 0 || costKeys.some((key) => (values[key] as number) < 0)) {
      res.status(400).json({ ok: false, error: "salePrice must be positive and costs cannot be negative" });
      return;
    }
    res.json({ ok: true, data: validateMarginAndAuthorize(values as { salePrice: number; hostingCost: number; tokenCost: number; apiCosts: number }) });
  });

  // --- Web Factory & Playwright E2E QA API Routes ---

  app.get("/api/web-factory/guidelines", (_req, res) => {
    res.json({ ok: true, data: VERCEL_DESIGN_GUIDELINES });
  });

  app.post("/api/web-factory/generate", async (req, res) => {
    const parsed = harnessInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: "Invalid harness input", details: parsed.error.flatten() });
      return;
    }

    try {
      const artifact = await generateWebCodeWithHarness(parsed.data);
      res.json({ ok: true, data: artifact });
    } catch (error) {
      console.error("[web-factory] generation failed", error);
      res.status(500).json({ ok: false, error: "Web Factory code generation failed" });
    }
  });

  app.post("/api/web-factory/qa-audit", async (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    const brief = typeof req.body?.brief === "string" ? req.body.brief : "Web Factory project";
    const autoCorrect = req.body?.autoCorrect !== false;

    if (!code || code.trim().length < 10) {
      res.status(400).json({ ok: false, error: "code field is required and must contain code to audit" });
      return;
    }

    try {
      const auditResult = await runPlaywrightE2EAudit(code, { brief, autoCorrect });
      res.json({ ok: true, data: auditResult });
    } catch (error) {
      console.error("[web-factory] Playwright QA audit failed", error);
      res.status(500).json({ ok: false, error: "Playwright E2E QA audit failed" });
    }
  });

  app.post("/api/web-factory/deploy", async (req, res) => {
    const parsed = deployInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: "Invalid deploy input", details: parsed.error.flatten() });
      return;
    }

    try {
      const deployment = await executeAtomicDeployment(parsed.data);
      res.json({ ok: true, data: deployment });
    } catch (error) {
      console.error("[web-factory] deployment failed", error);
      res.status(500).json({ ok: false, error: "Web Factory atomic deployment failed" });
    }
  });
}
