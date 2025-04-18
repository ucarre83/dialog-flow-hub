
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MessageSquare, 
  Search, 
  X, 
  LogOut, 
  Settings,
  User,
  UserCog
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Chat, supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ChatSidebarProps {
  userId: string;
  isAdmin: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => Promise<string>;
}

export default function ChatSidebar({ 
  userId, 
  isAdmin, 
  selectedChatId, 
  onSelectChat, 
  onCreateNewChat 
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cargar los chats del usuario
  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', userId)
          .order('last_updated', { ascending: false });
          
        if (error) throw error;
        setChats(data || []);
      } catch (error) {
        console.error('Error cargando chats:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus conversaciones.",
          variant: "destructive",
        });
      }
    };
    
    loadChats();
    
    // Suscripción a cambios en la tabla de chats
    const subscription = supabase
      .channel('public:chats')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chats',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        loadChats();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, toast]);

  const handleNewChat = async () => {
    try {
      const newChatId = await onCreateNewChat();
      if (newChatId) {
        onSelectChat(newChatId);
      }
    } catch (error) {
      console.error('Error creando nuevo chat:', error);
      toast({
        title: "Error",
        description: "No se pudo crear una nueva conversación.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Primero eliminar los mensajes relacionados
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);
        
      if (messagesError) throw messagesError;
      
      // Luego eliminar el chat
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);
        
      if (chatError) throw chatError;
      
      // Actualizar la lista de chats en el estado
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // Si el chat eliminado era el seleccionado, seleccionar otro
      if (chatId === selectedChatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          onSelectChat(remainingChats[0].id);
        } else {
          handleNewChat();
        }
      }
      
      toast({
        title: "Conversación eliminada",
        description: "La conversación fue eliminada exitosamente.",
      });
    } catch (error) {
      console.error('Error eliminando chat:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión.",
        variant: "destructive",
      });
    }
  };

  const handleAdminPanel = () => {
    navigate('/admin');
  };

  const filteredChats = searchQuery
    ? chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chats;

  return (
    <div className="h-full flex flex-col bg-sidebar p-4 border-r">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">ChatApp</h2>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleSignOut}
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
      
      <Button 
        className="mb-4 w-full"
        onClick={handleNewChat}
      >
        <Plus className="h-4 w-4 mr-2" /> Nueva conversación
      </Button>
      
      <div className="mb-4 relative">
        {isSearching ? (
          <div className="flex items-center">
            <Input
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-8"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0"
              onClick={() => {
                setSearchQuery('');
                setIsSearching(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setIsSearching(true)}
          >
            <Search className="h-4 w-4 mr-2" /> Buscar conversaciones...
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        {filteredChats.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchQuery ? 'No se encontraron resultados' : 'No hay conversaciones'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map(chat => (
              <Button
                key={chat.id}
                variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                className="w-full justify-start font-normal relative group"
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">{chat.title}</span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  title="Eliminar conversación"
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <div className="absolute bottom-0 right-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                  {format(new Date(chat.last_updated), 'dd MMM', { locale: es })}
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Separator className="my-4" />
      
      <div className="flex justify-around">
        <Button
          variant="ghost"
          size="icon"
          title="Perfil"
          onClick={() => navigate('/profile')}
        >
          <User className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          title="Configuración"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        {isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            title="Panel de administrador"
            onClick={handleAdminPanel}
          >
            <UserCog className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
