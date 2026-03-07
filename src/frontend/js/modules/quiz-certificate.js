/**
 * Quiz Certificate Generation Module
 * Generates completion certificates using jsPDF
 * Part of Phase 3 - Advanced Capabilities (v4.0)
 *
 * Uses global namespace pattern for offline-first compatibility
 */

window.QuizModules = window.QuizModules || {};

window.QuizModules.Certificate = (function() {
    'use strict';

    var TEMPLATES = {
        standard: {
            name: 'Standard Certificate',
            bgColor: '#ffffff',
            borderColor: '#2c3e50',
            accentColor: '#3498db',
            titleFont: 36,
            orientation: 'landscape'
        },
        honors: {
            name: 'Honors Certificate',
            bgColor: '#fffde7',
            borderColor: '#f9a825',
            accentColor: '#ff8f00',
            titleFont: 40,
            orientation: 'landscape'
        },
        minimal: {
            name: 'Minimal Certificate',
            bgColor: '#ffffff',
            borderColor: '#95a5a6',
            accentColor: '#2c3e50',
            titleFont: 32,
            orientation: 'landscape'
        }
    };

    /**
     * Generate a completion certificate
     * @param {Object} options - Certificate data
     * @returns {Object} jsPDF document
     */
    function generate(options) {
        options = options || {};
        var template = TEMPLATES[options.template || 'standard'];

        // Find jsPDF
        var jsPDF;
        if (typeof window.jsPDF !== 'undefined') {
            jsPDF = window.jsPDF;
        } else if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            jsPDF = window.jspdf.jsPDF;
        } else {
            throw new Error('jsPDF library not available for certificate generation');
        }

        var doc = new jsPDF({ orientation: template.orientation, unit: 'mm', format: 'a4' });
        var width = doc.internal.pageSize.getWidth();
        var height = doc.internal.pageSize.getHeight();

        // Background
        doc.setFillColor(template.bgColor);
        doc.rect(0, 0, width, height, 'F');

        // Decorative border
        doc.setDrawColor(template.borderColor);
        doc.setLineWidth(3);
        doc.rect(10, 10, width - 20, height - 20);
        doc.setLineWidth(1);
        doc.rect(15, 15, width - 30, height - 30);

        // Corner decorations
        drawCornerDecorations(doc, width, height, template.accentColor);

        var y = 40;

        // Title
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(template.accentColor);
        doc.text('CERTIFICATE OF', width / 2, y, { align: 'center' });
        y += 12;

        doc.setFontSize(template.titleFont);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(template.borderColor);
        doc.text(options.certificateType || 'COMPLETION', width / 2, y, { align: 'center' });
        y += 15;

        // Decorative line
        doc.setDrawColor(template.accentColor);
        doc.setLineWidth(0.5);
        doc.line(width / 2 - 50, y, width / 2 + 50, y);
        y += 15;

        // "This certifies that"
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.setTextColor('#666666');
        doc.text('This is to certify that', width / 2, y, { align: 'center' });
        y += 12;

        // Student name
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(template.borderColor);
        doc.text(options.studentName || 'Student', width / 2, y, { align: 'center' });
        y += 8;

        // Underline for name
        var nameWidth = doc.getTextWidth(options.studentName || 'Student');
        doc.setDrawColor(template.accentColor);
        doc.line(width / 2 - nameWidth / 2, y, width / 2 + nameWidth / 2, y);
        y += 12;

        // Achievement text
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.setTextColor('#666666');
        doc.text('has successfully completed', width / 2, y, { align: 'center' });
        y += 10;

        // Quiz name
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(template.accentColor);
        doc.text(options.quizName || 'Quiz', width / 2, y, { align: 'center' });
        y += 12;

        // Score info
        if (options.score !== undefined) {
            doc.setFontSize(14);
            doc.setFont(undefined, 'normal');
            doc.setTextColor('#333333');
            var scoreText = 'Score: ' + options.score + '%';
            if (options.grade) scoreText += ' (Grade: ' + options.grade + ')';
            doc.text(scoreText, width / 2, y, { align: 'center' });
            y += 10;
        }

        if (options.correctAnswers !== undefined && options.totalQuestions !== undefined) {
            doc.setFontSize(11);
            doc.setTextColor('#666666');
            doc.text(options.correctAnswers + ' out of ' + options.totalQuestions + ' questions answered correctly', width / 2, y, { align: 'center' });
            y += 15;
        }

        // Date
        var dateStr = options.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor('#999999');
        doc.text('Date: ' + dateStr, width / 2, y, { align: 'center' });
        y += 15;

        // Signature line
        doc.setDrawColor('#333333');
        doc.setLineWidth(0.3);
        doc.line(width / 2 - 40, y, width / 2 + 40, y);
        y += 5;
        doc.setFontSize(9);
        doc.text('Instructor Signature', width / 2, y, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor('#cccccc');
        doc.text('Generated by Quiz System v2.0', width / 2, height - 15, { align: 'center' });

        return doc;
    }

    /**
     * Draw corner decorations
     */
    function drawCornerDecorations(doc, width, height, color) {
        doc.setDrawColor(color);
        doc.setLineWidth(0.8);
        var s = 15;
        var o = 20;

        // Top-left
        doc.line(o, o, o + s, o);
        doc.line(o, o, o, o + s);
        // Top-right
        doc.line(width - o, o, width - o - s, o);
        doc.line(width - o, o, width - o, o + s);
        // Bottom-left
        doc.line(o, height - o, o + s, height - o);
        doc.line(o, height - o, o, height - o - s);
        // Bottom-right
        doc.line(width - o, height - o, width - o - s, height - o);
        doc.line(width - o, height - o, width - o, height - o - s);
    }

    /**
     * Download a certificate
     * @param {Object} doc - jsPDF document
     * @param {string} filename - Filename
     */
    function download(doc, filename) {
        doc.save(filename || 'certificate.pdf');
    }

    /**
     * Check if student passes (eligible for certificate)
     * @param {number} percentage - Score percentage
     * @param {number} passingScore - Minimum passing score (default 60)
     * @returns {boolean}
     */
    function isEligible(percentage, passingScore) {
        return percentage >= (passingScore || 60);
    }

    /**
     * Get available templates
     * @returns {Object}
     */
    function getTemplates() {
        return TEMPLATES;
    }

    // Register module
    if (window.QuizModules.Loader) {
        window.QuizModules.Loader.registerModule('Certificate', '4.0.0');
    }

    return {
        generate: generate,
        download: download,
        isEligible: isEligible,
        getTemplates: getTemplates,
        TEMPLATES: TEMPLATES
    };
})();
