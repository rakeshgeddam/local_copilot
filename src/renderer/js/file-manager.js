class FileManager {
    constructor(codeEditor, aiAssistant) {
        this.codeEditor = codeEditor;
        this.aiAssistant = aiAssistant;
        this.mockFiles = {
            'main.js': `// Welcome to CodeVector - Your AI-powered code editor
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// This will cause an error - missing port
app.listen();`,
            'package.json': `{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.21"
  }
}`,
            'README.md': `# My Project

This is a sample project using CodeVector editor.

## Features
- AI-powered error detection
- Vector database for documentation
- Manifest file watching
`
        };
    }

    loadFile(fileName) {
        this.codeEditor.value = this.mockFiles[fileName] || '';
        this.aiAssistant.analyzeCode(this.codeEditor.value);
    }
}