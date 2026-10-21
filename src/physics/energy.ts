import type { Bola } from "./types";
import { norma } from "./vec2";

/**
 * Energía cinética: K = ½·m·|v|².
 * @returns energía en J
 */
export function energiaCinetica(bola: Bola): number {
  return 0.5 * bola.masa * norma(bola.velocidad) ** 2;
}

/**
 * Energía potencial gravitatoria respecto al borde inferior de la mesa (y = L):
 * Ug = m·g·(L − y)·sen θ.
 * @param g gravedad en m/s²
 * @param theta inclinación de la mesa en rad
 * @param largoMesa L en m
 * @returns energía en J
 */
export function energiaPotencialGravitatoria(
  bola: Bola,
  g: number,
  theta: number,
  largoMesa: number,
): number {
  return bola.masa * g * (largoMesa - bola.posicion.y) * Math.sin(theta);
}

/**
 * Energía mecánica total: E = K + Ug + Uel.
 * @param energiaElasticaLanzador Uel del lanzador en J (0 si no está comprimido)
 * @returns energía en J
 */
export function energiaMecanica(
  bola: Bola,
  g: number,
  theta: number,
  largoMesa: number,
  energiaElasticaLanzador = 0,
): number {
  return (
    energiaCinetica(bola) +
    energiaPotencialGravitatoria(bola, g, theta, largoMesa) +
    energiaElasticaLanzador
  );
}