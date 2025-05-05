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

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar el estado de autenticación al cargar la aplicación
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuth();

    // Suscribirse a cambios en el estado de autenticación
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

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
