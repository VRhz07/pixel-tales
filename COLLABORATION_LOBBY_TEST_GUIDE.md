# Collaboration Lobby Fix - Testing Guide

## Prerequisites
1. **CRITICAL**: Restart your Django backend server to apply all changes
2. Two devices ready (e.g., phone + laptop, or two phones)
3. Both connected to the same network if using custom API URL

## Test Scenario 1: Custom API URL on Mobile (The Original Issue)

### Setup
1. **Phone (Host)**:
   - Enable Developer Mode in app settings
   - Set custom API URL (e.g., `http://192.168.1.x:8000/api`)
   - Log in as User A

2. **Laptop/Desktop (Participant)**:
   - Open browser to your frontend URL
   - Log in as User B

### Test Steps
1. **On Phone (Host)**:
   - Go to Create Story
   - Select "Collaborate with Friends"
   - Enter story title
   - Click "Start"
   - **Wait in lobby** - You should see yourself listed

2. **On Laptop (Participant)**:
   - Go to home page
   - Look for collaboration invite notification OR
   - Use the join code from phone to join
   - **You should see the lobby** with host listed

3. **On Phone (Host)**:
   - Click "Start Collaboration" button
   - **Expected**: Phone should exit lobby and enter story creation page

4. **On Laptop (Participant)**:
   - **Expected**: Should IMMEDIATELY exit lobby and enter story creation page
   - **Previous Bug**: Would stay stuck in lobby forever
   - **Check console for**: "🎉 Session started message received from WebSocket"

### Success Criteria
✅ Participant exits lobby within 1-2 seconds of host starting
✅ Both users can see each other in participants panel
✅ Both users can edit the story collaboratively

### Failure Indicators
❌ Participant stays in lobby after host starts
❌ Console shows: "⏸️ Skipping WebSocket connection - not ready"
❌ No "Session started message received" in console

## Test Scenario 2: Normal Browser-to-Browser (Should Still Work)

### Setup
1. Two browser windows/tabs
2. Log in as different users

### Test Steps
1. Window 1: Start collaboration, wait in lobby
2. Window 2: Join via invite/code, see lobby
3. Window 1: Click "Start Collaboration"
4. Window 2: Should immediately exit lobby

### Success Criteria
✅ Same behavior as Scenario 1
✅ No regression from previous working state

## Test Scenario 3: Join After Session Started (Edge Case)

### Setup
1. Phone + Laptop as before

### Test Steps
1. Phone (Host): Start collaboration, immediately click "Start Collaboration"
2. Laptop (Participant): Now join via code
3. **Expected**: Should bypass lobby and enter collaboration directly

### Success Criteria
✅ Participant never sees lobby
✅ Joins directly into active collaboration session

## Debugging

### Backend Logs to Check
Look for these in your Django console:

```
✅ Sent session_started message to collaboration group: collab_{session_id}
✅ session_started handler called: {...}
```

### Frontend Console Logs (Participant)
Open browser DevTools, look for:

```
🔌 Setting up collaboration event handlers for session: {id}
✅ Registering all event handlers NOW
✅ All event handlers registered
🔌 Connecting to collaboration session: {id}
✅ Connected to collaboration session
🎉 Session started message received from WebSocket: {...}
✅ Closing lobby and starting collaboration NOW
```

### If Participant Still Stuck

1. **Check Backend Logs**:
   - Is "Sent session_started message" appearing?
   - Is "session_started handler called" appearing?

2. **Check Frontend Console**:
   - Is "All event handlers registered" appearing BEFORE connection?
   - Is "Session started message received" appearing?

3. **Check WebSocket Connection**:
   - In DevTools Network tab, filter by WS (WebSocket)
   - Verify connection is established
   - Check frames for "session_started" message

### Common Issues

**Issue**: "Cannot resolve keyword 'invitee'"
**Solution**: Backend not restarted - restart Django server

**Issue**: Participant sees no WebSocket messages
**Solution**: Check custom API URL is correct, firewall not blocking WebSocket

**Issue**: "403 Forbidden" on presence endpoint
**Solution**: Backend code not updated properly

## Reporting Results

Please test and report:
1. ✅/❌ Scenario 1 (Custom API URL on mobile) - MAIN TEST
2. ✅/❌ Scenario 2 (Browser to browser)
3. ✅/❌ Scenario 3 (Join after started)
4. Console logs if any issues
5. Any unexpected behavior

## Quick Verification Script

You can also check the code changes were applied:

```bash
# Check backend changes
grep -n "session_started" backend/storybook/views.py
grep -n "async def session_started" backend/storybook/consumers.py

# Check frontend changes  
grep -n "Registering all event handlers NOW" frontend/src/pages/ManualStoryCreationPage.tsx
```

Should show the new code at the correct line numbers.
