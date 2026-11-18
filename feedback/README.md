# Feedback inbox

Visitors use the sidebar feedback button. Only the message is required. Screenshots are optional PNG/JPG/WebP, at most 5 MB and 16 megapixels. Metadata is removed. Page path and release version accompany the message.

## First setup in Arcane

Deploy the latest image with the supplied compose.yaml. No username/password environment variables are required. Keep the persistent feedback-data volume mounted at /data.

1. Start the project and open the worksheets container logs.
2. Copy the line labeled `German Worksheets admin setup code`.
3. Open https://germanworksheets.com/admin and enter the code, your chosen username, and a password of at least 15 characters.
4. Sign in. Use Account settings to change your username and password later. The current password is required; saving signs out every session.

The code is random, valid for 24 hours, and usable once. Restarting before setup generates a new code and invalidates the old one. After setup, no more setup codes are issued. Only a hash of the setup code and a salted scrypt password hash are stored. Protect access to container logs until setup is complete.

Existing FEEDBACK_ADMIN_USER/FEEDBACK_ADMIN_PASSWORD values are imported only when no account exists. They do not override later website password changes. Restarting signs out sessions but preserves the account and messages. Secure cookies require HTTPS in production; sessions expire after 12 hours.

Preserve the volume when updating. Removing it deletes the account and messages. Backups and forgotten-password recovery are not yet implemented; keep your password in a password manager.

The inbox supports unread count, status, permanent deletion, and an Email sender link to your mail app. No server email or notifications are configured.

## Local development

Install Python and Pillow, then run `python feedback/local.py`. Open http://127.0.0.1:8080/admin and use the code printed in the terminal. Local data is in tmp/feedback-local. Static file previews cannot send feedback.

Run `python feedback/test_server.py` and `python feedback/test_setup.py`. Production runs the loopback API behind nginx with a process supervisor. Submission limits: 12/hour/IP; login, setup and password-change attempts: 10/15 minutes/IP. Reverse-proxy users can share a rate-limit bucket.
