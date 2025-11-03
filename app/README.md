# Resume Builder Web UI

A simple, form-based web application for creating and managing LaTeX resumes.

## Features

- **Form-Based Editor**: Structured forms for all resume sections
- **Multiple Resume Variants**: Create and manage different resume versions
- **Live Preview**: Real-time preview of your resume
- **LaTeX Export**: Export your resume as LaTeX files
- **Local Storage**: All data is saved locally in your browser

## Usage

### Opening the Application

Simply open `index.html` in your web browser. You can:

1. **Serve locally** using a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with http-server)
   npx http-server
   
   # Then navigate to http://localhost:8000/app/
   ```

2. **Or open directly** in a modern browser (some features may require a local server)

### Creating a Resume

1. Start by entering your **Personal Information** (name, email, links)
2. Add your **Education** entries
3. Fill in your **Skills and Certifications**
4. Add **Work Experience** entries with bullet points
5. Add **Projects** with descriptions
6. Add **Achievements and Publications**

### Managing Variants

- Click **"+ New Variant"** to create a new resume variant
- Click on a variant name in the sidebar to switch between variants
- Click the **×** button to delete a variant (requires at least one variant to remain)

### Exporting

- **Save**: Automatically saves to browser local storage
- **Export LaTeX**: Downloads the current resume as a `.tex` file
- **Compile PDF**: Placeholder for future PDF compilation feature
- **Import LaTeX**: Import existing LaTeX files (basic support)

## File Structure

```
app/
├── index.html          # Main HTML file
├── src/
│   ├── main.js        # Application initialization
│   ├── editor.js      # Form handling and data management
│   ├── fileManager.js # Resume variant management
│   ├── template.js    # LaTeX generation
│   ├── preview.js     # Live preview rendering
│   └── style.css      # Styling
└── README.md          # This file
```

## Data Storage

All resume data is stored in your browser's **localStorage** under the key `resume-builder-variants`. This means:

- Your data persists across browser sessions
- Data is stored locally on your device
- Each browser/device has its own separate data

## Future Features

- PDF compilation (requires server-side LaTeX processing)
- Template selection (different resume styles)
- Import/export JSON data
- Version history
- Cloud sync

## Browser Compatibility

Works best in modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Notes

- LaTeX export generates valid LaTeX files compatible with your existing workflow
- The preview shows a formatted version, not the exact LaTeX rendering
- For PDF compilation, you'll need to use external tools or a server endpoint (future implementation)

