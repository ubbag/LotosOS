/**
 * Validation utilities for forms
 */

/**
 * Validate phone number - must be exactly 9 digits (optional)
 */
export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  // Phone is optional - empty is valid
  if (!phone || phone.trim() === '') {
    return { valid: true };
  }

  // Check if it's exactly 9 digits
  if (phone.length !== 9) {
    return { valid: false, error: 'Telefon musi mieć dokładnie 9 cyfr' };
  }

  return { valid: true };
};

/**
 * Format phone input - allow only digits, max 9
 */
export const formatPhoneInput = (value: string): string => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  // Limit to 9 digits
  return digitsOnly.slice(0, 9);
};

/**
 * Validate email - must have @domena with extension
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email jest wymagany' };
  }

  // Must contain @ and a dot after @
  if (!email.includes('@')) {
    return { valid: false, error: 'Email musi zawierać @domena' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email niepoprawny - musi być w formacie nazwa@domena.pl' };
  }

  return { valid: true };
};

/**
 * Validate optional email - same as validateEmail but allows empty
 */
export const validateOptionalEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: true };
  }

  return validateEmail(email);
};
