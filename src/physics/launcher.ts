import type { Vec2 } from "./types";
import { escalar, normalizar } from "./vec2";

/**
 * Energía elástica almacenada: Uel = ½·k·x².
 * @param k constante elástica en N/m
 * @param compresion compresión x en m
 * @returns energía en J
 */
export function energiaElastica(k: number, compresion: number): number {
  return 0.5 * k * compresion * compresion;
}

/**
 * Velocidad de lanzamiento. Toda la energía del resorte pasa a la bola:
 * ½·k·x² = ½·m·v0²  ->  v0 = x·√(k/m).
 * Se desprecia el trabajo de la gravedad durante el recorrido del resorte.
 * @param compresion compresión x en m
 * @param k constante elástica en N/m
 * @param masa masa de la bola en kg
 * @param direccion dirección de salida (se normaliza)
 * @returns velocidad inicial en m/s
 */
export function velocidadLanzamiento(
  compresion: number,
  k: number,
  masa: number,
  direccion: Vec2,
): Vec2 {
  const rapidez = compresion * Math.sqrt(k / masa);
  return escalar(normalizar(direccion), rapidez);
}