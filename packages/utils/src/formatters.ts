/**
 * Shared Formatting Utilities
 * Pure string and date formatting functions
 */

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date to a datetime string
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Truncate a string to a maximum length
 */
export function truncateString(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

/**
 * Format a quest status for display
 */
export function formatQuestStatus(status: string): string {
  const statusMap: Record<string, string> = {
    locked: "Locked",
    available: "Available",
    in_progress: "In Progress",
    completed: "Completed",
  };

  return statusMap[status] || status;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a quest type for display
 */
export function formatQuestType(type: string): string {
  return type
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}
