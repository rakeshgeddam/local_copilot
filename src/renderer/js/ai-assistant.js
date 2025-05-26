// AI Assistant
class AIAssistant {
    constructor(vectorDB) {
        this.vectorDB = vectorDB;
        this.geminiApiKey = null; // Set your Gemini API key here
    }

    async analyzeCode(code) {
        // Simple error detection
        const errors = this.detectErrors(code);
        
        if (errors.length > 0) {
            const error = errors[0];
            document.getElementById('errorDisplay').style.display = 'block';
            document.getElementById('errorMessage').textContent = error.message;

            // Get relevant documentation
            const relevantDocs = await this.vectorDB.searchSimilar(error.context);
            
            // Get AI suggestion
            const suggestion = await this.getAISuggestion(error, relevantDocs);
            
            document.getElementById('aiResponse').style.display = 'block';
            document.getElementById('aiSuggestion').innerHTML = suggestion;
        } else {
            document.getElementById('errorDisplay').style.display = 'none';
            document.getElementById('aiResponse').style.display = 'none';
        }
    }

    detectErrors(code) {
        const errors = [];
        
        // Simple pattern matching for common errors
        if (code.includes('app.listen()') && !code.includes('app.listen(')) {
            errors.push({
                type: 'missing-parameter',
                message: 'Missing port parameter in app.listen()',
                context: 'express server port configuration'
            });
        }

        if (code.includes('require(') && !code.includes('const') && !code.includes('var')) {
            errors.push({
                type: 'missing-declaration',
                message: 'Module imported but not assigned to variable',
                context: 'node.js module import'
            });
        }

        return errors;
    }

    async getAISuggestion(error, relevantDocs) {
        // In a real implementation, this would call the Gemini API
        // For now, return a mock response
        const contextInfo = relevantDocs.map(doc => doc.document.content).join('\n');
        
        const mockSuggestion = `
            <strong>Issue:</strong> ${error.message}<br><br>
            <strong>Solution:</strong> You need to specify a port number for your Express server.<br><br>
            <strong>Fix:</strong><br>
            <code>app.listen(3000, () => {<br>
            &nbsp;&nbsp;console.log('Server running on port 3000');<br>
            });</code><br><br>
            <strong>Explanation:</strong> The listen() method requires a port number as the first parameter. Port 3000 is commonly used for development.
        `;

        return mockSuggestion;
    }

    async callGeminiAPI(prompt, context) {
        // Placeholder for actual Gemini API call
        if (!this.geminiApiKey) {
            console.warn('Gemini API key not configured');
            return null;
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Context from documentation:\n${context}\n\nUser query: ${prompt}`
                        }]
                    }]
                })
            });

            const data = await response.json();
            return data.candidates[0]?.content?.parts[0]?.text;
        } catch (error) {
            console.error('Gemini API error:', error);
            return null;
        }
    }
}