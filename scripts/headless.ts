import { mkdirSync, writeFileSync } from "node:fs";
import {
  ANCHO_MESA,
  COMPRESION_MAXIMA,
  DT,
  E_PLANO,
  GRAVEDAD,
  INCLINACION_INICIAL,
  K_LANZADOR,
  LARGO_MESA,
  MASA_BOLA,
  RADIO_BOLA,
  energiaCinetica,
  energiaElastica,
  energiaPotencialGravitatoria,
} from "../src/physics/index";
import type { EntradasUsuario, EstadoGlobal } from "../src/physics/index";
import { avanzarSimulacion } from "../src/physics/world";

/**
 * Escenario fijo sin interfaz: la bola parte del reposo en (0.28, 0.10) m sobre la mesa
 * inclinada y rebota contra un piso horizontal en y = 0.70 m (e = E_PLANO) durante 10 s.
 * Escribe output/simulacion.csv con la evolución temporal. Es determinista.
 *
 * Columnas: t (s), x, y (m), vx, vy (m/s), K, Ug, Uel, E (J),
 * colisiones (cantidad de impactos en el paso) y E_disipada_J (J disipados en el paso).
 */
const TIEMPO_MAXIMO = 10; // s

const ENTRADAS: EntradasUsuario = {
  flipperIzquierdo: false,
  flipperDerecho: false,
  compresionLanzador: 0,
};

let estado: EstadoGlobal = {
  bola: {
    posicion: { x: 0.28, y: 0.1 },
    velocidad: { x: 0, y: 0 },
    radio: RADIO_BOLA,
    masa: MASA_BOLA,
  },
  obstaculosCirculares: [],
  obstaculosPlanos: [
    { p1: { x: 0, y: 0.7 }, p2: { x: ANCHO_MESA, y: 0.7 }, restitucion: E_PLANO },
  ],
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
};

const filas: string[] = [
  "t_s,x_m,y_m,vx_m_s,vy_m_s,K_J,Ug_J,Uel_J,E_J,colisiones,E_disipada_J",
];

function registrar(colisiones: number, disipada: number): void {
  const { bola, mesa, lanzador } = estado;
  const k = energiaCinetica(bola);
  const ug = energiaPotencialGravitatoria(bola, mesa.gravedad, mesa.inclinacion, LARGO_MESA);
  const uel = energiaElastica(lanzador.constanteElastica, lanzador.compresion);
  filas.push(
    [
      estado.tiempo,
      bola.posicion.x,
      bola.posicion.y,
      bola.velocidad.x,
      bola.velocidad.y,
      k,
      ug,
      uel,
      k + ug + uel,
      colisiones,
      disipada,
    ].join(","),
  );
}

registrar(0, 0);
const pasos = Math.round(TIEMPO_MAXIMO / DT);
let totalColisiones = 0;
for (let i = 1; i <= pasos; i++) {
  const resultado = avanzarSimulacion(estado, DT, ENTRADAS);
  estado = resultado.estado;
  const disipada = resultado.eventos.reduce((suma, e) => suma + e.energiaDisipada, 0);
  totalColisiones += resultado.eventos.length;
  registrar(resultado.eventos.length, disipada);
}

mkdirSync("output", { recursive: true });
writeFileSync("output/simulacion.csv", filas.join("\n") + "\n");
console.log(
  `CSV generado: output/simulacion.csv (${pasos} pasos, t = ${estado.tiempo.toFixed(4)} s, ${totalColisiones} colisiones)`,
);