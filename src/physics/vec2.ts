import type { Vec2 } from "./types";

/** a + b */
export function sumar(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** a - b */
export function restar(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** k · v, con k escalar */
export function escalar(v: Vec2, k: number): Vec2 {
  return { x: v.x * k, y: v.y * k };
}

/** Producto punto a · b */
export function punto(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Norma |v|, en las mismas unidades del vector (m o m/s). */
export function norma(v: Vec2): number {
  return Math.sqrt(punto(v, v));
}

/** Vector unitario con la dirección de v. Si |v| = 0 devuelve (0, 0). */
export function normalizar(v: Vec2): Vec2 {
  const n = norma(v);
  return n === 0 ? { x: 0, y: 0 } : { x: v.x / n, y: v.y / n };
}

/** Perpendicular de v (rotación de 90°): (x, y) -> (-y, x). */
export function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}