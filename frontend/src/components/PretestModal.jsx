import React, { useState } from 'react';
import { MODULES } from '@/constants/testIds';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, Sparkles, ArrowRight } from 'lucide-react';

export const PretestModal = ({ isOpen, onClose, questions, onSubmitPretest, userId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState(null);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const isAnswered = Boolean(selectedAnswers[currentQ?.id]);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (optionId) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optionId,
    });
  };

  const handleNext = async () => {
    if (!isLastQuestion) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSubmitting(true);
      try {
        const res = await onSubmitPretest(userId, selectedAnswers);
        setResultData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFinish = () => {
    setResultData(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white p-6 rounded-2xl border border-stone-200 shadow-2xl">
        {!resultData ? (
          <>
            <DialogHeader className="text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Soal {currentIndex + 1} dari {totalQuestions}
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  {currentQ.category}
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-heading font-bold text-stone-900 pt-2">
                {currentQ.question}
              </DialogTitle>
            </DialogHeader>

            <div className="my-2">
              <Progress value={progressPercent} className="h-2 bg-stone-100 text-green-700" />
            </div>

            {/* Options List */}
            <div className="space-y-2.5 mt-3">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={MODULES.quizOption(opt.id)}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-green-600 bg-green-50/80 text-green-950 font-medium shadow-xs'
                        : 'border-stone-200 bg-stone-50/40 hover:bg-stone-50 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isSelected ? 'bg-green-700 text-white' : 'bg-stone-200 text-stone-600'
                    }`}>
                      {opt.id.toUpperCase()}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-stone-100">
              <span className="text-[11px] text-stone-400">
                *Asesmen untuk rekomendasi modul belajar yang pas
              </span>
              <Button
                type="button"
                disabled={!isAnswered || isSubmitting}
                onClick={handleNext}
                data-testid={MODULES.quizSubmitBtn}
                className="bg-green-700 hover:bg-green-800 text-white text-xs px-4 h-9 shadow-sm"
              >
                {isSubmitting ? 'Memproses...' : isLastQuestion ? 'Selesaikan Asesmen' : 'Lanjut Soal Berikutnya →'}
              </Button>
            </div>
          </>
        ) : (
          /* Result Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-md">
              <Award className="w-9 h-9 text-emerald-700" />
            </div>
            
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Hasil Diagnostik Literasi Keuangan
              </span>
              <h3 className="text-2xl font-heading font-bold text-stone-900 mt-1">
                Skor Pemahaman: {resultData.score}%
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Menjawab benar {resultData.correct_count} dari {resultData.total_questions} pertanyaan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Rekomendasi Tingkat Belajar:
              </div>
              <p className="text-xs font-semibold text-amber-950">
                {resultData.recommended_level}
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Silakan mulai dari Modul 1 untuk memperkuat pemisahan kas atau langsung pelajari perhitungan HPP dan simulasi KUR!
              </p>
            </div>

            <Button
              onClick={handleFinish}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium text-xs h-10 shadow-sm"
            >
              Mulai Belajar Modul Mandiri <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};