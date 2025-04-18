
import { useRef, useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from './ChatMessage';
import { supabase, Message } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  chatId: string;
  userId: string;
  apiKey: string;
}

export default function ChatInterface({ chatId, userId, apiKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Cargar mensajes al cambiar de chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error cargando mensajes:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los mensajes.",
          variant: "destructive",
        });
      }
    };
    
    loadMessages();
  }, [chatId, toast]);

  // Auto scroll al recibir nuevos mensajes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !chatId) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Añadir mensaje del usuario a la UI inmediatamente
    const tempUserMessageId = Date.now().toString();
    const userMessageObj: Message = {
      id: tempUserMessageId,
      chat_id: chatId,
      content: userMessage,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessageObj]);
    
    try {
      // Guardar mensaje del usuario en la base de datos
      const { data: userData, error: userError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: userMessage,
          role: 'user',
          user_id: userId
        })
        .select();
        
      if (userError) throw userError;
      
      // Actualizar ID del mensaje del usuario con el real de la BD
      if (userData && userData[0]) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempUserMessageId ? userData[0] : msg
        ));
      }
      
      // Mostrar indicador de carga como mensaje temporal del asistente
      const tempAssistantMessageId = 'temp-' + Date.now().toString();
      const tempAssistantMessage: Message = {
        id: tempAssistantMessageId,
        chat_id: chatId,
        content: 'Pensando...',
        role: 'assistant',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, tempAssistantMessage]);
      
      // Obtener todos los mensajes para enviar a la API de OpenAI
      const messageHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      messageHistory.push({
        role: 'user',
        content: userMessage
      });
      
      // Llamar a la API de OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messageHistory,
          temperature: 0.7,
          max_tokens: 2048
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error en la API de OpenAI');
      }
      
      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;
      
      // Guardar respuesta del asistente en la base de datos
      const { data: assistantData, error: assistantError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          content: assistantMessage,
          role: 'assistant',
          user_id: userId
        })
        .select();
        
      if (assistantError) throw assistantError;
      
      // Actualizar el mensaje temporal con la respuesta real
      if (assistantData && assistantData[0]) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempAssistantMessageId ? assistantData[0] : msg
        ));
      } else {
        // Si por alguna razón no tenemos la respuesta de la base de datos, actualizamos el temporal
        setMessages(prev => prev.map(msg => 
          msg.id === tempAssistantMessageId ? {
            ...msg,
            content: assistantMessage
          } : msg
        ));
      }
      
      // Actualizar la última fecha de actividad del chat
      await supabase
        .from('chats')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', chatId);
        
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Eliminar el mensaje temporal de carga
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar tu mensaje",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Eliminar de la base de datos
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
        
      if (error) throw error;
      
      // Actualizar el estado
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: "Mensaje eliminado",
        description: "El mensaje fue eliminado exitosamente.",
      });
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <h3 className="text-xl font-semibold mb-2">Comienza una nueva conversación</h3>
              <p>Envía un mensaje para iniciar el chat</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onDelete={handleDeleteMessage}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[60px]"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
