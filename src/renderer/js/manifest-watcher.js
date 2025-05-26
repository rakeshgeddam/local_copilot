// Manifest Watcher
class ManifestWatcher {
    constructor(vectorDB) {
        this.vectorDB = vectorDB;
        this.lastManifest = null;
        this.watchInterval = null;
    }

    startWatching() {
        this.watchInterval = setInterval(() => {
            this.checkManifestChanges();
        }, 2000);
    }

    async checkManifestChanges() {
        const currentManifest = this.getCurrentManifest();
        
        if (JSON.stringify(currentManifest) !== JSON.stringify(this.lastManifest)) {
            console.log('Manifest changes detected');
            this.lastManifest = currentManifest;
            await this.updateDocumentation(currentManifest);
        }
    }

    getCurrentManifest() {
        // Mock package.json - in real app, read from file system
        return {
            dependencies: {
                "express": "^4.18.2",
                "lodash": "^4.17.21"
            }
        };
    }

    async updateDocumentation(manifest) {
        document.getElementById('docsStatus').innerHTML = 
            '<span class="loading-spinner"></span> Updating documentation...';

        for (const [pkg, version] of Object.entries(manifest.dependencies || {})) {
            await this.downloadPackageDoc(pkg, version);
        }

        document.getElementById('docsStatus').innerHTML = '✅ Documentation synced';
    }

    async downloadPackageDoc(packageName, version) {
        // Simulate downloading package documentation
        const mockDoc = `
            ${packageName} Documentation
            Version: ${version}
            
            Common methods and usage patterns:
            - Installation: npm install ${packageName}
            - Basic usage examples
            - API reference
            - Common error patterns and solutions
        `;

        await this.vectorDB.addDocument(
            `${packageName}-${version}`,
            mockDoc,
            { type: 'package-doc', package: packageName, version }
        );
    }
}