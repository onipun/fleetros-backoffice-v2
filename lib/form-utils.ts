/**
 * Prevents form submission when Enter key is pressed in input fields.
 * This should be added to form's onKeyDown handler.
 * 
 * @example
 * <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmission}>
 */
export function preventEnterSubmission(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
    // Allow Enter in textareas for line breaks
    // Prevent Enter submission in all other input fields
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}

/**
 * Prevents form submission when Enter key is pressed, but only if not on a submit button.
 * This allows explicit button clicks to submit the form.
 * 
 * @example
 * <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmissionExceptButton}>
 */
export function preventEnterSubmissionExceptButton(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key === 'Enter') {
    const target = e.target as HTMLElement;
    // Allow Enter on buttons (explicit submit)
    if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') {
      return; // Allow submission via button
    }
    // Allow Enter in textareas
    if (target.tagName === 'TEXTAREA') {
      return;
    }
    // Prevent Enter in all other cases
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
