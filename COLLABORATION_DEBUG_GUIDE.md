# 🔍 Collaboration Page Pull Debug Guide

## 🐛 Issue Status

**Problem:** User on Page 3 gets pulled to Page 1 when other user does activity on Page 1.
**Asymmetric:** It's one-directional (only one user gets pulled, not the other).

---

## 🔬 Debug Steps Added

### 1. Enhanced Message Logging

Added comprehensive logging in `handleAllMessages`:

```typescript
const handleAllMessages = (message: any) => {
  console.log('🔔 WebSocket message received (all):', message.type, message);
  
  // Track messages with page info
  if (message.page_number !== undefined || message.page_index !== undefined) {
    console.warn('⚠️ Message contains page info:', {
      type: message.type,
      page_number: message.page_number,
      page_index: message.page_index,
      username: message.username,
      currentPageIndex: currentPageIndex
    });
  }
};
```

### 2. Page Navigation Tracking

Added stack trace logging to `handlePageNavigationSync`:

```typescript
const handlePageNavigationSync = (newPageIndex: number) => {
  console.log('🔄 handlePageNavigationSync called:', {
    from: currentPageIndex,
    to: newPageIndex,
    stack: new Error().stack?.split('\n')[2] // Show where it was called from
  });
  setCurrentPageIndex(newPageIndex);
  //...
};
```

---

## 🧪 How to Debug

### Step 1: Open Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Clear console (Ctrl+L)

### Step 2: Reproduce the Bug

**User A (gets pulled):**
1. Navigate to Page 3
2. Stay there
3. Watch console

**User B (causes pull):**
1. Navigate to Page 1
2. Start drawing or typing
3. Watch console

### Step 3: Analyze Console Output

Look for these messages:

#### **Normal Messages (Should NOT pull):**
```javascript
🔔 WebSocket message received (all): draw {...}
⚠️ Message contains page info: {
  type: "draw",
  page_number: undefined,
  page_index: 0,  // ← This is OK, just indicates which page the drawing is for
  username: "UserB",
  currentPageIndex: 2  // ← You're on page 3 (index 2), should stay here
}
```

#### **Bug Trigger (SHOULD NOT HAPPEN):**
```javascript
🔄 handlePageNavigationSync called: {
  from: 2,  // Page 3
  to: 0,    // Page 1 (getting pulled!)
  stack: "at handleTextUpdate..." // ← Shows which function called it
}
```

---

## 🎯 What to Look For

### Suspect Messages:

1. **Any `page_change` message** when you didn't navigate:
   ```javascript
   🔔 WebSocket message received (all): page_change {
     page_number: 0,
     username: "UserB"
   }
   ```
   **If you see this:** Backend is incorrectly sending page_change for non-navigation activities

2. **`handlePageNavigationSync` called unexpectedly:**
   ```javascript
   🔄 handlePageNavigationSync called: {
     from: 2, to: 0,
     stack: "at handleTextUpdate..." // ← Wrong! Text updates shouldn't change pages
   }
   ```
   **If you see this:** Frontend handler is incorrectly calling page navigation

3. **Messages with `page_number` field (not `page_index`):**
   ```javascript
   ⚠️ Message contains page info: {
     type: "text_edit",
     page_number: 0,  // ← SUSPICIOUS! text_edit should use page_index, not page_number
   }
   ```
   **If you see this:** Backend is sending wrong field name

---

## 🔍 Possible Root Causes

### Cause 1: Backend Sending `page_change` Incorrectly

**Backend code might be:**
```python
# WRONG:
def send_text_update(self, page_index, text):
    self.send_json({
        'type': 'text_edit',
        'page_number': page_index,  # ← BUG: Using page_number instead of page_index
    })
```

**Should be:**
```python
# CORRECT:
def send_text_update(self, page_index, text):
    self.send_json({
        'type': 'text_edit',
        'page_index': page_index,  # ← Correct field name
    })
```

### Cause 2: Frontend Handler Misinterpreting Messages

**Some handler might be:**
```typescript
// WRONG:
const handleTextUpdate = (message: any) => {
  // ... handle text ...
  
  if (message.page_number !== undefined) {
    setCurrentPageIndex(message.page_number);  // ← BUG!
  }
};
```

### Cause 3: Race Condition in React Effects

**A useEffect might be:**
```typescript
// WRONG:
useEffect(() => {
  if (message.page_index !== undefined) {
    setCurrentPageIndex(message.page_index);  // ← Runs for ALL messages!
  }
}, [message]);
```

---

## 📋 Checklist After Getting Console Logs

Share these from console:

- [ ] All `🔔 WebSocket message received` logs around the time of pull
- [ ] Any `🔄 handlePageNavigationSync called` logs
- [ ] Any `⚠️ Message contains page info` warnings
- [ ] The specific `message.type` that triggered the pull
- [ ] The stack trace showing which function called `setCurrentPageIndex`

---

## 🛠️ Temporary Workaround

If you need to work around this immediately, add this guard:

```typescript
// Wrap setCurrentPageIndex to prevent unwanted changes
const originalSetCurrentPageIndex = setCurrentPageIndex;
const guardedSetCurrentPageIndex = (newIndex: number) => {
  const stack = new Error().stack;
  
  // Only allow page changes from explicit navigation functions
  const allowedCallers = [
    'handlePageNavigationSync',
    'goToPreviousPage',
    'goToNextPage',
    'selectPage',
    'handlePageAdded', // Only if user added the page
    'handlePageDeleted' // Only if adjusting after deletion
  ];
  
  const isAllowed = allowedCallers.some(caller => stack?.includes(caller));
  
  if (!isAllowed) {
    console.error('🚫 Blocked unauthorized page change:', {
      from: currentPageIndex,
      to: newIndex,
      stack: stack?.split('\n').slice(1, 4)
    });
    return;
  }
  
  originalSetCurrentPageIndex(newIndex);
};
```

---

## 📞 Next Steps

1. **Reproduce the bug** with console open
2. **Copy all console logs** from the moment User B starts activity
3. **Share the logs** (especially any `🔄 handlePageNavigationSync` calls)
4. **Check the stack trace** to see which function is calling it

This will tell us exactly where the bug is!
