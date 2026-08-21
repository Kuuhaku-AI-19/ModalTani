import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PretestModal } from './components/PretestModal';
import { ModulePlayerModal } from './components/ModulePlayerModal';
import { FarmerDetailDrawer } from './components/FarmerDetailDrawer';
import { AddFarmerModal } from './components/AddFarmerModal';
import { LandingView } from './views/LandingView';
import { LearningModulesView } from './views/LearningModulesView';
import { ChatAdvisoryView } from './views/ChatAdvisoryView';
import { CRMDashboardView } from './views/CRMDashboardView';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  // Core demo state
  const [activeTab, setActiveTab] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  // Petani-side data
  const [modules, setModules] = useState([]);
  const [pretestQuestions, setPretestQuestions] = useState([]);
  const [userProgress, setUserProgress] = useState({ records: [], completed_count: 0 });
  const [farmerProfile, setFarmerProfile] = useState(null);

  // Modals
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isPretestOpen, setPretestOpen] = useState(false);
  const [isPlayerOpen, setPlayerOpen] = useState(false);
  const [activeModule, setActiveModule] = useState(null);

  // CRM-side
  const [farmers, setFarmers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAddFarmerOpen, setAddFarmerOpen] = useState(false);

  // ==== FETCHERS ====
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setAllUsers(res.data || []);
      // Auto-set default user if none picked yet
      if (!currentUser && res.data?.length > 0) {
        const defaultUser = res.data.find(u => u.id === 'user-budi') || res.data[0];
        setCurrentUser(defaultUser);
      }
    } catch (e) { console.error(e); }
  }, [currentUser]);

  const fetchModules = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/modules`);
      setModules(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchPretest = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/pretest`);
      setPretestQuestions(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchProgress = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API}/learning-progress/${userId}`);
      setUserProgress(res.data || { records: [], completed_count: 0 });
    } catch (e) { console.error(e); }
  }, []);

  const fetchFarmerProfile = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API}/crm/farmers/${userId}`);
      if (!res.data.error) setFarmerProfile(res.data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchCrmFarmers = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/crm/farmers`);
      setFarmers(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/crm/analytics`);
      setAnalytics(res.data);
    } catch (e) { console.error(e); }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchModules();
    fetchPretest();
  }, []); // eslint-disable-line

  // On user change, refetch farmer-scoped data
  useEffect(() => {
    if (currentUser?.role === 'petani') {
      fetchProgress(currentUser.id);
      fetchFarmerProfile(currentUser.id);
    }
    if (currentUser?.role === 'admin_bank') {
      fetchCrmFarmers();
      fetchAnalytics();
    }
  }, [currentUser, fetchProgress, fetchFarmerProfile, fetchCrmFarmers, fetchAnalytics]);

  // ==== HANDLERS ====
  const handleSelectUser = (user) => {
    setCurrentUser(user);
    toast.success(`Berpindah profil: ${user.nama}`, {
      description: user.role === 'admin_bank' ? 'Peran: Analis Bank Mitra' : `Peran: Petani • ${user.komoditas}`,
    });
    // Auto-route to sensible default
    if (user.role === 'admin_bank') {
      setActiveTab('crm');
    } else {
      setActiveTab('modules');
    }
  };

  const handleLandingRoleSelect = (role) => {
    // Find first user of role, open auth modal for selection
    const user = allUsers.find(u => u.role === role);
    if (user) {
      handleSelectUser(user);
    } else {
      setAuthOpen(true);
    }
  };

  const handlePretestSubmit = async (answers) => {
    if (!currentUser) return;
    try {
      const res = await axios.post(`${API}/pretest/submit`, {
        user_id: currentUser.id,
        answers,
      });
      toast.success(`Asesmen selesai! Skor Anda ${res.data.score}%`, {
        description: `Rekomendasi level: ${res.data.recommended_level}`,
      });
      fetchFarmerProfile(currentUser.id);
      return res.data;
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengirim asesmen');
    }
  };

  const handleModuleQuizSubmit = async (userId, moduleId, score, answers) => {
    if (!userId) return;
    try {
      await axios.post(`${API}/learning-progress/update`, {
        user_id: userId,
        module_id: moduleId,
        status: 'completed',
        quiz_score: score,
        answers: answers || {},
      });
      toast.success(`Modul selesai! Skor kuis: ${score}%`, {
        description: 'Credit score Anda otomatis ikut naik di sisi bank mitra.',
      });
      fetchProgress(userId);
    } catch (e) {
      console.error(e);
      toast.error('Gagal menyimpan progres modul');
    }
  };

  const handleUpdateDocuments = async (userId, docs) => {
    try {
      await axios.put(`${API}/crm/farmers/${userId}/documents`, docs);
      toast.success('Verifikasi berkas diperbarui', {
        description: 'Credit score sedang dihitung ulang otomatis.',
      });
      await fetchCrmFarmers();
      await fetchAnalytics();
      // Refresh selected farmer detail
      const updatedList = await axios.get(`${API}/crm/farmers/${userId}`);
      if (!updatedList.data.error) setSelectedFarmer(updatedList.data);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memperbarui berkas');
    }
  };

  const handleAddFarmer = async (farmerData) => {
    try {
      await axios.post(`${API}/crm/farmers`, farmerData);
      toast.success(`Petani ${farmerData.nama} berhasil ditambahkan`, {
        description: 'Credit score deterministik langsung dihitung.',
      });
      await fetchCrmFarmers();
      await fetchAnalytics();
      await fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error('Gagal menambah petani');
    }
  };

  const handleResetDemo = async () => {
    try {
      await axios.post(`${API}/seed`);
      toast.success('Data demo di-reset ke kondisi awal');
      await fetchUsers();
      await fetchCrmFarmers();
      await fetchAnalytics();
      if (currentUser) {
        fetchProgress(currentUser.id);
        fetchFarmerProfile(currentUser.id);
      }
    } catch (e) {
      toast.error('Gagal reset data demo');
    }
  };

  const openFarmerDetail = async (farmer) => {
    // Fetch fresh detail so it always reflects latest doc checklist edits
    try {
      const res = await axios.get(`${API}/crm/farmers/${farmer.user_id}`);
      setSelectedFarmer(res.data || farmer);
    } catch {
      setSelectedFarmer(farmer);
    }
    setDrawerOpen(true);
  };

  // ==== RENDER ====
  const renderActiveView = () => {
    const isBank = currentUser?.role === 'admin_bank';

    // Guard: admin views only for admin_bank
    if ((activeTab === 'crm' || activeTab === 'kb') && !isBank) {
      return (
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-2xl font-heading font-bold text-stone-900">
            Halaman Ini Khusus Analis Bank Mitra
          </h2>
          <p className="text-sm text-stone-500 mt-2">
            Silakan pilih profil "Analis Bank Mitra" di pojok kanan atas untuk mengakses Dashboard CRM & Knowledge Base.
          </p>
        </div>
      );
    }

    if ((activeTab === 'modules' || activeTab === 'chat') && isBank) {
      return (
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-2xl font-heading font-bold text-stone-900">
            Halaman Ini Untuk Petani Desa
          </h2>
          <p className="text-sm text-stone-500 mt-2">
            Silakan berpindah ke profil Petani untuk membuka Modul Belajar atau Chat Asisten KUR.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'landing':
        return (
          <LandingView
            currentUser={currentUser}
            onSelectRole={handleLandingRoleSelect}
            onGoToModules={() => { if (isBank) toast.error('Alihkan profil ke Petani terlebih dahulu'); else setActiveTab('modules'); }}
            onGoToChat={() => { if (isBank) toast.error('Alihkan profil ke Petani terlebih dahulu'); else setActiveTab('chat'); }}
            onGoToCrm={() => { if (!isBank) toast.error('Alihkan profil ke Analis Bank terlebih dahulu'); else setActiveTab('crm'); }}
          />
        );
      case 'modules':
        return (
          <LearningModulesView
            modules={modules}
            userProgress={userProgress}
            userProfile={farmerProfile}
            onOpenPretest={() => setPretestOpen(true)}
            onOpenModulePlayer={(mod) => { setActiveModule(mod); setPlayerOpen(true); }}
          />
        );
      case 'chat':
        return (
          <ChatAdvisoryView
            currentUser={currentUser}
            api={API}
          />
        );
      case 'crm':
      case 'kb':
        return (
          <CRMDashboardView
            farmers={farmers}
            analytics={analytics}
            api={API}
            initialTab={activeTab === 'kb' ? 'knowledge_base' : 'dashboard'}
            onOpenFarmerDetail={openFarmerDetail}
            onOpenAddFarmer={() => setAddFarmerOpen(true)}
            onRefresh={() => { fetchCrmFarmers(); fetchAnalytics(); }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 font-sans antialiased">
      <Toaster position="top-right" richColors closeButton />
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onOpenAuth={() => setAuthOpen(true)}
        onResetData={handleResetDemo}
      />

      <main className="min-h-[calc(100vh-5rem)]">
        {renderActiveView()}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        allUsers={allUsers}
        onLoginSuccess={(u) => handleSelectUser(u)}
      />
      <PretestModal
        isOpen={isPretestOpen}
        onClose={() => setPretestOpen(false)}
        questions={pretestQuestions}
        onSubmit={handlePretestSubmit}
      />
      <ModulePlayerModal
        isOpen={isPlayerOpen}
        onClose={() => setPlayerOpen(false)}
        module={activeModule}
        userId={currentUser?.id}
        onCompleteQuiz={handleModuleQuizSubmit}
      />
      <FarmerDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        farmer={selectedFarmer}
        onUpdateDocuments={handleUpdateDocuments}
      />
      <AddFarmerModal
        isOpen={isAddFarmerOpen}
        onClose={() => setAddFarmerOpen(false)}
        onAddFarmer={handleAddFarmer}
      />

      <footer className="border-t border-stone-200/80 bg-stone-50 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} ModalTani • Prototipe Smart Village Hackathon • Data mengacu pada Permenko Perekonomian & OJK
        </div>
      </footer>
    </div>
  );
}

export default App;
