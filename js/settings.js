// ==================== SETTINGS ====================
function openSettings() { document.getElementById('settingsModal')?.classList.add('show'); renderSettings(); }
function closeSettings() { document.getElementById('settingsModal')?.classList.remove('show'); }
function switchSettingsTab(tab) {
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="' + tab + '"]')?.classList.add('active');
  document.getElementById('panel' + tab[0].toUpperCase() + tab.slice(1))?.classList.add('active');
}

function renderSettings() {
  const k = state.apiKeys || {};
  const fields = [
    { id: 'mimoTokenPlan', key: 'mimoTokenPlan', label: 'MiMo 会员计划', placeholder: 'MiMo 会员 API Key' },
    { id: 'mimoPayAsYouGo', key: 'mimoPayAsYouGo', label: 'MiMo 按量付费', placeholder: 'MiMo 按量 API Key' },
    { id: 'openai', key: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
    { id: 'anthropic', key: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
    { id: 'google', key: 'google', label: 'Google', placeholder: 'AIza...' },
    { id: 'deepseek', key: 'deepseek', label: 'DeepSeek', placeholder: 'sk-...' },
    { id: 'kimi', key: 'kimi', label: 'Kimi', placeholder: 'sk-...' },
    { id: 'qwen', key: 'qwen', label: '通义千问', placeholder: 'sk-...' },
    { id: 'glm', key: 'glm', label: '智谱AI', placeholder: 'sk-...' },
    { id: 'ernie', key: 'ernie', label: '文心一言', placeholder: 'Bearer...' },
    { id: 'hunyuan', key: 'hunyuan', label: '腾讯混元', placeholder: 'sk-...' },
    { id: 'minimax', key: 'minimax', label: 'MiniMax', placeholder: 'sk-...' },
    { id: 'doubao', key: 'doubao', label: '火山引擎', placeholder: 'sk-...' }
  ];
  let html = '';
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    html += '<div class="key-row"><label>' + f.label + '</label><input type="password" id="' + f.id + '" placeholder="' + f.placeholder + '" value="' + (k[f.key] || '') + '"></div>';
  }
  const planEl = document.getElementById('mimoPlanBtns');
  if (planEl) {
    planEl.innerHTML = '';
    ['tokenPlan', 'payAsYouGo'].forEach(p => {
      const btn = document.createElement('button'); btn.className = 'plan-btn' + ((k.mimoPlan || 'tokenPlan') === p ? ' active' : '');
      btn.textContent = MIMO_PLANS[p].name; btn.onclick = () => { k.mimoPlan = p; saveState(); renderSettings(); };
      planEl.appendChild(btn);
    });
  }
  const keysEl = document.getElementById('keysPanel');
  if (keysEl) keysEl.innerHTML = html;

  // Theme
  const theme = state.theme || 'light';
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  document.querySelector('.theme-card[data-theme="' + theme + '"]')?.classList.add('active');

  // Data stats
  const stats = getDataStats();
  const statsEl = document.getElementById('dataStats');
  if (statsEl) statsEl.innerHTML = '<span>💬 对话数：' + stats.chats + '</span><span>💬 消息数：' + stats.messages + '</span><span>🔑 已配置 Key：' + stats.apiKeys + '</span><span>💾 存储大小：约 ' + (stats.storage / 1024).toFixed(1) + ' KB</span>';
}

function saveKeys() {
  const fields = ['mimoTokenPlan','mimoPayAsYouGo','openai','anthropic','google','deepseek','kimi','qwen','glm','ernie','hunyuan','minimax','doubao'];
  state.apiKeys = state.apiKeys || {};
  for (let i = 0; i < fields.length; i++) {
    const el = document.getElementById(fields[i]); if (el) state.apiKeys[fields[i]] = el.value.trim();
  }
  saveState();
  showToast('API Key 已保存', 'success');
}

function exportKeys() {
  const lines = ['# API Key 导出 - AI聚合平台'];
  const fields = [
    ['mimoTokenPlan', 'MiMo 会员'], ['mimoPayAsYouGo', 'MiMo 按量'], ['openai', 'OpenAI'], ['anthropic', 'Anthropic'],
    ['google', 'Google'], ['deepseek', 'DeepSeek'], ['kimi', 'Kimi'], ['qwen', '通义千问'],
    ['glm', '智谱AI'], ['ernie', '文心一言'], ['hunyuan', '腾讯混元'], ['minimax', 'MiniMax'], ['doubao', '火山引擎']
  ];
  const k = state.apiKeys || {};
  for (let i = 0; i < fields.length; i++) {
    if (k[fields[i][0]]) lines.push(fields[i][1] + '|||' + k[fields[i][0]]);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'api-keys.txt'; a.click();
  showToast('API Key 已导出', 'success');
}

function importKeys() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.txt';
  input.onchange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = reader.result.split('\n');
      const map = {
        'MiMo 会员': 'mimoTokenPlan', 'MiMo 按量': 'mimoPayAsYouGo', 'OpenAI': 'openai', 'Anthropic': 'anthropic',
        'Google': 'google', 'DeepSeek': 'deepseek', 'Kimi': 'kimi', '通义千问': 'qwen',
        '智谱AI': 'glm', '文心一言': 'ernie', '腾讯混元': 'hunyuan', 'MiniMax': 'minimax', '火山引擎': 'doubao'
      };
      state.apiKeys = state.apiKeys || {};
      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim(); if (!line || line.startsWith('#')) continue;
        const parts = line.split('|||'); if (parts.length >= 2) {
          const key = map[parts[0].trim()]; if (key) { state.apiKeys[key] = parts[1].trim(); count++; }
        }
      }
      saveState(); renderSettings(); showToast('已导入 ' + count + ' 个 Key', 'success');
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportData() {
  const blob = new Blob([exportState()], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ai-chat-data.json'; a.click();
  showToast('数据已导出', 'success');
}

function importData() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.state) state = data.state; else if (data.chats) state = data;
        saveState(); location.reload();
      } catch (err) { showToast('导入失败：' + err.message, 'error'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearAll() {
  if (!confirm('确定清除所有数据？此操作不可撤销！')) return;
  clearAllData();
  showToast('所有数据已清除', 'info');
  location.reload();
}

function setTheme(theme) {
  state.theme = theme;
  document.body.className = theme === 'dark' ? 'dark' : '';
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  document.querySelector('.theme-card[data-theme="' + theme + '"]')?.classList.add('active');
  saveState();
}

function initTheme() {
  const t = state.theme || 'light';
  if (t === 'system') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.className = 'dark';
    else document.body.className = '';
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => { document.body.className = e.matches ? 'dark' : ''; });
  } else { document.body.className = t === 'dark' ? 'dark' : ''; }
}
