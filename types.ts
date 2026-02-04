
export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  PROMOB = 'PROMOB',
  CRM = 'CRM',
  PORTFOLIO = 'PORTFOLIO',
  CLIENT_PORTAL = 'CLIENT_PORTAL',
  CONTRACTS = 'CONTRACTS'
}

export enum ToolMode {
  SELECT = 'SELECT',
  MOVE = 'MOVE',
  ROTATE = 'ROTATE',
  RULER = 'RULER',
  AMBIENTE = 'AMBIENTE'
}

export enum ViewportMode {
  PERSPECTIVE = 'PERSPECTIVE',
  TOP = 'TOP',
  FRONT = 'FRONT',
  SIDE = 'SIDE',
  ENGINEER = 'ENGINEER'
}

export interface Contract {
  id: string;
  clientName: string;
  document: string;
  projectName: string;
  value: number;
  status: 'Assinado' | 'Em Negociação' | 'Produção' | 'Finalizado';
  date: string;
  email: string;
  phone: string;
  paymentStatus: 'Pago' | 'Pendente' | 'Parcial';
}

export interface EnvironmentSettings {
  floorTexture: 'porcelanato' | 'madeira' | 'concreto';
  wallColor: string;
  ceilingVisible: boolean;
}

export interface FurnitureModule {
  id: string;
  type: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  x: number;
  y: number;
  z: number;
  finish: string;
  isRipado: boolean;
  price: number;
  rotation: number;
}

export interface ProjectDimensions {
  id: string;
  name: string;
  clientName: string;
  modules: FurnitureModule[];
  floorWidth: number;
  floorDepth: number;
  wallHeight: number;
  settings: EnvironmentSettings;
}

export interface ChatMessage {
  id: string;
  sender: 'client' | 'ai' | 'user';
  text: string;
  timestamp: Date;
}
