import { db } from '../store/db.js';
import { analyticsService } from '../services/analyticsService.js';
import { head, tg, ints, evs, rep } from '../components/uiKit.js';
import {
    renderGroupedBarChart,
    renderSurveyComparisonChart,
    renderDonutChart
} from '../components/chartRenderer.js';

// Текущий фильтр группы во вкладке «Результаты тестов и графики»
let selectedGroupFilter = 'ALL';

// Глобальный обработчик смены группы в фильтре деканата
window.setDeanGroupFilter = groupId => {
    selectedGroupFilter = groupId;
    if (typeof window.rerenderCurrentView === 'function') {
        window.rerenderCurrentView();
    }
};

// Глобальный обработчик фильтрации таблицы партнёров (из макета)
window.filterDeanPartners = filterType => {
    const rows = document.querySelectorAll('#dean-partners-table tr[data-zero]');
    rows.forEach(row => {
        const isZero = row.getAttribute('data-zero') === '1';
        row.style.display = (filterType === 'all' || (filterType === 'zero' && isZero)) ? '' : 'none';
    });
    const btnAll = document.getElementById('btn-pt-all');
    const btnZero = document.getElementById('btn-pt-zero');
    if (btnAll && btnZero) {
        btnAll.className = filterType === 'all' ? 'on' : '';
        btnZero.className = filterType === 'zero' ? 'on' : '';
    }
};

export function renderDeanView(tab, user) {
    const kpi = analyticsService.getOverallKPI(user);
    const groupsSummary = analyticsService.getGroupsSummary(user);

    // 1. Сводка факультета
    if (tab === 'summary') {
        const groupRows = groupsSummary.map(g => `
            <tr>
                <td><b>${g.groupName}</b></td>
                <td>${g.direction}</td>
                <td>${g.activeStudentsCount} из ${g.studentsCount}</td>
                <td>${g.testsPassedCount}</td>
                <td><b>${g.avgScore}%</b></td>
                <td>${g.completionRate >= 60 ? tg('Активна', 'g') : tg('Низкий охват', 'y')}</td>
            </tr>
        `).join('');

        return `
            ${head('Сводка факультета', `Агрегированные данные по ${kpi.groupsCount} группам (${kpi.totalStudents} студентов) · ФЗ-152`)}
            <div class="g">
                <div class="c">
                    <div class="k">${kpi.totalStudents}<small>студентов в ${kpi.groupsCount} группах</small></div>
                </div>
                <div class="c">
                    <div class="k">${kpi.avgCompletion}%<small>средний охват тестированием</small></div>
                </div>
                <div class="c">
                    <div class="k">${kpi.avgFacultyScore}%<small>средний индекс адаптации</small></div>
                </div>
            </div>
            <div class="c" style="margin-bottom:16px">
                <h2>Показатели по учебным группам</h2>
                <table>
                    <tr>
                        <th>Группа</th>
                        <th>Направление</th>
                        <th>Прошли тесты</th>
                        <th>Всего анкет</th>
                        <th>Средний балл</th>
                        <th>Статус</th>
                    </tr>
                    ${groupRows}
                </table>
            </div>
            <div class="g">
                ${ints(user)}
                ${evs()}
            </div>
        `;
    }

    // 2. Новая вкладка: «Результаты тестов и графики»
    if (tab === 'tests') {
        const allGroups = db.getGroups();
        const fullStudentsReport = analyticsService.getStudentsDetailedReport(user, 'ALL');
        const filteredStudents = analyticsService.getStudentsDetailedReport(user, selectedGroupFilter);

        const filterButtons = [
            `<button class="${selectedGroupFilter === 'ALL' ? 'on' : ''}" onclick="setDeanGroupFilter('ALL')">Все группы (25)</button>`,
            ...allGroups.map(g => `
                <button class="${selectedGroupFilter === g.id ? 'on' : ''}" onclick="setDeanGroupFilter('${g.id}')">
                    ${g.name}
                </button>
            `)
        ].join('');

        const studentRows = filteredStudents.map(st => {
            const brs = st.scoresMap.brs !== null ? `${st.scoresMap.brs}%` : '—';
            const adapt = st.scoresMap.adapt !== null ? `${st.scoresMap.adapt}%` : '—';
            const extra = st.scoresMap.extra !== null ? `${st.scoresMap.extra}%` : '—';
            const statusBadge = st.passedCount === 0
                ? tg('Не проходил', 'r')
                : st.avgScore >= 85
                    ? tg('Высокий (' + st.avgScore + '%)', 'g')
                    : st.avgScore >= 65
                        ? tg('Средний (' + st.avgScore + '%)', 'y')
                        : tg('Риск (' + st.avgScore + '%)', 'r');

            return `
                <tr class="${st.passedCount === 0 ? 'z' : ''}">
                    <td><b>${st.name}</b></td>
                    <td>${tg(st.groupId)}</td>
                    <td>${brs}</td>
                    <td>${adapt}</td>
                    <td>${extra}</td>
                    <td>${st.passedCount} / ${st.totalSurveys}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        }).join('');

        return `
            ${head('Результаты тестов и графики', 'Сравнительная аналитика по группам ПИ25-1, ПИ26-1, ПМ24-1, ИБ25-1 и ИБ26-1')}
            
            <div class="g">
                <div class="c">
                    <h2>Сравнение групп: средний балл и охват</h2>
                    ${renderGroupedBarChart(groupsSummary)}
                </div>
                <div class="c">
                    <h2>Распределение студентов по уровню адаптации</h2>
                    ${renderDonutChart(fullStudentsReport)}
                </div>
            </div>

            <div class="c" style="margin-bottom:16px">
                <h2>Результаты групп в разрезе трёх адаптационных тестов</h2>
                ${renderSurveyComparisonChart(groupsSummary)}
            </div>

            <div class="c">
                <div class="row" style="margin-bottom:12px">
                    <h2 style="margin:0">Детальная ведомость результатов студентов</h2>
                    <div class="seg">${filterButtons}</div>
                </div>
                <table>
                    <tr>
                        <th>ФИО студента</th>
                        <th>Группа</th>
                        <th>Тест БРС</th>
                        <th>Адаптация</th>
                        <th>Внеучебка</th>
                        <th>Пройдено</th>
                        <th>Итоговый статус</th>
                    </tr>
                    ${studentRows}
                </table>
            </div>
        `;
    }

    // 3. Эффективность партнёров
    if (tab === 'partners') {
        const partners = [
            ['Партнёр Х', 0],
            ['Яндекс.Практикум', 312],
            ['VK Education', 204],
            ['Хакатоны.рф', 158]
        ];

        const rows = partners.map(([name, count]) => `
            <tr class="${count === 0 ? 'z' : ''}" data-zero="${count === 0 ? '1' : '0'}">
                <td><b>${name}</b></td>
                <td>${count} из 1000</td>
                <td>${count === 0 ? tg('Нулевая активность — расторгнуть договор', 'r') : tg('Договор продлить', 'g')}</td>
            </tr>
        `).join('');

        return `
            ${head('Эффективность партнёров', 'Решения по договорам принимаются по пороговой активности студентов')}
            <div class="c">
                <div class="row" style="margin-bottom:12px">
                    <h2 style="margin:0">Показатели за семестр</h2>
                    <div class="seg">
                        <button id="btn-pt-all" class="on" onclick="filterDeanPartners('all')">Все партнёры</button>
                        <button id="btn-pt-zero" onclick="filterDeanPartners('zero')">С нулевой активностью</button>
                    </div>
                </div>
                <table id="dean-partners-table">
                    <tr><th>Партнёр</th><th>Активных студентов</th><th>Рекомендация</th></tr>
                    ${rows}
                </table>
                <div class="note r">Партнёр Х: активность = 0 (порог ≥ 50). Подготовлено основание для расторжения договора.</div>
            </div>
        `;
    }

    // 4. Отчёты
    if (tab === 'reports') {
        return rep(user);
    }

    return '';
}
