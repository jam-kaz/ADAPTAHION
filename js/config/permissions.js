import { GROUPS } from '../store/groupsData.js';

export const ALL_GROUP_IDS = GROUPS.map(g => g.id);

export const ROLE_CONFIG = {
    student: {
        title: 'Студент',
        defaultTab: 'home',
        canExportExcel: false,
        tabs: [
            { id: 'home', label: 'Главная' },
            { id: 'events', label: 'Мероприятия' },
            { id: 'surveys', label: 'Тесты и опросы' },
            { id: 'clubs', label: 'Коллективы' },
            { id: 'links', label: 'Полезные ссылки' },
            { id: 'profile', label: 'Мой кабинет' },
            { id: 'appeals', label: 'Обращения' }
        ]
    },
    curator: {
        title: 'Куратор',
        defaultTab: 'dash',
        canExportExcel: true,
        tabs: [
            { id: 'dash', label: 'Сводка по группам' },
            { id: 'appeals', label: 'Обращения групп' },
            { id: 'content', label: 'Контент и рассылки' },
            { id: 'reports', label: 'Отчёты' }
        ]
    },
    dean: {
        title: 'Декан',
        defaultTab: 'summary',
        canExportExcel: true,
        tabs: [
            { id: 'summary', label: 'Сводка факультета' },
            { id: 'tests', label: 'Результаты тестов и графики' },
            { id: 'partners', label: 'Эффективность партнёров' },
            { id: 'reports', label: 'Отчёты' }
        ]
    },
    admin: {
        title: 'Администратор',
        defaultTab: 'stats',
        canExportExcel: false,
        tabs: [
            { id: 'stats', label: 'Сводка интересов' },
            { id: 'roles', label: 'Роли и доступы' },
            { id: 'integrations', label: 'Интеграции' },
            { id: 'tracking', label: 'События и согласия' },
            { id: 'audit', label: 'Журнал и партнёры' }
        ]
    }
};

// Возвращает массив ID групп, к которым у пользователя есть доступ
export function getAllowedGroups(user) {
    if (!user) return [];
    if (user.role === 'dean' || user.role === 'admin') {
        return ALL_GROUP_IDS;
    }
    if (user.role === 'curator') {
        return Array.isArray(user.assignedGroups) ? user.assignedGroups : [];
    }
    if (user.role === 'student') {
        return user.groupId ? [user.groupId] : [];
    }
    return [];
}

// Проверка доступа к конкретной группе
export function canAccessGroup(user, groupId) {
    return getAllowedGroups(user).includes(groupId);
}
