import { describe, expect, it } from "vitest";
import { SerieTemporal } from "../../src/ui/series";

describe("SerieTemporal (datos de las gráficas)", () => {
  it("respeta el paso mínimo entre puntos", () => {
    const s = new SerieTemporal(10, 0.1);
    expect(s.agregar(0, 1)).toBe(true);
    expect(s.agregar(0.05, 2)).toBe(false);
    expect(s.agregar(0.1, 3)).toBe(true);
    expect(s.datos).toEqual([
      { x: 0, y: 1 },
      { x: 0.1, y: 3 },
    ]);
  });

  it("`forzar` guarda el punto aunque no cumpla el paso (colisiones)", () => {
    const s = new SerieTemporal(10, 0.1);
    s.agregar(0, 1);
    expect(s.agregar(0.01, 5, true)).toBe(true);
    expect(s.datos).toHaveLength(2);
  });

  it("descarta los puntos fuera de la ventana", () => {
    const s = new SerieTemporal(2, 0);
    for (let t = 0; t <= 5; t++) s.agregar(t, t);
    expect(s.datos.map((p) => p.x)).toEqual([3, 4, 5]);
  });

  it("limpiar vacía la serie y conserva la misma referencia del arreglo", () => {
    const s = new SerieTemporal(2, 0);
    const ref = s.datos;
    s.agregar(0, 1);
    s.limpiar();
    expect(s.datos).toBe(ref);
    expect(s.datos).toHaveLength(0);
    expect(s.agregar(0, 1)).toBe(true);
  });
});
