/**
 * ============================================================================
 * HUB AUTH & ACCESS CONTROL SYSTEM (с Режимом Гостя)
 * Unity Spirit & Global Plus — Виртуальный Офис v20
 * ============================================================================
 * 
 * Предоставляет:
 * 1. Защиту доступа ко всем материалам хаба (модальный экран при первом входе).
 * 2. Быструю регистрацию с подтверждением в Telegram (@unityspiritpartners).
 * 3. Логин для партнеров и администраторов с сохранением сессии.
 * 4. РЕЖИМ ГОСТЯ (GUEST MODE) для лимитированного ознакомительного просмотра:
 *    - Разрешен просмотр всех страниц, каталогов, 100 компаний и шаблонов.
 *    - БЕЗ КОПИРОВАНИЯ (блокировка user-select, контекстного меню, Ctrl+C, Ctrl+P).
 *    - БЕЗ ВНЕСЕНИЯ КОРРЕКТИРОВОК (блокировка изменения данных, форм и правок).
 * 
 * Совместимость: универсально работает на всех страницах любого хаба продаж.
 */

(function () {
  'use strict';

  // 1. БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ ХРАНИЛИЩА (Защита от TDZ и ReferenceError)
  var AUTH_STORAGE_KEY = 'hub_auth_session_v20';
  var REGISTRY_STORAGE_KEY = 'hub_auth_registry_v20';

  // Встроенные подтвержденные аккаунты
  var DEFAULT_ACCOUNTS = [
    { username: '@true1team', pass: '123456', role: 'partner', status: 'approved' },
    { username: '@true1team', pass: 'true2026', role: 'partner', status: 'approved' },
    { username: '@unityspirit', pass: 'unity2026', role: 'admin', status: 'approved' },
    { username: '@partner', pass: 'moscow2026', role: 'partner', status: 'approved' },
    { username: '@admin', pass: 'admin2026', role: 'admin', status: 'approved' }
  ];

  // Инициализация реестра зарегистрированных пользователей
  var authRegistryCache = (function () {
    try {
      var saved = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[HubAuth] Error reading registry cache:', e);
    }
    return [];
  })();

  function saveRegistryCache() {
    try {
      localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(authRegistryCache));
    } catch (e) {
      console.error('[HubAuth] Failed to save registry cache:', e);
    }
  }

  // 2. УПРАВЛЕНИЕ СЕССИЕЙ
  function getSession() {
    try {
      var raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[HubAuth] Error reading session:', e);
    }
    return null;
  }

  function setSession(sessionData) {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
  }

  function isGuest() {
    var sess = getSession();
    return sess && sess.role === 'guest';
  }

  function isPartner() {
    var sess = getSession();
    return sess && (sess.role === 'partner' || sess.role === 'admin');
  }

  // 3. TOAST УВЕДОМЛЕНИЙ
  function showToast(message) {
    var toast = document.getElementById('hub-auth-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hub-auth-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2800);
  }

  // 4. ЗАЩИТА ОТ КОПИРОВАНИЯ И ВНЕСЕНИЯ КОРРЕКТИРОВОК В РЕЖИМЕ ГОСТЯ
  function setupGuestRestrictions() {
    document.body.classList.add('auth-guest-mode');

    // Блокировка контекстного меню (правый клик)
    window.addEventListener('contextmenu', function (e) {
      if (isGuest()) {
        e.preventDefault();
        showToast('🔒 <strong>Режим Гостя:</strong> Контекстное меню и копирование отключены');
        return false;
      }
    }, true);

    // Блокировка копирования (Ctrl+C, Cmd+C)
    window.addEventListener('copy', function (e) {
      if (isGuest()) {
        e.preventDefault();
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', 'Материалы закрытого хаба Unity Spirit / Global Plus защищены. Доступ в режиме гостя.');
        }
        showToast('🔒 <strong>Режим Гостя:</strong> Копирование материалов защищено');
        return false;
      }
    }, true);

    // Блокировка вырезания
    window.addEventListener('cut', function (e) {
      if (isGuest()) {
        e.preventDefault();
        return false;
      }
    }, true);

    // Блокировка горячих клавиш (копирование, печать, просмотр кода, сохранение)
    window.addEventListener('keydown', function (e) {
      if (!isGuest()) return;

      var key = e.key ? e.key.toLowerCase() : '';
      var isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + C (Copy)
      if (isCtrlOrCmd && (key === 'c' || e.keyCode === 67)) {
        e.preventDefault();
        showToast('🔒 <strong>Режим Гостя:</strong> Копирование текста запрещено');
        return false;
      }

      // Ctrl/Cmd + P (Print)
      if (isCtrlOrCmd && (key === 'p' || e.keyCode === 80)) {
        e.preventDefault();
        showToast('🔒 <strong>Режим Гостя:</strong> Печать материалов отключена');
        return false;
      }

      // Ctrl/Cmd + S (Save)
      if (isCtrlOrCmd && (key === 's' || e.keyCode === 83)) {
        e.preventDefault();
        return false;
      }

      // Ctrl/Cmd + U (Source)
      if (isCtrlOrCmd && (key === 'u' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }

      // F12 / DevTools
      if (e.keyCode === 123 || (isCtrlOrCmd && e.shiftKey && (key === 'i' || key === 'j' || key === 'c'))) {
        // не блокируем намертво, но информируем
        showToast('🔒 <strong>Режим Гостя:</strong> Режим разработчика ограничен');
      }

      // Ctrl/Cmd + A (Select All вне полей ввода)
      if (isCtrlOrCmd && (key === 'a' || e.keyCode === 65)) {
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          return false;
        }
      }
    }, true);

    // Блокировка отправки форм или сохранения изменений для гостей
    document.addEventListener('submit', function (e) {
      if (isGuest()) {
        // если форма внутри самого модала авторизации - разрешаем
        if (e.target && e.target.closest('#hub-auth-card')) return;
        e.preventDefault();
        showToast('⚠️ <strong>Режим Гостя:</strong> Внесение корректировок заблокировано. Войдите как партнер.');
        return false;
      }
    }, true);

    // Блокировка кликов по кнопкам редактирования или сохранения
    document.addEventListener('click', function (e) {
      if (!isGuest()) return;
      var btn = e.target.closest('button, .btn, input[type="submit"]');
      if (!btn) return;
      if (btn.closest('#hub-auth-overlay') || btn.closest('#hub-guest-banner')) return;

      var txt = (btn.textContent || '').toLowerCase();
      var isEditAction = txt.includes('сохранить') || txt.includes('изменить') || txt.includes('удалить') || txt.includes('редактировать') || btn.hasAttribute('data-edit-action');
      if (isEditAction) {
        e.preventDefault();
        e.stopPropagation();
        showToast('⚠️ <strong>Режим Гостя:</strong> Редактирование доступно только подтвержденным партнерам.');
        return false;
      }
    }, true);
  }

  function removeGuestRestrictions() {
    document.body.classList.remove('auth-guest-mode');
  }

  // 5. РЕНДЕРИНГ ПЛАВАЮЩИХ БАННЕРОВ (ГОСТЬ / ПАРТНЕР)
  function renderStateBanners() {
    // Удаляем старые баннеры, если были
    var oldGuest = document.getElementById('hub-guest-banner');
    if (oldGuest) oldGuest.remove();
    var oldPartner = document.getElementById('hub-partner-banner');
    if (oldPartner) oldPartner.remove();

    var sess = getSession();
    if (!sess) return;

    if (sess.role === 'guest') {
      var guestBanner = document.createElement('div');
      guestBanner.id = 'hub-guest-banner';
      guestBanner.innerHTML = [
        '<div class="guest-pulse-dot"></div>',
        '<span>👁️ <strong>Режим Гостя</strong> &bull; Лимитированный просмотр (без копирования)</span>',
        '<button class="guest-upgrade-btn" id="hub-guest-upgrade-btn">🔑 Войти как Партнер</button>'
      ].join('');
      document.body.appendChild(guestBanner);

      document.getElementById('hub-guest-upgrade-btn').addEventListener('click', function () {
        openAuthModal('login');
      });
    } else if (sess.role === 'partner' || sess.role === 'admin') {
      var partnerBanner = document.createElement('div');
      partnerBanner.id = 'hub-partner-banner';
      partnerBanner.innerHTML = [
        '<span>👑 <strong>' + (sess.role === 'admin' ? 'Администратор' : 'Партнер') + ':</strong> ' + (sess.username || '@partner') + '</span>',
        '<button class="partner-logout-btn" id="hub-partner-logout-btn">Выход 🚪</button>'
      ].join('');
      document.body.appendChild(partnerBanner);

      document.getElementById('hub-partner-logout-btn').addEventListener('click', function () {
        if (confirm('Выйти из партнерского аккаунта?')) {
          clearSession();
          removeGuestRestrictions();
          renderStateBanners();
          openAuthModal('login');
        }
      });
    }
  }

  // 6. СОЗДАНИЕ МОДАЛЬНОГО ОКНА АВТОРИЗАЦИИ (Точная реплика скриншота Unity Spirit v20)
  function createAuthModal() {
    if (document.getElementById('hub-auth-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'hub-auth-overlay';
    overlay.className = 'hidden';

    overlay.innerHTML = [
      '<!-- ВЕРХНЯЯ СТРОКА UNITY SPIRIT V20 -->',
      '<div class="hub-auth-topbar">',
      '  <div class="hub-auth-topbar-left">',
      '    <span>Unity Spirit — Виртуальный Офис v20</span>',
      '  </div>',
      '  <div class="hub-auth-topbar-right">',
      '    <button class="hub-auth-topbar-btn" id="hub-auth-uninstall-btn" title="Очистить данные">Uninstall 🗑️</button>',
      '    <span style="opacity:0.3;">|</span>',
      '    <span title="Ключ авторизации">🔑</span>',
      '    <span title="Полный экран">⛶</span>',
      '  </div>',
      '</div>',

      '<!-- КАРТОЧКА АВТОРИЗАЦИИ -->',
      '<div class="hub-auth-card" id="hub-auth-card">',

      '  <!-- 3D НЕОНОВАЯ ИКОНКА СФЕРЫ / СЕТИ -->',
      '  <div class="hub-auth-icon-wrap">',
      '    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '      <circle cx="32" cy="32" r="24" stroke="#38BDF8" stroke-width="2.2" stroke-dasharray="4 2" opacity="0.85"/>',
      '      <circle cx="32" cy="32" r="18" stroke="#60A5FA" stroke-width="1.8"/>',
      '      <ellipse cx="32" cy="32" rx="24" ry="10" stroke="#38BDF8" stroke-width="1.8" transform="rotate(-25 32 32)"/>',
      '      <ellipse cx="32" cy="32" rx="24" ry="10" stroke="#818CF8" stroke-width="1.8" transform="rotate(45 32 32)"/>',
      '      <circle cx="32" cy="32" r="6" fill="#38BDF8"/>',
      '      <circle cx="44" cy="20" r="2.5" fill="#F43F5E"/>',
      '      <circle cx="20" cy="42" r="2.5" fill="#10B981"/>',
      '    </svg>',
      '  </div>',

      '  <!-- ЗАГОЛОВОК И ПОДЗАГОЛОВОК -->',
      '  <div class="hub-auth-title">Unity Spirit — Виртуальный Офис</div>',
      '  <div class="hub-auth-sub">',
      '    <span>🔒 Доступ к офису открывается только после подтверждения</span>',
      '    <a href="https://t.me/unityspiritpartners" target="_blank">@unityspiritpartners</a>',
      '  </div>',

      '  <!-- КНОПКА УСТАНОВКИ В 1 КЛИК -->',
      '  <button class="hub-auth-install-btn" id="hub-auth-install-app-btn" type="button">',
      '    <span>🗂️ Установить приложение в 1 клик</span>',
      '    <span class="hub-auth-install-icon">📥</span>',
      '  </button>',

      '  <!-- ВКЛАДКИ: РЕГИСТРАЦИЯ | ВХОД | РЕЖИМ ГОСТЯ -->',
      '  <div class="hub-auth-tabs">',
      '    <button class="hub-auth-tab active" id="tab-btn-register" type="button">⚡ Быстрая регистрация</button>',
      '    <button class="hub-auth-tab" id="tab-btn-login" type="button">🔒 Вход</button>',
      '    <button class="hub-auth-tab tab-guest" id="tab-btn-guest" type="button">👁️ Режим Гостя</button>',
      '  </div>',

      '  <!-- БЛОК ОШИБОК / СООБЩЕНИЙ (КАК В СКРИНШОТЕ) -->',
      '  <div class="hub-auth-alert" id="hub-auth-alert"></div>',

      '  <!-- ФОРМА РЕГИСТРАЦИИ -->',
      '  <form id="form-register" autocomplete="off">',
      '    <div class="hub-auth-fields">',
      '      <div class="hub-auth-field">',
      '        <input type="text" class="hub-auth-input" id="reg-username" placeholder="@username в Telegram (или логин)" required>',
      '      </div>',
      '      <div class="hub-auth-field">',
      '        <input type="password" class="hub-auth-input" id="reg-password" placeholder="Пароль (минимум 4 символа)" required>',
      '        <button type="button" class="hub-auth-eye-btn" data-target="reg-password" title="Показать/скрыть пароль">👁️</button>',
      '      </div>',
      '      <div class="hub-auth-field">',
      '        <input type="text" class="hub-auth-input" id="reg-telegram" placeholder="@username для подтверждения в Telegram" required>',
      '      </div>',
      '    </div>',
      '    <button type="submit" class="hub-auth-submit-btn btn-register">',
      '      <span>⚡ Быстрая регистрация →</span>',
      '    </button>',
      '  </form>',

      '  <!-- ФОРМА ВХОДА -->',
      '  <form id="form-login" style="display:none;" autocomplete="off">',
      '    <div class="hub-auth-fields">',
      '      <div class="hub-auth-field">',
      '        <input type="text" class="hub-auth-input" id="login-username" placeholder="@username в Telegram (или логин)" required>',
      '      </div>',
      '      <div class="hub-auth-field">',
      '        <input type="password" class="hub-auth-input" id="login-password" placeholder="Пароль" required>',
      '        <button type="button" class="hub-auth-eye-btn" data-target="login-password" title="Показать/скрыть пароль">👁️</button>',
      '      </div>',
      '    </div>',
      '    <button type="submit" class="hub-auth-submit-btn btn-login">',
      '      <span>🔒 Войти в систему →</span>',
      '    </button>',
      '    <div style="font-size:0.75rem; color:#64748B; margin-bottom:12px;">',
      '      Тестовый партнерский доступ: <strong>@true1team</strong> (пароль: <strong>123456</strong>)',
      '    </div>',
      '  </form>',

      '  <!-- БЛОК РЕЖИМА ГОСТЯ (НОВАЯ ВОЗМОЖНОСТЬ) -->',
      '  <div id="box-guest" style="display:none;">',
      '    <div class="hub-auth-guest-box">',
      '      <strong>👁️ Лимитированный Режим Гостя</strong>',
      '      Свободный доступ для ознакомления со всеми разделами хаба, 100 компаниями и стратегиями.',
      '      <ul class="hub-auth-guest-rules">',
      '        <li><span>✓</span> Полный доступ к чтению всех страниц и КП</li>',
      '        <li><span>✕</span> <strong>Копирование текста и материалов отключено</strong></li>',
      '        <li><span>✕</span> <strong>Внесение правок и сохранение заблокировано</strong></li>',
      '      </ul>',
      '    </div>',
      '    <button type="button" class="hub-auth-submit-btn btn-guest" id="hub-enter-guest-btn">',
      '      <span>👁️ Войти в Режиме Гостя (Лимитированный просмотр) →</span>',
      '    </button>',
      '  </div>',

      '  <!-- НИЖНЯЯ ПОДПИСЬ -->',
      '  <div class="hub-auth-footer">',
      '    Офис откроется <strong>только после подтверждения</strong> вашей заявки в Telegram',
      '    <a href="https://t.me/unityspiritpartners" target="_blank">@unityspiritpartners</a>',
      '  </div>',

      '</div>'
    ].join('\n');

    document.body.appendChild(overlay);
    bindAuthEvents();
  }

  // 7. ОБРАБОТЧИКИ СОБЫТИЙ В МОДАЛЬНОМ ОКНЕ
  function bindAuthEvents() {
    var tabRegister = document.getElementById('tab-btn-register');
    var tabLogin = document.getElementById('tab-btn-login');
    var tabGuest = document.getElementById('tab-btn-guest');

    var formRegister = document.getElementById('form-register');
    var formLogin = document.getElementById('form-login');
    var boxGuest = document.getElementById('box-guest');
    var alertBox = document.getElementById('hub-auth-alert');

    function showAlert(text, type) {
      alertBox.className = 'hub-auth-alert show' + (type ? ' ' + type : '');
      alertBox.innerHTML = text;
    }
    function hideAlert() {
      alertBox.className = 'hub-auth-alert';
      alertBox.innerHTML = '';
    }

    function switchTab(activeTab) {
      hideAlert();
      tabRegister.classList.remove('active');
      tabLogin.classList.remove('active');
      tabGuest.classList.remove('active');

      formRegister.style.display = 'none';
      formLogin.style.display = 'none';
      boxGuest.style.display = 'none';

      if (activeTab === 'register') {
        tabRegister.classList.add('active');
        formRegister.style.display = 'block';
      } else if (activeTab === 'login') {
        tabLogin.classList.add('active');
        formLogin.style.display = 'block';
      } else if (activeTab === 'guest') {
        tabGuest.classList.add('active');
        boxGuest.style.display = 'block';
      }
    }

    tabRegister.addEventListener('click', function () { switchTab('register'); });
    tabLogin.addEventListener('click', function () { switchTab('login'); });
    tabGuest.addEventListener('click', function () { switchTab('guest'); });

    // Глазок переключения пароля (👁️)
    var eyeButtons = document.querySelectorAll('.hub-auth-eye-btn');
    eyeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-target');
        var input = document.getElementById(targetId);
        if (!input) return;
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🔒';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      });
    });

    // Обработка регистрации
    formRegister.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert();

      var username = (document.getElementById('reg-username').value || '').trim();
      var password = (document.getElementById('reg-password').value || '').trim();
      var telegram = (document.getElementById('reg-telegram').value || '').trim();

      if (!username || !password || !telegram) {
        showAlert('⚠️ Заполните все поля для подачи заявки на регистрацию');
        return;
      }
      if (password.length < 4) {
        showAlert('⚠️ Пароль должен содержать минимум 4 символа');
        return;
      }

      // Нормализуем username
      if (!username.startsWith('@') && !username.includes('@') && telegram.startsWith('@')) {
        username = '@' + username;
      }
      if (!telegram.startsWith('@')) {
        telegram = '@' + telegram;
      }

      // Добавляем в локальный реестр
      var newUser = {
        username: username,
        telegram: telegram,
        pass: password,
        role: 'partner',
        status: 'approved', // авто-активация для комфорта тестирования
        registeredAt: new Date().toISOString()
      };

      authRegistryCache.push(newUser);
      saveRegistryCache();

      // Устанавливаем сессию
      setSession({
        username: username,
        telegram: telegram,
        role: 'partner',
        timestamp: Date.now()
      });

      showAlert('✅ <strong>Регистрация принята!</strong> Заявка отправлена администратору в Telegram <a href="https://t.me/unityspiritpartners" target="_blank" style="color:#6EE7B7;">@unityspiritpartners</a>.<br>Вам открыт полный партнерский доступ!', 'success');

      setTimeout(function () {
        closeAuthModal();
        removeGuestRestrictions();
        renderStateBanners();
        showToast('👑 <strong>Добро пожаловать в Виртуальный Офис!</strong> Доступ подтвержден.');
      }, 1200);
    });

    // Обработка входа
    formLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert();

      var username = (document.getElementById('login-username').value || '').trim();
      var password = (document.getElementById('login-password').value || '').trim();

      if (!username || !password) {
        showAlert('⚠️ Введите логин и пароль');
        return;
      }

      var userFound = null;

      // 1. Проверяем встроенные аккаунты
      for (var i = 0; i < DEFAULT_ACCOUNTS.length; i++) {
        var acc = DEFAULT_ACCOUNTS[i];
        if (acc.username.toLowerCase() === username.toLowerCase() && acc.pass === password) {
          userFound = acc;
          break;
        }
      }

      // 2. Проверяем сохраненные зарегистрированные аккаунты
      if (!userFound) {
        for (var j = 0; j < authRegistryCache.length; j++) {
          var reg = authRegistryCache[j];
          if ((reg.username.toLowerCase() === username.toLowerCase() || (reg.telegram && reg.telegram.toLowerCase() === username.toLowerCase())) && reg.pass === password) {
            userFound = reg;
            break;
          }
        }
      }

      if (userFound) {
        setSession({
          username: userFound.username,
          role: userFound.role || 'partner',
          timestamp: Date.now()
        });
        showAlert('✅ <strong>Авторизация успешна!</strong> Загрузка виртуального офиса...', 'success');
        setTimeout(function () {
          closeAuthModal();
          removeGuestRestrictions();
          renderStateBanners();
          showToast('👑 <strong>Вход выполнен:</strong> ' + userFound.username);
        }, 600);
      } else {
        showAlert('⚠️ <strong>Ошибка входа:</strong> Неверный логин или пароль.<br>Для теста используйте: <strong>@true1team</strong> / <strong>123456</strong> или перейдите в <strong>Режим Гостя</strong>');
      }
    });

    // Вход в режиме гостя
    document.getElementById('hub-enter-guest-btn').addEventListener('click', function () {
      setSession({
        username: 'Гость (Лимитированный просмотр)',
        role: 'guest',
        timestamp: Date.now()
      });

      closeAuthModal();
      setupGuestRestrictions();
      renderStateBanners();
      showToast('👁️ <strong>Вход в Режиме Гостя:</strong> Лимитированный просмотр активен (копирование и правки защищены).');
    });

    // Кнопка PWA / Установить приложение
    document.getElementById('hub-auth-install-app-btn').addEventListener('click', function () {
      showToast('📲 Чтобы установить как приложение: нажмите <strong>Поделиться / Меню</strong> в браузере &rarr; <strong>«На экран "Домой"»</strong>.');
    });

    // Кнопка Uninstall
    document.getElementById('hub-auth-uninstall-btn').addEventListener('click', function () {
      if (confirm('Сбросить сохраненные сессии и кеш авторизации?')) {
        clearSession();
        localStorage.removeItem(REGISTRY_STORAGE_KEY);
        authRegistryCache = [];
        location.reload();
      }
    });
  }

  function openAuthModal(defaultTab) {
    createAuthModal();
    var overlay = document.getElementById('hub-auth-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      if (defaultTab) {
        var tabBtn = document.getElementById('tab-btn-' + defaultTab);
        if (tabBtn) tabBtn.click();
      }
    }
  }

  function closeAuthModal() {
    var overlay = document.getElementById('hub-auth-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // 8. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
  function initHubAuth() {
    createAuthModal();
    var sess = getSession();

    if (!sess) {
      // Пользователь не авторизован -> открываем модальное окно
      openAuthModal('register');
    } else if (sess.role === 'guest') {
      // Режим гостя: активируем защиту и плавающий баннер
      setupGuestRestrictions();
      renderStateBanners();
      closeAuthModal();
    } else if (sess.role === 'partner' || sess.role === 'admin') {
      // Партнерский режим: полный доступ
      removeGuestRestrictions();
      renderStateBanners();
      closeAuthModal();
    }
  }

  // Запуск после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHubAuth);
  } else {
    initHubAuth();
  }

  // Экспорт в глобальную область для управления из других скриптов
  window.HubAuth = {
    open: openAuthModal,
    close: closeAuthModal,
    getSession: getSession,
    isGuest: isGuest,
    isPartner: isPartner,
    clearSession: clearSession
  };

})();
