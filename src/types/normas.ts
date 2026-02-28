export interface NormaInfo {
  codigo: string;
  nombre: string;
  descripcion: string;
  aplicacion: string;
  tablasClave: string[];
  formulasClave: string[];
  valores: Record<string, unknown>;
}
