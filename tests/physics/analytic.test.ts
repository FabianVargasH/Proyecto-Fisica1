import { describe, it, expect } from "vitest";
import { gravedadEfectiva } from "../../src/physics/gravity";
import { avanzarBola } from "../../src/physics/integrator";
import {
  GRAVEDAD,
  INCLINACION_INICIAL,
  MASA_BOLA,
  RADIO_BOLA,
  DT,
} from "../../src/physics/constants";
import type { Bola } from "../../src/physics/types";

describe("Validación analítica: gravedad efectiva en plano inclinado", () => {
  const g = 9.81;
  const theta = (6.5 * Math.PI) / 180;

  it("a = g·sen θ coincide con la fórmula cerrada (tolerancia 1e-12)", () => {
    const a = gravedadEfectiva(g, theta);
    expect(a.x).toBe(0);
    expect(Math.abs(a.y - g * Math.sin(theta))).toBeLessThan(1e-12);
  });

  it("con θ = 6.5° resulta a ≈ 1.11 m/s² (valor del Avance 1)", () => {
    expect(gravedadEfectiva(g, theta).y).toBeCloseTo(1.11, 2);
  });
});

describe("Validación analítica: caída por el plano inclinado", () => {
  it("el tiempo para recorrer d desde el reposo coincide con t = √(2d/a) (tolerancia 1e-9 m)", () => {
    const d = 0.5; // m
    const a = gravedadEfectiva(GRAVEDAD, INCLINACION_INICIAL);
    const tTeorico = Math.sqrt((2 * d) / a.y); // s

    let bola: Bola = {
      posicion: { x: 0, y: 0 },
      velocidad: { x: 0, y: 0 },
      radio: RADIO_BOLA,
      masa: MASA_BOLA,
    };

    // Pasos completos de Δt y un último paso parcial hasta tTeorico
    const pasos = Math.floor(tTeorico / DT);
    for (let i = 0; i < pasos; i++) {
      bola = avanzarBola(bola, a, DT);
    }
    bola = avanzarBola(bola, a, tTeorico - pasos * DT);

    expect(Math.abs(bola.posicion.y - d)).toBeLessThan(1e-9);
    expect(Math.abs(bola.velocidad.y - a.y * tTeorico)).toBeLessThan(1e-9);
    expect(bola.posicion.x).toBe(0);
  });
});