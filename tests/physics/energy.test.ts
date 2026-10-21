import { describe, it, expect } from "vitest";
import {
  energiaCinetica,
  energiaPotencialGravitatoria,
  energiaMecanica,
} from "../../src/physics/energy";
import { gravedadEfectiva } from "../../src/physics/gravity";
import { avanzarBola } from "../../src/physics/integrator";
import {
  GRAVEDAD,
  INCLINACION_INICIAL,
  LARGO_MESA,
  MASA_BOLA,
  RADIO_BOLA,
  DT,
} from "../../src/physics/constants";
import type { Bola } from "../../src/physics/types";

const bolaInicial: Bola = {
  posicion: { x: 0.28, y: 0.1 },
  velocidad: { x: 0, y: 0 },
  radio: RADIO_BOLA,
  masa: MASA_BOLA,
};

describe("energy: valores conocidos", () => {
  it("K = ½·m·v² con v = (3, 4) m/s", () => {
    const bola: Bola = { ...bolaInicial, masa: 0.08, velocidad: { x: 3, y: 4 } };
    expect(energiaCinetica(bola)).toBeCloseTo(1, 12);
  });

  it("Ug es 0 en el borde inferior y m·g·L·sen θ en el borde superior", () => {
    const abajo: Bola = { ...bolaInicial, posicion: { x: 0, y: LARGO_MESA } };
    const arriba: Bola = { ...bolaInicial, posicion: { x: 0, y: 0 } };
    expect(energiaPotencialGravitatoria(abajo, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA)).toBeCloseTo(0, 12);
    expect(energiaPotencialGravitatoria(arriba, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA)).toBeCloseTo(
      MASA_BOLA * GRAVEDAD * LARGO_MESA * Math.sin(INCLINACION_INICIAL),
      12,
    );
  });

  it("E = K + Ug + Uel", () => {
    const bola: Bola = { ...bolaInicial, velocidad: { x: 1, y: 2 } };
    const suma =
      energiaCinetica(bola) +
      energiaPotencialGravitatoria(bola, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA) +
      0.3;
    expect(energiaMecanica(bola, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA, 0.3)).toBeCloseTo(suma, 12);
  });
});

describe("Validación analítica: sistema sin disipación", () => {
  it("la energía mecánica se mantiene dentro del 1% de su valor inicial tras 10 s simulados", () => {
    const a = gravedadEfectiva(GRAVEDAD, INCLINACION_INICIAL);
    const e0 = energiaMecanica(bolaInicial, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA);

    let bola = bolaInicial;
    const pasos = Math.round(10 / DT);
    for (let i = 0; i < pasos; i++) {
      bola = avanzarBola(bola, a, DT);
    }

    const e = energiaMecanica(bola, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA);
    expect(Math.abs(e - e0) / e0).toBeLessThan(0.01);
  });
});