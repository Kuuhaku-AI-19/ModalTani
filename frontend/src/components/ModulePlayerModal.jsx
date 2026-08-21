import React, { useState } from 'react';
import { MODULES } from '@/constants/testIds';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Volume2, 
  PlayCircle, 
  HelpCircle, 
  FileText, 
  Award, 
  Sparkles
} from 'lucide-react';

export const ModulePlayerModal = ({ 
  isOpen, 
  onClose, 
  module, 
  onCompleteQuiz, 
  userId 
}) => {
  const [activeTab, setActiveTab] = useState('video');
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);

  if (!module) return null;

  const handleSelectQuizOption = (qId, optId) => {
    if (quizSubmitted) return;
    setSelectedQuizAnswers({
      ...selectedQuizAnswers,
      [qId]: optId
    });
  };

  const handleEvaluateQuiz = () => {
    let correct = 0;
    module.quiz.forEach((q) => {
      if (selectedQuizAnswers[q.id] === q.correct_option_id) {
        correct += 1;
      }
    });
    const total = module.quiz.length;
    const calculatedScore = Math.round((correct / total) * 100);
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);
    onCompleteQuiz(userId, module.id, calculatedScore, selectedQuizAnswers);
  };

  const handleResetQuiz = () => {
    setSelectedQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {module.plek_category}
            </span>
            <span className="text-[11px] text-stone-500">
              ⏱ {module.duration_minutes} Menit Durasi
            </span>
          </div>
          <DialogTitle className="text-lg sm:text-xl font-heading font-bold text-stone-900">
            {module.title}
          </DialogTitle>
          <p className="text-xs text-stone-600">{module.subtitle}</p>
        </DialogHeader>

        {/* Tab Controls inside Player */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'video' ? 'bg-white text-green-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5 text-green-700" />
            Player Audio-Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'summary' ? 'bg-white text-green-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-green-700" />
            Ringkasan Teks (PLEK)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'quiz' ? 'bg-white text-green-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Kuis Pemahaman ({module.quiz?.length || 0} Soal)
          </button>
        </div>

        {/* TAB 1: VIDEO / AUDIO PLAYER */}
        {activeTab === 'video' && (
          <div className="space-y-4 mt-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-900 border border-stone-800 shadow-inner group">
              <img 
                src={module.thumbnail_url} 
                alt={module.title}
                className="w-full h-full object-cover opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      Simulasi Video Pembelajaran PLEK Kementan
                    </span>
                    <h4 className="text-sm font-bold truncate max-w-sm">{module.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAudioPlaying(!audioPlaying)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-md"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {audioPlaying ? 'Jeda Narasi Suara' : 'Putar Narasi Audio'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {audioPlaying && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <Volume2 className="w-4 h-4 text-emerald-700" />
                  <span>Memutar narasi Bahasa Indonesia santun: <em>"{module.subtitle}"</em></span>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono">01:45 / 08:00</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Poin Utama Pembelajaran:
              </div>
              <ul className="space-y-1.5">
                {module.summary_points?.map((pt, idx) => (
                  <li key={idx} className="text-xs text-stone-600 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveTab('quiz')}
                className="bg-green-700 hover:bg-green-800 text-white text-xs h-9 px-4"
              >
                Lanjut ke Kuis Pemahaman &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: SUMMARY TEXT NOTES */}
        {activeTab === 'summary' && (
          <div className="space-y-4 mt-3">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs leading-relaxed text-stone-700 space-y-3">
              <h4 className="font-bold text-stone-900 text-sm">Rangkuman Materi Modul</h4>
              <p>{module.full_text_notes}</p>
              <div className="pt-2 border-t border-stone-200">
                <h5 className="font-semibold text-stone-900 mb-1.5">Langkah Implementasi di Sawah/Kebun:</h5>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  {module.summary_points?.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveTab('quiz')}
                className="bg-green-700 hover:bg-green-800 text-white text-xs h-9 px-4"
              >
                Uji Pemahaman Lewat Kuis &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: INTERACTIVE QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 mt-3">
            {!quizSubmitted ? (
              <div className="space-y-4">
                {module.quiz?.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded">
                        Pertanyaan {idx + 1}
                      </span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug">
                      {q.question}
                    </h5>
                    <div className="space-y-2 pt-1">
                      {q.options.map((opt) => {
                        const isSelected = selectedQuizAnswers[q.id] === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            data-testid={MODULES.quizOption(opt.id)}
                            onClick={() => handleSelectQuizOption(q.id, opt.id)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
                              isSelected
                                ? 'border-green-600 bg-green-50 text-green-950 font-medium'
                                : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? 'bg-green-700 text-white' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {opt.id.toUpperCase()}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-stone-500">
                    Dijawab: {Object.keys(selectedQuizAnswers).length} dari {module.quiz?.length} soal
                  </span>
                  <Button
                    onClick={handleEvaluateQuiz}
                    disabled={Object.keys(selectedQuizAnswers).length < module.quiz?.length}
                    data-testid={MODULES.quizSubmitBtn}
                    className="bg-green-700 hover:bg-green-800 text-white text-xs h-9 px-4"
                  >
                    Kirim Jawaban Kuis
                  </Button>
                </div>
              </div>
            ) : (
              /* Quiz Result Review */
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                  <Award className="w-8 h-8 text-emerald-700 mx-auto" />
                  <h4 className="text-lg font-bold text-emerald-900 font-heading">
                    Nilai Kuis: {quizScore}%
                  </h4>
                  <p className="text-xs text-emerald-800">
                    {quizScore >= 70 
                      ? '🎉 Selamat! Pemahaman Anda sangat baik dan menaikkan Credit Score Anda di mata Bank Mitra.' 
                      : 'Perlu latihan lagi, Anda dapat mengulang kuis ini kapan saja.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {module.quiz?.map((q, idx) => {
                    const chosen = selectedQuizAnswers[q.id];
                    const isCorrect = chosen === q.correct_option_id;
                    return (
                      <div key={q.id} className="p-3 rounded-xl border bg-stone-50 border-stone-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-800">Soal {idx + 1}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isCorrect ? 'Benar (+100)' : 'Kurang Tepat'}
                          </span>
                        </div>
                        <p className="font-medium text-stone-900">{q.question}</p>
                        <p className="text-[11px] text-stone-500 pt-1">
                          <strong className="text-emerald-800">Penjelasan:</strong> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={handleResetQuiz}
                    className="text-xs h-9 border-stone-300"
                  >
                    Ulangi Kuis
                  </Button>
                  <Button
                    onClick={onClose}
                    className="bg-green-700 hover:bg-green-800 text-white text-xs h-9 px-4"
                  >
                    Tutup & Simpan Progres
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};