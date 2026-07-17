/* ==================== PAGES · 模型 / 发现 / 我的 ==================== */
const Pages = (() => {

  /* ==================== 模型列表页 ==================== */
  /* 排序：在售/新模型在前，已下架沉底 */
  function sortModels(models) {
    return models.slice().sort((a, b) => (a.status === 'deprecated' ? 1 : 0) - (b.status === 'deprecated' ? 1 : 0));
  }

  function renderModels() {
    const kw = ($('#modelsSearchInput').value || '').trim().toLowerCase();
    const box = $('#modelsList');
    let html = '';
    getProvidersInOrder().forEach(p => {
      const models = sortModels(getProviderModels(p)).filter(m =>
        !kw || m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw) || p.toLowerCase().includes(kw));
      if (!models.length) return;
      const keySet = !!getKeyForModel({ provider: p });
      html += '<div class="provider-section">' +
        '<div class="provider-head">' + providerIconHtml(p, 26) +
        '<span class="provider-name">' + esc(p) + '</span>' +
        '<span class="provider-count">' + models.length + ' 个模型</span>' +
        '<span class="badge ' + (keySet ? 'success' : '') + '">' + (keySet ? 'Key 已配置' : 'Key 未配置') + '</span>' +
        '</div><div class="model-grid">' +
        models.map(m => {
          const dep = m.status === 'deprecated';
          const nonChat = !isChatModel(m);
          let tags = '';
          if (m.status === 'new') tags += '<span class="tag new">' + I18n.t('models.new') + '</span>';
          if (dep) tags += '<span class="tag deprecated">' + I18n.t('models.dep') + '</span>';
          if (m.vision) tags += '<span class="tag vision">' + I18n.t('tag.vision') + '</span>';
          if (m.thinking) tags += '<span class="tag thinking">' + I18n.t('tag.thinking') + '</span>';
          if (m.ctx >= 512) tags += '<span class="tag long">' + I18n.t('tag.long') + '</span>';
          if (!nonChat && m.stream !== false) tags += '<span class="tag stream">' + I18n.t('tag.stream') + '</span>';
          if (nonChat) tags += '<span class="tag">' + esc(m.type) + '</span>';
          // 已下架仅供欣赏不可点击；专用模型点击进对应工具
          const cls = dep ? ' deprecated disabled' : (nonChat ? ' special' : '');
          return '<button class="model-card' + cls + '" data-model="' + m.id + '"' + (dep ? ' disabled' : '') + '>' +
            providerIconHtml(p, 34) +
            '<span class="model-card-info"><span class="model-card-name">' + esc(m.name) + '</span>' +
            '<span class="model-card-tags">' + tags + '</span></span>' +
            icon('arrowRight', 15) + '</button>';
        }).join('') + '</div></div>';
    });
    box.innerHTML = html || '<div class="empty-state">' + icon('search', 44) + '<div class="empty-title">没有找到匹配的模型</div></div>';
    updateSyncHint();
  }

  /* 同步按钮下方显示最后同步时间 */
  function updateSyncHint() {
    const el = $('#modelsSyncHint');
    if (!el) return;
    const data = ModelSync.getSyncData();
    const tsList = Object.keys(data).map(k => data[k].ts).filter(Boolean);
    if (!tsList.length) { el.textContent = '从已配置 Key 的厂商实时拉取最新模型列表'; return; }
    const last = new Date(Math.max.apply(null, tsList));
    const pad = n => String(n).padStart(2, '0');
    el.textContent = '上次同步：' + last.getFullYear() + '-' + pad(last.getMonth() + 1) + '-' + pad(last.getDate()) +
      ' ' + pad(last.getHours()) + ':' + pad(last.getMinutes()) + '（' + tsList.length + ' 家厂商）';
  }

  /* 同步全部已配置 Key 的厂商模型列表 */
  async function runModelSync() {
    const btn = $('#modelsSyncBtn');
    const keyed = Object.keys(PROVIDERS).filter(p => { try { return !!getKeyForModel({ provider: p }); } catch (e) { return false; } });
    if (!keyed.length) {
      Toast.warning('还没有配置任何 API Key，请先到「我的 → API Key」添加');
      return;
    }
    btn.disabled = true;
    btn.classList.add('syncing');
    const label = btn.querySelector('.sync-label');
    const oldText = label.textContent;
    const results = await ModelSync.syncAll(p => { label.textContent = '同步 ' + p + '…'; });
    let okCount = 0, failCount = 0;
    const fails = [];
    Object.keys(results).forEach(p => {
      if (results[p].ok) okCount++; else { failCount++; fails.push(p + '：' + results[p].error); }
    });
    btn.disabled = false;
    btn.classList.remove('syncing');
    label.textContent = oldText;
    renderModels();
    if (failCount) Toast.warning('同步完成：' + okCount + ' 家成功，' + failCount + ' 家失败（' + fails[0] + '）');
    else Toast.success('同步完成：' + okCount + ' 家厂商模型列表已更新');
  }

  function bindModelsEvents() {
    $('#modelsSearchInput').addEventListener('input', debounce(renderModels, 160));
    $('#modelsSyncBtn').addEventListener('click', runModelSync);
    $('#modelsList').addEventListener('click', e => {
      const card = e.target.closest('[data-model]');
      if (!card || card.disabled) return; // 已下架：仅供欣赏
      const m = getModel(card.dataset.model);
      if (m && !isChatModel(m)) {
        // 专用模型（语音类）：进入对应工具
        if ((m.type || '').startsWith('tts')) openVoiceStudio(m.type === 'tts-voiceclone' ? 'clone' : (m.type === 'tts-voicedesign' ? 'design' : 'preset'));
        else if (m.type === 'asr') { UI.navigate('profile'); setTimeout(() => openSub('subAsr'), 120); Toast.info('语音识别模型已就绪，在输入框点麦克风即可使用'); }
        return;
      }
      Chat.new();
      Chat.selectModel(card.dataset.model);
      Chat.selectMode('single');
      UI.navigate('chat');
      setTimeout(() => $('#chatInput').focus(), 250);
    });
  }

  /* ==================== 其他页（微信发现式条目） ==================== */
  function renderDiscover() {
    // 联网搜索条目描述随状态变化
    const row = $('#toolWebSearch .row-desc');
    if (row) row.textContent = Store.state.webSearch.tavilyKey
      ? (Store.state.webSearch.enabled ? '已开启 · 点击管理' : '已配置 · 点击开启')
      : I18n.t('more.websearchD');
  }

  function bindDiscoverEvents() {
    $('#toolPaint').addEventListener('click', openPaintModal);
    $('#toolVoiceStudio').addEventListener('click', () => openVoiceStudio());
    $('#toolPresets').addEventListener('click', () => {
      renderPresetGrid();
      $('#presetsModal').classList.add('show');
    });
    $('#toolWebSearch').addEventListener('click', () => openSub('subPlugin'));
    $('#presetsClose').addEventListener('click', () => $('#presetsModal').classList.remove('show'));
    $('#presetsModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.remove('show'); });
    $('#presetGrid').addEventListener('click', e => {
      const card = e.target.closest('[data-preset]');
      if (!card) return;
      const preset = PRESETS.find(p => p.id === card.dataset.preset);
      if (!preset) return;
      $('#presetsModal').classList.remove('show');
      Chat.new({ title: preset.name, system: preset.system, presetId: preset.id, mode: 'single' });
      Chat.selectMode('single');
      UI.navigate('chat');
      Toast.success('已开启「' + preset.name + '」对话');
      setTimeout(() => $('#chatInput').focus(), 250);
    });
  }

  function renderPresetGrid() {
    $('#presetGrid').innerHTML = PRESETS.map(p =>
      '<button class="preset-card" data-preset="' + p.id + '">' +
      '<span class="p-icon" style="background:' + p.grad + '">' + icon(p.icon, 21) + '</span>' +
      '<span><span class="p-name">' + esc(p.name) + '</span><span class="p-desc">' + esc(p.desc) + '</span></span></button>').join('');
  }

  /* ==================== 设置子页管理 ==================== */
  function openSub(id) {
    renderSubContent(id);
    $('#' + id).classList.add('show');
  }
  function closeSubs() { $$('.subpage').forEach(s => s.classList.remove('show')); }

  function renderSubContent(id) {
    if (id === 'subKeys') renderKeyManagement();
    else if (id === 'subPlugin') renderPluginSection();
    else if (id === 'subData') renderDataSection();
    else if (id === 'subVoice') renderVoiceSection();
    else if (id === 'subAsr') renderAsrSection();
    else if (id === 'subLang') renderLangList();
    else if (id === 'subHelp') renderHelp();
    else if (id === 'subAbout') $('#aboutVersionSub').textContent = 'v' + APP_VERSION;
    else if (id === 'subTheme') syncThemeCards();
  }

  function bindSubpageEvents() {
    $$('[data-sub]').forEach(row => row.addEventListener('click', () => openSub(row.dataset.sub)));
    $$('.subpage-back').forEach(btn => btn.addEventListener('click', closeSubs));
    $('#feedbackRow').addEventListener('click', () => {
      window.open('https://github.com/Smalluniverseheng/AI/issues', '_blank');
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

    renderRowDescs();
    renderAboutSection();
    updateInstallRow();
  }

  /* 我的页条目右侧状态描述 */
  function renderRowDescs() {
    const vs = Store.state.voiceSettings;
    const ttsE = Voice.TTS_ENGINES.find(e => e.id === (vs.ttsEngine || 'browser'));
    $('#voiceRowDesc').textContent = (ttsE ? (ttsE.provider || '浏览器内置') : '浏览器内置') + ' · ' + (vs.rate || 1) + 'x';
    const asrE = Voice.ASR_ENGINES.find(e => e.id === (vs.asrEngine || 'browser'));
    $('#asrRowDesc').textContent = asrE ? (asrE.provider || '浏览器内置') : '浏览器内置';
    $('#themeRowDesc').textContent = I18n.t('theme.' + (Store.state.theme || 'system'));
    $('#langRowDesc').textContent = I18n.current().name;
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

  /* ---- 联网搜索子页 ---- */
  function renderPluginSection() {
    $('#tavilyKeyInput').value = Store.state.webSearch.tavilyKey || '';
    $('#webSearchSwitch').checked = !!Store.state.webSearch.enabled;
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
  }

  /* ---- 播报声音子页 ---- */
  function renderVoiceSection() {
    const vs = Store.state.voiceSettings;
    // 引擎下拉
    $('#ttsEngineSelect').innerHTML = Voice.TTS_ENGINES.map(e => {
      const noKey = e.provider && !Voice.engineKey(e.id, Voice.TTS_ENGINES);
      return '<option value="' + e.id + '"' + (vs.ttsEngine === e.id ? ' selected' : '') + '>' +
        esc(e.provider || I18n.t('voice.engineBrowser')) + ' · ' + esc(e.desc) + (noKey ? '（未配置 Key）' : '') + '</option>';
    }).join('');
    renderTtsVoiceOptions();
    $('#voiceRateRange').value = vs.rate || 1;
    $('#voiceRateLabel').textContent = (vs.rate || 1) + 'x';
    renderTtsKeyHint();
  }

  function renderTtsVoiceOptions() {
    const vs = Store.state.voiceSettings;
    const eng = vs.ttsEngine || 'browser';
    let opts;
    if (eng === 'mimo') {
      opts = Voice.MIMO_VOICES.map(v => '<option value="' + esc(v.id) + '"' + (vs.ttsVoice === v.id ? ' selected' : '') + '>' + esc(v.name) + '</option>').join('');
      if (!Voice.MIMO_VOICES.some(v => v.id === vs.ttsVoice)) { vs.ttsVoice = 'mimo_default'; Store.save(); }
    } else if (eng === 'openai') {
      opts = Voice.OPENAI_VOICES.map(v => '<option value="' + v + '"' + (vs.ttsVoice === v ? ' selected' : '') + '>' + v + '</option>').join('');
      if (!Voice.OPENAI_VOICES.includes(vs.ttsVoice)) { vs.ttsVoice = 'alloy'; Store.save(); }
    } else {
      opts = '<option value="">自动选择</option>' + Voice.getVoices().map(v =>
        '<option value="' + esc(v.voiceURI) + '"' + (vs.voiceURI === v.voiceURI ? ' selected' : '') + '>' + esc(v.name) + '</option>').join('');
    }
    $('#voiceSelect').innerHTML = opts;
  }

  function renderTtsKeyHint() {
    const vs = Store.state.voiceSettings;
    const e = Voice.TTS_ENGINES.find(x => x.id === (vs.ttsEngine || 'browser'));
    const hint = $('#ttsKeyHint');
    if (e && e.provider && !Voice.engineKey(e.id, Voice.TTS_ENGINES)) {
      hint.innerHTML = '<span style="color:var(--warning)">' + esc(e.provider) + ' ' + I18n.t('voice.needKey') + '</span>';
    } else hint.textContent = '';
  }

  function bindVoiceEvents() {
    $('#ttsEngineSelect').addEventListener('change', e => {
      Store.state.voiceSettings.ttsEngine = e.target.value;
      Store.save();
      renderTtsVoiceOptions();
      renderTtsKeyHint();
      renderRowDescs();
    });
    $('#voiceSelect').addEventListener('change', e => {
      const vs = Store.state.voiceSettings;
      if ((vs.ttsEngine || 'browser') === 'browser') vs.voiceURI = e.target.value;
      else vs.ttsVoice = e.target.value;
      Store.save();
    });
    $('#voiceRateRange').addEventListener('input', e => {
      Store.state.voiceSettings.rate = +e.target.value;
      $('#voiceRateLabel').textContent = e.target.value + 'x';
      Store.save();
      renderRowDescs();
    });
    $('#voiceTestBtn').addEventListener('click', () => {
      const texts = { 'zh-CN': '你好，我是第三方科技 AI 助手，语音功能已就绪。', 'zh-TW': '你好，我是第三方科技 AI 助手，語音功能已就緒。' };
      Voice.speak(texts[I18n.lang()] || 'Hello! The voice feature is ready.', 'test');
    });
  }

  /* ---- 语音识别子页 ---- */
  function renderAsrSection() {
    const cur = Store.state.voiceSettings.asrEngine || 'browser';
    $('#asrEngineList').innerHTML = Voice.ASR_ENGINES.map(e => {
      const noKey = e.provider && !Voice.engineKey(e.id, Voice.ASR_ENGINES);
      return '<div class="asr-engine-row' + (cur === e.id ? ' active' : '') + (noKey ? ' nokey' : '') + '" data-asr="' + e.id + '">' +
        '<span class="asr-name"><b>' + esc(e.provider || I18n.t('voice.asrBrowser')) + '</b><span>' + esc(e.desc) + (noKey ? ' · 未配置 Key' : '') + '</span></span>' +
        '<span class="asr-check">' + icon('check', 17) + '</span></div>';
    }).join('');
  }

  function bindAsrEvents() {
    $('#asrEngineList').addEventListener('click', e => {
      const row = e.target.closest('[data-asr]');
      if (!row) return;
      const eng = Voice.ASR_ENGINES.find(x => x.id === row.dataset.asr);
      if (eng.provider && !Voice.engineKey(eng.id, Voice.ASR_ENGINES)) {
        Toast.warning(eng.provider + ' ' + I18n.t('voice.needKey'));
        openSub('subKeys');
        return;
      }
      Store.state.voiceSettings.asrEngine = eng.id;
      Store.save();
      renderAsrSection();
      renderRowDescs();
      Toast.success(I18n.t('toast.switched') + (eng.provider || '浏览器内置'));
    });
  }

  /* ---- 语言子页 ---- */
  function renderLangList() {
    const cur = I18n.lang();
    $('#langList').innerHTML = I18n.LANGS.map(l =>
      '<div class="lang-row' + (l.id === cur ? ' active' : '') + '" data-lang="' + l.id + '">' +
      '<span class="lang-name">' + esc(l.name) + '</span><span class="lang-en">' + esc(l.en) + '</span>' +
      '<span class="lang-check">' + icon('check', 17) + '</span></div>').join('');
  }

  function bindLangEvents() {
    $('#langList').addEventListener('click', e => {
      const row = e.target.closest('[data-lang]');
      if (!row) return;
      I18n.setLang(row.dataset.lang);
      renderLangList();
      renderRowDescs();
      Toast.success(I18n.t('toast.switched') + I18n.current().name);
    });
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
    $$('#aboutVersion, #aboutVersionSub').forEach(el => { el.textContent = 'v' + APP_VERSION; });
    const latest = CHANGELOG[0];
    if (latest) $('#changelogRowDesc').textContent = '最新 v' + latest.version + ' · ' + latest.date + '，共 ' + CHANGELOG.length + ' 个版本';
  }

  /* ---- 帮助中心 ---- */
  const CONSOLE_LINKS = {
    '小米MiMo': 'https://platform.xiaomimimo.com', 'OpenAI': 'https://platform.openai.com/api-keys',
    'Anthropic': 'https://console.anthropic.com', 'Google': 'https://aistudio.google.com/apikey',
    'DeepSeek': 'https://platform.deepseek.com/api_keys', 'Kimi': 'https://platform.moonshot.cn/console/api-keys',
    '通义千问': 'https://bailian.console.aliyun.com', '智谱AI': 'https://open.bigmodel.cn/usercenter/apikeys',
    '文心一言': 'https://qianfan.cloud.baidu.com', '腾讯混元': 'https://console.cloud.tencent.com/hunyuan/api-keys',
    'MiniMax': 'https://platform.minimaxi.com', '火山引擎': 'https://console.volcengine.com/ark',
    '零一万物': 'https://platform.lingyiwanwu.com/apikeys', '阶跃星辰': 'https://platform.stepfun.com/interface-key',
    '百川智能': 'https://platform.baichuan-ai.com/console/apikey', '讯飞星火': 'https://console.xfyun.cn',
    '昆仑万维': 'https://platform.tiangong.cn', '商汤': 'https://platform.sensenova.cn',
    'Mistral': 'https://console.mistral.ai/api-keys', 'Meta': 'https://llama.developer.meta.com',
    'Cohere': 'https://dashboard.cohere.com/api-keys', 'xAI': 'https://console.x.ai', 'Groq': 'https://console.groq.com/keys'
  };

  function renderHelp() {
    const faqs = [
      { q: '这个平台是什么？', a: '一个纯前端的 AI 对话聚合平台：填入各家厂商的 API Key，就能在一个界面里使用 23 家厂商的 150+ 大模型。支持单模型、多模型对比、辩论、协同四种对话模式，以及语音、绘画、联网搜索等工具。数据只存储在你自己的浏览器里。' },
      { q: '如何开始使用？', a: '<ol><li>进入「我的 → API Key 管理」</li><li>展开任意厂商，粘贴从该厂商控制台申请的 Key（下方有各厂商申请入口）</li><li>回到对话页，顶部选择模型即可开始聊天</li></ol>只需填写 Key 即可，接口地址、请求格式、参数均已按各厂商官方文档内置适配。' },
      { q: '四种对话模式有什么区别？', a: '<ul><li><b>单模型</b>：与任意一个模型对话</li><li><b>多模型</b>：同一个问题同时发给多个模型，并排对比回答</li><li><b>辩论</b>：正方、反方多轮交锋，裁判模型总结点评</li><li><b>协同</b>：多个模型分工协作（提案 → 汇总），完成复杂任务</li></ul>' },
      { q: '语音输入 / 语音朗读怎么用？', a: '<ul><li>点击输入框左侧麦克风开始语音输入，说完再点一次结束</li><li>在「我的 → 语音识别」可切换识别引擎：浏览器内置（免费）、小米 MiMo（支持中文、英语及粤语/吴语/闽南语/四川话等方言）、OpenAI / Groq Whisper</li><li>AI 回复卡片上的喇叭图标可朗读该条回复</li><li>在「我的 → 播报声音」可切换朗读引擎与音色</li></ul>' },
      { q: '语音工坊（合成 / 克隆 / 设计）', a: '「其他 → 语音工坊」使用小米 MiMo 语音模型：<ul><li><b>预置音色</b>：9 种精品音色直接合成</li><li><b>音色设计</b>：用文字描述想要的声音（如“年迈的老先生，北方口音”）现场生成</li><li><b>音色克隆</b>：上传一段 ≤10MB 的音频样本，即可克隆该声音朗读任意文本</li></ul>需先在 API Key 管理中配置小米 MiMo Key。' },
      { q: 'AI 绘画怎么用？', a: '「其他 → AI 绘画」输入画面描述即可生成图片。支持 OpenAI DALL·E、火山引擎 Seedream、通义万相，需配置对应厂商 Key。' },
      { q: '如何安装为 App？', a: '在「我的 → 安装为 App」一键安装（支持浏览器 PWA 安装的设备）；iOS 可在 Safari 菜单选择「添加到主屏幕」。安装后离线也能打开，数据仍在本地。' },
      { q: '模型旁的「新上线 / 已下架」标记？', a: '模型页支持一键「同步模型」，从已配置 Key 的厂商拉取最新模型列表：厂商新发布的模型会标记「新上线」，官方下架的模型标记「已下架」并置灰（仅供展示，不可再选择对话）。' },
      { q: '我的数据安全吗？', a: '全部对话、Key、设置仅存储在你本机浏览器的 localStorage 中，不经过任何第三方服务器（你的提问只会从浏览器直接发往对应 AI 厂商）。清除浏览器数据前，请先在「数据管理」导出备份。' }
    ];
    const cn = [], gl = [];
    Object.keys(PROVIDERS).forEach(p => (PROVIDERS[p].region === 'cn' ? cn : gl).push(p));
    const consoleRows = list => list.map(p =>
      '<div class="console-row">' + providerIconHtml(p, 20) + '<span class="console-name">' + esc(p) + '</span>' +
      '<a href="' + (CONSOLE_LINKS[p] || '#') + '" target="_blank" rel="noopener">' + esc(CONSOLE_LINKS[p] ? CONSOLE_LINKS[p].replace('https://', '') : (PROVIDERS[p].keyHint || '')) + '</a></div>').join('');
    $('#helpBody').innerHTML =
      '<div class="settings-card">' + faqs.map((f, i) =>
        '<div class="faq-item' + (i === 0 ? ' open' : '') + '"><button class="faq-q">' + esc(f.q) + '<span class="faq-arrow">' + icon('chevronRight', 15) + '</span></button>' +
        '<div class="faq-a">' + f.a + '</div></div>').join('') + '</div>' +
      '<div class="help-section-title">各厂商 API Key 申请入口（点击跳转控制台）</div>' +
      '<div class="help-section-title" style="padding-top:4px">国内厂商</div>' +
      '<div class="settings-card">' + consoleRows(cn) + '</div>' +
      '<div class="help-section-title">国外厂商</div>' +
      '<div class="settings-card">' + consoleRows(gl) + '</div>';
  }

  function bindHelpEvents() {
    $('#helpBody').addEventListener('click', e => {
      const q = e.target.closest('.faq-q');
      if (q) q.closest('.faq-item').classList.toggle('open');
    });
  }

  /* ---- 更新日志弹窗（时间线） ---- */
  function renderChangelogModal() {
    $('#changelogModalBody').innerHTML = '<div class="timeline">' + CHANGELOG.map(c =>
      '<div class="tl-item' + (c.major ? ' major' : '') + '">' +
      '<div class="tl-dot"></div>' +
      '<div class="tl-card">' +
      '<div class="tl-head"><span class="tl-ver">v' + esc(c.version) + '</span>' +
      (c.major ? '<span class="tl-badge">里程碑</span>' : '') +
      '<span class="tl-date">' + esc(c.date) + '</span></div>' +
      '<ul class="tl-list">' + c.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>' +
      '</div></div>').join('') + '</div>';
  }

  function bindChangelogEvents() {
    $('#changelogRow').addEventListener('click', () => {
      renderChangelogModal();
      $('#changelogModal').classList.add('show');
    });
    $('#changelogClose').addEventListener('click', () => $('#changelogModal').classList.remove('show'));
    $('#changelogModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
    });
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

  /* ==================== 语音工坊（小米 MiMo：合成/设计/克隆） ==================== */
  let vsMode = 'preset';

  function openVoiceStudio(mode) {
    vsMode = mode || 'preset';
    const key = getKeyForModel({ provider: '小米MiMo' });
    $('#vsNoKey').style.display = key ? 'none' : 'block';
    if (!key) $('#vsNoKey').innerHTML = I18n.t('vs.needMimo') +
      '<br><button class="btn btn-secondary btn-sm" id="vsGoKeys" style="margin-top:8px">' + icon('key', 14) + ' 去配置 Key</button>';
    $('#vsBody').style.opacity = key ? '1' : '.45';
    $('#vsBody').style.pointerEvents = key ? 'auto' : 'none';
    // 音色下拉
    $('#vsVoice').innerHTML = Voice.MIMO_VOICES.map(v => '<option value="' + esc(v.id) + '">' + esc(v.name) + '</option>').join('');
    syncVsTabs();
    $('#vsResult').style.display = 'none';
    $('#voiceStudioModal').classList.add('show');
  }

  function syncVsTabs() {
    $$('#voiceStudioModal .vs-tab').forEach(t => t.classList.toggle('active', t.dataset.vsmode === vsMode));
    $('#vsVoiceRow').style.display = vsMode === 'preset' ? 'block' : 'none';
    $('#vsStyleRow').style.display = vsMode === 'preset' ? 'block' : 'none';
    $('#vsDescRow').style.display = vsMode === 'design' ? 'block' : 'none';
    $('#vsSampleRow').style.display = vsMode === 'clone' ? 'block' : 'none';
  }

  function bindVoiceStudioEvents() {
    $('#vsClose').addEventListener('click', () => $('#voiceStudioModal').classList.remove('show'));
    $('#voiceStudioModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
      const go = e.target.closest('#vsGoKeys');
      if (go) { $('#voiceStudioModal').classList.remove('show'); UI.navigate('profile'); setTimeout(() => openSub('subKeys'), 120); }
    });
    $$('#voiceStudioModal .vs-tab').forEach(t => t.addEventListener('click', () => { vsMode = t.dataset.vsmode; syncVsTabs(); }));
    $('#vsGen').addEventListener('click', runVoiceStudio);
  }

  async function runVoiceStudio() {
    const text = $('#vsText').value.trim();
    if (!text) return Toast.warning('请输入要合成的文本');
    const key = getKeyForModel({ provider: '小米MiMo' });
    if (!key) return Toast.warning('请先配置小米 MiMo Key');
    const btn = $('#vsGen');
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = I18n.t('vs.generating');
    $('#vsResult').style.display = 'none';
    try {
      let body;
      if (vsMode === 'design') {
        const desc = $('#vsDesc').value.trim();
        if (!desc) { Toast.warning('请输入音色描述'); btn.disabled = false; btn.textContent = oldText; return; }
        body = {
          model: 'mimo-v2.5-tts-voicedesign',
          messages: [{ role: 'user', content: desc }, { role: 'assistant', content: text }],
          audio: { format: 'wav', voice: 'mimo_default' }
        };
      } else if (vsMode === 'clone') {
        const file = $('#vsSample').files[0];
        if (!file) { Toast.warning('请上传音频样本'); btn.disabled = false; btn.textContent = oldText; return; }
        if (file.size > 10 * 1024 * 1024) { Toast.warning('音频样本不能超过 10MB'); btn.disabled = false; btn.textContent = oldText; return; }
        const sampleUrl = await readFileAsDataURL(file);
        body = {
          model: 'mimo-v2.5-tts-voiceclone',
          messages: [{ role: 'assistant', content: text }],
          audio: { format: 'wav', voice: sampleUrl }
        };
      } else {
        const style = $('#vsStyle').value.trim();
        const msgs = style ? [{ role: 'user', content: style }, { role: 'assistant', content: text }] : [{ role: 'assistant', content: text }];
        body = {
          model: 'mimo-v2.5-tts',
          messages: msgs,
          audio: { format: 'wav', voice: $('#vsVoice').value || 'mimo_default' }
        };
      }
      const url = await Voice.mimoTtsUrl(text, key, body);
      const audio = $('#vsAudio');
      audio.src = url;
      $('#vsDownload').href = url;
      $('#vsResult').style.display = 'block';
      audio.play().catch(() => {});
      Toast.success('合成完成');
    } catch (e) {
      Toast.error('合成失败：' + e.message);
    }
    btn.disabled = false;
    btn.textContent = oldText;
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
    bindKeyEvents(); bindThemeEvents(); bindPluginEvents(); bindDataEvents(); bindAvatarEvents(); bindChangelogEvents();
    bindSubpageEvents(); bindVoiceEvents(); bindAsrEvents(); bindLangEvents(); bindHelpEvents(); bindVoiceStudioEvents();
    $('#installRow').addEventListener('click', () => { if (window.AppInstall) AppInstall.prompt(); });
    $('#logoutBtn').addEventListener('click', () => {
      confirmDialog('退出登录', '确定退出当前账号吗？对话记录将保留在本机。').then(ok => { if (ok) Auth.logout(); });
    });
    syncThemeCards();
  }

  function init() {
    bindModelsEvents();
    bindDiscoverEvents();
    bindPaintEvents();
    bindProfileEvents();
    // 语言切换时重渲染动态内容
    document.addEventListener('langchange', () => {
      renderRowDescs();
      if (Store.state.currentPage === 'models') renderModels();
      renderDiscover();
    });
  }

  return { init, renderModels, renderDiscover, renderProfile, syncThemeCards, openSub, closeSubs, openVoiceStudio };
})();
