/* ==================== STORE · 状态与本地存储 ====================
 * 所有持久化都经过本模块。后期接入后端时：
 * 只需将 load()/save() 换成服务端同步（REST/WebSocket），上层 UI 无需改动。
 */
const Store = (() => {
  const STATE_KEY = 'ai_chat_state_v5';
  const USERS_KEY = 'ai_users_v5';
  const LEGACY_KEYS = ['ai_chat_state_v4', 'ai_users_v4'];

  const DEFAULTS = {
    loggedIn: false,
    user: null,
    userInfo: null,
    theme: 'system',
    apiKeys: {},
    chats: [],
    currentChatId: null,
    currentModelId: 'mimo-v2.5-pro',
    currentMode: 'single',
    multiModels: [],
    debatePro: [],
    debateCon: [],
    debateJudge: [],
    collabModels: [],
    debateRounds: 2,
    debateFormat: 'standard',
    collabRounds: 2,
    avatar: null,          // { type:'preset', idx } 或 { type:'image', data }
    lang: 'zh-CN',         // 界面语言（zh-CN/zh-TW/en/fr/es/ru/ar）
    voiceSettings: { enabled: true, voiceURI: '', rate: 1, ttsEngine: 'browser', ttsVoice: 'mimo_default', asrEngine: 'browser' },
    webSearch: { enabled: false, tavilyKey: '' },
    sidebarCollapsed: false,
    recentModels: []
  };

  let state = JSON.parse(JSON.stringify(DEFAULTS));
  let saveTimer = null;

  /* 注意：state 引用全程不可替换（Store.state 在模块初始化时已绑定），
     所有加载/重置都必须就地修改该对象 */
  function load() {
    try {
      // 优先读 v5；没有则尝试迁移 v4 数据（保留对话与 Key）
      let raw = localStorage.getItem(STATE_KEY);
      if (!raw) raw = localStorage.getItem(LEGACY_KEYS[0]);
      if (raw) {
        const parsed = JSON.parse(raw);
        // voiceSettings 深合并：老数据缺少新字段（ttsEngine/asrEngine 等）时补默认值
        parsed.voiceSettings = Object.assign(JSON.parse(JSON.stringify(DEFAULTS.voiceSettings)), parsed.voiceSettings || {});
        replaceState(Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), parsed));
      }
    } catch (e) { /* 数据损坏时使用默认 */ }
    if (!Array.isArray(state.chats)) state.chats = [];
    if (!state.apiKeys) state.apiKeys = {};
    return state;
  }

  function replaceState(next) {
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, next);
  }

  function save(immediate) {
    if (saveTimer) clearTimeout(saveTimer);
    const write = () => {
      try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
      catch (e) {
        // 存储超限：尝试清理最旧对话的图片数据
        try {
          state.chats.slice(-3).forEach(c => (c.messages || []).forEach(m => { if (m.image) m.image = null; }));
          localStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (e2) {}
      }
    };
    if (immediate) { write(); } else { saveTimer = setTimeout(write, 400); }
  }

  function patch(obj) { Object.assign(state, obj); save(); }

  function reset() {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(USERS_KEY);
    replaceState(JSON.parse(JSON.stringify(DEFAULTS)));
  }

  /* ---- 用户表（本地演示账号体系；接后端后替换为服务端鉴权） ---- */
  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  /* ---- 数据统计 / 导出 ---- */
  function stats() {
    const chats = state.chats || [];
    const msgCount = chats.reduce((a, c) => a + (c.messages ? c.messages.length : 0), 0);
    const keyCount = Object.entries(state.apiKeys || {}).filter(([k, v]) => v && k !== 'mimoPlan').length;
    let bytes = 0;
    try { bytes = (localStorage.getItem(STATE_KEY) || '').length; } catch (e) {}
    return { chats: chats.length, messages: msgCount, keys: keyCount, bytes };
  }

  function exportAll() {
    return JSON.stringify({ app: 'thirdparty-ai', version: APP_VERSION, exportedAt: new Date().toISOString(), state }, null, 2);
  }

  function importAll(json) {
    const data = JSON.parse(json);
    const incoming = data.state || data;
    if (!incoming || typeof incoming !== 'object') throw new Error('数据格式不正确');
    replaceState(Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), incoming));
    save(true);
  }

  return { state, DEFAULTS, load, save, patch, reset, getUsers, saveUsers, stats, exportAll, importAll };
})();
