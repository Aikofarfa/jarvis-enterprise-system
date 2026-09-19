import { z } from "zod";

export const orchestrateInput = z.object({
  brief: z.string().trim().min(8).max(4000),
  salePrice: z.number().positive().optional(),
  hostingCost: z.number().nonnegative().default(0),
  tokenCost: z.number().nonnegative().default(0),
  apiCosts: z.number().nonnegative().default(0),
});

export type OrchestrateInput = z.infer<typeof orchestrateInput>;

export type MarginResult = {
  sale_price: number;
  total_cost: number;
  net_profit: number;
  margin_percentage: number;
  status: "APPROVED" | "REQUIRES_HUMAN_APPROVAL";
};

export function validateMarginAndAuthorize(input: {
  salePrice: number;
  hostingCost: number;
  tokenCost: number;
  apiCosts: number;
}): MarginResult {
  const totalCost = input.hostingCost + input.tokenCost + input.apiCosts + input.salePrice * 0.05;
  const netProfit = input.salePrice - totalCost;
  const marginPercentage = (netProfit / input.salePrice) * 100;

  return {
    sale_price: input.salePrice,
    total_cost: round(totalCost),
    net_profit: round(netProfit),
    margin_percentage: round(marginPercentage),
    status: marginPercentage >= 60 ? "APPROVED" : "REQUIRES_HUMAN_APPROVAL",
  };
}

export async function orchestrate(input: OrchestrateInput) {
  const salePrice = input.salePrice ?? inferStartingPrice(input.brief);
  const margin = validateMarginAndAuthorize({
    salePrice,
    hostingCost: input.hostingCost,
    tokenCost: input.tokenCost,
    apiCosts: input.apiCosts,
  });

  const provider = await tryConfiguredAiProviders(input.brief);

  return {
    mode: provider ? "ai" : "deterministic",
    provider: provider?.provider ?? null,
    summary: provider?.summary ?? "Brief recibido y validado. Configura un proveedor IA para obtener análisis semántico.",
    margin,
    requiresHumanApproval: margin.status === "REQUIRES_HUMAN_APPROVAL",
    nextAction: margin.status === "APPROVED" ? "HUMAN_REVIEW_BEFORE_PRODUCTION" : "REQUIRES_HUMAN_APPROVAL",
  } as const;
}

function inferStartingPrice(brief: string): number {
  const lower = brief.toLowerCase();
  if (lower.includes("e-commerce") || lower.includes("tienda") || lower.includes("shop")) return 3_000_000;
  if (lower.includes("avanzad") || lower.includes("portal")) return 2_000_000;
  if (lower.includes("corporativ")) return 1_500_000;
  return 800_000;
}

async function tryConfiguredAiProviders(brief: string): Promise<{ provider: string; summary: string } | null> {
  const candidates = [
    { name: "deepseek", baseUrl: process.env.DEEPSEEK_API_BASE, key: process.env.DEEPSEEK_API_KEY, model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat" },
    { name: "openai", baseUrl: process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1", key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL ?? "gpt-4o-mini" },
  ].filter((candidate) => candidate.key && candidate.baseUrl);

  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate.baseUrl!.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${candidate.key}` },
        body: JSON.stringify({
          model: candidate.model,
          temperature: 0.1,
          max_tokens: 300,
          messages: [
            { role: "system", content: "Resume el brief en una sola frase en español. No inventes costos, clientes ni métricas." },
            { role: "user", content: brief },
          ],
        }),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) continue;
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const summary = body.choices?.[0]?.message?.content?.trim();
      if (summary) return { provider: candidate.name, summary };
    } catch {
      // Failover is intentional: try the next configured provider without exposing credentials.
    }
  }
  return null;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
