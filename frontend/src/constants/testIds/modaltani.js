export const NAVBAR = {
  brandLogo: 'navbar-brand-logo',
  navHome: 'nav-home-link',
  navModules: 'nav-modules-link',
  navChat: 'nav-chat-link',
  navCrm: 'nav-crm-link',
  navKb: 'nav-kb-link',
  roleSelector: 'nav-role-selector-button',
  loginButton: 'nav-login-button',
  resetDemoButton: 'nav-reset-demo-button',
};

export const LANDING = {
  heroTitle: 'landing-hero-title',
  ctaFarmer: 'landing-cta-farmer-btn',
  ctaBank: 'landing-cta-bank-btn',
  featureModulesCard: 'landing-feature-modules-card',
  featureChatCard: 'landing-feature-chat-card',
  featureCrmCard: 'landing-feature-crm-card',
  rolePetaniTabBtn: 'landing-role-petani-tab',
  roleBankTabBtn: 'landing-role-bank-tab',
};

export const MODULES = {
  pretestBanner: 'modules-pretest-banner',
  pretestStartBtn: 'modules-pretest-start-btn',
  categoryTab: (cat) => `modules-category-tab-${cat}`,
  moduleCard: (id) => `module-card-${id}`,
  moduleStartBtn: (id) => `module-start-btn-${id}`,
  quizOption: (id) => `quiz-option-${id}`,
  quizSubmitBtn: 'quiz-submit-btn',
  progressScoreBadge: 'modules-progress-score-badge',
};

export const CHAT = {
  inputMessage: 'chat-input-message',
  sendBtn: 'chat-send-btn',
  micBtn: 'chat-mic-btn',
  quickPromptBtn: (index) => `chat-quick-prompt-${index}`,
  messageBubble: 'chat-message-bubble',
  officialSourceBadge: 'chat-official-source-badge',
  clearChatBtn: 'chat-clear-history-btn',
};

export const CRM = {
  searchInput: 'crm-search-input',
  filterKomoditas: 'crm-filter-komoditas',
  filterScore: 'crm-filter-score',
  farmerRow: (id) => `crm-farmer-row-${id}`,
  farmerDetailBtn: (id) => `crm-farmer-detail-btn-${id}`,
  addFarmerBtn: 'crm-add-farmer-btn',
  verifyDocCheckbox: (docKey) => `crm-verify-doc-${docKey}`,
  saveDocVerificationBtn: 'crm-save-doc-verification-btn',
  recalculateScoreBadge: 'crm-recalculate-score-badge',
  chartContainer: 'crm-distribution-chart',
  tabDashboard: 'crm-tab-dashboard',
  tabKnowledgeBase: 'crm-tab-knowledge-base',
};

export const ADD_FARMER = {
  nama: 'add-farmer-nama',
  noHp: 'add-farmer-no-hp',
  luasLahan: 'add-farmer-luas-lahan',
  submitBtn: 'add-farmer-submit-btn',
};

export const KB = {
  tableRow: (id) => `kb-doc-row-${id}`,
  addDocBtn: 'kb-add-doc-btn',
  formTopik: 'kb-form-topik',
  formJudul: 'kb-form-judul',
  formKategori: 'kb-form-kategori',
  formIsiTeks: 'kb-form-isi-teks',
  formSumberNama: 'kb-form-sumber-nama',
  formSumberLink: 'kb-form-sumber-link',
  formSubmitBtn: 'kb-form-submit-btn',
  deleteBtn: (id) => `kb-doc-delete-${id}`,
};
