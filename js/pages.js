/* ==================== PAGES · 模型 / 发现 / 我的 ==================== */
const Pages = (() => {

  /* ==================== 模型列表页 ==================== */
  function renderModels() {
    const kw = ($('#modelsSearchInput').value || '').trim().toLowerCase();
    const box = $('#modelsList');
    let html = '';
    getProvidersInOrder().forEach(p => {
      const models = getProviderModels(p).filter(m =>
        !kw || m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw) || p.toLowerCase().includes(kw));
      if (!models.length) return;
      const cfg = PROVIDERS[p] || {};
      const keySet = !!getKeyForModel({ provider: p });
      html += '<div class="provider-section">' +
        '<div class="provider-head">' + providerIconHtml(p, 26) +
        '<span class="provider-name">' + esc(p) + '</span>' +
        '<span class="provider-count">' + models.length + ' 个模型</span>' +
        '<span class="badge ' + (keySet ? 'success' : '') + '">' + (keySet ? 'Key 已配置' : 'Key 未配置') + '</span>' +
        '</div><div class="model-grid">' +
        models.map(m => {
          let tags = '';
          if (m.vision) tags += '<span class="tag vision">识图</span>';
          if (m.thinking) tags += '<span class="tag thinking">深度思考</span>';
          if (m.ctx >= 512) tags += '<span class="tag long">长上下文</span>';
          if (m.type && m.type !== 'chat') tags += '<span class="tag">' + esc(m.type) + '</span>';
          return '<button class="model-card" data-model="' + m.id + '">' +
            providerIconHtml(p, 34) +
            '<span class="model-card-info"><span class="model-card-name">' + esc(m.name) + '</span>' +
            '<span class="model-card-tags">' + tags + '</span></span>' +
            icon('arrowRight', 15) + '</button>';
        }).join('') + '</div></div>';
    });
    box.innerHTML = html || '<div class="empty-state">' + icon('search', 44) + '<div class="empty-title">没有找到匹配的模型</div></div>';
  }

  function bindModelsEvents() {
    $('#modelsSearchInput').addEventListener('input', debounce(renderModels, 160));
    $('#modelsList').addEventListener('click', e => {
      const card = e.target.closest('[data-model]');
      if (!card) return;
      Chat.new();
      Chat.selectModel(card.dataset.model);
      Chat.selectMode('single');
      UI.navigate('chat');
      setTimeout(() => $('#chatInput').focus(), 250);
    });
  }

  /* ==================== 发现页 ==================== */
  function renderDiscover() {
    // 模式卡片
    const modes = [
      { mode: 'single', grad: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
      { mode: 'multi', grad: 'linear-gradient(135deg,#0EA5E9,#38BDF8)' },
      { mode: 'debate', grad: 'linear-gradient(135deg,#EF4444,#F97316)' },
      { mode: 'collab', grad: 'linear-gradient(135deg,#10B981,#34D399)' }
    ];
    $('#discoverModes').innerHTML = modes.map(x => {
      const meta = MODE_META[x.mode];
      return '<button class="discover-card" data-mode="' + x.mode + '" style="--card-grad:' + x.grad + '">' +
        '<span class="dc-icon">' + icon(meta.icon, 20) + '</span>' +
        '<span class="dc-name">' + meta.label + '</span>' +
        '<span class="dc-desc">' + meta.desc + '</span></button>';
    }).join('');

    // 工具卡片
    const tools = [
      { id: 'paint', icon: 'palette', name: 'AI 绘画', desc: '用文字生成图片（OpenAI / 火山 / 通义万相）', grad: 'linear-gradient(135deg,#EC4899,#F472B6)' },
      { id: 'websearch', icon: 'globe', name: '联网搜索', desc: Store.state.webSearch.tavilyKey ? (Store.state.webSearch.enabled ? '已开启 · 点击管理' : '已配置 · 点击开启') : '配置 Tavily Key 后可用', grad: 'linear-gradient(135deg,#06B6D4,#22D3EE)' },
      { id: 'voice', icon: 'mic', name: '语音对话', desc: Voice.inputSupported() ? '语音输入 + 朗读回复' : '当前浏览器不支持语音识别', grad: 'linear-gradient(135deg,#8B5CF6,#A78BFA)' },
      { id: 'install', icon: 'smartphone', name: '安装 App', desc: window.AppInstall && AppInstall.canInstall() ? '一键安装到桌面' : '通过浏览器菜单添加到主屏幕', grad: 'linear-gradient(135deg,#64748B,#94A3B8)' }
    ];
    $('#discoverTools').innerHTML = tools.map(t =>
      '<button class="discover-card" data-tool="' + t.id + '" style="--card-grad:' + t.grad + '">' +
      '<span class="dc-icon">' + icon(t.icon, 20) + '</span>' +
      '<span class="dc-name">' + t.name + '</span>' +
      '<span class="dc-desc">' + t.desc + '</span></button>').join('');

    // 预设助手
    $('#presetGrid').innerHTML = PRESETS.map(p =>
      '<button class="preset-card" data-preset="' + p.id + '">' +
      '<span class="p-icon" style="background:' + p.grad + '">' + icon(p.icon, 21) + '</span>' +
      '<span><span class="p-name">' + esc(p.name) + '</span><span class="p-desc">' + esc(p.desc) + '</span></span></button>').join('');
  }

  function bindDiscoverEvents() {
    $('#discoverModes').addEventListener('click', e => {
      const card = e.target.closest('[data-mode]');
      if (!card) return;
      Chat.new();
      Chat.selectMode(card.dataset.mode);
      UI.navigate('chat');
    });
    $('#presetGrid').addEventListener('click', e => {
      const card = e.target.closest('[data-preset]');
      if (!card) return;
      const preset = PRESETS.find(p => p.id === card.dataset.preset);
      if (!preset) return;
      Chat.new({ title: preset.name, system: preset.system, presetId: preset.id, mode: 'single' });
      Chat.selectMode('single');
      UI.navigate('chat');
      Toast.success('已开启「' + preset.name + '」对话');
      setTimeout(() => $('#chatInput').focus(), 250);
    });
    $('#discoverTools').addEventListener('click', e => {
      const card = e.target.closest('[data-tool]');
      if (!card) return;
      const tool = card.dataset.tool;
      if (tool === 'paint') openPaintModal();
      else if (tool === 'websearch') { UI.navigate('profile'); setTimeout(() => Pages.scrollToGroup('plugin'), 150); }
      else if (tool === 'voice') { UI.navigate('chat'); Toast.info('点击输入框左侧麦克风即可语音输入'); }
      else if (tool === 'install') { if (window.AppInstall) AppInstall.prompt(); }
    });
  }

  /* ==================== AI 绘画 ==================== */
  function openPaintModal() {
    const providers = Object.keys(PROVIDERS).filter(p => PROVIDERS[p].imageModel);
    const modal = $('#paintModal');
    $('#paintProvider').innerHTML = providers.map(p => '<option value="' + p + '">' + p + '</option>').join('');
    modal.classList.add('show');
    $('#paintResult').innerHTML = '';
  }

  function bindPaintEvents() {
    $('#paintClose').addEventListener('click', () => $('#paintModal').classList.remove('show'));
    $('#paintModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('show'); });
    $('#paintBtn').addEventListener('click', async () => {
      const prompt = $('#paintPrompt').value.trim();
      if (!prompt) return Toast.warning('请输入画面描述');
      const provider = $('#paintProvider').value;
      const size = $('#paintSize').value;
      const btn = $('#paintBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 生成中…';
      $('#paintResult').innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-3)"><div class="spinner" style="margin:0 auto 10px"></div>AI 正在作画，通常需要 10-30 秒…</div>';
      try {
        const url = await API.generateImage({ prompt, provider, size });
        $('#paintResult').innerHTML =
          '<img src="' + url + '" class="ai-generated msg-image" style="width:100%" id="paintImg">' +
          '<div class="paint-actions"><button class="btn btn-secondary btn-sm" id="paintDownload">' + icon('download', 14) + ' 下载图片</button>' +
          '<button class="btn btn-secondary btn-sm" id="paintSendChat">' + icon('message', 14) + ' 发到对话讨论</button></div>';
        $('#paintDownload').addEventListener('click', async () => {
          const a = document.createElement('a');
          a.href = $('#paintImg').src;
          a.download = 'AI绘画-' + Date.now() + '.png';
          a.click();
        });
        $('#paintSendChat').addEventListener('click', () => {
          Chat.attachments.image = { name: 'AI绘画.png', dataUrl: $('#paintImg').src };
          UI.renderAttachments();
          $('#paintModal').classList.remove('show');
          UI.navigate('chat');
          $('#chatInput').value = '请描述/评价这幅 AI 画作：' + prompt;
          autoResize($('#chatInput'));
        });
      } catch (e) {
        $('#paintResult').innerHTML = '<div class="msg-error">' + icon('zap', 16) + '<span>' + esc(e.message) + '</span></div>';
      }
      btn.disabled = false;
      btn.innerHTML = icon('wand', 16) + ' 开始生成';
    });
  }

  /* ==================== 我的页面 ==================== */
  function renderProfile() {
    const u = Store.state.userInfo || {};
    const stats = Store.stats();

    // 顶部卡片
    const av = Store.state.avatar;
    let avatarInner;
    if (av && av.type === 'image' && av.data) avatarInner = '<img src="' + av.data + '">';
    else avatarInner = esc((u.name || 'U').charAt(0).toUpperCase());
    $('#profileAvatar').innerHTML = avatarInner;
    $('#profileAvatar').style.background = (av && av.type === 'image') ? 'transparent' : UI.AVATAR_GRADS[(av && av.idx) || 0];
    $('#profileName').textContent = u.name || '未登录';
    $('#profileTag').textContent = u.account ? '@' + u.account + (u.remark ? ' · ' + u.remark : '') : '';
    $('#profileStats').innerHTML =
      '<span class="profile-stat"><b>' + stats.chats + '</b> 对话</span>' +
      '<span class="profile-stat"><b>' + stats.messages + '</b> 消息</span>' +
      '<span class="profile-stat"><b>' + stats.keys + '</b> Key</span>';

    renderKeyManagement();
    renderPluginSection();
    renderDataSection();
    renderAboutSection();
    updateInstallRow();
  }

  /* ---- API Key 管理 ---- */
  function renderKeyManagement() {
    const box = $('#keyManagement');
    const cn = [], gl = [];
    Object.keys(PROVIDERS).forEach(p => (PROVIDERS[p].region === 'cn' ? cn : gl).push(p));

    const blockHtml = p => {
      const cfg = PROVIDERS[p];
      const k = Store.state.apiKeys;
      let rows = '';
      let set = false;
      if (cfg.dualKey) {
        const plan = k.mimoPlan || 'tokenPlan';
        set = plan === 'tokenPlan' ? !!k.mimoTokenPlan : !!k.mimoPayAsYouGo;
        rows =
          '<div class="key-row"><label>计费方式</label><select class="select" data-key="mimoPlan">' +
          '<option value="tokenPlan"' + (plan === 'tokenPlan' ? ' selected' : '') + '>会员计划（Token Plan）</option>' +
          '<option value="payAsYouGo"' + (plan === 'payAsYouGo' ? ' selected' : '') + '>按量付费</option></select></div>' +
          '<div class="key-row"><label>会员计划 Key</label>' + keyInputHtml('mimoTokenPlan', k.mimoTokenPlan) + '</div>' +
          '<div class="key-row"><label>按量付费 Key</label>' + keyInputHtml('mimoPayAsYouGo', k.mimoPayAsYouGo) + '</div>';
      } else {
        set = !!k[cfg.keySlug];
        rows = '<div class="key-row"><label>API Key <span style="color:var(--text-3);font-weight:400">· ' + esc(cfg.keyHint || '') + '</span></label>' + keyInputHtml(cfg.keySlug, k[cfg.keySlug]) + '</div>';
      }
      return '<div class="key-provider-block" data-provider="' + esc(p) + '">' +
        '<button class="key-provider-head">' + providerIconHtml(p, 24) +
        '<span class="kp-name">' + esc(p) + '</span>' +
        '<span class="key-status ' + (set ? 'set' : 'unset') + '">' + (set ? '已配置' : '未配置') + '</span>' +
        icon('chevronDown', 14) + '</button>' +
        '<div class="key-provider-body">' + rows + '</div></div>';
    };

    box.innerHTML =
      '<div class="settings-group-title" style="padding:12px 16px 6px">' + icon('key', 15) + ' 国内厂商</div>' +
      cn.map(blockHtml).join('') +
      '<div class="settings-group-title" style="padding:16px 16px 6px">' + icon('globe', 15) + ' 国外厂商</div>' +
      gl.map(blockHtml).join('');
  }

  function keyInputHtml(slug, val) {
    return '<div class="key-input-wrap"><input type="password" class="input" data-key="' + slug + '" value="' + esc(val || '') + '" placeholder="sk-..." autocomplete="off">' +
      '<button class="key-eye" data-eye tabindex="-1">' + icon('eye', 16) + '</button></div>';
  }

  function bindKeyEvents() {
    $('#keyManagement').addEventListener('click', e => {
      const head = e.target.closest('.key-provider-head');
      if (head) { head.closest('.key-provider-block').classList.toggle('open'); return; }
      const eye = e.target.closest('[data-eye]');
      if (eye) {
        const input = eye.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        eye.innerHTML = icon(show ? 'eyeOff' : 'eye', 16);
      }
    });
    $('#keyManagement').addEventListener('change', e => {
      const el = e.target.closest('[data-key]');
      if (!el) return;
      Store.state.apiKeys[el.dataset.key] = el.value.trim();
      Store.save();
      if (el.tagName === 'SELECT') return;
      renderKeyManagement();
      Toast.success('Key 已保存');
    });

    // 批量导入导出
    $('#exportKeysBtn').addEventListener('click', () => {
      const k = Store.state.apiKeys;
      const lines = Object.keys(k).filter(s => k[s] && s !== 'mimoPlan').map(s => s + '=' + k[s]);
      if (!lines.length) return Toast.warning('暂无已配置的 Key');
      download('api-keys.txt', lines.join('\n'));
      Toast.success('已导出 ' + lines.length + ' 个 Key');
    });
    $('#importKeysBtn').addEventListener('click', () => $('#importKeysFile').click());
    $('#importKeysFile').addEventListener('change', async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const text = await readFileAsText(file);
        let count = 0;
        // 支持 txt（slug=key 每行一条）与 json
        if (file.name.endsWith('.json')) {
          const obj = JSON.parse(text);
          Object.keys(obj).forEach(s => { if (typeof obj[s] === 'string' && obj[s]) { Store.state.apiKeys[s] = obj[s]; count++; } });
        } else {
          text.split(/\r?\n/).forEach(line => {
            const m = line.match(/^\s*([\w-]+)\s*[=:：]\s*(\S+)\s*$/);
            if (m) { Store.state.apiKeys[m[1]] = m[2]; count++; }
          });
        }
        if (!count) throw new Error('empty');
        Store.save();
        renderKeyManagement();
        Toast.success('已导入 ' + count + ' 个 Key');
      } catch (err) { Toast.error('导入失败：格式应为 厂商标识=Key（每行一条）'); }
    });
  }

  /* ---- 主题 ---- */
  function bindThemeEvents() {
    $$('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        Store.state.theme = card.dataset.theme;
        Store.save();
        UI.applyTheme();
        syncThemeCards();
      });
    });
  }
  function syncThemeCards() {
    $$('.theme-card').forEach(c => c.classList.toggle('active', c.dataset.theme === (Store.state.theme || 'system')));
  }

  /* ---- 插件（联网搜索 / 语音） ---- */
  function renderPluginSection() {
    $('#tavilyKeyInput').value = Store.state.webSearch.tavilyKey || '';
    $('#webSearchSwitch').checked = !!Store.state.webSearch.enabled;
    $('#voiceRateRange').value = Store.state.voiceSettings.rate || 1;
    $('#voiceRateLabel').textContent = (Store.state.voiceSettings.rate || 1) + 'x';
    const voices = Voice.getVoices();
    $('#voiceSelect').innerHTML = '<option value="">自动选择</option>' +
      voices.map(v => '<option value="' + esc(v.voiceURI) + '"' + (Store.state.voiceSettings.voiceURI === v.voiceURI ? ' selected' : '') + '>' + esc(v.name) + '</option>').join('');
  }

  function bindPluginEvents() {
    $('#tavilyKeyInput').addEventListener('change', e => {
      Store.state.webSearch.tavilyKey = e.target.value.trim();
      Store.save();
      Toast.success('搜索 Key 已保存');
      UI.updateWebSearchBtn();
    });
    $('#webSearchSwitch').addEventListener('change', e => {
      if (e.target.checked && !Store.state.webSearch.tavilyKey) {
        e.target.checked = false;
        return Toast.warning('请先填写上方 Tavily API Key（tavily.com 免费获取）');
      }
      Store.state.webSearch.enabled = e.target.checked;
      Store.save();
      UI.updateWebSearchBtn();
      Toast.info(e.target.checked ? '联网搜索已开启' : '联网搜索已关闭');
    });
    $('#voiceRateRange').addEventListener('input', e => {
      Store.state.voiceSettings.rate = +e.target.value;
      $('#voiceRateLabel').textContent = e.target.value + 'x';
      Store.save();
    });
    $('#voiceSelect').addEventListener('change', e => {
      Store.state.voiceSettings.voiceURI = e.target.value;
      Store.save();
    });
    $('#voiceTestBtn').addEventListener('click', () => Voice.speak('你好，我是第三方科技 AI 助手，语音功能已就绪。', 'test'));
  }

  /* ---- 数据管理 ---- */
  function renderDataSection() {
    const s = Store.stats();
    $('#dataStats').innerHTML =
      '<div class="data-stat"><b>' + s.chats + '</b><span>对话数</span></div>' +
      '<div class="data-stat"><b>' + s.messages + '</b><span>消息数</span></div>' +
      '<div class="data-stat"><b>' + s.keys + '</b><span>API Key</span></div>' +
      '<div class="data-stat"><b>' + fmtBytes(s.bytes) + '</b><span>存储占用</span></div>';
  }

  function bindDataEvents() {
    $('#exportAllBtn').addEventListener('click', () => {
      download('第三方AI-全量备份-' + new Date().toISOString().slice(0, 10) + '.json', Store.exportAll(), 'application/json');
      Toast.success('备份已导出');
    });
    $('#importAllBtn').addEventListener('click', () => $('#importAllFile').click());
    $('#importAllFile').addEventListener('change', async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        Store.importAll(await readFileAsText(file));
        UI.renderSidebar(); UI.renderChat(); renderProfile();
        Toast.success('数据已恢复');
      } catch (err) { Toast.error('恢复失败：' + err.message); }
    });
    $('#clearAllBtn').addEventListener('click', () => {
      confirmDialog('清除所有数据', '将删除全部对话、Key 配置与账号信息并恢复初始状态，确定继续吗？', true).then(ok => {
        if (ok) { Store.reset(); location.reload(); }
      });
    });
  }

  /* ---- 关于 ---- */
  function renderAboutSection() {
    $('#aboutVersion').textContent = 'v' + APP_VERSION;
    $('#changelogList').innerHTML = CHANGELOG.map(c =>
      '<div class="changelog-item"><div class="cl-ver">' + esc('v' + c.version) + '<span class="cl-date">' + esc(c.date) + '</span></div>' +
      '<ul>' + c.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('');
  }

  /* ---- 头像 ---- */
  function bindAvatarEvents() {
    $('#profileAvatar').addEventListener('click', () => {
      $('#avatarModal').classList.add('show');
      renderAvatarOptions();
    });
    $('#avatarClose').addEventListener('click', () => $('#avatarModal').classList.remove('show'));
    $('#avatarModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('show'); });
    $('#avatarOptions').addEventListener('click', e => {
      const opt = e.target.closest('.avatar-option');
      if (!opt) return;
      Store.state.avatar = { type: 'preset', idx: +opt.dataset.idx };
      Store.save();
      renderAvatarOptions();
      renderProfile();
    });
    $('#avatarUploadBtn').addEventListener('click', () => $('#avatarFileInput').click());
    $('#avatarFileInput').addEventListener('change', async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const dataUrl = await compressImage(await readFileAsDataURL(file), 256, 0.85);
      Store.state.avatar = { type: 'image', data: dataUrl };
      Store.save();
      renderAvatarOptions();
      renderProfile();
      Toast.success('头像已更新');
    });
  }

  function renderAvatarOptions() {
    const cur = Store.state.avatar;
    $('#avatarOptions').innerHTML = UI.AVATAR_GRADS.map((g, i) =>
      '<button class="avatar-option' + (cur && cur.type === 'preset' && cur.idx === i ? ' active' : '') + '" data-idx="' + i + '" style="--av-grad:' + g + ';background:' + g + '">' +
      esc(((Store.state.userInfo || {}).name || 'U').charAt(0).toUpperCase()) + '</button>').join('');
  }

  /* ---- 安装 App / 退出 ---- */
  function updateInstallRow() {
    const row = $('#installRow');
    if (!row) return;
    row.querySelector('.row-desc').textContent = window.AppInstall && AppInstall.canInstall()
      ? '一键安装到桌面，离线可用'
      : (window.AppInstall && AppInstall.isInstalled() ? '已安装为应用' : '浏览器菜单 → 添加到主屏幕');
  }

  function bindProfileEvents() {
    bindKeyEvents(); bindThemeEvents(); bindPluginEvents(); bindDataEvents(); bindAvatarEvents();
    $('#installRow').addEventListener('click', () => { if (window.AppInstall) AppInstall.prompt(); });
    $('#logoutBtn').addEventListener('click', () => {
      confirmDialog('退出登录', '确定退出当前账号吗？对话记录将保留在本机。').then(ok => { if (ok) Auth.logout(); });
    });
    syncThemeCards();
  }

  function scrollToGroup(name) {
    const el = $('[data-group="' + name + '"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function init() {
    bindModelsEvents();
    bindDiscoverEvents();
    bindPaintEvents();
    bindProfileEvents();
  }

  return { init, renderModels, renderDiscover, renderProfile, scrollToGroup, syncThemeCards };
})();
