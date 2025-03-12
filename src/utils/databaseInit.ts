
import { toast } from "@/components/ui/use-toast";

export const checkEnvironmentVariables = () => {
  // Dans un environnement frontend, on vérifie simplement si l'URL de l'API est définie
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    console.error('Variable d\'environnement manquante: VITE_API_URL');
    toast({
      title: "Configuration incomplète",
      description: "Veuillez configurer la variable d'environnement VITE_API_URL",
      variant: "destructive",
    });
    return false;
  }
  
  return true;
};

// Fonction pour initialiser la connexion à l'API
export const initDatabase = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  
  try {
    // Tester la connexion à l'API
    const response = await fetch(`${apiUrl}/test`);
    
    if (!response.ok) {
      throw new Error(`Erreur de connexion à l'API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Connexion à l'API réussie:", data.message);
    
    toast({
      title: "Connexion réussie",
      description: "Application connectée à la base de données via l'API backend.",
    });
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la connexion:", error);
    
    toast({
      title: "Erreur de connexion",
      description: "Impossible de se connecter à l'API backend. Vérifiez que le serveur est en cours d'exécution.",
      variant: "destructive",
    });
    
    return false;
  }
};
