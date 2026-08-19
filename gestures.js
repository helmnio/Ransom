(() => {
  const hand = document.getElementById('hand');
  if (!hand) return;

  const SWIPE_UP = 58;
  const HORIZONTAL_INTENT = 12;
  let drag = null;

  function cards() { return [...hand.querySelectorAll('.playing-card')]; }

  function cardCenter(el) {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2;
  }

  function reorderDOM(el, x) {
    const others = cards().filter(c => c !== el);
    const before = others.find(c => x < cardCenter(c));
    if (before) hand.insertBefore(el, before);
    else hand.appendChild(el);
  }

  function syncGameOrder() {
    if (!window.ransomGame || !Array.isArray(window.ransomGame.hand)) return;
    const ids = cards().map(c => c.dataset.id);
    const byId = new Map(window.ransomGame.hand.map(c => [c.id, c]));
    window.ransomGame.hand = ids.map(id => byId.get(id)).filter(Boolean);
  }

  hand.addEventListener('pointerdown', e => {
    const card = e.target.closest('.playing-card');
    if (!card) return;
    drag = {
      card,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      mode: null
    };
    card.setPointerCapture(e.pointerId);
    card.classList.add('dragging');
  });

  hand.addEventListener('pointermove', e => {
    if (!drag || drag.pointerId !== e.pointerId) return;
    drag.dx = e.clientX - drag.startX;
    drag.dy = e.clientY - drag.startY;

    if (!drag.mode && (Math.abs(drag.dx) > HORIZONTAL_INTENT || Math.abs(drag.dy) > HORIZONTAL_INTENT)) {
      drag.mode = Math.abs(drag.dy) > Math.abs(drag.dx) && drag.dy < 0 ? 'discard' : 'reorder';
    }

    if (drag.mode === 'discard') {
      drag.card.style.transform = `translateY(${Math.min(0, drag.dy)}px) rotate(${drag.dx * .025}deg)`;
      drag.card.style.opacity = String(Math.max(.35, 1 + drag.dy / 180));
    } else if (drag.mode === 'reorder') {
      drag.card.style.transform = `translateX(${drag.dx * .35}px) translateY(-8px)`;
      reorderDOM(drag.card, e.clientX);
    }
  });

  function finish(e) {
    if (!drag || drag.pointerId !== e.pointerId) return;
    const { card, dy, mode } = drag;
    drag = null;
    card.classList.remove('dragging');
    card.style.opacity = '';
    card.style.transform = '';

    if (mode === 'discard' && dy <= -SWIPE_UP) {
      card.dispatchEvent(new CustomEvent('ransom-discard-up', { bubbles: true }));
      return;
    }
    syncGameOrder();
  }

  hand.addEventListener('pointerup', finish);
  hand.addEventListener('pointercancel', finish);
})();