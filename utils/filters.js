import { TARGET_KEYWORDS, BLACKLISTED_WORDS } from '../config/constants.js';

/**
 * Check if a project should be included based on title keywords
 * @param {Object} project - Project object with title and other properties
 * @returns {boolean} - Whether the project matches the criteria
 */
function filterProject(project) {
  if (!project?.title) return false;
  
  const title = project.title.toLowerCase();
  
  // Skip if title contains blacklisted words
  const hasBlacklistedWord = BLACKLISTED_WORDS.some(word => 
    title.includes(word.toLowerCase())
  );
  
  if (hasBlacklistedWord) return false;
  
  // Include if title contains any target keywords
  return TARGET_KEYWORDS.some(keyword => 
    title.includes(keyword.toLowerCase())
  );
}

/**
 * Filter an array of projects
 * @param {Array} projects - Array of project objects
 * @returns {Array} - Filtered array of projects
 */
function filterProjects(projects) {
  if (!Array.isArray(projects)) return [];
  return projects.filter(filterProject);
}

export { filterProject, filterProjects };
export default { filterProject, filterProjects };
