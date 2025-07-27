# Quiz System

A comprehensive quiz generation and testing system with Unity integration for educational applications.

## Overview

This project consists of two main components:
- **Quiz Generator**: A web-based tool for creating and managing quiz questions
- **Quiz Test Runner**: A web-based interface for taking quizzes and reporting results

## Features

### Quiz Generator (`quizGenerator.html`)
- ✅ Create and manage multiple tests
- ✅ Add questions with multiple choice options
- ✅ Support for images in questions
- ✅ Set difficulty levels (Easy, Medium, Hard)
- ✅ Assign point values to questions
- ✅ Category organization
- ✅ JSON export for Unity integration
- ✅ Load and edit existing quiz data

### Quiz Test Runner (`WebTest.html`)
- ✅ Display questions with images
- ✅ Multiple choice answer collection
- ✅ Score calculation and reporting
- ✅ Unity integration via messaging
- ✅ Local file mode for testing

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
├── docs/                  # Documentation
├── examples/              # Sample quiz data
├── .gitignore
└── README.md
```

## Quick Start

### Creating a Quiz
1. Open `src/frontend/quizGenerator.html` in a web browser
2. Click "Create New Test"
3. Add questions with options and correct answers
4. Generate and download JSON file

### Running a Quiz
1. Open `src/frontend/WebTest.html` in a web browser
2. Toggle to "Local File Mode"
3. Upload your generated JSON file
4. Take the quiz and see results

### Unity Integration
1. Import the C# scripts into your Unity project
2. Set up UniWebView component
3. Configure the WebView to load your quiz HTML files
4. Handle results in your game logic

## Dependencies

- **Web**: Modern web browser with ES6 support
- **Unity**: Unity 2021.3+ with UniWebView package

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Future Improvements

- [ ] Image preview in quiz generator
- [ ] Question reordering (drag & drop)
- [ ] Multiple question types (true/false, text input)
- [ ] Question bank and templates
- [ ] Export to PDF/Word formats
- [ ] Analytics and reporting
- [ ] Mobile responsive design

## License

This project is for educational use. Please respect any licensing requirements for UniWebView if used commercially.

## Support

For questions or issues, please open an issue on GitHub.