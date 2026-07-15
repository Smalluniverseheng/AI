// ==================== AUTH ====================
const AUTH = (() => {
  function getUsers() {
    try { const u = localStorage.getItem(USERS_KEY); return u ? JSON.parse(u) : {}; } catch (e) { return {}; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  function hash(p) {
    let h = 0;
    for (let i = 0; i < p.length; i++) { h = ((h << 5) - h) + p.charCodeAt(i); h |= 0; }
    return String(h);
  }
  function login(phone, password) {
    const users = getUsers();
    if (!users[phone]) { return { ok: false, error: '用户不存在' }; }
    if (users[phone].password !== hash(password)) { return { ok: false, error: '密码错误' }; }
    state.loggedIn = true; state.user = phone; state.userInfo = users[phone];
    saveState(); return { ok: true };
  }
  function register(phone, password, name, age, gender, interests) {
    const users = getUsers();
    if (users[phone]) { return { ok: false, error: '手机号已注册' }; }
    if (!phone || phone.length < 4) { return { ok: false, error: '请输入手机号' }; }
    if (!password || password.length < 4) { return { ok: false, error: '密码至少4位' }; }
    if (!name) { return { ok: false, error: '请输入姓名' }; }
    const user = { phone, password: hash(password), name, age, gender, interests, createdAt: Date.now() };
    users[phone] = user; saveUsers(users);
    state.loggedIn = true; state.user = phone; state.userInfo = user;
    saveState(); return { ok: true };
  }
  function logout() {
    state.loggedIn = false; state.user = null; state.userInfo = null; state.currentChatId = null;
    saveState();
    showLogin();
    showToast('已退出登录', 'info');
  }
  function ensureDefaultUser() {
    const users = getUsers();
    if (!users['1234']) {
      users['1234'] = { phone: '1234', password: hash('1234'), name: '默认用户', age: '25', gender: '保密', interests: [], createdAt: Date.now() };
      saveUsers(users);
    }
  }
  return { login, register, logout, ensureDefaultUser, getUsers };
})();

function showLogin() {
  document.querySelector('.login-page')?.classList.remove('hidden');
  document.querySelector('.app-shell')?.classList.add('hidden');
}

function showApp() {
  document.querySelector('.login-page')?.classList.add('hidden');
  document.querySelector('.app-shell')?.classList.remove('hidden');
  document.querySelector('.app-shell').style.display = 'flex';
}

function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.login-form').forEach(f => f.classList.add('hidden'));
  document.querySelector('[data-login-tab="' + tab + '"]')?.classList.add('active');
  document.getElementById(tab + 'Form')?.classList.remove('hidden');
  showLoginError(''); showRegError('');
}

function handleLogin() {
  const phone = document.getElementById('loginPhone')?.value?.trim() || '';
  const password = document.getElementById('loginPassword')?.value?.trim() || '';
  if (!phone || !password) { showLoginError('请输入手机号和密码'); return; }
  const result = AUTH.login(phone, password);
  if (result.ok) { showApp(); showToast('欢迎回来！', 'success'); } else { showLoginError(result.error); }
}

function handleRegister() {
  const phone = document.getElementById('regPhone')?.value?.trim() || '';
  const password = document.getElementById('regPassword')?.value?.trim() || '';
  const name = document.getElementById('regName')?.value?.trim() || '';
  const age = document.getElementById('regAge')?.value?.trim() || '';
  const gender = document.getElementById('regGender')?.value?.trim() || '';
  const interests = [];
  document.querySelectorAll('.reg-tag.active').forEach(t => { const v = t.getAttribute('data-value'); if (v) interests.push(v); });
  if (!phone || !password || !name) { showRegError('请填写完整信息'); return; }
  const result = AUTH.register(phone, password, name, age, gender, interests);
  if (result.ok) { showApp(); showToast('注册成功！', 'success'); } else { showRegError(result.error); }
}

function toggleRegTag(el) { el.classList.toggle('active'); }

function autoLogin() {
  if (state.loggedIn && state.user) {
    const users = AUTH.getUsers();
    if (users[state.user]) { state.userInfo = users[state.user]; showApp(); }
    else { showLogin(); }
  } else { showLogin(); }
}
