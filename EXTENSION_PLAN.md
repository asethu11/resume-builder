# Resume Rewriter Extension Plan

## Overview

This document outlines how to extend the existing resume builder codebase to add resume rewriter functionality with document parsing (DOCX/PDF), bullet variant management, and drag-and-drop editing.

## Current Architecture

The existing codebase has:
- `fileManager.js` - Handles resume variants and localStorage
- `editor.js` - Form-based editor with data binding
- `template.js` - LaTeX generation from structured data
- `preview.js` - Live preview rendering
- `main.js` - Application initialization and coordination

## Extension Strategy

### Phase 1: File Upload and Parsing

#### New File: `app/src/parser.js`

Create a new parser module to handle DOCX and PDF file parsing:

```javascript
class ResumeParser {
    constructor() {
        // Initialize parsing libraries
    }

    async parseDOCX(file) {
        // Use mammoth.js to extract text from DOCX
        // Return structured text
    }

    async parsePDF(file) {
        // Use pdf.js to extract text from PDF
        // Return structured text
    }

    extractResumeData(parsedText) {
        // Parse text into structured resume data
        // Match existing data structure from fileManager.getDefaultResumeData()
        // Extract:
        // - Personal information (name, email, links)
        // - Education entries
        // - Work experience with bullets
        // - Skills
        // - Projects
        // - Achievements
    }
}
```

**Dependencies to add:**
- `mammoth` - For DOCX parsing
- `pdfjs-dist` - For PDF parsing (or `pdf-parse`)

#### Update: `app/src/fileManager.js`

Extend the `FileManager` class to support bullet library:

```javascript
// Add to FileManager class:
constructor() {
    // ... existing code ...
    this.bulletLibrary = new Map(); // Store all bullet variants
    this.bulletLibraryKey = 'resume-builder-bullet-library';
    this.loadBulletLibrary();
}

loadBulletLibrary() {
    const stored = localStorage.getItem(this.bulletLibraryKey);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            this.bulletLibrary = new Map(data);
        } catch (e) {
            console.error('Error loading bullet library:', e);
        }
    }
}

saveBulletLibrary() {
    const data = Array.from(this.bulletLibrary.entries());
    localStorage.setItem(this.bulletLibraryKey, JSON.stringify(data));
}

saveBullet(bulletId, bulletData) {
    if (!this.bulletLibrary.has(bulletId)) {
        this.bulletLibrary.set(bulletId, {
            text: bulletData.text,
            variants: [bulletData.text],
            history: [{ text: bulletData.text, timestamp: Date.now() }],
            section: bulletData.section,
            entryId: bulletData.entryId
        });
    } else {
        const bullet = this.bulletLibrary.get(bulletId);
        if (!bullet.variants.includes(bulletData.text)) {
            bullet.variants.push(bulletData.text);
            bullet.history.push({
                text: bulletData.text,
                timestamp: Date.now()
            });
            bullet.currentText = bulletData.text;
        }
    }
    this.saveBulletLibrary();
}

getBulletVariants(bulletId) {
    return this.bulletLibrary.get(bulletId)?.variants || [];
}

getAllBullets() {
    return Array.from(this.bulletLibrary.values());
}
```

### Phase 2: Drag-and-Drop Functionality

#### Update: `app/src/editor.js`

Add drag-and-drop capabilities to existing bullet lists:

```javascript
// Add to Editor class:
init() {
    // ... existing init code ...
    this.initializeDragAndDrop();
}

initializeDragAndDrop() {
    // Make all bullet lists sortable
    // Use HTML5 Drag API or SortableJS library
    document.querySelectorAll('.bullet-points').forEach(container => {
        this.makeSortable(container);
    });
}

makeSortable(container) {
    // Implementation using SortableJS or native HTML5 Drag API
    // Allow reordering bullets within the container
    // Update data when order changes
}

handleBulletReorder(newOrder) {
    // Update resume data with new bullet order
    this.updateData();
    this.updatePreview();
}

editBulletInline(bulletElement) {
    // Allow inline editing of bullet text
    // Save to bullet library when edited
}

saveBulletToLibrary(bullet) {
    // Save bullet variant to library
    const bulletId = this.generateBulletId(bullet);
    this.fileManager.saveBullet(bulletId, {
        text: bullet.text,
        section: bullet.section,
        entryId: bullet.entryId
    });
}
```

**Dependencies to add:**
- `sortablejs` - Lightweight drag-and-drop library (optional, can use native HTML5)

#### Update: `app/index.html`

Add file upload interface at the top of the page:

```html
<!-- Add before main editor area -->
<div class="upload-area" id="upload-area">
    <h3>Upload Resume</h3>
    <input type="file" id="resume-upload" accept=".docx,.pdf" />
    <p>Drag and drop your resume file (DOCX or PDF) or click to browse</p>
</div>
```

Add data attributes for drag-and-drop to bullet containers:

```html
<!-- Update bullet-points containers -->
<div class="bullet-points" 
     data-entry-id="${id}" 
     data-sortable="true">
    <!-- bullets -->
</div>
```

#### Update: `app/src/main.js`

Add file upload handling:

```javascript
// Add to ResumeBuilderApp class:
init() {
    // ... existing init code ...
    this.setupFileUpload();
}

setupFileUpload() {
    const uploadInput = document.getElementById('resume-upload');
    const uploadArea = document.getElementById('upload-area');
    
    if (uploadInput) {
        uploadInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });
    }
    
    // Drag and drop support
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
    }
}

async handleFileUpload(file) {
    if (!file) return;
    
    const parser = new ResumeParser();
    let parsedData;
    
    try {
        if (file.name.endsWith('.docx')) {
            parsedData = await parser.parseDOCX(file);
        } else if (file.name.endsWith('.pdf')) {
            parsedData = await parser.parsePDF(file);
        } else {
            alert('Please upload a DOCX or PDF file');
            return;
        }
        
        // Extract structured data
        const resumeData = parser.extractResumeData(parsedData);
        
        // Create new variant or update current
        const variantName = file.name.replace(/\.(docx|pdf)$/, '.tex');
        this.fileManager.createVariant(variantName);
        this.fileManager.updateVariantData(resumeData);
        
        // Load into editor
        this.editor.loadCurrentVariant();
        
        // Save all bullets to library
        this.saveBulletsToLibrary(resumeData);
        
        alert('Resume parsed successfully! Review and edit the extracted content.');
    } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please try again.');
    }
}

saveBulletsToLibrary(resumeData) {
    // Extract all bullets and save to library
    resumeData.experience?.forEach(exp => {
        exp.bullets?.forEach(bullet => {
            this.editor.saveBulletToLibrary({
                text: bullet,
                section: 'experience',
                entryId: exp.id
            });
        });
    });
    
    resumeData.projects?.forEach(proj => {
        proj.bullets?.forEach(bullet => {
            this.editor.saveBulletToLibrary({
                text: bullet,
                section: 'projects',
                entryId: proj.id
            });
        });
    });
}
```

### Phase 3: Update UI for Drag-and-Drop Focus

#### Update: `app/src/style.css`

Add drag-and-drop styles:

```css
/* Drag and Drop Styles */
.bullet-points[data-sortable="true"] {
    min-height: 50px;
}

.bullet-point-item {
    cursor: move;
    padding: 10px;
    margin-bottom: 10px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    transition: all 0.2s;
}

.bullet-point-item:hover {
    border-color: #3498db;
    box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.bullet-point-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

.bullet-point-item.drag-over {
    border-color: #3498db;
    background-color: #ebf5fb;
}

.upload-area {
    padding: 40px;
    text-align: center;
    border: 2px dashed #ddd;
    border-radius: 8px;
    margin-bottom: 20px;
    background-color: #fafafa;
    transition: all 0.2s;
}

.upload-area.drag-over {
    border-color: #3498db;
    background-color: #ebf5fb;
}

.upload-area input[type="file"] {
    display: none;
}

.upload-area label {
    cursor: pointer;
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border-radius: 4px;
    display: inline-block;
}
```

## Migration Path

### Step 1: Add Dependencies

```bash
npm install mammoth pdfjs-dist sortablejs
```

### Step 2: Create Parser Module

- Create `app/src/parser.js` with ResumeParser class
- Implement DOCX and PDF parsing
- Implement text extraction logic

### Step 3: Extend File Manager

- Add bullet library storage to `fileManager.js`
- Add methods for bullet variant management

### Step 4: Add File Upload UI

- Update `index.html` with upload area
- Add upload handling in `main.js`

### Step 5: Add Drag-and-Drop

- Add SortableJS or native HTML5 drag-and-drop
- Update `editor.js` with drag handlers
- Update bullet containers with sortable attributes

### Step 6: Update Styling

- Add drag-and-drop CSS
- Add upload area styling

### Step 7: Test and Refine

- Test with various DOCX/PDF formats
- Refine parsing logic
- Improve bullet extraction accuracy

## Data Flow

```
User uploads DOCX/PDF
    ↓
Parser extracts text
    ↓
Structured data extraction
    ↓
Populate resume variant
    ↓
Load into editor (bullets are now drag-and-drop)
    ↓
User reorders/edits bullets
    ↓
Bullets saved to library (variants tracked)
    ↓
User clicks download
    ↓
LaTeX generated and downloaded
```

## Existing Code Reuse

### ✅ Keep As-Is:
- `template.js` - LaTeX generation works perfectly
- `preview.js` - Preview rendering works correctly
- Core data structure in `fileManager.getDefaultResumeData()`

### 🔧 Extend:
- `fileManager.js` - Add bullet library
- `editor.js` - Add drag-and-drop and bullet management
- `main.js` - Add file upload handling

### ➕ New:
- `parser.js` - Document parsing module

## Benefits of This Approach

1. **Incremental**: Builds on existing code, doesn't require full rewrite
2. **Backward Compatible**: Existing form-based editor still works
3. **Modular**: Parser is separate module, easy to test and improve
4. **Extensible**: Bullet library can be enhanced with AI suggestions, templates, etc.

## Future Enhancements

- AI-powered bullet suggestions based on bullet library
- Template bullets from library
- Bullet similarity matching
- Export bullet library as JSON
- Import bullet library from backup
- Bullet analytics (most used, best performing, etc.)

