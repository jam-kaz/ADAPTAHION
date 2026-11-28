import { authService } from './services/authService.js';
import { ROLE_CONFIG } from './config/permissions.js';
import { $, T } from './components/uiKit.js';
import { renderStudentView } from './views/studentView.js';
import { renderCuratorView } from './views/curatorView.js';
import { renderDeanView } from './views/deanView.js';
import { renderAdminView } from './views/adminView.js';

// Делаем функцию уведомлений доступной глобально
window.T = T;

let currentTab = '';

// Отрисовка левого меню навигации в зависимости от роли пользователя
function renderSidebar(user, roleConfig) {
    const navEl = $('#nv');
    if (!navEl) return;

    let subInfo = '';
    if (user.role === 'student') {
        subInfo = `${user.groupId} · ${user.course} курс`;
    } else if (user.role === 'curator') {
        subInfo = `Группы: ${user.assignedGroups.join(', ')}`;
    } else {
        subInfo = roleConfig.title;
    }

    const buttonsHtml = roleConfig.tabs.map(t => `
        <button class="${t.id === currentTab ? 'on' : ''}" data-tab="${t.id}">
            ${t.label}
        </button>
    `).join('');

    navEl.innerHTML = `
        <div class="who">
            <b>${user.name}</b>
            <span>${subInfo}</span>
        </div>
        ${buttonsHtml}
    `;

    navEl.querySelectorAll('button[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });
}

// Переключение вкладок внутри личного кабинета
function switchTab(tabId) {
    const user = authService.getUser();
    const roleConfig = authService.getUserRoleConfig();
    if (!user || !roleConfig) return;

    currentTab = tabId || roleConfig.defaultTab;
    renderSidebar(user, roleConfig);

    const mainEl = $('#mn');
    if (!mainEl) return;

    if (user.role === 'student') {
        mainEl.innerHTML = renderStudentView(currentTab, user, switchTab);
    } else if (user.role === 'curator') {
        mainEl.innerHTML = renderCuratorView(currentTab, user);
    } else if (user.role === 'dean') {
        mainEl.innerHTML = renderDeanView(currentTab, user);
    } else if (user.role === 'admin') {
        mainEl.innerHTML = renderAdminView(currentTab, user);
    }
}

// Глобальные хелперы для перерисовки интерфейса после сохранения тестов и обращений
window.switchTab = switchTab;
window.rerenderCurrentView = () => {
    switchTab(currentTab);
};

// Переключение между окном входа и рабочей областью
function updateLayoutState() {
    const user = authService.getUser();
    const roleConfig = authService.getUserRoleConfig();

    const loginScreen = $('#lg');
    const workspace = $('.wrap');
    const userHeaderBlock = $('#usr');
    const userHeaderName = $('#un');

    if (user && roleConfig) {
        if (loginScreen) loginScreen.style.display = 'none';
        if (workspace) workspace.style.display = 'flex';
        if (userHeaderBlock) userHeaderBlock.style.display = 'flex';
        if (userHeaderName) {
            userHeaderName.textContent = `${user.name} (${roleConfig.title})`;
        }
        switchTab(roleConfig.defaultTab);
    } else {
        if (loginScreen) loginScreen.style.display = 'grid';
        if (workspace) workspace.style.display = 'none';
        if (userHeaderBlock) userHeaderBlock.style.display = 'none';
    }
}

// Обработка нажатия на кнопку «Войти»
function handleLogin() {
    const loginInput = $('#lgn');
    const passInput = $('#lpw');
    const errorBox = $('#er');

    if (!loginInput || !passInput) return;

    const result = authService.login(loginInput.value, passInput.value);

    if (result.ok) {
        if (errorBox) errorBox.style.display = 'none';
        loginInput.value = '';
        passInput.value = '';
        updateLayoutState();
    } else {
        if (errorBox) {
            errorBox.textContent = result.error;
            errorBox.style.display = 'block';
        }
    }
}

// Выход из аккаунта
function handleLogout() {
    authService.logout();
    currentTab = '';
    updateLayoutState();
}

// Привязка событий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = $('#login-btn');
    const logoutBtn = $('#logout-btn');
    const loginField = $('#lgn');
    const passField = $('#lpw');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (loginField) {
        loginField.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    if (passField) {
        passField.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    // Проверяем, есть ли активная сессия при обновлении страницы
    updateLayoutState();
});
