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
        this.parser = new ResumeParser();
        this.editor = new Editor(this.fileManager, this.previewRenderer, this.templateEngine);

        // Setup UI components
        this.setupFileUpload();
        this.setupVariantSelector();
        this.setupNewVariantModal();
        this.setupPreviewToggle();
        this.setupResizeHandle();
        
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
        const resizeHandle = document.getElementById('resize-handle');

        if (toggleBtn && previewPanel) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = previewPanel.classList.contains('hidden');
                if (isHidden) {
                    previewPanel.classList.remove('hidden');
                    if (resizeHandle) resizeHandle.style.display = 'block';
                    toggleBtn.textContent = 'Hide Preview';
                } else {
                    previewPanel.classList.add('hidden');
                    if (resizeHandle) resizeHandle.style.display = 'none';
                    toggleBtn.textContent = 'Show Preview';
                }
            });
        }
    }

    // Setup file upload
    setupFileUpload() {
        const uploadInput = document.getElementById('resume-upload');
        const uploadArea = document.getElementById('upload-area');
        const uploadStatus = document.getElementById('upload-status');

        // File input change handler
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file);
                }
            });
        }

        // Drag and drop handlers
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadArea.classList.remove('drag-over');
                
                const file = e.dataTransfer.files[0];
                if (file && (file.name.endsWith('.docx') || file.name.endsWith('.pdf'))) {
                    this.handleFileUpload(file);
                } else {
                    this.showUploadStatus('Please upload a DOCX or PDF file', 'error');
                }
            });

            // Click to upload
            uploadArea.addEventListener('click', () => {
                if (uploadInput) {
                    uploadInput.click();
                }
            });
        }
    }

    // Handle file upload and parsing
    async handleFileUpload(file) {
        const uploadStatus = document.getElementById('upload-status');
        
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
            this.showUploadStatus('Please upload a DOCX or PDF file', 'error');
            return;
        }

        this.showUploadStatus('Parsing file...', 'loading');

        try {
            let parsedText;
            
            // Parse based on file type
            if (file.name.endsWith('.docx')) {
                parsedText = await this.parser.parseDOCX(file);
            } else if (file.name.endsWith('.pdf')) {
                parsedText = await this.parser.parsePDF(file);
            }

            // Extract structured data
            const resumeData = this.parser.extractResumeData(parsedText);

            // Create or update variant
            const variantName = file.name.replace(/\.(docx|pdf)$/i, '.tex');
            if (!this.fileManager.variants.has(variantName)) {
                this.fileManager.createVariant(variantName);
            }
            
            // Update variant data
            this.fileManager.updateVariantData(resumeData);

            // Save all bullets to library
            this.fileManager.saveBulletsFromResume(resumeData);

            // Load into editor
            this.editor.loadCurrentVariant();

            // Update variant list
            this.updateVariantList();

            this.showUploadStatus('✓ Resume parsed successfully!', 'success');
            
            // Scroll to top to show the loaded resume
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error parsing file:', error);
            this.showUploadStatus('Error parsing file: ' + error.message, 'error');
        }
    }

    // Show upload status message
    showUploadStatus(message, type = 'info') {
        const uploadStatus = document.getElementById('upload-status');
        if (uploadStatus) {
            uploadStatus.textContent = message;
            // Fix class name to match CSS
            if (type === 'loading') {
                uploadStatus.className = 'upload-status upload-status-loading';
            } else if (type === 'success') {
                uploadStatus.className = 'upload-status upload-status-success';
            } else if (type === 'error') {
                uploadStatus.className = 'upload-status upload-status-error';
            } else {
                uploadStatus.className = 'upload-status';
            }
            
            // Clear success/error messages after 5 seconds
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    uploadStatus.textContent = '';
                    uploadStatus.className = 'upload-status';
                }, 5000);
            }
        }
    }

    // Setup resize handle for panels
    setupResizeHandle() {
        const resizeHandle = document.getElementById('resize-handle');
        const editorPanel = document.getElementById('editor-panel');
        const previewPanel = document.getElementById('preview-panel');
        const container = document.querySelector('.editor-preview-container');

        if (!resizeHandle || !editorPanel || !previewPanel) return;

        let isResizing = false;
        let startX = 0;
        let startWidth = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = previewPanel.offsetWidth;
            resizeHandle.classList.add('active');
            
            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const containerWidth = container.offsetWidth;
            const deltaX = startX - e.clientX; // Inverted because we're resizing from right
            const newWidth = startWidth + deltaX;
            
            // Constrain width between min and max
            const minWidth = 300;
            const maxWidth = containerWidth * 0.7;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                previewPanel.style.width = `${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeHandle.classList.remove('active');
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                
                // Save width to localStorage
                localStorage.setItem('preview-panel-width', previewPanel.offsetWidth);
            }
        });

        // Load saved width from localStorage
        const savedWidth = localStorage.getItem('preview-panel-width');
        if (savedWidth) {
            const width = parseInt(savedWidth);
            if (width >= 300 && width <= window.innerWidth * 0.7) {
                previewPanel.style.width = `${width}px`;
            }
        }

        // Double-click to reset to default
        resizeHandle.addEventListener('dblclick', () => {
            previewPanel.style.width = '500px';
            localStorage.setItem('preview-panel-width', '500');
        });
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

