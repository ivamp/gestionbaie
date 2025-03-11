
import { Equipment, Rack, VirtualMachine } from '../types/rack';

// Sample virtual machines
const virtualMachines: VirtualMachine[] = [
  {
    id: 'vm-1',
    name: 'DB Server',
    description: 'Primary database server',
    anydeskCode: 'AD-123456',
    ipAddress: '192.168.1.101',
  },
  {
    id: 'vm-2',
    name: 'Web Server',
    description: 'Apache web server',
    anydeskCode: 'AD-789012',
    ipAddress: '192.168.1.102',
  },
  {
    id: 'vm-3',
    name: 'Mail Server',
    description: 'Exchange mail server',
    anydeskCode: 'AD-345678',
    ipAddress: '192.168.1.103',
  },
  {
    id: 'vm-4',
    name: 'Monitoring',
    description: 'Nagios monitoring system',
    anydeskCode: 'AD-901234',
    ipAddress: '192.168.1.104',
  },
];

// Sample equipment
const equipment1: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Core Switch',
    type: 'switch',
    brand: 'Cisco',
    position: 2,
    size: 1,
    portCount: 48,
    ipAddress: '192.168.0.1',
    vlans: ['VLAN 10', 'VLAN 20', 'VLAN 30'],
  },
  {
    id: 'eq-2',
    name: 'Database Server',
    type: 'server',
    brand: 'Dell PowerEdge',
    position: 4,
    size: 2,
    idracIp: '192.168.10.1',
    description: 'Primary database server',
    virtualMachines: [virtualMachines[0]],
  },
  {
    id: 'eq-3',
    name: 'Web Server',
    type: 'server',
    brand: 'HP ProLiant',
    position: 7,
    size: 4,
    idracIp: '192.168.10.2',
    description: 'Web application server',
    virtualMachines: [virtualMachines[1], virtualMachines[3]],
  },
];

const equipment2: Equipment[] = [
  {
    id: 'eq-4',
    name: 'Distribution Switch',
    type: 'switch',
    brand: 'Juniper',
    position: 1,
    size: 1,
    portCount: 24,
    ipAddress: '192.168.0.2',
    vlans: ['VLAN 40', 'VLAN 50'],
  },
  {
    id: 'eq-5',
    name: 'Application Server',
    type: 'server',
    brand: 'Dell PowerEdge',
    position: 3,
    size: 3,
    idracIp: '192.168.10.3',
    description: 'Application server with multiple VMs',
    virtualMachines: [virtualMachines[2]],
  },
];

const equipment3: Equipment[] = [
  {
    id: 'eq-6',
    name: 'Access Switch',
    type: 'switch',
    brand: 'Cisco',
    position: 1,
    size: 1,
    portCount: 48,
    ipAddress: '192.168.0.3',
    vlans: ['VLAN 60', 'VLAN 70'],
  },
  {
    id: 'eq-7',
    name: 'Backup Server',
    type: 'server',
    brand: 'HP ProLiant',
    position: 3,
    size: 2,
    idracIp: '192.168.10.4',
    description: 'Backup and archive server',
  },
];

// Sample racks
export const racks: Rack[] = [
  {
    id: 'rack-1',
    name: 'Main Rack',
    location: 'Data Center A - Row 1',
    totalUnits: 42,
    equipment: equipment1,
  },
  {
    id: 'rack-2',
    name: 'Development Rack',
    location: 'Data Center A - Row 2',
    totalUnits: 36,
    equipment: equipment2,
  },
  {
    id: 'rack-3',
    name: 'Network Rack',
    location: 'Data Center B - Row 1',
    totalUnits: 24,
    equipment: equipment3,
  },
];

// Function to generate rack summaries
export const getRackSummaries = () => {
  return racks.map(rack => {
    const usedUnits = rack.equipment.reduce((total, eq) => total + eq.size, 0);
    
    return {
      id: rack.id,
      name: rack.name,
      location: rack.location,
      totalUnits: rack.totalUnits,
      usedUnits: usedUnits,
      equipmentCount: rack.equipment.length,
    };
  });
};

// Get a specific rack by ID
export const getRackById = (id: string) => {
  return racks.find(rack => rack.id === id);
};
