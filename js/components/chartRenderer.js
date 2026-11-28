// Генерация столбчатой диаграммы сравнения групп (Средний балл vs Охват)
export function renderGroupedBarChart(groupsSummary) {
    const barsHtml = groupsSummary.map(g => {
        const score = g.avgScore || 0;
        const rate = g.completionRate || 0;
        return `
            <div class="chart-col">
                <div class="chart-bars-pair">
                    <div class="chart-bar-wrap">
                        <span class="chart-val">${score}%</span>
                        <div class="chart-bar primary" style="height: ${Math.max(4, score)}%" title="Средний балл: ${score}%"></div>
                    </div>
                    <div class="chart-bar-wrap">
                        <span class="chart-val">${rate}%</span>
                        <div class="chart-bar secondary" style="height: ${Math.max(4, rate)}%" title="Охват группы: ${rate}%"></div>
                    </div>
                </div>
                <div class="chart-label">
                    <b>${g.groupName}</b>
                    <small>${g.activeStudentsCount}/${g.studentsCount} студ.</small>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="chart-box">
            <div class="chart-legend">
                <span><i class="dot primary"></i> Средний балл тестов (%)</span>
                <span><i class="dot secondary"></i> Охват группы (%)</span>
            </div>
            <div class="chart-grid-area">
                ${barsHtml}
            </div>
        </div>
    `;
}

// Генерация многосерийного сравнения по 3 тестам (БРС, Адаптация, Внеучебка)
export function renderSurveyComparisonChart(groupsSummary) {
    const rowsHtml = groupsSummary.map(g => {
        const brs = g.bySurvey?.brs || 0;
        const adapt = g.bySurvey?.adapt || 0;
        const extra = g.bySurvey?.extra || 0;

        return `
            <div class="hchart-row">
                <div class="hchart-group">
                    <b>${g.groupName}</b>
                    <small>${g.direction}</small>
                </div>
                <div class="hchart-tracks">
                    <div class="hchart-line">
                        <span>БРС</span>
                        <div class="hchart-track"><i class="c-navy" style="width:${brs}%"></i></div>
                        <b>${brs}%</b>
                    </div>
                    <div class="hchart-line">
                        <span>Адаптация</span>
                        <div class="hchart-track"><i class="c-teal" style="width:${adapt}%"></i></div>
                        <b>${adapt}%</b>
                    </div>
                    <div class="hchart-line">
                        <span>Внеучебка</span>
                        <div class="hchart-track"><i class="c-mint" style="width:${extra}%"></i></div>
                        <b>${extra}%</b>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="hchart-wrap">
            ${rowsHtml}
        </div>
    `;
}

// Генерация SVG кольцевой диаграммы распределения уровней адаптации
export function renderDonutChart(studentsReport) {
    const tested = studentsReport.filter(s => s.passedCount > 0);
    const total = tested.length;

    const high = tested.filter(s => s.avgScore >= 85).length;
    const mid = tested.filter(s => s.avgScore >= 65 && s.avgScore < 85).length;
    const low = tested.filter(s => s.avgScore < 65).length;
    const notTested = studentsReport.length - total;

    const safeTotal = studentsReport.length || 1;
    const pHigh = Math.round((high / safeTotal) * 100);
    const pMid = Math.round((mid / safeTotal) * 100);
    const pLow = Math.round((low / safeTotal) * 100);
    const pNone = Math.max(0, 100 - pHigh - pMid - pLow);

    // Расчёт смещений для SVG stroke-dasharray (длина окружности при r=40 равна ~251.3)
    const C = 251.3;
    const dHigh = (pHigh / 100) * C;
    const dMid = (pMid / 100) * C;
    const dLow = (pLow / 100) * C;

    return `
        <div class="donut-layout">
            <svg viewBox="0 0 100 100" class="donut-svg">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--ln)" stroke-width="14"></circle>
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--ok)" stroke-width="14"
                    stroke-dasharray="${dHigh} ${C}" stroke-dashoffset="0" transform="rotate(-90 50 50)"></circle>
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--teal)" stroke-width="14"
                    stroke-dasharray="${dMid} ${C}" stroke-dashoffset="${-dHigh}" transform="rotate(-90 50 50)"></circle>
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--red)" stroke-width="14"
                    stroke-dasharray="${dLow} ${C}" stroke-dashoffset="${-(dHigh + dMid)}" transform="rotate(-90 50 50)"></circle>
                <text x="50" y="48" text-anchor="middle" font-size="16" font-weight="700" fill="var(--ink)">${total}/${studentsReport.length}</text>
                <text x="50" y="61" text-anchor="middle" font-size="7" fill="var(--mu)">прошли тест</text>
            </svg>
            <div class="donut-stats">
                <div class="d-item"><i style="background:var(--ok)"></i><span>Высокий уровень (≥85%)</span><b>${high} чел. (${pHigh}%)</b></div>
                <div class="d-item"><i style="background:var(--teal)"></i><span>Средний уровень (65–84%)</span><b>${mid} чел. (${pMid}%)</b></div>
                <div class="d-item"><i style="background:var(--red)"></i><span>Зона риска (&lt;65%)</span><b>${low} чел. (${pLow}%)</b></div>
                <div class="d-item"><i style="background:var(--ln)"></i><span>Ещё не проходили</span><b>${notTested} чел. (${pNone}%)</b></div>
            </div>
        </div>
    `;
}
