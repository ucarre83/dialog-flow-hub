
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AtSign, Lock, UserPlus, KeyRound, ShieldCheck } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 8) {
      return { 
        isValid: false, 
        message: "La contraseña debe tener al menos 8 caracteres" 
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase) {
      return { 
        isValid: false, 
        message: "Debe contener al menos una letra mayúscula" 
      };
    }

    if (!hasLowercase) {
      return { 
        isValid: false, 
        message: "Debe contener al menos una letra minúscula" 
      };
    }

    if (!hasNumber) {
      return { 
        isValid: false, 
        message: "Debe contener al menos un número" 
      };
    }

    if (!hasSpecialChar) {
      return { 
        isValid: false, 
        message: "Debe contener al menos un carácter especial" 
      };
    }

    return { isValid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        // Username validation
        if (!username) {
          toast({
            title: "Error de Registro",
            description: "El nombre de usuario es obligatorio",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Password validation for registration
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
          toast({
            title: "Contraseña Débil",
            description: passwordValidation.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Password confirmation
        if (password !== confirmPassword) {
          toast({
            title: "Error de Registro",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          setLoading(false);
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
          title: "Registro Exitoso",
          description: "Por favor revisa tu correo para confirmar tu cuenta.",
        });
        
      } else if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Inicio de Sesión Exitoso",
          description: "Bienvenido de nuevo.",
        });
        
      } else if (mode === 'reset') {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });

        if (error) throw error;

        toast({
          title: "Correo Enviado",
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
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          {mode === 'login' && <Lock className="text-primary" />}
          {mode === 'register' && <UserPlus className="text-primary" />}
          {mode === 'reset' && <KeyRound className="text-primary" />}
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
              <div className="flex items-center">
                <UserPlus className="mr-2 text-muted-foreground" />
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
            </div>
          )}
          
          <div className="mb-4">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="flex items-center">
              <AtSign className="mr-2 text-muted-foreground" />
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
          </div>
          
          {mode !== 'reset' && (
            <div className="mb-4">
              <Label htmlFor="password">Contraseña</Label>
              <div className="flex items-center">
                <Lock className="mr-2 text-muted-foreground" />
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
            </div>
          )}
          
          {mode === 'register' && (
            <div className="mb-4">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="flex items-center">
                <ShieldCheck className="mr-2 text-muted-foreground" />
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
