import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CRM, KB } from '@/constants/testIds';
import { toast } from 'sonner';
import {
  Users,
  TrendingUp,
  Landmark,
  Search,
  Plus,
  Filter,
  Database,
  LayoutDashboard,
  Trash2,
  FileText,
  ExternalLink,
  Loader2,
  BookOpen,
  MapPin,
  Upload,
  FileUp,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

// ==========================================
// Knowledge Base Manager Sub-Component
// ==========================================
const KnowledgeBaseManager = ({ api }) => {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [ragStatus, setRagStatus] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]); // {id, file, status, progress, result, error}
  const [isBulkRunning, setBulkRunning] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({
    kategori: 'Regulasi Umum',
    sumber_nama: '',
    sumber_link: '',
    pasal_rujukan: '',
  });
  const [form, setForm] = useState({
    topik: '',
    judul: '',
    kategori: 'Regulasi Umum',
    isi_teks: '',
    sumber_nama: '',
    sumber_link: '',
    pasal_rujukan: '',
  });

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${api}/kur-docs`);
      setDocs(res.data || []);
    } catch (e) {
      toast.error('Gagal memuat knowledge base');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const fetchRagStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${api}/rag/status`);
      setRagStatus(res.data);
    } catch { /* ignore */ }
  }, [api]);

  useEffect(() => { fetchDocs(); fetchRagStatus(); }, [fetchDocs, fetchRagStatus]);

  const resetForm = () => setForm({
    topik: '', judul: '', kategori: 'Regulasi Umum',
    isi_teks: '', sumber_nama: '', sumber_link: '', pasal_rujukan: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topik || !form.judul || !form.isi_teks || !form.sumber_nama) {
      toast.error('Lengkapi field wajib: topik, judul, isi, sumber');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${api}/kur-docs`, form);
      toast.success('Dokumen berhasil ditambahkan ke knowledge base', {
        description: 'RAG chatbot akan otomatis merujuk dokumen ini.',
      });
      setFormOpen(false);
      resetForm();
      fetchDocs();
    } catch (err) {
      toast.error('Gagal menyimpan dokumen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus dokumen ini dari knowledge base?')) return;
    try {
      await axios.delete(`${api}/kur-docs/${id}`);
      toast.success('Dokumen dihapus');
      fetchDocs();
    } catch {
      toast.error('Gagal menghapus dokumen');
    }
  };

  const handleFilesSelected = (fileList) => {
    const arr = Array.from(fileList || []);
    const valid = arr.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'docx'].includes(ext);
    });
    const rejected = arr.length - valid.length;
    if (rejected > 0) {
      toast.error(`${rejected} file dilewati (bukan PDF/DOCX)`);
    }
    const queued = valid.map(f => ({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
      file: f,
      status: 'queued',   // queued | uploading | success | failed
      progress: 0,
      result: null,
      error: null,
    }));
    setUploadQueue(prev => [...prev, ...queued]);
  };

  const removeFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(x => x.id !== id));
  };

  const updateQueueItem = (id, patch) => {
    setUploadQueue(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  };

  const uploadOneFile = async (item) => {
    updateQueueItem(item.id, { status: 'uploading', progress: 0, error: null });
    try {
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('kategori', uploadMeta.kategori);
      fd.append('sumber_nama', uploadMeta.sumber_nama || item.file.name);
      fd.append('sumber_link', uploadMeta.sumber_link || '#');
      fd.append('pasal_rujukan', uploadMeta.pasal_rujukan || '');
      fd.append('target_chunk_size', '800');

      const res = await axios.post(`${api}/kur-docs/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) {
            const pct = Math.min(95, Math.round((evt.loaded / evt.total) * 90));
            updateQueueItem(item.id, { progress: pct });
          }
        },
      });
      updateQueueItem(item.id, { status: 'success', progress: 100, result: res.data });
      return true;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload gagal';
      updateQueueItem(item.id, { status: 'failed', error: msg });
      return false;
    }
  };

  const startBulkUpload = async () => {
    const pending = uploadQueue.filter(x => x.status === 'queued' || x.status === 'failed');
    if (pending.length === 0) {
      toast.info('Tidak ada file di antrian');
      return;
    }
    setBulkRunning(true);
    let ok = 0, fail = 0;
    for (const item of pending) {
      const currentSnapshot = uploadQueue.find(x => x.id === item.id) || item;
      const success = await uploadOneFile(currentSnapshot);
      if (success) ok++; else fail++;
    }
    setBulkRunning(false);
    toast.success(`Bulk ingest selesai: ${ok} sukses, ${fail} gagal`, {
      description: 'Knowledge base RAG sudah diperbarui.',
    });
    fetchDocs();
    fetchRagStatus();
  };

  const retryOne = async (id) => {
    const item = uploadQueue.find(x => x.id === id);
    if (!item) return;
    await uploadOneFile(item);
    fetchDocs();
    fetchRagStatus();
  };

  const clearFinished = () => {
    setUploadQueue(prev => prev.filter(x => x.status !== 'success'));
  };

  const resetUploadForm = () => {
    setUploadQueue([]);
    setUploadMeta({ kategori: 'Regulasi Umum', sumber_nama: '', sumber_link: '', pasal_rujukan: '' });
  };

  const kategoriOptions = [
    'Regulasi Umum',
    'Suku Bunga & Angsuran',
    'Plafon Pinjaman',
    'Agunan',
    'Dokumen',
    'Legalitas Lahan',
    'Alur Pengajuan',
    'Tips Debitur',
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full mb-1.5">
            <Database className="w-3.5 h-3.5" />
            RAG Vector Knowledge Base
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-stone-900">
            Manajemen Sumber Dokumen KUR Resmi
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Setiap dokumen di sini akan dipakai oleh asisten AI (RAG pipeline) untuk menjawab pertanyaan petani. Rekomendasi: tambahkan sumber resmi OJK, Kementan, Bank Himbara.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            data-testid={KB.addDocBtn}
            onClick={() => setFormOpen(true)}
            variant="outline"
            className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 h-10 px-4 text-xs font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Manual
          </Button>
          <Button
            data-testid={KB.uploadFileBtn}
            onClick={() => setUploadOpen(true)}
            className="bg-emerald-800 hover:bg-emerald-900 text-white h-10 px-4 text-xs font-semibold shadow-sm"
          >
            <FileUp className="w-4 h-4 mr-1.5" />
            Upload PDF / DOCX
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-[11px] uppercase font-semibold text-stone-500">Total Dokumen</div>
          <div className="text-2xl font-heading font-bold text-emerald-900 mt-1">{docs.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-[11px] uppercase font-semibold text-stone-500">Kategori Aktif</div>
          <div className="text-2xl font-heading font-bold text-amber-800 mt-1">
            {new Set(docs.map(d => d.kategori)).size}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-[11px] uppercase font-semibold text-stone-500">Sumber Unik</div>
          <div className="text-2xl font-heading font-bold text-blue-800 mt-1">
            {new Set(docs.map(d => d.sumber_nama)).size}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-stone-200">
          <div className="text-[11px] uppercase font-semibold text-stone-500">Qdrant Vectors</div>
          <div className="text-2xl font-heading font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
            {ragStatus?.available && ragStatus?.ready ? (
              <>
                {ragStatus?.points_in_qdrant ?? 0}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </>
            ) : (
              <span className="text-sm text-amber-700">Init...</span>
            )}
          </div>
          <div className="text-[10px] text-stone-500 mt-0.5 truncate" title={ragStatus?.embed_model}>
            {ragStatus?.embed_model?.split('/').pop() || 'no model'}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-heading font-bold text-stone-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            Daftar Dokumen di Vektor Store
          </h3>
          <span className="text-[11px] text-stone-500">{docs.length} entri</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-500">
            Belum ada dokumen. Klik "Tambah Dokumen Knowledge Base" untuk memulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3">Topik & Judul</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Sumber Resmi</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {docs.map((d) => (
                  <tr
                    key={d.id}
                    data-testid={KB.tableRow(d.id)}
                    className="hover:bg-stone-50/70"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        {d.judul}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {d.topik}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100">
                        {d.kategori}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-stone-800 text-[11px] leading-snug">
                        {d.sumber_nama}
                      </div>
                      {d.sumber_link && d.sumber_link !== '#' && (
                        <a
                          href={d.sumber_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-700 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                        >
                          Buka <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={KB.deleteBtn(d.id)}
                        onClick={() => handleDelete(d.id)}
                        className="h-7 text-[11px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-heading font-bold text-stone-900">
              Tambah Dokumen Knowledge Base
            </DialogTitle>
            <p className="text-xs text-stone-500">
              Data akan otomatis diindeks dan tersedia untuk AI RAG chatbot petani.
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-3">
            <div>
              <Label className="text-xs text-stone-700">Topik Ringkas <span className="text-red-600">*</span></Label>
              <Input
                data-testid={KB.formTopik}
                value={form.topik}
                onChange={(e) => setForm({ ...form, topik: e.target.value })}
                placeholder="Mis. Syarat KUR untuk Petani Muda"
                className="mt-1 text-xs h-9"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-stone-700">Judul Dokumen <span className="text-red-600">*</span></Label>
              <Input
                data-testid={KB.formJudul}
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Judul dokumen resmi"
                className="mt-1 text-xs h-9"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-stone-700">Kategori</Label>
                <Select
                  value={form.kategori}
                  onValueChange={(v) => setForm({ ...form, kategori: v })}
                >
                  <SelectTrigger data-testid={KB.formKategori} className="mt-1 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriOptions.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-stone-700">Pasal / Rujukan</Label>
                <Input
                  value={form.pasal_rujukan}
                  onChange={(e) => setForm({ ...form, pasal_rujukan: e.target.value })}
                  placeholder="Pasal 3 ayat (2)"
                  className="mt-1 text-xs h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-stone-700">Isi Ketentuan Dokumen <span className="text-red-600">*</span></Label>
              <textarea
                data-testid={KB.formIsiTeks}
                value={form.isi_teks}
                onChange={(e) => setForm({ ...form, isi_teks: e.target.value })}
                placeholder="Salin isi dokumen atau ringkasan syarat, prosedur, dsb..."
                rows={5}
                className="mt-1 w-full text-xs p-2.5 rounded-md border border-stone-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-y"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-stone-700">Nama Sumber <span className="text-red-600">*</span></Label>
                <Input
                  data-testid={KB.formSumberNama}
                  value={form.sumber_nama}
                  onChange={(e) => setForm({ ...form, sumber_nama: e.target.value })}
                  placeholder="Mis. OJK / Permenko No.1/2023"
                  className="mt-1 text-xs h-9"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-stone-700">Link Dokumen</Label>
                <Input
                  data-testid={KB.formSumberLink}
                  value={form.sumber_link}
                  onChange={(e) => setForm({ ...form, sumber_link: e.target.value })}
                  placeholder="https://ojk.go.id/..."
                  className="mt-1 text-xs h-9"
                />
              </div>
            </div>
            <Button
              type="submit"
              data-testid={KB.formSubmitBtn}
              disabled={isSaving}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-10 font-semibold shadow-sm mt-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan ke Knowledge Base RAG'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload PDF/DOCX Modal */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => { setUploadOpen(open); if (!open) resetUploadForm(); }}>
        <DialogContent className="max-w-2xl bg-white p-6 rounded-2xl border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full w-fit">
              <Upload className="w-3.5 h-3.5" />
              Bulk Ingest PDF / DOCX → Qdrant + SemanticChunker
            </div>
            <DialogTitle className="text-lg font-heading font-bold text-stone-900">
              Unggah Banyak Dokumen ke Knowledge Base
            </DialogTitle>
            <p className="text-xs text-stone-500">
              Pilih beberapa file sekaligus. Backend akan mengekstrak teks, memecah dengan <strong>SemanticChunker</strong> (langchain), meng-embed dengan <strong>FastEmbed multilingual</strong>, dan menyimpan vektor di <strong>Qdrant</strong> self-hosted.
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {/* Metadata for ALL files in this batch */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Metadata untuk seluruh batch (opsional)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-stone-700">Kategori</Label>
                  <Select
                    value={uploadMeta.kategori}
                    onValueChange={(v) => setUploadMeta({ ...uploadMeta, kategori: v })}
                  >
                    <SelectTrigger data-testid={KB.uploadKategori} className="mt-1 text-xs h-9 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {kategoriOptions.map((k) => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-stone-700">Pasal / Bab</Label>
                  <Input
                    value={uploadMeta.pasal_rujukan}
                    onChange={(e) => setUploadMeta({ ...uploadMeta, pasal_rujukan: e.target.value })}
                    placeholder="Kosongkan → auto per halaman"
                    className="mt-1 text-xs h-9 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-700">Nama Sumber</Label>
                  <Input
                    data-testid={KB.uploadSumberNama}
                    value={uploadMeta.sumber_nama}
                    onChange={(e) => setUploadMeta({ ...uploadMeta, sumber_nama: e.target.value })}
                    placeholder="Kosong → pakai nama file"
                    className="mt-1 text-xs h-9 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-700">Link Sumber</Label>
                  <Input
                    data-testid={KB.uploadSumberLink}
                    value={uploadMeta.sumber_link}
                    onChange={(e) => setUploadMeta({ ...uploadMeta, sumber_link: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 text-xs h-9 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Multi-file Dropzone */}
            <label
              htmlFor="kb-file-input"
              className="block flex flex-col items-center justify-center gap-1.5 p-6 rounded-xl border-2 border-dashed border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/30 cursor-pointer transition-all"
            >
              <FileUp className="w-7 h-7 text-emerald-700" />
              <div className="text-xs font-semibold text-stone-800">
                Klik untuk pilih banyak file PDF / DOCX sekaligus
              </div>
              <div className="text-[11px] text-stone-500">
                Mendukung multi-select • Ukuran ideal per file: &lt; 10 MB
              </div>
            </label>
            <input
              id="kb-file-input"
              type="file"
              multiple
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              data-testid={KB.uploadFileInput}
              onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
              className="hidden"
            />

            {/* Queue List */}
            {uploadQueue.length > 0 && (
              <div className="rounded-xl border border-stone-200 overflow-hidden bg-white">
                <div className="px-3 py-2 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                  <div className="text-xs font-bold text-stone-800">
                    Antrian Ingest ({uploadQueue.length} file)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFinished}
                      disabled={isBulkRunning}
                      className="h-7 text-[11px] text-stone-500 hover:text-stone-800"
                    >
                      Bersihkan yang sukses
                    </Button>
                    <span className="text-[11px] text-emerald-800 font-semibold">
                      ✓ {uploadQueue.filter(x => x.status === 'success').length}
                    </span>
                    <span className="text-[11px] text-red-700 font-semibold">
                      ✗ {uploadQueue.filter(x => x.status === 'failed').length}
                    </span>
                  </div>
                </div>
                <ul className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                  {uploadQueue.map((item) => (
                    <li key={item.id} className="p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-semibold text-stone-900 truncate">
                              {item.file.name}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {(item.file.size / 1024).toFixed(1)} KB
                              {item.result && <> • {item.result.chunks_created} chunk • {item.result.vectors_indexed} vektor</>}
                              {item.error && <> • <span className="text-red-700">{item.error}</span></>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === 'queued' && (
                            <span className="text-[10px] font-bold text-stone-500 uppercase bg-stone-100 px-2 py-0.5 rounded">
                              Antri
                            </span>
                          )}
                          {item.status === 'uploading' && (
                            <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Upload
                            </span>
                          )}
                          {item.status === 'success' && (
                            <span className="text-[10px] font-bold text-emerald-800 uppercase bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Sukses
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <>
                              <span className="text-[10px] font-bold text-red-700 uppercase bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                                Gagal
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => retryOne(item.id)}
                                disabled={isBulkRunning}
                                className="h-6 text-[10px] px-2 border-stone-300 hover:bg-amber-50"
                              >
                                Retry
                              </Button>
                            </>
                          )}
                          {(item.status === 'queued' || item.status === 'failed') && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromQueue(item.id)}
                              disabled={isBulkRunning}
                              className="h-6 w-6 p-0 text-stone-400 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {(item.status === 'uploading' || (item.status === 'success' && item.progress > 0)) && (
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setUploadOpen(false); resetUploadForm(); }}
                disabled={isBulkRunning}
                className="flex-1 text-xs h-10 border-stone-300"
              >
                Tutup
              </Button>
              <Button
                type="button"
                data-testid={KB.uploadSubmitBtn}
                onClick={startBulkUpload}
                disabled={isBulkRunning || uploadQueue.filter(x => x.status === 'queued' || x.status === 'failed').length === 0}
                className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs h-10 font-semibold shadow-sm"
              >
                {isBulkRunning ? (
                  <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Sedang mengingest…</>
                ) : (
                  <><Upload className="w-4 h-4 mr-1.5" /> Mulai Ingest ({uploadQueue.filter(x => x.status === 'queued' || x.status === 'failed').length})</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// ==========================================
// Main CRM Dashboard View
// ==========================================
export const CRMDashboardView = ({
  farmers = [],
  analytics,
  api,
  initialTab = 'dashboard',
  onOpenFarmerDetail,
  onOpenAddFarmer,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [filterKomoditas, setFilterKomoditas] = useState('all');
  const [filterKategori, setFilterKategori] = useState('all');

  const filteredFarmers = farmers.filter(f => {
    if (search && !`${f.nama} ${f.desa} ${f.komoditas} ${f.no_hp}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterKomoditas !== 'all' && !f.komoditas?.toLowerCase().includes(filterKomoditas.toLowerCase())) return false;
    if (filterKategori !== 'all' && f.credit_score?.kategori !== filterKategori) return false;
    return true;
  });

  const komoditasOptions = Array.from(new Set(farmers.map(f => f.komoditas))).filter(Boolean);

  const chartData = analytics?.distribution_chart || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 text-left">
      <Tabs defaultValue={initialTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/70">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full mb-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Console Bank Mitra Penyalur KUR
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900">
              Dashboard CRM & Credit Scoring
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
              Pra-skrining calon debitur petani berbasis 4 pilar deterministik. Keputusan akhir tetap di tangan debitur/analis bank mitra.
            </p>
          </div>
          <TabsList className="bg-stone-100 border border-stone-200 p-1 h-auto">
            <TabsTrigger
              value="dashboard"
              data-testid={CRM.tabDashboard}
              className="text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-amber-800 data-[state=active]:shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
              Dashboard Petani
            </TabsTrigger>
            <TabsTrigger
              value="knowledge_base"
              data-testid={CRM.tabKnowledgeBase}
              className="text-xs px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm"
            >
              <Database className="w-3.5 h-3.5 mr-1.5" />
              Knowledge Base RAG
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Total Petani Terdaftar</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 mt-1">
                {analytics?.total_farmers ?? '—'}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">
                Total lahan: {analytics?.total_lahan_ha ?? 0} Ha
              </div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Rata-rata Skor</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 mt-1">
                {analytics?.average_credit_score ?? '—'}
                <span className="text-xs text-stone-400 font-normal ml-1">/ 100</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Skor komposit 4 pilar</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Layak Direkomendasikan</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-emerald-800 mt-1">
                {analytics?.category_counts?.['Layak Direkomendasikan'] ?? 0}
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Skor ≥ 70 poin</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Potensi Penyaluran</span>
                <Landmark className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-heading font-bold text-amber-800 mt-1 font-mono">
                Rp {((analytics?.total_potential_financing_rp || 0) / 1_000_000).toLocaleString('id-ID')} Jt
              </div>
              <div className="text-[11px] text-stone-500 mt-0.5">Estimasi plafon agregat</div>
            </div>
          </div>

          {/* Chart + Controls Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div
              data-testid={CRM.chartContainer}
              className="lg:col-span-2 p-5 rounded-2xl bg-white border border-stone-200 shadow-sm"
            >
              <h3 className="text-sm font-heading font-bold text-stone-900 mb-1">
                Distribusi Skor Kelayakan Debitur
              </h3>
              <p className="text-[11px] text-stone-500 mb-4">
                Sebaran petani berdasarkan kategori credit scoring deterministik.
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#57534E' }}
                      interval={0}
                      angle={0}
                      tickFormatter={(name) => name.split(' (')[0]}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#57534E' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, borderColor: '#E7E5E4', fontSize: 12 }}
                      cursor={{ fill: 'rgba(22, 101, 52, 0.06)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-950 text-white shadow-lg space-y-3">
              <h3 className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Insight Ringkas
              </h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Dari total <strong className="text-amber-300">{analytics?.total_farmers ?? 0}</strong> petani binaan,
                sekitar <strong className="text-emerald-200">
                  {analytics?.total_farmers ? Math.round(((analytics?.category_counts?.['Layak Direkomendasikan'] || 0) / analytics.total_farmers) * 100) : 0}%
                </strong> siap direkomendasikan langsung untuk pengajuan KUR.
              </p>
              <div className="pt-3 border-t border-emerald-700/40 space-y-1.5 text-[11px]">
                {chartData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name.split(' (')[0]}
                    </span>
                    <span className="font-bold text-white">{c.value} petani</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  data-testid={CRM.searchInput}
                  placeholder="Cari nama, desa, komoditas, no HP..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-xs bg-stone-50 focus-visible:ring-amber-700"
                />
              </div>
              <Select value={filterKomoditas} onValueChange={setFilterKomoditas}>
                <SelectTrigger data-testid={CRM.filterKomoditas} className="h-10 text-xs w-full md:w-56">
                  <SelectValue placeholder="Filter komoditas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Komoditas</SelectItem>
                  {komoditasOptions.map((k) => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterKategori} onValueChange={setFilterKategori}>
                <SelectTrigger data-testid={CRM.filterScore} className="h-10 text-xs w-full md:w-56">
                  <SelectValue placeholder="Filter kelayakan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori Skor</SelectItem>
                  <SelectItem value="Layak Direkomendasikan">Layak Direkomendasikan (≥70)</SelectItem>
                  <SelectItem value="Perlu Pendampingan Lanjutan">Perlu Pendampingan (40-69)</SelectItem>
                  <SelectItem value="Belum Layak — Edukasi Dulu">Belum Layak (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                data-testid={CRM.addFarmerBtn}
                onClick={onOpenAddFarmer}
                className="bg-amber-700 hover:bg-amber-800 text-white h-10 text-xs font-semibold shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Petani
              </Button>
            </div>
          </div>

          {/* Farmer Table */}
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-heading font-bold text-stone-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                Daftar Calon Debitur Petani ({filteredFarmers.length})
              </h3>
              <span
                data-testid={CRM.recalculateScoreBadge}
                className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Skor dihitung otomatis real-time
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3">Nama Petani & Domisili</th>
                    <th className="p-3">Komoditas</th>
                    <th className="p-3">Lahan</th>
                    <th className="p-3">Modul PLEK</th>
                    <th className="p-3">Skor & Kategori</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredFarmers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-sm text-stone-500">
                        Tidak ada petani yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredFarmers.map((f) => {
                      const cs = f.credit_score || {};
                      const badgeColor = cs.badge_color || 'green';
                      return (
                        <tr
                          key={f.user_id}
                          data-testid={CRM.farmerRow(f.user_id)}
                          className="hover:bg-amber-50/30 cursor-pointer"
                          onClick={() => onOpenFarmerDetail(f)}
                        >
                          <td className="p-3">
                            <div className="font-semibold text-stone-900">{f.nama}</div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              {f.desa}, {f.kabupaten}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-stone-800">{f.komoditas}</div>
                            <div className="text-[11px] text-stone-500 mt-0.5">
                              {f.lama_bertani_tahun} thn pengalaman
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-mono font-semibold text-stone-800">{f.luas_lahan_ha} Ha</div>
                            <div className="text-[11px] text-stone-500 mt-0.5">{f.status_lahan}</div>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                              {f.modul_selesai || 0}/{f.total_modul || 3} selesai
                            </span>
                          </td>
                          <td className="p-3">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              badgeColor === 'green' ? 'bg-emerald-100 text-emerald-800' :
                              badgeColor === 'amber' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              <span className="font-heading text-sm">{cs.total_score}</span>
                              <span>/ 100</span>
                            </div>
                            <div className={`text-[11px] mt-0.5 font-semibold ${
                              badgeColor === 'green' ? 'text-emerald-700' :
                              badgeColor === 'amber' ? 'text-amber-700' :
                              'text-red-700'
                            }`}>
                              {cs.kategori}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={CRM.farmerDetailBtn(f.user_id)}
                              onClick={(e) => { e.stopPropagation(); onOpenFarmerDetail(f); }}
                              className="text-[11px] h-7 px-2.5 border-stone-300 bg-white hover:bg-stone-100"
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="knowledge_base" className="mt-4">
          <KnowledgeBaseManager api={api} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
