// Renders data/profile.json. No dependencies, no build step.
(function(){
  'use strict';
  var UI={
    en:{badges:'Badges',certifications:'Certifications',language:'Language',prev:'Previous',next:'Next',verify:'Verify',team:'Team',points:'points',
      noBadges:'No badges yet.',noCerts:'No certifications yet.',credit:'Based on the Corvus Mind website, © 2026 Corvus Mind.',
      error:'Could not load the profile. If you opened the file directly, serve the folder over HTTP.'},
    fr:{badges:'Badges',certifications:'Certifications',language:'Langue',prev:'Précédent',next:'Suivant',verify:'Vérifier',team:'Équipe',points:'points',
      noBadges:'Aucun badge pour le moment.',noCerts:'Aucune certification pour le moment.',credit:'Basé sur le site Corvus Mind, © 2026 Corvus Mind.',
      error:'Impossible de charger le profil. Si vous avez ouvert le fichier directement, servez le dossier en HTTP.'}
  };
  var lang=startLang(), data=null, $=function(id){return document.getElementById(id);};
  var track=$('track'), carousel=document.querySelector('.carousel');
  var prev=carousel.querySelector('.prev'), next=carousel.querySelector('.next');

  function startLang(){
    var q=new URLSearchParams(location.search).get('lang'), s=null;
    try{s=localStorage.getItem('lang');}catch(e){}
    var n=(navigator.language||'').slice(0,2);
    return UI[q]?q:UI[s]?s:UI[n]?n:'en';
  }
  function tr(v){return v&&typeof v==='object'?(v[lang]||v.en||''):(v||'');}
  function el(tag,cls,text){var n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  // Only absolute http(s) links are made clickable
  function safe(u){return /^https?:\/\//i.test(u||'')?u:'';}
  function wrap(url){
    var href=safe(url), n=el(href?'a':'div');
    if(href){n.href=href;n.target='_blank';n.rel='noopener';}
    return n;
  }
  function picture(src,title){
    if(!src)return el('span','ph',title.charAt(0));
    var i=el('img');i.src=src;i.alt='';return i;
  }
  function date(iso){
    if(!iso)return '';
    return new Date(iso+'T00:00:00Z').toLocaleDateString(lang==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  }
  function ordinal(n){
    if(lang==='fr')return n+(n===1?'er':'e');
    var t=n%100, s=t>10&&t<14?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');
    return n+s;
  }
  function number(n){return n.toLocaleString(lang==='fr'?'fr-FR':'en-GB');}
  function join(list){return list.filter(Boolean).join(' · ');}

  function badge(b){
    var f=el('article','badge'), w=wrap(b.url), t=tr(b.title);
    w.append(picture(b.img,t),el('strong','',t),el('small','',b.issuer),el('small','',date(b.date)));
    f.append(w);return f;
  }
  function cert(c){
    var li=el('li','cert'), w=wrap(c.url), t=tr(c.title), x=el('span','txt');
    x.append(el('strong','',t),el('small','',join([c.issuer,date(c.date),c.id])));
    var res=join([
      c.rank&&c.field?ordinal(c.rank)+' / '+number(c.field):'',
      c.points?number(c.points)+' '+UI[lang].points:'',
      c.team?UI[lang].team+' '+c.team:''
    ]);
    if(res)x.append(el('small','res',res));
    w.append(picture(c.img,t),x);
    if(safe(c.url))w.append(el('span','verify',UI[lang].verify+' ↗'));
    li.append(w);return li;
  }
  function render(){
    var t=UI[lang];
    document.documentElement.lang=lang;
    document.querySelectorAll('[data-t]').forEach(function(n){n.textContent=t[n.dataset.t];});
    document.querySelectorAll('[data-t-label]').forEach(function(n){n.setAttribute('aria-label',t[n.dataset.tLabel]);});
    document.querySelectorAll('[data-lang]').forEach(function(n){n.setAttribute('aria-pressed',String(n.dataset.lang===lang));});
    if(!data)return;
    var badges=data.badges||[], certs=data.certifications||[];
    $('name').textContent=data.name;
    $('role').textContent=tr(data.role);
    $('bio').textContent=tr(data.bio);
    $('photo').hidden=!data.photo;
    if(data.photo){$('photo').src=data.photo;$('photo').alt=data.name;}
    $('socials').replaceChildren.apply($('socials'),(data.socials||[]).filter(function(s){return safe(s.url);}).map(function(s){
      var a=wrap(s.url);a.textContent=s.name;return a;
    }));
    track.replaceChildren.apply(track,badges.map(badge));
    $('certs').replaceChildren.apply($('certs'),certs.map(cert));
    carousel.hidden=!badges.length;$('no-badges').hidden=!!badges.length;$('no-certs').hidden=!!certs.length;
    arrows();
  }

  // Carousel
  var anim=null, goal=0, reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  function limit(){return track.scrollWidth-track.clientWidth;}
  function step(){
    var c=track.querySelector('.badge');
    return c?c.getBoundingClientRect().width+(parseFloat(getComputedStyle(track).columnGap)||0):240;
  }
  function slide(x){
    x=goal=Math.max(0,Math.min(limit(),x));
    if(anim)cancelAnimationFrame(anim);
    if(reduce.matches){track.scrollLeft=x;return;}
    var from=track.scrollLeft, t0=null;
    track.classList.add('sliding');
    anim=requestAnimationFrame(function frame(ts){
      if(t0===null)t0=ts;
      var p=Math.min(1,(ts-t0)/420);
      track.scrollLeft=from+(x-from)*(1-Math.pow(1-p,3));
      if(p<1)anim=requestAnimationFrame(frame);
      else{anim=null;track.classList.remove('sliding');}
    });
  }
  // Counts from the slide target, so clicks made during an animation are not lost
  function move(dir){
    var from=anim?goal:track.scrollLeft, i=from/step();
    slide((dir>0?Math.floor(i+.05)+1:Math.ceil(i-.05)-1)*step());
  }
  function arrows(){
    var fits=limit()<=4;
    prev.hidden=next.hidden=fits;
    prev.disabled=track.scrollLeft<=4;
    next.disabled=track.scrollLeft>=limit()-4;
  }
  prev.addEventListener('click',function(){move(-1);});
  next.addEventListener('click',function(){move(1);});
  track.addEventListener('scroll',arrows,{passive:true});
  window.addEventListener('resize',arrows);

  document.querySelectorAll('[data-lang]').forEach(function(b){
    b.addEventListener('click',function(){
      lang=b.dataset.lang;
      try{localStorage.setItem('lang',lang);}catch(e){}
      render();
    });
  });

  render();
  fetch('data/profile.json').then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(d){data=d;render();})
    .catch(function(e){console.error(e);$('error').textContent=UI[lang].error;$('error').hidden=false;});
})();
