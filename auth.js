/**
 * Auth module for Entrena tu ser — Organic/Natural login screen
 * Handles: login, register, recovery forms; validation; API integration
 * Works with the new organic design (login-redesign.css)
 */

(function() {
  'use strict';

  // ============================================================================
  // Form switching (login / register / recovery) - delegates to navigation.js
  // ============================================================================
  // These are now handled by navigation.js showLoginScreen()
  // Kept for backward compatibility
  window.mostrarRegistro = function() {
    if (typeof window.showLoginScreen === 'function') {
      window.showLoginScreen('register');
    }
  };

  window.mostrarLogin = function() {
    if (typeof window.showLoginScreen === 'function') {
      window.showLoginScreen('login');
    }
  };

  window.mostrarRecuperacion = function() {
    if (typeof window.showLoginScreen === 'function') {
      window.showLoginScreen('recovery');
    }
  };

  // ============================================================================
  // Form validation & submission
  // ============================================================================
  function clearFormStatus() {
    const statusEls = document.querySelectorAll('.login-screen .form-status');
    statusEls.forEach(el => {
      el.textContent = '';
      el.className = 'form-status';
    });
    const errorBowls = document.querySelectorAll('.login-screen .bowl.error');
    errorBowls.forEach(el => el.classList.remove('error'));
  }

  function setFormStatus(formId, message, isError = false) {
    const statusId = formId.replace('-form', '') + '-status';
    const statusEl = document.getElementById(statusId);
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'form-status' + (isError ? ' form-status-error' : '');
  }

  function setSubmitting(button, submitting) {
    if (!button) return;
    button.classList.toggle('submitting', submitting);
    if (submitting) {
      button.disabled = true;
    } else {
      button.disabled = false;
    }
  }

  async function handleSubmit(form, endpoint, successMessage, redirectScreen) {
    const formId = form.id;
    const submitBtn = form.querySelector('button[type="submit"]');
    const bowls = form.querySelectorAll('.bowl');

    // Validate
    let valid = true;
    bowls.forEach(bowl => {
      const input = bowl.querySelector('.bowl-input');
      if (input && !input.checkValidity()) {
        bowl.classList.add('error');
        valid = false;
      } else if (input) {
        bowl.classList.remove('error');
      }
    });

    // Password confirmation check for register
    if (formId === 'register-form') {
      const pwd = form.querySelector('#register-password');
      const pwdConfirm = form.querySelector('#register-password-confirmation');
      if (pwd && pwdConfirm && pwd.value !== pwdConfirm.value) {
        pwdConfirm.closest('.bowl').classList.add('error');
        setFormStatus(formId, 'Las contraseñas no coinciden', true);
        valid = false;
      }
    }

    if (!valid) return;

    setSubmitting(submitBtn, true);
    setFormStatus(formId, 'Procesando...', false);

    try {
      const formData = new FormData(form);
      const payload = {};
      formData.forEach((value, key) => { payload[key] = value; });

      const baseUrl = window.API_BASE_URL || 'http://localhost:5143';
      const response = await fetch(`${baseUrl}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || (response.status === 401 ? 'Credenciales incorrectas' : 'Error del servidor'));
      }

      const data = await response.json();

      // On login/register success, store user and redirect
      if (endpoint === 'login' || endpoint === 'register') {
        // Store JWT token and user data
        if (data.token) localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify({
          id: data.id,
          fullName: data.fullName || data.nombre_completo,
          email: data.email,
          avatar: data.avatar || { color: '#4adecd', initials: (data.fullName || data.nombre_completo || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3) }
        }));
        localStorage.setItem('entrena-user', JSON.stringify(data)); // Legacy compatibility

        setFormStatus(formId, successMessage || '¡Bienvenido!', false);
        submitBtn.classList.remove('submitting');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="check" style="width:20px;height:20px;"></i>';
        submitBtn.style.background = 'var(--sienna)';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
          submitBtn.innerHTML = '<span class="btn-text">Iniciar sesión</span>';
          submitBtn.style.background = '';
          if (typeof lucide !== 'undefined') lucide.createIcons();

          // Navegar a pantalla de progreso (con múltiples fallbacks)
          navigateToProgress();

          window.dispatchEvent(new Event('user-authenticated'));
        }, 800);
      } else {
        // Recovery success
        setFormStatus(formId, successMessage || 'Si el correo existe, recibirás instrucciones', false);
        setSubmitting(submitBtn, false);
      }

    } catch (error) {
      setFormStatus(formId, error.message, true);
      setSubmitting(submitBtn, false);
    }
  }

  // ============================================================================
  // Fallback navigation function
  // ============================================================================
  function navigateToProgress() {
    try {
      // Intento 1: Usar window.switchScreen si existe (definido en navigation.js)
      if (typeof window.switchScreen === 'function') {
        window.switchScreen('screen-progress');
        return;
      }

      // Intento 2: Manipulación directa del DOM si switchScreen no está definido
      const loginScreen = document.getElementById('screen-login');
      const appLayout = document.getElementById('app-layout');
      const progressScreen = document.getElementById('screen-progress');

      if (loginScreen && appLayout) {
        loginScreen.classList.add('hidden');
        loginScreen.setAttribute('aria-hidden', 'true');
        appLayout.classList.remove('hidden');
        appLayout.setAttribute('aria-hidden', 'false');

        // Intento 3: Ejecutar loadProgress si existe
        if (typeof window.loadProgress === 'function') {
          window.loadProgress();
        } else if (typeof window.renderExercises === 'function') {
          // Alternativa: renderizar ejercicios si loadProgress no existe
          if (window.allExercises) {
            window.renderExercises(window.allExercises);
          }
        }

        // Dispatch event para notificar que el usuario se autenticó
        window.dispatchEvent(new Event('user-authenticated'));
        console.log('Navegación a progreso completada via fallback DOM');
      } else {
        console.error('No se encontraron elementos screen-login o app-layout');
      }
    } catch (e) {
      // Errores silenciosos - el usuario puede haber hecho login y recargar página
      console.log('Login exitoso, navegación diferida...', e);
    }
  }

  // ============================================================================
  // Initialize on DOM ready
  // ============================================================================
  function initFloatingLabelsIfExists() {
    if (typeof initFloatingLabels === 'function') {
      initFloatingLabels();
    } else {
      console.log('initFloatingLabels no definido, saltando...');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFloatingLabelsIfExists);
  } else {
    initFloatingLabelsIfExists();
  }

  // ============================================================================
  // Login form
  // ============================================================================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(loginForm, 'login', '¡Accediendo...', 'screen-progress');
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(registerForm, 'register', '¡Cuenta creada!', 'screen-progress');
    });
  }

  // Recovery form
  const recoveryForm = document.getElementById('recovery-form');
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(recoveryForm, 'recovery', 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña');
    });
  }

})();