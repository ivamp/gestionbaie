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
import { toast } from 'sonner';
import { Rack } from '@/types/rack';
import { addRack } from '@/services/rackService';

interface AddRackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRackAdded: (rack: Rack) => void;
}

const AddRackDialog: React.FC<AddRackDialogProps> = ({
  open,
  onOpenChange,
  onRackAdded
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [totalUnits, setTotalUnits] = useState('42');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validation
    if (!name || !location || !totalUnits) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newRack = await addRack({
        name,
        location,
        totalUnits: parseInt(totalUnits),
      });
      
      toast.success("Baie ajoutée avec succès");
      onOpenChange(false);
      
      // Réinitialiser le formulaire
      setName('');
      setLocation('');
      setTotalUnits('42');
      
      // Notifier le parent
      onRackAdded(newRack);
    } catch (error: any) {
      toast.error(error.message || "Échec de l'ajout de la baie");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setName('');
    setLocation('');
    setTotalUnits('42');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Rack</DialogTitle>
          <DialogDescription>
            Create a new rack in your data center
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Rack Name</Label>
            <Input
              id="name"
              placeholder="e.g. Main Server Rack"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Data Center A - Row 1"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="totalUnits">Total Units</Label>
            <Select defaultValue="42" onValueChange={setTotalUnits}>
              <SelectTrigger>
                <SelectValue placeholder="Select rack size" />
              </SelectTrigger>
              <SelectContent>
                {[12, 24, 36, 42, 48, 60].map((u) => (
                  <SelectItem key={u} value={u.toString()}>
                    {u}U
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Rack</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRackDialog;
