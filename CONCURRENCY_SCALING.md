# PixelTales: Concurrency & Scaling Architecture

This document outlines how PixelTales handles concurrent users (multiple users using the app simultaneously), the potential bottlenecks during beta testing, and the roadmap for scaling the architecture to support thousands of users.

## 1. The Current Architecture (Beta Phase)

PixelTales is currently deployed as a **React Frontend** backed by a **Django Backend**, integrating with several AI APIs (Groq, Gemini, Replicate).

### What Works Well:
*   **User Isolation:** Because the frontend is a client-side React application, each user runs their own copy of the app. User state (like form data, UI progress bars) is completely isolated.
*   **Database Writes:** The Django backend uses a relational database (PostgreSQL/SQLite) which safely handles concurrent reads and writes. If two users save a story at the exact same millisecond, the database handles the transaction locking automatically.
*   **Pollinations AI (Images):** Since Pollinations is called directly from the user's browser, requests originate from different IP addresses. This avoids central IP rate-limiting, allowing for highly concurrent (and free) image generation.

### The Bottleneck: API Rate Limits (Error 429)
The primary risk during beta testing is hitting **API Rate Limits** on premium providers (Groq, Gemini, Replicate).
*   **The Issue:** If your Groq API key allows 30 requests per minute (RPM), and 35 beta testers generate a story in the same minute, the first 30 will succeed. The remaining 5 will receive an HTTP `429 Too Many Requests` or `Resource Exhausted` error.
*   **Current Mitigation:** We have implemented graceful error handling in the UI (`AIStoryModal.tsx` and `PhotoStoryModal.tsx`). If the app detects a `429` error, it intercepts the generic error and shows a friendly alert: *"Wow, a lot of people are writing stories right now! 😅 Our servers are a bit overwhelmed. Please wait about 30-60 seconds and click Generate again."*

---

## 2. Roadmap: How to Properly Solve Concurrency Issues

To scale from a beta test to a production environment with thousands of users, the application architecture must evolve from **synchronous, blocking API calls** to **asynchronous, queued processing**.

### Phase 1: Implement Backend Message Queuing (Recommended)
Instead of the React frontend making users wait 15+ seconds while it talks to the AI, the process should be asynchronous:
1.  **The Queue:** Implement a message broker like **Redis** or **RabbitMQ** on your backend.
2.  **The Worker:** Use a task queue library like **Celery** (since you use Django).
3.  **The Flow:**
    *   User clicks "Generate Story".
    *   Frontend sends a request to Django: *"Start generation task for User A"*.
    *   Django puts the task in the Celery queue and immediately returns a `task_id` to the frontend.
    *   Celery workers process the queue one-by-one. You can enforce a rate limit here (e.g., "Process max 30 stories per minute") so you **never** hit the `429` error.
    *   The frontend polls the backend (e.g., every 3 seconds: *"Is task_id finished?"*) or uses WebSockets to show progress until the story is ready.

### Phase 2: Enterprise API Tiers & Load Balancing
*   **Upgrade API Tiers:** Move from free/developer tiers to Pay-as-you-go or Enterprise tiers on Groq, Replicate, and Gemini to drastically increase your Tokens Per Minute (TPM) and Requests Per Minute (RPM) limits.
*   **Multiple API Keys (Key Rotation):** If strict limits still apply, the backend can be configured with an array of API keys, rotating through them for each new request to distribute the load.

### Phase 3: Proxying Image Generation
Currently, Pollinations AI is called from the frontend. While this avoids rate limits, it exposes the generation logic. For premium models like Replicate:
*   **Backend Proxy:** All premium AI requests MUST go through the Django backend. This ensures your Replicate API key is never exposed to the browser, and allows you to enforce user-specific quotas (e.g., "Free users get 5 premium images per day").

---

## Summary for Beta Launch
For the immediate beta launch, the system is perfectly safe. Data will not mix between users. The only noticeable side-effect of high concurrency will be API rate limits, which are now handled gracefully by asking the user to try again in a few seconds. As the user base grows, migrating to a Celery/Redis queue system will be the permanent solution.
