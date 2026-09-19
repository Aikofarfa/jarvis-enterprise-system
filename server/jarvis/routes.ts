import type { Express } from "express";
import { orchestrate, orchestrateInput, validateMarginAndAuthorize } from "./orchestrator";

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
}
