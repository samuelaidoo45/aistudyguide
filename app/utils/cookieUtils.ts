/**
 * Utility functions for handling cookies safely
 */

/**
 * Safely parse a cookie value that might be JSON or base64 encoded
 * @param cookieValue The cookie value to parse
 * @returns The parsed value or the original string if parsing fails
 */
export function safelyParseCookie(cookieValue: string | undefined): any {
  if (!cookieValue) return null;
  
  // If it starts with 'base64-', it's a base64 encoded cookie
  if (cookieValue.startsWith('base64-')) {
    try {
      // Just return the raw value - let Supabase handle the decoding
      return cookieValue;
    } catch (error) {
      console.error('Error decoding base64 cookie:', error);
      return cookieValue; // Return the raw value if decoding fails
    }
  }
  
  // Try to parse as JSON
  try {
    return JSON.parse(cookieValue);
  } catch (error) {
    // If it's not valid JSON, just return the string value
    return cookieValue;
  }
}

/**
 * Clear all authentication cookies
 */
export function clearAuthCookies(): void {
  // List of Supabase auth cookies
  const authCookies = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'sb-provider-token',
    'sb-auth-token'
  ];
  
  // Clear each cookie
  authCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
} 