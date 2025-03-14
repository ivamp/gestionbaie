import React, { useState, useEffect } from 'react';
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
import { Equipment, EquipmentType, Rack, VirtualMachine, SwitchPort, parseVlans, formatVlans } from '@/types/rack';
import { Server, Cpu, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { updateEquipment, removeEquipment, addVirtualMachine, updateVirtualMachine, removeVirtualMachine, updateSwitchPort } from '@/services/rackService';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rack: Rack;
  equipment: Equipment;
  onEquipmentUpdated: (equipment: Equipment) => void;
  onEquipmentRemoved: () => void;
}

const EditEquipmentDialog: React.FC<EditEquipmentDialogProps> = ({
  open,
  onOpenChange,
  rack,
  equipment,
  onEquipmentUpdated,
  onEquipmentRemoved
}) => {
  const [name, setName] = useState(equipment.name);
  const [brand, setBrand] = useState(equipment.brand);
  const [position, setPosition] = useState(equipment.position.toString());
  const [size, setSize] = useState(equipment.size.toString());
  
  const [portCount, setPortCount] = useState(equipment.portCount?.toString() || '');
  const [ipAddress, setIpAddress] = useState(equipment.ipAddress || '');
  const [vlans, setVlans] = useState(equipment.vlans?.join(', ') || '');
  const [ports, setPorts] = useState<SwitchPort[]>(equipment.ports || []);
  
  const [idracIp, setIdracIp] = useState(equipment.idracIp || '');
  const [description, setDescription] = useState(equipment.description || '');
  const [virtualMachines, setVirtualMachines] = useState<VirtualMachine[]>(
    equipment.virtualMachines || []
  );
  
  const [activeTab, setActiveTab] = useState('general');
  const [newVmName, setNewVmName] = useState('');
  const [newVmDescription, setNewVmDescription] = useState('');
  const [newVmIp, setNewVmIp] = useState('');
  const [newVmAnydesk, setNewVmAnydesk] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    console.log("Equipment changed:", equipment);
    setName(equipment.name);
    setBrand(equipment.brand);
    setPosition(equipment.position.toString());
    setSize(equipment.size.toString());
    setPortCount(equipment.portCount?.toString() || '');
    setIpAddress(equipment.ipAddress || '');
    setVlans(equipment.vlans?.join(', ') || '');
    setPorts(equipment.ports || []);
    setIdracIp(equipment.idracIp || '');
    setDescription(equipment.description || '');
    setVirtualMachines(equipment.virtualMachines || []);
    
    setIsDirty(false);
  }, [equipment]);
  
  useEffect(() => {
    setIsDirty(true);
  }, [name, brand, position, size, portCount, ipAddress, vlans, ports, idracIp, description]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (!name || !brand || !position || !size) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        setIsSubmitting(false);
        return;
      }
      
      const positionNum = parseInt(position);
      const sizeNum = parseInt(size);
      
      if (isNaN(positionNum) || positionNum < 1 || positionNum > rack.totalUnits) {
        toast.error(`La position doit être un nombre entre 1 et ${rack.totalUnits}`);
        setIsSubmitting(false);
        return;
      }
      
      if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > rack.totalUnits) {
        toast.error(`La taille doit être un nombre entre 1 et ${rack.totalUnits}`);
        setIsSubmitting(false);
        return;
      }
      
      if (positionNum + sizeNum - 1 > rack.totalUnits) {
        toast.error("L'équipement dépasse la taille de la baie");
        setIsSubmitting(false);
        return;
      }
      
      const updatedEquipment: Partial<Equipment> = {
        name,
        brand,
        position: positionNum,
        size: sizeNum,
      };
      
      if (equipment.type === 'switch') {
        if (portCount) {
          updatedEquipment.portCount = parseInt(portCount);
        }
        updatedEquipment.ipAddress = ipAddress;
        
        const processedVlans = parseVlans(vlans);
        
        updatedEquipment.vlans = processedVlans;
        console.log("VLANs mis à jour:", processedVlans);
        
        if (ports && ports.length > 0) {
          const updatedPorts = ports.map(port => {
            if (!port.taggedVlans) {
              return { ...port, taggedVlans: [] };
            }
            
            const validTaggedVlans = port.taggedVlans.filter(tag => 
              processedVlans.includes(tag)
            );
            
            return {
              ...port,
              taggedVlans: validTaggedVlans
            };
          });
          
          updatedEquipment.ports = updatedPorts;
          console.log("Ports mis à jour:", updatedPorts);
        }
      } else {
        updatedEquipment.idracIp = idracIp;
        updatedEquipment.description = description;
        updatedEquipment.virtualMachines = virtualMachines;
      }
      
      const result = await updateEquipment(equipment.id, updatedEquipment);
      
      toast.success(`${equipment.type === 'switch' ? 'Switch' : 'Serveur'} mis à jour avec succès`);
      onEquipmentUpdated(result);
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "Échec de la mise à jour de l'équipement");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteEquipment = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${equipment.name} ?`)) {
      setIsSubmitting(true);
      try {
        const success = await removeEquipment(rack.id, equipment.id);
        if (success) {
          toast.success(`${equipment.type === 'switch' ? 'Switch' : 'Serveur'} supprimé avec succès`);
          onOpenChange(false);
          onEquipmentRemoved();
        } else {
          toast.error("Échec de la suppression de l'équipement");
        }
      } catch (error: any) {
        toast.error(error.message || "Échec de la suppression de l'équipement");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleAddVm = async () => {
    if (!newVmName || !newVmIp || !newVmAnydesk) {
      toast.error("Veuillez remplir tous les champs de la VM");
      return;
    }
    
    setIsSubmitting(true);
    
    const newVm = {
      name: newVmName,
      description: newVmDescription,
      ipAddress: newVmIp,
      anydeskCode: newVmAnydesk
    };
    
    try {
      const result = await addVirtualMachine(rack.id, equipment.id, newVm);
      setVirtualMachines([...virtualMachines, result]);
      setNewVmName('');
      setNewVmDescription('');
      setNewVmIp('');
      setNewVmAnydesk('');
      toast.success("Machine virtuelle ajoutée avec succès");
    } catch (error: any) {
      toast.error(error.message || "Échec de l'ajout de la VM");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRemoveVm = async (vmId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette VM ?")) {
      setIsSubmitting(true);
      try {
        const success = await removeVirtualMachine(equipment.id, vmId);
        if (success) {
          setVirtualMachines(virtualMachines.filter(vm => vm.id !== vmId));
          toast.success("Machine virtuelle supprimée avec succès");
        } else {
          toast.error("Échec de la suppression de la VM");
        }
      } catch (error: any) {
        toast.error(error.message || "Échec de la suppression de la VM");
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const handleInitPorts = async () => {
    if (!equipment.portCount && !portCount) {
      toast.error("Le nombre de ports n'est pas défini");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const count = parseInt(portCount || '0') || equipment.portCount || 0;
      if (!count) {
        toast.error("Nombre de ports invalide");
        setIsSubmitting(false);
        return;
      }
      
      const processedVlans = parseVlans(vlans);
      
      const initialPorts = Array.from({ length: count }, (_, i) => ({
        id: `temp-port-${Date.now()}-${i}`,
        equipment_id: equipment.id,
        portNumber: i + 1,
        description: '',
        connected: false,
        taggedVlans: [] as string[],
        isFibre: false
      }));
      
      setPorts(initialPorts);
      
      const updatedEquipment = {
        portCount: count,
        vlans: processedVlans,
        ports: initialPorts
      };
      
      const result = await updateEquipment(equipment.id, updatedEquipment);
      
      if (result.ports && Array.isArray(result.ports)) {
        setPorts(result.ports);
      }
      
      toast.success("Ports initialisés avec succès");
      
      onEquipmentUpdated(result);
      setIsDirty(false);
    } catch (error: any) {
      toast.error(error.message || "Échec de l'initialisation des ports");
      console.error("Port initialization error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdatePort = async (portId: string, updates: Partial<SwitchPort>) => {
    const updatedPorts = ports.map(port => 
      port.id === portId ? { ...port, ...updates } : port
    );
    
    setPorts(updatedPorts);
    setIsDirty(true);
    
    try {
      await updateSwitchPort(portId, updates);
      console.log(`Port ${portId} updated successfully with:`, updates);
    } catch (error) {
      console.error(`Error updating port ${portId}:`, error);
      toast.error(`Échec de la mise à jour du port: ${(error as Error).message}`);
      
      setPorts(ports);
    }
  };
  
  const handleToggleVlanOnPort = async (portId: string, vlan: string) => {
    const port = ports.find(p => p.id === portId);
    if (!port) {
      console.error(`Port ${portId} not found`);
      return;
    }
    
    let updatedTaggedVlans = Array.isArray(port.taggedVlans) ? [...port.taggedVlans] : [];
    const index = updatedTaggedVlans.indexOf(vlan);
    
    if (index === -1) {
      updatedTaggedVlans.push(vlan);
    } else {
      updatedTaggedVlans.splice(index, 1);
    }
    
    const updatedPorts = ports.map(p => 
      p.id === portId ? { ...p, taggedVlans: updatedTaggedVlans } : p
    );
    
    setPorts(updatedPorts);
    setIsDirty(true);
    
    try {
      await updateSwitchPort(portId, { taggedVlans: updatedTaggedVlans });
      console.log(`VLANs for port ${portId} updated to:`, updatedTaggedVlans);
    } catch (error) {
      console.error(`Error toggling VLAN on port ${portId}:`, error);
      toast.error(`Échec de la mise à jour des VLANs: ${(error as Error).message}`);
      
      setPorts(ports);
    }
  };
  
  const handleCloseWithConfirmation = () => {
    if (isDirty) {
      if (window.confirm("Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir fermer ?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseWithConfirmation}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Modifier {equipment.type === 'switch' ? 'Switch' : 'Serveur'}</DialogTitle>
          <DialogDescription>
            Modification de {equipment.name} dans la baie "{rack.name}"
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            {equipment.type === 'server' && (
              <TabsTrigger value="vms">Machines Virtuelles</TabsTrigger>
            )}
            {equipment.type === 'switch' && (
              <TabsTrigger value="ports">Ports</TabsTrigger>
            )}
            <TabsTrigger value="danger" className="text-destructive">Danger</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] w-full pr-4">
              <TabsContent value="general" className="mt-0 space-y-4">
                <form id="edit-form" onSubmit={handleSubmit} className="space-y-4 mb-4">
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
                      <Select value={size} onValueChange={setSize}>
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
                  
                  {equipment.type === 'server' && (
                    <>
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
                    </>
                  )}
                  
                  {equipment.type === 'switch' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="portCount">Nombre de Ports</Label>
                        <Select value={portCount} onValueChange={setPortCount}>
                          <SelectTrigger>
                            <SelectValue placeholder="Nombre de ports" />
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
                    </>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="vms" className="mt-0">
                <div className="space-y-6">
                  <div className="bg-muted/40 p-4 rounded-lg space-y-4">
                    <h3 className="text-lg font-medium">Ajouter une Machine Virtuelle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vmName">Nom</Label>
                        <Input
                          id="vmName"
                          placeholder="Nom de la VM"
                          value={newVmName}
                          onChange={(e) => setNewVmName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vmIp">Adresse IP</Label>
                        <Input
                          id="vmIp"
                          placeholder="ex. 192.168.1.101"
                          value={newVmIp}
                          onChange={(e) => setNewVmIp(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vmDesc">Description</Label>
                        <Input
                          id="vmDesc"
                          placeholder="Description de la VM"
                          value={newVmDescription}
                          onChange={(e) => setNewVmDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vmAnydesk">Code Anydesk</Label>
                        <Input
                          id="vmAnydesk"
                          placeholder="ex. AD-123456"
                          value={newVmAnydesk}
                          onChange={(e) => setNewVmAnydesk(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddVm} className="w-full mt-2" disabled={isSubmitting}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter VM
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Machines Virtuelles Existantes</h3>
                    {virtualMachines.length > 0 ? (
                      <div className="space-y-4">
                        {virtualMachines.map((vm) => (
                          <div key={vm.id} className="border rounded-lg p-4 bg-background">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{vm.name}</h4>
                                <p className="text-sm text-muted-foreground">{vm.description}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveVm(vm.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <span className="text-xs text-muted-foreground">IP:</span>{" "}
                                <span className="font-mono">{vm.ipAddress}</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Anydesk:</span>{" "}
                                <span className="font-mono">{vm.anydeskCode}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 border rounded-lg bg-muted/30">
                        <p className="text-muted-foreground">
                          Aucune machine virtuelle n'a été ajoutée à ce serveur.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ports" className="mt-0">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Configuration des Ports</h3>
                    <Button 
                      onClick={handleInitPorts} 
                      disabled={isSubmitting}
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {ports.length === 0 ? "Initialiser Ports" : "Réinitialiser Ports"}
                    </Button>
                  </div>
                  
                  {ports.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-2 py-2 px-4 bg-muted rounded-lg text-sm font-medium">
                          <div className="col-span-1">N°</div>
                          <div className="col-span-3">Description</div>
                          <div className="col-span-1">État</div>
                          <div className="col-span-7">VLANs</div>
                        </div>
                        
                        {ports.map((port) => (
                          <div key={port.id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3">
                            <div className="col-span-1 font-medium">{port.portNumber}</div>
                            <div className="col-span-3">
                              <Input
                                value={port.description || ''}
                                placeholder="Description"
                                onChange={(e) => handleUpdatePort(port.id, { description: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-1">
                              <Select
                                value={port.connected ? "true" : "false"}
                                onValueChange={(value) => handleUpdatePort(port.id, { connected: value === "true" })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">Connecté</SelectItem>
                                  <SelectItem value="false">Libre</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-7 flex flex-wrap gap-1">
                              {equipment.vlans && equipment.vlans.length > 0 ? (
                                equipment.vlans.map((vlan) => (
                                  <button
                                    key={`${port.id}-${vlan}`}
                                    type="button"
                                    className={`px-2 py-1 text-xs rounded ${
                                      port.taggedVlans && Array.isArray(port.taggedVlans) && port.taggedVlans.includes(vlan)
                                        ? 'bg-primary text-white'
                                        : 'bg-muted'
                                    }`}
                                    onClick={() => handleToggleVlanOnPort(port.id, vlan)}
                                  >
                                    {vlan}
                                  </button>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Ajoutez des VLANs dans l'onglet "Général"
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <Button 
                          type="submit" 
                          onClick={handleSubmit} 
                          disabled={isSubmitting || !isDirty}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer les changements
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 border rounded-lg bg-muted/30">
                      <p className="text-muted-foreground">
                        Cliquez sur "Initialiser Ports" pour configurer les ports de ce switch.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="danger" className="mt-0">
                <div className="space-y-4">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-destructive">Zone de Danger</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Les actions ci-dessous sont irréversibles. Procédez avec prudence.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Supprimer cet équipement</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cette action supprimera définitivement {equipment.name} de la baie.
                      {equipment.type === 'server' && equipment.virtualMachines && equipment.virtualMachines.length > 0 && 
                        ` Toutes les ${equipment.virtualMachines.length} machines virtuelles associées seront également supprimées.`}
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteEquipment}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer {equipment.type === 'switch' ? 'ce Switch' : 'ce Serveur'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleCloseWithConfirmation}>
              Annuler
            </Button>
            <Button type="submit" form="edit-form" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditEquipmentDialog;
