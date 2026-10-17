import { SKILLS_DICTIONARY, normalizeSkill } from "./skills-dictionary";

export interface ParsedResume {
  fullName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  currentTitle?: string;
  currentCompany?: string;
  experienceYears: number;
  skills: string[];
  rawText: string;
}

export function parseResume(resumeText: string): ParsedResume {
  const text = resumeText || "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Email extraction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0].toLowerCase() : "";

  // 2. Phone extraction
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  // 3. Social / Profile links
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i;
  const linkedinMatch = text.match(linkedinRegex);
  const linkedinUrl = linkedinMatch ? (linkedinMatch[0].startsWith("http") ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : undefined;

  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i;
  const githubMatch = text.match(githubRegex);
  const githubUrl = githubMatch ? (githubMatch[0].startsWith("http") ? githubMatch[0] : `https://${githubMatch[0]}`) : undefined;

  const portfolioRegex = /(?:https?:\/\/)?(?:www\.)?(?:[A-Za-z0-9_-]+\.(?:dev|me|io|design|tech|app|com))(?:\/[^\s]*)?/i;
  const portfolioMatches = text.match(new RegExp(portfolioRegex, "gi"));
  let portfolioUrl: string | undefined = undefined;
  if (portfolioMatches) {
    for (const match of portfolioMatches) {
      if (!match.includes("linkedin.com") && !match.includes("github.com")) {
        portfolioUrl = match.startsWith("http") ? match : `https://${match}`;
        break;
      }
    }
  }

  // 4. Name extraction heuristic
  // Usually the first non-empty line or "Name: ..."
  let fullName = "Candidate";
  for (const line of lines.slice(0, 5)) {
    if (/^name\s*:\s*(.+)$/i.test(line)) {
      fullName = line.replace(/^name\s*:\s*/i, "").trim();
      break;
    }
    // Skip if line looks like contact info, url, or header
    if (!line.includes("@") && !line.includes("http") && !line.includes("+") && line.split(" ").length <= 4 && line.length > 2) {
      fullName = line.replace(/^[#*\s-]+/, "").trim();
      break;
    }
  }

  // 5. Experience extraction
  let experienceYears = 0;
  // Check for explicit "N+ years" or "N years of experience"
  const explicitExpRegex = /(\d{1,2})\+?\s*(?:years|yrs)(?:\s*of)?\s*(?:experience|exp)?/i;
  const explicitMatch = text.match(explicitExpRegex);
  if (explicitMatch && explicitMatch[1]) {
    experienceYears = parseInt(explicitMatch[1], 10);
  } else {
    // Sum date ranges: e.g. "2019 - 2023", "2020 - Present", "Jan 2018 - Mar 2021"
    const rangeRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(\d{4})\s*[-–—to]+\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\.?\s*(\d{4})|Present|Current)/gi;
    let match: RegExpExecArray | null;
    let minYear = 3000;
    let maxYear = 0;
    const currentYear = new Date().getFullYear();

    while ((match = rangeRegex.exec(text)) !== null) {
      if (match[1]) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : currentYear;
        if (start < minYear && start > 1980) minYear = start;
        if (end > maxYear && end <= currentYear) maxYear = end;
      }
    }

    if (maxYear > 0 && minYear < 3000 && maxYear >= minYear) {
      experienceYears = Math.min(30, maxYear - minYear);
    }
  }

  if (experienceYears <= 0) {
    experienceYears = 3; // Default baseline if not detectable
  }

  // 6. Current Title & Company heuristic
  let currentTitle: string | undefined = undefined;
  let currentCompany: string | undefined = undefined;

  for (const line of lines) {
    // Look for lines like "Senior Backend Engineer at Stripe" or "Role: Staff Engineer"
    const atMatch = line.match(/^([A-Za-z\s]+)\s+at\s+([A-Za-z0-9\s.,-]+)$/i);
    if (atMatch && atMatch[1] && atMatch[2]) {
      currentTitle = atMatch[1].trim();
      currentCompany = atMatch[2].trim();
      break;
    }
    const pipeMatch = line.match(/^([A-Za-z\s]+)\s*[|•]\s*([A-Za-z0-9\s.,-]+)$/);
    if (pipeMatch && pipeMatch[1] && pipeMatch[2] && !pipeMatch[1].includes("@")) {
      currentTitle = pipeMatch[1].trim();
      currentCompany = pipeMatch[2].trim();
      break;
    }
    const titleMatch = line.match(/^(?:Title|Role|Position)\s*:\s*(.+)$/i);
    if (titleMatch && titleMatch[1]) {
      currentTitle = titleMatch[1].trim();
    }
    const companyMatch = line.match(/^(?:Company|Organization)\s*:\s*(.+)$/i);
    if (companyMatch && companyMatch[1]) {
      currentCompany = companyMatch[1].trim();
    }
    if (currentTitle && currentCompany) break;
  }

  // 7. Skills extraction via dictionary matching
  const detectedSkills = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const entry of SKILLS_DICTIONARY) {
    const canonicalLower = entry.canonical.toLowerCase();
    // Word boundary check for canonical and aliases
    const searchTerms = [canonicalLower, ...entry.aliases.map((a) => a.toLowerCase())];
    for (const term of searchTerms) {
      // Escape regex special chars in term
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, "i");
      if (regex.test(lowerText)) {
        detectedSkills.add(entry.canonical);
        break;
      }
    }
  }

  return {
    fullName,
    email,
    phone,
    linkedinUrl,
    githubUrl,
    portfolioUrl,
    currentTitle,
    currentCompany,
    experienceYears,
    skills: Array.from(detectedSkills),
    rawText: text,
  };
}
