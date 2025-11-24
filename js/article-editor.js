// js/article-editor.js - Enhanced editor untuk konten artikel
class ArticleEditor {
    static init() {
        console.log('Initializing ArticleEditor...');
        this.setupEditorListeners();
        this.setupFormattingButtons();
    }

    static setupEditorListeners() {
        // Auto-resize textarea
        const contentTextareas = ['articleContent', 'modalArticleContent'];
        
        contentTextareas.forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.addEventListener('input', this.autoResize);
                textarea.addEventListener('keydown', this.handleTabKey);
                console.log(`Textarea ${id} listeners added`);
            } else {
                console.log(`Textarea ${id} not found`);
            }
        });
    }

    static setupFormattingButtons() {
        // Formatting buttons untuk editor sederhana
        this.setupFormattingButton('boldBtn', '**teks tebal**', '**', '**');
        this.setupFormattingButton('italicBtn', '_teks miring_', '_', '_');
        this.setupFormattingButton('underlineBtn', '<u>teks garis bawah</u>', '<u>', '</u>');
        this.setupFormattingButton('linkBtn', '[teks link](https://...)', '[', '](https://)');
        this.setupFormattingButton('listBtn', '- item list', '- ', '');
        this.setupFormattingButton('quoteBtn', '> kutipan', '> ', '');
    }

    static setupFormattingButton(buttonId, exampleText, beforeText, afterText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                this.insertText(beforeText, afterText);
            });
            
            // Tooltip
            button.title = exampleText;
            console.log(`Formatting button ${buttonId} initialized`);
        } else {
            console.log(`Formatting button ${buttonId} not found`);
        }
    }

    static insertText(beforeText, afterText) {
        const activeTextarea = this.getActiveTextarea();
        if (!activeTextarea) return;

        const start = activeTextarea.selectionStart;
        const end = activeTextarea.selectionEnd;
        const selectedText = activeTextarea.value.substring(start, end);
        const newText = beforeText + selectedText + afterText;

        activeTextarea.value = activeTextarea.value.substring(0, start) + 
                              newText + 
                              activeTextarea.value.substring(end);

        // Set cursor position
        const newCursorPos = start + beforeText.length + selectedText.length + afterText.length;
        activeTextarea.setSelectionRange(newCursorPos, newCursorPos);
        activeTextarea.focus();

        // Trigger auto-resize
        this.autoResize({ target: activeTextarea });
    }

    static getActiveTextarea() {
        // Cari textarea yang sedang aktif/focus
        const textareas = ['articleContent', 'modalArticleContent'];
        for (let id of textareas) {
            const textarea = document.getElementById(id);
            if (textarea && document.activeElement === textarea) {
                return textarea;
            }
        }
        // Default ke articleContent jika tidak ada yang focus
        return document.getElementById('articleContent') || 
               document.getElementById('modalArticleContent');
    }

    static autoResize(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    static handleTabKey(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // Insert tab character
            textarea.value = textarea.value.substring(0, start) + 
                           '    ' + 
                           textarea.value.substring(end);
            
            // Set cursor position after tab
            textarea.setSelectionRange(start + 4, start + 4);
        }
    }

    static formatContent(content) {
        if (!content) return '';
        
        console.log('Formatting content...');
        
        // Convert simple markup to HTML
        return content
            // Bold: **teks** -> <strong>teks</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic: _teks_ -> <em>teks</em>
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // Underline: <u>teks</u> tetap
            // Links: [teks](url) -> <a href="url">teks</a>
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Lists: - item -> <li>item</li>
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            // Quotes: > teks -> <blockquote>teks</blockquote>
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            // Paragraphs: double newline -> </p><p>
            .replace(/\n\n/g, '</p><p>')
            // Single newline -> <br>
            .replace(/\n/g, '<br>');
    }
}

// Initialize editor
document.addEventListener('DOMContentLoaded', function() {
    ArticleEditor.init();
});

// Make available globally
if (typeof window !== 'undefined') {
    window.ArticleEditor = ArticleEditor;
}