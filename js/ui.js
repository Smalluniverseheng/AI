// ==================== UI RENDER ====================

let currentMode = 'single';
let stopRequested = false;
let imageData = null;
let isSending = false;

function renderSidebarList() {
  const list = document.getElementById('sidebarList');
  if (!list) return;
  list.innerHTML = '';
  const today = [], recent = [], older = [];
  const now = new Date();
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  for (let i = 0; i < state.chats.length; i++) {
    const c = state.chats[i];
    const m = getModel(c.modelId) || getModel(DEFAULT_MODEL_ID);
    const el = document.createElement('div');
    el.className = 'sidebar-item' + (c.id === state.currentChatId ? ' active' : '');
    el.onclick = () => loadChat(c.id);
    const iconColor = PROVIDER_COLORS[m.provider] || '#666';
    el.innerHTML = '<div class="item-icon" style="background:' + iconColor + ';color:#fff;font-size:10px;font-weight:700">' + m.provider.charAt(0) + '</div>' +
      '<div class="item-info"><div class="item-title">' + escapeHtml(c.title || '新对话') + '</div>' +
      '<div class="item-meta">' + formatDate(c.updatedAt || c.createdAt) + '</div></div>' +
      '<div class="item-actions"><button onclick="event.stopPropagation();deleteChat(\'' + c.id + '\')">×</button></div>';
    const d = new Date(c.updatedAt || c.createdAt);
    if (d.toDateString() === now.toDateString()) today.push(el);
    else if (d.toDateString() === yest.toDateString()) recent.push(el);
    else older.push(el);
  }
  function addGroup(title, els) {
    if (els.length === 0) return;
    const t = document.createElement('div'); t.className = 'sidebar-section-title'; t.textContent = title; list.appendChild(t);
    for (let i = 0; i < els.length; i++) list.appendChild(els[i]);
  }
  addGroup('今天', today); addGroup('最近', recent); addGroup('更早', older);
  if (state.chats.length === 0) {
    list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-tertiary); font-size: 13px;">暂无对话<br>点击上方 + 开始新对话</div>';
  }
}

function renderChatUI() {
  const chat = getCurrentChat();
  const scroll = document.getElementById('chatScroll');
  if (!chat || !scroll) return;
  scroll.innerHTML = '';
  const msgs = chat.messages || [];
  if (msgs.length === 0) {
    scroll.innerHTML = '<div class="chat-welcome"><div class="chat-welcome-icon">🤖</div><h2>AI 聚合聊天平台</h2><p>支持150+全球模型，四种对话模式<br>选择模型，开始对话</p><div class="welcome-chips">' +
      '<div class="welcome-chip" onclick="quickStart(\'单模型\')">💬 单模型对话</div>' +
      '<div class="welcome-chip" onclick="quickStart(\'多模型\')">📋 多模型对比</div>' +
      '<div class="welcome-chip" onclick="quickStart(\'辩论\')">⚔️ 辩论模式</div>' +
      '<div class="welcome-chip" onclick="quickStart(\'协同\')">🤝 协同合作</div>' +
      '</div></div>';
    return;
  }
  const container = document.createElement('div'); container.className = 'chat-container';
  for (let i = 0; i < msgs.length; i++) { container.appendChild(createMessageEl(msgs[i])); }
  scroll.appendChild(container);
  scroll.scrollTop = scroll.scrollHeight;
}

function createMessageEl(msg) {
  const row = document.createElement('div');
  row.className = 'msg-row ' + msg.role + (msg.isNew ? ' msg-in' : '');
  msg.isNew = false;
  const m = getModel(msg.modelId || state.currentModelId) || getModel(DEFAULT_MODEL_ID);
  const color = PROVIDER_COLORS[m.provider] || '#666';
  row.innerHTML = '<div class="msg-avatar" style="background:' + color + '">' + m.provider.charAt(0) + '</div>' +
    '<div class="msg-content"><div class="msg-model-tag">' + (msg.role === 'user' ? '我' : (m.provider + ' · ' + m.name)) + '</div>' +
    '<div class="msg-bubble" id="msg-' + msg.id + '">' + (msg.thinking ? '<details class="think-block" open><summary>💡 思考过程</summary><div class="think-content">' + renderMarkdown(msg.thinking) + '</div></details>' : '') +
    '<div class="msg-body" id="msg-body-' + msg.id + '">' + renderMarkdown(msg.content) + '</div>' +
    '</div><div class="msg-time">' + formatDate(msg.timestamp) + '</div></div>' +
    '<div class="msg-actions"><button class="msg-action-btn" onclick="copyMsg(\'' + msg.id + '\')" title="复制">📋</button>' +
    '<button class="msg-action-btn" onclick="regenerateMsg(\'' + msg.id + '\')" title="重发">↻</button>' +
    '<button class="msg-action-btn" onclick="deleteMsg(\'' + msg.id + '\')" title="删除">🗑</button></div>';
  return row;
}

function appendMessageEl(msg) {
  const scroll = document.getElementById('chatScroll');
  if (!scroll) return;
  let container = scroll.querySelector('.chat-container');
  if (!container) { container = document.createElement('div'); container.className = 'chat-container'; scroll.appendChild(container); }
  container.appendChild(createMessageEl(msg));
  scroll.scrollTop = scroll.scrollHeight;
}

function updateMessageEl(msgId, content) {
  const el = document.getElementById('msg-body-' + msgId);
  if (el) el.innerHTML = renderMarkdown(content) + '<span class="stream-cursor"></span>';
  const scroll = document.getElementById('chatScroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function updateMessageThinking(msgId, thinking) {
  const el = document.getElementById('msg-' + msgId);
  if (!el) return;
  let details = el.querySelector('.think-block');
  if (!details) {
    details = document.createElement('details');
    details.className = 'think-block'; details.open = true;
    details.innerHTML = '<summary>💡 思考过程</summary><div class="think-content">' + renderMarkdown(thinking) + '</div>';
    el.insertBefore(details, el.querySelector('.msg-body'));
  } else { details.querySelector('.think-content').innerHTML = renderMarkdown(thinking); }
}

function removeMessageCursor(msgId) {
  const el = document.getElementById('msg-body-' + msgId);
  if (el) {
    const cursor = el.querySelector('.stream-cursor');
    if (cursor) cursor.remove();
  }
}

function showThinkingBubble() {
  const scroll = document.getElementById('chatScroll');
  if (!scroll) return;
  let container = scroll.querySelector('.chat-container');
  if (!container) { container = document.createElement('div'); container.className = 'chat-container'; scroll.appendChild(container); }
  const bubble = document.createElement('div');
  bubble.id = 'thinking-bubble';
  bubble.innerHTML = '<div class="thinking-bubble"><div class="thinking-dots"><span></span><span></span><span></span></div><span id="thinking-text">正在思考...</span></div>';
  container.appendChild(bubble);
  scroll.scrollTop = scroll.scrollHeight;
}

function hideThinkingBubble() {
  const el = document.getElementById('thinking-bubble');
  if (el) el.remove();
}

function setThinkingText(text) {
  const el = document.getElementById('thinking-text');
  if (el) el.textContent = text;
}

function showMultiGrid(models) {
  const scroll = document.getElementById('chatScroll');
  if (!scroll) return;
  let container = scroll.querySelector('.chat-container');
  if (!container) { container = document.createElement('div'); container.className = 'chat-container'; scroll.appendChild(container); }
  const grid = document.createElement('div'); grid.className = 'multi-grid';
  for (let i = 0; i < models.length; i++) {
    const m = getModel(models[i]);
    if (!m) continue;
    const card = document.createElement('div'); card.className = 'multi-card';
    const color = PROVIDER_COLORS[m.provider] || '#666';
    card.innerHTML = '<div class="multi-card-header"><span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:' + color + ';color:#fff;font-size:10px;font-weight:700">' + m.provider.charAt(0) + '</span>' + m.name + '<span id="multi-status-' + m.id + '" style="margin-left:auto;font-size:11px;color:var(--text-tertiary)">等待中...</span></div>' +
      '<div class="multi-card-body" id="multi-body-' + m.id + '"><div class="thinking-bubble"><div class="thinking-dots"><span></span><span></span><span></span></div><span>正在生成...</span></div></div>';
    grid.appendChild(card);
  }
  container.appendChild(grid);
  scroll.scrollTop = scroll.scrollHeight;
}

function updateMultiCard(modelId, content) {
  const body = document.getElementById('multi-body-' + modelId);
  const status = document.getElementById('multi-status-' + modelId);
  if (body) body.innerHTML = renderMarkdown(content);
  if (status) status.textContent = '已生成';
  const scroll = document.getElementById('chatScroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function setMultiStatus(modelId, text) {
  const status = document.getElementById('multi-status-' + modelId);
  if (status) status.textContent = text;
}

function updateModelSelector() {
  const btn = document.getElementById('modelSelectorBtn');
  if (!btn) return;
  const m = getModel(state.currentModelId) || getModel(DEFAULT_MODEL_ID);
  const color = PROVIDER_COLORS[m.provider] || '#666';
  btn.innerHTML = '<span class="sel-icon" style="background:' + color + '">' + m.provider.charAt(0) + '</span><span class="text-ellipsis">' + m.name + '</span><span class="arrow">▼</span>';
  renderModelDropdown();
}

function renderModelDropdown() {
  const dd = document.getElementById('modelDropdown');
  if (!dd) return;
  const q = document.getElementById('modelSearch')?.value?.toLowerCase() || '';
  dd.innerHTML = '<div class="model-dd-search"><input type="text" id="modelSearch" placeholder="搜索模型..." oninput="renderModelDropdown()" onkeydown="if(event.key===\'Enter\')event.preventDefault();"></div><div class="model-dd-body">';
  const search = document.getElementById('modelSearch');
  if (search && q) search.value = q;
  const providers = getProviders();
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const models = getProviderModels(p).filter(m => !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
    if (models.length === 0) continue;
    const region = PROVIDER_REGION[p] ? '🇨🇳 ' : '🌐 ';
    const group = document.createElement('div');
    group.innerHTML = '<div class="model-dd-group">' + region + p + '</div>';
    for (let j = 0; j < models.length; j++) {
      const m = models[j];
      const item = document.createElement('div');
      item.className = 'model-dd-item' + (m.id === state.currentModelId ? ' active' : '');
      item.onclick = () => selectModel(m.id);
      const color = PROVIDER_COLORS[p] || '#666';
      let badges = '';
      if (m.vision) badges += '<span class="model-dd-badge vision">👁</span>';
      if (m.thinking) badges += '<span class="model-dd-badge thinking">💡</span>';
      if (m.id.includes('tool') || m.id.includes('coder') || m.id.includes('code')) badges += '<span class="model-dd-badge tool">🔧</span>';
      item.innerHTML = '<span class="item-icon" style="background:' + color + '">' + p.charAt(0) + '</span><span class="item-name">' + m.name + '</span><span class="item-badges">' + badges + '</span>';
      group.appendChild(item);
    }
    dd.appendChild(group);
  }
}

function updateModeSelector() {
  const btn = document.getElementById('modeSelectorBtn');
  if (!btn) return;
  const meta = MODE_META[currentMode] || MODE_META.single;
  btn.innerHTML = '<span class="mode-icon">' + meta.icon + '</span><span class="text-ellipsis">' + meta.label + '</span><span class="arrow">▼</span>';
  renderModeDropdown();
}

function renderModeDropdown() {
  const dd = document.getElementById('modeDropdown');
  if (!dd) return;
  const items = [
    { id: 'single', icon: '💬', label: '单模型', desc: '与单个AI对话' },
    { id: 'multi', icon: '📋', label: '多模型', desc: '多个模型同时回答' },
    { id: 'debate', icon: '⚔️', label: '辩论模式', desc: 'AI之间辩论' },
    { id: 'collab', icon: '🤝', label: '协同合作', desc: '多个AI协作' }
  ];
  dd.innerHTML = '';
  for (let i = 0; i < items.length; i++) {
    const item = document.createElement('div');
    item.className = 'mode-dd-item' + (items[i].id === currentMode ? ' active' : '');
    item.onclick = () => selectMode(items[i].id);
    item.innerHTML = '<span class="mode-icon">' + items[i].icon + '</span><div class="mode-info"><div class="mode-name">' + items[i].label + '</div><div class="mode-desc">' + items[i].desc + '</div></div>';
    dd.appendChild(item);
  }
}

function showLoginError(err) { const el = document.getElementById('loginError'); if (el) el.textContent = err || ''; }
function showRegError(err) { const el = document.getElementById('regError'); if (el) el.textContent = err || ''; }

function showToast(msg, type) {
  type = type || 'info';
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div'); toast.className = 'toast ' + type; toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function setInputAreaMode() {
  const config = document.getElementById('modeConfig');
  if (!config) return;
  config.className = 'mode-config';
  if (currentMode === 'single') { config.classList.add('hidden'); return; }
  let html = '<div class="mode-config-inner">';
  if (currentMode === 'multi') {
    html += '<label>选择模型</label><div class="model-chips" id="multiChips">';
    const mm = state.multiModels || [];
    for (let i = 0; i < mm.length; i++) { const m = getModel(mm[i]); if (!m) continue; html += '<span class="model-chip" onclick="removeMultiModel(\'' + m.id + '\')">' + m.name + '<span class="chip-x">×</span></span>'; }
    html += '<button class="add-model-btn" onclick="showModelPicker()">+</button></div></div>';
  } else if (currentMode === 'debate') {
    html += '<div class="debate-columns"><div class="debate-col"><label>正方</label><div class="model-chips" id="debateProChips">';
    const dp = state.debatePro || [];
    for (let i = 0; i < dp.length; i++) { const m = getModel(dp[i]); if (!m) continue; html += '<span class="model-chip" onclick="removeDebatePro(\'' + m.id + '\')">' + m.name + '<span class="chip-x">×</span></span>'; }
    html += '<button class="add-model-btn" onclick="showDebateProPicker()">+</button></div></div>' +
      '<div class="debate-col"><label>反方</label><div class="model-chips" id="debateConChips">';
    const dc = state.debateCon || [];
    for (let i = 0; i < dc.length; i++) { const m = getModel(dc[i]); if (!m) continue; html += '<span class="model-chip" onclick="removeDebateCon(\'' + m.id + '\')">' + m.name + '<span class="chip-x">×</span></span>'; }
    html += '<button class="add-model-btn" onclick="showDebateConPicker()">+</button></div></div>' +
      '<div class="debate-col"><label>裁判</label><div class="model-chips" id="debateJudgeChips">';
    const dj = state.debateJudge || [];
    for (let i = 0; i < dj.length; i++) { const m = getModel(dj[i]); if (!m) continue; html += '<span class="model-chip" onclick="removeDebateJudge(\'' + m.id + '\')">' + m.name + '<span class="chip-x">×</span></span>'; }
    html += '<button class="add-model-btn" onclick="showDebateJudgePicker()">+</button></div></div></div>' +
      '<div class="debate-rounds"><label>赛制：</label><select id="debateType"><option value="standard">标准辩论</option><option value="quick">快速辩论</option><option value="battle">观点交锋</option></select>' +
      '<label>轮数：</label><input type="number" id="debateRounds" value="3" min="1" max="10" style="width:50px"></div></div>';
  } else if (currentMode === 'collab') {
    html += '<label>协作模型</label><div class="model-chips" id="collabChips">';
    const cm = state.collabModels || [];
    for (let i = 0; i < cm.length; i++) { const m = getModel(cm[i]); if (!m) continue; html += '<span class="model-chip" onclick="removeCollabModel(\'' + m.id + '\')">' + m.name + '<span class="chip-x">×</span></span>'; }
    html += '<button class="add-model-btn" onclick="showCollabPicker()">+</button></div></div>';
  }
  config.innerHTML = html;
  config.classList.remove('hidden');
}

function showModelPicker() {
  const dd = document.getElementById('modelPicker');
  if (!dd) return;
  dd.classList.toggle('show');
  if (!dd.classList.contains('show')) return;
  dd.innerHTML = '';
  for (let i = 0; i < MODELS.length; i++) {
    const m = MODELS[i];
    const item = document.createElement('div');
    item.className = 'model-picker-item';
    item.onclick = () => { addMultiModel(m.id); dd.classList.remove('show'); };
    const color = PROVIDER_COLORS[m.provider] || '#666';
    item.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:' + color + ';color:#fff;font-size:10px;font-weight:700">' + m.provider.charAt(0) + '</span>' + m.name;
    dd.appendChild(item);
  }
}

function showDebateProPicker() { showDebatePicker('pro'); }
function showDebateConPicker() { showDebatePicker('con'); }
function showDebateJudgePicker() { showDebatePicker('judge'); }
function showDebatePicker(side) {
  const dd = document.getElementById('modelPicker');
  if (!dd) return;
  dd.classList.toggle('show');
  if (!dd.classList.contains('show')) return;
  dd.innerHTML = '';
  for (let i = 0; i < MODELS.length; i++) {
    const m = MODELS[i];
    const item = document.createElement('div');
    item.className = 'model-picker-item';
    item.onclick = () => { addDebateModel(side, m.id); dd.classList.remove('show'); };
    const color = PROVIDER_COLORS[m.provider] || '#666';
    item.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:' + color + ';color:#fff;font-size:10px;font-weight:700">' + m.provider.charAt(0) + '</span>' + m.name;
    dd.appendChild(item);
  }
}
function showCollabPicker() {
  const dd = document.getElementById('modelPicker');
  if (!dd) return;
  dd.classList.toggle('show');
  if (!dd.classList.contains('show')) return;
  dd.innerHTML = '';
  for (let i = 0; i < MODELS.length; i++) {
    const m = MODELS[i];
    const item = document.createElement('div');
    item.className = 'model-picker-item';
    item.onclick = () => { addCollabModel(m.id); dd.classList.remove('show'); };
    const color = PROVIDER_COLORS[m.provider] || '#666';
    item.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:' + color + ';color:#fff;font-size:10px;font-weight:700">' + m.provider.charAt(0) + '</span>' + m.name;
    dd.appendChild(item);
  }
}
