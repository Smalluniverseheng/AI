/* ==================== APP · 应用入口 ==================== */
(function () {
  // 加载状态
  Store.load();
  Auth.ensureDefaultUser();
  UI.applyTheme();

  /* ---------- PWA 安装 ---------- */
  window.AppInstall = (() => {
    let deferredPrompt = null;
    let installed = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      if (Store.state.loggedIn) Pages.renderProfile && Pages.renderProfile();
    });
    window.addEventListener('appinstalled', () => {
      installed = true;
      deferredPrompt = null;
      Toast.success('已安装到桌面 🎉');
    });

    return {
      canInstall: () => !!deferredPrompt,
      isInstalled: () => installed,
      prompt: () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(choice => {
            if (choice.outcome !== 'accepted') Toast.info('已取消安装');
            deferredPrompt = null;
          });
        } else if (installed) {
          Toast.info('应用已安装');
        } else {
          Toast.info('请使用浏览器菜单「添加到主屏幕」安装（iOS：分享 → 添加到主屏幕）');
        }
      }
    };
  })();

  /* ---------- Service Worker 注册 ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    // file:// 协议下跳过
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').then(reg => {
      // 有更新时提示刷新
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            Toast.info('新版本已就绪，刷新后生效');
          }
        });
      });
    }).catch(() => {});
  }

  /* ---------- 开屏页（splash：品牌展示 ≥1.6s 后淡出，每会话一次，手表跳过） ---------- */
  function initSplash() {
    const sp = $('#splash');
    if (!sp) return;
    // logo 加载失败时优雅降级（露出渐变底）
    const img = sp.querySelector('.splash-logo img');
    if (img) img.addEventListener('error', () => { img.style.display = 'none'; });
    let shown = false;
    try {
      shown = !!sessionStorage.getItem('splashShown');
      sessionStorage.setItem('splashShown', '1');
    } catch (e) {}
    // 手表模式 / 本会话已播过：直接移除
    if ((window.DeviceInfo && DeviceInfo.isWatch()) || shown) { sp.remove(); return; }
    // 到时淡出（CSS 另有兜底动画，JS 失效时也会自动隐藏，不阻塞应用）
    setTimeout(() => {
      sp.classList.add('out');
      setTimeout(() => sp.remove(), 650);
    }, 1600);
  }

  /* ---------- 登录/注册 ---------- */
  function bindAuthEvents() {
    const switchTab = tab => {
      if (tab === 'register') { Toast.info('网站后端服务器已关闭，无法在线登录或注册；待后续接入后端后开放'); return; }
      $$('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
      $('#loginFormSection').style.display = tab === 'login' ? 'block' : 'none';
      $('#registerFormSection').style.display = tab === 'register' ? 'block' : 'none';
      hideError();
    };
    $$('.login-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

    // 游客登录：本地浏览使用，无需账号
    $('#guestBtn').addEventListener('click', () => {
      Auth.guest();
      UI.showApp();
      Toast.success('已进入游客模式，数据仅保存在本机浏览器');
    });

    const showError = msg => {
      const box = $('#loginError');
      box.innerHTML = icon('zap', 15) + '<span>' + esc(msg) + '</span>';
      box.classList.add('show');
    };
    const hideError = () => $('#loginError').classList.remove('show');

    const doLogin = async () => {
      const account = $('#loginUser').value.trim();
      const password = $('#loginPass').value;
      if (!account || !password) return showError('请输入账号和密码');
      const btn = $('#loginBtn');
      btn.disabled = true;
      btn.textContent = '登录中…';
      const result = await Auth.login(account, password);
      btn.disabled = false;
      btn.textContent = '登 录';
      if (result.ok) {
        UI.showApp();
        Toast.success('欢迎回来，' + ((Store.state.userInfo || {}).name || account));
      } else showError(result.error);
    };

    const doRegister = async () => {
      const info = {
        name: $('#regName').value.trim(),
        account: $('#regAccount').value.trim(),
        password: $('#regPass').value,
        password2: $('#regPass2').value,
        remark: $('#regRemark').value.trim()
      };
      const btn = $('#registerBtn');
      btn.disabled = true;
      btn.textContent = '注册中…';
      const result = await Auth.register(info);
      btn.disabled = false;
      btn.textContent = '注册并登录';
      if (result.ok) {
        UI.showApp();
        Toast.success('注册成功，欢迎使用！');
      } else showError(result.error);
    };

    $('#loginBtn').addEventListener('click', doLogin);
    $('#registerBtn').addEventListener('click', doRegister);
    [$('#loginUser'), $('#loginPass')].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }));
    [$('#regName'), $('#regAccount'), $('#regPass'), $('#regPass2'), $('#regRemark')].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); }));
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    UI.init();
    Pages.init();
    bindAuthEvents();
    registerSW();
    I18n.apply();

    // 语言切换：重渲染 UI 动态部分
    document.addEventListener('langchange', () => {
      UI.updateModeSel();
      UI.updateModelSel();
      UI.renderSidebar();
      UI.renderChat();
      if (Store.state.loggedIn) Pages.renderProfile();
    });

    // 恢复侧边栏折叠状态
    if (Store.state.sidebarCollapsed) {
      $('#sidebar').classList.add('collapsed');
      $('#sidebarToggle').classList.add('collapsed');
    }

    if (Auth.checkSession()) UI.showApp();
    else UI.showLogin();
  });
})();
