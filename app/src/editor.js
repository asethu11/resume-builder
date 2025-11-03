// Editor - Handles form interactions and data binding

class Editor {
    constructor(fileManager, previewRenderer, templateEngine) {
        this.fileManager = fileManager;
        this.previewRenderer = previewRenderer;
        this.templateEngine = templateEngine;
        this.entryCounters = {
            education: 0,
            experience: 0,
            project: 0,
            achievement: 0
        };
        this.init();
    }

    init() {
        this.bindPersonalFields();
        this.bindSkillsFields();
        this.bindActionButtons();
        this.bindEntryButtons();
        this.bindSectionToggles();
        this.initializeDragAndDrop();
        
        // Load current variant data
        this.loadCurrentVariant();
    }

    // Initialize drag-and-drop for bullet lists
    initializeDragAndDrop() {
        // Wait for DOM to be ready, then initialize sortable on bullet containers
        setTimeout(() => {
            this.makeAllBulletsSortable();
        }, 100);
    }

    // Make all bullet lists sortable
    makeAllBulletsSortable() {
        document.querySelectorAll('.bullet-points').forEach(container => {
            if (!container.hasAttribute('data-sortable-initialized')) {
                this.makeSortable(container);
                container.setAttribute('data-sortable-initialized', 'true');
            }
        });
    }

    // Make a container sortable using SortableJS
    makeSortable(container) {
        if (typeof Sortable === 'undefined') {
            // Fallback to native HTML5 drag-and-drop if SortableJS not available
            this.makeNativeSortable(container);
            return;
        }

        new Sortable(container, {
            animation: 150,
            handle: '.bullet-point-item',
            ghostClass: 'dragging',
            dragClass: 'dragging',
            onEnd: (evt) => {
                this.handleBulletReorder(evt.oldIndex, evt.newIndex, container);
            }
        });
    }

    // Native HTML5 drag-and-drop implementation (fallback)
    makeNativeSortable(container) {
        const items = container.querySelectorAll('.bullet-point-item');
        
        items.forEach((item, index) => {
            item.draggable = true;
            item.dataset.index = index;

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.outerHTML);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                const afterElement = this.getDragAfterElement(container, e.clientY);
                const dragging = container.querySelector('.dragging');
                
                if (afterElement == null) {
                    container.appendChild(dragging);
                } else {
                    container.insertBefore(dragging, afterElement);
                }
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedItem = container.querySelector('.dragging');
                if (draggedItem) {
                    this.handleBulletReorderNative(container);
                }
            });
        });
    }

    // Get element after which to insert dragged item
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.bullet-point-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Handle bullet reorder using SortableJS
    handleBulletReorder(oldIndex, newIndex, container) {
        if (oldIndex === newIndex) return;
        
        // Update data and preview
        this.updateData();
        this.updatePreview();
        
        // Save bullets to library
        this.saveCurrentBulletsToLibrary();
    }

    // Handle bullet reorder using native drag-and-drop
    handleBulletReorderNative(container) {
        this.updateData();
        this.updatePreview();
        this.saveCurrentBulletsToLibrary();
    }

    // Save current bullets to library
    saveCurrentBulletsToLibrary() {
        const data = this.updateData();
        
        // Save experience bullets
        if (data.experience) {
            data.experience.forEach((exp, expIdx) => {
                if (exp.bullets) {
                    exp.bullets.forEach((bulletText) => {
                        const bulletId = this.fileManager.generateBulletId({
                            text: bulletText,
                            section: 'experience',
                            entryId: expIdx
                        });
                        this.fileManager.saveBullet(bulletId, {
                            text: bulletText,
                            section: 'experience',
                            entryId: expIdx
                        });
                    });
                }
            });
        }
        
        // Save project bullets
        if (data.projects) {
            data.projects.forEach((proj, projIdx) => {
                if (proj.bullets) {
                    proj.bullets.forEach((bulletText) => {
                        const bulletId = this.fileManager.generateBulletId({
                            text: bulletText,
                            section: 'projects',
                            entryId: projIdx
                        });
                        this.fileManager.saveBullet(bulletId, {
                            text: bulletText,
                            section: 'projects',
                            entryId: projIdx
                        });
                    });
                }
            });
        }
    }

    // Bind personal information fields
    bindPersonalFields() {
        const fields = ['name', 'email', 'linkedin', 'github', 'portfolio'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateData();
                    this.updatePreview();
                });
            }
        });
    }

    // Bind skills fields
    bindSkillsFields() {
        const fields = ['programming-languages', 'ml-skills', 'cloud-tech', 'frameworks'];
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', () => {
                    this.updateData();
                    this.updatePreview();
                });
            }
        });
    }

    // Bind action buttons
    bindActionButtons() {
        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.save());
        }

        // Export LaTeX button
        const exportBtn = document.getElementById('export-tex-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportLaTeX());
        }

        // Compile PDF button
        const compileBtn = document.getElementById('compile-pdf-btn');
        if (compileBtn) {
            compileBtn.addEventListener('click', () => this.compilePDF());
        }

        // Import LaTeX button
        const importBtn = document.getElementById('import-tex-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importLaTeX());
        }
    }

    // Bind entry management buttons
    bindEntryButtons() {
        // Education
        const addEduBtn = document.getElementById('add-education-btn');
        if (addEduBtn) {
            addEduBtn.addEventListener('click', () => this.addEducationEntry());
        }

        // Experience
        const addExpBtn = document.getElementById('add-experience-btn');
        if (addExpBtn) {
            addExpBtn.addEventListener('click', () => this.addExperienceEntry());
        }

        // Projects
        const addProjBtn = document.getElementById('add-project-btn');
        if (addProjBtn) {
            addProjBtn.addEventListener('click', () => this.addProjectEntry());
        }

        // Achievements
        const addAchBtn = document.getElementById('add-achievement-btn');
        if (addAchBtn) {
            addAchBtn.addEventListener('click', () => this.addAchievementEntry());
        }
    }

    // Bind section toggle buttons
    bindSectionToggles() {
        document.querySelectorAll('.section-header').forEach(header => {
            const toggleBtn = header.querySelector('.toggle-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const section = header.closest('.form-section');
                    const content = section.querySelector('.section-content');
                    content.classList.toggle('collapsed');
                    toggleBtn.textContent = content.classList.contains('collapsed') ? '+' : '−';
                });
            }
        });
    }

    // Load current variant data into forms
    loadCurrentVariant() {
        const data = this.fileManager.getCurrentVariantData();
        if (!data) return;

        // Personal information
        if (data.personal) {
            this.setFieldValue('name', data.personal.name);
            this.setFieldValue('email', data.personal.email);
            this.setFieldValue('linkedin', data.personal.linkedin);
            this.setFieldValue('github', data.personal.github);
            this.setFieldValue('portfolio', data.personal.portfolio);
        }

        // Skills
        if (data.skills) {
            this.setFieldValue('programming-languages', data.skills.programmingLanguages);
            this.setFieldValue('ml-skills', data.skills.mlSkills);
            this.setFieldValue('cloud-tech', data.skills.cloudTech);
            this.setFieldValue('frameworks', data.skills.frameworks);
        }

        // Education
        this.loadEducationEntries(data.education || []);

        // Experience
        this.loadExperienceEntries(data.experience || []);

        // Projects
        this.loadProjectEntries(data.projects || []);

        // Achievements
        this.loadAchievementEntries(data.achievements || []);

        // Update preview
        this.updatePreview();
        
        // Reinitialize drag-and-drop after loading
        setTimeout(() => {
            this.makeAllBulletsSortable();
        }, 100);
    }

    // Set field value helper
    setFieldValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
        }
    }

    // Load education entries
    loadEducationEntries(entries) {
        const container = document.getElementById('education-entries');
        if (!container) return;

        container.innerHTML = '';
        entries.forEach((entry, index) => {
            this.addEducationEntry(entry, index);
        });
    }

    // Load experience entries
    loadExperienceEntries(entries) {
        const container = document.getElementById('experience-entries');
        if (!container) return;

        container.innerHTML = '';
        entries.forEach((entry, index) => {
            this.addExperienceEntry(entry, index);
        });
    }

    // Load project entries
    loadProjectEntries(entries) {
        const container = document.getElementById('project-entries');
        if (!container) return;

        container.innerHTML = '';
        entries.forEach((entry, index) => {
            this.addProjectEntry(entry, index);
        });
    }

    // Load achievement entries
    loadAchievementEntries(entries) {
        const container = document.getElementById('achievement-entries');
        if (!container) return;

        container.innerHTML = '';
        entries.forEach((entry, index) => {
            this.addAchievementEntry(entry, index);
        });
    }

    // Add education entry
    addEducationEntry(data = null, index = null) {
        const container = document.getElementById('education-entries');
        if (!container) return;

        const id = index !== null ? index : this.entryCounters.education++;
        const entry = document.createElement('div');
        entry.className = 'entry-item';
        entry.dataset.index = id;

        entry.innerHTML = `
            <div class="entry-item-header">
                <span class="entry-item-title">Education Entry</span>
                <button type="button" class="remove-entry-btn" data-entry-id="${id}">Remove</button>
            </div>
            <div class="form-group">
                <label>Institution</label>
                <input type="text" class="edu-institution" value="${data?.institution || ''}" placeholder="Arizona State University">
            </div>
            <div class="form-group">
                <label>Degree</label>
                <input type="text" class="edu-degree" value="${data?.degree || ''}" placeholder="M.S, Computer Engineering">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" class="edu-location" value="${data?.location || ''}" placeholder="Tempe, USA">
            </div>
            <div class="form-group">
                <label>Period</label>
                <input type="text" class="edu-period" value="${data?.period || ''}" placeholder="Aug '23 - May '25">
            </div>
        `;

        container.appendChild(entry);

        // Bind remove button
        const removeBtn = entry.querySelector('.remove-entry-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                entry.remove();
                this.updateData();
                this.updatePreview();
            });
        }

        // Bind input listeners
        entry.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateData();
                this.updatePreview();
            });
        });
    }

    // Add experience entry
    addExperienceEntry(data = null, index = null) {
        const container = document.getElementById('experience-entries');
        if (!container) return;

        const id = index !== null ? index : this.entryCounters.experience++;
        const entry = document.createElement('div');
        entry.className = 'entry-item';
        entry.dataset.index = id;

        entry.innerHTML = `
            <div class="entry-item-header">
                <span class="entry-item-title">Work Experience Entry</span>
                <button type="button" class="remove-entry-btn" data-entry-id="${id}">Remove</button>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="exp-title" value="${data?.title || ''}" placeholder="Software Engineer">
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" class="exp-company" value="${data?.company || ''}" placeholder="Fidelity Investments">
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" class="exp-location" value="${data?.location || ''}" placeholder="Chennai, India">
            </div>
            <div class="form-group">
                <label>Period</label>
                <input type="text" class="exp-period" value="${data?.period || ''}" placeholder="Apr '22 - Jul '23">
            </div>
            <div class="form-group">
                <label>Bullet Points</label>
                <div class="bullet-points" data-entry-id="${id}">
                    ${this.generateBulletPoints(data?.bullets || [], id, 'exp')}
                </div>
                <button type="button" class="add-bullet-btn" data-entry-id="${id}" data-type="exp">+ Add Bullet</button>
            </div>
        `;

        container.appendChild(entry);

        // Bind remove button
        const removeBtn = entry.querySelector('.remove-entry-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                entry.remove();
                this.updateData();
                this.updatePreview();
            });
        }

        // Bind input listeners
        entry.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateData();
                this.updatePreview();
            });
        });

        // Bind bullet point buttons
        this.bindBulletButtons(entry, id, 'exp');
        
        // Make bullets sortable
        setTimeout(() => {
            const bulletContainer = entry.querySelector('.bullet-points');
            if (bulletContainer) {
                this.makeSortable(bulletContainer);
            }
        }, 50);
    }

    // Add project entry
    addProjectEntry(data = null, index = null) {
        const container = document.getElementById('project-entries');
        if (!container) return;

        const id = index !== null ? index : this.entryCounters.project++;
        const entry = document.createElement('div');
        entry.className = 'entry-item';
        entry.dataset.index = id;

        entry.innerHTML = `
            <div class="entry-item-header">
                <span class="entry-item-title">Project Entry</span>
                <button type="button" class="remove-entry-btn" data-entry-id="${id}">Remove</button>
            </div>
            <div class="form-group">
                <label>Project Title</label>
                <input type="text" class="proj-title" value="${data?.title || ''}" placeholder="Compiler System for Deep Learning">
            </div>
            <div class="form-group">
                <label>Bullet Points</label>
                <div class="bullet-points" data-entry-id="${id}">
                    ${this.generateBulletPoints(data?.bullets || [], id, 'proj')}
                </div>
                <button type="button" class="add-bullet-btn" data-entry-id="${id}" data-type="proj">+ Add Bullet</button>
            </div>
        `;

        container.appendChild(entry);

        // Bind remove button
        const removeBtn = entry.querySelector('.remove-entry-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                entry.remove();
                this.updateData();
                this.updatePreview();
            });
        }

        // Bind input listeners
        entry.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateData();
                this.updatePreview();
            });
        });

        // Bind bullet point buttons
        this.bindBulletButtons(entry, id, 'proj');
        
        // Make bullets sortable
        setTimeout(() => {
            const bulletContainer = entry.querySelector('.bullet-points');
            if (bulletContainer) {
                this.makeSortable(bulletContainer);
            }
        }, 50);
    }

    // Add achievement entry
    addAchievementEntry(data = null, index = null) {
        const container = document.getElementById('achievement-entries');
        if (!container) return;

        const id = index !== null ? index : this.entryCounters.achievement++;
        const entry = document.createElement('div');
        entry.className = 'entry-item';
        entry.dataset.index = id;

        entry.innerHTML = `
            <div class="entry-item-header">
                <span class="entry-item-title">Achievement Entry</span>
                <button type="button" class="remove-entry-btn" data-entry-id="${id}">Remove</button>
            </div>
            <div class="form-group">
                <label>Achievement Text</label>
                <input type="text" class="ach-text" value="${data?.text || ''}" placeholder="Winner, 1st Place – Hackathon">
            </div>
            <div class="form-group">
                <label>Citation (optional)</label>
                <input type="text" class="ach-citation" value="${data?.citation || ''}" placeholder="DISML conference 2024">
            </div>
        `;

        container.appendChild(entry);

        // Bind remove button
        const removeBtn = entry.querySelector('.remove-entry-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                entry.remove();
                this.updateData();
                this.updatePreview();
            });
        }

        // Bind input listeners
        entry.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateData();
                this.updatePreview();
            });
        });
    }

    // Generate bullet points HTML
    generateBulletPoints(bullets, entryId, type) {
        if (!bullets || bullets.length === 0) {
            return '<textarea class="bullet-point" data-bullet-id="0" rows="2"></textarea><button type="button" class="remove-bullet-btn" data-bullet-id="0">Remove</button>';
        }

        return bullets.map((bullet, idx) => `
            <div class="bullet-point-item">
                <textarea class="bullet-point" data-bullet-id="${idx}" rows="2">${this.escapeHtml(bullet)}</textarea>
                <button type="button" class="remove-bullet-btn" data-bullet-id="${idx}">Remove</button>
            </div>
        `).join('');
    }

    // Bind bullet point buttons
    bindBulletButtons(entry, entryId, type) {
        const container = entry.querySelector('.bullet-points');
        const addBtn = entry.querySelector('.add-bullet-btn');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const bulletContainer = entry.querySelector('.bullet-points');
                const newBullet = document.createElement('div');
                newBullet.className = 'bullet-point-item';
                const bulletId = bulletContainer.querySelectorAll('.bullet-point').length;
                
                newBullet.innerHTML = `
                    <textarea class="bullet-point" data-bullet-id="${bulletId}" rows="2"></textarea>
                    <button type="button" class="remove-bullet-btn" data-bullet-id="${bulletId}">Remove</button>
                `;
                
                bulletContainer.appendChild(newBullet);

                // Bind remove button
                const removeBtn = newBullet.querySelector('.remove-bullet-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        newBullet.remove();
                        this.updateData();
                        this.updatePreview();
                    });
                }

                // Bind textarea
                const textarea = newBullet.querySelector('.bullet-point');
                if (textarea) {
                    textarea.addEventListener('input', () => {
                        this.updateData();
                        this.updatePreview();
                        this.saveCurrentBulletsToLibrary();
                    });
                }
            });
            
            // Reinitialize sortable after adding new bullet
            setTimeout(() => {
                const bulletContainer = entry.querySelector('.bullet-points');
                if (bulletContainer) {
                    this.makeSortable(bulletContainer);
                }
            }, 50);
        }

        // Bind existing remove buttons
        entry.querySelectorAll('.remove-bullet-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.bullet-point-item')?.remove();
                this.updateData();
                this.updatePreview();
            });
        });

        // Bind existing textareas
        entry.querySelectorAll('.bullet-point').forEach(textarea => {
            textarea.addEventListener('input', () => {
                this.updateData();
                this.updatePreview();
                this.saveCurrentBulletsToLibrary();
            });
        });
    }

    // Update data from form
    updateData() {
        const data = {
            personal: {
                name: this.getFieldValue('name'),
                email: this.getFieldValue('email'),
                linkedin: this.getFieldValue('linkedin'),
                github: this.getFieldValue('github'),
                portfolio: this.getFieldValue('portfolio')
            },
            skills: {
                programmingLanguages: this.getFieldValue('programming-languages'),
                mlSkills: this.getFieldValue('ml-skills'),
                cloudTech: this.getFieldValue('cloud-tech'),
                frameworks: this.getFieldValue('frameworks')
            },
            education: this.collectEducationEntries(),
            experience: this.collectExperienceEntries(),
            projects: this.collectProjectEntries(),
            achievements: this.collectAchievementEntries()
        };

        this.fileManager.updateVariantData(data);
        return data;
    }

    // Get field value helper
    getFieldValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }

    // Collect education entries
    collectEducationEntries() {
        const entries = [];
        document.querySelectorAll('#education-entries .entry-item').forEach(item => {
            entries.push({
                institution: item.querySelector('.edu-institution')?.value || '',
                degree: item.querySelector('.edu-degree')?.value || '',
                location: item.querySelector('.edu-location')?.value || '',
                period: item.querySelector('.edu-period')?.value || ''
            });
        });
        return entries;
    }

    // Collect experience entries
    collectExperienceEntries() {
        const entries = [];
        document.querySelectorAll('#experience-entries .entry-item').forEach(item => {
            const bullets = [];
            item.querySelectorAll('.bullet-point').forEach(textarea => {
                if (textarea.value.trim()) {
                    bullets.push(textarea.value.trim());
                }
            });
            entries.push({
                title: item.querySelector('.exp-title')?.value || '',
                company: item.querySelector('.exp-company')?.value || '',
                location: item.querySelector('.exp-location')?.value || '',
                period: item.querySelector('.exp-period')?.value || '',
                bullets: bullets
            });
        });
        return entries;
    }

    // Collect project entries
    collectProjectEntries() {
        const entries = [];
        document.querySelectorAll('#project-entries .entry-item').forEach(item => {
            const bullets = [];
            item.querySelectorAll('.bullet-point').forEach(textarea => {
                if (textarea.value.trim()) {
                    bullets.push(textarea.value.trim());
                }
            });
            entries.push({
                title: item.querySelector('.proj-title')?.value || '',
                bullets: bullets
            });
        });
        return entries;
    }

    // Collect achievement entries
    collectAchievementEntries() {
        const entries = [];
        document.querySelectorAll('#achievement-entries .entry-item').forEach(item => {
            entries.push({
                text: item.querySelector('.ach-text')?.value || '',
                citation: item.querySelector('.ach-citation')?.value || ''
            });
        });
        return entries;
    }

    // Update preview
    updatePreview() {
        const data = this.updateData();
        this.previewRenderer.renderFormatted(data);
    }

    // Save (already handled by updateData, but can add additional logic)
    save() {
        this.updateData();
        alert('Resume saved!');
    }

    // Export LaTeX
    exportLaTeX() {
        const data = this.updateData();
        const latex = this.templateEngine.generateLaTeX(data);
        const variantName = this.fileManager.currentVariant || 'resume';
        
        // Create download
        const blob = new Blob([latex], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = variantName.endsWith('.tex') ? variantName : `${variantName}.tex`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Compile PDF (placeholder - would need server-side compilation)
    compilePDF() {
        alert('PDF compilation requires server-side LaTeX processing. This feature will be implemented in a future update.');
    }

    // Import LaTeX (placeholder)
    importLaTeX() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.tex';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    const variantName = file.name;
                    this.fileManager.importFromLaTeX(content, variantName);
                    this.loadCurrentVariant();
                    alert('LaTeX file imported! (Manual editing may be required)');
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.Editor = Editor;

