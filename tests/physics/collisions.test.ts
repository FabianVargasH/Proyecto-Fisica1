import { describe, it, expect } from "vitest";
import {
  contactoBolaCirculo,
  contactoBolaSegmento,
  impactoContinuoCirculo,
  impactoContinuoSegmento,
  primerImpacto,
} from "../../src/physics/collisions";
import type { Bola, ObstaculoCircular, ObstaculoPlano } from "../../src/physics/types";

const R_BOLA = 0.013;

function bolaEn(x: number, y: number): Bola {
  return { posicion: { x, y }, velocidad: { x: 0, y: 0 }, radio: R_BOLA, masa: 0.08 };
}

function circulo(x: number, y: number, radio = 0.05): ObstaculoCircular {
  return { centro: { x, y }, radio, restitucion: 0.8 };
}

function muro(x1: number, y1: number, x2: number, y2: number): ObstaculoPlano {
  return { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, restitucion: 0.6 };
}

describe("contacto estático", () => {
  it("bola–círculo: normal, punto y profundidad", () => {
    const c = contactoBolaCirculo(bolaEn(0.06, 0), circulo(0, 0));
    expect(c).not.toBeNull();
    expect(c!.normal.x).toBeCloseTo(1, 12);
    expect(c!.normal.y).toBeCloseTo(0, 12);
    expect(c!.profundidad).toBeCloseTo(0.003, 10);
    expect(c!.punto.x).toBeCloseTo(0.05, 12);
  });

  it("bola–círculo: sin contacto si están separados", () => {
    expect(contactoBolaCirculo(bolaEn(0.07, 0), circulo(0, 0))).toBeNull();
  });

  it("bola–segmento: contacto con la cara y con un extremo", () => {
    const m = muro(0, 0, 1, 0);
    const cara = contactoBolaSegmento(bolaEn(0.5, -0.01), m);
    expect(cara!.normal).toEqual({ x: 0, y: -1 });
    expect(cara!.profundidad).toBeCloseTo(0.003, 10);

    const extremo = contactoBolaSegmento(bolaEn(1.01, 0), m);
    expect(extremo!.normal.x).toBeCloseTo(1, 12);
    expect(extremo!.profundidad).toBeCloseTo(0.003, 10);
  });

  it("bola–segmento: sin contacto si está lejos", () => {
    expect(contactoBolaSegmento(bolaEn(0.5, -0.05), muro(0, 0, 1, 0))).toBeNull();
  });
});

describe("detección continua", () => {
  it("círculo: instante de impacto exacto, s = (1 − (r+R)) / 2", () => {
    const impacto = impactoContinuoCirculo({ x: -1, y: 0 }, { x: 1, y: 0 }, R_BOLA, circulo(0, 0));
    expect(impacto).not.toBeNull();
    expect(impacto!.t).toBeCloseTo((1 - 0.063) / 2, 12);
    expect(impacto!.normal.x).toBeCloseTo(-1, 12);
  });

  it("círculo: sin impacto si la trayectoria pasa de largo o se aleja", () => {
    expect(impactoContinuoCirculo({ x: -1, y: 0.5 }, { x: 1, y: 0.5 }, R_BOLA, circulo(0, 0))).toBeNull();
    expect(impactoContinuoCirculo({ x: 0.5, y: 0 }, { x: 1, y: 0 }, R_BOLA, circulo(0, 0))).toBeNull();
  });

  it("segmento: no hay atravesamiento a alta velocidad (10 m en un paso)", () => {
    const pared = muro(0.5, -1, 0.5, 1);
    const impacto = impactoContinuoSegmento({ x: 0, y: 0 }, { x: 10, y: 0 }, R_BOLA, pared);
    expect(impacto).not.toBeNull();
    expect(impacto!.t).toBeCloseTo((0.5 - R_BOLA) / 10, 12);
    expect(impacto!.normal.x).toBeCloseTo(-1, 12);
    expect(impacto!.punto.x).toBeCloseTo(0.5, 12);
  });

  it("segmento: sin impacto si la trayectoria pasa más allá del extremo", () => {
    const pared = muro(0.5, -1, 0.5, -0.5);
    expect(impactoContinuoSegmento({ x: 0, y: 0 }, { x: 1, y: 0 }, R_BOLA, pared)).toBeNull();
  });

  it("segmento: impacto contra el extremo usa la normal radial", () => {
    const pared = muro(0.5, -1, 0.5, 0);
    const impacto = impactoContinuoSegmento({ x: 0, y: 0 }, { x: 1, y: 0 }, R_BOLA, pared);
    expect(impacto).not.toBeNull();
    expect(impacto!.t).toBeCloseTo(0.487, 12);
  });

  it("obstáculo móvil: bola quieta y muro que se acerca a 10 m/s durante 0.1 s", () => {
    const pared = muro(0.5, -1, 0.5, 1);
    const impacto = impactoContinuoSegmento(
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      R_BOLA,
      pared,
      { x: -10, y: 0 },
      0.1,
    );
    expect(impacto).not.toBeNull();
    expect(impacto!.t).toBeCloseTo(0.487, 12);
    expect(impacto!.normal.x).toBeCloseTo(-1, 12);
  });
});

describe("contactos múltiples dentro de un mismo paso", () => {
  const desde = { x: 0, y: 0 };
  const hasta = { x: 1, y: 0 };

  it("devuelve el impacto más cercano sin importar el orden de la lista", () => {
    const lejano = circulo(0.6, 0);
    const cercano = circulo(0.3, 0);
    const impacto = primerImpacto(desde, hasta, R_BOLA, [lejano, cercano], []);
    expect(impacto).not.toBeNull();
    expect(impacto!.tipo).toBe("circular");
    expect(impacto!.indice).toBe(1);
    expect(impacto!.t).toBeCloseTo(0.3 - 0.063, 12);
  });

  it("un obstáculo plano puede ser el primero del paso", () => {
    const impacto = primerImpacto(desde, hasta, R_BOLA, [circulo(0.6, 0)], [muro(0.1, -1, 0.1, 1)]);
    expect(impacto!.tipo).toBe("plano");
    expect(impacto!.t).toBeCloseTo(0.1 - R_BOLA, 12);
  });

  it("sin obstáculos en el camino devuelve null", () => {
    expect(primerImpacto(desde, hasta, R_BOLA, [circulo(0.5, 0.5)], [])).toBeNull();
  });
});