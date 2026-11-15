(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const pageIndicator = document.getElementById('page-indicator');
  const slideCounter = document.getElementById('slide-counter');
  const progressBar = document.getElementById('progress-bar');
  const overviewBtn = document.getElementById('overview-btn');
  const notesBtn = document.getElementById('notes-btn');
  const fsBtn = document.getElementById('fs-btn');
  const openOverviewFromEnd = document.getElementById('open-overview-from-end');
  const closeOverviewBtn = document.getElementById('close-overview-btn');
  const overviewModal = document.getElementById('overview-modal');
  const overviewGrid = document.getElementById('overview-grid');
  const restartBtn = document.getElementById('restart-btn');

  let current = 0;
  let touchStartX = 0;
  let notesWindow = null;

  /**
   * 지정한 번호의 슬라이드로 이동하고 화면 상태를 갱신합니다.
   * @param {number} index - 이동할 슬라이드 번호 (0부터 시작)
   */
  function goTo(index) {
    const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === safeIndex);
    });
    current = safeIndex;

    updateProgress();
    updateCounter();
    updateNotes();
    updateOverviewHighlight();
    history.replaceState(null, '', `#${current + 1}`);

    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === slides.length - 1;
  }

  function nextSlide() {
    if (current < slides.length - 1) {
      goTo(current + 1);
    }
  }

  function prevSlide() {
    if (current > 0) {
      goTo(current - 1);
    }
  }

  function updateProgress() {
    const pct = ((current + 1) / slides.length) * 100;
    progressBar.style.width = `${pct}%`;
  }

  function updateCounter() {
    const text = `${current + 1} / ${slides.length}`;
    if (slideCounter) slideCounter.textContent = text;
    if (pageIndicator) pageIndicator.textContent = text;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  /**
   * 발표자 노트를 별도 팝업 창으로 열거나 닫습니다.
   */
  function toggleNotes() {
    if (notesWindow && !notesWindow.closed) {
      notesWindow.close();
      notesWindow = null;
      return;
    }
    notesWindow = window.open('', 'SpeakerNotes', 'width=520,height=420,top=80,left=80');
    if (!notesWindow) return;

    notesWindow.document.write(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>발표자 노트</title><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
         background: #fef7f0; color: #2d2d2d; padding: 26px; }
  .slide-num { font-size: 13px; color: #ff6b6b; font-weight: 700; margin-bottom: 10px; }
  .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
           color: #777777; margin-bottom: 10px; font-weight: 700; }
  .notes { font-size: 17px; line-height: 1.8; color: #2d2d2d; background: #ffffff;
           padding: 18px 20px; border-radius: 16px; border: 1.5px solid #f0e0d0; }
</style></head><body>
  <div class="slide-num" id="sn"></div>
  <div class="label">Speaker Notes</div>
  <div class="notes" id="nt"></div>
</body></html>`);
    notesWindow.document.close();
    updateNotes();
  }

  function updateNotes() {
    if (!notesWindow || notesWindow.closed) return;
    try {
      const note = slides[current].dataset.notes || '(발표자 노트가 없습니다)';
      notesWindow.document.getElementById('nt').textContent = note;
      notesWindow.document.getElementById('sn').textContent =
        `Slide ${current + 1} / ${slides.length} — ${slides[current].dataset.title || ''}`;
    } catch (e) {}
  }

  /**
   * 전체 슬라이드 목차 모달의 카드를 생성합니다.
   */
  function buildOverview() {
    overviewGrid.innerHTML = '';
    slides.forEach((slide, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'overview-item';
      btn.innerHTML = `
        <span>${idx + 1}번 슬라이드</span>
        <strong>${slide.dataset.title || `슬라이드 ${idx + 1}`}</strong>
      `;
      btn.addEventListener('click', () => {
        goTo(idx);
        closeOverview();
      });
      overviewGrid.appendChild(btn);
    });
    updateOverviewHighlight();
  }

  function updateOverviewHighlight() {
    const items = overviewGrid.querySelectorAll('.overview-item');
    items.forEach((item, idx) => {
      item.classList.toggle('is-current', idx === current);
    });
  }

  function openOverview() {
    overviewModal.hidden = false;
    updateOverviewHighlight();
  }

  function closeOverview() {
    overviewModal.hidden = true;
  }

  function readHashIndex() {
    const hash = window.location.hash;
    if (hash && /^#\d+$/.test(hash)) {
      const idx = parseInt(hash.substring(1), 10) - 1;
      if (idx >= 0 && idx < slides.length) return idx;
    }
    return 0;
  }

  // 버튼 이벤트 연결
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  fsBtn?.addEventListener('click', toggleFullscreen);
  notesBtn?.addEventListener('click', toggleNotes);
  overviewBtn.addEventListener('click', openOverview);
  openOverviewFromEnd?.addEventListener('click', openOverview);
  closeOverviewBtn.addEventListener('click', closeOverview);
  restartBtn?.addEventListener('click', () => goTo(0));

  // 키보드 조작
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (!overviewModal.hidden) {
      if (e.key === 'Escape') {
        closeOverview();
      }
      return;
    }

    const key = e.key.toLowerCase();
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      if (e.key === ' ' && e.shiftKey) prevSlide();
      else nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(slides.length - 1);
    } else if (key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (key === 's') {
      e.preventDefault();
      toggleNotes();
    } else if (key === 'o') {
      e.preventDefault();
      openOverview();
    }
  });

  // 모바일 터치 스와이프
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    goTo(readHashIndex());
  });

  // 초기화
  buildOverview();
  goTo(readHashIndex());
})();
