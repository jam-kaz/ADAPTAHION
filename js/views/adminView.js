import { db } from '../store/db.js';
import { PARTNERS } from '../store/contentData.js';
import { ROLE_CONFIG } from '../config/permissions.js';
import { analyticsService } from '../services/analyticsService.js';
import { T, head, tg, sw, ints, evs } from '../components/uiKit.js';

// Глобальный обработчик сброса демонстрационной базы к исходному состоянию
window.resetSystemDatabase = () => {
    db.reset();
    T('База данных сброшена к исходным показателям (25 студентов, 5 групп).');
    if (typeof window.rerenderCurrentView === 'function') {
        window.rerenderCurrentView();
    }
};

export function renderAdminView(tab, user) {
    const kpi = analyticsService.getOverallKPI(user);
    const groupsSummary = analyticsService.getGroupsSummary(user);
    const allUsers = db.getUsers();
    const logs = db.getLogs();

    // 1. Сводка интересов и общие метрики системы
    if (tab === 'stats') {
        const groupsRows = groupsSummary.map(g => `
            <tr>
                <td><b>${g.groupName}</b></td>
                <td>${g.direction}</td>
                <td>${g.activeStudentsCount} / ${g.studentsCount}</td>
                <td>${g.testsPassedCount}</td>
                <td><b>${g.avgScore}%</b></td>
            </tr>
        `).join('');

        return `
            ${head('Сводка интересов и активность системы', 'Мониторинг всех учебных групп и вовлечённости студентов в реальном времени')}
            <div class="g">
                <div class="c">
                    <div class="k">${kpi.totalStudents}<small>зарегистрировано студентов (5 групп)</small></div>
                </div>
                <div class="c">
                    <div class="k">${kpi.totalTests}<small>пройдено адаптационных тестов</small></div>
                </div>
                <div class="c">
                    <div class="k">${kpi.avgFacultyScore}%<small>средний балл по университету</small></div>
                </div>
            </div>
            <div class="g">
                ${ints(user)}
                ${evs()}
            </div>
            <div class="c">
                <h2>Активность по учебным группам</h2>
                <table>
                    <tr><th>Группа</th><th>Направление</th><th>Прошли тесты</th><th>Всего анкет</th><th>Средний балл</th></tr>
                    ${groupsRows}
                </table>
            </div>
        `;
    }

    // 2. Роли и матрица прав доступа (RBAC)
    if (tab === 'roles') {
        const curators = allUsers.filter(u => u.role === 'curator');
        const curatorRows = curators.map(c => `
            <tr>
                <td><b>${c.name}</b></td>
                <td><code>${c.login}</code></td>
                <td>${(c.assignedGroups || []).map(g => tg(g)).join(' ')}</td>
                <td>${tg('Активен', 'g')}</td>
            </tr>
        `).join('');

        const students = allUsers.filter(u => u.role === 'student');
        const studentRows = students.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${tg(s.groupId)}</td>
                <td><code>${s.login}</code></td>
                <td style="font-size:12px;color:var(--mu)">${(s.interests || []).join(', ')}</td>
            </tr>
        `).join('');

        return `
            ${head('Роли и матрица доступов (RBAC)', 'Разграничение прав кураторов по группам, деканата и 25 учётных записей студентов')}
            <div class="c" style="margin-bottom:16px">
                <h2>Закрепление кураторов за учебными группами</h2>
                <table>
                    <tr><th>Куратор</th><th>Логин</th><th>Доступные группы</th><th>Статус</th></tr>
                    ${curatorRows}
                </table>
            </div>
            <div class="c" style="margin-bottom:16px">
                <h2>Матрица прав ролей</h2>
                <table>
                    <tr><th>Роль</th><th>Охват данных</th><th>Экспорт Excel</th><th>Вкладок</th></tr>
                    <tr><td><b>Студент</b></td><td>Личный кабинет, тесты своей группы</td><td>${tg('Нет', 'r')}</td><td>${ROLE_CONFIG.student.tabs.length}</td></tr>
                    <tr><td><b>Куратор</b></td><td>Только закреплённые группы</td><td>${tg('Да', 'g')}</td><td>${ROLE_CONFIG.curator.tabs.length}</td></tr>
                    <tr><td><b>Декан</b></td><td>Все 5 групп факультета + графики</td><td>${tg('Да', 'g')}</td><td>${ROLE_CONFIG.dean.tabs.length}</td></tr>
                    <tr><td><b>Администратор</b></td><td>Полный доступ и аудит</td><td>${tg('Обезличено', 'y')}</td><td>${ROLE_CONFIG.admin.tabs.length}</td></tr>
                </table>
            </div>
            <div class="c">
                <h2>Реестр зарегистрированных студентов (${students.length} чел.)</h2>
                <table>
                    <tr><th>ФИО студента</th><th>Группа</th><th>Логин</th><th>Интересы</th></tr>
                    ${studentRows}
                </table>
            </div>
        `;
    }

    // 3. Интеграции с порталами вуза
    if (tab === 'integrations') {
        return `
            ${head('Интеграции с сервисами Финуниверситета', 'Синхронизация расписания, БРС и учётных записей ЕСИА / lk.fa.ru')}
            <div class="c">
                <table>
                    <tr><th>Сервис</th><th>Протокол</th><th>Статус</th><th>Управление</th></tr>
                    <tr><td><b>Личный кабинет (lk.fa.ru)</b></td><td>REST API / OAuth2</td><td>${tg('Подключено', 'g')}</td><td>${sw(true, "T('Синхронизация с lk.fa.ru обновлена')")}</td></tr>
                    <tr><td><b>Расписание (ruz.fa.ru)</b></td><td>JSON Feed</td><td>${tg('Подключено', 'g')}</td><td>${sw(true, "T('Обновление расписания включено')")}</td></tr>
                    <tr><td><b>Портал Moodle (org.fa.ru)</b></td><td>LTI 1.3</td><td>${tg('Подключено', 'g')}</td><td>${sw(true, "T('Интеграция с Moodle активна')")}</td></tr>
                    <tr><td><b>Балльно-рейтинговая система (БРС)</b></td><td>SOAP / XML</td><td>${tg('Ожидание', 'y')}</td><td>${sw(false, "T('Статус шлюза БРС изменён')")}</td></tr>
                </table>
                <div style="margin-top:16px">
                    <button class="b2" onclick="resetSystemDatabase()">Сбросить демо-базу к исходным данным</button>
                </div>
            </div>
        `;
    }

    // 4. События и согласия (ФЗ-152)
    if (tab === 'tracking') {
        return `
            ${head('События и согласия по ФЗ-152', 'Настройка сбора телеметрии и согласий студентов на обработку данных')}
            <div class="c">
                <div class="row" style="padding:10px 0;border-bottom:1px solid var(--ln)">
                    <div>
                        <b>Передача результатов адаптационных тестов кураторам и деканату</b>
                        <div style="font-size:13px;color:var(--mu)">Мгновенное обновление дашбордов при отправке анкеты студентом</div>
                    </div>
                    ${sw(true, "T('Настройка передачи результатов обновлена')")}
                </div>
                <div class="row" style="padding:10px 0;border-bottom:1px solid var(--ln)">
                    <div>
                        <b>Обязательное согласие на обработку ПДн при первом входе (ФЗ-152)</b>
                        <div style="font-size:13px;color:var(--mu)">Обезличивание персональных данных в сводных отчётах</div>
                    </div>
                    ${sw(true, "T('Политика ФЗ-152 активна')")}
                </div>
                <div class="row" style="padding:10px 0">
                    <div>
                        <b>Трекинг переходов по полезным ссылкам и коллективам</b>
                        <div style="font-size:13px;color:var(--mu)">Используется для формирования рекомендаций студентам</div>
                    </div>
                    ${sw(true, "T('Сбор аналитики переходов обновлён')")}
                </div>
            </div>
        `;
    }

    // 5. Журнал аудита и партнёры
    if (tab === 'audit') {
        const logRows = logs.map(l => `
            <tr>
                <td><code>${l.time}</code></td>
                <td><b>${l.user}</b></td>
                <td>${l.action}</td>
            </tr>
        `).join('');

        const partnerRows = PARTNERS.map(p => `
            <tr class="${p.activeCount === 0 ? 'z' : ''}">
                <td><b>${p.name}</b></td>
                <td>${p.category}</td>
                <td>${p.activeCount} / ${p.quota}</td>
                <td>${p.activeCount === 0 ? tg('Нулевая активность', 'r') : tg('Активен', 'g')}</td>
            </tr>
        `).join('');

        return `
            ${head('Журнал аудита и партнёры', 'История действий пользователей в системе и контроль активности партнёрских программ')}
            <div class="c" style="margin-bottom:16px">
                <h2>Журнал событий безопасности и действий (${logs.length})</h2>
                <table>
                    <tr><th>Время</th><th>Пользователь</th><th>Действие</th></tr>
                    ${logRows}
                </table>
            </div>
            <div class="c">
                <h2>Партнёрские программы</h2>
                <table>
                    <tr><th>Партнёр</th><th>Направление</th><th>Вовлечено</th><th>Статус</th></tr>
                    ${partnerRows}
                </table>
            </div>
        `;
    }

    return '';
}
