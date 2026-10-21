import type { Vec2 } from "./types";
import { escalar, normalizar, punto, restar } from "./vec2";

/** Resultado de resolver un choque. */
export interface ResultadoChoque {
  velocidad: Vec2; // m/s, velocidad de la bola después del choque
  impulso: Vec2; // kg·m/s, impulso recibido por la bola: J = m·(v' − v)
  energiaDisipada: number; // J, K antes − K después (negativa si la superficie aporta energía)
}

/**
 * Respuesta de la bola a un choque sin fricción.
 * La componente tangencial se conserva; la normal se invierte y se reduce con e:
 *   v' = v − (1 + e)·[(v − vs)·n]·n
 * donde vs es la velocidad de la superficie (0 para obstáculos fijos; vc = ω × r para un flipper).
 * Si la bola ya se aleja de la superficie ((v − vs)·n >= 0) no hay choque y no se modifica nada.
 * Para obstáculos fijos, la energía disipada es ΔE = ½·m·(1 − e²)·vn².
 * @param velocidad velocidad de la bola antes del choque (m/s)
 * @param normal normal de contacto; apunta de la superficie hacia la bola (se normaliza)
 * @param restitucion coeficiente de restitución e, adimensional entre 0 y 1
 * @param masa masa de la bola (kg), necesaria para el impulso y la energía
 * @param velocidadSuperficie velocidad del punto de contacto de la superficie (m/s), por defecto (0, 0)
 */
export function respuestaChoque(
  velocidad: Vec2,
  normal: Vec2,
  restitucion: number,
  masa: number,
  velocidadSuperficie: Vec2 = { x: 0, y: 0 },
): ResultadoChoque {
  const n = normalizar(normal);
  const vn = punto(restar(velocidad, velocidadSuperficie), n);

  if (vn >= 0) {
    return { velocidad: { ...velocidad }, impulso: { x: 0, y: 0 }, energiaDisipada: 0 };
  }

  const nueva = restar(velocidad, escalar(n, (1 + restitucion) * vn));
  const impulso = escalar(restar(nueva, velocidad), masa);
  const cinetica = (v: Vec2): number => 0.5 * masa * punto(v, v);

  return {
    velocidad: nueva,
    impulso,
    energiaDisipada: cinetica(velocidad) - cinetica(nueva),
  };
}