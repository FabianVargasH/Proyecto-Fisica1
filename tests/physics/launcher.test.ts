import { describe, it, expect } from "vitest";
import { energiaElastica, velocidadLanzamiento } from "../../src/physics/launcher";
import { norma } from "../../src/physics/vec2";
import {
  GRAVEDAD,
  INCLINACION_INICIAL,
  LARGO_MESA,
  K_LANZADOR,
  MASA_BOLA,
  COMPRESION_MAXIMA,
} from "../../src/physics/constants";

const ARRIBA = { x: 0, y: -1 };

describe("Validación analítica: lanzador (balance de energía)", () => {
  it("½·k·x² = ½·m·v0² (tolerancia relativa 1e-12)", () => {
    const x = 0.04;
    const v = velocidadLanzamiento(x, K_LANZADOR, MASA_BOLA, ARRIBA);
    const energiaCinetica = 0.5 * MASA_BOLA * norma(v) ** 2;
    const energiaResorte = energiaElastica(K_LANZADOR, x);
    expect(Math.abs(energiaCinetica - energiaResorte) / energiaResorte).toBeLessThan(1e-12);
  });

  it("con la compresión máxima sale a ≈ 4.74 m/s (valor del Avance 1)", () => {
    const v = velocidadLanzamiento(COMPRESION_MAXIMA, K_LANZADOR, MASA_BOLA, ARRIBA);
    expect(norma(v)).toBeCloseTo(4.74, 2);
  });

  it("el lanzador puede poner la bola en juego: llega al final del carril", () => {
    // Rapidez mínima para subir L por el plano: v = √(2·g·sen θ·L)
    const aPlano = GRAVEDAD * Math.sin(INCLINACION_INICIAL);
    const vMinima = Math.sqrt(2 * aPlano * LARGO_MESA);
    // Compresión mínima asociada: x = v·√(m/k)
    const xMinima = vMinima * Math.sqrt(MASA_BOLA / K_LANZADOR);

    expect(xMinima).toBeCloseTo(0.0193, 4);
    expect(xMinima).toBeLessThan(COMPRESION_MAXIMA);

    const v = velocidadLanzamiento(COMPRESION_MAXIMA, K_LANZADOR, MASA_BOLA, ARRIBA);
    expect(norma(v)).toBeGreaterThan(vMinima);
  });

  it("la dirección se normaliza y apunta hacia donde se pide", () => {
    const v = velocidadLanzamiento(0.03, K_LANZADOR, MASA_BOLA, { x: 0, y: -5 });
    expect(v.x).toBe(0);
    expect(v.y).toBeLessThan(0);
  });
});