# Custom Modal Component

A beautiful, animated modal component that can be used as a replacement for the default React Native Alert.

## Features

- ✨ Beautiful spring animations
- 🎨 Customizable styling and colors
- 📱 Responsive design
- 🔧 Easy to use with hooks
- 🎯 Multiple button styles (default, cancel, destructive)
- 📦 Full TypeScript support
- 🌐 Global context provider

## Usage

### Basic Usage with Hook

```tsx
import { useModal } from '../contexts/ModalContext';

const MyComponent = () => {
  const { showAlert, showSuccess, showError, showWarning, showConfirm } = useModal();

  const handleButtonPress = () => {
    showAlert('Title', 'This is a message');
  };

  const handleSuccess = () => {
    showSuccess('Success!', 'Operation completed successfully');
  };

  const handleError = () => {
    showError('Error', 'Something went wrong');
  };

  const handleConfirm = () => {
    showConfirm(
      'Confirm Action',
      'Are you sure you want to proceed?',
      () => console.log('Confirmed'),
      () => console.log('Cancelled')
    );
  };

  return (
    // Your component JSX
  );
};
```

### Advanced Usage with Custom Configuration

```tsx
const { showModal } = useModal();

const handleCustomModal = () => {
  showModal({
    title: 'Custom Modal',
    message: 'This is a custom modal with multiple options',
    type: 'info', // 'info' | 'success' | 'warning' | 'error'
    showIcon: true,
    buttons: [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancelled'),
        style: 'cancel'
      },
      {
        text: 'Maybe Later',
        onPress: () => console.log('Later'),
      },
      {
        text: 'Proceed',
        onPress: () => console.log('Proceeded'),
        style: 'destructive'
      }
    ],
    closeOnBackdrop: true
  });
};
```

## Modal Types

### Info Modal (Default)
- Blue color scheme
- ℹ️ Info icon
- Used for general information

### Success Modal
- Green color scheme
- ✅ Success icon
- Used for successful operations

### Warning Modal
- Yellow color scheme
- ⚠️ Warning icon
- Used for warnings and confirmations

### Error Modal
- Red color scheme
- ❌ Error icon
- Used for errors and failures

## Button Styles

### Default Button
- Blue background
- White text
- Primary action

### Cancel Button
- Light gray background
- Dark text
- Secondary action

### Destructive Button
- Red background
- White text
- Dangerous action

## Props

### CustomModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Controls modal visibility |
| `title` | `string` | - | Modal title |
| `message` | `string` | - | Modal message |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Modal type |
| `showIcon` | `boolean` | `true` | Show/hide icon |
| `buttons` | `Array<Button>` | `[]` | Array of buttons |
| `onClose` | `() => void` | - | Close handler |
| `closeOnBackdrop` | `boolean` | `true` | Close on backdrop press |

### Button Interface

```tsx
interface Button {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}
```

## Setup

1. The ModalProvider is already included in App.tsx
2. Import and use the `useModal` hook in your components
3. Replace `Alert.alert()` calls with the custom modal methods

## Examples

### Replacing Alert.alert()

```tsx
// Before
Alert.alert('Error', 'Something went wrong');

// After
const { showError } = useModal();
showError('Error', 'Something went wrong');
```

### Confirmation Dialog

```tsx
// Before
Alert.alert(
  'Delete Item',
  'Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: deleteItem }
  ]
);

// After
const { showConfirm } = useModal();
showConfirm(
  'Delete Item',
  'Are you sure?',
  deleteItem,
  () => console.log('Cancelled')
);
```

## Styling

The modal uses a consistent design system with:
- Rounded corners (16px)
- Shadow effects
- Smooth animations
- Responsive sizing
- Accessible colors

## Animation

The modal features:
- Spring animation for scale
- Fade animation for opacity
- Smooth transitions
- Native driver support for performance
