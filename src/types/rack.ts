
export type EquipmentType = 'switch' | 'server' | 'accessory' | 'ups';

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
  isFibre?: boolean; // Indique si le port est en fibre optique
  isSFP?: boolean;   // Indique si c'est un port SFP
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
  sfpPortCount?: number; // Nombre de ports SFP
  ipAddress?: string;
  vlans?: string[];
  ports?: SwitchPort[];
  // Server-specific properties
  idracIp?: string;
  description?: string;
  virtualMachines?: VirtualMachine[];
  // UPS-specific properties
  model?: string;
  power?: string;
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

// Fonction utilitaire pour parser un string de VLANs en tableau
export const parseVlans = (vlansString: string): string[] => {
  return vlansString
    .split(',')
    .map(vlan => vlan.trim())
    .filter(vlan => vlan.length > 0);
};

// Fonction utilitaire pour formater un tableau de VLANs en string
export const formatVlans = (vlans: string[] | undefined): string => {
  return vlans ? vlans.join(', ') : '';
};
