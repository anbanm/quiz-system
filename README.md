# Quiz System - Teacher-Friendly Quiz Creator

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Browser Support](https://img.shields.io/badge/browsers-Chrome%20%7C%20Safari%20%7C%20Firefox%20%7C%20Edge-brightgreen.svg)
![Offline](https://img.shields.io/badge/offline-ready-orange.svg)
![Tests](https://img.shields.io/badge/tests-250%20passing-brightgreen.svg)
![Playwright](https://img.shields.io/badge/testing-Playwright-blueviolet.svg)
![Rich Text](https://img.shields.io/badge/rich%20text-Quill.js-yellow.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)

**Create professional quizzes with rich text formulas, timed assessments, analytics, and PDF export**

*Perfect for teachers who want a simple, reliable quiz tool that works anywhere*

[Download Latest Release](https://github.com/anbanm/quiz-system/releases) | [Get Started](#quick-start) | [Run Tests](#testing)

</div>

---

## Why Teachers Love This Quiz System

- **Rich Text & Formulas**: Chemical formulas (H2O), physics equations (E=mc2), mathematical expressions
- **Visual Formatting**: Bold, italic, underline, subscript, superscript with color-coded editors
- **Works Everywhere**: Safari, Chrome, Firefox, Edge - even without internet
- **Image Support**: Add pictures to questions with live preview
- **ZIP Packages**: Share complete quizzes easily - students just upload and go
- **PDF Export**: 3 professional templates (Student Quiz, Answer Key, Practice Sheet)
- **Timer & Progress**: Countdown/count-up timer with progress bar for timed assessments
- **Question Bank**: Reusable question library with tagging and cross-quiz search
- **Analytics Dashboard**: Per-question analysis, grade boundaries, CSV export
- **Anti-Cheating**: Tab switch detection, copy/paste prevention, answer randomization
- **Certificates**: Auto-generated completion certificates (standard, honors, minimal templates)
- **Dark Mode**: Toggle between light and dark themes
- **Auto-Save**: Draft recovery so work is never lost
- **Accessibility**: Keyboard navigation, screen reader support, high contrast mode
- **Docker Deployment**: One-command deployment with REST API server
- **Plugin System**: Extensible hook-based architecture for custom modules
- **Privacy First**: All data stays on your device, no accounts needed
- **100% Test Coverage**: 250 automated tests across all browsers and mobile devices
- **Mobile Ready**: Responsive design tested on iPhone, Android, and iPad

*A comprehensive quiz generation and testing system with Unity integration for educational applications.*

## Modular Architecture (v2.0.0)

The quiz system features a **completely modular architecture** with 13+ specialized modules:

### Core Modules
| Module | Lines | Purpose |
|--------|-------|---------|
| `quiz-loader.js` | 189 | Module system with validation and dependency checking |
| `quiz-utils.js` | 225 | Utility functions for format conversion and calculations |
| `quiz-richtext.js` | 367 | Quill.js integration for mathematical formulas |
| `quiz-data.js` | 727 | Data management, import/export, and test library |
| `quiz-ui.js` | 873 | UI components, dialogs, and rendering |
| `quiz-questions.js` | 376 | Question CRUD operations and management |
| `quiz-pdf.js` | 820 | PDF export with 3 professional templates |

### v2.0 Extension Modules
| Module | Lines | Purpose |
|--------|-------|---------|
| `quiz-security.js` | 434 | HTML sanitization, CSP, JSON validation, safe storage |
| `quiz-timer.js` | 293 | Countdown/count-up timer with progress tracking |
| `quiz-toast.js` | 177 | Non-intrusive toast notification system |
| `quiz-autosave.js` | 260 | Auto-save with draft recovery |
| `quiz-analytics.js` | 340 | Per-question analytics, grade boundaries, CSV export |
| `quiz-question-bank.js` | 346 | Question bank with tagging and cross-quiz reuse |
| `quiz-anti-cheat.js` | 262 | Tab detection, copy prevention, Fisher-Yates shuffle |
| `quiz-certificate.js` | 237 | PDF certificate generation with 3 templates |
| `quiz-plugin.js` | 224 | Hook-based plugin/extension system |

### Global Namespace Pattern
```javascript
window.QuizModules = {
    Loader: { registerModule, validateAPI, initializeModules },
    Utils: { deltaToHtml, convertAnswerFormats, getDifficultyColor },
    RichText: { initializeQuillEditor, getQuestionContent },
    Data: { loadTestLibrary, saveTestLibrary, generateJSON },
    UI: { renderQuestions, showSuccessDialog, toggleSidebar },
    Questions: { addOrUpdateQuestion, editQuestion, deleteQuestion },
    PDF: { generateStudentQuiz, generateAnswerKey, generatePracticeSheet },
    Security: { sanitizeHTML, validateJSON, safeStorage },
    Timer: { start, pause, reset, getElapsed },
    Analytics: { trackAnswer, generateReport, exportCSV },
    QuestionBank: { addToBank, search, importFromQuiz },
    AntiCheat: { enable, detectTabSwitch, shuffleAnswers },
    Certificate: { generate, getTemplates },
    Plugin: { register, emit, on }
};
```

## Overview

This project consists of two main components:
- **Quiz Generator**: A web-based tool for creating and managing quiz questions
- **Quiz Test Runner**: A web-based interface for taking quizzes and reporting results

## Features

### Quiz Generator (`quizGenerator.html`)
- Rich Text Editor with Quill.js integration for mathematical formulas
- Chemical Formulas: H2O, CO2, NaCl with proper subscript formatting
- Physics Equations: E=mc2, F=ma with superscript support
- Color-Coded Options: Each answer (A-F) has themed toolbar
- Multiple Question Types: Multiple choice (2-6 options) and True/False
- Image support with live preview and smart file handling
- Difficulty levels (Easy, Medium, Hard) with visual indicators
- Point values per question (1-10 points)
- Category organization for subject-based quizzes
- PDF Export: 3 professional templates with rich text preservation
- ZIP package export with images in separate folder
- Triple format storage: Plain text, HTML, and Delta for compatibility
- Auto-save with draft recovery
- Dark mode toggle
- Toast notifications for non-intrusive feedback
- Question bank with tagging and search
- Offline functionality - works without internet connection

### Quiz Test Runner (`WebTest.html`)
- Rich Text Display: Mathematical formulas and formatting preserved
- Countdown/count-up timer with progress bar
- Anti-cheating: Tab switch detection, copy/paste prevention, answer shuffling
- Analytics tracking for per-question performance
- Certificate generation upon completion
- Universal browser support - Safari, Chrome, Firefox, Edge
- ZIP package upload with automatic extraction
- JSON file upload for embedded image quizzes
- Score calculation and detailed reporting
- Accessibility: keyboard navigation, screen reader support, high contrast
- Unity integration via messaging
- Debug logging for troubleshooting

### Unity Integration
- WebView integration with UniWebView
- JSON data communication
- Coin/points system integration
- Result tracking and display

### Server & Deployment (v2.0)
- Docker container with health check and persistent volume
- REST API server (Node.js, zero external dependencies)
- `docker-compose.yml` for one-command deployment

## Project Structure

```
quiz-system/
├── src/
│   ├── frontend/
│   │   ├── quizGenerator.html
│   │   ├── WebTest.html
│   │   ├── css/
│   │   │   ├── quiz-generator.css
│   │   │   ├── quill-custom.css
│   │   │   ├── dark-mode.css
│   │   │   └── accessibility.css
│   │   ├── lib/
│   │   │   ├── quill.min.js
│   │   │   └── quill.snow.css
│   │   ├── jszip.min.js
│   │   └── js/
│   │       ├── quiz-generator.js       # Main orchestration (535 lines)
│   │       ├── jspdf.min.js
│   │       └── modules/                # 16 specialized modules
│   │           ├── quiz-loader.js
│   │           ├── quiz-utils.js
│   │           ├── quiz-richtext.js
│   │           ├── quiz-data.js
│   │           ├── quiz-ui.js
│   │           ├── quiz-questions.js
│   │           ├── quiz-pdf.js
│   │           ├── quiz-security.js
│   │           ├── quiz-timer.js
│   │           ├── quiz-toast.js
│   │           ├── quiz-autosave.js
│   │           ├── quiz-analytics.js
│   │           ├── quiz-question-bank.js
│   │           ├── quiz-anti-cheat.js
│   │           ├── quiz-certificate.js
│   │           └── quiz-plugin.js
│   └── unity/
│       ├── SampleWebView.cs
│       └── SampleWebViewSim.cs
├── server/
│   └── index.js                        # REST API server
├── tests/
│   ├── page-objects/
│   │   ├── QuizGeneratorPage.js
│   │   └── WebTestPage.js
│   ├── ui-mapping.json
│   ├── quiz-generator-clean.spec.js
│   ├── quiz-generator.spec.js
│   ├── quiz-test-runner.spec.js
│   ├── question-reordering.spec.js
│   ├── mobile-responsiveness.spec.js
│   ├── pdf-export.spec.js
│   └── test-data/
├── Dockerfile
├── docker-compose.yml
├── ROADMAP.md
├── playwright.config.js
├── package.json
└── README.md
```

## Quick Start

### Download & Setup (30 seconds)
1. **Download**: Click the green "Code" button above, then "Download ZIP"
2. **Extract**: Unzip the downloaded file anywhere on your computer
3. **Open**: Double-click `src/frontend/quizGenerator.html`
4. **Start Creating**: Your browser opens with the quiz generator ready to go

*No installation, no accounts, no internet required.*

### Docker Deployment (Optional)
```bash
# One-command deployment with REST API
docker-compose up -d

# Or build and run manually
docker build -t quiz-system .
docker run -p 3000:3000 quiz-system
```

### Creating a Quiz (Teacher)
1. Open `src/frontend/quizGenerator.html` in a web browser
2. Click "Create New Quiz"
3. Add questions with the teacher-friendly interface:
   - Write questions with rich text formatting
   - Add images if needed (with live preview)
   - Set A/B/C/D answer options
   - Choose difficulty and points
4. **Export Options**:
   - **Export to PDF** (3 professional templates)
   - **Download ZIP Package** (recommended for sharing)
   - **Download JSON Only** (embedded format)
5. Share files with students

### Taking a Quiz (Student)
1. Open `src/frontend/WebTest.html` in a web browser
2. Toggle to "Local File Mode"
3. Upload ZIP Package or JSON file
4. Answer questions (with optional timer and anti-cheating)
5. Submit for results and optional certificate

### Unity Integration
1. Import the C# scripts into your Unity project
2. Set up UniWebView component
3. Configure the WebView to load your quiz HTML files
4. Handle results in your game logic

## Testing

### Test Coverage
- **250 total tests** across 5 browsers and devices - all passing
- **50 tests per platform**: Each browser/device runs the complete suite
- **Rich Text Testing**: Mathematical formulas, chemical equations, formatting
- **End-to-End Testing**: Complete workflow from quiz creation to student testing

### Tested Platforms (50/50 tests each)
- **Desktop**: Chromium, Firefox, WebKit (Safari)
- **Mobile**: Mobile Chrome, Mobile Safari

### Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run all 250 tests
npm test

# Specific test suites
npx playwright test tests/quiz-generator-clean.spec.js
npx playwright test tests/quiz-generator.spec.js
npx playwright test tests/question-reordering.spec.js
npx playwright test tests/mobile-responsiveness.spec.js
npx playwright test tests/quiz-test-runner.spec.js
npx playwright test tests/pdf-export.spec.js

# Interactive testing
npx playwright test --ui

# View test reports
npx playwright show-report
```

## Dependencies

- **Web**: Modern web browser with ES6 support (works completely offline)
- **Unity**: Unity 2021.3+ with UniWebView package
- **Testing**: Node.js 16+ and npm
- **Server**: Node.js 16+ (zero external dependencies)
- **Docker**: Docker 20+ and docker-compose (optional)
- **Included Libraries**:
  - Quill.js (bundled locally for rich text editing)
  - JSZip 3.10.1 (bundled locally for ZIP support)
  - jsPDF (bundled locally for PDF generation)

## Changelog

### v2.0.0 (2026-03-07) - Complete Platform Overhaul

**Phase 1 - Core Modernization:**
- Security module: HTML sanitizer, CSP headers, JSON validation, safe localStorage wrapper
- Accessibility: Focus indicators, skip navigation, screen reader support, high contrast, reduced motion
- UX: Toast notifications, dark mode toggle, auto-save with draft recovery
- Quiz timer: Countdown/count-up with progress bar, review page, question randomization

**Phase 2 - Platform Features:**
- Analytics dashboard with per-question analysis and grade boundaries
- CSV export for quiz results
- Question bank with tagging, search, and cross-quiz reuse

**Phase 3 - Advanced Capabilities:**
- Anti-cheating: Tab switch detection, copy/paste prevention, Fisher-Yates shuffle
- Certificate generation with jsPDF (standard, honors, minimal templates)

**Phase 4 - Enterprise & Scale:**
- Docker deployment with health check and persistent volume
- REST API server with Node.js (zero external dependencies)
- Plugin/extension system with hook-based architecture

### v1.5.0 (2025-08-03) - PDF Export System
- 3 PDF templates: Student Quiz, Teacher Answer Key, Practice Worksheet
- Rich text preservation in PDF output
- Smart image integration with aspect ratio preservation
- Offline PDF generation with jsPDF
- New quiz-pdf.js module (821 lines)

### v1.4.0 (2025-08-03) - Modular Refactoring
- Complete refactoring of 71KB monolithic file into 6 modules
- 73% code reduction in main file (1,917 to 512 lines)
- Global namespace pattern for offline-first compatibility
- Module system with validation and dependency checking

### v1.3.1 (2025-08-02) - Rich Text Revolution
- Quill.js integration with mathematical formula support
- Chemical formulas (H2O) and physics equations (E=mc2)
- Color-coded answer option editors (A-F)
- UI mapping abstraction layer with Page Object Model
- 210/210 tests passing across all platforms

### v1.3.0 (2025-08-02) - Codebase Refactoring
- Separated HTML, CSS, and JavaScript into dedicated files
- 87% file size reduction in HTML
- Test library with sidebar navigation
- Built-in sample quizzes

### v1.2.0 (2025-08-01) - Testing Release
- 108 automated Playwright tests across 6 browsers/devices
- Cross-browser and mobile device testing
- Interactive test viewer

### v1.1.0 (2025-07-27) - ZIP & UX
- ZIP package support for all browsers
- Teacher-friendly interface redesign
- Offline JSZip library
- Smart image handling

### v1.0.0 (2025-07-27) - Initial Release
- Basic quiz generation and testing
- Unity integration with UniWebView
- JSON export/import

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the test suite: `npm test` (all 250 tests must pass)
5. Commit your changes
6. Push and submit a pull request

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

For questions or issues, please open an issue on GitHub.
