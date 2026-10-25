export interface Punto {
  x: number;
  y: number;
}

export class SerieTemporal {
  private readonly puntos: Punto[] = [];
  private ultimoX = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly ventana: number,
    private readonly pasoMinimo: number,
  ) {}

  agregar(x: number, y: number, forzar = false): boolean {
    if (!forzar && x - this.ultimoX < this.pasoMinimo) return false;
    this.puntos.push({ x, y });
    this.ultimoX = x;
    this.recortar(x);
    return true;
  }

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

  get datos(): Punto[] {
    return this.puntos;
  }
}
