
export type EquipmentType = 'switch' | 'server';

export interface VirtualMachine {
  id: string;
  name: string;
  description: string;
  anydeskCode: string;
  ipAddress: string;
}

export interface SwitchPort {
  id: string;
  portNumber: number;
  description: string;
  connected: boolean;
  taggedVlans: string[];
  isFibre?: boolean; // Nouveau champ pour indiquer si le port est en fibre optique
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  brand: string;
  position: number; // starting U position
  size: number; // number of Us
  // Switch-specific properties
  portCount?: number;
  ipAddress?: string;
  vlans?: string[];
  ports?: SwitchPort[];
  // Server-specific properties
  idracIp?: string;
  description?: string;
  virtualMachines?: VirtualMachine[];
}

export interface Rack {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  equipment: Equipment[];
}

export interface RackSummary {
  id: string;
  name: string;
  location: string;
  totalUnits: number;
  usedUnits: number;
  equipmentCount: number;
}
