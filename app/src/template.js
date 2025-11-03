// Template Engine - Converts resume data to LaTeX

class TemplateEngine {
    constructor() {
        this.escapeLaTeX = this.escapeLaTeX.bind(this);
    }

    // Escape special LaTeX characters
    escapeLaTeX(text) {
        if (!text) return '';
        return String(text)
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\$/g, '\\$')
            .replace(/\&/g, '\\&')
            .replace(/%/g, '\\%')
            .replace(/\#/g, '\\#')
            .replace(/\^/g, '\\textasciicircum{}')
            .replace(/\_/g, '\\_')
            .replace(/\~/g, '\\textasciitilde{}');
    }

    // Generate full LaTeX document
    generateLaTeX(data) {
        const header = this.getLaTeXHeader();
        const personal = this.generatePersonal(data.personal);
        const education = this.generateEducation(data.education);
        const skills = this.generateSkills(data.skills);
        const experience = this.generateExperience(data.experience);
        const projects = this.generateProjects(data.projects);
        const achievements = this.generateAchievements(data.achievements);
        const footer = this.getLaTeXFooter();

        return header + personal + education + skills + experience + projects + achievements + footer;
    }

    // LaTeX document header
    getLaTeXHeader() {
        return `\\documentclass[10pt,a4]{article}

\\usepackage[a4paper, portrait, margin=1cm]{geometry}
\\usepackage{setspace}
\\usepackage{tabu}
\\usepackage{multirow}
\\usepackage{color}
\\usepackage{hyphenat}
\\usepackage[hidelinks]{hyperref}
\\usepackage{textcomp}
\\usepackage{enumitem}
\\usepackage{tabto}
\\usepackage{gensymb}

\\renewcommand{\\labelitemi}{\\textendash}

\\def\\hrulefill{\\leavevmode\\leaders\\hrule height 1pt\\hfill\\kern0pt}

\\usepackage[T1]{fontenc}
\\usepackage{mathptmx}
\\setlist{nosep}

\\begin{document}
{\\fontfamily{ptm}\\selectfont
	\\renewcommand{\\familydefault}{\\sfdefault}
	\\pagenumbering{gobble}
`;
    }

    // LaTeX document footer
    getLaTeXFooter() {
        return `}
	
\\end{document}`;
    }

    // Generate personal information section
    generatePersonal(personal) {
        if (!personal || !personal.name) return '';

        const email = personal.email ? `\\textcolor{blue} {\\href{mailto:${this.escapeLaTeX(personal.email)}}{${this.escapeLaTeX(personal.email)}}}` : '';
        const linkedin = personal.linkedin ? `\\href{${this.escapeLaTeX(personal.linkedin)}}{\\textcolor{blue}{Linkedin}}` : '';
        const github = personal.github ? `\\href{${this.escapeLaTeX(personal.github)}}{\\textcolor{blue}{Github}}` : '';
        const portfolio = personal.portfolio ? `\\href{${this.escapeLaTeX(personal.portfolio)}}{\\textcolor{blue}{Portfolio}}` : '';

        let links = [];
        if (linkedin) links.push(`\\raggedright${linkedin}`);
        if (github) links.push(`\\centering${github}`);
        if (portfolio) links.push(`\\raggedleft${portfolio}`);

        let linksRow = '';
        if (links.length > 0) {
            const colCount = links.length;
            const colWidth = colCount === 3 ? '0.2\\textwidth' : colCount === 2 ? '0.3\\textwidth' : '0.4\\textwidth';
            const colDefs = Array(colCount).fill(`p{${colWidth}}`).join('@{\\hspace{5pt}}');
            linksRow = `
    \\hspace*{85pt}
    \\begin{tabular}{@{}${colDefs}@{}}
        ${links.join(' &\n        ')}
    \\end{tabular}
    \\hspace*{50pt}`;
        }

        return `
% Personal Details
	\\noindent
	\\begin{tabu} to \\textwidth {X[l] X[c] X[r]}
		  &  \\multirow{2}{*}{{\\textbf{\\Large ${this.escapeLaTeX(personal.name)}}}}  &   		\\\\
		 &	&   ${email ? email + '\\\\' : ''}
	\\end{tabu}
${linksRow}
	\\vspace{-2mm}
`;
    }

    // Generate education section
    generateEducation(education) {
        if (!education || education.length === 0) return '';

        let entries = education.map(edu => {
            const degree = this.escapeLaTeX(edu.degree || '');
            const institution = this.escapeLaTeX(edu.institution || '');
            const location = this.escapeLaTeX(edu.location || '');
            const period = this.escapeLaTeX(edu.period || '');
            const locationText = location ? `, ${location}` : '';
            
            return `    \\hspace{1.5mm} \\textbf{\\large ${institution}}, \\textit{${degree}}${locationText}  \\hfill \\textit{${period}}	\\\\`;
        }).join('\n\n');

        return `
% Education
\\vspace{0.25mm}
\\begin{flushleft}
	{\\Large \\textbf{EDUCATION}}
    
${entries}

\\end{flushleft}
`;
    }

    // Generate skills section
    generateSkills(skills) {
        if (!skills) return '';

        const sections = [];
        if (skills.programmingLanguages) {
            sections.push(`            \\hspace{0.5cm}  \\textbf{Programming Languages:} ${this.escapeLaTeX(skills.programmingLanguages)}. \\\\`);
        }
        if (skills.mlSkills) {
            sections.push(`            \\hspace{0.5cm}  \\textbf{Machine Learning and Data Science:} ${this.escapeLaTeX(skills.mlSkills)}. \\\\`);
        }
        if (skills.cloudTech) {
            sections.push(`            \\hspace{0.5cm}  \\textbf{Cloud Technologies} ${this.escapeLaTeX(skills.cloudTech)}. \\\\`);
        }
        if (skills.frameworks) {
            sections.push(`            \\hspace{0.5cm}  \\textbf{Frameworks and Tools:} ${this.escapeLaTeX(skills.frameworks)}. \\\\`);
        }

        if (sections.length === 0) return '';

        return `
\\begin{flushleft}
    {\\Large \\textbf {SKILLS AND CERTIFICATIONS}}
    
        \\vspace{1mm}
${sections.join('\n')}
        
\\end{flushleft}
`;
    }

    // Generate work experience section
    generateExperience(experience) {
        if (!experience || experience.length === 0) return '';

        let entries = experience.map(exp => {
            const title = this.escapeLaTeX(exp.title || '');
            const company = this.escapeLaTeX(exp.company || '');
            const location = this.escapeLaTeX(exp.location || '');
            const period = this.escapeLaTeX(exp.period || '');
            const bullets = this.generateBullets(exp.bullets || []);

            return `    \\hspace{1.5mm} \\textbf{\\large ${title}, ${company}},  ${location} \\hfill \\textit{\\large ${period}}	\\\\
    ${bullets}`;
        }).join('\n\n    \\vspace{0.5mm}\n');

        return `
% Work Experience
\\begin{flushleft}
    {\\Large \\textbf{WORK EXPERIENCE}}

    \\vspace{1.5mm}
${entries}

\\end{flushleft}
`;
    }

    // Generate projects section
    generateProjects(projects) {
        if (!projects || projects.length === 0) return '';

        let entries = projects.map(project => {
            const title = this.escapeLaTeX(project.title || '');
            const bullets = this.generateBullets(project.bullets || []);

            return `        \\item \\hspace{1.5mm} \\textbf{\\large ${title}}
        ${bullets}`;
        }).join('\n\n');

        return `
\\begin{flushleft}
    {\\Large \\textbf{PROJECTS}}
        \\vspace{0.5mm}
${entries}

\\end{flushleft}
`;
    }

    // Generate achievements section
    generateAchievements(achievements) {
        if (!achievements || achievements.length === 0) return '';

        let entries = achievements.map(achievement => {
            const text = this.escapeLaTeX(achievement.text || '');
            const citation = achievement.citation ? ` \\hfill \\textit{${this.escapeLaTeX(achievement.citation)}}` : '';
            return `            \\item \\textbf{${text}}${citation}`;
        }).join('\n');

        return `
\\begin{flushleft}
    {\\Large \\textbf{ACHIEVEMENTS AND PUBLICATIONS}}
      \\vspace{1.0mm}
      \\begin{itemize}
${entries}
      \\end{itemize}
\\end{flushleft}
`;
    }

    // Generate bullet points
    generateBullets(bullets) {
        if (!bullets || bullets.length === 0) return '';

        const bulletItems = bullets.map(bullet => {
            // Escape but preserve LaTeX formatting commands if needed
            const escaped = this.escapeLaTeX(bullet);
            return `        \\item ${escaped}`;
        }).join('\n');

        return `\\begin{itemize}
${bulletItems}
    \\end{itemize}`;
    }
}

window.TemplateEngine = TemplateEngine;

