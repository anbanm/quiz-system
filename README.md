# 🎓 Quiz System - Teacher-Friendly Quiz Creator

<div align="center">

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Browser Support](https://img.shields.io/badge/browsers-Chrome%20%7C%20Safari%20%7C%20Firefox%20%7C%20Edge-brightgreen.svg)
![Offline](https://img.shields.io/badge/offline-ready-orange.svg)  
![Tests](https://img.shields.io/badge/tests-108%20passing-brightgreen.svg)
![Playwright](https://img.shields.io/badge/testing-Playwright-blueviolet.svg)

**Create professional quizzes with images • Works completely offline • 108 automated tests**

*Perfect for teachers who want a simple, reliable quiz tool that works anywhere*

[📦 Download Latest Release](https://github.com/anbanm/quiz-system/releases) • [🎬 See Demo](#quick-start) • [🚀 Get Started](#quick-start) • [🤖 Run Tests](#testing)

</div>

---

## ✨ Why Teachers Love This Quiz System

- **🌐 Works Everywhere**: Safari, Chrome, Firefox, Edge - even without internet
- **📸 Image Support**: Add pictures to questions with live preview
- **📦 ZIP Packages**: Share complete quizzes easily - students just upload and go
- **🎨 Teacher-Friendly**: Educational design with clear language and emojis
- **⚡ Zero Setup**: Download, open in browser, start creating
- **🔒 Privacy First**: All data stays on your device, no accounts needed
- **🤖 Fully Tested**: 108 automated tests across 6 browsers and mobile devices
- **📱 Mobile Ready**: Responsive design tested on iPhone, Android, and iPad

*A comprehensive quiz generation and testing system with Unity integration for educational applications.*

## 📸 Screenshots

> **Coming Soon!** We're preparing beautiful screenshots to show you the teacher-friendly interface in action.
> 
> For now, try it yourself: Download the files and open `src/frontend/quizGenerator.html` in your browser!

## Overview

This project consists of two main components:
- **Quiz Generator**: A web-based tool for creating and managing quiz questions
- **Quiz Test Runner**: A web-based interface for taking quizzes and reporting results

## Features

### Quiz Generator (`quizGenerator.html`)
- ✅ **Teacher-friendly interface** with educational themes and clear language
- ✅ Create and manage multiple tests with professional layout
- ✅ Add questions with multiple choice options (A/B/C/D format)
- ✅ **Image support** with live preview and smart file handling
- ✅ Set difficulty levels (Easy, Medium, Hard) with visual indicators
- ✅ Assign point values to questions (1-10 points)
- ✅ Category organization for subject-based quizzes
- ✅ **ZIP package export** with images in separate folder (recommended)
- ✅ **JSON export** with embedded images (backward compatibility)
- ✅ Load and edit existing quiz data with proper image handling
- ✅ **Compact question cards** with horizontal layout and image thumbnails
- ✅ **Offline functionality** - works without internet connection

### Quiz Test Runner (`WebTest.html`)
- ✅ **Universal browser support** - Safari, Chrome, Firefox, Edge
- ✅ **ZIP package upload** with automatic extraction (all browsers)
- ✅ **JSON file upload** for embedded image quizzes
- ✅ Smart image loading with extension matching (.jpg/.jpeg support)
- ✅ Display questions with properly resolved images
- ✅ Multiple choice answer collection with letter-based answers
- ✅ **Backward compatibility** with old and new quiz formats
- ✅ Score calculation and detailed reporting
- ✅ Unity integration via messaging
- ✅ **Debug logging** for troubleshooting

### Unity Integration
- ✅ WebView integration with UniWebView
- ✅ JSON data communication
- ✅ Coin/points system integration
- ✅ Result tracking and display

## Project Structure

```
quiz-system/
├── src/
│   ├── frontend/          # Web-based quiz tools
│   │   ├── quizGenerator.html
│   │   └── WebTest.html
│   └── unity/             # Unity C# scripts
│       ├── SampleWebView.cs
│       └── SampleWebViewSim.cs
├── tests/                 # Comprehensive test suite
│   ├── quiz-generator.spec.js
│   ├── quiz-test-runner.spec.js
│   ├── mobile-responsiveness.spec.js
│   └── test-data/         # Sample images and quiz data
├── docs/                  # Documentation
├── examples/              # Sample quiz data
├── playwright.config.js   # Test configuration
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### 📥 Download & Setup (30 seconds)
1. **Download**: Click the green "Code" button above → "Download ZIP"
2. **Extract**: Unzip the downloaded file anywhere on your computer
3. **Open**: Double-click `src/frontend/quizGenerator.html` 
4. **Start Creating**: Your browser opens with the quiz generator ready to go!

*That's it! No installation, no accounts, no internet required.*

### Creating a Quiz (Teacher)
1. Open `src/frontend/quizGenerator.html` in a web browser
2. Click "✨ Create New Quiz"
3. Add questions with the teacher-friendly interface:
   - Write clear questions
   - Add images if needed (with live preview)
   - Set A/B/C/D answer options
   - Choose difficulty and points
4. **Download ZIP Package** (recommended) or JSON file
5. Share the ZIP file with students

### Taking a Quiz (Student)
1. Open `src/frontend/WebTest.html` in a web browser
2. Toggle to "Local File Mode"
3. **Upload ZIP Package** (easiest - works on all browsers):
   - Select the ZIP file from your teacher
   - Images and quiz load automatically
4. **OR Upload JSON File** (if using embedded format)
5. Answer questions and submit for results

### Advanced: Folder Method (Chrome/Edge only)
- Extract ZIP package to a folder
- Use the folder picker in WebTest
- Images load from the extracted folder

### Unity Integration
1. Import the C# scripts into your Unity project
2. Set up UniWebView component
3. Configure the WebView to load your quiz HTML files
4. Handle results in your game logic

## 🤖 Testing

Our quiz system includes comprehensive automated testing to ensure reliability across all platforms.

### Test Coverage
- **108 total tests** across 6 different browsers and devices
- **36 Teacher Interface tests**: Quiz creation, image upload, JSON generation
- **36 Student Interface tests**: Quiz taking, image display, answer submission  
- **36 Mobile Responsiveness tests**: Touch targets, image sizing, responsive layout

### Tested Platforms
- **Desktop Browsers**: Chromium, Firefox, WebKit (Safari)
- **Mobile Devices**: iPhone 12, Pixel 5 (Android), iPad Pro
- **Real Image Testing**: Math formulas, diagrams, visual elements

### Running Tests

```bash
# Install dependencies (first time only)
npm install

# Run all 108 tests
npm test

# Interactive "bot vision" testing
npm run test:ui

# Specific test suites
npm run test:mobile      # Mobile responsiveness tests
npm run test:generator   # Teacher interface tests  
npm run test:runner      # Student interface tests

# View test reports
npm run test:report
```

### Interactive Testing Experience
Run `npm run test:ui` to experience **"bot vision"** testing:
- ✨ Watch tests execute in real-time
- 🎮 Use timeline scrubber to replay actions
- 🔍 Inspect elements the bot interacts with
- 📱 Switch between different devices and browsers
- 🖼️ See real images being tested automatically

## Dependencies

- **Web**: Modern web browser with ES6 support (works completely offline)
- **Unity**: Unity 2021.3+ with UniWebView package
- **Testing**: Node.js 16+ and npm (for running automated tests)
- **Included Libraries**: 
  - JSZip 3.10.1 (bundled locally for offline use)
  - Playwright 1.54.2+ (automated testing framework)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. **Run the test suite**: `npm test` (all 108 tests must pass)
5. Test thoroughly across different browsers
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Submit a pull request

### Development Guidelines
- All new features must include comprehensive Playwright tests
- Maintain cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Ensure mobile responsiveness with proper touch targets (44px minimum)
- Follow the existing teacher-friendly design patterns

## Changelog

### v1.2.0 (2025-08-01) - 🤖 Comprehensive Testing Release
- ✅ **Complete Playwright Test Suite**: 108 automated tests across 6 browsers/devices
- ✅ **Real Image Testing**: Sample math formulas, diagrams, and visual elements
- ✅ **Cross-Browser Testing**: Chromium, Firefox, WebKit compatibility validation
- ✅ **Mobile Device Testing**: iPhone 12, Pixel 5, iPad Pro responsive testing
- ✅ **Interactive Bot Vision**: `npm run test:ui` for real-time test watching
- ✅ **Teacher Interface Testing**: Quiz creation, image upload, JSON generation (36 tests)
- ✅ **Student Interface Testing**: Quiz taking, image display, answer submission (36 tests)
- ✅ **Mobile Responsiveness Testing**: Touch targets, image sizing, layout validation (36 tests)
- ✅ **Sample Test Data**: Comprehensive test images and quiz examples
- ✅ **Professional Test Infrastructure**: Playwright configuration with cross-platform support

### v1.1.0 (2025-01-27)
- ✅ **ZIP Package Support**: Upload and extract ZIP files in any browser
- ✅ **Teacher-Friendly Interface**: Professional educational design with emojis and clear language
- ✅ **Offline JSZip Library**: Complete offline functionality without internet dependency
- ✅ **Smart Image Handling**: Extension matching, data URL support, live previews
- ✅ **Enhanced JSON Format**: Labeled options (A/B/C/D) with letter-based correct answers
- ✅ **Cross-Browser Compatibility**: Full support for Safari, Firefox, Chrome, Edge
- ✅ **Compact Question Cards**: Horizontal layout with image thumbnails
- ✅ **Better Error Handling**: Debug logging and improved user feedback
- ✅ **Backward Compatibility**: Supports both old and new quiz formats

### v1.0.0 (2025-01-27)
- ✅ Initial release with basic quiz generation and testing
- ✅ Unity integration with UniWebView
- ✅ JSON export/import functionality
- ✅ Basic image support

## Future Improvements

- [ ] Question reordering (drag & drop)
- [ ] Multiple question types (true/false, text input, fill-in-the-blank)
- [ ] Question bank and templates library
- [ ] Export to PDF/Word formats
- [ ] Advanced analytics and reporting dashboard
- [ ] Real-time collaborative quiz editing
- [ ] Student progress tracking
- [ ] Quiz scheduling and time limits
- [ ] Visual regression testing with screenshot comparisons
- [ ] Performance testing and load testing capabilities
- [ ] Automated accessibility (a11y) testing integration

## License

This project is for educational use. Please respect any licensing requirements for UniWebView if used commercially.

## Support

For questions or issues, please open an issue on GitHub.