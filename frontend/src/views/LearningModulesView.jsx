import React, { useState } from 'react';
import { MODULES } from '@/constants/testIds';
import { 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  Clock, 
  HelpCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const LearningModulesView = ({
  modules,
  userProgress,
  userProfile,
  onOpenPretest,
  onOpenModulePlayer
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const categories = [
    'Semua',
    '1. Pengelolaan Keuangan Rumah Tangga',
    '2. Pengelolaan Keuangan Usaha Tani',
    '3. Produk & Layanan Keuangan Formal'
  ];

  const filteredModules = selectedCategory === 'Semua' 
    ? modules 
    : modules.filter(m => m.plek_category === selectedCategory);

  const progressRecords = userProgress?.records || [];
  const completedCount = userProgress?.completed_count || 0;
  const totalModules = modules.length || 3;
  const progressPercent = Math.round((completedCount / totalModules) * 100);

  const getModuleStatus = (moduleId) => {
    const record = progressRecords.find(r => r.module_id === moduleId);
    if (record && record.status === 'completed') {
      return { status: 'completed', label: 'Selesai', score: record.quiz_score };
    }
    return { status: 'not_started', label: 'Belum Selesai', score: null };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 text-left pb-20">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Kurikulum PLEK Kementerian Pertanian RI
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900">
            Modul Belajar Mandiri Audio-Visual
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mt-1">
            Tingkatkan pemahaman tata kelola kas dan simulasi pengajuan KUR. Setiap modul yang diselesaikan otomatis meningkatkan <strong>Credit Scoring</strong> pra-skrining bank!
          </p>
        </div>
        {/* Overall Farmer Progress Tracker Card */}
        <div 
          data-testid={MODULES.progressScoreBadge}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm sm:w-80 space-y-2 shrink-0"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-700">Progres Literasi Anda</span>
            <span className="font-bold text-emerald-800">{completedCount} dari {totalModules} Modul</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-stone-100" />
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span>Dampak ke Skor Kredit:</span>
            <span className="font-bold text-amber-700">+{completedCount === 3 ? 25 : completedCount === 2 ? 17 : completedCount === 1 ? 9 : 0} Poin Bank</span>
          </div>
        </div>
      </div>
      {/* PRE-TEST CALLOUT BANNER */}
      <div 
        data-testid={MODULES.pretestBanner}
        className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-50 to-emerald-50 border border-amber-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-950 uppercase">
              Asesmen Awal
            </span>
            <span className="text-xs font-semibold text-stone-700">
              {userProfile?.pretest_completed ? 'Status: Sudah Dikerjakan' : 'Disarankan Dikerjakan Dahulu'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-heading font-bold text-stone-900">
            Asesmen Diagnostik Literasi Keuangan (5 Pertanyaan Cepat)
          </h3>
          <p className="text-xs text-stone-600">
            Ketahui tingkat pemahaman keuangan Anda (Dasar / Menengah) dan dapatkan rekomendasi materi modul belajar yang paling dibutuhkan.
          </p>
        </div>
        <Button
          data-testid={MODULES.pretestStartBtn}
          onClick={onOpenPretest}
          className="bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs sm:text-sm h-10 px-5 rounded-xl shadow-xs shrink-0"
        >
          <HelpCircle className="w-4 h-4 mr-1.5" />
          {userProfile?.pretest_completed ? 'Ulangi Asesmen Awal' : 'Mulai Asesmen (5 Soal) →'}
        </Button>
      </div>
      {/* Category Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat, idx) => (
          <button
            key={idx}
            data-testid={MODULES.categoryTab(idx)}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-green-800 text-white shadow-sm'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => {
          const statusObj = getModuleStatus(mod.id);
          const isDone = statusObj.status === 'completed';
          return (
            <div
              key={mod.id}
              data-testid={MODULES.moduleCard(mod.id)}
              className="group rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-stone-900 overflow-hidden">
                <img 
                  src={mod.thumbnail_url} 
                  alt={mod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-stone-900/80 text-white backdrop-blur-xs">
                    Kategori PLEK #{mod.plek_category_number}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  {isDone ? (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3 h-3" /> Selesai ({statusObj.score}%)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-stone-950 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {mod.duration_minutes} Mnt
                    </span>
                  )}
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-heading font-bold text-stone-900 text-base leading-snug group-hover:text-green-800 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {mod.subtitle}
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-500">
                    {mod.quiz?.length || 0} Soal Evaluasi
                  </span>
                  <Button
                    data-testid={MODULES.moduleStartBtn(mod.id)}
                    onClick={() => onOpenModulePlayer(mod)}
                    size="sm"
                    className={`text-xs h-8 px-3.5 rounded-lg font-medium shadow-xs ${
                      isDone 
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200' 
                        : 'bg-green-700 hover:bg-green-800 text-white'
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
                    {isDone ? 'Buka Kembali' : 'Mulai Belajar'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};