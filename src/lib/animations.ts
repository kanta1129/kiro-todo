/**
 * Animation utilities for task completion and user feedback
 * Requirements: 4.2, 4.4, 5.3
 */

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface CompletionAnimationOptions {
  onComplete?: () => void;
  duration?: number;
  showConfetti?: boolean;
}

export interface FeedbackAnimationOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
}

export interface StateTransitionOptions {
  from: string;
  to: string;
  duration?: number;
  easing?: string;
}

// Default animation configurations
export const ANIMATION_CONFIGS = {
  completion: {
    duration: 800,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  feedback: {
    duration: 300,
    easing: 'ease-out',
  },
  stateTransition: {
    duration: 600,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  loading: {
    duration: 1200,
    easing: 'ease-in-out',
  },
} as const;

// CSS class names for animations
export const ANIMATION_CLASSES = {
  // Completion animations
  completing: 'task-completing',
  completed: 'task-completed',
  completionSuccess: 'completion-success',
  
  // Feedback animations
  feedbackEnter: 'feedback-enter',
  feedbackExit: 'feedback-exit',
  feedbackSuccess: 'feedback-success',
  feedbackError: 'feedback-error',
  feedbackWarning: 'feedback-warning',
  feedbackInfo: 'feedback-info',
  
  // State transitions
  stateTransition: 'state-transition',
  fadeIn: 'fade-in',
  fadeOut: 'fade-out',
  slideUp: 'slide-up',
  slideDown: 'slide-down',
  
  // Loading states
  loading: 'loading',
  loadingSpinner: 'loading-spinner',
  loadingPulse: 'loading-pulse',
  
  // Interactive feedback
  buttonPress: 'button-press',
  buttonHover: 'button-hover',
  inputFocus: 'input-focus',
} as const;

/**
 * Trigger task completion animation
 */
export function triggerCompletionAnimation(
  element: HTMLElement,
  options: CompletionAnimationOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    const { duration = ANIMATION_CONFIGS.completion.duration, onComplete, showConfetti = true } = options;
    
    // Add completion classes
    element.classList.add(ANIMATION_CLASSES.completing);
    
    // Create confetti effect if enabled
    if (showConfetti) {
      createConfettiEffect(element);
    }
    
    // Add success feedback
    setTimeout(() => {
      element.classList.add(ANIMATION_CLASSES.completionSuccess);
    }, duration * 0.3);
    
    // Complete animation
    setTimeout(() => {
      element.classList.add(ANIMATION_CLASSES.completed);
      element.classList.remove(ANIMATION_CLASSES.completing);
      
      onComplete?.();
      resolve();
    }, duration);
  });
}

/**
 * Create confetti effect for task completion
 */
function createConfettiEffect(element: HTMLElement): void {
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  element.appendChild(confettiContainer);
  
  // Create multiple confetti particles
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.setProperty('--delay', `${i * 50}ms`);
    particle.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    particle.style.setProperty('--x-offset', `${(Math.random() - 0.5) * 200}px`);
    confettiContainer.appendChild(particle);
  }
  
  // Remove confetti after animation
  setTimeout(() => {
    confettiContainer.remove();
  }, 2000);
}

/**
 * Show user feedback message
 */
export function showFeedback(options: FeedbackAnimationOptions): Promise<void> {
  return new Promise((resolve) => {
    const { type, message, duration = 3000, position = 'top' } = options;
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `feedback-message feedback-${type} feedback-${position}`;
    feedback.textContent = message;
    
    // Add to DOM
    document.body.appendChild(feedback);
    
    // Animate in
    requestAnimationFrame(() => {
      feedback.classList.add(ANIMATION_CLASSES.feedbackEnter);
    });
    
    // Auto-remove after duration
    setTimeout(() => {
      feedback.classList.add(ANIMATION_CLASSES.feedbackExit);
      setTimeout(() => {
        feedback.remove();
        resolve();
      }, ANIMATION_CONFIGS.feedback.duration);
    }, duration);
  });
}

/**
 * Animate state transitions
 */
export function animateStateTransition(
  element: HTMLElement,
  options: StateTransitionOptions
): Promise<void> {
  return new Promise((resolve) => {
    const { from, to, duration = ANIMATION_CONFIGS.stateTransition.duration, easing = ANIMATION_CONFIGS.stateTransition.easing } = options;
    
    // Add transition class
    element.classList.add(ANIMATION_CLASSES.stateTransition);
    element.style.transition = `all ${duration}ms ${easing}`;
    
    // Remove old state class and add new one
    element.classList.remove(`freshness-${from}`);
    element.classList.add(`freshness-${to}`);
    
    // Complete transition
    setTimeout(() => {
      element.classList.remove(ANIMATION_CLASSES.stateTransition);
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Add loading state to element
 */
export function addLoadingState(element: HTMLElement, type: 'spinner' | 'pulse' = 'spinner'): void {
  element.classList.add(ANIMATION_CLASSES.loading);
  element.classList.add(type === 'spinner' ? ANIMATION_CLASSES.loadingSpinner : ANIMATION_CLASSES.loadingPulse);
  element.setAttribute('aria-busy', 'true');
}

/**
 * Remove loading state from element
 */
export function removeLoadingState(element: HTMLElement): void {
  element.classList.remove(ANIMATION_CLASSES.loading, ANIMATION_CLASSES.loadingSpinner, ANIMATION_CLASSES.loadingPulse);
  element.removeAttribute('aria-busy');
}

/**
 * Add interactive feedback to buttons
 */
export function addButtonFeedback(button: HTMLElement): void {
  const handleMouseDown = () => button.classList.add(ANIMATION_CLASSES.buttonPress);
  const handleMouseUp = () => button.classList.remove(ANIMATION_CLASSES.buttonPress);
  const handleMouseEnter = () => button.classList.add(ANIMATION_CLASSES.buttonHover);
  const handleMouseLeave = () => button.classList.remove(ANIMATION_CLASSES.buttonHover, ANIMATION_CLASSES.buttonPress);
  
  button.addEventListener('mousedown', handleMouseDown);
  button.addEventListener('mouseup', handleMouseUp);
  button.addEventListener('mouseleave', handleMouseLeave);
  button.addEventListener('mouseenter', handleMouseEnter);
  
  // Store cleanup function
  (button as any)._cleanupFeedback = () => {
    button.removeEventListener('mousedown', handleMouseDown);
    button.removeEventListener('mouseup', handleMouseUp);
    button.removeEventListener('mouseleave', handleMouseLeave);
    button.removeEventListener('mouseenter', handleMouseEnter);
  };
}

/**
 * Remove interactive feedback from buttons
 */
export function removeButtonFeedback(button: HTMLElement): void {
  if ((button as any)._cleanupFeedback) {
    (button as any)._cleanupFeedback();
    delete (button as any)._cleanupFeedback;
  }
  button.classList.remove(ANIMATION_CLASSES.buttonPress, ANIMATION_CLASSES.buttonHover);
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}