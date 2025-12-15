# AI Language Translator Pro

A professional AI-powered language translator web application with 100+ languages, voice input/output, document translation, and offline support.

## Features

### Core Translation
- **100+ Languages** - Support for over 100 languages with auto-detection
- **Real-time Translation** - Instant translation as you type with smart debouncing
- **Bidirectional Translation** - Easy language swapping with one click
- **Text Statistics** - Character, word, and sentence count tracking

### Advanced Features
- **Voice Input/Output** - Speak to translate and listen to translations
- **Document Upload** - Support for .txt, .pdf, and .docx files
- **Translation Memory** - Saves previous translations for consistency
- **Glossary Management** - Custom term translations
- **Batch Translation** - Translate multiple texts at once
- **Translation Comparison** - Compare translations across different contexts
- **Alternative Translations** - View multiple translation options
- **Quality Scoring** - Confidence indicators and quality ratings
- **Pronunciation Guide** - Phonetic pronunciation for translations
- **Context Selection** - Choose translation context (formal, informal, technical, etc.)

### User Experience
- **Dark Mode** - Eye-friendly dark theme
- **Translation History** - Access up to 100 recent translations
- **Favorites** - Save important translations
- **Recent Languages** - Quick access to frequently used languages
- **Keyboard Shortcuts** - Efficient navigation and actions
- **Fullscreen Mode** - Distraction-free translation
- **Offline Support** - Service worker for offline functionality
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Export Options** - Download translations as TXT, JSON, CSV, or Excel

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Translate |
| `Ctrl + S` | Swap Languages |
| `Ctrl + C` | Copy Translation |
| `Ctrl + D` | Download |
| `Ctrl + H` | Toggle History |
| `Ctrl + F` | Fullscreen |
| `Ctrl + /` | Show Shortcuts |
| `Esc` | Close Modals |

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-language-translator
```

2. Open `index.html` in your browser or serve with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve
```

3. Visit `http://localhost:8000` in your browser

## Project Structure

```
.
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker for offline support
├── images/                 # Image assets
│   ├── moon.png
│   └── sun.png
├── script/                 # JavaScript files
│   ├── script.js          # Main application logic
│   ├── languages.js       # Language definitions
│   └── advanced-features.js # Advanced features implementation
└── styles/                 # CSS files
    └── style.css          # Main stylesheet
```

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables and animations
- **JavaScript (ES6+)** - Vanilla JavaScript with modules
- **Google Translate API** - Translation engine
- **Web Speech API** - Voice input and output
- **Service Workers** - Offline functionality
- **PWA** - Progressive Web App capabilities
- **Ionicons** - Icon library

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

**Note:** Voice features require browser support for Web Speech API.

## Features in Detail

### Translation Memory
Automatically saves translations to improve consistency across your work. Access previously translated phrases instantly.

### Batch Translation
Translate multiple lines of text simultaneously. Perfect for translating lists, menus, or multiple phrases at once.

### Quality Indicators
- **Confidence Score** - Shows translation reliability
- **Quality Stars** - Visual quality rating (1-5 stars)
- **Context Awareness** - Adjust translations based on context

### Export Formats
- **TXT** - Plain text format
- **JSON** - Structured data format
- **CSV** - Spreadsheet compatible
- **Excel** - XLSX format for advanced spreadsheet use

## Privacy & Data

- All translations are processed through Google Translate API
- Translation history is stored locally in your browser
- No data is sent to external servers except for translation requests
- Clear history anytime to remove stored translations

## Rate Limiting

The application implements rate limiting to prevent API abuse:
- Maximum 30 requests per minute
- Automatic cooldown period
- User-friendly error messages

## Accessibility

- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators
- High contrast support
- Responsive text sizing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Google Translate API for translation services
- Ionicons for the icon library
- Web Speech API for voice features

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Made with ❤️ for seamless language translation**
"# Language_translator" 
