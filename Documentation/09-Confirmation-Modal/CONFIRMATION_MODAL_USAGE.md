# Confirmation Modal - Usage Guide

A beautiful, reusable confirmation modal component for CRUD operations with modern UI design, animations, and full dark mode support.

## Features

✅ **4 Modal Types**: `danger`, `warning`, `info`, `success`  
✅ **Beautiful Animations**: Fade-in backdrop, slide-up modal, pulsing icons  
✅ **Loading States**: Built-in spinner and disabled state during async operations  
✅ **Dark Mode**: Full dark mode support with proper color schemes  
✅ **Responsive**: Mobile-optimized with stacked buttons on small screens  
✅ **Accessible**: Keyboard support, focus management, ARIA labels  
✅ **Portal Rendering**: Renders to document.body for proper z-index layering  

## Component Props

```typescript
interface ConfirmationModalProps {
  isOpen: boolean;              // Control modal visibility
  onClose: () => void;          // Called when user cancels or clicks backdrop
  onConfirm: () => void;        // Called when user confirms action
  title: string;                // Modal title
  message: string;              // Modal message/description
  confirmText?: string;         // Confirm button text (default: "Confirm")
  cancelText?: string;          // Cancel button text (default: "Cancel")
  type?: ConfirmationModalType; // Modal type (default: "info")
  isLoading?: boolean;          // Show loading spinner (default: false)
}

type ConfirmationModalType = 'danger' | 'warning' | 'info' | 'success';
```

## Basic Usage

### 1. Import the Component

```typescript
import ConfirmationModal, { ConfirmationModalType } from '../common/ConfirmationModal';
```

### 2. Set Up State Management

```typescript
const [modalState, setModalState] = useState<{
  isOpen: boolean;
  type: ConfirmationModalType;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
}>({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: 'Confirm',
  onConfirm: () => {},
});

const [isModalLoading, setIsModalLoading] = useState(false);

const closeModal = () => {
  if (!isModalLoading) {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }
};
```

### 3. Add Modal to JSX

```typescript
<ConfirmationModal
  isOpen={modalState.isOpen}
  onClose={closeModal}
  onConfirm={modalState.onConfirm}
  title={modalState.title}
  message={modalState.message}
  confirmText={modalState.confirmText}
  type={modalState.type}
  isLoading={isModalLoading}
/>
```

## Usage Examples

### Delete Operation (Danger)

```typescript
const handleDeleteStory = (storyId: string) => {
  const story = stories.find(s => s.id === storyId);
  setModalState({
    isOpen: true,
    type: 'danger',
    title: 'Delete Story',
    message: `Are you sure you want to permanently delete "${story?.title}"? This action cannot be undone.`,
    confirmText: 'Delete',
    onConfirm: () => {
      deleteStory(storyId);
      closeModal();
    },
  });
};
```

### Publish Operation (Info)

```typescript
const handlePublish = async (storyId: string) => {
  const story = stories.find(s => s.id === storyId);
  
  setModalState({
    isOpen: true,
    type: 'info',
    title: 'Publish Story',
    message: `Publish "${story?.title}" to the public library? Everyone will be able to see it.`,
    confirmText: 'Publish',
    onConfirm: async () => {
      setIsModalLoading(true);
      try {
        await storyApiService.publishStory(story.id);
        setIsModalLoading(false);
        closeModal();
      } catch (error) {
        setIsModalLoading(false);
        // Show error modal
        setModalState({
          isOpen: true,
          type: 'danger',
          title: 'Publish Failed',
          message: 'Failed to publish story. Please try again.',
          confirmText: 'OK',
          onConfirm: closeModal,
        });
      }
    },
  });
};
```

### Unpublish Operation (Warning)

```typescript
const handleUnpublish = async (storyId: string) => {
  const story = stories.find(s => s.id === storyId);
  
  setModalState({
    isOpen: true,
    type: 'warning',
    title: 'Unpublish Story',
    message: `Are you sure you want to unpublish "${story?.title}"? It will be removed from the public library.`,
    confirmText: 'Unpublish',
    onConfirm: async () => {
      setIsModalLoading(true);
      try {
        await storyApiService.unpublishStory(story.id);
        setIsModalLoading(false);
        closeModal();
      } catch (error) {
        setIsModalLoading(false);
        closeModal();
      }
    },
  });
};
```

### Save Operation (Success)

```typescript
const handleSave = (storyId: string) => {
  const story = stories.find(s => s.id === storyId);
  
  setModalState({
    isOpen: true,
    type: 'success',
    title: 'Save Story',
    message: `Save "${story?.title}"? It will be moved from Drafts to Your Works.`,
    confirmText: 'Save',
    onConfirm: () => {
      markAsSaved(storyId);
      closeModal();
    },
  });
};
```

### Validation/Error Modal (Warning)

```typescript
const handleAction = (itemId: string) => {
  const item = items.find(i => i.id === itemId);
  
  if (!item?.requiredField) {
    setModalState({
      isOpen: true,
      type: 'warning',
      title: 'Cannot Proceed',
      message: 'This item needs additional information before you can proceed.',
      confirmText: 'OK',
      onConfirm: closeModal,
    });
    return;
  }
  
  // Continue with action...
};
```

## Modal Types & Colors

### Danger (Red)
- **Use for**: Delete, remove, destructive actions
- **Icon**: ExclamationTriangleIcon (pulsing)
- **Color**: Red (#EF4444)
- **Button**: Red background with white text

### Warning (Orange)
- **Use for**: Unpublish, downgrade, reversible changes
- **Icon**: ExclamationTriangleIcon (pulsing)
- **Color**: Orange (#F59E0B)
- **Button**: Orange background with white text

### Info (Purple)
- **Use for**: Publish, share, neutral confirmations
- **Icon**: InformationCircleIcon
- **Color**: Purple (#8B5CF6)
- **Button**: Purple background with white text

### Success (Green)
- **Use for**: Save, complete, positive actions
- **Icon**: CheckCircleIcon
- **Color**: Green (#10B981)
- **Button**: Green background with white text

## Styling & Animations

### Animations
- **Backdrop**: Fade-in (0.2s)
- **Modal**: Slide-up with scale (0.3s cubic-bezier)
- **Icons**: Pulsing animation for danger/warning (2s infinite)
- **Buttons**: Hover lift effect (translateY -1px)

### Responsive Design
- **Desktop**: Side-by-side buttons, larger modal
- **Mobile**: Stacked buttons (full width), compact modal

### Dark Mode
- Automatically adapts to dark theme
- Dark background (#1F2937)
- Light text colors
- Proper contrast for all elements

## Best Practices

### 1. Always Include Story/Item Name
```typescript
// ✅ Good
message: `Delete "${story.title}"? This action cannot be undone.`

// ❌ Bad
message: 'Delete this story? This action cannot be undone.'
```

### 2. Use Appropriate Modal Types
```typescript
// ✅ Good
type: 'danger' for delete
type: 'warning' for unpublish
type: 'info' for publish
type: 'success' for save

// ❌ Bad
type: 'info' for delete (should be danger)
```

### 3. Handle Loading States
```typescript
// ✅ Good
onConfirm: async () => {
  setIsModalLoading(true);
  try {
    await apiCall();
    setIsModalLoading(false);
    closeModal();
  } catch (error) {
    setIsModalLoading(false);
    // Show error modal
  }
}

// ❌ Bad
onConfirm: async () => {
  await apiCall(); // No loading state
  closeModal();
}
```

### 4. Prevent Closing During Loading
```typescript
// ✅ Good
const closeModal = () => {
  if (!isModalLoading) {
    setModalState(prev => ({ ...prev, isOpen: false }));
  }
};

// ❌ Bad
const closeModal = () => {
  setModalState(prev => ({ ...prev, isOpen: false }));
};
```

### 5. Chain Modals for Error Handling
```typescript
// ✅ Good
try {
  await apiCall();
  closeModal();
} catch (error) {
  setIsModalLoading(false);
  setModalState({
    isOpen: true,
    type: 'danger',
    title: 'Operation Failed',
    message: 'An error occurred. Please try again.',
    confirmText: 'OK',
    onConfirm: closeModal,
  });
}
```

## Files

### Component
- `/components/common/ConfirmationModal.tsx` - Main component

### Styles
- `/index.css` - Lines 21561-21864 (300+ lines of CSS)

### Integration Example
- `/components/pages/PrivateLibraryPage.tsx` - Full implementation example

## CSS Classes

All modal styles use the `confirmation-modal-*` prefix:
- `.confirmation-modal-backdrop` - Backdrop overlay
- `.confirmation-modal-container` - Modal container
- `.confirmation-modal-icon` - Icon styling
- `.confirmation-modal-title` - Title text
- `.confirmation-modal-message` - Message text
- `.confirmation-modal-button` - Button base
- `.confirmation-modal-button-danger` - Danger button variant
- `.confirmation-modal-button-warning` - Warning button variant
- `.confirmation-modal-button-info` - Info button variant
- `.confirmation-modal-button-success` - Success button variant

## Browser Support

✅ Modern browsers (Chrome, Firefox, Safari, Edge)  
✅ Mobile browsers (iOS Safari, Chrome Mobile)  
✅ Dark mode support  
✅ Touch-friendly on mobile  

---

**Note**: The modal uses React Portal to render to `document.body`, ensuring proper z-index layering above all other content.
