(function(){
'use strict';
var root=document.documentElement,body=document.body,page=body.dataset.page;
var $=function(s,c){return(c||document).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(t){var d=document.createElement('div');d.textContent=t==null?'':t;return d.innerHTML}
function bi(o){if(!o)return '';return o.en===o.zh?esc(o.en):'<span class="en">'+esc(o.en)+'</span><span class="zh">'+esc(o.zh)+'</span>'}
function sameSet(a,b){return a.length===b.length&&a.every(function(x){return b.indexOf(x)>=0})}
function L(en,zh){return '<span class="en">'+en+'</span><span class="zh">'+zh+'</span>'}

/* ---------- language, jump ---------- */
function setLang(l){root.dataset.lang=l;try{localStorage.setItem('lang',l)}catch(e){}
$$('.lang button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.set===l)});root.lang=l==='zh'?'zh-Hant':'en'}
$$('.lang button').forEach(function(b){b.onclick=function(){setLang(b.dataset.set)}});setLang(root.dataset.lang||'en');
var jump=$('#jump');if(jump)jump.onchange=function(){location.href=jump.value+(location.search||'')};

/* ---------- storage / XP / streak ---------- */
var KEY='nclex.v2',S;
function fresh(){return{xp:0,streak:{last:'',n:0},sec:{},q:{},cards:{},done:{},bonus:{},last:0}}
try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S=fresh()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function lvlOf(xp){return Math.floor(Math.sqrt(xp/40))+1}
function day(d){return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function touchStreak(){var t=day(new Date()),y=new Date();y.setDate(y.getDate()-1);
if(S.streak.last===t)return;S.streak.n=S.streak.last===day(y)?S.streak.n+1:1;S.streak.last=t}
function hud(pop){$('#h-xp').textContent=S.xp;$('#h-lvl').textContent=lvlOf(S.xp);$('#h-streak').textContent=S.streak.n;
if(pop)$$('.hchip.xp,.hchip.streak').forEach(function(c){c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')})}
function toast(html,cls){var t=document.createElement('div');t.className='toast '+(cls||'');t.innerHTML=html;$('.toasts').appendChild(t);setTimeout(function(){t.remove()},2300)}
function award(n,why){var before=lvlOf(S.xp);touchStreak();S.xp+=n;save();hud(true);
toast('<svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>+'+n+' XP'+(why?' · '+why:''));
if(lvlOf(S.xp)>before){setTimeout(function(){toast('Level '+lvlOf(S.xp)+'!','lvl');confetti()},500)}}
hud(false);
/* reset */
function ask(title,msg,yes,onYes){var m=document.createElement('div');m.className='modal';m.innerHTML='<div class="mbox" role="alertdialog" aria-modal="true"><h3>'+title+'</h3><p>'+msg+'</p><div class="mbtns"><button class="btn" type="button" data-n>'+L('Cancel','取消')+'</button><button class="btn pri danger" type="button" data-y>'+yes+'</button></div></div>';document.body.appendChild(m);
function bye(){m.remove();document.removeEventListener('keydown',esc)}function esc(e){if(e.key==='Escape')bye()}document.addEventListener('keydown',esc);
$('[data-n]',m).onclick=bye;m.onclick=function(e){if(e.target===m)bye()};$('[data-y]',m).onclick=function(){bye();onYes()};$('[data-n]',m).focus()}
function bindReset(){var a=$('#reset-all');if(a)a.onclick=function(){ask(L('Reset all progress?','重置全部進度？'),L('This erases your XP, level, streak, learned topics and quiz answers on this browser. It cannot be undone.','這會清除此瀏覽器上的 XP、等級、連續天數、已學主題與作答紀錄，且無法復原。'),L('Reset everything','全部重置'),function(){try{localStorage.removeItem(KEY)}catch(e){}S=fresh();location.reload()})};
var c=$('#reset-ch');if(c)c.onclick=function(){var n=+body.dataset.ch;ask(L('Reset this chapter?','重置本章進度？'),L('Chapter '+n+' goes back to 0%: learned topics and answers are cleared. Your XP and streak are kept.','第 '+n+' 章會回到 0%：已學主題與作答紀錄將清除，XP 與連續天數保留。'),L('Reset chapter','重置本章'),function(){var pre='c'+n+':';[S.sec,S.q,S.cards].forEach(function(o){Object.keys(o).forEach(function(k){if(k.indexOf(pre)===0)delete o[k]})});delete S.done[n];delete S.bonus['d'+n];delete S.bonus['s'+n];save();location.reload()})}}

bindReset();
/* ---------- effects ---------- */
var fx=$('#fx'),parts=[],raf=0;
function confetti(){if(reduce||!fx)return;fx.width=innerWidth;fx.height=innerHeight;var ctx=fx.getContext('2d'),cols=['#ff5d8f','#ffb020','#12b5a6','#5b5bf0','#8b5cf6','#18b26b'];
for(var i=0;i<130;i++)parts.push({x:innerWidth/2+(Math.random()-.5)*200,y:innerHeight*.55,vx:(Math.random()-.5)*16,vy:-Math.random()*16-4,g:.38,s:5+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[i%cols.length],l:0});
if(raf)return;(function step(){ctx.clearRect(0,0,fx.width,fx.height);parts=parts.filter(function(p){return p.y<fx.height+30&&p.l<150});
parts.forEach(function(p){p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.r+=p.vr;p.l++;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.globalAlpha=Math.max(0,1-p.l/150);ctx.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);ctx.restore()});
if(parts.length)raf=requestAnimationFrame(step);else{raf=0;ctx.clearRect(0,0,fx.width,fx.height)}})()}
function countUp(el,to){if(!el)return;if(reduce){el.textContent=to;return}var from=+el.textContent||0,t0=performance.now();(function f(t){var k=Math.min(1,(t-t0)/900);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)}
/* scroll bar */
var sb=$('.scrollbar i');function onScroll(){var h=document.documentElement;var m=h.scrollHeight-h.clientHeight;if(sb)sb.style.width=(m>0?h.scrollTop/m*100:0)+'%'}
addEventListener('scroll',onScroll,{passive:true});onScroll();
/* reveal */
if('IntersectionObserver'in window){var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var el=e.target,sibs=el.parentNode?$$(':scope > .rv',el.parentNode):[];var i=Math.max(0,sibs.indexOf(el))%8;el.style.setProperty('--d',i*55+'ms');el.classList.add('in');ro.unobserve(el)}})},{rootMargin:'0px 0px -6% 0px',threshold:.05});
$$('.rv').forEach(function(el){ro.observe(el)})}else $$('.rv').forEach(function(el){el.classList.add('in')});
/* tilt */
if(!reduce&&matchMedia('(hover:hover)').matches)$$('.tile').forEach(function(t){t.addEventListener('mousemove',function(e){var r=t.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;t.style.setProperty('--ry',(x*8)+'deg');t.style.setProperty('--rx',(-y*8)+'deg')});t.addEventListener('mouseleave',function(){t.style.setProperty('--ry','0deg');t.style.setProperty('--rx','0deg')})});

/* ---------- progress helpers ---------- */
function chDone(n){var p='c'+n+':',c=0,k;for(k in S.sec)if(k.indexOf(p)===0&&S.sec[k])c++;for(k in S.q)if(k.indexOf(p)===0)c++;return c}
function setRing(el,p){if(!el)return;el.style.setProperty('--p',p);var b=$('b',el);if(b)b.textContent=el.classList.contains('sm')?(p>=100?'✓':p):p+'%';el.classList.toggle('done',p>=100)}

/* ---------- INDEX ---------- */
if(page==='home'){
var tot=0,dn=0,full=0,first=null,lastLi=null;
$$('.chlist li').forEach(function(li){var n=+li.dataset.ch,t=+li.dataset.total,d=Math.min(t,chDone(n)),p=t?Math.round(d/t*100):0;tot+=t;dn+=d;if(p>=100)full++;setRing($('.ring',li),p);
if(!first&&p<100&&t)first=n;if(S.last===n)lastLi={n:n,p:p}});
var allp=tot?Math.round(dn/tot*100):0;setRing($('#ring-all'),allp);countUp($('#d-done'),full);
var lv=lvlOf(S.xp),base=40*(lv-1)*(lv-1),nxt=40*lv*lv;countUp($('#d-lvl'),lv);countUp($('#d-xp'),S.xp);$('#d-next').textContent=nxt-S.xp;
setTimeout(function(){$('#d-xpbar').style.width=Math.round((S.xp-base)/(nxt-base)*100)+'%'},250);
countUp($('#d-streak'),S.streak.n);var secs=0,qs=0,k;for(k in S.sec)if(S.sec[k])secs++;for(k in S.q)qs++;countUp($('#d-secs'),secs);countUp($('#d-qs'),qs);
var cont=$('#continue'),tgt=lastLi&&lastLi.p<100?lastLi.n:first;
if(cont&&tgt&&(S.xp>0||lastLi)){cont.href='ch'+('0'+tgt).slice(-2)+'.html';cont.firstChild.textContent='Continue · Ch '+tgt;cont.childNodes[1].textContent='繼續學習 · 第 '+tgt+' 章'}
var q=$('#q');if(q)q.oninput=function(){var t=q.value.trim().toLowerCase();
$$('.chlist li').forEach(function(li){li.classList.toggle('hide',!!t&&li.dataset.s.indexOf(t)<0)});
$$('.part').forEach(function(p){p.style.display=$$('.chlist li:not(.hide)',p).length?'':'none'})};
}

/* ---------- CHAPTER ---------- */
if(page==='chapter'&&body.dataset.ch){
var ch=+body.dataset.ch,nsec=+body.dataset.secs,nq=+body.dataset.qs;S.last=ch;save();
function refresh(){var t=nsec+nq,d=t?Math.min(t,chDone(ch)):0,p=t?Math.round(d/t*100):0;setRing($('#ring-ch'),p);
if(p>=100&&!S.done[ch]){S.done[ch]=1;save();setTimeout(function(){award(50,'Chapter complete!');confetti()},600)}}
/* learned toggles */
function setLearned(i,on,silent){var sec=$('#s'+i),key='c'+ch+':'+i;if(!sec)return;var was=!!S.sec[key];S.sec[key]=on?1:0;sec.classList.toggle('done',on);var b=$('.learned',sec);if(b)b.setAttribute('aria-pressed',on);save();
if(on&&!was&&!silent)award(10,'topic learned');refresh()}
$$('.sec').forEach(function(sec){var i=+sec.dataset.i;if(S.sec['c'+ch+':'+i]){sec.classList.add('done');$('.learned',sec).setAttribute('aria-pressed',true)}
$('.learned',sec).onclick=function(){setLearned(i,!S.sec['c'+ch+':'+i]);syncCards()}});
/* flashcards */
var cards=$$('.fcard'),ptr=0;
function known(i){return !!S.sec['c'+ch+':'+cards[i].dataset.id]}
function syncCards(){var k=cards.filter(function(c,i){return known(i)}).length;var el=$('#fc-k');if(el)el.textContent=k}
function showCard(i){ptr=i;cards.forEach(function(c,j){c.classList.toggle('cur',j===i);c.classList.remove('flipped')});$('#fc-i').textContent=i+1;syncCards()}
function nextUnknown(from,dir){var n=cards.length;for(var s=1;s<=n;s++){var j=(from+dir*s+n*2)%n;if(!known(j))return j}return -1}
function deckDone(){var st=$('.fstack');if(!st||$('.fdone',st))return;cards.forEach(function(c){c.classList.remove('cur')});var d=document.createElement('div');d.className='fdone';d.innerHTML='<div>'+L('Deck complete — you know every topic!','全部學會了！太強了！')+'</div>';st.appendChild(d);if(!S.bonus['d'+ch]){S.bonus['d'+ch]=1;save();award(20,'deck complete')}confetti()}
if(cards.length){var fr=$('.fstack');
cards.forEach(function(c,i){c.tabIndex=0;c.onclick=function(){c.classList.toggle('flipped')}});
var unk=nextUnknown(-1,1);showCard(unk<0?0:unk);if(unk<0)deckDone();
$('#fc-flip').onclick=function(){cards[ptr].classList.toggle('flipped')};
$('#fc-again').onclick=function(){var n=nextUnknown(ptr,1);if(n>=0)showCard(n)};
$('#fc-got').onclick=function(){var d=$('.fdone',fr);if(d)return;setLearned(+cards[ptr].dataset.id,true);var n=nextUnknown(ptr,1);if(n<0)deckDone();else showCard(n)};
function deckVisible(){var r=$('#deck').getBoundingClientRect(),m=innerHeight/2;return r.top<m&&r.bottom>m}
document.addEventListener('keydown',function(e){if(!deckVisible()||(lb&&lb.classList.contains('open'))||/input|select|textarea/i.test(e.target.tagName))return;
if(e.key===' '){e.preventDefault();$('#fc-flip').click()}else if(e.key==='ArrowRight'){showCard((ptr+1)%cards.length)}else if(e.key==='ArrowLeft'){showCard((ptr-1+cards.length)%cards.length)}else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'){$('#fc-got').click()}})}
/* questions */
$$('.q').forEach(function(qq){var ans=qq.dataset.answer.split(',').map(Number),multi=ans.length>1,btns=$$('.opts button',qq),chk=$('.check',qq);
function grade(){if(qq.classList.contains('done'))return;var sel=btns.filter(function(b){return b.classList.contains('sel')}).map(function(b){return +b.dataset.i});if(!sel.length)return;
qq.classList.add('done');var ok=sameSet(sel,ans);qq.classList.add(ok?'ok':'no');
btns.forEach(function(b){var i=+b.dataset.i;b.classList.remove('sel');if(ans.indexOf(i)>=0)b.classList.add('right');else if(sel.indexOf(i)>=0)b.classList.add('wrong')});
$('.why',qq).hidden=false;if(chk)chk.style.display='none';
var key='c'+ch+':'+qq.dataset.qid;if(!(key in S.q)){S.q[key]=ok?1:0;save();award(ok?5:1,ok?'correct!':'keep going')}
refresh();score()}
btns.forEach(function(b){b.onclick=function(){if(qq.classList.contains('done'))return;if(multi)b.classList.toggle('sel');else{btns.forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');grade()}}});
if(chk)chk.onclick=grade});
function score(){var qs=$$('.q[data-qid^=p]'),all=qs.every(function(q){return q.classList.contains('done')});if(!qs.length||!all)return;var okn=qs.filter(function(q){return q.classList.contains('ok')}).length,pct=okn/qs.length,sc=$('#score');if(!sc||!sc.hidden)return;
sc.hidden=false;var stars=$$('.stars svg',sc),n=pct>=.9?3:pct>=.7?2:1;stars.forEach(function(s,i){setTimeout(function(){s.classList.toggle('on',i<n)},300+i*250)});
$('.sc-t',sc).innerHTML=L(okn+' / '+qs.length+' correct',okn+' / '+qs.length+' 題答對');
$('.sc-s',sc).innerHTML=pct>=.8?L('Crushed it! 🎉'.replace(' 🎉',''),'太厲害了！'):pct>=.7?L('Nice work — keep going!','不錯喔，繼續加油！'):L('Review the topics above and try again tomorrow.','回頭複習上面的主題，明天再挑戰。');
if(pct>=.7&&!S.bonus['s'+ch]){S.bonus['s'+ch]=1;save();setTimeout(function(){award(20,'quiz bonus')},900)}if(pct>=.8)setTimeout(confetti,500);sc.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})}
refresh();
/* toc scroll-spy */
var links=$$('.toc a');if(links.length&&'IntersectionObserver'in window){var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('on')});var a=map[e.target.id];if(a){a.classList.add('on');var box=a.parentNode;if(box.scrollWidth>box.clientWidth)box.scrollTo({left:a.offsetLeft-24,behavior:'smooth'})}}})},{rootMargin:'-18% 0px -72% 0px'});
Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)})}
}

/* ---------- QUICK QUIZ ---------- */
if(page==='quiz'){
var DATA=JSON.parse($('#qdata').textContent),partSel='all',pool=[],run=null;
var setup=$('#qz-setup'),play=$('#qz-play'),res=$('#qz-result');
function poolFor(){return DATA.filter(function(q){return partSel==='all'||q.part===partSel})}
function upPool(){pool=poolFor();$('#qz-pool').innerHTML=L(pool.length+' questions available',pool.length+' 題可用')}
$$('#qz-parts .chip').forEach(function(c){c.onclick=function(){$$('#qz-parts .chip').forEach(function(x){x.classList.remove('on')});c.classList.add('on');partSel=c.dataset.p;upPool()}});upPool();
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
$('#qz-start').onclick=startQuiz;
function startQuiz(){if(!pool.length)return;run={qs:shuffle(pool).slice(0,10),i:0,ok:0,combo:0,xp:0,missed:[]};setup.hidden=true;res.hidden=true;play.hidden=false;renderQ();scrollTo({top:0,behavior:'smooth'})}
function renderQ(){var q=run.qs[run.i],multi=q.answer.length>1,n=run.qs.length;
play.innerHTML='<div class="qtop"><span class="qmeta">'+(run.i+1)+' / '+n+'</span><div class="qprog"><i style="width:'+(run.i/n*100)+'%"></i></div>'+(run.combo>=2?'<span class="combo">×'+run.combo+' '+L('combo','連對')+'</span>':'')+'</div>'+
'<article class="q"><a class="qchap" href="ch'+('0'+q.ch).slice(-2)+'.html">'+L('Ch '+q.ch+' · '+esc(q.t.en),'第 '+q.ch+' 章 · '+esc(q.t.zh))+'</a><p class="stem"><b class="qn">'+(run.i+1)+'</b><span>'+bi(q.stem)+(multi?' <em class="sata">'+L('(Select all that apply)','（複選）')+'</em>':'')+'</span></p>'+
'<ul class="opts">'+q.options.map(function(o,k){return '<li><button type="button" data-i="'+k+'"><span class="ltr">'+'ABCDEFGH'[k]+'</span><span class="txt">'+bi(o)+'</span></button></li>'}).join('')+'</ul>'+
(multi?'<button class="btn check" type="button">'+L('Check answer','對答案')+'</button>':'')+'<div class="why" hidden><p>'+bi(q.why)+'</p></div></article><div class="nextrow" hidden><button class="btn pri big" id="qz-next">'+(run.i+1<n?L('Next','下一題'):L('See results','看結果'))+'</button></div>';
var qq=$('.q',play),btns=$$('.opts button',qq),chk=$('.check',qq);
function grade(){if(qq.classList.contains('done'))return;var sel=btns.filter(function(b){return b.classList.contains('sel')}).map(function(b){return +b.dataset.i});if(!sel.length)return;
qq.classList.add('done');var ok=sameSet(sel,q.answer);qq.classList.add(ok?'ok':'no');
btns.forEach(function(b){var i=+b.dataset.i;b.classList.remove('sel');if(q.answer.indexOf(i)>=0)b.classList.add('right');else if(sel.indexOf(i)>=0)b.classList.add('wrong')});
$('.why',qq).hidden=false;if(chk)chk.style.display='none';
if(ok){run.ok++;run.combo++;var g=4+(run.combo>=3?1:0);run.xp+=g;award(g,run.combo>=3?'combo ×'+run.combo:'correct!')}else{run.combo=0;run.missed.push(q);run.xp+=0}
$('.nextrow',play).hidden=false;$('.nextrow',play).scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
$('#qz-next').onclick=function(){run.i++;if(run.i<run.qs.length)renderQ();else finish()}}
btns.forEach(function(b){b.onclick=function(){if(qq.classList.contains('done'))return;if(multi)b.classList.toggle('sel');else{btns.forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');grade()}}});if(chk)chk.onclick=grade}
function finish(){play.hidden=true;res.hidden=false;var n=run.qs.length,pct=run.ok/n,st=pct>=.9?3:pct>=.7?2:pct>=.4?1:0,bonus=0;if(run.ok===n){bonus=25;award(25,'perfect run!')}
var star='<svg viewBox="0 0 24 24"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7-6.2-3.5-6.2 3.5 1.4-7L2 9.4l7-.9z"/></svg>';
res.innerHTML='<div class="card result rv in"><div class="scorecard" style="margin:0"><div class="stars">'+star+star+star+'</div><div class="big" style="color:#fff;-webkit-text-fill-color:#fff">'+run.ok+' / '+n+'</div><p class="sc-t">'+(pct>=.8?L('Crushed it!','太厲害了！'):pct>=.5?L('Good run!','不錯喔！'):L('Keep practicing!','繼續加油！'))+'</p><p class="sc-s">+'+(run.xp+bonus)+' XP</p></div>'+
(run.missed.length?'<div class="missed"><h3>'+L('Review these','這些要複習')+'</h3>'+run.missed.map(function(q){return '<a href="ch'+('0'+q.ch).slice(-2)+'.html#practice"><b>'+L('Ch '+q.ch,'第 '+q.ch+' 章')+'</b> · '+bi(q.stem).slice(0,0)+L(esc(q.stem.en.slice(0,110))+(q.stem.en.length>110?'…':''),esc(q.stem.zh.slice(0,70))+(q.stem.zh.length>70?'…':''))+'</a>'}).join('')+'</div>':'')+
'<div class="cta" style="justify-content:center"><button class="btn pri big" id="qz-again">'+L('Play again','再來一次')+'</button><a class="btn big" href="index.html">'+L('Back to chapters','回章節列表')+'</a></div></div>';
setTimeout(function(){$$('.stars svg',res).forEach(function(s,i){setTimeout(function(){s.classList.toggle('on',i<st)},i*250)})},200);if(pct>=.8)setTimeout(confetti,400);
$('#qz-again').onclick=function(){res.hidden=true;startQuiz()};scrollTo({top:0,behavior:'smooth'})}
}

/* ---------- image viewer (lightbox) ---------- */
var items=[],idx=0,lb;
function build(){if(lb)return;lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
lb.innerHTML='<div class="lb-top"><div class="lb-cap"><span class="c"></span><span class="lb-n"></span></div><button class="z" title="Zoom (Z)" aria-label="Zoom"><span class="zm"></span></button><button class="x" title="Close (Esc)" aria-label="Close">×</button></div><div class="lb-stage"><button class="lb-nav lb-prev" aria-label="Previous">‹</button><img alt=""><button class="lb-nav lb-next" aria-label="Next">›</button></div>';
document.body.appendChild(lb);$('.x',lb).onclick=close;$('.z',lb).onclick=toggleZoom;$('.lb-prev',lb).onclick=function(){go(-1)};$('.lb-next',lb).onclick=function(){go(1)};
var st=$('.lb-stage',lb),im=$('img',lb);im.onclick=toggleZoom;st.onclick=function(e){if(e.target===st)close()};
var sx=0,sy=0;st.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
st.addEventListener('touchend',function(e){if(st.classList.contains('zoom'))return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);else if(dy>90&&Math.abs(dy)>Math.abs(dx)*1.5)close()},{passive:true})}
function show(){var it=items[idx],st=$('.lb-stage',lb);st.classList.remove('zoom');st.scrollTop=0;st.scrollLeft=0;var im=$('img',lb);im.style.animation='none';void im.offsetWidth;im.style.animation='';im.src=it.href;im.alt=it.cap;
$('.c',lb).textContent=it.cap;$('.lb-n',lb).textContent=(idx+1)+' / '+items.length;var one=items.length<2;$$('.lb-nav',lb).forEach(function(b){b.style.visibility=one?'hidden':'visible'});
[items[idx+1],items[idx-1]].forEach(function(n){if(n){(new Image()).src=n.href}})}
function toggleZoom(){var st=$('.lb-stage',lb);st.classList.toggle('zoom');if(st.classList.contains('zoom'))st.scrollTop=0}
function go(d){idx=(idx+d+items.length)%items.length;show()}
function open(a){build();var seen={};items=[];$$('a.pgimg').forEach(function(x){var h=x.getAttribute('href');if(!seen[h]){seen[h]=1;items.push({href:h,cap:x.dataset.cap||h})}});
idx=Math.max(0,items.findIndex(function(i){return i.href===a.getAttribute('href')}));show();lb.classList.add('open');document.body.classList.add('lbopen');$('.x',lb).focus()}
function close(){if(!lb)return;lb.classList.remove('open');document.body.classList.remove('lbopen')}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.pgimg');if(a&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();open(a)}});
document.addEventListener('keydown',function(e){if(!lb||!lb.classList.contains('open'))return;
if(e.key==='Escape')close();else if(e.key==='ArrowRight')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='z'||e.key==='Z'||e.key===' '){e.preventDefault();toggleZoom()}});
})();
