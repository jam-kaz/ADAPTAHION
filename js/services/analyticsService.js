import { db } from '../store/db.js';
import { getAllowedGroups } from '../config/permissions.js';

class AnalyticsService {
    // Сводка по доступным пользователю группам
    getGroupsSummary(user) {
        const allowedIds = getAllowedGroups(user);
        const groups = db.getGroups().filter(g => allowedIds.includes(g.id));
        const allSurveys = db.getSurveys();

        return groups.map(group => {
            const students = db.getStudentsByGroups([group.id]);
            const results = db.getResultsByGroups([group.id]);

            // Уникальные студенты, прошедшие хотя бы 1 тест
            const activeStudentIds = new Set(results.map(r => r.userId));
            const completionRate = students.length
                ? Math.round((activeStudentIds.size / students.length) * 100)
                : 0;

            // Средний балл по всем пройденным тестам в группе
            const avgScore = results.length
                ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
                : 0;

            // Средний балл в разрезе каждого опросника (БРС, Адаптация, Внеучебка)
            const bySurvey = {};
            allSurveys.forEach(s => {
                const sRes = results.filter(r => r.surveyId === s.id);
                bySurvey[s.id] = sRes.length
                    ? Math.round(sRes.reduce((sum, r) => sum + r.score, 0) / sRes.length)
                    : 0;
            });

            return {
                groupId: group.id,
                groupName: group.name,
                direction: group.direction,
                course: group.course,
                studentsCount: students.length,
                activeStudentsCount: activeStudentIds.size,
                testsPassedCount: results.length,
                completionRate,
                avgScore,
                bySurvey
            };
        });
    }

    // Детальная ведомость по каждому студенту в выбранных группах
    getStudentsDetailedReport(user, filterGroupId = 'ALL') {
        const allowedIds = getAllowedGroups(user);
        const targetGroups = filterGroupId === 'ALL'
            ? allowedIds
            : allowedIds.filter(id => id === filterGroupId);

        const students = db.getStudentsByGroups(targetGroups);
        const surveys = db.getSurveys();

        return students.map(student => {
            const userResults = db.getResultsByUser(student.id);
            const scoresMap = {};
            surveys.forEach(s => {
                const found = userResults.find(r => r.surveyId === s.id);
                scoresMap[s.id] = found ? found.score : null;
            });

            const avg = userResults.length
                ? Math.round(userResults.reduce((sum, r) => sum + r.score, 0) / userResults.length)
                : 0;

            // Извлекаем реальные выбранные интересы из теста 'extra'
            const extraRes = userResults.find(r => r.surveyId === 'extra');
            const realInterests = extraRes && Array.isArray(extraRes.answers?.[0])
                ? extraRes.answers[0]
                : [];

            return {
                userId: student.id,
                name: student.name,
                groupId: student.groupId,
                interests: realInterests,
                passedCount: userResults.length,
                totalSurveys: surveys.length,
                avgScore: avg,
                scoresMap
            };
        });
    }

    // Распределение интересов студентов строго по реальным ответам в тесте «Интересы и внеучебка»
    getInterestsDistribution(user) {
        const allowedIds = getAllowedGroups(user);
        const students = db.getStudentsByGroups(allowedIds);
        const totalStudents = students.length || 1;
        const extraResults = db.getResultsByGroups(allowedIds).filter(r => r.surveyId === 'extra');

        const categories = [
            'Студсовет',
            'Спортклуб',
            'Наука',
            'Творчество',
            'Волонтёрство'
        ];

        return categories.map(cat => {
            const count = extraResults.filter(
                r => Array.isArray(r.answers?.[0]) && r.answers[0].includes(cat)
            ).length;

            return {
                label: cat,
                count,
                percent: Math.round((count / totalStudents) * 100)
            };
        });
    }

    // Общие KPI-показатели для дашбордов куратора, деканата и администратора
    getOverallKPI(user) {
        const summary = this.getGroupsSummary(user);
        const totalStudents = summary.reduce((s, g) => s + g.studentsCount, 0);
        const totalTests = summary.reduce((s, g) => s + g.testsPassedCount, 0);
        const activeGroups = summary.filter(g => g.testsPassedCount > 0);

        const avgFacultyScore = activeGroups.length
            ? Math.round(activeGroups.reduce((s, g) => s + g.avgScore, 0) / activeGroups.length)
            : 0;

        const avgCompletion = summary.length
            ? Math.round(summary.reduce((s, g) => s + g.completionRate, 0) / summary.length)
            : 0;

        return {
            groupsCount: summary.length,
            totalStudents,
            totalTests,
            avgFacultyScore,
            avgCompletion
        };
    }
}

export const analyticsService = new AnalyticsService();
