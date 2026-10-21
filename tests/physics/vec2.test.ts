import { describe, it, expect } from "vitest";
import {
  sumar,
  restar,
  escalar,
  punto,
  norma,
  normalizar,
  perpendicular,
} from "../../src/physics/vec2";

describe("vec2", () => {
  it("suma, resta y escalamiento", () => {
    expect(sumar({ x: 1, y: 2 }, { x: 3, y: 4 })).toEqual({ x: 4, y: 6 });
    expect(restar({ x: 3, y: 4 }, { x: 1, y: 2 })).toEqual({ x: 2, y: 2 });
    expect(escalar({ x: 1, y: -2 }, 3)).toEqual({ x: 3, y: -6 });
  });

  it("producto punto y norma (3-4-5)", () => {
    expect(punto({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11);
    expect(norma({ x: 3, y: 4 })).toBe(5);
  });

  it("normalizar devuelve longitud 1 y maneja el vector nulo", () => {
    expect(norma(normalizar({ x: 3, y: 4 }))).toBeCloseTo(1, 12);
    expect(normalizar({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("perpendicular es ortogonal al vector original", () => {
    const v = { x: 2, y: 5 };
    expect(punto(v, perpendicular(v))).toBe(0);
  });
});