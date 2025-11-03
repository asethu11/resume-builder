// Resume Parser - Parses DOCX and PDF files and extracts resume data

class ResumeParser {
    constructor() {
        // PDF.js will be loaded dynamically when needed
    }

    // Parse DOCX file
    async parseDOCX(file) {
        try {
            // Load mammoth from CDN if not already loaded
            if (typeof mammoth === 'undefined') {
                await this.loadMammothLibrary();
            }

            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Error parsing DOCX:', error);
            throw new Error('Failed to parse DOCX file: ' + error.message);
        }
    }

    // Load mammoth library from CDN
    loadMammothLibrary() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof mammoth !== 'undefined') {
                resolve();
                return;
            }

            // Check if script is already being loaded
            if (document.querySelector('script[data-mammoth]')) {
                // Wait for it to load
                const checkInterval = setInterval(() => {
                    if (typeof mammoth !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                return;
            }

            // Load mammoth from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            script.async = true;
            script.setAttribute('data-mammoth', 'true');
            
            script.onload = () => {
                if (typeof mammoth !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('Mammoth library failed to load'));
                }
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Mammoth library from CDN'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Parse PDF file
    async parsePDF(file) {
        try {
            // Load PDF.js from CDN if not already loaded
            if (typeof pdfjsLib === 'undefined') {
                // Load the script dynamically
                await this.loadPDFJSLibrary();
            }

            // Set up worker
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            
            // Extract text from all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            return fullText;
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error('Failed to parse PDF file: ' + error.message);
        }
    }

    // Load PDF.js library from CDN
    loadPDFJSLibrary() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (typeof pdfjsLib !== 'undefined') {
                resolve();
                return;
            }

            // Check if script is already being loaded
            if (document.querySelector('script[data-pdfjs]')) {
                // Wait for it to load
                const checkInterval = setInterval(() => {
                    if (typeof pdfjsLib !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                return;
            }

            // Load PDF.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.async = true;
            script.setAttribute('data-pdfjs', 'true');
            
            script.onload = () => {
                if (typeof pdfjsLib !== 'undefined') {
                    resolve();
                } else {
                    reject(new Error('PDF.js library failed to load'));
                }
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load PDF.js library from CDN'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Extract structured resume data from parsed text
    extractResumeData(parsedText) {
        const lines = parsedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const data = {
            personal: this.extractPersonalInfo(lines),
            education: this.extractEducation(lines),
            skills: this.extractSkills(lines),
            experience: this.extractExperience(lines),
            projects: this.extractProjects(lines),
            achievements: this.extractAchievements(lines)
        };
        
        return data;
    }

    // Extract personal information
    extractPersonalInfo(lines) {
        const personal = {
            name: '',
            email: '',
            linkedin: '',
            github: '',
            portfolio: ''
        };

        // Name is usually first substantial line (2+ words, capitalized)
        const nameLine = lines.find(line => {
            const words = line.split(/\s+/);
            return words.length >= 2 && words.length <= 4 && 
                   /^[A-Z]/.test(line) && 
                   !line.includes('@') && 
                   !line.includes('http');
        });
        if (nameLine) personal.name = nameLine;

        // Extract email
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        const emailLine = lines.find(line => emailRegex.test(line));
        if (emailLine) {
            personal.email = emailLine.match(emailRegex)[0];
        }

        // Extract URLs (LinkedIn, GitHub, Portfolio)
        lines.forEach(line => {
            if (line.includes('linkedin.com')) {
                const match = line.match(/https?:\/\/[^\s]+/);
                if (match) personal.linkedin = match[0];
            }
            if (line.includes('github.com')) {
                const match = line.match(/https?:\/\/[^\s]+/);
                if (match) personal.github = match[0];
            }
            if (line.includes('portfolio') || line.includes('website') || 
                (line.includes('http') && !line.includes('linkedin') && !line.includes('github'))) {
                const match = line.match(/https?:\/\/[^\s]+/);
                if (match && !personal.portfolio) personal.portfolio = match[0];
            }
        });

        return personal;
    }

    // Extract education entries
    extractEducation(lines) {
        const education = [];
        const educationKeywords = ['EDUCATION', 'Education', 'EDUCATIONAL BACKGROUND'];
        
        let inEducationSection = false;
        let currentEntry = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if we're entering education section
            if (educationKeywords.some(keyword => line.includes(keyword))) {
                inEducationSection = true;
                continue;
            }
            
            // Check if we're leaving education section (next major section)
            if (inEducationSection && this.isSectionHeader(line)) {
                if (currentEntry) education.push(currentEntry);
                break;
            }
            
            if (inEducationSection) {
                // Look for university/institution names (often contain "University", "College", etc.)
                if (line.match(/\b(University|College|Institute|School|Univ\.?)\b/i)) {
                    if (currentEntry) education.push(currentEntry);
                    currentEntry = {
                        institution: line,
                        degree: '',
                        location: '',
                        period: ''
                    };
                } else if (currentEntry) {
                    // Try to extract degree, location, period
                    if (!currentEntry.degree && line.length < 80) {
                        currentEntry.degree = line;
                    } else if (!currentEntry.period && this.looksLikePeriod(line)) {
                        currentEntry.period = line;
                    } else if (!currentEntry.location && line.length < 50) {
                        currentEntry.location = line;
                    }
                }
            }
        }
        
        if (currentEntry) education.push(currentEntry);
        return education;
    }

    // Extract skills
    extractSkills(lines) {
        const skills = {
            programmingLanguages: '',
            mlSkills: '',
            cloudTech: '',
            frameworks: ''
        };

        const skillsKeywords = ['SKILLS', 'Skills', 'TECHNICAL SKILLS', 'CERTIFICATIONS'];
        const programmingKeywords = ['Programming', 'Languages', 'Python', 'Java', 'JavaScript', 'C++', 'C#'];
        const mlKeywords = ['Machine Learning', 'ML', 'Data Science', 'Deep Learning', 'NLP', 'Computer Vision'];
        const cloudKeywords = ['AWS', 'Azure', 'GCP', 'Cloud', 'Docker', 'Kubernetes'];
        const frameworkKeywords = ['Framework', 'TensorFlow', 'PyTorch', 'React', 'Angular'];

        let inSkillsSection = false;
        let currentCategory = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (skillsKeywords.some(keyword => line.includes(keyword))) {
                inSkillsSection = true;
                continue;
            }

            if (inSkillsSection && this.isSectionHeader(line) && !skillsKeywords.some(k => line.includes(k))) {
                break;
            }

            if (inSkillsSection) {
                // Categorize skills
                if (programmingKeywords.some(k => line.includes(k))) {
                    skills.programmingLanguages = this.extractSkillList(line);
                } else if (mlKeywords.some(k => line.includes(k))) {
                    skills.mlSkills = this.extractSkillList(line);
                } else if (cloudKeywords.some(k => line.includes(k))) {
                    skills.cloudTech = this.extractSkillList(line);
                } else if (frameworkKeywords.some(k => line.includes(k))) {
                    skills.frameworks = this.extractSkillList(line);
                } else if (line.includes(':') && !currentCategory) {
                    // Generic skill line with colon
                    const [category, items] = line.split(':');
                    if (programmingKeywords.some(k => category.includes(k))) {
                        skills.programmingLanguages = items.trim();
                    } else if (mlKeywords.some(k => category.includes(k))) {
                        skills.mlSkills = items.trim();
                    } else if (cloudKeywords.some(k => category.includes(k))) {
                        skills.cloudTech = items.trim();
                    } else if (frameworkKeywords.some(k => category.includes(k))) {
                        skills.frameworks = items.trim();
                    }
                }
            }
        }

        return skills;
    }

    // Extract work experience
    extractExperience(lines) {
        const experience = [];
        const expKeywords = ['EXPERIENCE', 'Experience', 'WORK EXPERIENCE', 'EMPLOYMENT'];
        
        let inExpSection = false;
        let currentEntry = null;
        let currentBullets = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (expKeywords.some(keyword => line.includes(keyword))) {
                inExpSection = true;
                continue;
            }
            
            if (inExpSection && this.isSectionHeader(line) && !expKeywords.some(k => line.includes(k))) {
                if (currentEntry) {
                    currentEntry.bullets = currentBullets;
                    experience.push(currentEntry);
                }
                break;
            }
            
            if (inExpSection) {
                // Look for job title patterns (usually has company name and location)
                if (this.looksLikeJobTitle(line)) {
                    if (currentEntry) {
                        currentEntry.bullets = currentBullets;
                        experience.push(currentEntry);
                    }
                    
                    // Parse title, company, location, period
                    const parsed = this.parseJobLine(line);
                    currentEntry = {
                        title: parsed.title || '',
                        company: parsed.company || '',
                        location: parsed.location || '',
                        period: parsed.period || '',
                        bullets: []
                    };
                    currentBullets = [];
                } else if (currentEntry) {
                    // Check if it's a bullet point (starts with •, -, *, or is indented)
                    if (this.looksLikeBullet(line)) {
                        currentBullets.push(this.cleanBullet(line));
                    } else if (line.length > 20 && line.length < 200) {
                        // Might be a continuation or bullet without marker
                        currentBullets.push(line);
                    }
                }
            }
        }
        
        if (currentEntry) {
            currentEntry.bullets = currentBullets;
            experience.push(currentEntry);
        }
        
        return experience;
    }

    // Extract projects
    extractProjects(lines) {
        const projects = [];
        const projectKeywords = ['PROJECTS', 'Projects', 'PROJECT'];
        
        let inProjectSection = false;
        let currentProject = null;
        let currentBullets = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (projectKeywords.some(keyword => line.includes(keyword))) {
                inProjectSection = true;
                continue;
            }
            
            if (inProjectSection && this.isSectionHeader(line) && !projectKeywords.some(k => line.includes(k))) {
                if (currentProject) {
                    currentProject.bullets = currentBullets;
                    projects.push(currentProject);
                }
                break;
            }
            
            if (inProjectSection) {
                // Project titles are usually standalone lines, capitalized
                if (line.length > 10 && line.length < 80 && /^[A-Z]/.test(line) && !line.includes('•') && !line.includes('-')) {
                    if (currentProject) {
                        currentProject.bullets = currentBullets;
                        projects.push(currentProject);
                    }
                    currentProject = {
                        title: line,
                        bullets: []
                    };
                    currentBullets = [];
                } else if (currentProject && this.looksLikeBullet(line)) {
                    currentBullets.push(this.cleanBullet(line));
                }
            }
        }
        
        if (currentProject) {
            currentProject.bullets = currentBullets;
            projects.push(currentProject);
        }
        
        return projects;
    }

    // Extract achievements
    extractAchievements(lines) {
        const achievements = [];
        const achKeywords = ['ACHIEVEMENT', 'Achievement', 'AWARDS', 'PUBLICATIONS', 'Publications'];
        
        let inAchSection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (achKeywords.some(keyword => line.includes(keyword))) {
                inAchSection = true;
                continue;
            }
            
            if (inAchSection && this.isSectionHeader(line) && !achKeywords.some(k => line.includes(k))) {
                break;
            }
            
            if (inAchSection && (this.looksLikeBullet(line) || line.length > 10)) {
                const cleaned = this.cleanBullet(line);
                if (cleaned.length > 10) {
                    achievements.push({
                        text: cleaned,
                        citation: ''
                    });
                }
            }
        }
        
        return achievements;
    }

    // Helper methods
    isSectionHeader(line) {
        // Section headers are usually ALL CAPS, short, or contain common section keywords
        const sectionKeywords = ['EDUCATION', 'EXPERIENCE', 'PROJECTS', 'SKILLS', 'ACHIEVEMENT', 'EDUCATION'];
        return line.length < 30 && (
            line === line.toUpperCase() ||
            sectionKeywords.some(k => line.toUpperCase().includes(k))
        );
    }

    looksLikePeriod(line) {
        // Periods like "Jan 2020 - Dec 2022" or "2020-2022"
        return /\d{4}/.test(line) || 
               /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(line) ||
               /Present|Current/i.test(line);
    }

    looksLikeJobTitle(line) {
        // Job titles usually have company, location, and period
        return (line.includes(',') || line.includes('•')) && 
               (this.looksLikePeriod(line) || line.length > 30);
    }

    parseJobLine(line) {
        // Try to extract: Title, Company, Location, Period
        // Format examples:
        // "Software Engineer, Company Name, Location | Period"
        // "Title • Company • Location • Period"
        
        const parts = line.split(/[,\|\•]/).map(p => p.trim()).filter(p => p);
        const result = { title: '', company: '', location: '', period: '' };
        
        if (parts.length >= 2) {
            result.title = parts[0];
            result.company = parts[1];
            
            // Last part is usually period if it looks like one
            if (parts.length >= 3 && this.looksLikePeriod(parts[parts.length - 1])) {
                result.period = parts[parts.length - 1];
                if (parts.length >= 4) {
                    result.location = parts[parts.length - 2];
                }
            } else if (parts.length >= 3) {
                result.location = parts[2];
            }
            
            if (parts.length >= 4 && this.looksLikePeriod(parts[3])) {
                result.period = parts[3];
            }
        }
        
        return result;
    }

    looksLikeBullet(line) {
        return /^[•\-\*▪▫]\s/.test(line) || 
               /^\d+\.\s/.test(line) ||
               line.trim().startsWith('-');
    }

    cleanBullet(line) {
        return line.replace(/^[•\-\*▪▫]\s*/, '')
                   .replace(/^\d+\.\s*/, '')
                   .trim();
    }

    extractSkillList(line) {
        // Extract skills after colon or from list
        if (line.includes(':')) {
            return line.split(':')[1].trim();
        }
        return line.trim();
    }
}

window.ResumeParser = ResumeParser;

