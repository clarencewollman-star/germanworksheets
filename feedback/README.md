# Feedback inbox

Visitors use **Feedback / Report a bug** in the sidebar. Only the message is required. Screenshots are optional PNG/JPG/WebP, at most 5 MB and 16 megapixels; metadata is removed. Page path and release version accompany the message. No email is sent by the server.

## Deploy

Before updating the container, set `FEEDBACK_ADMIN_USER` (default `admin`) and a long, unique `FEEDBACK_ADMIN_PASSWORD` in your deployment environment. Compose reads these from an untracked `.env` beside compose.yaml. Never commit credentials.

Mount a persistent Docker volume at `/data`. The supplied compose.yaml uses `feedback-data`. Preserve this volume when updating/recreating the container; removing it deletes all feedback. Backups are deferred.

Bookmark `https://germanworksheets.com/admin`. It is not linked from site navigation and requires login. HTTPS is required for the production login cookie. Messages and screenshots require authentication. Sessions expire after 12 hours. To revoke all sessions immediately, restart the container (including after changing credentials).

The inbox shows unread count and offers read/unread, New/In progress/Resolved, permanent deletion, and an Email sender link that opens your own mail app. No notifications or outgoing email service are configured.

The API is loopback-only behind nginx. Submission limits are 12/hour/IP, and login limits are 10/15 minutes/IP. A reverse proxy may make multiple visitors share a rate-limit bucket; do not blindly trust client-supplied forwarded IP headers.

## Local preview

Install Python and Pillow, set `FEEDBACK_ADMIN_PASSWORD`, and run `python feedback/local.py`. Open `http://127.0.0.1:8080` and `/admin`. Local preview uses `tmp/feedback-local` and disables secure cookies for localhost only. Static file previews cannot send feedback.

Run `python feedback/test_server.py` for isolated API tests. Production uses nginx plus the Python API in one container, supervised so a failed process stops the container for restart.
