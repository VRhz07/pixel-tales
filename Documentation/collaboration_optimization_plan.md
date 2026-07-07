# Real-Time Collaboration: Production Optimization Plan

This document outlines the architectural flaws in the current local-first collaboration implementation and provides a step-by-step technical guide for a Senior Engineer to optimize the feature for a production environment.

## 1. Current Architecture & Limitations

### The `InMemoryChannelLayer` Problem
Currently, `settings.py` uses Django Channels' `InMemoryChannelLayer` with a strict capacity of `50`. 
* **Worker Isolation:** `InMemory` does not share memory across different server processes. If the production backend scales to multiple ASGI workers (e.g., via Gunicorn/Uvicorn), users assigned to different workers will not be able to sync their drawing sessions.
* **Message Dropping:** A drawing canvas fires `mousemove` and `touchmove` events rapidly. A capacity of 50 is filled in roughly 0.8 seconds. When the channel layer is full, it throws `ChannelFull` exceptions, resulting in dropped strokes and stuttering.

---

## 2. Phase 1: Backend Optimization (Redis Integration)

**Objective:** Enable cross-process communication and increase channel capacity.

### Step 1.1: Re-enable Redis Channel Layer
Replace the `InMemoryChannelLayer` in `backend/storybookapi/settings.py` with `RedisChannelLayer`.

```python
# backend/storybookapi/settings.py

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv('REDIS_URL', 'redis://localhost:6379')],
            # Increase capacity to prevent dropped strokes
            "capacity": 1500, 
            "expiry": 60,
        },
    },
}
```

### Step 1.2: Environment Configuration
Ensure your production environment (Render/DigitalOcean) has a Redis instance attached, and the `REDIS_URL` environment variable is correctly set.

---

## 3. Phase 2: Frontend Optimization (Throttling & Batching)

**Objective:** Reduce WebSocket payload frequency to save bandwidth and server memory.

### Step 2.1: Implement Throttling
Do not broadcast every single `mousemove` event. Instead, use a throttle mechanism (e.g., `lodash/throttle` or `requestAnimationFrame`) to send updates at a fixed frame rate (e.g., 20-30 FPS).

```typescript
// Example Implementation
import { throttle } from 'lodash';

// Only broadcast every 50ms (20fps)
const broadcastDrawingEvent = throttle((eventData) => {
    collaborationService.send({
        type: 'draw_event',
        data: eventData
    });
}, 50);
```

### Step 2.2: Batch Drawing Coordinates
Instead of sending individual points `{"x": 10, "y": 10}`, accumulate points in an array while the user is actively drawing a stroke, and send the batch payload.

```typescript
// Example Payload Structure
{
    "type": "draw_batch",
    "strokeId": "unique-stroke-123",
    "points": [
        {"x": 10, "y": 12},
        {"x": 11, "y": 14},
        {"x": 15, "y": 20}
    ],
    "color": "#FF0000",
    "brushSize": 5
}
```

---

## 4. Phase 3: Advanced State Synchronization (Optional but Recommended)

**Objective:** Prevent canvases from going permanently out of sync due to network drops.

Currently, the system relies on blind "Event Broadcasting" (fire and forget). If a user briefly disconnects, they miss strokes permanently. 

### Step 3.1: Implement CRDTs (Conflict-free Replicated Data Types)
For professional-grade collaboration (similar to Figma or Google Docs), integrate a CRDT library like **Yjs** (`yjs` + `y-websocket`).
* **Why:** Yjs treats the canvas data as a shared state. It automatically handles mathematical conflict resolution and offline syncing. If a user disconnects, Yjs will automatically fetch the missing strokes upon reconnection without requiring complex manual merge logic on the backend.

## 5. Summary Checklist for Implementation

- [ ] Provision a Redis database instance in your cloud provider.
- [ ] Update `CHANNEL_LAYERS` in `settings.py` to use `channels_redis`.
- [ ] Increase channel `capacity` to at least 1500.
- [ ] Add `lodash` (if not present) and implement throttling on canvas `mousemove` events in `ManualStoryCreationPage.tsx` and `CoverImageCanvasPage.tsx`.
- [ ] Refactor WebSocket payloads to send arrays of points (batching) instead of single coordinates.
- [ ] (Future) Research `Yjs` integration for bulletproof offline/reconnect syncing.
