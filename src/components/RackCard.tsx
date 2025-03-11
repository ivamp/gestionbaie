
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RackSummary } from '@/types/rack';
import { Button } from '@/components/ui/button';
import { ChevronRight, Server, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RackCardProps {
  rack: RackSummary;
}

const RackCard: React.FC<RackCardProps> = ({ rack }) => {
  const navigate = useNavigate();
  const freeUnits = rack.totalUnits - rack.usedUnits;
  const usagePercentage = Math.round((rack.usedUnits / rack.totalUnits) * 100);
  
  // Determine color based on usage
  let progressColor = "bg-green-500";
  if (usagePercentage > 80) progressColor = "bg-red-500";
  else if (usagePercentage > 60) progressColor = "bg-amber-500";
  
  const viewRackDetails = () => {
    navigate(`/rack/${rack.id}`);
  };
  
  return (
    <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex mb-1.5">
              <div className="bg-secondary text-xs font-medium px-2 py-0.5 rounded-full">
                {rack.location}
              </div>
            </div>
            <CardTitle className="text-xl font-semibold">{rack.name}</CardTitle>
          </div>
          <Server className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Total Units</span>
              <span className="text-lg font-medium">{rack.totalUnits}U</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Free Units</span>
              <span className="text-lg font-medium">{freeUnits}U</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>Usage</span>
              <span>{usagePercentage}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${progressColor} rounded-full transition-all duration-500`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>{rack.equipmentCount} devices</span>
            </div>
            <Button variant="ghost" size="sm" onClick={viewRackDetails} className="px-2">
              View <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RackCard;
