import React from 'react';
import { NAVBAR } from '@/constants/testIds';
import { 
  Sprout, 
  BookOpen, 
  Bot, 
  Building2, 
  UserCheck, 
  RotateCcw, 
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  allUsers, 
  onSelectUser, 
  onOpenAuth, 
  onResetData 
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-[#FDFBF7]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        
        {/* Brand Logo */}
        <div 
          data-testid={NAVBAR.brandLogo}
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-green-700 to-emerald-900 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-105 transition-transform duration-200">
            <Sprout className="w-6 h-6 text-emerald-300 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                Modal<span className="text-green-700">Tani</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Smart Village Tech
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Edutech & Asistensi KUR Pertanian Berbasis AI
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-stone-100/90 p-1.5 rounded-xl border border-stone-200/70">
          <button
            data-testid={NAVBAR.navHome}
            onClick={() => setActiveTab('landing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'landing'
                ? 'bg-white text-green-800 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            Beranda
          </button>

          <button
            data-testid={NAVBAR.navModules}
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'modules'
                ? 'bg-white text-green-800 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Modul Belajar (PLEK)
          </button>

          <button
            data-testid={NAVBAR.navChat}
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-green-800 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            Tanya Asisten KUR
          </button>

          <button
            data-testid={NAVBAR.navCrm}
            onClick={() => setActiveTab('crm')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'crm'
                ? 'bg-white text-green-800 shadow-sm font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-600" />
            Dashboard Bank Mitra
          </button>
        </nav>

        {/* Right Actions: Role Selector & Demo Mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Active Role Quick Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                data-testid={NAVBAR.roleSelector}
                className="bg-white border-stone-300 hover:bg-stone-50 text-stone-800 shadow-xs flex items-center gap-2 text-xs sm:text-sm h-9 px-2.5 sm:px-3"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${currentUser?.role === 'admin_bank' ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span className="font-medium truncate max-w-[110px] sm:max-w-[140px]">
                  {currentUser?.nama || 'Pilih Peran Demo'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5 bg-white border border-stone-200 shadow-xl rounded-xl">
              <DropdownMenuLabel className="text-xs text-stone-400 font-semibold px-2 py-1">
                PILIH PROFIL DEMO (HACKATHON)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="text-[11px] font-semibold text-emerald-800 px-2 py-1 bg-emerald-50/70 rounded-md my-1 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                Peran Petani Desa
              </div>
              {allUsers.filter(u => u.role === 'petani').map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`cursor-pointer text-xs p-2 rounded-lg ${currentUser?.id === u.id ? 'bg-green-50 text-green-900 font-semibold' : 'hover:bg-stone-50'}`}
                >
                  <div className="flex flex-col">
                    <span>{u.nama}</span>
                    <span className="text-[10px] text-stone-400">{u.komoditas} • {u.desa}</span>
                  </div>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="my-1" />
              <div className="text-[11px] font-semibold text-amber-800 px-2 py-1 bg-amber-50/70 rounded-md my-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Peran Analis Bank Mitra
              </div>
              {allUsers.filter(u => u.role === 'admin_bank').map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={`cursor-pointer text-xs p-2 rounded-lg ${currentUser?.id === u.id ? 'bg-amber-50 text-amber-900 font-semibold' : 'hover:bg-stone-50'}`}
                >
                  <div className="flex flex-col">
                    <span>{u.nama}</span>
                    <span className="text-[10px] text-stone-400">Penyelia KUR & Analis Mitigasi</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset Demo Data */}
          <Button
            variant="ghost"
            size="sm"
            data-testid={NAVBAR.resetDemoButton}
            onClick={onResetData}
            title="Reset Data Demo"
            className="h-9 w-9 p-0 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Auth Button */}
          <Button
            data-testid={NAVBAR.loginButton}
            onClick={onOpenAuth}
            size="sm"
            className="bg-green-700 hover:bg-green-800 text-white font-medium text-xs sm:text-sm h-9 px-3.5 shadow-sm"
          >
            <UserCheck className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Ganti Akun
          </Button>
        </div>

      </div>

      {/* Mobile Subnav */}
      <div className="lg:hidden flex items-center justify-around border-t border-stone-200/80 bg-white/90 px-2 py-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('landing')}
          className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${activeTab === 'landing' ? 'bg-green-100 text-green-900 font-bold' : 'text-stone-600'}`}
        >
          Beranda
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${activeTab === 'modules' ? 'bg-green-100 text-green-900 font-bold' : 'text-stone-600'}`}
        >
          <BookOpen className="w-3.5 h-3.5 text-green-700" />
          Modul Belajar
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${activeTab === 'chat' ? 'bg-green-100 text-green-900 font-bold' : 'text-stone-600'}`}
        >
          <Bot className="w-3.5 h-3.5 text-green-700" />
          Tanya KUR
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${activeTab === 'crm' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-stone-600'}`}
        >
          <Building2 className="w-3.5 h-3.5 text-amber-700" />
          Bank CRM
        </button>
      </div>
    </header>
  );
};