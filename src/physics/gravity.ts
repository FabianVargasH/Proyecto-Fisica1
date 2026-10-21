import type { Vec2 } from "./types";

/**
 * Gravedad efectiva sobre la mesa inclinada: a = (0, g·sen θ).
 * El eje +y baja por el plano.
 * @param g gravedad en m/s²
 * @param theta inclinación de la mesa en rad
 * @returns aceleración en m/s²
 */
export function gravedadEfectiva(g: number, theta: number): Vec2 {
  return { x: 0, y: g * Math.sin(theta) };
}