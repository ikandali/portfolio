(function theme(){
  const root=document.documentElement, btn=document.getElementById('themeBtn');
  if(localStorage.getItem('theme')==='dark' || (!localStorage.getItem('theme') && matchMedia('(prefers-color-scheme: dark)').matches))
    root.classList.add('dark');
  btn&&btn.addEventListener('click',()=>{
    root.classList.toggle('dark');
    localStorage.setItem('theme', root.classList.contains('dark')?'dark':'light');
  });
})();

(function menu(){
  const nav=document.getElementById('nav'), btn=document.getElementById('menuBtn');
  if(!btn) return;
  btn.addEventListener('click',()=>nav.classList.toggle('open'));
  window.addEventListener('click', e=>{ if(!nav.contains(e.target) && e.target!==btn) nav.classList.remove('open');});
})();

(function scrollReveal(){
  const els=document.querySelectorAll('.sr');
  const io=new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('show'); io.unobserve(en.target);} });
  },{threshold:.15});
  els.forEach(el=>io.observe(el));
})();

(function activeLinks(){
  const links=[...document.querySelectorAll('.links a')];
  const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io=new IntersectionObserver(entries=>{
    const vis=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!vis) return;
    links.forEach(l=>l.classList.remove('active'));
    const act=links.find(l=>l.getAttribute('href')==='#'+vis.target.id);
    act&&act.classList.add('active');
  },{threshold:[0.3,0.6], rootMargin:'-10% 0px -70% 0px'});
  sections.forEach(s=>io.observe(s));
})();

/* Carousels + fullscreen modal */
(function(){
  const modal=document.getElementById('imageModal');
  const modalImg=document.getElementById('modalImage');
  const modalClose=modal?.querySelector('.modal-close');
  const modalPrev=modal?.querySelector('.modal-nav.prev');
  const modalNext=modal?.querySelector('.modal-nav.next');

  let currentSlides=null;
  let currentIndex=0;

  function openModal(slides, idx){
    currentSlides=slides;
    currentIndex=idx;
    setModalImage();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    modalImg.focus();
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    modalImg.removeAttribute('src');
    currentSlides=null;
  }
  function setModalImage(){
    if(!currentSlides) return;
    const slide=currentSlides[currentIndex];
    const img=slide.querySelector('img');
    if(img){
      modalImg.src=img.src;
      modalImg.alt=img.alt||'Project image';
    }
  }
  function step(dir){
    if(!currentSlides) return;
    currentIndex=(currentIndex+dir+currentSlides.length)%currentSlides.length;
    setModalImage();
  }

  document.querySelectorAll('#projects .carousel').forEach(root=>{
    const slides=[...root.querySelectorAll('.slide')];
    if(!slides.length) return;

    // Dots container (rebuild if missing)
    let dotsWrap=root.querySelector('.dots');
    if(!dotsWrap){
      dotsWrap=document.createElement('div');
      dotsWrap.className='dots';
      root.appendChild(dotsWrap);
    }
    if(!dotsWrap.children.length){
      dotsWrap.innerHTML=slides.map((_,i)=>`<span class="dot${i===0?' active':''}" data-i="${i}"></span>`).join('');
    }
    const dots=[...dotsWrap.querySelectorAll('.dot')];

    let idx=0;
    slides[0].classList.add('active');
    function go(n){
      idx=(n+slides.length)%slides.length;
      slides.forEach((s,i)=>s.classList.toggle('active', i===idx));
      dots.forEach((d,i)=>d.classList.toggle('active', i===idx));
    }

    const prev=root.querySelector('.prev');
    const next=root.querySelector('.next');
    prev&&prev.addEventListener('click',()=>{go(idx-1);});
    next&&next.addEventListener('click',()=>{go(idx+1);});
    dotsWrap.addEventListener('click',e=>{
      const d=e.target.closest('.dot');
      if(d) go(+d.dataset.i);
    });

    // Autoplay if data-autoplay > 0
    const delay=+root.dataset.autoplay||0;
    if(delay>0){
      let t=setInterval(()=>go(idx+1),delay);
      root.addEventListener('pointerenter',()=>clearInterval(t));
      root.addEventListener('pointerleave',()=>{ t=setInterval(()=>go(idx+1),delay); });
      document.addEventListener('visibilitychange',()=>{ if(document.hidden) clearInterval(t); else if(!root.matches(':hover')) t=setInterval(()=>go(idx+1),delay); });
    }

    // Image click -> open modal
    slides.forEach((sl,i)=>{
      const img=sl.querySelector('img');
      if(!img) return;
      img.style.cursor='zoom-in';
      img.addEventListener('click',()=>openModal(slides,i));
    });
  });

  if(modal){
    modalClose?.addEventListener('click', closeModal);
    modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
    modalPrev?.addEventListener('click',()=>step(-1));
    modalNext?.addEventListener('click',()=>step(1));
    window.addEventListener('keydown',e=>{
      if(!modal.classList.contains('open')) return;
      if(e.key==='Escape') closeModal();
      else if(e.key==='ArrowRight') step(1);
      else if(e.key==='ArrowLeft') step(-1);
    });
  }
})();

// Enhanced copy-to-clipboard for email button
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.copy-email').forEach(btn => {
    btn.addEventListener('click', function() {
      const email = btn.dataset.email;
      navigator.clipboard.writeText(email).then(() => {
        const tip = btn.querySelector('.copy-tip');
        tip.textContent = 'Copied!';
        tip.classList.add('copied');
        setTimeout(() => {
          tip.textContent = 'Copy';
          tip.classList.remove('copied');
        }, 1500);
      });
    });
  });
});

// Let's Talk form (mailto approach)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('talkForm');
  if(!form) return;
  const nameEl = form.querySelector('#tName');
  const emailEl = form.querySelector('#tEmail');
  const msgEl = form.querySelector('#tMsg');
  const status = document.getElementById('talkStatus');

  function setErr(el,msg){
    form.querySelector(`.err[data-for='${el.id}']`).textContent=msg||'';
  }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    status.textContent='';
    status.className='form-status';
    let ok=true;

    // honeypot
    if(form.website && form.website.value.trim()!==''){ return; }

    if(!nameEl.value.trim()){ setErr(nameEl,'Required'); ok=false; } else setErr(nameEl,'');
    const ev=emailEl.value.trim();
    if(!ev){ setErr(emailEl,'Required'); ok=false; }
    else if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ev)){ setErr(emailEl,'Invalid'); ok=false; }
    else setErr(emailEl,'');
    if(!msgEl.value.trim()){ setErr(msgEl,'Required'); ok=false; } else setErr(msgEl,'');

    if(!ok){
      status.textContent='Please fix the errors.';
      status.classList.add('err');
      return;
    }

    const subject='Portfolio inquiry';
    const body=`Name: ${nameEl.value.trim()}\nEmail: ${ev}\n\n${msgEl.value.trim()}`;
    const mailto=`mailto:imkandali@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Trigger mail client
    window.location.href=mailto;

    status.textContent='Opening your email client... If it did not open, you can copy the text.';
    status.classList.add('ok');
  });

  form.addEventListener('reset', ()=>{
    status.textContent='';
    status.className='form-status';
    form.querySelectorAll('.err').forEach(e=>e.textContent='');
  });
});

