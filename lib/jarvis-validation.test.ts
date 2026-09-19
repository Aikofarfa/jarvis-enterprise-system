import { describe, expect, it } from "vitest";

import { isBriefReady, normalizeBrief } from "./jarvis-validation";

describe("validación de briefs JARVIS", () => {
  it("normaliza espacios y conserva el texto útil", () => {
    expect(normalizeBrief("  Clínica   dental   Bogotá  ")).toBe("Clínica dental Bogotá");
  });

  it("rechaza briefs demasiado cortos", () => {
    expect(isBriefReady("web" )).toBe(false);
    expect(isBriefReady("Landing para clínica")).toBe(true);
  });
});
