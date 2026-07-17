/* ==================== UI · 渲染层 ==================== */
const UI = (() => {

  let msgObserverBound = false;
  const scheduleRender = {}; // msgId -> rAF 调度器

  /* ==================== 页面切换 ==================== */
  function showLogin() {
    $('#loginPage').classList.remove('hidden');
    $('#appShell').classList.add('hidden');
    document.title = '第三方科技 · AI 智能聚合平台';
  }

  function showApp() {
    $('#loginPage').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
    navigate(Store.state.currentPage || 'chat');
    renderSidebar();
    renderChat();
    updateModelSel();
    updateModeSel();
    renderModeConfig();
  }

  function navigate(page) {
    Store.state.currentPage = page;
    $$('.page').forEach(p => p.classList.remove('active'));
    const target = $('#page' + page.charAt(0).toUpperCase() + page.slice(1));
    if (target) target.classList.add('active');
    $$('[data-page]').forEach(n => n.classList.toggle('active', n.dataset.page === page));
    if (page === 'models') Pages.renderModels();
    if (page === 'discover') Pages.renderDiscover();
    if (page === 'profile') Pages.renderProfile();
    closeSidebarMobile();
  }

  /* ==================== 侧边栏 ==================== */
  function renderSidebar(filter) {
    const list = $('#sidebarList');
    const kw = (filter !== undefined ? filter : ($('#sidebarSearchInput').value || '')).trim();
    const chats = (Store.state.chats || []).filter(c => !kw || (c.title || '').toLowerCase().includes(kw.toLowerCase()));
    if (!chats.length) {
      list.innerHTML = '<div class="sidebar-empty">' + icon('messages', 34) + '<div>' + (kw ? '没有匹配的对话' : '暂无对话<br>点击右上角 + 开始新对话') + '</div></div>';
      return;
    }
    list.innerHTML = chats.map(c => {
      const active = c.id === Store.state.currentChatId ? ' active' : '';
      return '<div class="chat-item' + active + '" data-id="' + c.id + '">' +
        '<span class="item-icon">' + icon(MODE_META[c.mode] ? MODE_META[c.mode].icon : 'message', 15) + '</span>' +
        '<span class="chat-item-title">' + esc(c.title || '新对话') + '</span>' +
        '<span class="chat-item-meta">' + fmtTime(c.updatedAt) + '</span>' +
        '<button class="chat-item-del" data-del="' + c.id + '" title="删除">' + icon('trash', 13) + '</button>' +
        '</div>';
    }).join('');
  }

  function bindSidebarEvents() {
    $('#sidebarList').addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (del) {
        e.stopPropagation();
        confirmDialog('删除对话', '删除后无法恢复，确定删除该对话吗？', true).then(ok => { if (ok) Chat.del(del.dataset.del); });
        return;
      }
      const item = e.target.closest('.chat-item');
      if (item) Chat.load(item.dataset.id);
    });
    $('#sidebarSearchInput').addEventListener('input', debounce(e => renderSidebar(e.target.value), 180));
    $('#sidebarNewBtn').addEventListener('click', () => Chat.new());
    $('#exportHistoryBtn').addEventListener('click', () => {
      if (!Store.state.chats.length) return Toast.warning('暂无对话可导出');
      download('对话记录-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(Store.state.chats, null, 2), 'application/json');
      Toast.success('已导出 ' + Store.state.chats.length + ' 条对话');
    });
    $('#importHistoryBtn').addEventListener('click', () => $('#importHistoryFile').click());
    $('#importHistoryFile').addEventListener('change', async e => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await readFileAsText(file));
        const arr = Array.isArray(data) ? data : (data.chats || []);
        if (!arr.length) throw new Error('empty');
        Store.state.chats = arr.concat(Store.state.chats);
        Store.save();
        renderSidebar();
        Toast.success('已导入 ' + arr.length + ' 条对话');
      } catch (err) { Toast.error('导入失败：文件格式不正确'); }
    });
    $('#clearHistoryBtn').addEventListener('click', () => {
      if (!Store.state.chats.length) return Toast.warning('暂无对话');
      confirmDialog('清空全部对话', '将删除所有历史对话且无法恢复，确定继续吗？', true).then(ok => {
        if (ok) {
          Store.patch({ chats: [], currentChatId: null });
          renderSidebar(); renderChat();
          Toast.success('已清空');
        }
      });
    });
    // 桌面端折叠
    $('#sidebarToggle').addEventListener('click', () => {
      const sb = $('#sidebar');
      const collapsed = !sb.classList.contains('collapsed');
      sb.classList.toggle('collapsed', collapsed);
      $('#sidebarToggle').classList.toggle('collapsed', collapsed);
      Store.state.sidebarCollapsed = collapsed;
      Store.save();
    });
    // 移动端抽屉
    $('#hamburgerBtn').addEventListener('click', () => {
      $('#sidebar').classList.add('open');
      $('#sidebarOverlay').classList.add('show');
    });
    $('#sidebarOverlay').addEventListener('click', closeSidebarMobile);
  }

  function closeSidebarMobile() {
    $('#sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('show');
  }

  /* ==================== 模型选择器 ==================== */
  function updateModelSel() {
    const m = getModel(Store.state.currentModelId);
    $('#modelSelIcon').innerHTML = m ? providerIconHtml(m.provider, 19) : icon('cpu', 19);
    $('#modelSelLabel').textContent = m ? m.name : '选择模型';
  }

  function renderModelDD(filter) {
    const body = $('#modelDDBody');
    const kw = (filter || '').trim().toLowerCase();
    const recent = (Store.state.recentModels || []).map(getModel).filter(Boolean);
    let html = '';

    if (!kw && recent.length) {
      html += '<div class="dd-group-title">' + icon('history', 13) + ' 最近使用</div>';
      html += recent.map(m => ddItemHtml(m)).join('');
    }

    getProvidersInOrder().forEach(p => {
      const models = getProviderModels(p).filter(m =>
        !kw || m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw) || p.toLowerCase().includes(kw));
      if (!models.length) return;
      html += '<div class="dd-group-title">' + providerIconHtml(p, 15) + ' ' + esc(p) + '</div>';
      html += models.map(m => ddItemHtml(m)).join('');
    });

    body.innerHTML = html || '<div class="dd-empty">没有匹配的模型</div>';
  }

  function ddItemHtml(m) {
    const active = m.id === Store.state.currentModelId ? ' active' : '';
    let tags = '';
    if (m.vision) tags += '<span class="tag">识图</span>';
    if (m.thinking) tags += '<span class="tag">思考</span>';
    if (m.ctx >= 512) tags += '<span class="tag">长文</span>';
    return '<button class="dd-item' + active + '" data-model="' + m.id + '">' +
      providerIconHtml(m.provider, 20) +
      '<span class="dd-item-name">' + esc(m.name) + '</span>' +
      '<span class="dd-item-tags">' + tags + '</span></button>';
  }

  function bindModelDD() {
    const btn = $('#modelSelBtn'), dd = $('#modelDD');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = !dd.classList.contains('show');
      closeAllDropdowns();
      if (willOpen) {
        dd.classList.add('show');
        btn.classList.add('open');
        renderModelDD();
        $('#modelSearchInput').value = '';
        setTimeout(() => $('#modelSearchInput').focus(), 60);
      }
    });
    $('#modelSearchInput').addEventListener('input', debounce(e => renderModelDD(e.target.value), 150));
    $('#modelDDBody').addEventListener('click', e => {
      const item = e.target.closest('[data-model]');
      if (!item) return;
      Chat.selectModel(item.dataset.model);
      closeAllDropdowns();
    });
  }

  /* ==================== 模式选择器 ==================== */
  function updateModeSel() {
    const meta = MODE_META[Store.state.currentMode] || MODE_META.single;
    $('#modeIcon').innerHTML = icon(meta.icon, 16);
    $('#modeLabel').textContent = meta.label;
    $$('#modeDD .mode-dd-item').forEach(el => el.classList.toggle('active', el.dataset.mode === Store.state.currentMode));
  }

  function bindModeDD() {
    const btn = $('#modeSelBtn'), dd = $('#modeDD');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const willOpen = !dd.classList.contains('show');
      closeAllDropdowns();
      if (willOpen) { dd.classList.add('show'); btn.classList.add('open'); }
    });
    $$('#modeDD .mode-dd-item').forEach(el => {
      el.addEventListener('click', () => {
        Chat.selectMode(el.dataset.mode);
        closeAllDropdowns();
      });
    });
  }

  function closeAllDropdowns() {
    $$('.dropdown').forEach(d => d.classList.remove('show'));
    $$('.selector-btn').forEach(b => b.classList.remove('open'));
    $('#modelPickerDD').classList.remove('show');
  }

  /* ==================== 模式配置条 ==================== */
  function renderModeConfig() {
    const mode = Store.state.currentMode;
    const bar = $('#modeConfig');
    if (mode === 'single') { bar.style.display = 'none'; return; }
    bar.style.display = 'block';
    $('#multiConfig').style.display = mode === 'multi' ? 'block' : 'none';
    $('#debateConfig').style.display = mode === 'debate' ? 'block' : 'none';
    $('#collabConfig').style.display = mode === 'collab' ? 'block' : 'none';
    if (mode === 'multi') renderChips('multi');
    if (mode === 'debate') { renderChips('pro'); renderChips('con'); renderChips('judge'); }
    if (mode === 'collab') renderChips('collab');
    $('#debateRounds').value = Store.state.debateRounds;
    $('#debateFormat').value = Store.state.debateFormat;
    $('#collabRounds').value = Store.state.collabRounds;
  }

  const ROLE_STATE_KEY = { multi: 'multiModels', pro: 'debatePro', con: 'debateCon', judge: 'debateJudge', collab: 'collabModels' };
  const ROLE_CHIPS_ID = { multi: 'multiModelChips', pro: 'debateProChips', con: 'debateConChips', judge: 'debateJudgeChips', collab: 'collabModelChips' };

  function renderChips(role) {
    const box = $('#' + ROLE_CHIPS_ID[role]);
    const ids = Store.state[ROLE_STATE_KEY[role]] || [];
    box.innerHTML = ids.map(id => {
      const m = getModel(id);
      if (!m) return '';
      return '<span class="chip">' + providerIconHtml(m.provider, 16) + esc(m.name) +
        '<button class="chip-x" data-role="' + role + '" data-model="' + id + '" title="移除">' + icon('x', 10) + '</button></span>';
    }).join('');
  }

  let pickerRole = null;
  function openModelPicker(role) {
    pickerRole = role;
    const dd = $('#modelPickerDD');
    dd.classList.add('show');
    renderModelPicker('');
    setTimeout(() => $('#modelPickerSearch').focus(), 60);
  }

  function renderModelPicker(kw) {
    const body = $('#modelPickerBody');
    kw = (kw || '').trim().toLowerCase();
    let html = '';
    getProvidersInOrder().forEach(p => {
      const models = getProviderModels(p).filter(m => !kw || m.name.toLowerCase().includes(kw) || p.toLowerCase().includes(kw));
      if (!models.length) return;
      html += '<div class="dd-group-title">' + providerIconHtml(p, 15) + ' ' + esc(p) + '</div>';
      html += models.map(m => {
        const picked = (Store.state[ROLE_STATE_KEY[pickerRole]] || []).includes(m.id);
        return '<button class="dd-item' + (picked ? ' active' : '') + '" data-pick="' + m.id + '">' +
          providerIconHtml(m.provider, 20) + '<span class="dd-item-name">' + esc(m.name) + '</span>' +
          (picked ? icon('check', 15) : '') + '</button>';
      }).join('');
    });
    body.innerHTML = html || '<div class="dd-empty">没有匹配的模型</div>';
  }

  function bindModeConfigEvents() {
    document.addEventListener('click', e => {
      const addBtn = e.target.closest('.add-model-btn');
      if (addBtn) { e.stopImmediatePropagation(); openModelPicker(addBtn.dataset.role); return; }
      const chipX = e.target.closest('.chip-x');
      if (chipX) { e.stopImmediatePropagation(); Chat.removeFromRole(chipX.dataset.role, chipX.dataset.model); return; }
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        e.stopImmediatePropagation();
        Chat.addToRole(pickerRole, pick.dataset.pick);
        renderModelPicker($('#modelPickerSearch').value);
      }
    });
    $('#modelPickerSearch').addEventListener('input', debounce(e => renderModelPicker(e.target.value), 150));
    $('#debateRounds').addEventListener('change', e => { Store.state.debateRounds = Math.max(1, Math.min(10, +e.target.value || 2)); Store.save(); });
    $('#debateFormat').addEventListener('change', e => { Store.state.debateFormat = e.target.value; Store.save(); });
    $('#collabRounds').addEventListener('change', e => { Store.state.collabRounds = Math.max(1, Math.min(5, +e.target.value || 2)); Store.save(); });
  }

  /* ==================== 对话渲染 ==================== */
  function renderWelcome() {
    const box = $('#chatContainer');
    const cards = [
      { icon: 'message', t: '开始对话', d: '与任意 AI 模型聊天', act: 'focus' },
      { icon: 'grid', t: '多模型对比', d: '多个模型同题竞技', act: 'multi' },
      { icon: 'sword', t: '辩论模式', d: '正反交锋，裁判点评', act: 'debate' },
      { icon: 'sparkles', t: '探索助手', d: '角色预设与 AI 工具', act: 'discover' }
    ];
    box.innerHTML = '<div class="welcome"><div class="welcome-logo">' + icon('sparkles', 32) + '</div>' +
      '<h2>第三方科技 · AI 聚合平台</h2>' +
      '<p>150+ 模型一站通达 · 四种对话模式 · 支持语音 / 文件 / 联网 / 绘画</p>' +
      '<div class="welcome-cards">' + cards.map(c =>
        '<button class="welcome-card" data-act="' + c.act + '">' + icon(c.icon, 17) + '<span>' + c.t + '<small>' + c.d + '</small></span></button>').join('') +
      '</div></div>';
    $$('.welcome-card', box).forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'focus') $('#chatInput').focus();
      else if (act === 'discover') navigate('discover');
      else Chat.selectMode(act);
    }));
  }

  function renderChat() {
    const box = $('#chatContainer');
    const chat = Chat.getCurrentChat();
    Object.keys(scheduleRender).forEach(k => delete scheduleRender[k]);
    if (!chat || !chat.messages || !chat.messages.length) { renderWelcome(); return; }

    let html = '';
    let i = 0;
    const msgs = chat.messages;
    while (i < msgs.length) {
      const m = msgs[i];
      if (m.role === 'assistant' && m.batchId) {
        // 多模型批次：收集同批次消息渲染网格
        const batch = [];
        let j = i;
        while (j < msgs.length && msgs[j].role === 'assistant' && msgs[j].batchId === m.batchId) { batch.push(msgs[j]); j++; }
        html += multiGridHtml(batch);
        i = j;
        continue;
      }
      html += msgHtml(m);
      i++;
    }
    box.innerHTML = html;
    afterRender(box);
    scrollToBottom(true);
  }

  function msgHtml(m) {
    if (m.role === 'user') {
      const av = userAvatarHtml();
      return '<div class="msg user" data-id="' + m.id + '">' +
        '<div class="msg-avatar">' + av + '</div>' +
        '<div class="msg-body"><div class="msg-head"><span class="msg-author">' + esc(Store.state.userInfo && Store.state.userInfo.name || '我') + '</span><span class="msg-time">' + fmtTime(m.ts) + '</span></div>' +
        (m.image ? '<img class="msg-image" src="' + m.image + '" alt="图片">' : '') +
        '<div class="msg-content">' + esc(m.content) + '</div>' +
        '<div class="msg-actions">' +
        '<button class="msg-action" data-act="copy" title="复制">' + icon('copy', 14) + '</button>' +
        '<button class="msg-action" data-act="edit" title="编辑重发">' + icon('edit', 14) + '</button>' +
        '<button class="msg-action danger" data-act="del" title="删除">' + icon('trash', 14) + '</button>' +
        '</div></div></div>';
    }
    // assistant
    const model = getModel(m.modelId);
    const name = model ? model.name : 'AI';
    let sideTag = '';
    if (m.debateRole === 'pro') sideTag = '<span class="side-tag pro">正方</span>';
    if (m.debateRole === 'con') sideTag = '<span class="side-tag con">反方</span>';
    if (m.debateRole === 'judge') sideTag = '<span class="side-tag judge">裁判</span>';
    if (m.collabRole === 'leader') sideTag = '<span class="side-tag judge">主持</span>';
    if (m.collabRole === 'worker') sideTag = '<span class="side-tag pro">协作者</span>';

    return '<div class="msg assistant" data-id="' + m.id + '">' +
      '<div class="msg-avatar">' + (model ? providerIconHtml(model.provider, 22) : icon('bot', 18)) + '</div>' +
      '<div class="msg-body"><div class="msg-head"><span class="msg-author">' + esc(name) + '</span>' + sideTag +
      '<span class="msg-time">' + fmtTime(m.ts) + '</span></div>' +
      (m.stage ? '<div class="debate-stage">' + esc(m.stage) + '</div>' : '') +
      '<div class="thinking-slot">' + (m.thinking ? thinkingHtml(m.thinking, false) : '') + '</div>' +
      '<div class="msg-content-slot">' + (m.error ? errorHtml(m.error) : (m.content ? MD.render(m.content) : '')) + '</div>' +
      '<div class="msg-actions">' +
      '<button class="msg-action" data-act="copy" title="复制">' + icon('copy', 14) + '</button>' +
      '<button class="msg-action" data-act="regen" title="重新生成">' + icon('refresh', 14) + '</button>' +
      '<button class="msg-action" data-act="speak" title="朗读">' + icon('volume', 14) + '</button>' +
      '<button class="msg-action danger" data-act="del" title="删除">' + icon('trash', 14) + '</button>' +
      '</div></div></div>';
  }

  function multiGridHtml(batch) {
    return '<div class="msg assistant"><div class="msg-body"><div class="multi-grid">' +
      batch.map(m => {
        const model = getModel(m.modelId);
        return '<div class="multi-card" data-id="' + m.id + '">' +
          '<div class="multi-card-head">' + (model ? providerIconHtml(model.provider, 18) : icon('bot', 16)) +
          '<span>' + esc(model ? model.name : 'AI') + '</span>' +
          '<div class="msg-actions always">' +
          '<button class="msg-action" data-act="copy" title="复制">' + icon('copy', 13) + '</button>' +
          '<button class="msg-action" data-act="regen" title="重新生成">' + icon('refresh', 13) + '</button>' +
          '</div></div>' +
          '<div class="thinking-slot">' + (m.thinking ? thinkingHtml(m.thinking, false) : '') + '</div>' +
          '<div class="multi-card-body msg-content-slot">' + (m.error ? errorHtml(m.error) : (m.content ? MD.render(m.content) : '')) + '</div>' +
          '</div>';
      }).join('') + '</div></div></div>';
  }

  function thinkingHtml(text, live) {
    return '<div class="thinking-box' + (live ? ' live' : '') + '">' +
      '<button class="thinking-toggle">' + icon('brain', 14) + '<span>思考过程</span><span class="chevron">' + icon('chevronDown', 13) + '</span></button>' +
      '<div class="thinking-content">' + esc(text) + '</div></div>';
  }

  function errorHtml(err) {
    return '<div class="msg-error">' + icon('zap', 16) + '<span>' + esc(err) + '</span></div>';
  }

  /* 渲染后处理：思考折叠、数学公式、灯箱 */
  function afterRender(root) {
    $$('.thinking-toggle', root).forEach(t => {
      if (t.dataset.bound) return;
      t.dataset.bound = '1';
      t.addEventListener('click', () => t.closest('.thinking-box').classList.toggle('open'));
    });
    $$('.msg-content-slot', root).forEach(el => MD.renderMath(el));
    $$('.msg-image', root).forEach(img => {
      if (img.dataset.bound) return;
      img.dataset.bound = '1';
      img.addEventListener('click', () => openLightbox(img.src));
    });
  }

  function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<img src="' + src + '">';
    lb.addEventListener('click', () => lb.remove());
    document.body.appendChild(lb);
  }

  /* ==================== 流式更新 ==================== */
  function appendMsg(m) {
    // 欢迎页 → 清空
    if ($('.welcome')) $('#chatContainer').innerHTML = '';
    if (m.role === 'assistant' && m.batchId) {
      // 多模型：找到/创建批次网格
      let grid = $('#chatContainer [data-batch="' + m.batchId + '"] .multi-grid');
      if (!grid) {
        $('#chatContainer').insertAdjacentHTML('beforeend', '<div class="msg assistant" data-batch="' + m.batchId + '"><div class="msg-body"><div class="multi-grid"></div></div></div>');
        grid = $('#chatContainer [data-batch="' + m.batchId + '"] .multi-grid');
      }
      grid.insertAdjacentHTML('beforeend', multiCardHtml(m));
    } else {
      $('#chatContainer').insertAdjacentHTML('beforeend', msgHtml(m));
    }
    scrollToBottom();
  }

  function multiCardHtml(m) {
    const model = getModel(m.modelId);
    return '<div class="multi-card" data-id="' + m.id + '">' +
      '<div class="multi-card-head">' + (model ? providerIconHtml(model.provider, 18) : icon('bot', 16)) +
      '<span>' + esc(model ? model.name : 'AI') + '</span>' +
      '<div class="msg-actions always">' +
      '<button class="msg-action" data-act="copy" title="复制">' + icon('copy', 13) + '</button>' +
      '<button class="msg-action" data-act="regen" title="重新生成">' + icon('refresh', 13) + '</button>' +
      '</div></div>' +
      '<div class="thinking-slot"></div><div class="multi-card-body msg-content-slot"><span class="loading-dots"><span></span><span></span><span></span></span></div></div>';
  }

  function setMsgContent(id, text) {
    if (!scheduleRender[id]) {
      scheduleRender[id] = makeRafScheduler((el, t) => {
        el.innerHTML = MD.render(t) + '<span class="stream-cursor"></span>';
        scrollToBottom();
      });
    }
    const slot = $('#chatContainer [data-id="' + id + '"] .msg-content-slot');
    if (slot) scheduleRender[id](slot, text);
  }

  function setMsgThinking(id, text) {
    const slot = $('#chatContainer [data-id="' + id + '"] .thinking-slot');
    if (!slot) return;
    const existing = $('.thinking-box', slot);
    if (existing) {
      $('.thinking-content', existing).textContent = text;
    } else {
      slot.innerHTML = thinkingHtml(text, true);
      const toggle = $('.thinking-toggle', slot);
      toggle.addEventListener('click', () => toggle.closest('.thinking-box').classList.toggle('open'));
    }
    scrollToBottom();
  }

  function finishMsg(id, content) {
    delete scheduleRender[id];
    const card = $('#chatContainer [data-id="' + id + '"]');
    if (!card) return;
    const slot = $('.msg-content-slot', card);
    if (slot) {
      slot.innerHTML = content ? MD.render(content) : '<span style="color:var(--text-3);font-size:13px">（无内容）</span>';
      MD.renderMath(slot);
      $$('.msg-image', slot).forEach(img => img.addEventListener('click', () => openLightbox(img.src)));
    }
    const think = $('.thinking-box', card);
    if (think) think.classList.remove('live');
    scrollToBottom();
  }

  function setMsgError(id, err) {
    delete scheduleRender[id];
    const slot = $('#chatContainer [data-id="' + id + '"] .msg-content-slot');
    if (slot) slot.innerHTML = errorHtml(err);
    scrollToBottom();
  }

  /* ==================== 消息操作 ==================== */
  function bindChatEvents() {
    const box = $('#chatContainer');
    MD.bindCopy(box);
    box.addEventListener('click', e => {
      const btn = e.target.closest('.msg-action');
      if (!btn) return;
      const card = btn.closest('[data-id]');
      if (!card) return;
      const id = card.dataset.id;
      const act = btn.dataset.act;
      const chat = Chat.getCurrentChat();
      const msg = chat && chat.messages.find(x => x.id === id);
      if (!msg) return;

      if (act === 'copy') copyText(msg.content || '').then(() => Toast.success('已复制'));
      else if (act === 'del') Chat.delMsg(id);
      else if (act === 'regen') Chat.regenerate(id);
      else if (act === 'edit') Chat.editUserMsg(id);
      else if (act === 'speak') {
        if (Voice.isSpeaking(id)) Voice.stopSpeak();
        else Voice.speak(msg.content || '', id);
      }
    });
  }

  function updateSpeakButtons() {
    $$('#chatContainer .msg-action[data-act="speak"]').forEach(btn => {
      const card = btn.closest('[data-id]');
      const speaking = card && Voice.isSpeaking(card.dataset.id);
      btn.classList.toggle('speaking', !!speaking);
      btn.innerHTML = icon(speaking ? 'volumeOff' : 'volume', 14);
      btn.title = speaking ? '停止朗读' : '朗读';
    });
  }

  /* ==================== 输入区 ==================== */
  function bindInputEvents() {
    const input = $('#chatInput');
    input.addEventListener('input', () => {
      autoResize(input);
      $('#charCount').textContent = input.value.length + ' 字';
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        Chat.send();
      }
    });
    input.addEventListener('paste', e => {
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          e.preventDefault();
          const file = it.getAsFile();
          if (file) Chat.addAttachment(file);
          break;
        }
      }
    });

    $('#sendBtn').addEventListener('click', () => Chat.isSending() ? Chat.stop() : Chat.send());
    $('#attachBtn').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', e => {
      Array.from(e.target.files).forEach(f => Chat.addAttachment(f));
      e.target.value = '';
    });

    // 语音输入
    $('#micBtn').addEventListener('click', () => {
      if (Voice.isRecognizing()) { Voice.stopInput(); return; }
      const input = $('#chatInput');
      let baseText = input.value;
      const ok = Voice.startInput(
        (final, interim) => {
          input.value = baseText + final + interim;
          if (final) baseText += final;
          autoResize(input);
          $('#charCount').textContent = input.value.length + ' 字';
        },
        () => updateMicBtn()
      );
      if (ok) updateMicBtn();
    });

    // 联网开关
    $('#webSearchBtn').addEventListener('click', () => {
      const ws = Store.state.webSearch;
      if (!ws.enabled && !ws.tavilyKey) {
        Toast.warning('请先在「我的 → 插件」中配置 Tavily 搜索 Key');
        return;
      }
      ws.enabled = !ws.enabled;
      Store.save();
      updateWebSearchBtn();
      Toast.info(ws.enabled ? '联网搜索已开启' : '联网搜索已关闭');
    });
  }

  function updateMicBtn() {
    $('#micBtn').classList.toggle('recording', Voice.isRecognizing());
    $('#micBtn').innerHTML = icon(Voice.isRecognizing() ? 'micOff' : 'mic', 19);
  }

  function updateWebSearchBtn() {
    const on = Store.state.webSearch.enabled;
    $('#webSearchBtn').classList.toggle('toggled', on);
    $('#webSearchBadge').classList.toggle('hidden', !on);
  }

  function setSending(sending) {
    const btn = $('#sendBtn');
    btn.classList.toggle('stop', sending);
    btn.innerHTML = icon(sending ? 'stop' : 'send', 18);
    btn.title = sending ? '停止生成 (Esc)' : '发送';
    $('#chatInput').placeholder = sending ? 'AI 正在回复中，点击 ⏹ 可停止…' : '输入消息… (Enter 发送, Shift+Enter 换行)';
  }

  function renderAttachments() {
    const bar = $('#attachPreview');
    const at = Chat.attachments;
    let html = '';
    if (at.image) {
      html += '<div class="attach-item"><img src="' + at.image.dataUrl + '"><span class="attach-item-name">' + esc(at.image.name) + '</span>' +
        '<button class="attach-item-x" data-remove="image">' + icon('x', 10) + '</button></div>';
    }
    at.files.forEach((f, i) => {
      html += '<div class="attach-item">' + icon('fileText', 16) + '<span class="attach-item-name">' + esc(f.name) + '</span>' +
        '<button class="attach-item-x" data-remove="file:' + i + '">' + icon('x', 10) + '</button></div>';
    });
    bar.innerHTML = html;
    $$('.attach-item-x', bar).forEach(b => b.addEventListener('click', () => Chat.removeAttachment(b.dataset.remove)));
  }

  /* ==================== 滚动 ==================== */
  let userScrolledUp = false;
  function bindScroll() {
    $('#chatScroll').addEventListener('scroll', () => {
      const el = $('#chatScroll');
      userScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
    }, { passive: true });
  }

  function scrollToBottom(force) {
    const el = $('#chatScroll');
    if (!el) return;
    if (force || !userScrolledUp) {
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    }
  }

  /* ==================== 头像 ==================== */
  function userAvatarHtml() {
    const av = Store.state.avatar;
    if (av && av.type === 'image' && av.data) return '<img src="' + av.data + '" alt="">';
    const grad = AVATAR_GRADS[(av && av.idx) || 0] || AVATAR_GRADS[0];
    const name = (Store.state.userInfo && Store.state.userInfo.name) || '我';
    return '<span style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:' + grad + ';color:#fff;font-weight:800;font-size:14px;border-radius:11px">' + esc(name.charAt(0).toUpperCase()) + '</span>';
  }

  const AVATAR_GRADS = [
    'linear-gradient(135deg,#6366F1,#8B5CF6)', 'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    'linear-gradient(135deg,#10B981,#34D399)', 'linear-gradient(135deg,#F59E0B,#F97316)',
    'linear-gradient(135deg,#EC4899,#F472B6)', 'linear-gradient(135deg,#EF4444,#F87171)',
    'linear-gradient(135deg,#14B8A6,#2DD4BF)', 'linear-gradient(135deg,#64748B,#94A3B8)'
  ];

  /* ==================== 主题 ==================== */
  function applyTheme() {
    const t = Store.state.theme || 'system';
    const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0D0E13' : '#F5F6F8');
    const btn = $('#themeBtn');
    if (btn) btn.innerHTML = icon(dark ? 'sun' : 'moon', 19);
  }

  /* ==================== 初始化绑定 ==================== */
  function init() {
    bindSidebarEvents();
    bindModelDD();
    bindModeDD();
    bindModeConfigEvents();
    bindChatEvents();
    bindInputEvents();
    bindScroll();

    // 全局点击关闭下拉
    document.addEventListener('click', e => {
      if (!e.target.closest('.selector') && !e.target.closest('.mode-config')) closeAllDropdowns();
      else if (!e.target.closest('.selector') && !e.target.closest('#modelPickerDD') && !e.target.closest('.add-model-btn')) {
        $('#modelPickerDD').classList.remove('show');
      }
    });

    // 主题
    $('#themeBtn').addEventListener('click', () => {
      const order = ['light', 'dark', 'system'];
      const cur = Store.state.theme || 'system';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      Store.state.theme = next;
      Store.save();
      applyTheme();
      Toast.info('主题：' + (next === 'light' ? '亮色' : next === 'dark' ? '暗色' : '跟随系统'));
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    // 导航（底部 + 顶栏）
    $$('[data-page]').forEach(n => n.addEventListener('click', () => navigate(n.dataset.page)));

    // 快捷键
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { Chat.stop(); Voice.stopInput(); closeAllDropdowns(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); Chat.new(); }
      if ((e.ctrlKey || e.metaKey) && e.key === '/') { e.preventDefault(); $('#chatInput').focus(); }
    });
  }

  return {
    showLogin, showApp, navigate, init,
    renderSidebar, renderChat, renderWelcome, appendMsg,
    setMsgContent, setMsgThinking, finishMsg, setMsgError,
    updateModelSel, updateModeSel, renderModeConfig, renderChips,
    setSending, renderAttachments, updateMicBtn, updateWebSearchBtn, updateSpeakButtons,
    scrollToBottom, applyTheme, userAvatarHtml, AVATAR_GRADS, openLightbox
  };
})();
