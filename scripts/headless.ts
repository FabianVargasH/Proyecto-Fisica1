import { mkdirSync, writeFileSync } from "node:fs";
import {
  GRAVEDAD,
  INCLINACION_INICIAL,
  LARGO_MESA,
  MASA_BOLA,
  RADIO_BOLA,
  DT,
  gravedadEfectiva,
  avanzarBola,
  energiaCinetica,
  energiaPotencialGravitatoria,
} from "../src/physics/index";
import type { Bola } from "../src/physics/index";

/**
 * Escenario fijo sin interfaz: la bola parte del reposo en (0.28, 0.10) m y se desliza
 * por la mesa inclinada hasta llegar al borde inferior (y >= L) o a los 10 s.
 * Escribe output/simulacion.csv con la evolución temporal. Es determinista.
 */
const TIEMPO_MAXIMO = 10; // s

let bola: Bola = {
  posicion: { x: 0.28, y: 0.1 },
  velocidad: { x: 0, y: 0 },
  radio: RADIO_BOLA,
  masa: MASA_BOLA,
};

const aceleracion = gravedadEfectiva(GRAVEDAD, INCLINACION_INICIAL);
const filas: string[] = ["t_s,x_m,y_m,vx_m_s,vy_m_s,K_J,Ug_J,E_J"];

function registrar(t: number): void {
  const k = energiaCinetica(bola);
  const ug = energiaPotencialGravitatoria(bola, GRAVEDAD, INCLINACION_INICIAL, LARGO_MESA);
  filas.push(
    [
      t,
      bola.posicion.x,
      bola.posicion.y,
      bola.velocidad.x,
      bola.velocidad.y,
      k,
      ug,
      k + ug,
    ].join(","),
  );
}

let t = 0;
registrar(t);
const pasosMaximos = Math.round(TIEMPO_MAXIMO / DT);
for (let i = 1; i <= pasosMaximos && bola.posicion.y < LARGO_MESA; i++) {
  bola = avanzarBola(bola, aceleracion, DT);
  t = i * DT;
  registrar(t);
}

mkdirSync("output", { recursive: true });
writeFileSync("output/simulacion.csv", filas.join("\n") + "\n");
console.log(`CSV generado: output/simulacion.csv (${filas.length - 1} pasos, t = ${t.toFixed(4)} s)`);