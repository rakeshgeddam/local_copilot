const { ChromaClient } = require('chromadb');
const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');

class VectorDatabase {
    constructor() {
        const path = require('path');
        const dbPath = path.join(process.cwd(), 'data', 'vectordb');
        this.client = new ChromaClient({
            path: dbPath,
            settings: {
                persist: true, // Enable persistent storage
                allowReset: true
            }
        });
        this.collection = null;
        this.model = null;
        this.isIndexing = false;
        this.initialize();
    }

    async initialize() {
        try {
            // Initialize TensorFlow model
            this.model = await use.load();
            
            // Initialize Chroma collection
            this.collection = await this.client.createCollection({
                name: "codevector_docs",
                metadata: { "description": "CodeVector documentation and code snippets" }
            });

            // Update status in UI
            const statusEl = document.getElementById('vectorStatus');
            if (statusEl) {
                const indicator = statusEl.querySelector('.status-indicator');
                indicator.className = 'status-indicator status-online';
                statusEl.innerHTML = 'Vector DB: Connected';
            }
        } catch (error) {
            console.error('Failed to initialize vector database:', error);
            const statusEl = document.getElementById('vectorStatus');
            if (statusEl) {
                const indicator = statusEl.querySelector('.status-indicator');
                indicator.className = 'status-indicator status-offline';
                statusEl.innerHTML = 'Vector DB: Error - ' + error.message;
            }
        }
    }

    async generateEmbedding(text) {
        if (!this.model) {
            throw new Error('Model not initialized');
        }
        const embeddings = await this.model.embed([text]);
        return Array.from(await embeddings.array())[0];
    }

    async addDocument(id, content, metadata = {}) {
        try {
            const embedding = await this.generateEmbedding(content);
            
            await this.collection.upsert({
                ids: [id],
                embeddings: [embedding],
                metadatas: [{ ...metadata, timestamp: Date.now() }],
                documents: [content]
            });

            return id;
        } catch (error) {
            console.error('Failed to add document:', error);
            throw error;
        }
    }

    async searchSimilar(query, limit = 5) {
        try {
            const queryEmbedding = await this.generateEmbedding(query);
            
            const results = await this.collection.query({
                queryEmbeddings: [queryEmbedding],
                nResults: limit
            });

            return results.documents[0].map((doc, i) => ({
                id: results.ids[0][i],
                document: {
                    content: doc,
                    metadata: results.metadatas[0][i]
                },
                similarity: results.distances[0][i]
            }));
        } catch (error) {
            console.error('Failed to search documents:', error);
            throw error;
        }
    }

    async deleteDocument(id) {
        try {
            await this.collection.delete({
                ids: [id]
            });
        } catch (error) {
            console.error('Failed to delete document:', error);
            throw error;
        }
    }

    async clear() {
        try {
            await this.collection.delete();
            this.collection = await this.client.createCollection({
                name: "codevector_docs",
                metadata: { "description": "CodeVector documentation and code snippets" }
            });
        } catch (error) {
            console.error('Failed to clear collection:', error);
            throw error;
        }
    }
}

// Initialize and make available globally
const vectorDB = new VectorDatabase();
window.vectorDB = vectorDB;