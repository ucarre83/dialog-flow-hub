
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cleanupAuthState } from '@/utils/authUtils';

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | 
           "ghost" | "link" | null | undefined;
  className?: string;
}

export default function LogoutButton({ variant = "outline", className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión correctamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleLogout} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <span className="flex items-center">
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
          Cerrando...
        </span>
      ) : (
        <span className="flex items-center">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </span>
      )}
    </Button>
  );
}
