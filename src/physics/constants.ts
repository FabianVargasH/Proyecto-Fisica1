/**
 * Constantes fijas del modelo (Tabla 3 del Avance 1, corregida).
 * Todas en unidades del Sistema Internacional.
 */

// Gravedad y mesa
export const GRAVEDAD = 9.81; // m/s²
export const ANCHO_MESA = 0.56; // m (W)
export const LARGO_MESA = 1.05; // m (L)

// Parámetro de la mesa (valor inicial y rango permitido)
export const INCLINACION_INICIAL = (6.5 * Math.PI) / 180; // rad
export const INCLINACION_MIN = (3 * Math.PI) / 180; // rad
export const INCLINACION_MAX = (15 * Math.PI) / 180; // rad

// Bola
export const MASA_BOLA = 0.08; // kg
export const RADIO_BOLA = 0.013; // m

// Lanzador
export const K_LANZADOR = 500; // N/m
export const COMPRESION_MAXIMA = 0.06; // m

// Flippers
export const LONGITUD_FLIPPER = 0.08; // m
export const ANGULO_REPOSO = (30 * Math.PI) / 180; // rad (flipper izquierdo)
export const ANGULO_ACTIVO = (-30 * Math.PI) / 180; // rad (flipper izquierdo)
export const OMEGA_MAX = 30; // rad/s
export const ALFA_FLIPPER = 3000; // rad/s²

// Coeficientes de restitución (adimensionales)
export const E_CIRCULAR = 0.8;
export const E_PLANO = 0.6;
export const E_FLIPPER = 0.5;

// Paso de integración fijo
export const DT = 1 / 240; // s