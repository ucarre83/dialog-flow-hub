
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Copy, Check, Share, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/lib/supabase";

interface ChatMessageProps {
  message: Message;
  onDelete?: (messageId: string) => void;
}

export default function ChatMessage({ message, onDelete }: ChatMessageProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const isUser = message.role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    
    toast({
      title: "Copiado al portapapeles",
      description: "El mensaje ha sido copiado exitosamente.",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleShare = () => {
    // Implementar la funcionalidad de compartir
    // Por ejemplo, usando la API Web Share si está disponible
    if (navigator.share) {
      navigator.share({
        title: 'Mensaje compartido desde ChatApp',
        text: message.content,
      }).catch(err => console.error('Error al compartir:', err));
    } else {
      toast({
        title: "Compartir no disponible",
        description: "Tu navegador no soporta esta función.",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  return (
    <div className={cn(
      "flex w-full mb-4 items-start gap-2 md:gap-4",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary text-white">
          <span className="text-xs">AI</span>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-[80%] md:max-w-[70%] rounded-lg p-4",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}>
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        <div className={cn(
          "flex justify-end mt-2 gap-1",
          isUser ? "text-primary-foreground/70" : "text-secondary-foreground/70"
        )}>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
          
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleShare}>
            <Share className="h-3 w-3" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 bg-accent text-accent-foreground">
          <span className="text-xs">TÚ</span>
        </Avatar>
      )}
    </div>
  );
}
