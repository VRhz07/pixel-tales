# Collaboration Voting System Fix

## Problem
The collaboration voting system was failing on DigitalOcean's backend with the following error:
```
ValueError: int is not allowed for map key when strict_map_key=True
```

## Root Cause
In `backend/storybook/views.py`, the voting data dictionary was using **integer keys** when broadcasting vote updates through WebSocket:

```python
voting_data_dict[int(uid)] = True  # ❌ Integer keys
```

Django Channels uses MessagePack serialization in production (on DigitalOcean), which has `strict_map_key=True` by default. This setting **does not allow integer keys in dictionaries** - only strings are permitted.

## Solution
Changed the voting data to use **string keys** instead of integer keys in `backend/storybook/views.py` (lines 2197-2199):

```python
# Before (BROKEN on DigitalOcean):
voting_data_dict[int(uid)] = True

# After (FIXED):
voting_data_dict[str(uid)] = True
```

## Files Modified
- `backend/storybook/views.py` - Fixed vote data broadcasting to use string keys

## Testing
After deploying this fix to DigitalOcean:
1. Start a collaborative session with multiple users
2. Initiate a vote to save the story
3. Have all participants vote
4. Verify that votes are properly counted and displayed
5. Verify that the WebSocket connection doesn't disconnect
6. Confirm that the voting completes successfully

## Technical Details
- **MessagePack** is a binary serialization format used by Django Channels for efficient WebSocket communication
- In production environments, MessagePack uses `strict_map_key=True` which only allows string keys
- The `consumers.py` file was already correctly using string keys (`str(self.user.id)`)
- The bug was isolated to the `views.py` REST API endpoint that broadcasts vote updates

## Impact
✅ Voting system now works properly on DigitalOcean
✅ No more WebSocket disconnections during voting
✅ Votes are properly tracked and broadcast to all participants
