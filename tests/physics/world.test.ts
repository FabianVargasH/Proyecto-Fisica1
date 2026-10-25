import { describe, expect, it } from "vitest";
import {
  COMPRESION_MAXIMA,
  E_PLANO,
  GRAVEDAD,
  INCLINACION_INICIAL,
  K_LANZADOR,
  LARGO_MESA,
  MASA_BOLA,
  RADIO_BOLA,
  DT,
} from "../../src/physics/constants";
import { avanzarSimulacion, setAngle, setTheta } from "../../src/physics/world";
import type { EntradasUsuario, EstadoGlobal, ObstaculoPlano } from "../../src/physics/types";

const ENTRADAS: EntradasUsuario = {
  flipperIzquierdo: false,
  flipperDerecho: false,
  compresionLanzador: 0,
};

const ACELERACION = GRAVEDAD * Math.sin(INCLINACION_INICIAL); // m/s²

/** Arma un estado completo con las constantes del modelo; solo cambia lo indicado. */
function crearEstado(parcial: Partial<EstadoGlobal> = {}): EstadoGlobal {
  return {
    bola: {
      posicion: { x: 0.28, y: 0.5 },
      velocidad: { x: 0, y: 0 },
      radio: RADIO_BOLA,
      masa: MASA_BOLA,
    },
    obstaculosCirculares: [],
    obstaculosPlanos: [],
    flippers: [],
    lanzador: {
      constanteElastica: K_LANZADOR,
      compresion: 0,
      direccion: { x: 0, y: -1 },
      compresionMaxima: COMPRESION_MAXIMA,
    },
    mesa: { inclinacion: INCLINACION_INICIAL, gravedad: GRAVEDAD },
    marcador: 0,
    vidas: 3,
    tiempo: 0,
    ...parcial,
  };
}

/** E = K + Ug (J), con referencia en el borde inferior de la mesa (y = L). */
function energiaMecanica(estado: EstadoGlobal): number {
  const { bola, mesa } = estado;
  const v2 = bola.velocidad.x ** 2 + bola.velocidad.y ** 2;
  const cinetica = 0.5 * bola.masa * v2;
  const potencial = bola.masa * mesa.gravedad * (LARGO_MESA - bola.posicion.y) * Math.sin(mesa.inclinacion);
  return cinetica + potencial;
}

/** Piso horizontal que cubre todo el ancho de la mesa. */
const PISO: ObstaculoPlano = {
  p1: { x: 0, y: 0.7 },
  p2: { x: 0.56, y: 0.7 },
  restitucion: E_PLANO,
};

describe("avanzarSimulacion", () => {
  it("sin obstáculos: avanza el tiempo dt y no genera eventos", () => {
    const resultado = avanzarSimulacion(crearEstado(), DT, ENTRADAS);
    expect(resultado.eventos).toEqual([]);
    expect(resultado.estado.tiempo).toBeCloseTo(DT, 12);
  });

  it("es pura: no modifica el estado de entrada", () => {
    const estado = crearEstado({ obstaculosPlanos: [PISO] });
    const copia = structuredClone(estado);
    avanzarSimulacion(estado, DT, ENTRADAS);
    expect(estado).toEqual(copia);
  });

  it("es determinista: mismo estado y mismo dt dan exactamente el mismo resultado", () => {
    const inicial = crearEstado({ obstaculosPlanos: [PISO] });

    const correr = () => {
      let estado = inicial;
      const eventos = [];
      for (let i = 0; i < 360; i++) {
        const r = avanzarSimulacion(estado, DT, ENTRADAS);
        estado = r.estado;
        eventos.push(...r.eventos);
      }
      return { estado, eventos };
    };

    expect(correr()).toEqual(correr());
  });

  it("contactos múltiples: resuelve dos impactos en un mismo paso sin atravesar", () => {
    // Bola entre dos planos paralelos con holgura de 0.014 m para el centro:
    // centro entre y = 0.513 y y = 0.527. Con vy = 5 m/s y dt = 0.01 s choca
    // con el plano inferior, rebota, y choca con el superior dentro del mismo paso.
    const superior: ObstaculoPlano = { p1: { x: 0, y: 0.5 }, p2: { x: 0.5, y: 0.5 }, restitucion: E_PLANO };
    const inferior: ObstaculoPlano = { p1: { x: 0, y: 0.54 }, p2: { x: 0.5, y: 0.54 }, restitucion: E_PLANO };
    const estado = crearEstado({
      bola: {
        posicion: { x: 0.25, y: 0.52 },
        velocidad: { x: 0, y: 5 },
        radio: RADIO_BOLA,
        masa: MASA_BOLA,
      },
      obstaculosPlanos: [superior, inferior],
    });
    const dt = 0.01;

    const { estado: final, eventos } = avanzarSimulacion(estado, dt, ENTRADAS);

    expect(eventos).toHaveLength(2);
    expect(eventos[0].indice).toBe(1); // primero el inferior
    expect(eventos[1].indice).toBe(0); // luego el superior
    expect(eventos.every((e) => e.tipo === "plano")).toBe(true);
    expect(eventos[0].instante).toBeGreaterThan(0);
    expect(eventos[1].instante).toBeGreaterThan(eventos[0].instante);
    expect(eventos[1].instante).toBeLessThanOrEqual(dt);

    // La bola queda dentro del espacio entre los planos (no hay atravesamiento).
    const margen = 1e-9;
    expect(final.bola.posicion.y).toBeGreaterThanOrEqual(0.5 + RADIO_BOLA - margen);
    expect(final.bola.posicion.y).toBeLessThanOrEqual(0.54 - RADIO_BOLA + margen);
    expect(final.tiempo).toBeCloseTo(dt, 12);
  });

  it("energía disipada del evento = ½·m·(1−e²)·vn² (tolerancia relativa 1e-9)", () => {
    const superior: ObstaculoPlano = { p1: { x: 0, y: 0.5 }, p2: { x: 0.5, y: 0.5 }, restitucion: E_PLANO };
    const inferior: ObstaculoPlano = { p1: { x: 0, y: 0.54 }, p2: { x: 0.5, y: 0.54 }, restitucion: E_PLANO };
    const estado = crearEstado({
      bola: {
        posicion: { x: 0.25, y: 0.52 },
        velocidad: { x: 0, y: 5 },
        radio: RADIO_BOLA,
        masa: MASA_BOLA,
      },
      obstaculosPlanos: [superior, inferior],
    });

    const { eventos } = avanzarSimulacion(estado, 0.01, ENTRADAS);

    // Primer impacto: la velocidad normal es vy = 5 + a·t (la normal es vertical).
    const vn = 5 + ACELERACION * eventos[0].instante;
    const esperada = 0.5 * MASA_BOLA * (1 - E_PLANO ** 2) * vn ** 2;
    expect(Math.abs(eventos[0].energiaDisipada - esperada)).toBeLessThanOrEqual(esperada * 1e-9);
  });

  it("energía con disipación: E solo baja en los choques y la suma de ΔE cuadra con E0 − Ef", () => {
    // Bola soltada desde el reposo sobre un piso con e = 0.6. En 1.5 s ocurren al menos 2 rebotes.
    // Tolerancia absoluta por paso: 1e-5 J (≈0.02 % de E0 ≈ 0.049 J). La integración es exacta
    // para aceleración constante; el error viene de ubicar el impacto sobre la cuerda del paso
    // (≤ ⅛·a·dt² ≈ 2.4e-6 m de desviación, ≈ 2e-7 J por evento).
    const tolerancia = 1e-5;
    let estado = crearEstado({ obstaculosPlanos: [PISO] });
    const E0 = energiaMecanica(estado);
    let sumaDisipada = 0;
    let totalEventos = 0;

    for (let i = 0; i < 360; i++) {
      const antes = energiaMecanica(estado);
      const r = avanzarSimulacion(estado, DT, ENTRADAS);
      const disipadaPaso = r.eventos.reduce((s, e) => s + e.energiaDisipada, 0);
      const despues = energiaMecanica(r.estado);

      // Balance por paso: E_antes − E_después = energía disipada en ese paso.
      expect(Math.abs(antes - despues - disipadaPaso)).toBeLessThanOrEqual(tolerancia);
      // La energía nunca aumenta (no hay flippers ni lanzador activos).
      expect(despues).toBeLessThanOrEqual(antes + tolerancia);

      sumaDisipada += disipadaPaso;
      totalEventos += r.eventos.length;
      estado = r.estado;
    }

    expect(totalEventos).toBeGreaterThanOrEqual(2);
    expect(Math.abs(E0 - energiaMecanica(estado) - sumaDisipada)).toBeLessThanOrEqual(tolerancia * 10);
  });
  it("contacto en reposo: tras 20 s la bola sigue sobre el piso y nunca lo atraviesa", () => {
    let estado = crearEstado({ obstaculosPlanos: [PISO] });
    const limite = PISO.p1.y - RADIO_BOLA;
    let maxY = 0;
    for (let i = 0; i < 20 * 240; i++) {
      estado = avanzarSimulacion(estado, DT, ENTRADAS).estado;
      maxY = Math.max(maxY, estado.bola.posicion.y);
    }
    expect(maxY).toBeLessThanOrEqual(limite + 1e-6);
    expect(Math.abs(estado.bola.posicion.y - limite)).toBeLessThanOrEqual(1e-6);
    expect(Math.hypot(estado.bola.velocidad.x, estado.bola.velocidad.y)).toBeLessThan(0.02);
  });
  describe("setTheta y setAngle", () => {
    it("actualiza la inclinación de la mesa de forma pura sin mutar el estado original", () => {
      const original = crearEstado();
      const nuevoTheta = (10 * Math.PI) / 180;
      const actualizado = setTheta(original, nuevoTheta);

      expect(actualizado.mesa.inclinacion).toBe(nuevoTheta);
      expect(original.mesa.inclinacion).toBe(INCLINACION_INICIAL);
      expect(setAngle(original, nuevoTheta)).toEqual(actualizado);
    });
  });
});