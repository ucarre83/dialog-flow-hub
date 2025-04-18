
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validatePassword = (password: string): boolean => {
    // Mínimo 8 caracteres, al menos una letra mayúscula, una minúscula y un número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          return;
        }

        if (!validatePassword(password)) {
          toast({
            title: "Contraseña débil",
            description: "La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una minúscula y un número",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Registro exitoso",
          description: "Por favor revisa tu correo para confirmar tu cuenta.",
        });
        
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido de nuevo.",
        });
        
      } else if (mode === 'reset') {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });

        if (error) throw error;

        toast({
          title: "Correo enviado",
          description: "Revisa tu correo para restablecer tu contraseña.",
        });
        setMode('login');
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {mode === 'login' ? 'Iniciar Sesión' : 
           mode === 'register' ? 'Crear Cuenta' : 
           'Recuperar Contraseña'}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === 'login' ? 'Ingresa tus credenciales para acceder' : 
           mode === 'register' ? 'Completa el formulario para registrarte' : 
           'Ingresa tu correo para recuperar tu contraseña'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="mb-4">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Ingresa tu nombre de usuario"
                className="mt-1"
              />
            </div>
          )}
          
          <div className="mb-4">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
              className="mt-1"
            />
          </div>
          
          {mode !== 'reset' && (
            <div className="mb-4">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          )}
          
          {mode === 'register' && (
            <div className="mb-4">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full mt-4"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 
             mode === 'login' ? 'Iniciar Sesión' : 
             mode === 'register' ? 'Registrarse' : 
             'Enviar correo de recuperación'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {mode === 'login' && (
          <>
            <Button 
              variant="link" 
              onClick={() => setMode('reset')}
              className="px-0"
            >
              ¿Olvidaste tu contraseña?
            </Button>
            <div className="text-center">
              ¿No tienes una cuenta?{' '}
              <Button 
                variant="link" 
                onClick={() => setMode('register')}
                className="px-1"
              >
                Regístrate
              </Button>
            </div>
          </>
        )}
        
        {mode === 'register' && (
          <div className="text-center">
            ¿Ya tienes una cuenta?{' '}
            <Button 
              variant="link" 
              onClick={() => setMode('login')}
              className="px-1"
            >
              Inicia sesión
            </Button>
          </div>
        )}
        
        {mode === 'reset' && (
          <Button 
            variant="link" 
            onClick={() => setMode('login')}
            className="px-0"
          >
            Volver al inicio de sesión
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
