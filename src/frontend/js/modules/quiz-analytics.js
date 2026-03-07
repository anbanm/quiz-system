/**
 * Quiz Analytics Module
 * Provides analytics dashboard, grade boundaries, CSV export, and score tracking
 * Part of Phase 2 - Platform Features (v3.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.Analytics = (function() {
    'use strict';

    // Grade boundary defaults
    let gradeBoundaries = {
        'A+': 97, 'A': 93, 'A-': 90,
        'B+': 87, 'B': 83, 'B-': 80,
        'C+': 77, 'C': 73, 'C-': 70,
        'D+': 67, 'D': 63, 'D-': 60,
        'F': 0
    };

    /**
     * Calculate comprehensive analytics for a quiz attempt
     * @param {Array} questions - Quiz questions
     * @param {Object} userAnswers - User's answers { index: answer }
     * @param {Object} timeData - Time tracking data { questionTimes: {}, totalTime: number }
     * @returns {Object} Analytics data
     */
    function calculateAnalytics(questions, userAnswers, timeData) {
        timeData = timeData || {};
        var correctCount = 0;
        var totalPoints = 0;
        var earnedPoints = 0;
        var questionAnalysis = [];
        var difficultyBreakdown = { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } };
        var categoryBreakdown = {};

        for (var i = 0; i < questions.length; i++) {
            var q = questions[i];
            var userAnswer = userAnswers[i];
            var points = q.points || 1;
            totalPoints += points;

            // Determine correct answer
            var correctAnswer = q.correctAnswer;
            var isCorrect = false;

            if (Array.isArray(q.options) && typeof userAnswer === 'string' && !isNaN(userAnswer)) {
                var indexToLetter = ['A', 'B', 'C', 'D', 'E', 'F'];
                userAnswer = indexToLetter[parseInt(userAnswer)] || userAnswer;
            }

            if (userAnswer === correctAnswer) {
                isCorrect = true;
                correctCount++;
                earnedPoints += points;
            }

            var difficulty = q.difficulty || 'easy';
            if (!difficultyBreakdown[difficulty]) difficultyBreakdown[difficulty] = { correct: 0, total: 0 };
            difficultyBreakdown[difficulty].total++;
            if (isCorrect) difficultyBreakdown[difficulty].correct++;

            var category = q.category || 'General';
            if (!categoryBreakdown[category]) categoryBreakdown[category] = { correct: 0, total: 0, points: 0, earned: 0 };
            categoryBreakdown[category].total++;
            categoryBreakdown[category].points += points;
            if (isCorrect) {
                categoryBreakdown[category].correct++;
                categoryBreakdown[category].earned += points;
            }

            questionAnalysis.push({
                number: i + 1,
                question: q.question || '',
                userAnswer: userAnswer || 'Unanswered',
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                points: points,
                earnedPoints: isCorrect ? points : 0,
                difficulty: difficulty,
                category: category,
                timeSpent: timeData.questionTimes ? (timeData.questionTimes[i] || 0) : 0
            });
        }

        var percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

        return {
            summary: {
                totalQuestions: questions.length,
                answeredQuestions: Object.keys(userAnswers).length,
                correctCount: correctCount,
                incorrectCount: questions.length - correctCount,
                totalPoints: totalPoints,
                earnedPoints: earnedPoints,
                percentage: percentage,
                grade: getGrade(percentage),
                totalTime: timeData.totalTime || 0,
                avgTimePerQuestion: questions.length > 0 ? Math.round((timeData.totalTime || 0) / questions.length) : 0
            },
            questionAnalysis: questionAnalysis,
            difficultyBreakdown: difficultyBreakdown,
            categoryBreakdown: categoryBreakdown,
            scoreDistribution: calculateScoreDistribution(questionAnalysis)
        };
    }

    /**
     * Get letter grade based on percentage
     * @param {number} percentage - Score percentage
     * @returns {string} Letter grade
     */
    function getGrade(percentage) {
        var grades = Object.keys(gradeBoundaries).sort(function(a, b) {
            return gradeBoundaries[b] - gradeBoundaries[a];
        });
        for (var i = 0; i < grades.length; i++) {
            if (percentage >= gradeBoundaries[grades[i]]) return grades[i];
        }
        return 'F';
    }

    /**
     * Set custom grade boundaries
     * @param {Object} boundaries - Custom grade boundaries
     */
    function setGradeBoundaries(boundaries) {
        gradeBoundaries = Object.assign({}, gradeBoundaries, boundaries);
    }

    /**
     * Get current grade boundaries
     * @returns {Object} Grade boundaries
     */
    function getGradeBoundaries() {
        return Object.assign({}, gradeBoundaries);
    }

    /**
     * Calculate score distribution for histogram
     * @param {Array} questionAnalysis - Question analysis data
     * @returns {Object} Score distribution
     */
    function calculateScoreDistribution(questionAnalysis) {
        var ranges = { '0-10': 0, '11-20': 0, '21-30': 0, '31-40': 0, '41-50': 0, '51-60': 0, '61-70': 0, '71-80': 0, '81-90': 0, '91-100': 0 };
        // This would be populated with class data in multi-user scenarios
        return ranges;
    }

    /**
     * Generate analytics dashboard HTML
     * @param {Object} analytics - Analytics data from calculateAnalytics
     * @returns {string} HTML string for dashboard
     */
    function generateDashboardHTML(analytics) {
        var s = analytics.summary;
        var gradeColor = s.percentage >= 90 ? '#27ae60' : s.percentage >= 80 ? '#2ecc71' : s.percentage >= 70 ? '#f39c12' : s.percentage >= 60 ? '#e67e22' : '#e74c3c';

        var html = '<div id="analytics-dashboard" style="padding: 20px;">';

        // Score summary cards
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">';
        html += makeCard('Score', s.earnedPoints + '/' + s.totalPoints, gradeColor);
        html += makeCard('Grade', s.grade, gradeColor);
        html += makeCard('Percentage', s.percentage + '%', gradeColor);
        html += makeCard('Correct', s.correctCount + '/' + s.totalQuestions, '#3498db');
        if (s.totalTime > 0) {
            var Timer = window.QuizModules.Timer;
            html += makeCard('Time', Timer ? Timer.formatTime(s.totalTime) : s.totalTime + 's', '#9b59b6');
        }
        html += '</div>';

        // Difficulty breakdown
        html += '<div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 10px;">';
        html += '<h4 style="margin: 0 0 15px 0; color: #2c3e50;">Performance by Difficulty</h4>';
        var diffKeys = Object.keys(analytics.difficultyBreakdown);
        for (var i = 0; i < diffKeys.length; i++) {
            var d = diffKeys[i];
            var dd = analytics.difficultyBreakdown[d];
            if (dd.total > 0) {
                var pct = Math.round((dd.correct / dd.total) * 100);
                var barColor = d === 'easy' ? '#27ae60' : d === 'medium' ? '#f39c12' : '#e74c3c';
                html += '<div style="margin-bottom: 10px;">';
                html += '<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">';
                html += '<span style="text-transform: capitalize; font-weight: 600;">' + d + '</span>';
                html += '<span>' + dd.correct + '/' + dd.total + ' (' + pct + '%)</span></div>';
                html += '<div style="height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">';
                html += '<div style="height: 100%; width: ' + pct + '%; background: ' + barColor + '; border-radius: 4px; transition: width 0.5s ease;"></div>';
                html += '</div></div>';
            }
        }
        html += '</div>';

        // Category breakdown
        if (Object.keys(analytics.categoryBreakdown).length > 1) {
            html += '<div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 10px;">';
            html += '<h4 style="margin: 0 0 15px 0; color: #2c3e50;">Performance by Category</h4>';
            var catKeys = Object.keys(analytics.categoryBreakdown);
            for (var j = 0; j < catKeys.length; j++) {
                var cat = catKeys[j];
                var cd = analytics.categoryBreakdown[cat];
                var catPct = Math.round((cd.correct / cd.total) * 100);
                html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef;">';
                html += '<span style="font-weight: 600;">' + cat + '</span>';
                html += '<span>' + cd.correct + '/' + cd.total + ' (' + catPct + '%) - ' + cd.earned + '/' + cd.points + ' pts</span></div>';
            }
            html += '</div>';
        }

        // Question-by-question review
        html += '<div style="margin-bottom: 25px;">';
        html += '<h4 style="margin: 0 0 15px 0; color: #2c3e50;">Question Review</h4>';
        for (var k = 0; k < analytics.questionAnalysis.length; k++) {
            var qa = analytics.questionAnalysis[k];
            var bgColor = qa.isCorrect ? '#d4edda' : '#f8d7da';
            var borderColor = qa.isCorrect ? '#28a745' : '#dc3545';
            html += '<div style="padding: 12px; margin-bottom: 8px; background: ' + bgColor + '; border-left: 4px solid ' + borderColor + '; border-radius: 6px;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
            html += '<strong>Q' + qa.number + ': ' + (qa.isCorrect ? 'Correct' : 'Incorrect') + '</strong>';
            html += '<span style="font-size: 12px; color: #666;">' + qa.earnedPoints + '/' + qa.points + ' pts';
            if (qa.timeSpent > 0) html += ' | ' + qa.timeSpent + 's';
            html += '</span></div>';
            if (!qa.isCorrect) {
                html += '<div style="font-size: 13px; margin-top: 6px; color: #666;">Your answer: ' + qa.userAnswer + ' | Correct: ' + qa.correctAnswer + '</div>';
            }
            html += '</div>';
        }
        html += '</div>';

        html += '</div>';
        return html;
    }

    function makeCard(label, value, color) {
        return '<div style="background: white; padding: 15px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-top: 3px solid ' + color + ';">' +
            '<div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; letter-spacing: 1px;">' + label + '</div>' +
            '<div style="font-size: 24px; font-weight: bold; color: ' + color + '; margin-top: 5px;">' + value + '</div></div>';
    }

    /**
     * Export analytics data as CSV
     * @param {Object} analytics - Analytics data
     * @param {string} quizName - Quiz name for filename
     */
    function exportCSV(analytics, quizName) {
        var csv = 'Question,Status,Your Answer,Correct Answer,Points Earned,Points Possible,Difficulty,Category,Time (s)\n';

        for (var i = 0; i < analytics.questionAnalysis.length; i++) {
            var qa = analytics.questionAnalysis[i];
            csv += '"Q' + qa.number + '",' +
                (qa.isCorrect ? 'Correct' : 'Incorrect') + ',' +
                '"' + (qa.userAnswer || '').replace(/"/g, '""') + '",' +
                '"' + qa.correctAnswer + '",' +
                qa.earnedPoints + ',' +
                qa.points + ',' +
                qa.difficulty + ',' +
                '"' + (qa.category || '').replace(/"/g, '""') + '",' +
                qa.timeSpent + '\n';
        }

        // Summary row
        csv += '\nSummary\n';
        csv += 'Total Score,' + analytics.summary.earnedPoints + '/' + analytics.summary.totalPoints + '\n';
        csv += 'Percentage,' + analytics.summary.percentage + '%\n';
        csv += 'Grade,' + analytics.summary.grade + '\n';
        csv += 'Correct,' + analytics.summary.correctCount + '/' + analytics.summary.totalQuestions + '\n';

        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (quizName || 'quiz-results') + '-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Store quiz result in localStorage for history tracking
     * @param {string} quizId - Quiz identifier
     * @param {Object} analytics - Analytics data
     */
    function saveResult(quizId, analytics) {
        var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
        var key = 'quiz-results-history';
        var history = [];

        try {
            var saved = typeof storage.getItem === 'function' ? storage.getItem(key) : localStorage.getItem(key);
            if (saved) history = JSON.parse(saved);
        } catch (e) { history = []; }

        history.push({
            quizId: quizId,
            date: new Date().toISOString(),
            summary: analytics.summary
        });

        // Keep last 100 results
        if (history.length > 100) history = history.slice(-100);

        var data = JSON.stringify(history);
        if (typeof storage.setItem === 'function') {
            storage.setItem(key, data);
        } else {
            try { localStorage.setItem(key, data); } catch (e) { /* ignore */ }
        }
    }

    /**
     * Get quiz result history
     * @returns {Array} History of quiz results
     */
    function getHistory() {
        try {
            var storage = window.QuizModules.Security ? window.QuizModules.Security.safeStorage : localStorage;
            var saved = typeof storage.getItem === 'function' ? storage.getItem('quiz-results-history') : localStorage.getItem('quiz-results-history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    }

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Analytics', '3.0.0');
    }

    return {
        calculateAnalytics: calculateAnalytics,
        generateDashboardHTML: generateDashboardHTML,
        getGrade: getGrade,
        setGradeBoundaries: setGradeBoundaries,
        getGradeBoundaries: getGradeBoundaries,
        exportCSV: exportCSV,
        saveResult: saveResult,
        getHistory: getHistory
    };
})();
