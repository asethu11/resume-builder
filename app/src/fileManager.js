// File Manager - Handles resume variants and file operations

class FileManager {
    constructor() {
        this.variants = new Map();
        this.currentVariant = null;
        this.storageKey = 'resume-builder-variants';
        this.loadFromStorage();
    }

    // Load variants from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.variants = new Map(data);
                // Set default variant if available
                if (this.variants.size > 0) {
                    const firstVariant = Array.from(this.variants.keys())[0];
                    this.currentVariant = firstVariant;
                }
            } catch (e) {
                console.error('Error loading from storage:', e);
                this.initializeDefaults();
            }
        } else {
            this.initializeDefaults();
        }
    }

    // Initialize default variants from existing .tex files
    initializeDefaults() {
        const defaultNames = ['compiler.tex', 'ml.tex', 'sf.tex'];
        defaultNames.forEach(name => {
            const data = this.getDefaultResumeData();
            this.variants.set(name, data);
        });
        if (defaultNames.length > 0) {
            this.currentVariant = defaultNames[0];
        }
        this.saveToStorage();
    }

    // Get default empty resume data structure
    getDefaultResumeData() {
        return {
            personal: {
                name: '',
                email: '',
                linkedin: '',
                github: '',
                portfolio: ''
            },
            education: [],
            skills: {
                programmingLanguages: '',
                mlSkills: '',
                cloudTech: '',
                frameworks: ''
            },
            experience: [],
            projects: [],
            achievements: []
        };
    }

    // Save to localStorage
    saveToStorage() {
        const data = Array.from(this.variants.entries());
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Get all variant names
    getVariantNames() {
        return Array.from(this.variants.keys());
    }

    // Get current variant data
    getCurrentVariantData() {
        if (!this.currentVariant) return null;
        return this.variants.get(this.currentVariant);
    }

    // Set current variant
    setCurrentVariant(name) {
        if (this.variants.has(name)) {
            this.currentVariant = name;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Create new variant
    createVariant(name) {
        if (this.variants.has(name)) {
            return false; // Variant already exists
        }
        const data = this.getDefaultResumeData();
        this.variants.set(name, data);
        this.currentVariant = name;
        this.saveToStorage();
        return true;
    }

    // Delete variant
    deleteVariant(name) {
        if (this.variants.size <= 1) {
            return false; // Can't delete last variant
        }
        this.variants.delete(name);
        if (this.currentVariant === name) {
            // Switch to first available variant
            this.currentVariant = Array.from(this.variants.keys())[0];
        }
        this.saveToStorage();
        return true;
    }

    // Update variant data
    updateVariantData(data) {
        if (!this.currentVariant) return false;
        this.variants.set(this.currentVariant, data);
        this.saveToStorage();
        return true;
    }

    // Export as JSON
    exportJSON(variantName = null) {
        const name = variantName || this.currentVariant;
        const data = this.variants.get(name);
        if (!data) return null;
        
        return {
            variant: name,
            data: data,
            exportedAt: new Date().toISOString()
        };
    }

    // Import from JSON
    importJSON(jsonData) {
        try {
            const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if (parsed.variant && parsed.data) {
                this.variants.set(parsed.variant, parsed.data);
                this.currentVariant = parsed.variant;
                this.saveToStorage();
                return true;
            }
        } catch (e) {
            console.error('Error importing JSON:', e);
        }
        return false;
    }

    // Import from LaTeX (basic parsing - would need more sophisticated parser)
    importFromLaTeX(texContent, variantName) {
        // This is a placeholder - full LaTeX parsing would be complex
        // For now, create a new variant and let user manually edit
        const data = this.getDefaultResumeData();
        this.variants.set(variantName, data);
        this.currentVariant = variantName;
        this.saveToStorage();
        return true;
    }
}

// Export for use in other modules
window.FileManager = FileManager;

