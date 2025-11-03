// Main Application - Initializes and coordinates all modules

class ResumeBuilderApp {
    constructor() {
        this.fileManager = null;
        this.previewRenderer = null;
        this.templateEngine = null;
        this.editor = null;
    }

    init() {
        // Initialize modules
        this.fileManager = new FileManager();
        this.templateEngine = new TemplateEngine();
        this.previewRenderer = new PreviewRenderer('preview-content');
        this.editor = new Editor(this.fileManager, this.previewRenderer, this.templateEngine);

        // Setup UI components
        this.setupVariantSelector();
        this.setupNewVariantModal();
        this.setupPreviewToggle();
        
        // Initial render
        this.updateVariantList();
        this.editor.loadCurrentVariant();
    }

    // Setup variant selector
    setupVariantSelector() {
        const variantList = document.getElementById('variant-list');
        if (!variantList) return;

        // Variant list will be populated by updateVariantList
        this.updateVariantList();
    }

    // Update variant list in sidebar
    updateVariantList() {
        const variantList = document.getElementById('variant-list');
        if (!variantList) return;

        variantList.innerHTML = '';

        const variants = this.fileManager.getVariantNames();
        variants.forEach(name => {
            const isActive = name === this.fileManager.currentVariant;
            const item = document.createElement('div');
            item.className = `variant-item ${isActive ? 'active' : ''}`;
            item.innerHTML = `
                <span class="variant-item-name">${this.escapeHtml(name)}</span>
                <div class="variant-item-controls">
                    <button class="delete-variant-btn" data-variant="${this.escapeHtml(name)}" title="Delete">×</button>
                </div>
            `;

            // Click to switch variant
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-variant-btn')) {
                    this.switchVariant(name);
                }
            });

            // Delete button
            const deleteBtn = item.querySelector('.delete-variant-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete variant "${name}"?`)) {
                        this.deleteVariant(name);
                    }
                });
            }

            variantList.appendChild(item);
        });
    }

    // Switch to a different variant
    switchVariant(name) {
        if (this.fileManager.setCurrentVariant(name)) {
            this.updateVariantList();
            this.editor.loadCurrentVariant();
        }
    }

    // Delete variant
    deleteVariant(name) {
        if (this.fileManager.deleteVariant(name)) {
            this.updateVariantList();
            this.editor.loadCurrentVariant();
        } else {
            alert('Cannot delete the last remaining variant.');
        }
    }

    // Setup new variant modal
    setupNewVariantModal() {
        const modal = document.getElementById('variant-modal');
        const newVariantBtn = document.getElementById('new-variant-btn');
        const createBtn = document.getElementById('create-variant-btn');
        const closeBtn = modal?.querySelector('.close');
        const variantNameInput = document.getElementById('variant-name');

        // Open modal
        if (newVariantBtn) {
            newVariantBtn.addEventListener('click', () => {
                if (modal) {
                    modal.classList.add('active');
                    if (variantNameInput) {
                        variantNameInput.value = '';
                        variantNameInput.focus();
                    }
                }
            });
        }

        // Close modal
        const closeModal = () => {
            if (modal) {
                modal.classList.remove('active');
            }
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        // Create variant
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const name = variantNameInput?.value.trim();
                if (name) {
                    // Ensure .tex extension
                    const variantName = name.endsWith('.tex') ? name : `${name}.tex`;
                    
                    if (this.fileManager.createVariant(variantName)) {
                        closeModal();
                        this.updateVariantList();
                        this.editor.loadCurrentVariant();
                    } else {
                        alert('A variant with this name already exists.');
                    }
                } else {
                    alert('Please enter a variant name.');
                }
            });

            // Allow Enter key to create
            if (variantNameInput) {
                variantNameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        createBtn.click();
                    }
                });
            }
        }
    }

    // Setup preview toggle
    setupPreviewToggle() {
        const toggleBtn = document.getElementById('toggle-preview-btn');
        const previewPanel = document.getElementById('preview-panel');

        if (toggleBtn && previewPanel) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = previewPanel.classList.contains('hidden');
                if (isHidden) {
                    previewPanel.classList.remove('hidden');
                    toggleBtn.textContent = 'Hide Preview';
                } else {
                    previewPanel.classList.add('hidden');
                    toggleBtn.textContent = 'Show Preview';
                }
            });
        }
    }

    // Escape HTML helper
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ResumeBuilderApp();
    app.init();
    window.resumeBuilderApp = app; // Expose for debugging
});

