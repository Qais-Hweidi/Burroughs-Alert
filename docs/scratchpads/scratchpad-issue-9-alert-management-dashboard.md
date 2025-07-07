# Issue #9: Alert Management Dashboard Implementation Plan

**GitHub Issue**: https://github.com/Qais-Hweidi/Burroughs-Alert/issues/9
**Issue Title**: Add Alert Management Dashboard for Users

## Problem Analysis

Currently, users can create alerts but have no way to view, edit, or manage their existing alerts. Once an alert is created, users cannot see what alerts they have active or modify them if their preferences change.

## Current State Analysis

### ✅ **Excellent Infrastructure Already Available**

**Database Layer (100% Ready)**:

- Complete CRUD operations in `/src/lib/database/queries/alerts.ts`
- `updateAlert()`, `deleteAlert()`, `deactivateAlert()` functions already implemented
- `getAlertsByEmail()` for retrieving user alerts
- SQLite with proper indexes and relationships

**API Layer (70% Ready)**:

- ✅ `GET /api/alerts` - Complete (retrieves alerts by email/token)
- ✅ `GET /api/alerts/[id]` - Complete (single alert retrieval)
- ❌ `PUT /api/alerts/[id]` - **MISSING** (but can use existing `updateAlert()` function)
- ❌ `DELETE /api/alerts/[id]` - **MISSING** (but can use existing `deactivateAlert()` function)

**UI Components (80% Ready)**:

- ✅ Complete AlertForm component with validation and loading states
- ✅ UI library (button, input, card, spinner, etc.)
- ✅ Layout components (Header, Footer, Container)
- ❌ **MISSING**: Alert list/card components, delete confirmation dialog

**Authentication & Access Control (100% Ready)**:

- ✅ Email-based authentication with unsubscribe tokens
- ✅ Users can access alerts via email parameter or token
- ✅ Security measures in place

## Implementation Plan

### Phase 1: API Foundation (30 minutes)

**Task 1**: Add missing API endpoints

- Create `PUT /api/alerts/[id]` endpoint
- Create `DELETE /api/alerts/[id]` endpoint
- Both can leverage existing database functions
- Add proper validation and error handling

### Phase 2: UI Components (1.5 hours)

**Task 2**: Create AlertCard component

- Display alert details in card format
- Include edit/delete action buttons
- Show alert status and activity info
- Responsive design matching existing components

**Task 3**: Create delete confirmation dialog

- Use existing UI library components
- Clear confirmation message
- Proper error handling

### Phase 3: Dashboard Page (2 hours)

**Task 4**: Create `/alerts/manage` page

- Email input form for user identification
- Alert list display using AlertCard components
- Loading states and error handling
- Responsive layout

**Task 5**: Enhance AlertForm for edit mode

- Add edit mode prop to existing AlertForm
- Pre-populate form fields with existing alert data
- Update submission logic (PUT vs POST)
- Maintain all existing validation and loading states

### Phase 4: Navigation & UX (30 minutes)

**Task 6**: Update navigation

- Add "Manage Alerts" link to success page
- Update email templates to include dashboard link
- Ensure consistent user experience

### Phase 5: Testing & Validation (1.5 hours)

**Task 7**: Write comprehensive tests

- API endpoint tests for PUT/DELETE
- Component tests for AlertCard and dashboard
- Integration tests for complete user flows
- Error handling tests

**Task 8**: Manual testing with Playwright

- Test complete user journey
- Verify responsive design
- Test error scenarios
- Validate accessibility

## Technical Implementation Details

### API Endpoints

**PUT /api/alerts/[id]**

```typescript
// Can reuse existing updateAlert() function
// Validate request body against alert schema
// Return updated alert data
// Handle auth via email/token matching
```

**DELETE /api/alerts/[id]**

```typescript
// Use existing deactivateAlert() function (soft delete)
// Validate user owns the alert
// Return success response
// Handle auth via email/token matching
```

### Component Structure

**AlertCard Component**

```typescript
interface AlertCardProps {
  alert: Alert;
  onEdit: (alertId: string) => void;
  onDelete: (alertId: string) => void;
  showActions?: boolean;
}
```

**Dashboard Page Structure**

```
/alerts/manage
├── Email input form (if no email/token provided)
├── Alert list (if user identified)
│   ├── AlertCard components
│   └── "Create New Alert" button
├── Loading states
└── Error handling
```

### User Flow

1. **Access Dashboard**:
   - Via direct link: `/alerts/manage?email=user@example.com`
   - Via token: `/alerts/manage?token=unsubscribe_token`
   - Via email input form

2. **View Alerts**:
   - Display all active alerts for user
   - Show alert details in card format
   - Display creation date and activity stats

3. **Edit Alert**:
   - Click "Edit" button on alert card
   - Navigate to edit form (reuse AlertForm component)
   - Pre-populate with existing data
   - Submit changes via PUT API

4. **Delete Alert**:
   - Click "Delete" button on alert card
   - Show confirmation dialog
   - Confirm deletion via DELETE API
   - Update UI to reflect changes

## Testing Strategy

### Unit Tests

- API endpoints for all CRUD operations
- AlertCard component rendering and interactions
- AlertForm in edit mode
- Delete confirmation dialog

### Integration Tests

- Complete user flow from dashboard to edit/delete
- API integration with database operations
- Error handling scenarios

### Manual Testing

- Responsive design across devices
- Accessibility compliance
- Performance with multiple alerts
- Error states and edge cases

## Success Metrics

- [ ] User can view all their alerts by entering email
- [ ] User can edit existing alert criteria
- [ ] User can delete alerts with confirmation
- [ ] Changes are saved to database
- [ ] UI is responsive and matches existing design
- [ ] Error handling for invalid emails/alerts
- [ ] All tests pass
- [ ] No regressions in existing functionality

## Risk Mitigation

**Low Risk Implementation**:

- Leveraging existing, tested infrastructure
- Minimal new code required
- Well-defined requirements
- Comprehensive testing strategy

**Potential Issues**:

- User experience design decisions
- Performance with many alerts per user
- Error handling edge cases

**Mitigation Strategy**:

- Follow existing design patterns
- Implement pagination if needed
- Comprehensive error handling and testing

## Timeline Estimate

**Total Time**: ~6 hours

- Phase 1 (API): 30 minutes
- Phase 2 (UI Components): 1.5 hours
- Phase 3 (Dashboard): 2 hours
- Phase 4 (Navigation): 30 minutes
- Phase 5 (Testing): 1.5 hours

## Next Steps

1. Create feature branch for issue #9
2. Implement API endpoints first (foundation)
3. Build UI components incrementally
4. Test thoroughly at each step
5. Create comprehensive PR with documentation
