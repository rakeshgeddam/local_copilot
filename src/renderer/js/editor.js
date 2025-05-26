class Editor {
    constructor(codeEditor, aiAssistant) {
        this.codeEditor = codeEditor;
        this.aiAssistant = aiAssistant;
        this.analysisTimeout = null;
        this.initEventListeners();
    }

    initEventListeners() {
        this.codeEditor.addEventListener('input', () => {
            clearTimeout(this.analysisTimeout);
            this.analysisTimeout = setTimeout(() => {
                this.aiAssistant.analyzeCode(this.codeEditor.value);
            }, 1000);
        });
    }
}