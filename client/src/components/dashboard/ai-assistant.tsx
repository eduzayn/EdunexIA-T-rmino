import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Paperclip, Mic } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      content: "Olá! Sou o assistente IA do Edunéxia. Como posso ajudar você hoje?",
      timestamp: new Date(Date.now() - 5 * 60000)
    }
  ]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponses: { [key: string]: string } = {
        "desempenho": "O curso de Desenvolvimento Web Full Stack apresenta uma taxa de conclusão de 82%, acima da média da plataforma (78.3%). A nota média dos alunos é 8.7/10. Módulos com maior engajamento: JavaScript (92%) e React (88%). Gostaria de ver uma análise detalhada deste curso?",
        "alunos": "Atualmente temos 2.847 alunos ativos na plataforma, um aumento de 8.2% em relação ao mês anterior. A distribuição por cursos mostra maior concentração em Desenvolvimento Web (32%) e Inteligência Artificial (28%).",
        "receita": "A receita mensal atual é de R$ 284.512,00, com crescimento de 12.5% em relação ao mês anterior. As principais fontes são assinaturas recorrentes (65%) e vendas de cursos individuais (35%)."
      };

      // Determine which response to give based on keywords in the user's message
      let responseText = "Desculpe, não entendi completamente sua pergunta. Poderia reformular ou fornecer mais detalhes?";
      
      const lowercaseInput = userMessage.content.toLowerCase();
      
      if (lowercaseInput.includes("desempenho") || lowercaseInput.includes("curso") || lowercaseInput.includes("desenvolvimento")) {
        responseText = aiResponses.desempenho;
      } else if (lowercaseInput.includes("alunos") || lowercaseInput.includes("estudantes")) {
        responseText = aiResponses.alunos;
      } else if (lowercaseInput.includes("receita") || lowercaseInput.includes("financeiro") || lowercaseInput.includes("vendas")) {
        responseText = aiResponses.receita;
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        sender: "ai",
        content: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle>Assistente IA</CardTitle>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Edunéxia AI
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col h-[320px] p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start ${message.sender === 'user' ? 'justify-end' : ''}`}
            >
              {message.sender === 'ai' && (
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div 
                className={`p-3 rounded-lg max-w-[85%] ${
                  message.sender === 'ai' 
                    ? 'bg-muted rounded-tl-none' 
                    : 'bg-primary/10 rounded-tr-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              
              {message.sender === 'user' && (
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center ml-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t pt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Digite sua pergunta..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pr-12"
            />
            <Button 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              size="icon"
              variant="ghost"
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4 text-primary" />
            </Button>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex space-x-2">
              <button className="inline-flex items-center hover:text-foreground">
                <Paperclip className="mr-1 h-3.5 w-3.5" /> Anexar
              </button>
              <button className="inline-flex items-center hover:text-foreground">
                <Mic className="mr-1 h-3.5 w-3.5" /> Voz
              </button>
            </div>
            <span>Base de conhecimento: Atualizada</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
