
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
  
  // Champs communs
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [position, setPosition] = useState('');
  const [size, setSize] = useState('1');
  
  // Champs spécifiques aux switchs
  const [portCount, setPortCount] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [vlans, setVlans] = useState('');
  
  // Champs spécifiques aux serveurs
  const [idracIp, setIdracIp] = useState('');
  const [description, setDescription] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation de base
      if (!name || !brand || !position || !size) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }
      
      const positionNum = parseInt(position);
      const sizeNum = parseInt(size);
      
      if (isNaN(positionNum) || positionNum < 1 || positionNum > rack.totalUnits) {
        toast.error(`La position doit être un nombre entre 1 et ${rack.totalUnits}`);
        return;
      }
      
      if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > rack.totalUnits) {
        toast.error(`La taille doit être un nombre entre 1 et ${rack.totalUnits}`);
        return;
      }
      
      if (positionNum + sizeNum - 1 > rack.totalUnits) {
        toast.error("L'équipement dépasse la taille de la baie");
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
          toast.error("Veuillez remplir tous les champs spécifiques au switch");
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
        toast.success(`${equipmentType === 'switch' ? 'Switch' : 'Serveur'} ajouté avec succès`);
        onEquipmentAdded(addedEquipment);
        onOpenChange(false);
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.message || "Échec de l'ajout de l'équipement");
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
          <DialogTitle>Ajouter Nouvel Équipement</DialogTitle>
          <DialogDescription>
            Ajouter un nouvel appareil à la baie "{rack.name}"
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
                Serveur
              </TabsTrigger>
              <TabsTrigger value="switch" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Switch
              </TabsTrigger>
            </TabsList>
            
            {/* Champs communs */}
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
                  <Label htmlFor="size">Taille (U)</Label>
                  <Select defaultValue="1" onValueChange={setSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner taille" />
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
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  placeholder="Nom de l'appareil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">Marque/Modèle</Label>
                <Input
                  id="brand"
                  placeholder="ex. Dell PowerEdge R740"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value="server" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idracIp">Adresse IP iDRAC</Label>
                <Input
                  id="idracIp"
                  placeholder="ex. 192.168.1.100"
                  value={idracIp}
                  onChange={(e) => setIdracIp(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Description du serveur"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="switch" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portCount">Nombre de Ports</Label>
                <Select onValueChange={setPortCount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner nombre de ports" />
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
                <Label htmlFor="ipAddress">Adresse IP</Label>
                <Input
                  id="ipAddress"
                  placeholder="ex. 192.168.1.1"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vlans">VLANs (séparés par des virgules)</Label>
                <Input
                  id="vlans"
                  placeholder="ex. VLAN 10, VLAN 20"
                  value={vlans}
                  onChange={(e) => setVlans(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Ajouter Équipement</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEquipmentDialog;
