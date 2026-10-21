import { describe, it, expect } from "vitest";
import { avanzarBola } from "../../src/physics/integrator";
import type { Bola } from "../../src/physics/types";

const bolaEnReposo: Bola = {
  posicion: { x: 0.1, y: 0.2 },
  velocidad: { x: 0, y: 0 },
  radio: 0.013,
  masa: 0.08,
};

describe("integrator", () => {
  it("sin aceleración la bola mantiene velocidad constante", () => {
    const bola: Bola = { ...bolaEnReposo, velocidad: { x: 1, y: -2 } };
    const r = avanzarBola(bola, { x: 0, y: 0 }, 0.5);
    expect(r.posicion).toEqual({ x: 0.6, y: -0.8 });
    expect(r.velocidad).toEqual({ x: 1, y: -2 });
  });

  it("es pura: no modifica la bola de entrada y es determinista", () => {
    const copia = structuredClone(bolaEnReposo);
    const a = avanzarBola(bolaEnReposo, { x: 0, y: 1.11 }, 1 / 240);
    const b = avanzarBola(bolaEnReposo, { x: 0, y: 1.11 }, 1 / 240);
    expect(bolaEnReposo).toEqual(copia);
    expect(a).toEqual(b);
  });

  it("conserva masa y radio", () => {
    const r = avanzarBola(bolaEnReposo, { x: 0, y: 1 }, 0.1);
    expect(r.masa).toBe(bolaEnReposo.masa);
    expect(r.radio).toBe(bolaEnReposo.radio);
  });
});