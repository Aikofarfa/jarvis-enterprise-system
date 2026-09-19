import { describe, expect, it } from "vitest";
import { validateMarginAndAuthorize } from "../server/jarvis/orchestrator";

describe("validateMarginAndAuthorize", () => {
  it("approves a sale with at least 60 percent margin", () => {
    expect(validateMarginAndAuthorize({ salePrice: 1_000_000, hostingCost: 50_000, tokenCost: 20_000, apiCosts: 10_000 })).toEqual({
      sale_price: 1_000_000,
      total_cost: 130_000,
      net_profit: 870_000,
      margin_percentage: 87,
      status: "APPROVED",
    });
  });

  it("requires human approval below the threshold", () => {
    expect(validateMarginAndAuthorize({ salePrice: 1_000_000, hostingCost: 300_000, tokenCost: 100_000, apiCosts: 50_000 }).status).toBe("REQUIRES_HUMAN_APPROVAL");
  });
});
