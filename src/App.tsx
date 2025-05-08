
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/utils/authUtils";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST to avoid missing events
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      setIsAuthenticated(!!session);
      
      // Handle sign out event specifically
      if (event === 'SIGNED_OUT') {
        cleanupAuthState();
      }
    });

    // THEN check for existing session
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Mostrar un indicador de carga mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Ruta principal redirige según autenticación */}
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/chat" /> : <Navigate to="/auth" />} 
            />
            
            {/* Rutas públicas */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Rutas protegidas */}
            <Route path="/chat" element={isAuthenticated ? <Chat /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={isAuthenticated ? <Admin /> : <Navigate to="/auth" />} />
            
            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
