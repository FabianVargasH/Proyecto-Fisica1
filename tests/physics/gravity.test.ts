import { describe, it, expect } from "vitest";
import { gravedadEfectiva } from "../../src/physics/gravity";

describe("gravity", () => {
  it("mesa horizontal (θ = 0): no hay aceleración sobre el plano", () => {
    expect(gravedadEfectiva(9.81, 0)).toEqual({ x: 0, y: 0 });
  });

  it("plano vertical (θ = 90°): la aceleración es g completa", () => {
    expect(gravedadEfectiva(9.81, Math.PI / 2).y).toBeCloseTo(9.81, 12);
  });
});