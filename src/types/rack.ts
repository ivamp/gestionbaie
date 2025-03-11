
export type EquipmentType = 'switch' | 'server';

export interface VirtualMachine {
  id: string;
  name: string;
  description: string;
  anydeskCode: string;
  ipAddress: string;
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
