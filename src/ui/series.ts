/**
 * Serie temporal con ventana deslizante, usada por las gráficas en tiempo real.
 * No depende del DOM ni de Chart.js (se puede probar en Node).
 * Unidades: x en s (tiempo simulado); y en la unidad de la magnitud graficada.
 */
export interface Punto {
  x: number;
  y: number;
}

export class SerieTemporal {
  private readonly puntos: Punto[] = [];
  private ultimoX = Number.NEGATIVE_INFINITY;

  /**
   * @param ventana duración visible de la serie (s)
   * @param pasoMinimo separación mínima entre puntos consecutivos (s); 0 = guardar todos
   */
  constructor(
    private readonly ventana: number,
    private readonly pasoMinimo: number,
  ) {}

  /** Agrega un punto si respeta el paso mínimo (o si `forzar` es true) y descarta los que salen de la ventana. */
  agregar(x: number, y: number, forzar = false): boolean {
    if (!forzar && x - this.ultimoX < this.pasoMinimo) return false;
    this.puntos.push({ x, y });
    this.ultimoX = x;
    this.recortar(x);
    return true;
  }

  /** Elimina los puntos anteriores a (xActual - ventana). */
  recortar(xActual: number): void {
    const limite = xActual - this.ventana;
    let n = 0;
    while (n < this.puntos.length && this.puntos[n].x < limite) n++;
    if (n > 0) this.puntos.splice(0, n);
  }

  limpiar(): void {
    this.puntos.length = 0;
    this.ultimoX = Number.NEGATIVE_INFINITY;
  }

  /** Arreglo interno (misma referencia siempre, para que Chart.js lo observe sin copiarlo). */
  get datos(): Punto[] {
    return this.puntos;
  }
}
