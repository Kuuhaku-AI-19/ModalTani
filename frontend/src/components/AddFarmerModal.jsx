import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export const AddFarmerModal = ({ isOpen, onClose, onAddFarmer }) => {
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [desa, setDesa] = useState('Desa Sukamaju');
  const [kecamatan, setKecamatan] = useState('Kec. Lembang');
  const [kabupaten, setKabupaten] = useState('Kab. Bandung Barat');
  const [komoditas, setKomoditas] = useState('Padi Sawah');
  const [luasLahan, setLuasLahan] = useState('1.0');
  const [statusLahan, setStatusLahan] = useState('Milik Sendiri');
  const [lamaBertani, setLamaBertani] = useState('4');
  const [pendapatan, setPendapatan] = useState('15000000');
  const [hasKtp, setHasKtp] = useState(true);
  const [hasKk, setHasKk] = useState(true);
  const [hasSku, setHasSku] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newFarmer = {
        user_id: `farmer-${Date.now()}`,
        nama: nama || 'Petani Binaan Baru',
        no_hp: noHp || '0812-3344-5566',
        desa,
        kecamatan,
        kabupaten,
        provinsi: 'Jawa Barat',
        komoditas,
        luas_lahan_ha: parseFloat(luasLahan) || 1.0,
        status_lahan: statusLahan,
        lama_bertani_tahun: parseInt(lamaBertani) || 3,
        estimasi_pendapatan_musim_rp: parseInt(pendapatan) || 15000000,
        riwayat_panen: [
          {
            musim: 'Panen Terakhir',
            tahun: 2024,
            volume_ton: parseFloat(luasLahan) * 4.5,
            pendapatan_rp: parseInt(pendapatan) || 15000000
          }
        ],
        dokumen: {
          ktp: hasKtp,
          kk: hasKk,
          nib_atau_sku: hasSku,
          sppt_pbb_atau_surat_lahan: true,
          buku_tabungan: true,
          foto_lahan: true
        }
      };

      await onAddFarmer(newFarmer);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white p-6 rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-lg font-heading font-bold text-stone-900">
            Tambah Data Calon Debitur Petani
          </DialogTitle>
          <p className="text-xs text-stone-500">
            Sistem akan langsung menghitung credit score deterministik 4 pilar secara otomatis.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <div>
            <Label className="text-xs text-stone-700">Nama Petani Sesuai KTP</Label>
            <Input
              data-testid="add-farmer-nama"
              placeholder="Mis. Pak Sukardi"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              className="mt-1 text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-stone-700">Nomor HP</Label>
              <Input
                data-testid="add-farmer-no-hp"
                placeholder="0812-xxxx-xxxx"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-stone-700">Komoditas Utama</Label>
              <Select value={komoditas} onValueChange={setKomoditas}>
                <SelectTrigger className="mt-1 text-xs h-9">
                  <SelectValue placeholder="Pilih komoditas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padi Sawah">Padi Sawah</SelectItem>
                  <SelectItem value="Kopi Robusta & Arabika">Kopi Robusta & Arabika</SelectItem>
                  <SelectItem value="Hortikultura (Cabai/Bawang)">Hortikultura (Cabai/Bawang)</SelectItem>
                  <SelectItem value="Karet & Sawit Swadaya">Karet & Sawit Swadaya</SelectItem>
                  <SelectItem value="Jagung & Palawija">Jagung & Palawija</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-stone-700">Desa</Label>
              <Input
                value={desa}
                onChange={(e) => setDesa(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-stone-700">Kecamatan</Label>
              <Input
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-stone-700">Luas Lahan (Hektar)</Label>
              <Input
                data-testid="add-farmer-luas-lahan"
                type="number"
                step="0.1"
                value={luasLahan}
                onChange={(e) => setLuasLahan(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-stone-700">Status Lahan</Label>
              <Select value={statusLahan} onValueChange={setStatusLahan}>
                <SelectTrigger className="mt-1 text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Milik Sendiri">Milik Sendiri</SelectItem>
                  <SelectItem value="Sewa">Sewa</SelectItem>
                  <SelectItem value="Garapan / Adat">Garapan / Adat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-stone-700">Lama Bertani (Tahun)</Label>
              <Input
                type="number"
                value={lamaBertani}
                onChange={(e) => setLamaBertani(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-stone-700">Omzet Panen (Rp/Musim)</Label>
              <Input
                type="number"
                value={pendapatan}
                onChange={(e) => setPendapatan(e.target.value)}
                className="mt-1 text-xs h-9"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <Label className="text-xs text-stone-700 font-semibold block mb-1.5">
              Kelengkapan Berkas Administratif:
            </Label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasKtp}
                  onChange={(e) => setHasKtp(e.target.checked)}
                  className="rounded text-green-700 focus:ring-green-700"
                />
                <span>Ada e-KTP</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasKk}
                  onChange={(e) => setHasKk(e.target.checked)}
                  className="rounded text-green-700 focus:ring-green-700"
                />
                <span>Ada Kartu Keluarga (KK)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasSku}
                  onChange={(e) => setHasSku(e.target.checked)}
                  className="rounded text-green-700 focus:ring-green-700"
                />
                <span>Ada Surat Keterangan Usaha (SKU) Desa / NIB</span>
              </label>
            </div>
          </div>

          <Button
            data-testid="add-farmer-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-700 hover:bg-green-800 text-white text-xs h-9 font-medium shadow-sm mt-3"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan & Hitung Credit Score'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};