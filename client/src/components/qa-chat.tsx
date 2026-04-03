import { useState, useEffect, useRef } from "react";
import { Bot, MessageCircle, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

interface QAChatProps {
  analysisId: string;
  documentContent: string;
}

export default function QAChat({ analysisId, documentContent }: QAChatProps) {
  const [question, setQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Log the analysisId for debugging
  useEffect(() => {
    console.log("[QAChat] Component mounted with analysisId:", analysisId);
  }, [analysisId]);

  // Fetch existing chat messages
  const { data: messages = [], refetch, isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ['analysis', analysisId, 'messages'],
    queryFn: async () => {
      if (!analysisId) {
        console.warn("[QAChat] No analysisId provided");
        throw new Error("No analysis ID");
      }
      const endpoint = API_ENDPOINTS.analysis.getMessages(analysisId);
      console.log(`[QAChat] Fetching messages from: ${endpoint}`);
      try {
        const response = await apiRequest('GET', endpoint);
        const data = await response.json();
        console.log(`[QAChat] Got ${data.length} messages`);
        return data;
      } catch (err) {
        console.error(`[QAChat] Failed to fetch messages:`, err);
        throw err;
      }
    },
    enabled: !!analysisId,
  });

  // Mutation for asking questions
  const askQuestionMutation = useMutation({
    mutationFn: async (questionText: string) => {
      const response = await apiRequest('POST', API_ENDPOINTS.analysis.askQuestion(analysisId), {
        question: questionText,
      });
      return response.json();
    },
    onSuccess: async () => {
      setQuestion("");
      // Wait a moment then refetch messages
      setTimeout(() => {
        refetch();
      }, 500);
      toast({
        title: t("common.success"),
        description: t("chat.title"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("chat.error"),
        description: error.message || t("chat.error"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    askQuestionMutation.mutate(question.trim());
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, askQuestionMutation.isPending]);

  void documentContent;

  return (
    <section
      className="analysis-card overflow-hidden rounded-3xl border border-[#275158]/18 bg-white/88 shadow-[0_14px_28px_rgba(23,48,54,0.12)] flex flex-col h-full"
      data-testid="card-qa-chat"
    >
      <header className="border-b border-[#275158]/12 bg-[linear-gradient(110deg,#1f4b53_0%,#255960_65%,#2b656d_100%)] px-5 py-3 text-[#e9fffa] sm:px-6 sm:py-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold sm:text-lg" data-testid="text-qa-title">
              {t("chat.title")}
            </h3>
            <p className="mt-1 text-sm text-[#cdeee4]">
              {t("chat.placeholder")}
            </p>
          </div>
          <div className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#d9f7ef] sm:block">
            {t("chat.title")}
          </div>
        </div>
      </header>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-[#f9fdfb] px-4 py-4 sm:px-6" 
        data-testid="area-chat-messages"
      >
        <div className="space-y-5">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <article key={message.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-end">
                  <div className="max-w-[90%] sm:max-w-[75%]" data-testid={`message-question-${message.id}`}>
                    <div className="mb-1 flex items-center justify-end gap-2 text-xs font-medium text-[#547980]">
                      <span>You</span>
                      <UserRound className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-2xl rounded-tr-sm bg-[#1f555e] px-4 py-3 text-sm leading-relaxed text-[#eefffa] shadow-[0_8px_16px_rgba(31,85,94,0.22)]">
                      {message.question}
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-[95%] sm:max-w-[88%]" data-testid={`message-answer-${message.id}`}>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-[#547980]">
                      <Bot className="h-3.5 w-3.5" />
                      <span>Nyayasetu AI</span>
                      <span className="text-[#86a6ab]">{formatTime(message.createdAt)}</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-[#29545b]/14 bg-white px-4 py-3 text-sm leading-relaxed text-[#27484e] shadow-[0_6px_14px_rgba(28,54,60,0.08)]">
                      <p className="whitespace-pre-wrap break-words">{message.answer}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2f5960]/25 bg-white px-6 py-10 text-center">
              <MessageCircle className="mb-3 h-8 w-8 text-[#5f848a]" />
              <p className="text-sm font-medium text-[#2a5259]" data-testid="text-no-messages">
                {t("chat.noDocument")}
              </p>
              <p className="mt-1 text-xs text-[#668b91]">
                {t("chat.placeholder")}
              </p>
            </div>
          )}

          {askQuestionMutation.isPending && (
            <article className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-end">
                <div className="max-w-[90%] sm:max-w-[75%]" data-testid="message-pending-question">
                  <div className="rounded-2xl rounded-tr-sm bg-[#1f555e] px-4 py-3 text-sm leading-relaxed text-[#eefffa]">
                    {question}
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[95%] sm:max-w-[88%]" data-testid="message-pending-answer">
                  <div className="rounded-2xl rounded-tl-sm border border-[#29545b]/14 bg-white px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="loading-dots">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                      <p className="text-sm text-[#5c8087]">{t("chat.thinking")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#275158]/12 bg-white p-3 sm:p-4 flex-shrink-0" data-testid="form-chat-input">
        <div className="flex items-center gap-3">
          <Input
            placeholder={t("chat.placeholder")}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={askQuestionMutation.isPending}
            className="h-11 rounded-xl border-[#2f5960]/25 bg-[#f8fcfa] px-4 py-3 text-sm text-[#23484e] placeholder:text-[#75989e] focus-visible:ring-[#2a5b64]"
            data-testid="input-question"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 flex-shrink-0 rounded-xl bg-[#1f565f] px-3 text-[#ecfffa] hover:bg-[#173f46]"
            disabled={askQuestionMutation.isPending || !question.trim()}
            data-testid="button-send-question"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-[#76989e]">{t("chat.send")}</p>
      </form>
    </section>
  );
}
