
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chat as ChatType, supabase } from '@/lib/supabase';
import ChatInterface from '@/components/chat/ChatInterface';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';

export default function Chat() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cargar datos del usuario y verificar si está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          navigate('/auth');
          return;
        }
        
        setUserId(session.user.id);
        
        // Verificar si el usuario existe en la tabla users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }
        
        // Si el usuario no existe en la tabla, crearlo
        if (!userData) {
          const { data: authData } = await supabase.auth.getUser();
          const user = authData.user;
          
          if (user) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email,
                username: user.user_metadata.username || user.email?.split('@')[0],
                status: 'active',
                is_admin: false,
                created_at: new Date().toISOString()
              });
              
            if (insertError) throw insertError;
          }
        } else {
          // Establecer el estado de administrador
          setIsAdmin(userData.is_admin);
          
          // Verificar si el usuario está bloqueado
          if (userData.status === 'blocked') {
            toast({
              title: "Cuenta bloqueada",
              description: "Tu cuenta ha sido desactivada. Contacta al administrador para más información.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            navigate('/auth');
            return;
          }
        }
        
        // Verificar si tenemos una API key guardada
        const savedApiKey = localStorage.getItem('openai_api_key');
        if (savedApiKey) {
          setApiKey(savedApiKey);
        } else {
          setShowApiKeyDialog(true);
        }
        
        // Cargar chats y seleccionar el más reciente
        const { data: chats, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', session.user.id)
          .order('last_updated', { ascending: false })
          .limit(1);
          
        if (chatsError) throw chatsError;
        
        if (chats && chats.length > 0) {
          setSelectedChatId(chats[0].id);
        } else {
          // Si no hay chats, crear uno nuevo
          await createNewChat();
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        toast({
          title: "Error",
          description: "No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        });
        navigate('/auth');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  const createNewChat = async (): Promise<string> => {
    try {
      if (!userId) throw new Error('Usuario no autenticado');
      
      const { data, error } = await supabase
        .from('chats')
        .insert({
          user_id: userId,
          title: 'Nueva conversación',
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .select();
        
      if (error) throw error;
      
      if (data && data[0]) {
        setSelectedChatId(data[0].id);
        return data[0].id;
      } else {
        throw new Error('No se pudo crear una nueva conversación');
      }
    } catch (error) {
      console.error('Error creando nuevo chat:', error);
      toast({
        title: "Error",
        description: "No se pudo crear una nueva conversación.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      setShowApiKeyDialog(false);
      toast({
        title: "API Key guardada",
        description: "Tu API Key de OpenAI ha sido guardada.",
      });
    } else {
      toast({
        title: "Error",
        description: "Por favor, ingresa una API Key válida.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!userId) return null;

  return (
    <>
      <div className="flex h-screen">
        <div className="w-80 h-full">
          <ChatSidebar
            userId={userId}
            isAdmin={isAdmin}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onCreateNewChat={createNewChat}
          />
        </div>
        
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {!apiKey ? (
            <div className="flex items-center justify-center h-full p-4">
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Se requiere API Key de OpenAI</AlertTitle>
                <AlertDescription>
                  Para utilizar el chat, necesitas proporcionar tu API Key de OpenAI.
                  <Button 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => setShowApiKeyDialog(true)}
                  >
                    Configurar API Key
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : selectedChatId ? (
            <ChatInterface 
              chatId={selectedChatId}
              userId={userId}
              apiKey={apiKey}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">Selecciona una conversación o crea una nueva</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key de OpenAI</DialogTitle>
            <DialogDescription>
              Para utilizar el chat, necesitas proporcionar tu API Key de OpenAI. 
              Esta se almacenará de forma segura en tu navegador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            <Input
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              Puedes obtener tu API Key en{' '}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-primary underline"
              >
                https://platform.openai.com/api-keys
              </a>
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
            >
              Guardar API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
