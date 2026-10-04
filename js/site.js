(() => {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const menu = document.querySelector('.menu-panel');
  const toggle = document.querySelector('.menu-toggle');
  const progress = document.querySelector('.scroll-progress span');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  document.querySelector('#year').textContent = new Date().getFullYear();
  menu.inert = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Site navigation');
  let returnFocus;
  const setMenu = (open, restore = true) => {
    if (open) returnFocus = toggle;
    menu.classList.toggle('open', open);
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    if (open) menu.setAttribute('aria-modal', 'true');
    else menu.removeAttribute('aria-modal');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    body.classList.toggle('menu-open', open);
    main.inert = open;
    footer.inert = open;
    if (open) {
      const links = [...menu.querySelectorAll('.menu-links a')];
      const current = [...links].reverse().find(link => document.querySelector(link.getAttribute('href')).getBoundingClientRect().top <= innerHeight * .35) || links[0];
      links.forEach(link => {
        if (link === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      menu.querySelector('.menu-close').focus({ preventScroll: true });
    }
    else if (restore && returnFocus) returnFocus.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  document.querySelectorAll('[data-close-menu]').forEach(el => el.addEventListener('click', () => setMenu(false)));
  document.querySelectorAll('.menu-links a').forEach(el => el.addEventListener('click', () => {
    setMenu(false, false);
    const destination = document.querySelector(el.getAttribute('href'));
    if (destination) { destination.tabIndex = -1; destination.focus({ preventScroll: true }); }
  }));
  document.addEventListener('keydown', e => {
    if (!menu.classList.contains('open')) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {
      const items = [...menu.querySelectorAll('button, a')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  const updateScroll = () => {
    const max = root.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? window.scrollY / max * 100 : 0}%`;
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });
  if (!motion.matches && 'IntersectionObserver' in window) {
    root.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  const canvas = document.querySelector('#neon-field');
  const touchCanvas = document.querySelector('#neon-touch');
  const head = document.querySelector('#touch-light');
  const ctx = canvas.getContext('2d', { alpha: true });
  const fx = touchCanvas.getContext('2d', { alpha: true });
  if (!ctx || !fx) return;
  const palette = [[87,232,255], [159,120,255], [255,95,200], [114,255,159]];
  // Build each glow once. Frames only copy cached pixels rather than rasterizing gradients.
  const makeSprite = (rgb, hot) => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 256;
    const c = sprite.getContext('2d');
    const color = rgb.join(',');
    const gradient = c.createRadialGradient(128,128,0,128,128,128);
    gradient.addColorStop(0, hot ? 'rgba(230,255,255,1)' : `rgba(${color},1)`);
    gradient.addColorStop(.08, `rgba(${color},.9)`);
    gradient.addColorStop(.28, `rgba(${color},.35)`);
    gradient.addColorStop(.6, `rgba(${color},.07)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = gradient; c.fillRect(0,0,256,256);
    return sprite;
  };
  const soft = palette.map(rgb => makeSprite(rgb,false));
  const hot = palette.map(rgb => makeSprite(rgb,true));
  const spectrum = time => {
    const phase = (time / 6000) % palette.length;
    const index = Math.floor(phase), t = phase - index;
    const blend = t * t * (3 - 2 * t);
    const next = (index + 1) % palette.length;
    const rgb = palette[index].map((v,c)=>Math.round(v+(palette[next][c]-v)*blend)).join(',');
    return {index,next,blend,rgb};
  };
  const stamp = (c, sprites, x,y,radius,alpha,color) => {
    if (alpha <= .002) return;
    c.globalAlpha = alpha * (1-color.blend);
    c.drawImage(sprites[color.index],x-radius,y-radius,radius*2,radius*2);
    if (color.blend > .01) {
      c.globalAlpha = alpha * color.blend;
      c.drawImage(sprites[color.next],x-radius,y-radius,radius*2,radius*2);
    }
  };
  let width=0,height=0,headSize=836,mouseX=.6,mouseY=.35,ambientAt=-Infinity;
  let frame=0,hideTimer;
  const trails=[],pulses=[];
  const pointers=new Map();
  const resize=()=>{
    width=innerWidth;height=innerHeight;
    // Glows need softness rather than high-DPI detail; keep the surfaces inexpensive.
    const coarse=matchMedia('(pointer: coarse)').matches;
    const effectScale=Math.min(coarse ? .6 : .75,Math.sqrt(1100000/(width*height)));
    headSize=Math.min(440,Math.max(300,width*.3))*1.9;
    head.style.width=head.style.height=`${headSize}px`;
    for(const [c,context,scale] of [[canvas,ctx,.4],[touchCanvas,fx,effectScale]]){
      c.width=Math.round(width*scale);c.height=Math.round(height*scale);
      c.style.width=`${width}px`;c.style.height=`${height}px`;
      context.setTransform(scale,0,0,scale,0,0);
    }
    ambientAt=-Infinity;updateScroll();
  };
  resize();window.addEventListener('resize',resize,{passive:true});
  const showHead=(e,held)=>{
    // No easing/interpolation: use the latest event coordinates directly.
    head.style.transform=`translate3d(${e.clientX-headSize/2}px,${e.clientY-headSize/2}px,0)`;
    const protectedTarget=e.target instanceof Element && e.target.closest('a, button, .site-header, .menu-panel, .image-card, .project-card');
    head.style.opacity=protectedTarget?'.18':held?'1':'.96';
    clearTimeout(hideTimer);
    if(!held)hideTimer=setTimeout(()=>{head.style.opacity='0';},420);
  };
  const emit=(e,burst=false)=>{
    const now=performance.now(),previous=pointers.get(e.pointerId);
    mouseX=e.clientX/Math.max(1,width);mouseY=e.clientY/Math.max(1,height);
    const down=burst||Boolean(previous?.down);
    showHead(e,down);
    if(motion.matches)return;
    const point={x:e.clientX,y:e.clientY,time:now,down};
    pointers.set(e.pointerId,point);
    if(!previous||now-(previous.emitted||0)>24||burst){
      trails.push({...point,born:now,fromX:previous?.x??point.x,fromY:previous?.y??point.y});
      point.emitted=now;
      if(trails.length>12)trails.shift();
    }else point.emitted=previous.emitted;
    if(burst){pulses.push({...point,born:now});if(pulses.length>3)pulses.shift();}
  };
  window.addEventListener('pointermove',e=>emit(e),{passive:true});
  window.addEventListener('pointerdown',e=>emit(e,true),{passive:true});
  window.addEventListener('pointerup',e=>{
    const p=pointers.get(e.pointerId);
    if(p){p.down=false;p.time=performance.now();}
    clearTimeout(hideTimer);hideTimer=setTimeout(()=>{head.style.opacity='0';},260);
    if(e.pointerType!=='mouse')pointers.delete(e.pointerId);
  },{passive:true});
  window.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);head.style.opacity='0';},{passive:true});
  document.addEventListener('pointerleave',e=>{pointers.delete(e.pointerId);head.style.opacity='0';},{passive:true});
  window.addEventListener('blur',()=>{pointers.clear();head.style.opacity='0';});
  const lights=[{x:.17,y:.28,r:.28,a:.09},{x:.82,y:.18,r:.31,a:.085},{x:.68,y:.72,r:.26,a:.055},{x:.36,y:.88,r:.24,a:.045}];
  let effectWasVisible=false;
  const draw=now=>{
    if(now-ambientAt>=80){
      ambientAt=now;ctx.clearRect(0,0,width,height);ctx.globalCompositeOperation='lighter';
      lights.forEach((l,i)=>{
        const x=(l.x+Math.sin(now*.00006+i)*.12+(mouseX-.5)*.01)*width;
        const y=(l.y+Math.cos(now*.00004+i)*.08+(mouseY-.5)*.01)*height;
        stamp(ctx,soft,x,y,l.r*Math.max(width,height),l.a,spectrum(now+i*6000));
      });
      ctx.globalAlpha=1;
      const y=height*(.54+Math.sin(now*.00018)*.018);
      ctx.strokeStyle='rgba(87,232,255,.055)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(-40,y);ctx.bezierCurveTo(width*.25,y-70,width*.68,y+80,width+40,y-20);ctx.stroke();
    }
    const active=trails.length||pulses.length;
    if(active||effectWasVisible){
      fx.clearRect(0,0,width,height);fx.globalCompositeOperation='lighter';
      const color=spectrum(now),radius=Math.min(170,Math.max(100,width*.12));
      for(let i=trails.length-1;i>=0;i--){
        const p=trails[i],age=(now-p.born)/440;
        if(age>=1){trails.splice(i,1);continue;}
        const fade=(1-age)*(1-age);
        stamp(fx,hot,p.x,p.y,radius,fade*.28,color);
        const distance=Math.hypot(p.x-p.fromX,p.y-p.fromY);
        if(distance>2&&distance<220){
          fx.globalAlpha=fade*.6;fx.strokeStyle=`rgb(${color.rgb})`;
          fx.lineWidth=2+fade*3;fx.lineCap='round';
          fx.beginPath();fx.moveTo(p.fromX,p.fromY);fx.lineTo(p.x,p.y);fx.stroke();
        }
      }
      for(let i=pulses.length-1;i>=0;i--){
        const p=pulses[i],age=(now-p.born)/620;
        if(age>=1){pulses.splice(i,1);continue;}
        fx.globalAlpha=(1-age)*.65;fx.strokeStyle=`rgb(${color.rgb})`;fx.lineWidth=2;
        fx.beginPath();fx.arc(p.x,p.y,16+age*radius*1.5,0,Math.PI*2);fx.stroke();
      }
      fx.globalAlpha=1;effectWasVisible=Boolean(trails.length||pulses.length);
    }
    for(const [id,p]of pointers)if(!p.down&&now-p.time>500)pointers.delete(id);
    frame=requestAnimationFrame(draw);
  };
  const manageAnimation=()=>{
    cancelAnimationFrame(frame);trails.length=0;pulses.length=0;pointers.clear();
    clearTimeout(hideTimer);head.style.opacity='0';fx.clearRect(0,0,width,height);effectWasVisible=false;
    if(!motion.matches&&!document.hidden){ambientAt=-Infinity;frame=requestAnimationFrame(draw);}
    else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
  };
  motion.addEventListener('change',manageAnimation);
  document.addEventListener('visibilitychange',manageAnimation);
  manageAnimation();
})();
