/**
 * CV Parser Utility
 * Extracts information from CV documents (PDF, DOCX)
 * Uses open-source libraries (no external API calls)
 * NO "AI" terminology in user-facing features
 */

const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const compromise = require('compromise');
const fs = require('fs').promises;

/**
 * Parse CV file and extract structured data
 * @param {string} filePath - Path to CV file
 * @param {string} fileType - File extension (pdf, docx)
 * @returns {Object} Parsed CV data
 */
async function parseCV(filePath, fileType) {
  try {
    // Extract text from file
    let text = '';

    if (fileType === 'pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      text = pdfData.text;
    } else if (fileType === 'docx' || fileType === 'doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    // Parse structured data
    const parsedData = {
      raw_text: text,
      contact: extractContact(text),
      skills: extractSkills(text),
      education: extractEducation(text),
      work_history: extractWorkHistory(text),
      summary: generateSummary(text),
      tags: generateTags(text),
      years_experience: estimateExperience(text)
    };

    return parsedData;
  } catch (error) {
    console.error('Error parsing CV:', error);
    return {
      error: error.message,
      raw_text: null
    };
  }
}

/**
 * Extract contact information (email, phone)
 */
function extractContact(text) {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const phoneRegex = /(\+?[0-9]{1,4}[\s-]?)?(\(?[0-9]{3}\)?[\s-]?)?[0-9]{3}[\s-]?[0-9]{4}/g;

  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];

  return {
    email: emails[0] || null,
    phone: phones[0] || null
  };
}

/**
 * Extract skills from CV text
 * Common HR, Finance, IT, Operations skills
 */
function extractSkills(text) {
  const skillKeywords = {
    hr: ['recruitment', 'hr', 'human resources', 'talent acquisition', 'payroll', 'cipd', 'shrm', 'employee relations', 'onboarding', 'performance management', 'labor law', 'compensation', 'benefits'],
    finance: ['accounting', 'finance', 'quickbooks', 'excel', 'financial reporting', 'budgeting', 'audit', 'tax', 'accounts payable', 'accounts receivable', 'reconciliation', 'erp', 'sap', 'oracle'],
    it: ['javascript', 'python', 'java', 'sql', 'database', 'react', 'node', 'aws', 'cloud', 'linux', 'networking', 'cybersecurity', 'devops'],
    operations: ['logistics', 'supply chain', 'warehouse', 'inventory', 'procurement', 'vendor management', 'process improvement', 'project management', 'lean', 'six sigma'],
    general: ['microsoft office', 'communication', 'leadership', 'team management', 'problem solving', 'analytical', 'customer service', 'time management']
  };

  const foundSkills = [];
  const lowerText = text.toLowerCase();

  Object.values(skillKeywords).flat().forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return [...new Set(foundSkills)]; // Remove duplicates
}

/**
 * Extract education details
 */
function extractEducation(text) {
  const educationKeywords = ['bachelor', 'master', 'mba', 'phd', 'diploma', 'degree', 'university', 'college', 'bsc', 'ba', 'msc', 'ma'];
  const certificationKeywords = ['cipd', 'shrm', 'cpa', 'cfa', 'pmp', 'certified', 'certification'];

  const education = [];
  const lines = text.split('\n');

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    const hasEducation = educationKeywords.some(keyword => lowerLine.includes(keyword));
    const hasCertification = certificationKeywords.some(keyword => lowerLine.includes(keyword));

    if (hasEducation || hasCertification) {
      education.push(line.trim());
    }
  });

  return education.filter(edu => edu.length > 10).slice(0, 5); // Max 5 entries
}

/**
 * Extract work history
 * Looks for company names, job titles, dates
 */
function extractWorkHistory(text) {
  const doc = compromise(text);

  // Extract organizations (likely companies)
  const organizations = doc.organizations().out('array');

  // Extract date ranges (employment periods)
  const dates = doc.dates().out('array');

  // Common job title keywords
  const titleKeywords = ['manager', 'specialist', 'coordinator', 'analyst', 'director', 'officer', 'executive', 'consultant', 'engineer', 'developer', 'accountant', 'supervisor'];

  const workHistory = [];
  const lines = text.split('\n');

  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    const hasTitle = titleKeywords.some(title => lowerLine.includes(title));

    if (hasTitle && line.length > 10 && line.length < 100) {
      workHistory.push(line.trim());
    }
  });

  return workHistory.slice(0, 5); // Max 5 entries
}

/**
 * Generate summary (first 200 words or professional summary section)
 */
function generateSummary(text) {
  const lines = text.split('\n');
  const summaryKeywords = ['summary', 'profile', 'objective', 'about'];

  // Look for summary section
  for (let i = 0; i < lines.length; i++) {
    const lowerLine = lines[i].toLowerCase();
    const hasSummaryKeyword = summaryKeywords.some(keyword => lowerLine.includes(keyword));

    if (hasSummaryKeyword && lines[i + 1]) {
      // Get next 3-5 lines as summary
      const summaryText = lines.slice(i + 1, i + 6).join(' ').trim();
      if (summaryText.length > 50) {
        return summaryText.substring(0, 500); // Max 500 chars
      }
    }
  }

  // Fallback: Use first 200 words
  const words = text.split(/\s+/);
  return words.slice(0, 200).join(' ') + '...';
}

/**
 * Generate profile tags for categorization
 * Returns tags like "HR Professional", "Finance Expert", etc.
 */
function generateTags(text) {
  const tags = [];
  const lowerText = text.toLowerCase();

  const tagRules = [
    { keywords: ['hr', 'human resources', 'recruitment', 'talent'], tag: 'HR Professional' },
    { keywords: ['finance', 'accounting', 'audit', 'cpa'], tag: 'Finance Expert' },
    { keywords: ['it', 'software', 'developer', 'engineer', 'programming'], tag: 'IT Specialist' },
    { keywords: ['logistics', 'supply chain', 'warehouse', 'procurement'], tag: 'Operations Professional' },
    { keywords: ['sales', 'business development', 'account management'], tag: 'Sales Professional' },
    { keywords: ['marketing', 'digital marketing', 'social media'], tag: 'Marketing Professional' },
    { keywords: ['manager', 'director', 'head of', 'vp'], tag: 'Management Level' },
    { keywords: ['uae', 'dubai', 'abu dhabi', 'gcc'], tag: 'UAE Experience' },
    { keywords: ['bachelor', 'master', 'mba', 'phd'], tag: 'Higher Education' },
    { keywords: ['certified', 'cipd', 'pmp', 'shrm'], tag: 'Certified Professional' }
  ];

  tagRules.forEach(rule => {
    const matches = rule.keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length >= 1) {
      tags.push(rule.tag);
    }
  });

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Estimate years of experience
 * Looks for "X years experience" or date ranges
 */
function estimateExperience(text) {
  const experienceRegex = /(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/gi;
  const matches = text.match(experienceRegex);

  if (matches && matches.length > 0) {
    const numbers = matches[0].match(/\d+/);
    if (numbers) {
      return parseInt(numbers[0]);
    }
  }

  // Fallback: Count date ranges (rough estimate)
  const yearRegex = /\b(19|20)\d{2}\b/g;
  const years = text.match(yearRegex);

  if (years && years.length >= 2) {
    const sortedYears = years.map(y => parseInt(y)).sort();
    const estimatedYears = Math.min(sortedYears[sortedYears.length - 1] - sortedYears[0], 30);
    return estimatedYears > 0 ? estimatedYears : null;
  }

  return null;
}

/**
 * Calculate match score between candidate and job description
 * @param {Object} parsedCV - Parsed CV data
 * @param {string} jobDescription - Job description text
 * @returns {number} Match score (0-100)
 */
function calculateMatchScore(parsedCV, jobDescription) {
  if (!jobDescription) return 0;

  const jdLower = jobDescription.toLowerCase();
  let score = 0;

  // Skills match (40 points max)
  const skillMatches = parsedCV.skills.filter(skill =>
    jdLower.includes(skill.toLowerCase())
  );
  score += Math.min((skillMatches.length / Math.max(parsedCV.skills.length, 1)) * 40, 40);

  // Education match (20 points max)
  const educationKeywords = ['bachelor', 'master', 'mba', 'degree'];
  const hasRequiredEducation = educationKeywords.some(keyword =>
    jdLower.includes(keyword) && parsedCV.education.some(edu =>
      edu.toLowerCase().includes(keyword)
    )
  );
  if (hasRequiredEducation) score += 20;

  // Experience match (20 points max)
  const requiredExp = extractRequiredExperience(jobDescription);
  if (requiredExp && parsedCV.years_experience) {
    if (parsedCV.years_experience >= requiredExp) {
      score += 20;
    } else if (parsedCV.years_experience >= requiredExp * 0.7) {
      score += 10; // Partial match
    }
  }

  // Location match (10 points max)
  if (jdLower.includes('uae') || jdLower.includes('dubai') || jdLower.includes('abu dhabi')) {
    if (parsedCV.tags.includes('UAE Experience')) {
      score += 10;
    }
  }

  // Certifications match (10 points max)
  if (parsedCV.tags.includes('Certified Professional')) {
    score += 10;
  }

  return Math.round(Math.min(score, 100));
}

/**
 * Extract required years of experience from JD
 */
function extractRequiredExperience(jobDescription) {
  const expRegex = /(\d+)\+?\s*(years?|yrs?)\s*(of\s*)?(experience|exp)/gi;
  const matches = jobDescription.match(expRegex);

  if (matches && matches.length > 0) {
    const numbers = matches[0].match(/\d+/);
    if (numbers) {
      return parseInt(numbers[0]);
    }
  }

  return null;
}

module.exports = {
  parseCV,
  calculateMatchScore,
  extractContact,
  extractSkills,
  extractEducation,
  extractWorkHistory,
  generateSummary,
  generateTags,
  estimateExperience
};
