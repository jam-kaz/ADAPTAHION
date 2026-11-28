import { db } from '../store/db.js';
import { getAllowedGroups, ROLE_CONFIG } from '../config/permissions.js';

const SESSION_KEY = 'finuniver_current_user_id';

// Перевод символов английской раскладки в русскую для удобства ввода паролей
function normalizePassword(raw) {
    const map = {
        f: 'а', a: 'а',
        ',': 'б', '<': 'б',
        d: 'в',
        u: 'г'
    };
    return raw
        .trim()
        .toLowerCase()
        .split('')
        .map(ch => map[ch] || ch)
        .join('');
}

class AuthService {
    constructor() {
        this.currentUser = this.restoreSession();
    }

    restoreSession() {
        try {
            const savedId = sessionStorage.getItem(SESSION_KEY);
            if (savedId) {
                return db.getUsers().find(u => u.id === savedId) || null;
            }
        } catch (e) {
            console.warn('Не удалось восстановить сессию', e);
        }
        return null;
    }

    login(loginInput, passwordInput) {
        const cleanLogin = loginInput.trim().toLowerCase();
        const cleanPass = normalizePassword(passwordInput);

        const user = db.getUsers().find(
            u => u.login.toLowerCase() === cleanLogin && u.password === cleanPass
        );

        if (!user) {
            return { ok: false, error: 'Неверный логин или пароль. Проверьте данные.' };
        }

        this.currentUser = user;
        try {
            sessionStorage.setItem(SESSION_KEY, user.id);
        } catch (e) {
            console.warn('Ошибка сохранения сессии', e);
        }

        db.addLog(user.name, `Вход в систему (роль: ${ROLE_CONFIG[user.role]?.title || user.role})`);
        db.save();

        return { ok: true, user };
    }

    logout() {
        if (this.currentUser) {
            db.addLog(this.currentUser.name, 'Выход из системы');
            db.save();
        }
        this.currentUser = null;
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.warn('Ошибка очистки сессии', e);
        }
    }

    getUser() {
        return this.currentUser;
    }

    getUserRoleConfig() {
        if (!this.currentUser) return null;
        return ROLE_CONFIG[this.currentUser.role] || null;
    }

    getUserAllowedGroups() {
        return getAllowedGroups(this.currentUser);
    }
}

export const authService = new AuthService();
