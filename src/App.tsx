
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RackDetails from "./pages/RackDetails";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { initDatabase } from "./utils/databaseInit";

const queryClient = new QueryClient();

const App = () => {
  // Définir le titre de la page
  document.title = "Gestion des Baies Serveur";
  
  // Initialiser la connexion à la base de données au démarrage
  useEffect(() => {
    initDatabase();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rack/:id" element={<RackDetails />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
