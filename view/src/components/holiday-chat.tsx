import { useState, useRef, useEffect } from "react";
import { useHolidayChat } from "../hooks/useToolCalls";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader,
  Calendar,
  Sparkles
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function HolidayChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Olá! Sou seu assistente de feriados brasileiros. Posso te ajudar com informações sobre feriados, emendas, sugestões de viagem e muito mais! Que tal começar fazendo uma pergunta?',
      timestamp: new Date(),
      suggestions: [
        'Quais são os feriados nacionais de 2024?',
        'Quais feriados têm emenda com fim de semana?',
        'Qual o melhor período para tirar férias?',
        'Quais feriados oferecem mais dias de folga?'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const chatMutation = useHolidayChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const response = await chatMutation.mutateAsync({
        message,
        year: selectedYear
      }) as { response: string; suggestions?: string[] };

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.response,
        timestamp: new Date(),
        suggestions: response.suggestions || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat sobre Feriados
        </CardTitle>
        <CardDescription>
          Faça perguntas sobre feriados, emendas e sugestões de viagem
        </CardDescription>
        
        {/* Seletor de ano */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium">Ano:</span>
          <div className="flex gap-1">
            {[selectedYear - 1, selectedYear, selectedYear + 1].map((year) => (
              <Button
                key={year}
                variant={year === selectedYear ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
                className="text-xs"
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'bot' && (
                    <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  {message.type === 'user' && (
                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Sugestões */}
                {message.type === 'bot' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">Sugestões:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Pensando...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Área de input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua pergunta sobre feriados..."
              disabled={chatMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || chatMutation.isPending}
              size="icon"
            >
              {chatMutation.isPending ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Dicas rápidas */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Dicas rápidas:
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                'Emendas',
                'Longos fins de semana',
                'Melhores períodos',
                'Férias',
                'Viagens'
              ].map((tip) => (
                <Badge
                  key={tip}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSuggestionClick(`Fale sobre ${tip.toLowerCase()}`)}
                >
                  {tip}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
