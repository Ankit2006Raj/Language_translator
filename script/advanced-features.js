// Advanced Features Module
import { languages } from "./languages.js";

// Translation Memory & Glossary
class TranslationMemory {
    constructor() {
        this.memory = JSON.parse(localStorage.getItem("translationMemory")) || [];
        this.glossary = JSON.parse(localStorage.getItem("glossary")) || [];
    }

    addToMemory(source, target, sourceLang, targetLang) {
        const entry = {
            id: Date.now(),
            source,
            target,
            sourceLang,
            targetLang,
            frequency: 1,
            lastUsed: new Date().toISOString()
        };

        const existing = this.memory.findIndex(
            m => m.source.toLowerCase() === source.toLowerCase() &&
                m.sourceLang === sourceLang &&
                m.targetLang === targetLang
        );

        if (existing !== -1) {
            this.memory[existing].frequency++;
            this.memory[existing].lastUsed = new Date().toISOString();
        } else {
            this.memory.unshift(entry);
            if (this.memory.length > 500) this.memory = this.memory.slice(0, 500);
        }

        this.save();
    }

    searchMemory(query, sourceLang, targetLang) {
        return this.memory.filter(m =>
            m.source.toLowerCase().includes(query.toLowerCase()) &&
            m.sourceLang === sourceLang &&
            m.targetLang === targetLang
        ).sort((a, b) => b.frequency - a.frequency);
    }

    addToGlossary(term, translation, sourceLang, targetLang) {
        const entry = {
            id: Date.now(),
            term,
            translation,
            sourceLang,
            targetLang,
            createdAt: new Date().toISOString()
        };
        this.glossary.unshift(entry);
        this.save();
    }

    applyGlossary(text, sourceLang, targetLang) {
        let result = text;
        const relevantTerms = this.glossary.filter(
            g => g.sourceLang === sourceLang && g.targetLang === targetLang
        );

        relevantTerms.forEach(({ term, translation }) => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            result = result.replace(regex, translation);
        });

        return result;
    }

    save() {
        localStorage.setItem("translationMemory", JSON.stringify(this.memory));
        localStorage.setItem("glossary", JSON.stringify(this.glossary));
    }
}

// Batch Translation Manager
class BatchTranslator {
    constructor() {
        this.queue = [];
        this.results = [];
        this.isProcessing = false;
    }

    addToQueue(texts, sourceLang, targetLang) {
        this.queue = texts.map((text, index) => ({
            id: Date.now() + index,
            text,
            sourceLang,
            targetLang,
            status: 'pending',
            result: null
        }));
    }

    async processQueue(onProgress, onComplete) {
        this.isProcessing = true;
        this.results = [];

        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];

            try {
                const translation = await this.translateSingle(item.text, item.sourceLang, item.targetLang);
                item.status = 'completed';
                item.result = translation;
                this.results.push({ ...item });

                onProgress(i + 1, this.queue.length);

                // Rate limiting delay
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                item.status = 'failed';
                item.error = error.message;
                this.results.push({ ...item });
            }
        }

        this.isProcessing = false;
        onComplete(this.results);
    }

    async translateSingle(text, sourceLang, targetLang) {
        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        );

        if (!res.ok) throw new Error("Translation failed");

        const json = await res.json();
        return json[0].map(a => a[0]).join("");
    }

    exportResults(format = 'json') {
        const data = this.results.map(r => ({
            original: r.text,
            translation: r.result || 'Failed',
            status: r.status
        }));

        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            case 'csv':
                return this.toCSV(data);
            case 'xlsx':
                return this.toExcelData(data);
            default:
                return data.map(d => `${d.original}\t${d.translation}`).join('\n');
        }
    }

    toCSV(data) {
        const headers = 'Original,Translation,Status\n';
        const rows = data.map(d =>
            `"${d.original.replace(/"/g, '""')}","${d.translation.replace(/"/g, '""')}","${d.status}"`
        ).join('\n');
        return headers + rows;
    }

    toExcelData(data) {
        // Simple TSV format that Excel can open
        const headers = 'Original\tTranslation\tStatus\n';
        const rows = data.map(d => `${d.original}\t${d.translation}\t${d.status}`).join('\n');
        return headers + rows;
    }
}

// Language Detection with Confidence
class LanguageDetector {
    async detectLanguage(text) {
        try {
            const res = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`
            );

            const json = await res.json();
            const detectedLang = json[2];

            // Calculate confidence based on text characteristics
            const confidence = this.calculateConfidence(text, detectedLang);

            return {
                language: detectedLang,
                confidence: confidence,
                languageName: this.getLanguageName(detectedLang)
            };
        } catch (error) {
            return { language: 'unknown', confidence: 0, languageName: 'Unknown' };
        }
    }

    calculateConfidence(text, detectedLang) {
        let confidence = 70; // Base confidence

        // Increase confidence for longer texts
        if (text.length > 100) confidence += 10;
        if (text.length > 300) confidence += 10;

        // Decrease confidence for very short texts
        if (text.length < 20) confidence -= 20;

        // Check for mixed scripts (reduces confidence)
        const scripts = this.detectScripts(text);
        if (scripts.length > 1) confidence -= 15;

        return Math.max(0, Math.min(100, confidence));
    }

    detectScripts(text) {
        const scripts = new Set();
        for (const char of text) {
            const code = char.charCodeAt(0);
            if (code >= 0x0041 && code <= 0x007A) scripts.add('latin');
            else if (code >= 0x0400 && code <= 0x04FF) scripts.add('cyrillic');
            else if (code >= 0x0600 && code <= 0x06FF) scripts.add('arabic');
            else if (code >= 0x4E00 && code <= 0x9FFF) scripts.add('cjk');
        }
        return Array.from(scripts);
    }

    getLanguageName(code) {
        const lang = languages.find(l => l.code === code);
        return lang ? lang.name : code;
    }
}

// Alternative Translations Generator
class AlternativesGenerator {
    async generateAlternatives(text, sourceLang, targetLang) {
        // Simulate alternative translations by using different approaches
        const alternatives = [];

        try {
            // Main translation
            const main = await this.translate(text, sourceLang, targetLang);
            alternatives.push({ text: main, confidence: 95, method: 'Primary' });

            // Try with slight variations for more alternatives
            if (text.length > 10) {
                const words = text.split(' ');
                if (words.length > 3) {
                    // Translate in chunks and recombine
                    const chunks = this.chunkText(text);
                    const chunkTranslations = await Promise.all(
                        chunks.map(chunk => this.translate(chunk, sourceLang, targetLang))
                    );
                    alternatives.push({
                        text: chunkTranslations.join(' '),
                        confidence: 85,
                        method: 'Chunked'
                    });
                }
            }

            // Add contextual variations
            alternatives.push({
                text: this.addContextualVariation(main, 'formal'),
                confidence: 80,
                method: 'Formal'
            });

            alternatives.push({
                text: this.addContextualVariation(main, 'casual'),
                confidence: 75,
                method: 'Casual'
            });

        } catch (error) {
            console.error('Error generating alternatives:', error);
        }

        return alternatives.slice(0, 4); // Return top 4 alternatives
    }

    async translate(text, sourceLang, targetLang) {
        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        );
        const json = await res.json();
        return json[0].map(a => a[0]).join("");
    }

    chunkText(text) {
        const words = text.split(' ');
        const chunkSize = Math.ceil(words.length / 2);
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }
        return chunks;
    }

    addContextualVariation(text, context) {
        // Simple contextual markers (in real app, this would use context-aware API)
        const variations = {
            formal: text,
            casual: text
        };
        return variations[context] || text;
    }
}

// Pronunciation Generator
class PronunciationGenerator {
    generatePronunciation(text, language) {
        // IPA-like pronunciation guide
        // In production, use a proper pronunciation API
        const pronunciationMap = {
            'en': this.englishPronunciation,
            'es': this.spanishPronunciation,
            'fr': this.frenchPronunciation,
            'de': this.germanPronunciation,
            'ja': this.japanesePronunciation,
            'zh-CN': this.chinesePronunciation,
            'ar': this.arabicPronunciation,
            'ru': this.russianPronunciation
        };

        const generator = pronunciationMap[language];
        if (generator) {
            return generator.call(this, text);
        }

        return `[${text}]`; // Fallback
    }

    englishPronunciation(text) {
        // Simplified phonetic representation
        return text.toLowerCase()
            .replace(/tion/g, 'shun')
            .replace(/th/g, 'θ')
            .replace(/ch/g, 'tʃ')
            .replace(/sh/g, 'ʃ');
    }

    spanishPronunciation(text) {
        return text.toLowerCase()
            .replace(/ll/g, 'y')
            .replace(/ñ/g, 'ny');
    }

    frenchPronunciation(text) {
        return text.toLowerCase()
            .replace(/eau/g, 'o')
            .replace(/oi/g, 'wa');
    }

    germanPronunciation(text) {
        return text.toLowerCase()
            .replace(/ch/g, 'χ')
            .replace(/sch/g, 'ʃ');
    }

    japanesePronunciation(text) {
        return `[${text}]`; // Would use romaji conversion
    }

    chinesePronunciation(text) {
        return `[${text}]`; // Would use pinyin
    }

    arabicPronunciation(text) {
        return `[${text}]`; // Would use transliteration
    }

    russianPronunciation(text) {
        return `[${text}]`; // Would use transliteration
    }
}

// Translation Quality Scorer
class QualityScorer {
    scoreTranslation(original, translation, sourceLang, targetLang) {
        let score = 70; // Base score

        // Length similarity
        const lengthRatio = translation.length / original.length;
        if (lengthRatio > 0.5 && lengthRatio < 2) score += 10;

        // Word count similarity
        const originalWords = original.split(/\s+/).length;
        const translationWords = translation.split(/\s+/).length;
        const wordRatio = translationWords / originalWords;
        if (wordRatio > 0.6 && wordRatio < 1.5) score += 10;

        // Punctuation preservation
        const originalPunct = (original.match(/[.,!?;:]/g) || []).length;
        const translationPunct = (translation.match(/[.,!?;:]/g) || []).length;
        if (Math.abs(originalPunct - translationPunct) <= 2) score += 5;

        // Capitalization check
        if (original[0] === original[0].toUpperCase() &&
            translation[0] === translation[0].toUpperCase()) {
            score += 5;
        }

        return Math.min(100, score);
    }

    getStars(score) {
        if (score >= 90) return 5;
        if (score >= 75) return 4;
        if (score >= 60) return 3;
        if (score >= 45) return 2;
        return 1;
    }
}

// Multi-Engine Comparison
class TranslationComparator {
    async compareTranslations(text, sourceLang, targetLang) {
        const engines = [
            { name: 'Google Translate', method: 'google' },
            { name: 'Alternative 1', method: 'alt1' },
            { name: 'Alternative 2', method: 'alt2' }
        ];

        const results = await Promise.all(
            engines.map(async engine => {
                try {
                    const translation = await this.translateWithEngine(text, sourceLang, targetLang, engine.method);
                    return {
                        engine: engine.name,
                        translation,
                        confidence: Math.floor(Math.random() * 20) + 80 // Simulated
                    };
                } catch (error) {
                    return {
                        engine: engine.name,
                        translation: 'Error',
                        confidence: 0
                    };
                }
            })
        );

        return results;
    }

    async translateWithEngine(text, sourceLang, targetLang, method) {
        // In production, integrate multiple translation APIs
        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        );
        const json = await res.json();
        const base = json[0].map(a => a[0]).join("");

        // Simulate different engines with slight variations
        if (method === 'alt1') return base;
        if (method === 'alt2') return base;
        return base;
    }
}

// Export instances
export const translationMemory = new TranslationMemory();
export const batchTranslator = new BatchTranslator();
export const languageDetector = new LanguageDetector();
export const alternativesGenerator = new AlternativesGenerator();
export const pronunciationGenerator = new PronunciationGenerator();
export const qualityScorer = new QualityScorer();
export const translationComparator = new TranslationComparator();
