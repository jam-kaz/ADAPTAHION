import { db } from '../store/db.js';
import { getAllowedGroups } from '../config/permissions.js';
import { analyticsService } from '../services/analyticsService.js';
import { exportService } from '../services/exportService.js';
import { authService } from '../services/authService.js';

// Короткий селектор DOM-элементов
export const $ = selector => document.querySelector(selector);

// Всплывающее уведомление (Toast)
export const T = message => {
    const t = $('#toast');
    if (!t) return;
    t.textContent = message;
    t.style.display = 'block';
    clearTimeout(T.timer);
    T.timer = setTimeout(() => {
        t.style.display = 'none';
    }, 2800);
};

// Прогресс-бар с подписью и процентом
export const bar = (label, percent, isDanger = false) => `
    <div class="row" style="font-size:13px">
        <span>${label}</span>
        <b>${percent}%</b>
    </div>
    <div class="bar ${isDanger ? 'r' : ''}">
        <i style="width:${Math.min(100, Math.max(0, percent))}%"></i>
    </div>
`;

// Тег / статусный бейдж
export const tg = (text, variant = '') => `<span class="tag ${variant}">${text}</span>`;

// Переключатель (Switch)
export const sw = (isOn, onClickCode = '') => `
    <button class="sw ${isOn ? 'on' : ''}" onclick="this.classList.toggle('on');${onClickCode}"></button>
`;

// Заголовок и подзаголовок страницы
export const head = (title, subtitle) => `<h1>${title}</h1><p class="sub">${subtitle}</p>`;

// Модальное окно
export const mod = htmlContent => {
    const body = $('#mb');
    const modal = $('#mod');
    if (!body || !modal) return;
    body.innerHTML = htmlContent + '<p style="margin-top:16px"><button class="b2" onclick="document.getElementById(\'mod\').style.display=\'none\'">Закрыть</button></p>';
    modal.style.display = 'grid';
};

// Карточка внешней ссылки
export const lk = (title, description, url) => `
    <div class="c">
        <h2>${title}</h2>
        <div style="color:var(--mu);margin-bottom:12px;font-size:13px;word-break:break-all">${description}</div>
        <a class="b" href="${url}" target="_blank" rel="noopener">Перейти</a>
    </div>
`;

// Виджет распределения интересов (считает только по реальным пройденным тестам)
export const ints = user => {
    const dist = analyticsService.getInterestsDistribution(user);
    return `
        <div class="c">
            <h2>Интерес студентов по направлениям</h2>
            ${dist.map(item => bar(`${item.label} (${item.count} чел.)`, item.percent)).join('')}
            <div style="font-size:12px;color:var(--mu)">
                Рассчитано только по реальным ответам студентов в опросе «Интересы и внеучебка»
            </div>
        </div>
    `;
};

// Виджет популярности мероприятий (считает реальные записи студентов из доступных групп)
export const evs = () => {
    const user = authService.getUser();
    const allowedGroups = getAllowedGroups(user);
    const allowedStudentIds = new Set(
        db.getStudentsByGroups(allowedGroups).map(s => s.id)
    );
    const allEvents = db.getEvents();
    const registrations = db.state.eventRegistrations || [];

    const rowsHtml = allEvents.map(event => {
        const count = registrations.filter(
            r => r.eventId === event.id && allowedStudentIds.has(r.userId)
        ).length;
        return `<tr><td>${event.title}</td><td><b>${count}</b></td></tr>`;
    }).join('');

    return `
        <div class="c">
            <h2>Записи студентов на мероприятия</h2>
            <table>
                <tr><th>Мероприятие</th><th>Записей</th></tr>
                ${rowsHtml}
            </table>
        </div>
    `;
};

// Глобальный обработчик кнопок экспорта
window.handleExportReport = format => {
    const user = authService.getUser();
    const res = exportService.exportReport(user, format);
    T(res.message);
};

// Общий экран «Отчёты и экспорт» для куратора и деканата
export const rep = user => {
    const canExcel = exportService.canExportExcel(user);
    const kpi = analyticsService.getOverallKPI(user);
    return `
        ${head('Отчёты и экспорт', 'PDF — для всех ролей, Excel — только куратор и декан; экспорт фиксируется в журнале аудита.')}
        <div class="c">
            <div class="row">
                <div>
                    <b>Сводный отчёт по результатам адаптации и опросов</b>
                    <div class="sub" style="margin:0">Охват: ${kpi.groupsCount} гр. (${kpi.totalStudents} студ., пройдено тестов: ${kpi.totalTests})</div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="b" onclick="handleExportReport('pdf')">Скачать PDF</button>
                    <button class="b2" ${canExcel ? '' : 'disabled'} onclick="handleExportReport('xlsx')">Excel (.xlsx)</button>
                </div>
            </div>
            <div class="note">Общефакультетские отчёты обезличены по ФЗ-152. Данные обновляются в реальном времени после прохождения тестов студентами.</div>
            <table>
                <tr><th>Отчёт</th><th>Дата</th><th>Формат</th></tr>
                <tr><td>Адаптация и результаты тестирования, текущий срез</td><td>Сегодня</td><td>PDF / Excel</td></tr>
                <tr><td>Вовлечённость первокурсников, сентябрь</td><td>01.10.2026</td><td>PDF</td></tr>
                <tr><td>Эффективность партнёров, Q3</td><td>15.09.2026</td><td>PDF / Excel</td></tr>
            </table>
        </div>
    `;
};
