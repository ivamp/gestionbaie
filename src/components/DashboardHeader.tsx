
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  onAddNew?: () => void;
  addNewLabel?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  onAddNew, 
  addNewLabel = "Add New" 
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-slide-down">
      <div>
        <div className="inline-flex mb-2">
          <div className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
            Datacenter Management
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      
      {onAddNew && (
        <Button 
          onClick={onAddNew} 
          className="transition-all duration-300 hover:translate-y-[-2px]"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {addNewLabel}
        </Button>
      )}
    </div>
  );
};

export default DashboardHeader;
