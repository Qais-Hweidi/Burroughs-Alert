# Issue #6: Add Loading State to Alert Creation Form

**GitHub Issue**: https://github.com/Qais-Hweidi/Burroughs-Alert/issues/6

## Problem Analysis

The alert creation form at `/src/components/forms/AlertForm.tsx` currently has minimal loading state feedback when submitting. Users may be confused if the request takes time as there's no clear visual indication that their submission is being processed.

## Current State

The form currently has:

1. Basic `isSubmitting` state (line 89)
2. Disabled submit button during submission (line 566)
3. Inline CSS spinner animation in the submit button (lines 571-572)
4. Basic error handling with general error messages

## Missing Features (from Acceptance Criteria)

1. ✅ Loading spinner/skeleton when form is submitting - Partially done (needs UI library component)
2. ❌ Disable form inputs during submission - Currently only submit button is disabled
3. ❌ Show success message after successful creation - Currently redirects to success page
4. ✅ Handle and display error states appropriately - Already implemented
5. ✅ Loading state persists until API response - Already implemented
6. ❌ Form should remain accessible with proper ARIA labels - Missing aria-busy states

## Implementation Plan

### Step 1: Replace Inline Spinner with UI Library Component

- Import the `Spinner` component from `/src/components/ui/spinner.tsx`
- Replace the inline CSS animation (line 571) with the proper Spinner component
- Ensure consistent styling with the design system

### Step 2: Disable All Form Inputs During Submission

- Add `disabled={isSubmitting}` to all form inputs:
  - Email input (line 283)
  - Neighborhood checkboxes (lines 337, 363)
  - Price inputs (lines 401, 419)
  - Bedroom select (line 452)
  - Pet-friendly toggle (line 486)
  - GooglePlacesAutocomplete component (line 528)
  - Commute time input (line 535)

### Step 3: Add ARIA Accessibility Attributes

- Add `aria-busy={isSubmitting}` to the form element (line 274)
- Add `aria-disabled={isSubmitting}` to all interactive elements
- Ensure screen readers announce loading state properly

### Step 4: Consider Toast Notifications (Optional Enhancement)

While the current flow redirects to a success page, we could enhance the UX by:

- Implementing a toast notification system for immediate feedback
- Showing a success toast before redirecting
- Using the existing toast components at `/src/components/ui/toast.tsx`

However, this would require:

1. Creating a useToast hook
2. Adding ToastProvider to the layout
3. Significant refactoring

**Decision**: For this issue, we'll stick with the current redirect flow and focus on improving the loading state during submission.

### Step 5: Test the Implementation

1. Manual testing:
   - Submit form with valid data
   - Submit form with invalid data
   - Test with slow network (Chrome DevTools throttling)
   - Test with screen reader

2. Unit tests:
   - Test that all inputs are disabled during submission
   - Test that loading spinner appears
   - Test that aria-busy is set correctly

## Technical Implementation Details

### Files to Modify:

1. `/src/components/forms/AlertForm.tsx` - Main implementation
2. Potentially update imports to include Spinner component

### Code Changes:

1. **Import Spinner component**:

```tsx
import { Spinner } from '@/components/ui/spinner';
```

2. **Update submit button**:

```tsx
{
  isSubmitting ? (
    <>
      <Spinner size="sm" className="mr-2" />
      Creating Alert...
    </>
  ) : (
    <>
      <Check className="w-5 h-5 mr-2" />
      Create My Alert
    </>
  );
}
```

3. **Add disabled prop to all inputs**:

```tsx
disabled = { isSubmitting };
```

4. **Add ARIA attributes**:

```tsx
<form onSubmit={handleSubmit} className={className} aria-busy={isSubmitting}>
```

## Testing Checklist

- [ ] Form inputs are disabled during submission
- [ ] Loading spinner from UI library is visible
- [ ] Submit button shows proper loading state
- [ ] Form remains accessible with screen reader
- [ ] Error states still work properly
- [ ] Success flow still redirects correctly
- [ ] No console errors or warnings

## Rollback Plan

If issues arise:

1. Git revert the commit
2. The changes are isolated to AlertForm.tsx
3. No database or API changes required

## Future Enhancements (Out of Scope)

1. Implement toast notification system
2. Add progress indicator for multi-step submission
3. Implement optimistic UI updates
4. Add skeleton loading states for form sections
