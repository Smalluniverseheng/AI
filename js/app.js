// ==================== APP ====================
(function() {
  // 1. Load state
  loadState();
  loadState(); // ensure chat arrays initialized

  // 2. Ensure default user 1234/1234
  AUTH.ensureDefaultUser();

  // 3. Theme
  initTheme();

  // 4. DOM events
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-login check
    if (state.loggedIn && state.user) { autoLogin(); } else { showLogin(); }

    // Init UI
    renderSidebarList();
    renderChatUI();
    updateModelSelector();
    updateModeSelector();
    setInputAreaMode();

    // Input area
    const input = document.getElementById('msgInput');
    if (input) {
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });
      input.addEventListener('input', () => autoResize(input));
    }

    // File input
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);

    // Attach button
    const attachBtn = document.getElementById('attachBtn');
    if (attachBtn) attachBtn.addEventListener('click', handleAttach);

    // Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', handleSend);

    // Model dropdown
    const modelBtn = document.getElementById('modelSelectorBtn');
    const modelDd = document.getElementById('modelDropdown');
    if (modelBtn && modelDd) {
      modelBtn.addEventListener('click', (e) => { e.stopPropagation(); modelDd.classList.toggle('show'); modelBtn.classList.toggle('open'); });
    }

    // Mode dropdown
    const modeBtn = document.getElementById('modeSelectorBtn');
    const modeDd = document.getElementById('modeDropdown');
    if (modeBtn && modeDd) {
      modeBtn.addEventListener('click', (e) => { e.stopPropagation(); modeDd.classList.toggle('show'); modeBtn.classList.toggle('open'); });
    }

    // Settings
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    const closeSettingsBtn = document.getElementById('closeSettings');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettings);
    const saveKeysBtn = document.getElementById('saveKeysBtn');
    if (saveKeysBtn) saveKeysBtn.addEventListener('click', saveKeys);
    const exportKeysBtn = document.getElementById('exportKeysBtn');
    if (exportKeysBtn) exportKeysBtn.addEventListener('click', exportKeys);
    const importKeysBtn = document.getElementById('importKeysBtn');
    if (importKeysBtn) importKeysBtn.addEventListener('click', importKeys);
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) importDataBtn.addEventListener('click', importData);
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) clearDataBtn.addEventListener('click', clearAll);

    // Theme cards
    document.querySelectorAll('.theme-card').forEach(c => {
      c.addEventListener('click', () => setTheme(c.getAttribute('data-theme')));
    });

    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(t => {
      t.addEventListener('click', () => switchSettingsTab(t.getAttribute('data-tab')));
    });

    // Login tabs
    document.querySelectorAll('.login-tab').forEach(t => {
      t.addEventListener('click', () => switchLoginTab(t.getAttribute('data-login-tab')));
    });

    // Login form
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    const loginPhone = document.getElementById('loginPhone');
    const loginPassword = document.getElementById('loginPassword');
    if (loginPhone && loginPassword) {
      loginPhone.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
      loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    }

    // Register form
    const regBtn = document.getElementById('regBtn');
    if (regBtn) regBtn.addEventListener('click', handleRegister);
    const regPhone = document.getElementById('regPhone');
    if (regPhone) regPhone.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });
    const regPassword = document.getElementById('regPassword');
    if (regPassword) regPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

    // Reg tags
    document.querySelectorAll('.reg-tag').forEach(t => {
      t.addEventListener('click', () => toggleRegTag(t));
    });

    // Avatar modal
    const closeAvatarBtn = document.getElementById('closeAvatarModal');
    if (closeAvatarBtn) closeAvatarBtn.addEventListener('click', closeAvatarModal);
    const avatarFile = document.getElementById('avatarFileInput');
    if (avatarFile) avatarFile.addEventListener('change', handleAvatarFile);

    // Mobile nav
    const navChat = document.getElementById('navChatBtn');
    if (navChat) navChat.addEventListener('click', () => navigateTo('chat'));
    const navModels = document.getElementById('navModelsBtn');
    if (navModels) navModels.addEventListener('click', () => navigateTo('models'));
    const navDiscover = document.getElementById('navDiscoverBtn');
    if (navDiscover) navDiscover.addEventListener('click', () => navigateTo('discover'));
    const navProfile = document.getElementById('navProfileBtn');
    if (navProfile) navProfile.addEventListener('click', () => navigateTo('profile'));

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebarDesktop);
    const hamburger = document.getElementById('hamburgerBtn');
    if (hamburger) hamburger.addEventListener('click', toggleSidebar);
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) newChatBtn.addEventListener('click', newChat);
    const sidebarNew = document.getElementById('sidebarNewBtn');
    if (sidebarNew) sidebarNew.addEventListener('click', newChat);

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', AUTH.logout);

    // Global keys
    initGlobalKeys();

    // Set chat page active
    document.querySelector('.page[data-page="chat"]')?.classList.add('active');
    document.getElementById('navChatBtn')?.classList.add('active');

    // Initial sidebar state
    if (window.innerWidth > 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) { sidebar.classList.remove('collapsed'); }
    }
  });
})();
