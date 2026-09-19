import type { Express } from "express";
import { orchestrate, orchestrateInput, validateMarginAndAuthorize } from "./orchestrator";
import { harnessInputSchema, generateWebCodeWithHarness } from "./deepseek-harness";
import { runPlaywrightE2EAudit } from "./playwright-qa";
import { deployInputSchema, executeAtomicDeployment } from "./deployment";
import { VERCEL_DESIGN_GUIDELINES } from "../../lib/taste-skill";

export interface BusinessProspect {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  rating: number;
  hasWebsite: boolean;
  websiteUrl?: string;
  status: "SIN_SITIO_WEB" | "CON_SITIO_WEB";
}

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

  // --- Google Maps Prospector API Routes (Business leads without websites) ---

  app.post("/api/prospector/search", async (req, res) => {
    const query = typeof req.body?.query === "string" ? req.body.query.trim() : "Restaurantes";
    const city = typeof req.body?.city === "string" ? req.body.city.trim() : "Bogotá";
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (apiKey) {
      try {
        const googleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " " + city)}&key=${apiKey}`;
        const googleRes = await fetch(googleUrl);
        if (googleRes.ok) {
          const body = (await googleRes.json()) as { results?: Array<{ place_id: string; name: string; formatted_address: string; rating?: number; website?: string }> };
          const prospects: BusinessProspect[] = (body.results || []).map((item) => {
            const hasWebsite = Boolean(item.website && item.website.trim().length > 0);
            return {
              id: item.place_id,
              name: item.name,
              category: query,
              city,
              address: item.formatted_address || city,
              phone: "+57 300 000 0000",
              rating: item.rating || 4.5,
              hasWebsite,
              websiteUrl: item.website,
              status: hasWebsite ? "CON_SITIO_WEB" : "SIN_SITIO_WEB",
            };
          });

          res.json({ ok: true, data: prospects });
          return;
        }
      } catch (err) {
        console.error("[prospector] Google Maps Places API call failed, falling back to mock prospects", err);
      }
    }

    // Local prospects filter (no website)
    const sampleProspects: BusinessProspect[] = [
      {
        id: "place-101",
        name: `Pizzería Don Mario (${query})`,
        category: query,
        city,
        address: "Calle 85 # 14-20, " + city,
        phone: "+57 311 234 5678",
        rating: 4.8,
        hasWebsite: false,
        status: "SIN_SITIO_WEB",
      },
      {
        id: "place-102",
        name: `Clínica Odontológica Sonrisas (${query})`,
        category: query,
        city,
        address: "Carrera 15 # 93-40, " + city,
        phone: "+57 300 987 6543",
        rating: 4.6,
        hasWebsite: false,
        status: "SIN_SITIO_WEB",
      },
      {
        id: "place-103",
        name: `Peluquería Luxe Studio (${query})`,
        category: query,
        city,
        address: "Calle 116 # 19-35, " + city,
        phone: "+57 320 555 1234",
        rating: 4.9,
        hasWebsite: false,
        status: "SIN_SITIO_WEB",
      },
    ];

    res.json({ ok: true, data: sampleProspects });
  });

  app.post("/api/prospector/generate-pitch", async (req, res) => {
    const businessName = typeof req.body?.businessName === "string" ? req.body.businessName.trim() : "Negocio Local";
    const category = typeof req.body?.category === "string" ? req.body.category.trim() : "Servicios";
    const city = typeof req.body?.city === "string" ? req.body.city.trim() : "Colombia";
    const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";

    const brief = `Landing demo moderna y responsive para ${businessName} en ${city}. Incluye catálogo de ${category}, formulario de contacto con WhatsApp y reserva directa.`;

    try {
      const artifact = await generateWebCodeWithHarness({ brief });
      const qaResult = await runPlaywrightE2EAudit(artifact.code, { brief, autoCorrect: true });
      const deployment = await executeAtomicDeployment({ code: qaResult.code, brief, provider: "manus" });

      const salesPitchScript = `Hola equipo de ${businessName}, notamos en Google Maps que cuentan con una excelente calificación (${category} en ${city}), pero no tienen un sitio web oficial publicado.
Hemos preparado una vista previa demo interactiva lista para su negocio:
🔗 URL Demo Live: ${deployment.deploymentUrl}

¿Les gustaría agendar una breve llamada de 5 minutos para conectarlo a su dominio propio y comenzar a captar clientes directamente?`;

      res.json({
        ok: true,
        data: {
          businessName,
          category,
          city,
          phone,
          demoUrl: deployment.deploymentUrl,
          qaScorePercentage: qaResult.auditReport.scorePercentage,
          salesPitchScript,
          brief,
        },
      });
    } catch (error) {
      console.error("[prospector] pitch generation failed", error);
      res.status(500).json({ ok: false, error: "Prospector pitch generation failed" });
    }
  });
}
