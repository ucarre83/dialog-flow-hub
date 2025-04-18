
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '@/components/auth/AuthForm';
import { supabase } from '@/lib/supabase';

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/chat');
      }
    };

    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">ChatApp</h1>
        <p className="text-muted-foreground">Tu asistente de chat personal</p>
      </div>
      
      <AuthForm />
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Asistente de chat impulsado por OpenAI</p>
      </div>
    </div>
  );
}
