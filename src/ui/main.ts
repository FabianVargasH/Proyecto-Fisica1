import "./style.css";
import {
  ANCHO_MESA,
  LARGO_MESA,
  GRAVEDAD,
  INCLINACION_INICIAL,
  gravedadEfectiva,
} from "../physics/index";

// Conversión a píxeles: ocurre solo en la interfaz (la librería trabaja en m).
const PIXELES_POR_METRO = 500;

const canvas = document.getElementById("mesa") as HTMLCanvasElement | null;
const estado = document.getElementById("estado");

if (canvas) {
  canvas.width = ANCHO_MESA * PIXELES_POR_METRO;
  canvas.height = LARGO_MESA * PIXELES_POR_METRO;
}

if (estado) {
  const a = gravedadEfectiva(GRAVEDAD, INCLINACION_INICIAL);
  estado.textContent = `Gravedad efectiva sobre la mesa: ${a.y.toFixed(2)} m/s²`;
}