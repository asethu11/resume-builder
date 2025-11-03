// Preview Renderer - Displays LaTeX preview

class PreviewRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.templateEngine = new TemplateEngine();
    }

    // Render preview from resume data
    render(data) {
        if (!this.container) return;

        // Generate LaTeX
        const latex = this.templateEngine.generateLaTeX(data);
        
        // Create preview element
        const previewElement = document.createElement('pre');
        previewElement.className = 'latex-preview';
        previewElement.textContent = latex;
        
        // Clear and update
        this.container.innerHTML = '';
        this.container.appendChild(previewElement);
    }

    // Render formatted preview (simpler version without full LaTeX)
    renderFormatted(data) {
        if (!this.container) return;

        let html = '<div class="resume-preview">';

        // Personal Information
        if (data.personal && data.personal.name) {
            html += `<div class="preview-section preview-personal">
                <h1>${this.escapeHtml(data.personal.name)}</h1>
                <div class="preview-contact">`;
            if (data.personal.email) {
                html += `<span>${this.escapeHtml(data.personal.email)}</span>`;
            }
            html += '</div><div class="preview-links">';
            if (data.personal.linkedin) {
                html += `<a href="${this.escapeHtml(data.personal.linkedin)}">LinkedIn</a>`;
            }
            if (data.personal.github) {
                html += `<a href="${this.escapeHtml(data.personal.github)}">GitHub</a>`;
            }
            if (data.personal.portfolio) {
                html += `<a href="${this.escapeHtml(data.personal.portfolio)}">Portfolio</a>`;
            }
            html += '</div></div>';
        }

        // Education
        if (data.education && data.education.length > 0) {
            html += '<div class="preview-section"><h2>EDUCATION</h2>';
            data.education.forEach(edu => {
                const location = edu.location ? `, ${this.escapeHtml(edu.location)}` : '';
                html += `<div class="preview-entry">
                    <strong>${this.escapeHtml(edu.institution || '')}</strong>, <em>${this.escapeHtml(edu.degree || '')}</em>${location}
                    <span class="preview-period">${this.escapeHtml(edu.period || '')}</span>
                </div>`;
            });
            html += '</div>';
        }

        // Skills
        if (data.skills) {
            html += '<div class="preview-section"><h2>SKILLS AND CERTIFICATIONS</h2><ul>';
            if (data.skills.programmingLanguages) {
                html += `<li><strong>Programming Languages:</strong> ${this.escapeHtml(data.skills.programmingLanguages)}</li>`;
            }
            if (data.skills.mlSkills) {
                html += `<li><strong>Machine Learning and Data Science:</strong> ${this.escapeHtml(data.skills.mlSkills)}</li>`;
            }
            if (data.skills.cloudTech) {
                html += `<li><strong>Cloud Technologies:</strong> ${this.escapeHtml(data.skills.cloudTech)}</li>`;
            }
            if (data.skills.frameworks) {
                html += `<li><strong>Frameworks and Tools:</strong> ${this.escapeHtml(data.skills.frameworks)}</li>`;
            }
            html += '</ul></div>';
        }

        // Experience
        if (data.experience && data.experience.length > 0) {
            html += '<div class="preview-section"><h2>WORK EXPERIENCE</h2>';
            data.experience.forEach(exp => {
                html += `<div class="preview-entry">
                    <strong>${this.escapeHtml(exp.title || '')}, ${this.escapeHtml(exp.company || '')}</strong>, ${this.escapeHtml(exp.location || '')}
                    <span class="preview-period">${this.escapeHtml(exp.period || '')}</span>
                    <ul>`;
                (exp.bullets || []).forEach(bullet => {
                    html += `<li>${this.escapeHtml(bullet)}</li>`;
                });
                html += `</ul></div>`;
            });
            html += '</div>';
        }

        // Projects
        if (data.projects && data.projects.length > 0) {
            html += '<div class="preview-section"><h2>PROJECTS</h2>';
            data.projects.forEach(project => {
                html += `<div class="preview-entry">
                    <strong>${this.escapeHtml(project.title || '')}</strong>
                    <ul>`;
                (project.bullets || []).forEach(bullet => {
                    html += `<li>${this.escapeHtml(bullet)}</li>`;
                });
                html += `</ul></div>`;
            });
            html += '</div>';
        }

        // Achievements
        if (data.achievements && data.achievements.length > 0) {
            html += '<div class="preview-section"><h2>ACHIEVEMENTS AND PUBLICATIONS</h2><ul>';
            data.achievements.forEach(achievement => {
                html += `<li><strong>${this.escapeHtml(achievement.text || '')}</strong>`;
                if (achievement.citation) {
                    html += ` <em>${this.escapeHtml(achievement.citation)}</em>`;
                }
                html += '</li>';
            });
            html += '</ul></div>';
        }

        html += '</div>';
        
        this.container.innerHTML = html;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toggle between LaTeX and formatted preview
    togglePreviewMode(mode = 'latex') {
        // This can be extended to switch between preview modes
        return mode;
    }
}

window.PreviewRenderer = PreviewRenderer;

