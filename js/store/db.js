import { USERS } from './usersData.js';
import { GROUPS } from './groupsData.js';
import { SURVEYS, EVENTS } from './contentData.js';

const STORAGE_KEY = 'finuniver_adaptation_db_clean_v2';

// Чистое начальное состояние: 0 пройденных тестов, 0 обращений, 0 записей
function createInitialState() {
    return {
        surveyResults: [],
        appeals: [],
        eventRegistrations: [],
        auditLogs: [
            { time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), user: 'Система', action: 'Инициализация чистой базы (25 студентов, 5 групп)' }
        ]
    };
}

class Database {
    constructor() {
        this.state = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Ошибка чтения localStorage, загружена чистая база', e);
        }
        const initial = createInitialState();
        this.save(initial);
        return initial;
    }

    save(state = this.state) {
        this.state = state;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Ошибка записи в localStorage', e);
        }
    }

    reset() {
        const fresh = createInitialState();
        this.save(fresh);
        return fresh;
    }

    getUsers() {
        return USERS;
    }

    getStudentsByGroups(groupIds) {
        return USERS.filter(u => u.role === 'student' && groupIds.includes(u.groupId));
    }

    getGroups() {
        return GROUPS;
    }

    getSurveys() {
        return SURVEYS;
    }

    getEvents() {
        return EVENTS;
    }

    // Сохранение или обновление реального результата теста студента
    saveSurveyResult({ userId, groupId, surveyId, score, maxScore = 100, answers }) {
        const today = new Date().toLocaleDateString('ru-RU');
        const existingIdx = this.state.surveyResults.findIndex(
            r => r.userId === userId && r.surveyId === surveyId
        );

        const record = {
            id: existingIdx >= 0 ? this.state.surveyResults[existingIdx].id : 'res_' + Date.now(),
            userId,
            groupId,
            surveyId,
            score,
            maxScore,
            answers,
            date: today
        };

        if (existingIdx >= 0) {
            this.state.surveyResults[existingIdx] = record;
        } else {
            this.state.surveyResults.push(record);
        }

        const student = USERS.find(u => u.id === userId);
        const actorName = student ? `${student.name} (${groupId})` : userId;
        this.addLog(actorName, `Пройден тест «${surveyId}» (${score}/${maxScore}%)`);
        this.save();
        return record;
    }

    getResultsByUser(userId) {
        return this.state.surveyResults.filter(r => r.userId === userId);
    }

    getResultsByGroups(groupIds) {
        return this.state.surveyResults.filter(r => groupIds.includes(r.groupId));
    }

    toggleEventRegistration(userId, eventId) {
        const idx = this.state.eventRegistrations.findIndex(
            r => r.userId === userId && r.eventId === eventId
        );
        let registered = false;
        if (idx >= 0) {
            this.state.eventRegistrations.splice(idx, 1);
        } else {
            this.state.eventRegistrations.push({ userId, eventId });
            registered = true;
        }
        const student = USERS.find(u => u.id === userId);
        const actorName = student ? student.name : userId;
        this.addLog(actorName, `${registered ? 'Запись на' : 'Отмена записи на'} мероприятие ${eventId}`);
        this.save();
        return registered;
    }

    isUserRegistered(userId, eventId) {
        return this.state.eventRegistrations.some(
            r => r.userId === userId && r.eventId === eventId
        );
    }

    getAppealsByUser(userId) {
        return this.state.appeals.filter(a => a.userId === userId);
    }

    getAppealsByGroups(groupIds) {
        return this.state.appeals.filter(a => groupIds.includes(a.groupId));
    }

    addAppeal({ userId, userName, groupId, topic, text }) {
        const newAppeal = {
            id: 'app_' + Date.now(),
            userId,
            userName,
            groupId,
            topic,
            text,
            status: 'новое',
            statusClass: '',
            date: new Date().toLocaleDateString('ru-RU')
        };
        this.state.appeals.unshift(newAppeal);
        this.addLog(`${userName} (${groupId})`, `Новое обращение: «${topic}»`);
        this.save();
        return newAppeal;
    }

    updateAppealStatus(appealId, status, statusClass) {
        const appeal = this.state.appeals.find(a => a.id === appealId);
        if (appeal) {
            appeal.status = status;
            appeal.statusClass = statusClass;
            this.addLog('Куратор', `Статус обращения «${appeal.topic}» изменён на «${status}»`);
            this.save();
        }
        return appeal;
    }

    addLog(user, action) {
        const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        this.state.auditLogs.unshift({ time: now, user, action });
        if (this.state.auditLogs.length > 50) {
            this.state.auditLogs.pop();
        }
    }

    getLogs() {
        return this.state.auditLogs;
    }
}

export const db = new Database();
