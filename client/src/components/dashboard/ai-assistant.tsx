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
      content: "Olá! Sou a Prof. Ana, sua assistente educacional IA da Edunéxia. Como posso ajudar você hoje?",
      timestamp: new Date(Date.now() - 5 * 60000)
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);

    // Normalmente, faríamos uma chamada à API real aqui
    // fetch('/api/ai/chat', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ question: userMessage.content })
    // })
    
    // Simula chamada à API com respostas educacionais contextualizadas
    setTimeout(() => {
      const aiResponses: { [key: string]: string } = {
        "desempenho": "O curso de Desenvolvimento Web Full Stack apresenta uma taxa de conclusão de 82%, acima da média da plataforma (78.3%). A nota média dos alunos é 8.7/10. Os módulos com maior engajamento são JavaScript (92%) e React (88%). Os alunos destacam a qualidade dos projetos práticos como diferencial do curso. Posso fornecer uma análise mais detalhada ou sugerir estratégias para aumentar o engajamento nos módulos menos populares.",
        "alunos": "Atualmente temos 2.847 alunos ativos na plataforma, um aumento de 8.2% em relação ao mês anterior. A distribuição por cursos mostra maior concentração em Desenvolvimento Web (32%) e Inteligência Artificial (28%). Os alunos têm uma média de idade de 27 anos, com 42% sendo mulheres. A taxa de retenção após 3 meses é de 76%. Posso detalhar mais algum aspecto demográfico específico?",
        "material": "A biblioteca digital conta com 326 materiais didáticos, distribuídos entre e-books (45%), vídeo-aulas (30%), artigos acadêmicos (15%) e exercícios práticos (10%). Os materiais mais acessados são da área de programação. Cada material recebe uma média de 4.2/5 estrelas nas avaliações dos estudantes. Deseja saber mais sobre alguma categoria específica?",
        "certificado": "Os certificados da Edunéxia são emitidos com assinatura digital e QR code para verificação de autenticidade. Até o momento, foram emitidos 987 certificados este mês, um aumento de 14% em relação ao mês anterior. O tempo médio de emissão após a conclusão do curso é de 48 horas. Posso explicar o processo de validação ou esclarecer dúvidas sobre certificações específicas.",
        "receita": "A receita mensal atual é de R$ 284.512,00, com crescimento de 12.5% em relação ao mês anterior. As principais fontes são assinaturas recorrentes (65%) e vendas de cursos individuais (35%). Os cursos premium têm uma conversão 23% maior após a implementação do período de teste gratuito de 7 dias. O ticket médio por aluno é de R$ 99,90.",
        "professor": "O corpo docente conta com 78 professores, sendo 65% mestres ou doutores em suas áreas. A média de avaliação dos professores pelos alunos é de 4.7/5. Os professores mais bem avaliados se destacam pela disponibilidade para tirar dúvidas (92%) e pela clareza nas explicações (89%). Posso fornecer mais detalhes sobre áreas específicas ou perfil dos docentes."
      };

      // Determinar qual resposta enviar baseado em palavras-chave
      let responseText = "Desculpe, não consegui identificar um tópico específico na sua pergunta. Posso ajudar com informações sobre desempenho de cursos, perfil de alunos, materiais didáticos, certificados, dados financeiros ou sobre nossos professores. Em que área posso ajudar?";
      
      const lowercaseInput = userMessage.content.toLowerCase();
      
      // Análise mais inteligente de tópicos na mensagem do usuário
      if (lowercaseInput.includes("desempenho") || lowercaseInput.includes("curso") || 
          lowercaseInput.includes("aprovação") || lowercaseInput.includes("conclusão") ||
          lowercaseInput.includes("notas") || lowercaseInput.includes("avaliação")) {
        responseText = aiResponses.desempenho;
      } 
      else if (lowercaseInput.includes("alunos") || lowercaseInput.includes("estudantes") || 
               lowercaseInput.includes("inscritos") || lowercaseInput.includes("matrículas") ||
               lowercaseInput.includes("participantes")) {
        responseText = aiResponses.alunos;
      } 
      else if (lowercaseInput.includes("biblioteca") || lowercaseInput.includes("material") || 
               lowercaseInput.includes("livro") || lowercaseInput.includes("recurso") ||
               lowercaseInput.includes("conteúdo") || lowercaseInput.includes("leitura")) {
        responseText = aiResponses.material;
      }
      else if (lowercaseInput.includes("certificado") || lowercaseInput.includes("diploma") || 
               lowercaseInput.includes("comprovante") || lowercaseInput.includes("conclusão") ||
               lowercaseInput.includes("certificação")) {
        responseText = aiResponses.certificado;
      }
      else if (lowercaseInput.includes("receita") || lowercaseInput.includes("financeiro") || 
               lowercaseInput.includes("vendas") || lowercaseInput.includes("faturamento") ||
               lowercaseInput.includes("preço") || lowercaseInput.includes("pagamento")) {
        responseText = aiResponses.receita;
      }
      else if (lowercaseInput.includes("professor") || lowercaseInput.includes("docente") || 
               lowercaseInput.includes("instrutor") || lowercaseInput.includes("tutor") ||
               lowercaseInput.includes("educador")) {
        responseText = aiResponses.professor;
      }
      // Tratamento para saudações e apresentações
      else if (lowercaseInput.includes("olá") || lowercaseInput.includes("oi") || 
               lowercaseInput.includes("bom dia") || lowercaseInput.includes("boa tarde") ||
               lowercaseInput.includes("boa noite") || lowercaseInput.includes("prazer")) {
        responseText = "Olá! Eu sou a Prof. Ana, sua assistente educacional. Estou aqui para ajudar com análises de dados educacionais, informações sobre alunos, cursos, materiais didáticos, certificações e muito mais. Como posso auxiliar você hoje?";
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        sender: "ai",
        content: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsProcessing(false);
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
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          Prof. Ana
        </CardTitle>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Assistente Educacional
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
          
          {/* Indicador de digitação quando o processamento está ativo */}
          {isProcessing && (
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="p-3 rounded-lg max-w-[85%] bg-muted rounded-tl-none">
                <div className="flex space-x-1 items-center h-5">
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
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
              disabled={isProcessing || !inputValue.trim()}
            >
              {isProcessing ? (
                <div className="h-4 w-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex space-x-2">
              <button 
                className="inline-flex items-center hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isProcessing}
              >
                <Paperclip className="mr-1 h-3.5 w-3.5" /> Anexar
              </button>
              <button 
                className="inline-flex items-center hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
              >
                <Mic className="mr-1 h-3.5 w-3.5" /> Voz
              </button>
            </div>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
              <span>{isProcessing ? 'Processando...' : 'Pronta para ajudar'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
