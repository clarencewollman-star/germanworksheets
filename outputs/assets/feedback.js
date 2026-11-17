(() => {
  const menu = document.querySelector('#gw-sidebar .sidebar-menu');
  if (!menu) return;
  const item = document.createElement('li');
  item.className = 'nav-item feedback-nav-item';
  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'btn btn-primary feedback-nav-button';
  open.textContent = 'Suggestions, Feedback & Bug Reports';
  item.append(open);
  menu.append(item);

  const dialog = document.createElement('dialog');
  dialog.className = 'feedback-dialog';
  dialog.setAttribute('aria-labelledby', 'feedback-title');
  dialog.innerHTML = `<form id="feedback-form">
    <div class="feedback-heading"><h2 id="feedback-title">Suggestions, Feedback<br>&amp; Bug Reports</h2><button type="button" id="feedback-close" aria-label="Close feedback">×</button></div>
    <div class="feedback-fields">
    <label for="feedback-message">Message</label><textarea id="feedback-message" class="form-control" rows="5" maxlength="10000" placeholder="Share an idea or tell us what went wrong…" required></textarea>
    <div class="feedback-contact"><div><label for="feedback-name">Name</label><input id="feedback-name" class="form-control" maxlength="120" autocomplete="name"></div>
    <div><label for="feedback-email">Email</label><input id="feedback-email" class="form-control" type="email" maxlength="254" autocomplete="email"></div></div>
    <label for="feedback-image">Screenshot</label><input id="feedback-image" class="form-control" type="file" accept="image/png,image/jpeg,image/webp">
    <p class="feedback-note">PNG, JPG or WebP · up to 5 MB</p>
    <div hidden><label for="feedback-website">Website</label><input id="feedback-website" tabindex="-1" autocomplete="off"></div>
    <p id="feedback-status" role="status" aria-live="polite"></p></div>
    <div class="feedback-footer"><span>Your page and website version are included.</span><button id="feedback-send" class="btn btn-primary" type="submit">Send message</button></div>
  </form>`;
  document.body.append(dialog);
  const field = id => dialog.querySelector('#feedback-' + id);
  open.addEventListener('click', () => {
    dialog.showModal();
    field('message').focus();
  });
  field('close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => open.focus());
  field('form').addEventListener('submit', async event => {
    event.preventDefault();
    const send = field('send'), status = field('status');
    send.disabled = true;
    status.textContent = 'Sending…';
    try {
      if (location.protocol === 'file:') throw new Error('Feedback needs the running website. Open the local server or germanworksheets.com to send it.');
      const file = field('image').files[0];
      let screenshot = '';
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Choose a screenshot smaller than 5 MB.');
        screenshot = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error('Could not read this screenshot. Please choose it again.'));
          reader.readAsDataURL(file);
        });
      }
      const response = await fetch('/api/feedback/submit', {
        method: 'POST', headers: {'Content-Type':'application/json', 'X-Feedback-Request':'1'},
        body: JSON.stringify({message:field('message').value, name:field('name').value,
          email:field('email').value, screenshot, website:field('website').value,
          page:location.pathname, version:window.GermanWorksheetsVersion || ''})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not send your feedback.');
      field('form').reset();
      status.textContent = 'Thank you. Your feedback has been sent.';
    } catch (error) {
      status.textContent = error instanceof TypeError ? 'Could not connect. Your message is still here; please try again.' : error.message;
    } finally { send.disabled = false; }
  });
})();
