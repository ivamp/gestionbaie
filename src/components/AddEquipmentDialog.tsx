
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Equipment, EquipmentType, Rack } from '@/types/rack';
import { Server, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { addEquipment } from '@/services/rackService';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rack: Rack;
  onEquipmentAdded: (equipment: Equipment) => void;
}

const AddEquipmentDialog: React.FC<AddEquipmentDialogProps> = ({
  open,
  onOpenChange,
  rack,
  onEquipmentAdded
}) => {
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('server');
  
  // Common fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [position, setPosition] = useState('');
  const [size, setSize] = useState('1');
  
  // Switch specific fields
  const [portCount, setPortCount] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [vlans, setVlans] = useState('');
  
  // Server specific fields
  const [idracIp, setIdracIp] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!name || !brand || !position || !size) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      const positionNum = parseInt(position);
      const sizeNum = parseInt(size);
      
      if (isNaN(positionNum) || positionNum < 1 || positionNum > rack.totalUnits) {
        toast.error(`Position must be a number between 1 and ${rack.totalUnits}`);
        return;
      }
      
      if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > rack.totalUnits) {
        toast.error(`Size must be a number between 1 and ${rack.totalUnits}`);
        return;
      }
      
      if (positionNum + sizeNum - 1 > rack.totalUnits) {
        toast.error("Equipment exceeds rack size");
        return;
      }
      
      const newEquipment: Omit<Equipment, 'id'> = {
        name,
        brand,
        type: equipmentType,
        position: positionNum,
        size: sizeNum,
      };
      
      if (equipmentType === 'switch') {
        if (!portCount || !ipAddress) {
          toast.error("Please fill in all switch-specific fields");
          return;
        }
        
        newEquipment.portCount = parseInt(portCount);
        newEquipment.ipAddress = ipAddress;
        newEquipment.vlans = vlans.split(',').map(vlan => vlan.trim());
      } else {
        newEquipment.idracIp = idracIp;
        newEquipment.description = description;
        newEquipment.virtualMachines = [];
      }
      
      const addedEquipment = addEquipment(rack.id, newEquipment);
      
      if (addedEquipment) {
        toast.success(`${equipmentType === 'switch' ? 'Switch' : 'Server'} added successfully`);
        onEquipmentAdded(addedEquipment);
        onOpenChange(false);
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add equipment");
    }
  };
  
  const resetForm = () => {
    setName('');
    setBrand('');
    setPosition('');
    setSize('1');
    setPortCount('');
    setIpAddress('');
    setVlans('');
    setIdracIp('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
          <DialogDescription>
            Add a new device to rack "{rack.name}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs 
            defaultValue="server" 
            className="w-full"
            onValueChange={(value) => setEquipmentType(value as EquipmentType)}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="server" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Server
              </TabsTrigger>
              <TabsTrigger value="switch" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Switch
              </TabsTrigger>
            </TabsList>
            
            {/* Common Fields */}
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position (U)</Label>
                  <Input
                    id="position"
                    placeholder="1-42"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size (U)</Label>
                  <Select defaultValue="1" onValueChange={setSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((u) => (
                        <SelectItem key={u} value={u.toString()}>
                          {u}U
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Device name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">Brand/Model</Label>
                <Input
                  id="brand"
                  placeholder="e.g. Dell PowerEdge R740"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value="server" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idracIp">iDRAC IP Address</Label>
                <Input
                  id="idracIp"
                  placeholder="e.g. 192.168.1.100"
                  value={idracIp}
                  onChange={(e) => setIdracIp(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Server description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="switch" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portCount">Number of Ports</Label>
                <Select onValueChange={setPortCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select port count" />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 12, 16, 24, 48, 96].map((count) => (
                      <SelectItem key={count} value={count.toString()}>
                        {count} ports
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  placeholder="e.g. 192.168.1.1"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vlans">VLANs (comma separated)</Label>
                <Input
                  id="vlans"
                  placeholder="e.g. VLAN 10, VLAN 20"
                  value={vlans}
                  onChange={(e) => setVlans(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Equipment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentDialog;
