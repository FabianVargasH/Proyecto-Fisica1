import { describe, it, expect } from "vitest";
import { respuestaChoque } from "../../src/physics/response";
import { punto } from "../../src/physics/vec2";
import { E_CIRCULAR, E_FLIPPER, MASA_BOLA } from "../../src/physics/constants";

// Pared horizontal; la normal apunta hacia la bola (hacia arriba en el sistema y-abajo).
const N = { x: 0, y: -1 };

describe("response: casos límite de la restitución", () => {
  it("e = 1 (elástico): conserva la rapidez e invierte la componente normal", () => {
    const r = respuestaChoque({ x: 3, y: 4 }, N, 1, MASA_BOLA);
    expect(r.velocidad.x).toBeCloseTo(3, 12);
    expect(r.velocidad.y).toBeCloseTo(-4, 12);
    expect(r.energiaDisipada).toBeCloseTo(0, 12);
  });

  it("e = 0 (totalmente inelástico): anula la componente normal", () => {
    const r = respuestaChoque({ x: 3, y: 4 }, N, 0, MASA_BOLA);
    expect(r.velocidad.x).toBeCloseTo(3, 12);
    expect(r.velocidad.y).toBeCloseTo(0, 12);
  });
});

describe("Validación analítica: choque con obstáculo fijo", () => {
  const v = { x: 3, y: 4 };
  const e = E_CIRCULAR;

  it("tangencial se conserva y normal queda v'n = −e·vn", () => {
    const r = respuestaChoque(v, N, e, MASA_BOLA);
    expect(r.velocidad.x).toBeCloseTo(3, 12);
    expect(r.velocidad.y).toBeCloseTo(-e * 4, 12);
  });

  it("la energía disipada coincide con ΔE = ½·m·(1 − e²)·vn² (tolerancia 1e-12 J)", () => {
    const r = respuestaChoque(v, N, e, MASA_BOLA);
    const vn = 4;
    const teorica = 0.5 * MASA_BOLA * (1 - e * e) * vn * vn;
    expect(Math.abs(r.energiaDisipada - teorica)).toBeLessThan(1e-12);
  });

  it("la fórmula también vale con una normal inclinada", () => {
    const n = { x: 1 / Math.SQRT2, y: 1 / Math.SQRT2 };
    const vIn = { x: -2, y: -1 };
    const vn = punto(vIn, n);
    const r = respuestaChoque(vIn, n, e, MASA_BOLA);
    const teorica = 0.5 * MASA_BOLA * (1 - e * e) * vn * vn;
    expect(Math.abs(r.energiaDisipada - teorica)).toBeLessThan(1e-12);
  });

  it("el impulso es J = m·(v' − v), de magnitud m·(1 + e)·|vn| y a lo largo de la normal", () => {
    const r = respuestaChoque(v, N, e, MASA_BOLA);
    expect(r.impulso.x).toBeCloseTo(0, 12);
    expect(r.impulso.y).toBeCloseTo(-MASA_BOLA * (1 + e) * 4, 12);
  });

  it("la masa escala el impulso pero no la velocidad de salida", () => {
    const a = respuestaChoque(v, N, e, 0.08);
    const b = respuestaChoque(v, N, e, 0.16);
    expect(b.velocidad).toEqual(a.velocidad);
    expect(b.impulso.y).toBeCloseTo(2 * a.impulso.y, 12);
  });
});

describe("response: superficie móvil (flipper)", () => {
  it("bola quieta golpeada por una superficie a 5 m/s sale a (1 + e)·5 m/s", () => {
    const r = respuestaChoque({ x: 0, y: 0 }, N, E_FLIPPER, MASA_BOLA, { x: 0, y: -5 });
    expect(r.velocidad.x).toBeCloseTo(0, 12);
    expect(r.velocidad.y).toBeCloseTo(-(1 + E_FLIPPER) * 5, 12);
    // El flipper aporta energía: la "disipada" es negativa
    expect(r.energiaDisipada).toBeCloseTo(-0.5 * MASA_BOLA * ((1 + E_FLIPPER) * 5) ** 2, 12);
  });
});

describe("response: robustez", () => {
  it("si la bola ya se aleja de la superficie no hay cambio", () => {
    const r = respuestaChoque({ x: 1, y: -2 }, N, 0.8, MASA_BOLA);
    expect(r.velocidad).toEqual({ x: 1, y: -2 });
    expect(r.impulso).toEqual({ x: 0, y: 0 });
    expect(r.energiaDisipada).toBe(0);
  });

  it("normaliza la normal recibida y es determinista", () => {
    const a = respuestaChoque({ x: 3, y: 4 }, { x: 0, y: -10 }, 0.8, MASA_BOLA);
    const b = respuestaChoque({ x: 3, y: 4 }, N, 0.8, MASA_BOLA);
    expect(a).toEqual(b);
  });
});