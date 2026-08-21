import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { CHAT } from '@/constants/testIds';
import {
  Send,
  Mic,
  Bot,
  User as UserIcon,
  Sparkles,
  Trash2,
  Loader2,
  ShieldCheck,
  BookOpenCheck,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const QUICK_PROMPTS = [
  'Apa saja syarat dan berkas untuk mengajukan KUR Mikro?',
  'Berapa bunga KUR Pertanian dan bagaimana skema Yarnen?',
  'Apakah saya wajib punya sertifikat tanah sebagai agunan?',
  'Saya hanya penggarap sawah, apa bisa mengajukan KUR?',
];

export const ChatAdvisoryView = ({ currentUser, api }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const loadHistory = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoadingHistory(true);
    try {
      const res = await axios.get(`${api}/chat/history/${currentUser.id}`);
      setMessages(res.data?.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
      scrollToBottom();
    }
  }, [currentUser, api]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    const query = (text ?? input).trim();
    if (!query || !currentUser?.id) return;
    setIsSending(true);

    // Optimistic user bubble
    const userMsg = { role: 'user', text: query, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      const res = await axios.post(`${api}/chat/ask`, {
        user_id: currentUser.id,
        message: query,
      });
      const botMsg = {
        role: 'assistant',
        text: res.data?.answer || 'Maaf, tidak ada jawaban yang tersedia.',
        sumber_rujukan: res.data?.sources || [],
        sumber_detail: res.data?.source_details || [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengirim pesan. Coba lagi sebentar.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Maaf, ada kendala jaringan. Silakan coba beberapa saat lagi.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const clearHistory = async () => {
    if (!currentUser?.id) return;
    try {
      await axios.delete(`${api}/chat/history/${currentUser.id}`);
      setMessages([]);
      toast.success('Riwayat percakapan dibersihkan');
    } catch {
      toast.error('Gagal menghapus riwayat');
    }
  };

  const handleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info('Browser Anda belum mendukung input suara. Gunakan Chrome terbaru untuk fitur ini.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'id-ID';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => toast.error('Gagal menangkap suara');
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Info Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-heading font-bold text-base">Asisten KUR ModalTani</div>
                <div className="text-[11px] text-emerald-200">Powered by Gemini RAG • OJK Compliant</div>
              </div>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Tanya jawab seputar Kredit Usaha Rakyat (KUR) sektor pertanian dalam bahasa yang ramah bagi petani desa. Setiap jawaban dirujuk ke dokumen resmi OJK, Kemenko Perekonomian, dan Bank Himbara.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Pertanyaan Populer
            </div>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  data-testid={CHAT.quickPromptBtn(i)}
                  onClick={() => sendMessage(q)}
                  disabled={isSending}
                  className="w-full text-left p-2.5 rounded-lg border border-stone-200 hover:border-green-600 hover:bg-green-50/40 text-xs text-stone-700 transition-all disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold mb-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              Catatan Transparansi
            </div>
            Semua jawaban asisten dihasilkan dari <strong>Retrieval-Augmented Generation (RAG)</strong> berbasis dokumen resmi. Jika informasi belum ada, asisten akan mengarahkan Bapak/Ibu untuk konsultasi ke mantri bank terdekat.
          </div>
        </aside>

        {/* Main Chat Panel */}
        <section className="lg:col-span-8 rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden flex flex-col h-[75vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 bg-stone-50/70">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-stone-800">
                Asisten KUR sedang online
              </span>
              <span className="text-[10px] text-stone-400">• Bahasa Indonesia ramah petani</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              data-testid={CHAT.clearChatBtn}
              className="h-8 text-[11px] text-stone-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Bersihkan
            </Button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gradient-to-b from-emerald-50/20 to-white"
          >
            {isLoadingHistory && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
              </div>
            )}
            {!isLoadingHistory && messages.length === 0 && (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                  <Bot className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-stone-900 text-base">
                  Selamat datang, {currentUser?.nama?.split(' ')[0] || 'Bapak/Ibu Petani'}!
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  Silakan bertanya seputar syarat, bunga, agunan, atau alur pengajuan KUR Pertanian. Contoh pertanyaan bisa Anda pilih di panel kiri.
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={i}
                  data-testid={CHAT.messageBubble}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white ${
                    isUser ? 'bg-stone-700' : 'bg-emerald-700'
                  }`}>
                    {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] space-y-1.5 ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
                    <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-tr-sm'
                        : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Source badge (assistant only) */}
                    {!isUser && msg.sumber_detail?.length > 0 && (
                      <div className="space-y-1.5">
                        <div
                          data-testid={CHAT.officialSourceBadge}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Dijawab berdasarkan {msg.sumber_detail.length} dokumen resmi
                        </div>
                        <ul className="space-y-1 mt-1">
                          {msg.sumber_detail.map((src, k) => (
                            <li key={k} className="flex items-start gap-1.5 text-[11px] text-stone-500 leading-snug">
                              <BookOpenCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>
                                <strong className="text-stone-700">{src.judul}</strong>
                                {src.pasal && <> • {src.pasal}</>}
                                <span className="text-stone-400"> — {src.nama}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-[10px] text-stone-400">
                      {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="p-3 border-t border-stone-200 bg-white flex items-center gap-2"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-testid={CHAT.micBtn}
              onClick={handleMic}
              className={`h-11 w-11 rounded-xl shrink-0 border ${
                isListening
                  ? 'bg-red-100 border-red-300 text-red-700 animate-pulse'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Mic className="w-5 h-5" />
            </Button>
            <Input
              data-testid={CHAT.inputMessage}
              placeholder="Tanyakan apa saja seputar KUR, syarat, bunga, agunan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
              className="flex-1 h-11 text-sm border-stone-200 bg-stone-50 focus:bg-white focus-visible:ring-emerald-700"
            />
            <Button
              type="submit"
              data-testid={CHAT.sendBtn}
              disabled={isSending || !input.trim()}
              className="h-11 px-4 bg-green-800 hover:bg-green-900 text-white shadow-sm font-semibold"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">Kirim</span>
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};
