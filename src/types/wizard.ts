export interface WizardStageContext {
  id: number;
  nombre: string;
  descripcion: string;

  // Contexto para el AI
  aiContext: string;
  aiTasks: string[];
  aiConstraints: string[];

  // Datos
  requiredFromPrevious: string[];
  outputData: string[];

  // Normas relevantes
  normasRelevantes: string[];

  // Acciones automáticas del AI
  autoActions?: {
    trigger: string;
    action: 'generate_script' | 'calculate' | 'verify' | 'recommend';
    template?: string;
  }[];
}
