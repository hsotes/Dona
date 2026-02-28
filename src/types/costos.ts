export interface MaterialCosto {
  codigo: string;
  descripcion: string;
  rubro: string;
  tipo: string;
  presentacion: string;
  costoUnitario: number;
}

export interface ConsultaCosto {
  query?: string;
  tipo?: string;
  rubro?: string;
  maxResultados?: number;
}
