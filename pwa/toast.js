import { translate } from './i18n.js';

// A small queue keeps simultaneous rewards from replacing one another.
export function createToastQueue(render, { schedule = setTimeout, cancel = clearTimeout, now = Date.now } = {}) {
  let active = null, timer, remaining = 0, started = 0;
  const pending = [], paused = new Set();
  const stop = () => { cancel(timer); timer = undefined; };
  const resumeTimer = () => {
    if (!active || active.type === 'error' || paused.size) return;
    started = now();
    timer = schedule(dismiss, remaining);
  };
  function next() {
    active = pending.shift() || null;
    remaining = 5000;
    render(active);
    resumeTimer();
  }
  function dismiss() { stop(); next(); }
  return {
    push(text, type = 'info') {
      if (!text || active?.text === text || pending.some(item => item.text === text)) return;
      const item = { text, type: ['success', 'info', 'error'].includes(type) ? type : 'info' };
      if (pending.length >= 5) {
        if (item.type !== 'error') return;
        const expendable = pending.findIndex(item => item.type !== 'error');
        if (expendable >= 0) pending.splice(expendable, 1);
      }
      pending.push(item);
      if (!active) next();
    },
    dismiss,
    pause(reason) {
      if (!paused.size && timer !== undefined) {
        remaining = Math.max(0, remaining - (now() - started));
        stop();
      }
      paused.add(reason);
    },
    resume(reason) { if (paused.delete(reason) && !paused.size) resumeTimer(); },
  };
}

export const noticeType = text => /could not|failed|unavailable|^Connect to the internet|^Hindi |^Walang /i.test(text) ? 'error'
  : /^(Saved|Nickname saved|Buddy look saved|New sticker|New buddy extra|HIPOS is installed|Your week image|You have the latest)/.test(text) ? 'success' : 'info';

export function initToasts() {
  const source = document.querySelector('#notice');
  const host = document.createElement('div');
  host.className = 'toast-host';
  host.setAttribute('popover', 'manual');
  host.innerHTML = `<div class="toast-card"><span class="toast-buddy" aria-hidden="true"><svg viewBox="0 0 48 48" width="44" height="44"><path d="M24 43C5 39 4 12 37 5c12 27 3 38-13 38Z" fill="currentColor"/><path d="m22 43 8-27" fill="none" stroke="var(--surface)" stroke-width="2" opacity=".55"/><g fill="#173D2C"><circle cx="19" cy="24" r="2"/><circle cx="31" cy="24" r="2"/></g><path d="M22 30q3 4 6 0" fill="none" stroke="#173D2C" stroke-width="2" stroke-linecap="round"/><g fill="#ED9F91"><ellipse cx="15" cy="29" rx="3" ry="2"/><ellipse cx="34" cy="29" rx="3" ry="2"/></g></svg></span><div class="toast-copy"><strong class="toast-label"></strong><div class="toast-text" role="status" aria-live="polite" aria-atomic="true"></div></div><button type="button" class="toast-close" aria-label="Dismiss notification"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>`;
  const card = host.querySelector('.toast-card'), text = host.querySelector('.toast-text');
  const label = host.querySelector('.toast-label'), close = host.querySelector('button');
  let visible = false, previousFocus;
  function place() {
    const parent = [...document.querySelectorAll('dialog[open]')].at(-1) || document.body;
    if (host.parentElement !== parent) {
      if (host.matches(':popover-open')) host.hidePopover();
      parent.append(host);
    }
    if (visible && host.showPopover && !host.matches(':popover-open')) host.showPopover();
  }
  const queue = createToastQueue(item => {
    visible = Boolean(item);
    host.hidden = !item;
    if (!item) {
      text.textContent = '';
      if (host.matches(':popover-open')) host.hidePopover();
      queue.resume('pointer');
      queue.resume('focus');
      return;
    }
    card.dataset.type = item.type;
    label.textContent = translate(item.type === 'error' ? 'A little hiccup' : item.type === 'success' ? 'Lovely!' : 'A little heads-up');
    close.setAttribute('aria-label', translate('Dismiss notification'));
    // Recreate the text node so an identical message can be announced again after dismissal.
    text.replaceChildren(document.createTextNode(item.text));
    place();
  });
  host.hidden = true;
  place();
  close.addEventListener('click', () => {
    queue.dismiss();
    if (host.hidden && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  host.addEventListener('pointerenter', () => queue.pause('pointer'));
  host.addEventListener('pointerleave', () => queue.resume('pointer'));
  host.addEventListener('focusin', event => {
    if (!host.contains(event.relatedTarget)) previousFocus = event.relatedTarget;
    queue.pause('focus');
  });
  host.addEventListener('focusout', event => { if (!host.contains(event.relatedTarget)) queue.resume('focus'); });
  document.addEventListener('visibilitychange', () => document.hidden ? queue.pause('hidden') : queue.resume('hidden'));
  if (document.hidden) queue.pause('hidden');
  // Keep existing settings modules using #notice working without duplicate announcements.
  source.hidden = true;
  source.removeAttribute('role');
  source.removeAttribute('aria-live');
  source.setAttribute('data-no-translate', '');
  const read = () => { const message = source.textContent.trim(); if (message) queue.push(message, noticeType(message)); };
  new MutationObserver(read).observe(source, { childList: true, characterData: true, subtree: true });
  new MutationObserver(place).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  read();
  return queue;
}
