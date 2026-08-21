import React, { useState } from 'react';
import { CRM } from '@/constants/testIds';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldCheck, 
  MapPin, 
  FileCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Users2,
  AlertTriangle,
  Building2,
} from 'lucide-react';

export const FarmerDetailDrawer = ({ 
  isOpen, 
  onClose, 
  farmer, 
  onUpdateDocuments,
  onSubmitJudgment,
}) => {
  const [docState, setDocState] = useState(farmer?.dokumen || {});
  const [savingDoc, setSavingDoc] = useState(false);
  const [judgeNote, setJudgeNote] = useState('');
  const [judging, setJudging] = useState(false);

  React.useEffect(() => {
    setDocState(farmer?.dokumen || {});
    setJudgeNote(farmer?.judgment_note || '');
  }, [farmer]);

  if (!farmer) return null;

  const cs = farmer.credit_score || {};
  const badgeColor = cs.badge_color || 'green';

  const handleToggleDoc = (key) => {
    const updated = {
      ...docState,
      [key]: !docState[key]
    };
    setDocState(updated);
  };

  const handleSaveDocVerification = async () => {
    setSavingDoc(true);
    try {
      await onUpdateDocuments(farmer.user_id, docState);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDoc(false);
    }
  };

  const handleJudge = async (decision) => {
    if (!onSubmitJudgment) return;
    setJudging(true);
    try {
      await onSubmitJudgment(farmer.user_id, decision, judgeNote);
    } finally {
      setJudging(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                badgeColor === 'green' ? 'bg-emerald-100 text-emerald-800' :
                badgeColor === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
              }`}>
                {cs.kategori || 'Skor Calon Debitur'}
              </span>
              {cs.needs_one_on_one && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                  <Users2 className="w-3 h-3" />
                  Butuh Konsultasi 1-on-1
                </span>
              )}
              {cs.kur_tier && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-200">
                  {cs.kur_tier}
                </span>
              )}
              {farmer.judgment_status === 'approved' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved Supervisor
                </span>
              )}
              {farmer.judgment_status === 'rejected' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-700 text-white flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Rejected Supervisor
                </span>
              )}
            </div>
            <span className="text-xs text-stone-400 font-mono">
              NIK: {farmer.nik || '3201************'}
            </span>
          </div>
          <DialogTitle className="text-xl font-heading font-bold text-stone-900">
            {farmer.nama}
          </DialogTitle>
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            {farmer.desa}, {farmer.kecamatan}, {farmer.kabupaten} • HP: {farmer.no_hp}
          </p>
        </DialogHeader>

        {/* Top Summary Banner: Score & Recommended Limit */}
        <div className="p-4 rounded-xl bg-stone-900 text-white space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Skor Kelayakan Kredit (Deterministik 0-100)
              </span>
              <div className="text-3xl font-heading font-bold text-amber-400 flex items-baseline gap-2">
                {cs.total_score} <span className="text-xs text-stone-400 font-normal">/ 100 poin</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Rekomendasi Plafon Bank
              </span>
              <div className="text-xs sm:text-sm font-semibold text-emerald-300">
                {cs.rekomendasi_plafon}
              </div>
            </div>
          </div>
        </div>

        {/* 4-Pillar Score Breakdown (Auditable) */}
        <div className="space-y-3 mt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Breakdown 4 Pilar Penilaian (Auditable):
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Pillar 1 */}
            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-stone-800">
                <span>1. Luas & Status Lahan</span>
                <span className="text-emerald-800">{cs.luas_lahan_poin} / 25 pts</span>
              </div>
              <Progress value={(cs.luas_lahan_poin / 25) * 100} className="h-1.5 bg-stone-200" />
              <p className="text-[11px] text-stone-500">
                Lahan: {farmer.luas_lahan_ha} Ha ({farmer.status_lahan})
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-stone-800">
                <span>2. Riwayat Panen & Omzet</span>
                <span className="text-emerald-800">{cs.riwayat_panen_poin} / 25 pts</span>
              </div>
              <Progress value={(cs.riwayat_panen_poin / 25) * 100} className="h-1.5 bg-stone-200" />
              <p className="text-[11px] text-stone-500">
                Pengalaman {farmer.lama_bertani_tahun} thn • Rp {farmer.estimasi_pendapatan_musim_rp?.toLocaleString('id-ID')}/musim
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-stone-800">
                <span>3. Literasi Edukasi ModalTani</span>
                <span className="text-emerald-800">{cs.edukasi_poin} / 25 pts</span>
              </div>
              <Progress value={(cs.edukasi_poin / 25) * 100} className="h-1.5 bg-stone-200" />
              <p className="text-[11px] text-stone-500">
                {farmer.modul_selesai || 0} dari 3 Modul Selesai
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-stone-800">
                <span>4. Berkas Administratif Legal</span>
                <span className="text-emerald-800">{cs.dokumen_poin} / 25 pts</span>
              </div>
              <Progress value={(cs.dokumen_poin / 25) * 100} className="h-1.5 bg-stone-200" />
              <p className="text-[11px] text-stone-500">
                KTP, KK, NIB/SKU Desa, SPPT PBB
              </p>
            </div>

          </div>
        </div>

        {/* Interactive Document Verification Checklist (Bank Admin Feature) */}
        <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              Verifikasi Berkas Calon Debitur (Ubah Checklist Realtime):
            </div>
            <Button
              data-testid="crm-save-doc-verification-btn"
              size="sm"
              variant="outline"
              onClick={handleSaveDocVerification}
              disabled={savingDoc}
              className="text-[11px] h-7 px-2.5 bg-white border-stone-300 hover:bg-stone-50"
            >
              {savingDoc ? 'Menyimpan...' : 'Simpan & Hitung Ulang'}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { key: 'ktp', label: 'e-KTP Asli / Fotokopi' },
              { key: 'kk', label: 'Kartu Keluarga (KK)' },
              { key: 'nib_atau_sku', label: 'Surat Keterangan Usaha (SKU) Desa / NIB' },
              { key: 'sppt_pbb_atau_surat_lahan', label: 'SPPT PBB / Surat Garap' },
              { key: 'buku_tabungan', label: 'Buku Tabungan Bank' },
              { key: 'foto_lahan', label: 'Foto Geotag Lahan' },
              { key: 'bpjs_ketenagakerjaan', label: 'BPJS Ketenagakerjaan (wajib KUR Kecil)' },
              { key: 'agunan_tambahan', label: 'Agunan Tambahan SHM/BPKB (wajib KUR Kecil)' }
            ].map((d) => (
              <label
                key={d.key}
                data-testid={CRM.verifyDocCheckbox(d.key)}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-stone-200 cursor-pointer text-xs select-none hover:bg-green-50/30"
              >
                <input
                  type="checkbox"
                  checked={Boolean(docState[d.key])}
                  onChange={() => handleToggleDoc(d.key)}
                  className="rounded text-green-700 focus:ring-green-700 w-4 h-4"
                />
                <span className="text-[11px] text-stone-700 leading-tight">{d.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Harvest History Log */}
        {farmer.riwayat_panen && farmer.riwayat_panen.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Riwayat Panen Terakhir (Validasi Lapangan):
            </h4>
            <div className="border border-stone-200 rounded-xl overflow-hidden bg-white text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Musim & Tahun</th>
                    <th className="p-2.5">Hasil (Ton)</th>
                    <th className="p-2.5 text-right">Pendapatan Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {farmer.riwayat_panen.map((h, i) => (
                    <tr key={i} className="hover:bg-stone-50">
                      <td className="p-2.5 font-medium">{h.musim} ({h.tahun})</td>
                      <td className="p-2.5">{h.volume_ton} Ton</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-emerald-800">
                        Rp {h.pendapatan_rp?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actionable Recommendations */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2 mt-4">
          <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            Rekomendasi Tindak Lanjut Mantri/Analis Bank:
          </div>
          <ul className="space-y-1">
            {cs.rekomendasi_tindak_lanjut?.map((rec, i) => (
              <li key={i} className="text-xs text-amber-900 flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 border-stone-300"
          >
            Tutup
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};