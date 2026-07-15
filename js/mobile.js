// ==================== MOBILE ====================
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('show');
  overlay.classList.toggle('show');
}

function toggleSidebarDesktop() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  const toggle = document.getElementById('sidebarToggle');
  if (toggle) { toggle.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀'; }
}

function navigateTo(page) {
  // Close sidebar on mobile
  document.getElementById('sidebar')?.classList.remove('show');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
  // Update page active state
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));
  // Show target page
  const target = document.querySelector('.page[data-page="' + page + '"]');
  if (target) target.classList.add('active');
  // Update bottom nav
  const navMap = { chat: 'navChatBtn', models: 'navModelsBtn', discover: 'navDiscoverBtn', profile: 'navProfileBtn' };
  const navId = navMap[page];
  if (navId) {
    const navItem = document.getElementById(navId);
    if (navItem) navItem.classList.add('active');
  }
  // Update topbar title
  const titles = { chat: '对话', models: '模型', discover: '发现', profile: '我的' };
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = titles[page] || '对话';
  // Page-specific rendering
  if (page === 'models') renderModelsPage();
  if (page === 'discover') renderDiscoverPage();
  if (page === 'profile') renderProfilePage();
  window.scrollTo(0, 0);
}

function renderModelsPage() {
  const list = document.getElementById('modelsList');
  if (!list) return;
  list.innerHTML = '';
  const providers = getProviders();
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const models = getProviderModels(p);
    if (models.length === 0) continue;
    const group = document.createElement('div'); group.className = 'models-group';
    const color = PROVIDER_COLORS[p] || '#666';
    group.innerHTML = '<div class="models-group-title"><span class="group-icon" style="background:' + color + '">' + p.charAt(0) + '</span>' + p + '</div><div class="models-group-items"></div>';
    const items = group.querySelector('.models-group-items');
    for (let j = 0; j < models.length; j++) {
      const m = models[j];
      const card = document.createElement('div'); card.className = 'models-card';
      card.onclick = () => { selectModel(m.id); navigateTo('chat'); };
      let meta = [];
      if (m.vision) meta.push('👁 识图');
      if (m.thinking) meta.push('💡 思考');
      if (m.ctx) meta.push(m.ctx + 'K上下文');
      card.innerHTML = '<div class="models-card-name">' + m.name + '</div><div class="models-card-meta">' + meta.join(' · ') + '</div>';
      items.appendChild(card);
    }
    list.appendChild(group);
  }
}

function renderDiscoverPage() {
  const grid = document.getElementById('discoverGrid');
  if (!grid) return;
  const items = [
    { icon: '💬', title: '单模型对话', desc: '与单个AI模型进行深度对话', page: 'chat', mode: 'single' },
    { icon: '📋', title: '多模型对比', desc: '同时向多个模型提问，对比回答', page: 'chat', mode: 'multi' },
    { icon: '⚔️', title: '辩论模式', desc: '正反方AI模型进行辩论', page: 'chat', mode: 'debate' },
    { icon: '🤝', title: '协同合作', desc: '多个AI模型协作完成任务', page: 'chat', mode: 'collab' }
  ];
  grid.innerHTML = '';
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const card = document.createElement('div'); card.className = 'discover-card';
    card.onclick = () => { selectMode(item.mode); navigateTo('chat'); };
    card.innerHTML = '<div class="discover-card-icon">' + item.icon + '</div><div class="discover-card-title">' + item.title + '</div><div class="discover-card-desc">' + item.desc + '</div>';
    grid.appendChild(card);
  }
}

function renderProfilePage() {
  const info = document.getElementById('profileInfo');
  if (!info) return;
  const user = state.userInfo || { name: '未登录', phone: '' };
  const avatar = state.avatar || '👤';
  info.innerHTML = '<div class="profile-avatar" id="profileAvatar" onclick="openAvatarModal()">' + avatar + '</div><div class="profile-info"><h2>' + escapeHtml(user.name) + '</h2><p>' + (user.phone || '') + '</p></div>';
}

function openAvatarModal() {
  document.getElementById('avatarModal')?.classList.add('show');
  const avatars = ['🧑','👩','🧔','👱','👴','👵','🧒','👧','🧑‍💻','👩‍💻','🧑‍🎨','👩‍🎨','🧑‍🔬','👩‍🔬','🧑‍🏫','👩‍🏫','🧑‍🚀','👩‍🚀','🧑‍⚕️','👩‍⚕️','🧑‍🌾','👩‍🌾','🧑‍🍳','👩‍🍳','🧑‍🔧','👩‍🔧','🧑‍🚒','👩‍🚒','🧑‍✈️','👩‍✈️'];
  const grid = document.getElementById('presetAvatars');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < avatars.length; i++) {
    const div = document.createElement('div'); div.textContent = avatars[i];
    div.className = (state.avatar === avatars[i]) ? 'active' : '';
    div.onclick = () => selectAvatar(avatars[i]);
    grid.appendChild(div);
  }
  document.getElementById('avatarPreview')?.textContent = (state.avatar || '👤');
}

function selectAvatar(avatar) {
  state.avatar = avatar; saveState();
  document.querySelectorAll('.preset-avatars > div').forEach(d => d.classList.remove('active'));
  const els = document.querySelectorAll('.preset-avatars > div');
  for (let i = 0; i < els.length; i++) { if (els[i].textContent === avatar) els[i].classList.add('active'); }
  document.getElementById('avatarPreview')?.textContent = avatar;
  renderProfilePage();
}

function closeAvatarModal() { document.getElementById('avatarModal')?.classList.remove('show'); }

function handleAvatarFile(e) {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { state.avatar = reader.result; saveState(); renderProfilePage(); closeAvatarModal(); showToast('头像已更新', 'success'); };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// Close modals/dropdowns on escape
function initGlobalKeys() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('settingsModal')?.classList.remove('show');
      document.getElementById('avatarModal')?.classList.remove('show');
      document.getElementById('modelDropdown')?.classList.remove('show');
      document.getElementById('modeDropdown')?.classList.remove('show');
      document.getElementById('modelPicker')?.classList.remove('show');
      document.getElementById('sidebar')?.classList.remove('show');
      document.getElementById('sidebarOverlay')?.classList.remove('show');
    }
  });
  // Click outside to close dropdowns
  document.addEventListener('click', (e) => {
    const modelBtn = document.getElementById('modelSelectorBtn');
    const modelDd = document.getElementById('modelDropdown');
    if (modelBtn && modelDd && !modelBtn.contains(e.target) && !modelDd.contains(e.target)) {
      modelDd.classList.remove('show'); modelBtn.classList.remove('open');
    }
    const modeBtn = document.getElementById('modeSelectorBtn');
    const modeDd = document.getElementById('modeDropdown');
    if (modeBtn && modeDd && !modeBtn.contains(e.target) && !modeDd.contains(e.target)) {
      modeDd.classList.remove('show'); modeBtn.classList.remove('open');
    }
  });
}

function filterModels() {
  const q = document.getElementById('modelSearch')?.value?.toLowerCase() || '';
  const items = document.querySelectorAll('.models-card');
  items.forEach(card => {
    const name = card.querySelector('.models-card-name')?.textContent?.toLowerCase() || '';
    card.style.display = name.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.models-group').forEach(g => {
    const visible = g.querySelectorAll('.models-card:not([style*="display: none"])').length;
    g.style.display = visible > 0 ? '' : 'none';
  });
}
