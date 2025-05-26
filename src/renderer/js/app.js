// Wait for VectorDatabase to be initialized from vector-database.js
const initializeApp = async () => {
    // The VectorDatabase is already initialized in vector-database.js and available as window.vectorDB
    const vectorDB = window.vectorDB;
    const manifestWatcher = new ManifestWatcher(vectorDB);
    const aiAssistant = new AIAssistant(vectorDB);
    const codeEditorElement = document.getElementById('codeEditor');
    const fileManager = new FileManager(codeEditorElement, aiAssistant);
    const editor = new Editor(codeEditorElement, aiAssistant);


// Add some initial documentation
vectorDB.addDocument('express-basics', `
    Express.js is a web application framework for Node.js.
    
    Basic setup:
    const express = require('express');
    const app = express();
    
    Starting server:
    app.listen(port, callback);
    
    Common errors:
    - Missing port in listen()
    - Undefined routes
    - Middleware order issues
`);

// Start manifest watcher
manifestWatcher.startWatching();

// Global function for the Analyze button in AI Assistant panel
function analyzeCode() {
    aiAssistant.analyzeCode(codeEditorElement.value);
}

// File explorer functionality
document.getElementById('openFolderBtn').addEventListener('click', async () => {
    const { ipcRenderer } = require('electron');
    const result = await ipcRenderer.invoke('open-folder');
    if (result.success) {
        // Optionally, update UI or fetch file list
        const filesResult = await ipcRenderer.invoke('list-files', result.path);
        if (filesResult.success) {
            // Render file tree in #fileExplorer
            renderFileTree(filesResult.files);
        }
    } else {
        alert('Failed to open folder.');
    }
});

// Helper to render file tree (basic version)
function renderFileTree(files, depth = 0) {
    const explorer = document.getElementById('fileExplorer');
    explorer.innerHTML = '';
    function renderNodes(nodes, parent, depth) {
        nodes.forEach(node => {
            const div = document.createElement('div');
            div.className = `file-item ${node.type}${node.extension ? ' ' + node.extension.slice(1) : ''}`;
            div.textContent = node.name;
            div.dataset.file = node.path;
            div.dataset.depth = depth;
            parent.appendChild(div);
            if (node.type === 'directory' && node.children) {
                renderNodes(node.children, parent, depth + 1);
            }
        });
    }
    renderNodes(files, explorer, depth);
}

// Initial analysis
setTimeout(() => {
    aiAssistant.analyzeCode(codeEditorElement.value);
}, 1000);

    console.log('CodeVector initialized successfully!');
};

// Start initialization
initializeApp().catch(console.error);