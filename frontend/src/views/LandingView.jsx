import React from 'react';
import { LANDING } from '@/constants/testIds';
import { 
  Sprout, 
  BookOpen, 
  Bot, 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Users, 
  Coins,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LandingView = ({ onSelectRole, onGoToModules, onGoToChat, onGoToCrm }) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Smart Village Hackathon • Inovasi Finansial Pertanian</span>
              </div>
              <h1 
                data-testid={LANDING.heroTitle}
                className="text-3xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-stone-900 tracking-tight leading-[1.15]"
              >
                Modal Tani Berdaya, <br />
                <span className="text-green-800 underline decoration-amber-400 decoration-wavy decoration-2">
                  Akses KUR Terbuka
                </span> & Adil.
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-stone-600 leading-relaxed max-w-2xl font-sans">
                Platform edutech audio-visual <strong>PLEK Kementan</strong> dan asisten konsultasi KUR berbasis AI <strong>Gemini RAG</strong>, dilengkapi sistem <em>credit scoring</em> cerdas untuk mempermudah bank mitra menyalurkan modal kerja subsidi 6% ke petani desa.
              </p>
              {/* Hero Action CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Button
                  data-testid={LANDING.ctaFarmer}
                  onClick={() => onSelectRole('petani')}
                  size="lg"
                  className="bg-green-800 hover:bg-green-900 text-white font-heading font-semibold text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8 rounded-xl shadow-lg shadow-green-900/10 hover:shadow-xl transition-all"
                >
                  <Sprout className="w-5 h-5 mr-2 text-emerald-300" />
                  Masuk sebagai Petani Desa
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  data-testid={LANDING.ctaBank}
                  onClick={() => onSelectRole('admin_bank')}
                  variant="outline"
                  size="lg"
                  className="bg-white hover:bg-amber-50 text-stone-800 hover:text-amber-900 border-stone-300 hover:border-amber-400 font-heading font-semibold text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8 rounded-xl shadow-xs"
                >
                  <Building2 className="w-5 h-5 mr-2 text-amber-600" />
                  Masuk sebagai Supervisor Admin
                </Button>
              </div>
              {/* Key Trust Signals */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200/80">
                <div>
                  <div className="font-heading font-bold text-lg sm:text-2xl text-stone-900">6% p.a</div>
                  <div className="text-[11px] sm:text-xs text-stone-500">Bunga Subsidi KUR</div>
                </div>
                <div>
                  <div className="font-heading font-bold text-lg sm:text-2xl text-stone-900">3 Pilar PLEK</div>
                  <div className="text-[11px] sm:text-xs text-stone-500">Standar Kementan</div>
                </div>
                <div>
                  <div className="font-heading font-bold text-lg sm:text-2xl text-stone-900">0 Biaya Calo</div>
                  <div className="text-[11px] sm:text-xs text-stone-500">Transparan & Resmi</div>
                </div>
              </div>
            </div>
            {/* Hero Right Visual Banner */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100 aspect-[4/3] sm:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1505471768190-275e2ad7b3f9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzOTB8MHwxfHNlYXJjaHwzfHxpbmRvbmVzaWFuJTIwZmFybWVyJTIwcmljZSUyMGZpZWxkJTIwYWdyaWN1bHR1cmV8ZW58MHx8fHwxNzg3MjgzNDQ4fDA&ixlib=rb-4.1.0&q=85" 
                  alt="Petani Indonesia di Sawah"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white text-[11px] font-semibold backdrop-blur-xs w-fit mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Terhubung Regulasi OJK & Bank Himbara
                  </div>
                  <h3 className="font-heading text-base sm:text-lg font-bold">
                    Pak Budi • Karawang, Jawa Barat
                  </h3>
                  <p className="text-xs text-stone-200">
                    "Skor Literasi 85 Poin — Pengajuan KUR Mikro 50 Juta Disetujui Bank Tanpa Jaminan Tambahan"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* 2. SECTION MASALAH YANG DISELESAIKAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full">
            Tantangan di Pedesaan
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-stone-900">
            Mengapa Petani Kecil Sering Gagal Mengakses KUR?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Meskipun alokasi dana KUR Pertanian triliunan rupiah tersedia setiap tahun, jurang informasi dan pencatatan kas masih menjadi penghambat utama.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-stone-900 text-base sm:text-lg">
              1. Literasi Keuangan Rendah & Kas Bercampur
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Uang belanja dapur harian bercampur dengan modal benih & pupuk, sehingga kesulitan menghitung laba riil dan HPP panen.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-stone-900 text-base sm:text-lg">
              2. Prosedur Dianggap Rumit & Rentan Calo
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Petani takut ke bank karena mengira wajib agunan sertifikat tanah, atau tergiur calo dan pinjaman informal berbunga tinggi.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-bold text-stone-900 text-base sm:text-lg">
              3. Jangkauan Penyuluh Lapangan (PPL) Terbatas
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Rasio 1 penyuluh membina ratusan petani di beberapa desa membuat pendampingan tatap muka perbankan tidak merata.
            </p>
          </div>
        </div>
      </section>
      {/* 3. SECTION 3 FITUR UTAMA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded-full">
            Solusi End-to-End ModalTani
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-bold text-stone-900">
            Tiga Fitur Utama untuk Petani & Lembaga Keuangan
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Card 1: PLEK Modules */}
          <div 
            data-testid={LANDING.featureModulesCard}
            onClick={onGoToModules}
            className="group cursor-pointer p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white to-emerald-50/40 border border-stone-200 hover:border-green-600 hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-green-700 text-white flex items-center justify-center shadow-md">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-bold text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full">
                PLEK Kementan Standar
              </div>
              <h3 className="text-xl font-heading font-bold text-stone-900 group-hover:text-green-800 transition-colors">
                Modul Belajar Mandiri Audio-Visual
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Video & narasi suara interaktif ramah petani desa. Dilengkapi pre-test diagnostik dan kuis pemahaman yang langsung terintegrasi dengan poin credit score.
              </p>
            </div>
            <div className="text-xs font-bold text-green-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Buka Modul Belajar &rarr;
            </div>
          </div>
          {/* Card 2: AI KUR Chat RAG */}
          <div 
            data-testid={LANDING.featureChatCard}
            onClick={onGoToChat}
            className="group cursor-pointer p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white to-blue-50/40 border border-stone-200 hover:border-blue-600 hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full">
                RAG Minim Halusinasi
              </div>
              <h3 className="text-xl font-heading font-bold text-stone-900 group-hover:text-blue-800 transition-colors">
                Asisten Konsultasi KUR (AI Chat)
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Tanya jawab seputar syarat KUR, agunan, dan tahapan bank dalam bahasa santun pedesaan. Didukung tombol suara serta badge rujukan dokumen resmi OJK.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Mulai Tanya Asisten AI &rarr;
            </div>
          </div>
          {/* Card 3: Bank CRM & Credit Scoring */}
          <div 
            data-testid={LANDING.featureCrmCard}
            onClick={onGoToCrm}
            className="group cursor-pointer p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white to-amber-50/40 border border-stone-200 hover:border-amber-600 hover:shadow-xl transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Pra-Skrining Bank Mitra
              </div>
              <h3 className="text-xl font-heading font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                CRM & Credit Scoring Deterministik
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Dashboard bagi analis dan mantri bank untuk memverifikasi calon debitur secara transparan berbasis 4 pilar (Lahan, Panen, Edukasi, dan Dokumen).
              </p>
            </div>
            <div className="text-xs font-bold text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Akses Dashboard Bank &rarr;
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};