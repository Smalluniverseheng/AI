/* ==================== AUTH · 登录 / 注册 ====================
 * 当前为本地演示账号体系（localStorage）。
 * 后期接入后端时替换 login/register/logout 为服务端接口调用即可，UI 无需改动。
 */
const Auth = (() => {

  async function hash(p) {
    if (crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('3rd-ai:' + p));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // 降级（非安全上下文）
    let h = 0;
    const s = '3rd-ai:' + p;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
    return String(h);
  }

  function ensureDefaultUser() {
    const users = Store.getUsers();
    if (!users['1234']) {
      hash('1234').then(h => {
        const u2 = Store.getUsers();
        if (!u2['1234']) {
          u2['1234'] = { account: '1234', password: h, name: '演示用户', createdAt: Date.now() };
          Store.saveUsers(u2);
        }
      });
    }
  }

  async function login(account, password) {
    const users = Store.getUsers();
    const u = users[account];
    if (!u) return { ok: false, error: '账号不存在，请先注册' };
    if (u.password !== await hash(password)) return { ok: false, error: '密码错误，请重试' };
    Store.patch({ loggedIn: true, user: account, userInfo: u });
    return { ok: true };
  }

  async function register(info) {
    const { account, password, name } = info;
    if (!name || !name.trim()) return { ok: false, error: '请填写昵称' };
    if (!account || account.length < 3) return { ok: false, error: '账号至少 3 位' };
    if (!password || password.length < 4) return { ok: false, error: '密码至少 4 位' };
    if (password !== info.password2) return { ok: false, error: '两次输入的密码不一致' };
    const users = Store.getUsers();
    if (users[account]) return { ok: false, error: '该账号已被注册' };
    const user = { account, password: await hash(password), name: name.trim(), remark: info.remark || '', createdAt: Date.now() };
    users[account] = user;
    Store.saveUsers(users);
    Store.patch({ loggedIn: true, user: account, userInfo: user });
    return { ok: true };
  }

  /* 游客登录：不创建账号，仅本地浏览使用 */
  function guest() {
    const user = { account: 'guest', name: '游客', remark: '本地浏览模式', guest: true, createdAt: Date.now() };
    Store.patch({ loggedIn: true, user: 'guest', userInfo: user });
  }

  function logout() {
    API.abortAll();
    Voice.stopSpeak();
    Voice.stopInput();
    Store.patch({ loggedIn: false, user: null, userInfo: null, currentChatId: null });
    UI.showLogin();
    Toast.info('已退出登录');
  }

  /* 进入应用前的会话检查 */
  function checkSession() {
    const s = Store.state;
    if (s.loggedIn && s.user) {
      if (s.user === 'guest') return !!(s.userInfo && s.userInfo.guest); // 游客会话
      const users = Store.getUsers();
      if (users[s.user]) { Store.patch({ userInfo: users[s.user] }); return true; }
    }
    return false;
  }

  return { ensureDefaultUser, login, register, guest, logout, checkSession };
})();
