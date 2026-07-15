// ==================== STORAGE ====================
const STORAGE_KEY = 'ai_chat_state_v4';
const USERS_KEY = 'ai_users_v4';

let state = {
  loggedIn: false,
  currentChatId: null,
  currentModelId: 'mimo-v2.5-pro',
  chats: [],
  theme: 'light',
  apiKeys: {},
  multiModels: [],
  debatePro: [],
  debateCon: [],
  debateJudge: [],
  collabModels: [],
  avatar: null,
  voiceSettings: { voice: 'alloy', speed: 1 },
  user: null,
  userInfo: null
};

let saveStateTimer = null;

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      state = Object.assign({}, state, parsed);
    }
  } catch (e) {}
  if (!state.chats) state.chats = [];
  if (!state.apiKeys) state.apiKeys = {};
  if (!state.multiModels) state.multiModels = [];
  if (!state.debatePro) state.debatePro = [];
  if (!state.debateCon) state.debateCon = [];
  if (!state.debateJudge) state.debateJudge = [];
  if (!state.collabModels) state.collabModels = [];
  if (!state.voiceSettings) state.voiceSettings = { voice: 'alloy', speed: 1 };
}

function saveState() {
  if (saveStateTimer) clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }, 500);
}

function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USERS_KEY);
  state = {
    loggedIn: false, currentChatId: null, currentModelId: 'mimo-v2.5-pro',
    chats: [], theme: 'light', apiKeys: {}, multiModels: [], debatePro: [],
    debateCon: [], debateJudge: [], collabModels: [], avatar: null,
    voiceSettings: { voice: 'alloy', speed: 1 }, user: null, userInfo: null
  };
}

function exportState() {
  return JSON.stringify({ version: '4.0', exportDate: new Date().toISOString(), state: state }, null, 2);
}

function getDataStats() {
  const chats = state.chats || [];
  const msgCount = chats.reduce((a, c) => a + (c.messages ? c.messages.length : 0), 0);
  const keyCount = Object.values(state.apiKeys || {}).filter(Boolean).length;
  return {
    chats: chats.length,
    messages: msgCount,
    apiKeys: keyCount,
    storage: (localStorage.getItem(STORAGE_KEY) || '').length
  };
}
