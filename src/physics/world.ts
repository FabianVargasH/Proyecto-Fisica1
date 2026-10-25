import { primerImpacto } from "./collisions";
import { gravedadEfectiva } from "./gravity";
import { avanzarBola } from "./integrator";
import { respuestaChoque } from "./response";
import type { EntradasUsuario, EstadoGlobal, EventoColision, ResultadoPaso } from "./types";
import { escalar, restar, sumar } from "./vec2";

/** Tope de impactos resueltos dentro de un mismo paso (evita bucles infinitos). */
export const MAX_CONTACTOS_POR_PASO = 8;

/**
 * Avanza la simulación un paso de duración dt.
 * Orden: gravedad efectiva, integrar la bola, detección continua, resolver cada
 * impacto con la restitución del obstáculo y la masa de la bola, y repetir con el
 * tiempo restante del paso (contactos múltiples en un mismo paso).
 * Función pura: no modifica `estado`; mismo estado y mismo dt dan el mismo resultado.
 * En el Avance 2 los flippers, el lanzador, el marcador y las vidas no se actualizan.
 * @param estado estado global al inicio del paso
 * @param dt duración del paso (s)
 * @param _entradas entradas del usuario (reservadas para flippers y lanzador)
 * @returns nuevo estado global y eventos de colisión (instante en s, energía en J)
 */
export function avanzarSimulacion(
  estado: EstadoGlobal,
  dt: number,
  _entradas: EntradasUsuario,
): ResultadoPaso {
  const aceleracion = gravedadEfectiva(estado.mesa.gravedad, estado.mesa.inclinacion);
  const eventos: EventoColision[] = [];

  let bola = estado.bola;
  let restante = dt;
  let consumido = 0;

  for (let i = 0; i < MAX_CONTACTOS_POR_PASO && restante > 0; i++) {
    const siguiente = avanzarBola(bola, aceleracion, restante);
    const impacto = primerImpacto(
      bola.posicion,
      siguiente.posicion,
      bola.radio,
      estado.obstaculosCirculares,
      estado.obstaculosPlanos,
    );

    if (impacto === null) {
      bola = siguiente;
      restante = 0;
      break;
    }

    const tImpacto = impacto.t * restante;
    const posicionImpacto = sumar(
      bola.posicion,
      escalar(restar(siguiente.posicion, bola.posicion), impacto.t),
    );
    const velocidadAntes = sumar(bola.velocidad, escalar(aceleracion, tImpacto));
    const restitucion =
      impacto.tipo === "circular"
        ? estado.obstaculosCirculares[impacto.indice].restitucion
        : estado.obstaculosPlanos[impacto.indice].restitucion;

    const respuesta = respuestaChoque(velocidadAntes, impacto.normal, restitucion, bola.masa);

    eventos.push({
      instante: estado.tiempo + consumido + tImpacto,
      tipo: impacto.tipo,
      indice: impacto.indice,
      energiaDisipada: respuesta.energiaDisipada,
    });

    bola = { ...bola, posicion: posicionImpacto, velocidad: respuesta.velocidad };
    consumido += tImpacto;
    restante -= tImpacto;
  }

  // Si se agotó el tope de contactos, el tiempo sobrante avanza sin colisiones.
  if (restante > 0) bola = avanzarBola(bola, aceleracion, restante);

  return {
    estado: { ...estado, bola, tiempo: estado.tiempo + dt },
    eventos,
  };
}

/**
 * Modifica el ángulo de inclinación θ de la mesa en el estado físico.
 * Función pura: retorna un nuevo estado con el ángulo actualizado.
 * @param estado estado global actual
 * @param theta nuevo ángulo en radianes (θ ∈ [3°, 15°])
 * @returns nuevo estado global con la inclinación actualizada
 */
export function setTheta(estado: EstadoGlobal, theta: number): EstadoGlobal {
  return {
    ...estado,
    mesa: {
      ...estado.mesa,
      inclinacion: theta,
    },
  };
}

export const setAngle = setTheta;