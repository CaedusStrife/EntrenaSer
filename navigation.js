function switchScreen(screenId) {
  const loginScreen = document.getElementById('screen-login');
  const registerScreen = document.getElementById('screen-register');
  const recoveryScreen = document.getElementById('screen-recovery');
  const appLayout = document.getElementById('app-layout');
  
  if (screenId === 'screen-login') {
    localStorage.removeItem('entrena-user');
    // Show login screen, hide others
    loginScreen?.classList.remove('hidden');
    loginScreen?.setAttribute('aria-hidden', 'false');
    registerScreen?.classList.add('hidden');
    registerScreen?.setAttribute('aria-hidden', 'true');
    recoveryScreen?.classList.add('hidden');
    recoveryScreen?.setAttribute('aria-hidden', 'true');
    appLayout.classList.add('hidden');
    // Focus first input
    const firstInput = loginScreen?.querySelector('.bowl-input');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    return;
  }
  
  // Hide all login screens
  loginScreen?.classList.add('hidden');
  loginScreen?.setAttribute('aria-hidden', 'true');
  registerScreen?.classList.add('hidden');
  registerScreen?.setAttribute('aria-hidden', 'true');
  recoveryScreen?.classList.add('hidden');
  recoveryScreen?.setAttribute('aria-hidden', 'true');
  appLayout.classList.remove('hidden');
  
  // Activar pestaña de Progreso por defecto al entrar a la app
  if (screenId === 'screen-progress') {
    const progressTab = document.getElementById('screen-progress');
    const progressBtn = document.querySelector('.sidebar-menu .nav-btn[onclick*="screen-progress"]');
    if (progressTab) {
      // Ocultar todas las pestañas primero
      document.querySelectorAll('.screen-tab.paper-sheet').forEach(sheet => {
        sheet.classList.add('hidden');
        sheet.classList.remove('sheet-enter');
      });
      // Mostrar progreso
      progressTab.classList.remove('hidden');
      void progressTab.offsetWidth;
      progressTab.classList.add('sheet-enter');
      if (progressBtn) progressBtn.classList.add('active');
    }
  }
}

// New screen management for organic login design
function showLoginScreen(screenId) {
  const screens = {
    login: document.getElementById('screen-login'),
    register: document.getElementById('screen-register'),
    recovery: document.getElementById('screen-recovery')
  };
  
  Object.values(screens).forEach(screen => {
    screen?.classList.add('hidden');
    screen?.setAttribute('aria-hidden', 'true');
  });
  
  const target = screens[screenId];
  if (target) {
    target.classList.remove('hidden');
    target.setAttribute('aria-hidden', 'false');
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    // Focus first input
    const firstInput = target.querySelector('.bowl-input');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }
}

// Backward compatibility
function mostrarRegistro() {
  showLoginScreen('register');
}

function mostrarLogin() {
  showLoginScreen('login');
}

function mostrarRecuperacion() {
  showLoginScreen('recovery');
}

function goHome() {
  const progressBtn = document.querySelector('.sidebar-menu .nav-btn[onclick*="screen-progress"]');
  switchTab('screen-progress', progressBtn);
  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) {
    document.getElementById('mobile-menu-toggle')?.click();
  }
}

function switchTab(tabId, btnElement) {
  console.log('switchTab called with tabId:', tabId);
  
  const sheets = document.querySelectorAll('.screen-tab.paper-sheet');
  sheets.forEach(sheet => {
    sheet.classList.add('hidden');
    sheet.classList.remove('sheet-enter');
  });
  document.querySelectorAll('.sidebar-menu .nav-btn').forEach((btn) => btn.classList.remove('active'));
  const activeSheet = document.getElementById(tabId);
  if (activeSheet) {
    activeSheet.classList.remove('hidden');
    // Trigger reflow for animation
    void activeSheet.offsetWidth;
    activeSheet.classList.add('sheet-enter');
  }
  if (btnElement) btnElement.classList.add('active');
  
  // Si se navega manualmente a la pestaña de entrenamiento (sin callback), mostrar todos los ejercicios
  if (tabId === 'screen-workout' && window.renderExercises && window.allExercises) {
    console.log('switchTab: Rendering all exercises (manual navigation)');
    window.renderExercises(window.allExercises);
  }
  
  if (tabId === 'screen-map' && typeof refreshWorkoutMap === 'function') refreshWorkoutMap();
  
  if (tabId === 'screen-progress' && typeof loadProgress === 'function') loadProgress();
  
    if (tabId === 'screen-profile' && typeof initProfilePage === 'function') initProfilePage();
}

document.addEventListener('DOMContentLoaded', () => {
  // Always show login screen first - no auto-login
  // User must explicitly log in each session
  const loginScreen = document.getElementById('screen-login');
  const appLayout = document.getElementById('app-layout');
  if (loginScreen && appLayout) {
    loginScreen.classList.remove('hidden');
    appLayout.classList.add('hidden');
  }

  const menuToggle = document.getElementById('mobile-menu-toggle');
  const navigation = document.getElementById('mobile-navigation');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  
  if (!menuToggle || !navigation || !sidebar || !sidebarOverlay) return;

  function toggleSidebar() {
    const isOpen = sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('visible', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Cerrar navegación' : 'Abrir navegación');
    menuToggle.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`;
    
    // Also update all sidebar toggle buttons in headers
    document.querySelectorAll('.sidebar-toggle').forEach(btn => {
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.setAttribute('aria-label', isOpen ? 'Cerrar navegación' : 'Abrir navegación');
      btn.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`;
    });
    
    if (window.lucide) lucide.createIcons();
  }

  menuToggle.addEventListener('click', toggleSidebar);
  
  // Add event listeners to all sidebar toggle buttons in headers
  document.querySelectorAll('.sidebar-toggle').forEach(btn => {
    btn.addEventListener('click', toggleSidebar);
  });
  
  // Close sidebar when clicking overlay
  sidebarOverlay.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      toggleSidebar();
    }
  });

  navigation.querySelectorAll('.nav-btn').forEach((button) => {
    button.addEventListener('click', () => {
      // Close sidebar on all screen sizes after navigation
      if (sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
