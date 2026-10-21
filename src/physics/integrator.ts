import type { Bola, Vec2 } from "./types";

/**
 * Avance de estado cinemático con aceleración constante durante el paso:
 *   v(t + Δt) = v(t) + a·Δt
 *   p(t + Δt) = p(t) + v(t)·Δt + ½·a·Δt²
 * Función pura: no modifica la bola recibida, devuelve una nueva.
 * @param bola estado actual (posición en m, velocidad en m/s)
 * @param aceleracion aceleración en m/s²
 * @param dt paso de tiempo en s
 * @returns bola actualizada
 */
export function avanzarBola(bola: Bola, aceleracion: Vec2, dt: number): Bola {
  return {
    ...bola,
    posicion: {
      x: bola.posicion.x + bola.velocidad.x * dt + 0.5 * aceleracion.x * dt * dt,
      y: bola.posicion.y + bola.velocidad.y * dt + 0.5 * aceleracion.y * dt * dt,
    },
    velocidad: {
      x: bola.velocidad.x + aceleracion.x * dt,
      y: bola.velocidad.y + aceleracion.y * dt,
    },
  };
}