// ==================== CHAT LOGIC ====================

function selectModel(id) {
  state.currentModelId = id;
  const chat = getCurrentChat();
  if (chat) { chat.modelId = id; saveState(); }
  updateModelSelector();
  const dd = document.getElementById('modelDropdown');
  if (dd) dd.classList.remove('show');
  document.getElementById('modelSelectorBtn')?.classList.remove('open');
}

function selectMode(mode) {
  currentMode = mode;
  updateModeSelector();
  setInputAreaMode();
  const dd = document.getElementById('modeDropdown');
  if (dd) dd.classList.remove('show');
  document.getElementById('modeSelectorBtn')?.classList.remove('open');
}

function loadChat(id) {
  state.currentChatId = id;
  saveState();
  const chat = getCurrentChat();
  if (chat) {
    state.currentModelId = chat.modelId || state.currentModelId;
    updateModelSelector();
  }
  renderSidebarList();
  renderChatUI();
  document.getElementById('sidebar')?.classList.remove('show');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
}

function deleteChat(id) {
  if (!confirm('确定删除此对话？')) return;
  state.chats = state.chats.filter(c => c.id !== id);
  if (state.currentChatId === id) { state.currentChatId = null; }
  saveState();
  renderSidebarList();
  if (!state.currentChatId) { renderChatUI(); }
}

function newChat() {
  const id = genId();
  const chat = { id: id, title: '新对话', modelId: state.currentModelId, messages: [], createdAt: Date.now(), updatedAt: Date.now() };
  state.chats.unshift(chat);
  state.currentChatId = id;
  saveState();
  renderSidebarList();
  renderChatUI();
  document.getElementById('sidebar')?.classList.remove('show');
  document.getElementById('sidebarOverlay')?.classList.remove('show');
}

function quickStart(type) {
  if (type === '单模型') { selectMode('single'); }
  else if (type === '多模型') { selectMode('multi'); }
  else if (type === '辩论') { selectMode('debate'); }
  else if (type === '协同') { selectMode('collab'); }
  document.getElementById('msgInput')?.focus();
}

function addMultiModel(id) { addToArray(state, 'multiModels', id); setInputAreaMode(); saveState(); }
function removeMultiModel(id) { removeFromArray(state, 'multiModels', id); setInputAreaMode(); saveState(); }
function addDebateModel(side, id) { addToArray(state, 'debate' + side[0].toUpperCase() + side.slice(1) + 's', id); setInputAreaMode(); saveState(); }
function removeDebatePro(id) { removeFromArray(state, 'debatePro', id); setInputAreaMode(); saveState(); }
function removeDebateCon(id) { removeFromArray(state, 'debateCon', id); setInputAreaMode(); saveState(); }
function removeDebateJudge(id) { removeFromArray(state, 'debateJudge', id); setInputAreaMode(); saveState(); }
function addCollabModel(id) { addToArray(state, 'collabModels', id); setInputAreaMode(); saveState(); }
function removeCollabModel(id) { removeFromArray(state, 'collabModels', id); setInputAreaMode(); saveState(); }

function addToArray(obj, key, val) { if (!obj[key]) obj[key] = []; if (obj[key].indexOf(val) === -1) { obj[key].push(val); } }
function removeFromArray(obj, key, val) { if (obj[key]) obj[key] = obj[key].filter(v => v !== val); }

function copyMsg(id) {
  const chat = getCurrentChat(); if (!chat) return;
  const msg = chat.messages.find(m => m.id === id); if (!msg) return;
  navigator.clipboard.writeText(msg.content).then(() => showToast('消息已复制', 'success'));
}

function regenerateMsg(id) {
  const chat = getCurrentChat(); if (!chat) return;
  const idx = chat.messages.findIndex(m => m.id === id); if (idx < 0) return;
  const userMsg = chat.messages[idx - 1];
  if (!userMsg || userMsg.role !== 'user') { showToast('找不到对应用户消息', 'warning'); return; }
  sendMessage(userMsg.content, true);
}

function deleteMsg(id) {
  const chat = getCurrentChat(); if (!chat) return;
  if (!confirm('确定删除此消息？')) return;
  chat.messages = chat.messages.filter(m => m.id !== id);
  saveState();
  renderChatUI();
}

function sendMessage(content, force) {
  const chat = ensureChat();
  if (!content) content = document.getElementById('msgInput')?.value?.trim() || '';
  if (!content && !imageData) return;
  if (!content) return;

  const userMsg = { id: genId(), role: 'user', content: content, timestamp: Date.now(), modelId: state.currentModelId };
  chat.messages.push(userMsg);
  chat.updatedAt = Date.now();
  if (!chat.title || chat.title === '新对话') chat.title = generateTitle(content);
  saveState();
  appendMessageEl(userMsg);
  renderSidebarList();
  document.getElementById('msgInput').value = '';
  autoResize(document.getElementById('msgInput'));
  if (imageData) { clearImage(); }

  switch (currentMode) {
    case 'single': sendSingle(content); break;
    case 'multi': sendMulti(content); break;
    case 'debate': sendDebate(content); break;
    case 'collab': sendCollab(content); break;
  }
}

function sendSingle(content) {
  const chat = getCurrentChat();
  if (!chat) return;
  const m = getModel(state.currentModelId) || getModel(DEFAULT_MODEL_ID);
  const msgId = genId();
  let contentBuffer = '';
  let thinkBuffer = '';
  let typer = null;

  const aiMsg = {
    id: msgId, role: 'assistant', content: '', thinking: '',
    timestamp: Date.now(), modelId: state.currentModelId, isNew: true
  };
  chat.messages.push(aiMsg);
  chat.updatedAt = Date.now();
  saveState();
  appendMessageEl(aiMsg);

  const msgs = buildMessages(chat, content, imageData);

  callChatAPI(msgs, state.currentModelId,
    (chunk, full) => {
      if (stopRequested) return;
      contentBuffer = full;
      if (!typer) {
        typer = createTypewriter(
          null,
          (c) => {
            aiMsg.content = contentBuffer;
            updateMessageEl(msgId, contentBuffer);
          },
          () => {}
        );
      }
      typer.add(chunk);
    },
    (think, fullThink) => {
      thinkBuffer = fullThink;
      aiMsg.thinking = thinkBuffer;
      updateMessageThinking(msgId, thinkBuffer);
    }
  ).then(() => {
    if (typer) typer.flush();
    removeMessageCursor(msgId);
    aiMsg.content = contentBuffer;
    aiMsg.thinking = thinkBuffer;
    saveState();
    renderSidebarList();
  }).catch(err => {
    removeMessageCursor(msgId);
    aiMsg.content = '❌ ' + err.message;
    saveState();
    updateMessageEl(msgId, aiMsg.content);
    showToast(err.message, 'error');
  }).finally(() => {
    isSending = false; stopRequested = false;
    updateSendBtn();
  });
}

function sendMulti(content) {
  const models = state.multiModels || [];
  if (models.length === 0) { showToast('请先在模式配置中选择至少一个模型', 'warning'); return; }
  const chat = ensureChat();
  if (!chat) return;
  showMultiGrid(models);
  stopRequested = false;
  isSending = true;
  updateSendBtn();

  const promises = models.map(id => {
    const m = getModel(id); if (!m) return Promise.resolve();
    const key = getKeyForModel(m); if (!key) { setMultiStatus(id, '未配置Key'); return Promise.resolve(); }
    const msgId = genId();
    const aiMsg = { id: msgId, role: 'assistant', content: '', modelId: id, timestamp: Date.now() };
    chat.messages.push(aiMsg);
    const msgs = buildMessages(chat, content, imageData);
    return callChatAPI(msgs, id,
      (chunk, full) => { if (stopRequested) return; aiMsg.content = full; updateMultiCard(id, full); },
      null
    ).then(() => { setMultiStatus(id, '完成'); aiMsg.content = full; saveState(); })
    .catch(err => { setMultiStatus(id, '错误'); aiMsg.content = '❌ ' + err.message; saveState(); });
  });
  Promise.all(promises).finally(() => { isSending = false; stopRequested = false; updateSendBtn(); });
}

function sendDebate(content) {
  const dp = state.debatePro || [], dc = state.debateCon || [], dj = state.debateJudge || [];
  if (dp.length === 0 || dc.length === 0) { showToast('请配置正方和反方模型', 'warning'); return; }
  const rounds = Math.min(parseInt(document.getElementById('debateRounds')?.value || 3), 10);
  const chat = ensureChat(); if (!chat) return;
  stopRequested = false; isSending = true; updateSendBtn();
  let round = 1;
  function runRound() {
    if (stopRequested || round > rounds) { if (dj.length > 0) runJudge(); else finishDebate(); return; }
    showDebateRound(round);
    const promises = [];
    for (let i = 0; i < dp.length; i++) promises.push(debateTurn(dp[i], 'pro', round, content));
    for (let i = 0; i < dc.length; i++) promises.push(debateTurn(dc[i], 'con', round, content));
    Promise.all(promises).then(() => { round++; if (round <= rounds && !stopRequested) runRound(); else if (dj.length > 0) runJudge(); else finishDebate(); });
  }
  runRound();
  function runJudge() {
    const promises = [];
    for (let i = 0; i < dj.length; i++) promises.push(debateTurn(dj[i], 'judge', rounds + 1, content));
    Promise.all(promises).then(() => finishDebate());
  }
  function finishDebate() { isSending = false; stopRequested = false; updateSendBtn(); showToast('辩论结束', 'info'); }
}

function debateTurn(modelId, side, round, topic) {
  const chat = getCurrentChat(); if (!chat) return Promise.resolve();
  const m = getModel(modelId); if (!m) return Promise.resolve();
  const key = getKeyForModel(m); if (!key) return Promise.resolve();
  const msgId = genId();
  const aiMsg = { id: msgId, role: 'assistant', content: '', modelId: modelId, timestamp: Date.now() };
  chat.messages.push(aiMsg);

  const sideNames = { pro: '正方', con: '反方', judge: '裁判' };
  const prompts = {
    pro: '你是正方辩手。辩论主题：' + topic + '。这是第' + round + '轮。请从支持该观点的角度进行论述。',
    con: '你是反方辩手。辩论主题：' + topic + '。这是第' + round + '轮。请从反对该观点的角度进行论述。',
    judge: '你是辩论裁判。请对以上辩论进行总结和评判，给出你的观点。'
  };

  return callChatAPI([{ role: 'user', content: prompts[side] }], modelId,
    (chunk, full) => { if (stopRequested) return; aiMsg.content = full; appendMessageEl(aiMsg); }
  ).then(() => { aiMsg.content = full; saveState(); })
  .catch(err => { aiMsg.content = '❌ ' + err.message; saveState(); });
}

function sendCollab(content) {
  const models = state.collabModels || [];
  if (models.length === 0) { showToast('请配置协作模型', 'warning'); return; }
  const chat = ensureChat(); if (!chat) return;
  stopRequested = false; isSending = true; updateSendBtn();
  let responses = [];
  function nextStep(step) {
    if (stopRequested || step >= models.length) { showCollabSummary(responses); finish(); return; }
    const m = getModel(models[step]); if (!m) { nextStep(step + 1); return; }
    const key = getKeyForModel(m); if (!key) { nextStep(step + 1); return; }
    const prompt = step === 0 ? '请分析以下问题：' + content : '基于之前分析：' + responses.join(' | ') + '，请进一步补充和完善。';
    const msgId = genId();
    const aiMsg = { id: msgId, role: 'assistant', content: '', modelId: models[step], timestamp: Date.now() };
    chat.messages.push(aiMsg);
    return callChatAPI([{ role: 'user', content: prompt }], models[step],
      (chunk, full) => { if (stopRequested) return; aiMsg.content = full; appendMessageEl(aiMsg); }
    ).then(() => { responses.push(aiMsg.content); saveState(); nextStep(step + 1); })
    .catch(() => { nextStep(step + 1); });
  }
  nextStep(0);
  function finish() { isSending = false; stopRequested = false; updateSendBtn(); }
}

function showCollabSummary(responses) {
  const chat = getCurrentChat(); if (!chat) return;
  const summaryId = genId();
  const summaryMsg = { id: summaryId, role: 'assistant', content: '', timestamp: Date.now(), modelId: 'summary' };
  chat.messages.push(summaryMsg);
  appendMessageEl(summaryMsg);
  summaryMsg.content = '**协同总结**\n\n' + responses.map((r, i) => '**模型' + (i + 1) + '：** ' + r.slice(0, 500) + (r.length > 500 ? '...' : '')).join('\n\n');
  saveState();
  updateMessageEl(summaryId, summaryMsg.content);
}

function showDebateRound(round) {
  const chat = getCurrentChat(); if (!chat) return;
  const dividerId = genId();
  const dividerMsg = { id: dividerId, role: 'assistant', content: '**第 ' + round + ' 轮**', timestamp: Date.now(), modelId: 'divider' };
  chat.messages.push(dividerMsg);
  appendMessageEl(dividerMsg);
  saveState();
}

function updateSendBtn() {
  const btn = document.getElementById('sendBtn');
  if (!btn) return;
  if (isSending) { btn.classList.add('stop'); btn.textContent = '⏹'; btn.title = '停止'; } else { btn.classList.remove('stop'); btn.textContent = '➤'; btn.title = '发送'; }
}

function handleSend() {
  const btn = document.getElementById('sendBtn');
  if (isSending) { stopGeneration(); return; }
  const input = document.getElementById('msgInput');
  if (!input) return;
  const content = input.value.trim();
  if (!content) return;
  sendMessage(content);
}

function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function handleAttach() {
  document.getElementById('fileInput')?.click();
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]; if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('仅支持图片文件', 'warning'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    imageData = { base64: reader.result.split(',')[1], mimeType: file.type, name: file.name };
    const bar = document.getElementById('imagePreviewBar');
    if (bar) { bar.innerHTML = '<div class="img-preview"><img src="' + reader.result + '" alt=""><span>' + file.name + '</span><span class="img-x" onclick="clearImage()">×</span></div>'; bar.classList.remove('hidden'); }
    const btn = document.getElementById('attachBtn');
    if (btn) btn.classList.add('has-file');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function clearImage() {
  imageData = null;
  const bar = document.getElementById('imagePreviewBar');
  if (bar) { bar.innerHTML = ''; bar.classList.add('hidden'); }
  const btn = document.getElementById('attachBtn');
  if (btn) btn.classList.remove('has-file');
}
