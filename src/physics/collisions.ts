import type { Bola, ObstaculoCircular, ObstaculoPlano, Vec2 } from "./types";
import { escalar, norma, normalizar, perpendicular, punto, restar, sumar } from "./vec2";

/** Contacto estático entre la bola y un obstáculo en una posición fija. */
export interface Contacto {
  punto: Vec2; // m, punto de contacto sobre el obstáculo
  normal: Vec2; // vector unitario, apunta del obstáculo hacia la bola
  profundidad: number; // m, cuánto penetra la bola
}

/** Impacto detectado a lo largo de la trayectoria de un paso. */
export interface Impacto {
  t: number; // fracción del paso, en [0, 1]
  punto: Vec2; // m, punto de contacto sobre el obstáculo
  normal: Vec2; // vector unitario, apunta del obstáculo hacia la bola
}

export interface ImpactoIdentificado extends Impacto {
  tipo: "circular" | "plano";
  indice: number; // posición del obstáculo en su lista
}

const NORMAL_POR_DEFECTO: Vec2 = { x: 0, y: -1 };

/**
 * Contacto bola–círculo en una posición fija.
 * @returns null si no se tocan, o (punto, normal, profundidad) en m
 */
export function contactoBolaCirculo(bola: Bola, obstaculo: ObstaculoCircular): Contacto | null {
  const d = restar(bola.posicion, obstaculo.centro);
  const distancia = norma(d);
  const sumaRadios = bola.radio + obstaculo.radio;
  if (distancia >= sumaRadios) return null;

  const normal = distancia === 0 ? NORMAL_POR_DEFECTO : escalar(d, 1 / distancia);
  return {
    punto: sumar(obstaculo.centro, escalar(normal, obstaculo.radio)),
    normal,
    profundidad: sumaRadios - distancia,
  };
}

/**
 * Contacto bola–segmento en una posición fija.
 * @returns null si no se tocan, o (punto, normal, profundidad) en m
 */
export function contactoBolaSegmento(bola: Bola, obstaculo: ObstaculoPlano): Contacto | null {
  const ab = restar(obstaculo.p2, obstaculo.p1);
  const largo2 = punto(ab, ab);
  const proyeccion = largo2 === 0 ? 0 : punto(restar(bola.posicion, obstaculo.p1), ab) / largo2;
  const parametro = Math.min(1, Math.max(0, proyeccion));
  const masCercano = sumar(obstaculo.p1, escalar(ab, parametro));

  const d = restar(bola.posicion, masCercano);
  const distancia = norma(d);
  if (distancia >= bola.radio) return null;

  const normal =
    distancia > 0
      ? escalar(d, 1 / distancia)
      : largo2 > 0
        ? normalizar(perpendicular(ab))
        : NORMAL_POR_DEFECTO;
  return { punto: masCercano, normal, profundidad: bola.radio - distancia };
}

/**
 * Menor s en [0, 1] tal que |d + u·s| = sumaRadios, o null.
 * Si ya hay solapamiento al inicio (c0 <= 0) devuelve null: ese caso lo
 * resuelven las funciones de contacto estático.
 */
function barridoCirculo(d: Vec2, u: Vec2, sumaRadios: number): number | null {
  const a = punto(u, u);
  if (a === 0) return null;
  const c0 = punto(d, d) - sumaRadios * sumaRadios;
  if (c0 <= 0) return null;
  const b = 2 * punto(d, u);
  const discriminante = b * b - 4 * a * c0;
  if (discriminante < 0) return null;
  const s = (-b - Math.sqrt(discriminante)) / (2 * a);
  return s >= 0 && s <= 1 ? s : null;
}

/**
 * Detección continua bola–círculo.
 * Resuelve (u·u)s² + 2(d·u)s + d·d − (r+R)² = 0 con d = pAnt − c, u = pSig − pAnt,
 * y toma la menor raíz en [0, 1].
 * @param pAnterior posición de la bola al inicio del paso (m)
 * @param pSiguiente posición de la bola al final del paso (m)
 * @param radioBola radio de la bola (m)
 * @returns null o el impacto con t en [0, 1]
 */
export function impactoContinuoCirculo(
  pAnterior: Vec2,
  pSiguiente: Vec2,
  radioBola: number,
  obstaculo: ObstaculoCircular,
): Impacto | null {
  const desplazamiento = restar(pSiguiente, pAnterior);
  const s = barridoCirculo(
    restar(pAnterior, obstaculo.centro),
    desplazamiento,
    radioBola + obstaculo.radio,
  );
  if (s === null) return null;

  const centroBola = sumar(pAnterior, escalar(desplazamiento, s));
  const normal = normalizar(restar(centroBola, obstaculo.centro));
  return {
    t: s,
    punto: sumar(obstaculo.centro, escalar(normal, obstaculo.radio)),
    normal,
  };
}

/**
 * Detección continua bola–segmento, con obstáculo posiblemente móvil.
 * Se trabaja en el marco del obstáculo: el desplazamiento relativo de la bola es
 * (pSig − pAnt) − vObstaculo·dt. El segmento se toma en su posición al inicio del paso.
 * Para un flipper, vObstaculo es la velocidad del punto del flipper cercano a la bola
 * (vc = ω × r); con Δt = 1/240 s el giro por paso es pequeño y la aproximación es válida.
 * Obstáculo fijo: omitir vObstaculo y dt.
 * @param vObstaculo velocidad del obstáculo en m/s
 * @param dt duración del paso en s
 * @returns null o el impacto con t en [0, 1]
 */
export function impactoContinuoSegmento(
  pAnterior: Vec2,
  pSiguiente: Vec2,
  radioBola: number,
  obstaculo: ObstaculoPlano,
  vObstaculo: Vec2 = { x: 0, y: 0 },
  dt = 0,
): Impacto | null {
  const desplazamiento = restar(pSiguiente, pAnterior);
  const U = restar(desplazamiento, escalar(vObstaculo, dt));
  const P0 = restar(pAnterior, obstaculo.p1);
  const ab = restar(obstaculo.p2, obstaculo.p1);
  const largo = norma(ab);

  const candidatos: { s: number; normal: Vec2 }[] = [];

  // Caras laterales del segmento (la bola se trata como un barrido de grosor r)
  if (largo > 0) {
    const e = escalar(ab, 1 / largo);
    const n = perpendicular(e);
    const transversal0 = punto(P0, n);
    const uTransversal = punto(U, n);
    const signo = transversal0 >= 0 ? 1 : -1;
    if (Math.abs(transversal0) >= radioBola && uTransversal * signo < 0) {
      const s = (signo * radioBola - transversal0) / uTransversal;
      if (s >= 0 && s <= 1) {
        const longitudial = punto(P0, e) + punto(U, e) * s;
        if (longitudial >= 0 && longitudial <= largo) {
          candidatos.push({ s, normal: escalar(n, signo) });
        }
      }
    }
  }

  // Extremos del segmento, tratados como círculos de radio 0
  for (const extremo of [{ x: 0, y: 0 }, ab]) {
    const s = barridoCirculo(restar(P0, extremo), U, radioBola);
    if (s !== null) {
      const posicion = sumar(P0, escalar(U, s));
      candidatos.push({ s, normal: normalizar(restar(posicion, extremo)) });
    }
  }

  if (candidatos.length === 0) return null;
  let mejor = candidatos[0];
  for (const c of candidatos) {
    if (c.s < mejor.s) mejor = c;
  }

  const centroBola = sumar(pAnterior, escalar(desplazamiento, mejor.s));
  return {
    t: mejor.s,
    punto: restar(centroBola, escalar(mejor.normal, radioBola)),
    normal: mejor.normal,
  };
}

/**
 * Primer impacto del paso entre todos los obstáculos fijos (contactos múltiples:
 * se devuelve el de menor t; si hay empate, gana el círculo y luego el menor índice).
 * El orquestador lo llama de nuevo con el tiempo restante hasta resolver todo el paso.
 */
export function primerImpacto(
  pAnterior: Vec2,
  pSiguiente: Vec2,
  radioBola: number,
  circulos: ObstaculoCircular[],
  planos: ObstaculoPlano[],
): ImpactoIdentificado | null {
  let mejor: ImpactoIdentificado | null = null;

  circulos.forEach((obstaculo, indice) => {
    const impacto = impactoContinuoCirculo(pAnterior, pSiguiente, radioBola, obstaculo);
    if (impacto !== null && (mejor === null || impacto.t < mejor.t)) {
      mejor = { ...impacto, tipo: "circular", indice };
    }
  });
  planos.forEach((obstaculo, indice) => {
    const impacto = impactoContinuoSegmento(pAnterior, pSiguiente, radioBola, obstaculo);
    if (impacto !== null && (mejor === null || impacto.t < mejor.t)) {
      mejor = { ...impacto, tipo: "plano", indice };
    }
  });

  return mejor;
}