import React, { useState } from 'react';
import { LOGIN, REGISTER } from '@/constants/testIds';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sprout, Building2, Sparkles } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, onLoginSuccess, allUsers }) => {
  const [role, setRole] = useState('petani');
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');

  const handleQuickLogin = (user) => {
    onLoginSuccess(user);
    onClose();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const demoUser = {
      id: `custom-user-${Date.now()}`,
      nama: nama || (role === 'petani' ? 'Budi Hartono (Petani)' : 'Bambang Prakoso (Analis Bank)'),
      role: role,
      no_hp: noHp || '081234567890',
      desa: 'Desa Karanganyar',
      komoditas: role === 'petani' ? 'Padi Sawah' : 'Sektor Pertanian'
    };
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-stone-200 shadow-2xl">
        <DialogHeader className="text-left space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Mode Demo Instan Hackathon
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-stone-900">
            Masuk ke ModalTani
          </DialogTitle>
          <DialogDescription className="text-xs text-stone-500">
            Pilih profil contoh siap-pakai atau masukkan nama Anda untuk langsung mengeksplorasi prototipe tanpa verifikasi password.
          </DialogDescription>
        </DialogHeader>

        {/* Quick Demo Switcher Grid */}
        <div className="mt-4 space-y-2">
          <Label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
            1-Klik Masuk sebagai Profil Contoh:
          </Label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {allUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-green-600 hover:bg-green-50/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    u.role === 'admin_bank' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {u.role === 'admin_bank' ? <Building2 className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-900 group-hover:text-green-800">
                      {u.nama}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {u.role === 'admin_bank' ? 'Admin Bank Mitra' : `${u.komoditas} • ${u.desa}`}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-green-700 bg-green-100/80 px-2 py-0.5 rounded-md group-hover:bg-green-700 group-hover:text-white transition-colors">
                  Pilih
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative my-3 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
          <span className="relative bg-white px-2 text-[11px] font-medium text-stone-400 uppercase">atau isi formulir</span>
        </div>

        {/* Standard Form Tabs (Login / Register) */}
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-3 bg-stone-100">
            <TabsTrigger value="login" className="text-xs">Masuk Demo</TabsTrigger>
            <TabsTrigger value="register" className="text-xs">Daftar Akun Baru</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-3">
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <Label className="text-xs text-stone-700">Peran Anda</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole('petani')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      role === 'petani' 
                        ? 'border-green-600 bg-green-50 text-green-900 font-bold' 
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Sprout className="w-3.5 h-3.5 text-green-700" />
                    Petani Desa
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin_bank')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      role === 'admin_bank' 
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold' 
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    Admin Bank Mitra
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-stone-700">Nama Lengkap</Label>
                <Input
                  data-testid={LOGIN.emailInput}
                  placeholder="Mis. Pak Sutrisno"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="mt-1 text-xs h-9"
                />
              </div>

              <div>
                <Label className="text-xs text-stone-700">Nomor HP / WhatsApp</Label>
                <Input
                  data-testid={LOGIN.passwordInput}
                  placeholder="0812-xxxx-xxxx"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="mt-1 text-xs h-9"
                />
              </div>

              <Button
                type="submit"
                data-testid={LOGIN.submitButton}
                className="w-full bg-green-700 hover:bg-green-800 text-white text-xs h-9 font-medium shadow-sm"
              >
                Lanjut ke Dashboard &rarr;
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-3">
            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <Label className="text-xs text-stone-700">Nama Petani / Calon Debitur</Label>
                <Input
                  data-testid={REGISTER.nameInput}
                  placeholder="Nama sesuai KTP"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="mt-1 text-xs h-9"
                />
              </div>
              <div>
                <Label className="text-xs text-stone-700">Nomor HP Aktif</Label>
                <Input
                  data-testid={REGISTER.emailInput}
                  placeholder="08xxxxxxxxxx"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  className="mt-1 text-xs h-9"
                />
              </div>
              <Button
                type="submit"
                data-testid={REGISTER.submitButton}
                className="w-full bg-green-700 hover:bg-green-800 text-white text-xs h-9 font-medium shadow-sm"
              >
                Daftar & Langsung Masuk Demo
              </Button>
            </form>
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
};