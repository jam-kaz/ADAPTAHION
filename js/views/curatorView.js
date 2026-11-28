import { db } from '../store/db.js';
import { authService } from '../services/authService.js';
import { analyticsService } from '../services/analyticsService.js';
import { T, head, tg, bar, sw, ints, rep } from '../components/uiKit.js';

window.changeAppealStatus = (appealId, status, statusClass) => {
    db.updateAppealStatus(appealId, status, statusClass);
    T(`Статус обращения изменён на «${status}»`);
    if (typeof window.rerenderCurrentView === 'function') {
        window.rerenderCurrentView();
    }
};

export function renderCuratorView(tab, user) {
    const allowedGroups = authService.getUserAllowedGroups();
    const kpi = analyticsService.getOverallKPI(user);
    const groupsSummary = analyticsService.getGroupsSummary(user);
    const studentsReport = analyticsService.getStudentsDetailedReport(user, 'ALL');
    const appeals = db.getAppealsByGroups(allowedGroups);

    // 1. Сводка по закреплённым группам
    if (tab === 'dash') {
        const groupCards = groupsSummary.map(g => `
            <div class="c">
                <div class="row">
                    <b>Группа ${g.groupName}</b>
                    ${tg(`${g.activeStudentsCount}/${g.studentsCount} прошли тесты`, g.completionRate >= 60 ? 'g' : 'y')}
                </div>
                <div style="font-size:12px;color:var(--mu);margin:4px 0 10px">${g.direction} · ${g.course} курс</div>
                ${bar('Средний балл адаптации', g.avgScore)}
                ${bar('Охват тестированием', g.completionRate)}
            </div>
        `).join('');

        const studentRows = studentsReport.map(st => `
            <tr>
                <td><b>${st.name}</b></td>
                <td>${tg(st.groupId)}</td>
                <td>${st.scoresMap.brs !== null ? st.scoresMap.brs + '%' : '—'}</td>
                <td>${st.scoresMap.adapt !== null ? st.scoresMap.adapt + '%' : '—'}</td>
                <td>${st.scoresMap.extra !== null ? st.scoresMap.extra + '%' : '—'}</td>
                <td><b>${st.passedCount > 0 ? st.avgScore + '%' : 'Не проходил'}</b></td>
            </tr>
        `).join('');

        return `
            ${head('Кабинет куратора', `Доступ разрешён только к закреплённым группам: ${allowedGroups.join(', ')}`)}
            <div class="g">
                <div class="c"><div class="k">${kpi.groupsCount}<small>закреплённых групп</small></div></div>
                <div class="c"><div class="k">${kpi.totalStudents}<small>студентов под кураторством</small></div></div>
                <div class="c"><div class="k">${kpi.avgFacultyScore}%<small>средний балл по вашим группам</small></div></div>
                <div class="c"><div class="k">${appeals.filter(a => a.status === 'новое').length}<small>новых обращений</small></div></div>
            </div>
            <div class="g">${groupCards}</div>
            <div class="c" style="margin-bottom:16px">
                <h2>Результаты тестирования студентов (${allowedGroups.join(', ')})</h2>
                <table>
                    <tr><th>Студент</th><th>Группа</th><th>БРС</th><th>Адаптация</th><th>Внеучебка</th><th>Средний балл</th></tr>
                    ${studentRows}
                </table>
            </div>
            ${ints(user)}
        `;
    }

    // 2. Обращения студентов закреплённых групп
    if (tab === 'appeals') {
        const rows = appeals.map(a => `
            <tr>
                <td><b>${a.userName}</b><div style="font-size:12px;color:var(--mu)">Группа ${a.groupId} · ${a.date}</div></td>
                <td><b>${a.topic}</b><div style="font-size:12px;color:var(--mu)">${a.text || ''}</div></td>
                <td>${tg(a.status, a.statusClass)}</td>
                <td style="white-space:nowrap">
                    <button class="b2" style="padding:4px 10px;font-size:12px" onclick="changeAppealStatus('${a.id}', 'в работе', 'y')">В работу</button>
                    <button class="b" style="padding:4px 10px;font-size:12px" onclick="changeAppealStatus('${a.id}', 'решено', 'g')">Решено</button>
                </td>
            </tr>
        `).join('');

        return `
            ${head('Обращения студентов', `Показаны обращения только из ваших групп: ${allowedGroups.join(', ')}`)}
            <div class="c">
                ${appeals.length ? `
                    <table>
                        <tr><th>Студент</th><th>Обращение</th><th>Статус</th><th>Действия</th></tr>
                        ${rows}
                    </table>
                ` : '<p style="color:var(--mu)">По вашим группам пока нет обращений.</p>'}
            </div>
        `;
    }

    // 3. Контент и рассылки
    if (tab === 'content') {
        return `
            ${head('Контент и рассылки по группам', `Отправка уведомлений студентам групп ${allowedGroups.join(', ')}`)}
            <div class="c" style="margin-bottom:16px">
                <h2>Быстрая рассылка студентам ваших групп</h2>
                <div style="margin-bottom:10px">
                    <input type="text" placeholder="Заголовок объявления (например: Напоминание о прохождении теста БРС)">
                </div>
                <div style="margin-bottom:12px">
                    <textarea rows="3" placeholder="Текст сообщения для студентов..."></textarea>
                </div>
                <button class="b" onclick="T('Уведомление отправлено студентам групп: ${allowedGroups.join(', ')}')">Отправить рассылку</button>
            </div>
            <div class="c">
                <h2>Автоматические напоминания</h2>
                <div class="row" style="padding:8px 0;border-bottom:1px solid var(--ln)">
                    <span>Напоминать непрошедшим тест студентам каждые 3 дня</span>
                    ${sw(true, "T('Настройка сохранена')")}
                </div>
                <div class="row" style="padding:8px 0">
                    <span>Анонсы мероприятий и хакатонов факультета</span>
                    ${sw(true, "T('Настройка сохранена')")}
                </div>
            </div>
        `;
    }

    // 4. Отчёты
    if (tab === 'reports') {
        return rep(user);
    }

    return '';
}
