import { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Send, Sparkles, Database, FileText, MessageCircle } from 'lucide-react';
import { aiService } from '../../lib/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any[];
  sql?: string;
  timestamp: Date;
}

interface ZumaChatProps {
  leadId?: string;
  context?: Record<string, any>;
  collapsed?: boolean;
}

export const ZumaChat = ({ leadId, context, collapsed = false }: ZumaChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Zuma, your AI assistant. I can help you query leads, generate scripts, summarize data, and more. Try asking me something like:\n\n• "Show all QLD leads"\n• "Find high-value leads"\n• "Summarize this lead"\n• "Generate a call script"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.processNaturalLanguageQuery({
        query: input.trim(),
        leadId,
        context,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.success
          ? response.message || 'Query executed successfully'
          : response.error || 'Something went wrong',
        data: response.data,
        sql: response.sql,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Show hot leads', query: 'Show all hot leads' },
    { label: 'QLD leads', query: 'Show all QLD leads' },
    { label: 'Idle leads', query: 'Show leads not contacted in 48 hours' },
    ...(leadId ? [
      { label: 'Summarize', query: 'Summarize this lead' },
      { label: 'Call script', query: 'Generate a call script' },
    ] : []),
  ];

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Sparkles className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="flex flex-col h-full border border-gray-200 shadow-lg">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Zuma AI Assistant</h3>
            <p className="text-xs text-gray-600">Natural language CRM queries</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-medium text-purple-600">Zuma</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>

              {message.sql && (
                <div className="mt-3 p-2 bg-gray-900 rounded text-xs font-mono text-green-400 overflow-x-auto">
                  <div className="flex items-center gap-1 mb-1 text-gray-400">
                    <Database className="w-3 h-3" />
                    <span>SQL Query</span>
                  </div>
                  {message.sql}
                </div>
              )}

              {message.data && message.data.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Results ({message.data.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {message.data.slice(0, 5).map((item: any, idx: number) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-xs border border-gray-200 mb-1">
                        <div className="font-medium">{item.business_name || item.name || 'Lead'}</div>
                        <div className="text-gray-600 text-xs">
                          {item.suburb && item.state ? `${item.suburb}, ${item.state}` : ''}
                          {item.value ? ` • $${item.value.toLocaleString()}` : ''}
                          {item.status ? ` • ${item.status}` : ''}
                        </div>
                      </div>
                    ))}
                    {message.data.length > 5 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        + {message.data.length - 5} more results
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(action.query);
              }}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Zuma anything..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          <span>Ask in natural language - Zuma understands context</span>
        </div>
      </div>
    </Card>
  );
};
