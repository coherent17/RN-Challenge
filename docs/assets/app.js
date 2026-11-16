(function(){
'use strict';
var root=document.documentElement,body=document.body,page=body.dataset.page;
var $=function(s,c){return(c||document).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var BASE=(document.currentScript&&document.currentScript.src||'').replace(/app\.js(\?.*)?$/,'')||'assets/';
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

/* ---------- storage / progress ---------- */
var KEY='nclex.v2',S;
function fresh(){return{sec:{},q:{},bm:{},cards:{},done:{},bonus:{},last:0}}
try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S=fresh()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function day(d){return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function toast(html,cls){var t=document.createElement('div');t.className='toast '+(cls||'');t.innerHTML=html;$('.toasts').appendChild(t);setTimeout(function(){t.remove()},2300)}
function celebrate(why){if(why)toast('<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'+why)}
/* reset */
function ask(title,msg,yes,onYes){var m=document.createElement('div');m.className='modal';m.innerHTML='<div class="mbox" role="alertdialog" aria-modal="true"><h3>'+title+'</h3><p>'+msg+'</p><div class="mbtns"><button class="btn" type="button" data-n>'+L('Cancel','取消')+'</button><button class="btn pri danger" type="button" data-y>'+yes+'</button></div></div>';document.body.appendChild(m);
function bye(){m.remove();document.removeEventListener('keydown',esc)}function esc(e){if(e.key==='Escape')bye()}document.addEventListener('keydown',esc);
$('[data-n]',m).onclick=bye;m.onclick=function(e){if(e.target===m)bye()};$('[data-y]',m).onclick=function(){bye();onYes()};$('[data-n]',m).focus()}
function bindReset(){var a=$('#reset-all');if(a)a.onclick=function(){ask(L('Reset all progress?','重置全部進度？'),L('This erases your learned topics, bookmarks and quiz answers on this browser. It cannot be undone.','這會清除此瀏覽器上已學主題、書籤與作答紀錄，且無法復原。'),L('Reset everything','全部重置'),function(){try{localStorage.removeItem(KEY)}catch(e){}S=fresh();location.reload()})};
var c=$('#reset-ch');if(c)c.onclick=function(){var n=+body.dataset.ch;ask(L('Reset this chapter?','重置本章進度？'),L('Chapter '+n+' goes back to 0%: learned topics and answers are cleared.','第 '+n+' 章會回到 0%：已學主題與作答紀錄將清除。'),L('Reset chapter','重置本章'),function(){var pre='c'+n+':';[S.sec,S.q,S.bm,S.cards].forEach(function(o){Object.keys(o).forEach(function(k){if(k.indexOf(pre)===0)delete o[k]})});delete S.done[n];delete S.bonus['d'+n];delete S.bonus['s'+n];save();location.reload()})}}

bindReset();
/* export/import progress, for syncing between devices */
function mergeFlags(a,b){var out=Object.assign({},a);for(var k in b){if(!(k in out)||b[k]>out[k])out[k]=b[k]}return out}
function exportProgress(){var blob=new Blob([JSON.stringify(S)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nclex-progress-'+day(new Date())+'.json';document.body.appendChild(a);a.click();a.remove()}
function importProgress(file){var r=new FileReader();r.onload=function(){try{var imp=JSON.parse(r.result);
S.sec=mergeFlags(S.sec,imp.sec||{});S.q=mergeFlags(S.q,imp.q||{});S.bm=mergeFlags(S.bm,imp.bm||{});
S.cards=mergeFlags(S.cards,imp.cards||{});S.done=mergeFlags(S.done,imp.done||{});S.bonus=mergeFlags(S.bonus,imp.bonus||{});
S.last=S.last||imp.last||0;save();toast(L('Progress merged! Reloading…','進度已合併！重新載入中…'));setTimeout(function(){location.reload()},900)
}catch(e){toast(L("That file couldn't be read as a progress backup.",'無法讀取此檔案，不是有效的進度備份。'))}};r.readAsText(file)}
var ep=$('#export-progress');if(ep)ep.onclick=exportProgress;
var ip=$('#import-progress'),ifl=$('#import-file');
if(ip&&ifl){ip.onclick=function(){ifl.click()};ifl.onchange=function(){if(ifl.files[0])importProgress(ifl.files[0]);ifl.value=''}}
/* review nav badge: wrong quiz answers + bookmarked points */
function missedCount(){var n=0,k;for(k in S.q)if(!S.q[k])n++;return n}
function bookmarkCount(){var n=0,k;for(k in S.bm)if(S.bm[k])n++;return n}
function badgeSet(el,n){if(el){el.hidden=!n;if(n)el.textContent=n>99?'99+':n}}
function updateReviewBadge(){badgeSet($('#nav-review-n'),missedCount()+bookmarkCount());badgeSet($('#rv-tab-q-n'),missedCount());badgeSet($('#rv-tab-bm-n'),bookmarkCount())}
updateReviewBadge();
/* bookmark buttons (critical points, mnemonics) */
$$('.bmbtn').forEach(function(b){var key=b.dataset.bm;b.setAttribute('aria-pressed',!!S.bm[key]);b.onclick=function(){S.bm[key]=!S.bm[key];b.setAttribute('aria-pressed',S.bm[key]);save();updateReviewBadge()}});
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

var STOPJ=/^(the|and|for|with|that|this|from|have|has|are|was|were|will|would|should|which|following|client|clients|nurse|nursing|care|when|what|after|before|about|their|there|they|them|been|into|than|then|also|most|more|other|such|only|some|each|does|not)$/;
function anchorTerms(text,n){n=n||2;var words=(text||'').match(/[A-Za-z][A-Za-z'-]{4,}/g)||[],uniq=[],seen={};
words.forEach(function(w){var lw=w.toLowerCase();if(!STOPJ.test(lw)&&!seen[lw]){seen[lw]=1;uniq.push(lw)}});
uniq.sort(function(a,b){return b.length-a.length});return uniq.slice(0,n).join(' ')}
function pageTag(pages,anchorText){if(!pages||!pages.length)return '';var q=anchorTerms(anchorText||'',2);
return '<span class="src">'+pages.map(function(p){return '<a class="pgimg" data-p="'+p+'" data-q="'+q+'" data-cap="PDF p.'+p+'"><span class="pill"><span class="bk"></span>p.'+p+'<i class="bklbl"></i></span></a>'}).join('')+'</span>'}
function fillBookLabels(container){getLabels().then(function(lab){$$('a.pgimg',container).forEach(function(a){var p=+a.dataset.p,l=lab&&lab[p];if(l){a.dataset.cap='PDF p.'+p+' · book p.'+l;var i=$('i.bklbl',a);if(i)i.textContent=' · book '+l}})}).catch(function(){})}
window.NX={BASE:BASE,S:function(){return S},save:save,celebrate:celebrate,confetti:confetti,bi:bi,esc:esc,L:L,sameSet:sameSet,ask:ask,anchorTerms:anchorTerms,pageTag:pageTag,fillBookLabels:fillBookLabels};
/* ---------- progress helpers ---------- */
function chDone(n){var p='c'+n+':',c=0,k;for(k in S.sec)if(k.indexOf(p)===0&&S.sec[k])c++;for(k in S.q)if(k.indexOf(p)===0)c++;return c}
function setRing(el,p){if(!el)return;el.style.setProperty('--p',p);var b=$('b',el);if(b)b.textContent=el.classList.contains('sm')?(p>=100?'✓':p):p+'%';el.classList.toggle('done',p>=100)}

/* ---------- INDEX ---------- */
if(page==='home'){
var tot=0,dn=0,full=0,first=null,lastLi=null;
$$('.chlist li').forEach(function(li){var n=+li.dataset.ch,t=+li.dataset.total,d=Math.min(t,chDone(n)),p=t?Math.round(d/t*100):0;tot+=t;dn+=d;if(p>=100)full++;setRing($('.ring',li),p);
if(!first&&p<100&&t)first=n;if(S.last===n)lastLi={n:n,p:p}});
var allp=tot?Math.round(dn/tot*100):0;setRing($('#ring-all'),allp);countUp($('#d-done'),full);
var secs=0,qs=0,k;for(k in S.sec)if(S.sec[k])secs++;for(k in S.q)qs++;countUp($('#d-secs'),secs);countUp($('#d-qs'),qs);
var cont=$('#continue'),tgt=lastLi&&lastLi.p<100?lastLi.n:first;
if(cont&&tgt&&(secs>0||qs>0||lastLi)){cont.href='ch'+('0'+tgt).slice(-2)+'.html';cont.firstChild.textContent='Continue · Ch '+tgt;cont.childNodes[1].textContent='繼續學習 · 第 '+tgt+' 章'}
var q=$('#q');if(q)q.oninput=function(){var t=q.value.trim().toLowerCase();
$$('.chlist li').forEach(function(li){li.classList.toggle('hide',!!t&&li.dataset.s.indexOf(t)<0)});
$$('.part').forEach(function(p){p.style.display=$$('.chlist li:not(.hide)',p).length?'':'none'})};
}

/* ---------- CHAPTER ---------- */
if(page==='chapter'&&body.dataset.ch){
var ch=+body.dataset.ch,nsec=+body.dataset.secs,nq=+body.dataset.qs;S.last=ch;save();
var pc=$('#print-ch');if(pc)pc.onclick=function(){window.print()};
function refresh(){var t=nsec+nq,d=t?Math.min(t,chDone(ch)):0,p=t?Math.round(d/t*100):0;setRing($('#ring-ch'),p);
if(p>=100&&!S.done[ch]){S.done[ch]=1;save();setTimeout(function(){celebrate(L('Chapter complete!','本章完成！'));confetti()},600)}}
/* learned toggles */
function setLearned(i,on,silent){var sec=$('#s'+i),key='c'+ch+':'+i;if(!sec)return;S.sec[key]=on?1:0;sec.classList.toggle('done',on);var b=$('.learned',sec);if(b)b.setAttribute('aria-pressed',on);save();
refresh()}
$$('.sec').forEach(function(sec){var i=+sec.dataset.i;if(S.sec['c'+ch+':'+i]){sec.classList.add('done');$('.learned',sec).setAttribute('aria-pressed',true)}
$('.learned',sec).onclick=function(){setLearned(i,!S.sec['c'+ch+':'+i]);syncCards()}});
/* flashcards */
var cards=$$('.fcard'),ptr=0;
function known(i){return !!S.sec['c'+ch+':'+cards[i].dataset.id]}
function syncCards(){var k=cards.filter(function(c,i){return known(i)}).length;var el=$('#fc-k');if(el)el.textContent=k}
function showCard(i){ptr=i;cards.forEach(function(c,j){c.classList.toggle('cur',j===i);c.classList.remove('flipped')});$('#fc-i').textContent=i+1;syncCards()}
function nextUnknown(from,dir){var n=cards.length;for(var s=1;s<=n;s++){var j=(from+dir*s+n*2)%n;if(!known(j))return j}return -1}
function deckDone(){var st=$('.fstack');if(!st||$('.fdone',st))return;cards.forEach(function(c){c.classList.remove('cur')});var d=document.createElement('div');d.className='fdone';d.innerHTML='<div>'+L('Deck complete — you know every topic!','全部學會了！太強了！')+'</div>';st.appendChild(d);if(!S.bonus['d'+ch]){S.bonus['d'+ch]=1;save()}confetti()}
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
var key='c'+ch+':'+qq.dataset.qid;if(!(key in S.q)){S.q[key]=ok?1:0;save()}
refresh();score()}
btns.forEach(function(b){b.onclick=function(){if(qq.classList.contains('done'))return;if(multi)b.classList.toggle('sel');else{btns.forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');grade()}}});
if(chk)chk.onclick=grade});
function score(){var qs=$$('.q[data-qid^=p]'),all=qs.every(function(q){return q.classList.contains('done')});if(!qs.length||!all)return;var okn=qs.filter(function(q){return q.classList.contains('ok')}).length,pct=okn/qs.length,sc=$('#score');if(!sc||!sc.hidden)return;
sc.hidden=false;var stars=$$('.stars svg',sc),n=pct>=.9?3:pct>=.7?2:1;stars.forEach(function(s,i){setTimeout(function(){s.classList.toggle('on',i<n)},300+i*250)});
$('.sc-t',sc).innerHTML=L(okn+' / '+qs.length+' correct',okn+' / '+qs.length+' 題答對');
$('.sc-s',sc).innerHTML=pct>=.8?L('Crushed it! 🎉'.replace(' 🎉',''),'太厲害了！'):pct>=.7?L('Nice work — keep going!','不錯喔，繼續加油！'):L('Review the topics above and try again tomorrow.','回頭複習上面的主題，明天再挑戰。');
if(pct>=.8)setTimeout(confetti,500);sc.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})}
refresh();
/* toc scroll-spy */
var links=$$('.toc a');if(links.length&&'IntersectionObserver'in window){var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('on')});var a=map[e.target.id];if(a){a.classList.add('on');var box=a.parentNode;if(box.scrollWidth>box.clientWidth)box.scrollTo({left:a.offsetLeft-24,behavior:'smooth'})}}})},{rootMargin:'-18% 0px -72% 0px'});
Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el)})}
}

/* ---------- QUICK QUIZ ---------- */
if(page==='quiz'){
var DATA=[],partSel='all',pool=[],run=null;
var setup=$('#qz-setup'),play=$('#qz-play'),res=$('#qz-result');
function poolFor(){return DATA.filter(function(q){return partSel==='all'||q.part===partSel})}
function upPool(){pool=poolFor();$('#qz-pool').innerHTML=L(pool.length+' questions available',pool.length+' 題可用')}
$$('#qz-parts .chip').forEach(function(c){c.onclick=function(){$$('#qz-parts .chip').forEach(function(x){x.classList.remove('on')});c.classList.add('on');partSel=c.dataset.p;upPool()}});upPool();fetch(BASE+'questions.json').then(function(r){return r.json()}).then(function(d){DATA=d;upPool()});
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
$('#qz-start').onclick=startQuiz;
function startQuiz(){if(!pool.length)return;run={qs:shuffle(pool).slice(0,10),i:0,ok:0,missed:[]};setup.hidden=true;res.hidden=true;play.hidden=false;renderQ();$('#qz').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}
function renderQ(){var q=run.qs[run.i],multi=q.answer.length>1,n=run.qs.length;
play.innerHTML='<div class="qtop"><span class="qmeta">'+(run.i+1)+' / '+n+'</span><div class="qprog"><i style="width:'+(run.i/n*100)+'%"></i></div></div>'+
'<article class="q"><a class="qchap" href="ch'+('0'+q.ch).slice(-2)+'.html">'+L('Ch '+q.ch+' · '+esc(q.t.en),'第 '+q.ch+' 章 · '+esc(q.t.zh))+'</a><p class="stem"><b class="qn">'+(run.i+1)+'</b><span>'+bi(q.stem)+(multi?' <em class="sata">'+L('(Select all that apply)','（複選）')+'</em>':'')+'</span></p>'+
'<ul class="opts">'+q.options.map(function(o,k){return '<li><button type="button" data-i="'+k+'"><span class="ltr">'+'ABCDEFGH'[k]+'</span><span class="txt">'+bi(o)+'</span></button></li>'}).join('')+'</ul>'+
(multi?'<button class="btn check" type="button">'+L('Check answer','對答案')+'</button>':'')+'<div class="why" hidden><p>'+bi(q.why)+'</p>'+pageTag(q.refs,(q.why&&q.why.en)||(q.stem&&q.stem.en))+'</div></article><div class="nextrow" hidden><button class="btn pri big" id="qz-next">'+(run.i+1<n?L('Next','下一題'):L('See results','看結果'))+'</button></div>';
var qq=$('.q',play),btns=$$('.opts button',qq),chk=$('.check',qq);
function grade(){if(qq.classList.contains('done'))return;var sel=btns.filter(function(b){return b.classList.contains('sel')}).map(function(b){return +b.dataset.i});if(!sel.length)return;
qq.classList.add('done');var ok=sameSet(sel,q.answer);qq.classList.add(ok?'ok':'no');
btns.forEach(function(b){var i=+b.dataset.i;b.classList.remove('sel');if(q.answer.indexOf(i)>=0)b.classList.add('right');else if(sel.indexOf(i)>=0)b.classList.add('wrong')});
$('.why',qq).hidden=false;if(chk)chk.style.display='none';
if(ok){run.ok++}else{run.missed.push(q)}
$('.nextrow',play).hidden=false;$('.nextrow',play).scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});
fillBookLabels(qq);$('#qz-next').onclick=function(){run.i++;if(run.i<run.qs.length)renderQ();else finish()}}
btns.forEach(function(b){b.onclick=function(){if(qq.classList.contains('done'))return;if(multi)b.classList.toggle('sel');else{btns.forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');grade()}}});if(chk)chk.onclick=grade}
function finish(){play.hidden=true;res.hidden=false;var n=run.qs.length,pct=run.ok/n,st=pct>=.9?3:pct>=.7?2:pct>=.4?1:0;
var star='<svg viewBox="0 0 24 24"><path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7-6.2-3.5-6.2 3.5 1.4-7L2 9.4l7-.9z"/></svg>';
res.innerHTML='<div class="card result rv in"><div class="scorecard" style="margin:0"><div class="stars">'+star+star+star+'</div><div class="big" style="color:#fff;-webkit-text-fill-color:#fff">'+run.ok+' / '+n+'</div><p class="sc-t">'+(pct>=.8?L('Crushed it!','太厲害了！'):pct>=.5?L('Good run!','不錯喔！'):L('Keep practicing!','繼續加油！'))+'</p></div>'+
(run.missed.length?'<div class="missed"><h3>'+L('Review these','這些要複習')+'</h3>'+run.missed.map(function(q){return '<a href="ch'+('0'+q.ch).slice(-2)+'.html#practice"><b>'+L('Ch '+q.ch,'第 '+q.ch+' 章')+'</b> · '+bi(q.stem).slice(0,0)+L(esc(q.stem.en.slice(0,110))+(q.stem.en.length>110?'…':''),esc(q.stem.zh.slice(0,70))+(q.stem.zh.length>70?'…':''))+'</a>'}).join('')+'</div>':'')+
'<div class="cta" style="justify-content:center"><button class="btn pri big" id="qz-again">'+L('Play again','再來一次')+'</button><a class="btn big" href="index.html">'+L('Back to chapters','回章節列表')+'</a></div></div>';
setTimeout(function(){$$('.stars svg',res).forEach(function(s,i){setTimeout(function(){s.classList.toggle('on',i<st)},i*250)})},200);if(pct>=.8)setTimeout(confetti,400);
$('#qz-again').onclick=function(){res.hidden=true;startQuiz()};scrollTo({top:0,behavior:'smooth'})}
}

/* ---------- REVIEW: MISSED QUESTIONS + BOOKMARKS (separate tabs) ---------- */
if(page==='studyguide'){var pa=$('#print-all');if(pa)pa.onclick=function(){window.print()}}
if(page==='review'){
var rlist=$('#rv-list'),rempty=$('#rv-empty'),rbmlist=$('#rv-bm-list'),rbmempty=$('#rv-bm-empty');
var rvTabs=$$('.rv-tabs .chip'),rvPanels={mistakes:$('#rv-panel-mistakes'),bookmarks:$('#rv-panel-bookmarks')};
function selectTab(name){rvTabs.forEach(function(t){var on=t.dataset.tab===name;t.classList.toggle('on',on);t.setAttribute('aria-selected',on)});
Object.keys(rvPanels).forEach(function(k){rvPanels[k].hidden=(k!==name)})}
rvTabs.forEach(function(t){t.onclick=function(){selectTab(t.dataset.tab)}});
fetch(BASE+'questions.json').then(function(r){return r.json()}).then(function(d){
var byId={};d.forEach(function(q){if(q.id)byId[q.id]=q});
function renderMissed(){
var wrong=Object.keys(S.q).filter(function(k){return !S.q[k]&&byId[k]}).map(function(k){var q=byId[k];q.key=k;return q});
if(!wrong.length){rempty.hidden=false;rlist.innerHTML='';return}
rempty.hidden=true;wrong.sort(function(a,b){return a.ch-b.ch});
rlist.innerHTML=wrong.map(function(q,i){return '<article class="q" data-key="'+q.key+'" data-answer="'+q.answer.join(',')+'">'+
'<div class="qhead"><a class="qchap" href="ch'+('0'+q.ch).slice(-2)+'.html">'+L('Ch '+q.ch+' · '+esc(q.t.en),'第 '+q.ch+' 章 · '+esc(q.t.zh))+'</a>'+
'<button class="learned" type="button" data-dismiss="'+q.key+'"><span class="chk"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="en">Mark known</span><span class="zh">標記已熟悉</span></button></div>'+
'<p class="stem"><b class="qn">'+(i+1)+'</b><span>'+bi(q.stem)+(q.answer.length>1?' <em class="sata">'+L('(Select all that apply)','（複選）')+'</em>':'')+'</span></p>'+
'<ul class="opts">'+q.options.map(function(o,k){return '<li><button type="button" data-i="'+k+'"><span class="ltr">'+'ABCDEFGH'[k]+'</span><span class="txt">'+bi(o)+'</span></button></li>'}).join('')+'</ul>'+
(q.answer.length>1?'<button class="btn check" type="button">'+L('Check answer','對答案')+'</button>':'')+
'<div class="why" hidden><p>'+bi(q.why)+'</p>'+pageTag(q.refs,(q.why&&q.why.en)||(q.stem&&q.stem.en))+'</div></article>'}).join('');
$$('.q',rlist).forEach(function(qq){var ans=qq.dataset.answer.split(',').map(Number),multi=ans.length>1,btns=$$('.opts button',qq),chk=$('.check',qq),key=qq.dataset.key;
function grade(){if(qq.classList.contains('done'))return;var sel=btns.filter(function(b){return b.classList.contains('sel')}).map(function(b){return +b.dataset.i});if(!sel.length)return;
qq.classList.add('done');var ok=sameSet(sel,ans);qq.classList.add(ok?'ok':'no');
btns.forEach(function(b){var i=+b.dataset.i;b.classList.remove('sel');if(ans.indexOf(i)>=0)b.classList.add('right');else if(sel.indexOf(i)>=0)b.classList.add('wrong')});
$('.why',qq).hidden=false;if(chk)chk.style.display='none';
if(ok){S.q[key]=1;save();updateReviewBadge();setTimeout(renderMissed,900)}
fillBookLabels(qq)}
btns.forEach(function(b){b.onclick=function(){if(qq.classList.contains('done'))return;if(multi)b.classList.toggle('sel');else{btns.forEach(function(x){x.classList.remove('sel')});b.classList.add('sel');grade()}}});if(chk)chk.onclick=grade;
$('[data-dismiss]',qq).onclick=function(){S.q[key]=1;save();updateReviewBadge();renderMissed()}})}
renderMissed()
});
fetch(BASE+'search.json').then(function(r){return r.json()}).then(function(sd){
var byKey={};sd.items.forEach(function(it){if(it[1]==='c'||it[1]==='m'||it[1]==='h')byKey[it[0]+':'+it[2]]=it});
function renderBm(){var keys=Object.keys(S.bm).filter(function(k){return S.bm[k]}),rows=[];
keys.forEach(function(k){var m=/^c(\d+):(.+)$/.exec(k);if(!m)return;var ch=+m[1],id=m[2],it=byKey[ch+':'+id];if(!it)return;rows.push({key:k,ch:ch,id:id,en:it[3],zh:it[4]})});
if(!rows.length){rbmempty.hidden=false;rbmlist.innerHTML='';return}
rbmempty.hidden=true;rows.sort(function(a,b){return a.ch-b.ch});
rbmlist.innerHTML='<ul class="bmlist">'+rows.map(function(r){var chT=sd.ch[r.ch]||['',''];return '<li><a class="qchap" href="ch'+('0'+r.ch).slice(-2)+'.html#'+r.id+'">'+L('Ch '+r.ch+' · '+esc(chT[0]),'第 '+r.ch+' 章 · '+esc(chT[1]))+'</a><div>'+L(esc(r.en),esc(r.zh))+'</div><button class="bmbtn" type="button" data-bm="'+r.key+'" aria-pressed="true" title="Remove bookmark"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg></button></li>'}).join('')+'</ul>';
$$('.bmbtn',rbmlist).forEach(function(b){b.onclick=function(){delete S.bm[b.dataset.bm];save();updateReviewBadge();renderBm()}})}
renderBm()})}
/* ---------- global search (Ctrl/Cmd+K or /) ---------- */
var SD=null,sov=null,sres=[],ssel=0,sq='';
var KIND={h:['Topic','主題'],p:['Summary','重點'],c:['Test-critical','考試關鍵'],m:['Mnemonic','口訣'],q:['Question','題目'],f:['Figure','圖表']},KW={h:6,c:5,m:4,p:3,q:2,f:2};
function sload(){if(!SD)SD=fetch(BASE+'search.json').then(function(r){return r.json()});return SD}
function hlText(text,terms){var low=text.toLowerCase(),marks=[];terms.forEach(function(t){if(!t)return;var i=0;while((i=low.indexOf(t,i))>=0){marks.push([i,i+t.length]);i+=t.length}});marks.sort(function(a,b){return a[0]-b[0]});var out='',pos=0;marks.forEach(function(m){if(m[1]<=pos)return;var a0=Math.max(m[0],pos);out+=esc(text.slice(pos,a0))+'<mark>'+esc(text.slice(a0,m[1]))+'</mark>';pos=m[1]});return out+esc(text.slice(pos))}
function snip(text,terms,len){var low=text.toLowerCase(),pos=-1;terms.forEach(function(t){var i=low.indexOf(t);if(i>=0&&(pos<0||i<pos))pos=i});if(text.length<=len)return text;var st=Math.max(0,pos-50);return(st>0?'…':'')+text.slice(st,st+len)+(st+len<text.length?'…':'')}
function runSearch(d,q){var terms=q.toLowerCase().split(/\s+/).filter(Boolean).slice(0,6);if(!terms.length)return{terms:terms,hits:[]};var out=[];
d.items.forEach(function(it){var hay=(it[3]+' '+it[4]).toLowerCase();for(var i=0;i<terms.length;i++)if(hay.indexOf(terms[i])<0)return;var sc=(KW[it[1]]||1)*10;terms.forEach(function(t){sc+=Math.max(0,20-hay.indexOf(t)/10)});sc-=Math.min(10,hay.length/200);out.push([sc,it])});
out.sort(function(a,b){return b[0]-a[0]});return{terms:terms,hits:out.slice(0,60).map(function(x){return x[1]})}}
function renderSearch(d,q){var r=runSearch(d,q),box=$('.sres',sov);sres=r.hits;ssel=0;
if(!q.trim()){box.innerHTML='<p class="sempty">'+L('Type to search every chapter, in English or Chinese. Try “hyperkalemia”, “digoxin” or “葡萄糖”.','輸入關鍵字搜尋所有章節（中英文皆可），例如「hyperkalemia」、「digoxin」、「葡萄糖」。')+'</p>';return}
if(!sres.length){box.innerHTML='<p class="sempty">'+L('No results.','找不到結果。')+'</p>';return}
var zh=root.dataset.lang==='zh';
box.innerHTML=sres.map(function(it,i){var low=function(t){return t.toLowerCase()},first=r.terms[0],txt=zh?it[4]:it[3];if(low(txt).indexOf(first)<0)txt=zh?it[3]:it[4];var ch=d.ch[it[0]]||['',''],k=KIND[it[1]]||['',''],head=it[5]?' <span class="sh">'+(zh?esc(it[6]):esc(it[5]))+'</span>':'';
return '<a class="sitem'+(i===0?' sel':'')+'" data-i="'+i+'" href="ch'+('0'+it[0]).slice(-2)+'.html?hl='+encodeURIComponent(r.terms.join(' '))+'#'+it[2]+'"><span class="sk k-'+it[1]+'">'+L(k[0],k[1])+'</span><span class="sc">'+L('Ch '+it[0]+' · '+esc(ch[0]),'第 '+it[0]+' 章 · '+esc(ch[1]))+head+'</span><span class="st">'+hlText(snip(txt,r.terms,200),r.terms)+'</span></a>'}).join('')}
function openSearch(){if(!sov){sov=document.createElement('div');sov.className='sov';sov.innerHTML='<div class="sbox" role="dialog" aria-modal="true" aria-label="Search"><div class="srow"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" autocomplete="off" spellcheck="false" placeholder="Search all chapters… / 搜尋全部章節…" aria-label="Search"><button type="button" class="sx">Esc</button></div><div class="sres"></div><div class="sfoot"><span>↑↓ move</span><span>Enter open</span><span>Esc close</span></div></div>';document.body.appendChild(sov);
var inp=$('input',sov),tm=0;inp.oninput=function(){clearTimeout(tm);tm=setTimeout(function(){sq=inp.value;sload().then(function(d){renderSearch(d,sq)})},70)};
$('.sx',sov).onclick=closeSearch;sov.onclick=function(e){if(e.target===sov)closeSearch()};
inp.onkeydown=function(e){var items=$$('.sitem',sov);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!items.length)return;ssel=(ssel+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach(function(a,i){a.classList.toggle('sel',i===ssel)});items[ssel].scrollIntoView({block:'nearest'})}else if(e.key==='Enter'){var a=items[ssel];if(a)location.href=a.href}}}
sov.classList.add('open');document.body.classList.add('lbopen');var inp2=$('input',sov);inp2.focus();inp2.select();sload().then(function(d){renderSearch(d,inp2.value)})}
function closeSearch(){if(sov){sov.classList.remove('open');if(!isOpen())document.body.classList.remove('lbopen')}}
var sb0=$('#open-search');if(sb0)sb0.onclick=openSearch;
document.addEventListener('keydown',function(e){var typing=/input|textarea|select/i.test((e.target||{}).tagName||'');
if((e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)){e.preventDefault();openSearch()}else if(e.key==='/'&&!typing&&!(lb&&lb.classList.contains('open'))){e.preventDefault();openSearch()}else if(e.key==='Escape'&&sov&&sov.classList.contains('open'))closeSearch()});
/* highlight search terms on arrival (?hl=...) */
var PAGE_HL=(function(){var m=location.search.match(/[?&]hl=([^&]*)/);return m?decodeURIComponent(m[1]).toLowerCase().split(/\s+/).filter(Boolean):[]})();
(function(){var terms=PAGE_HL;var rt=$('.content');if(!terms.length||!rt)return;
var re=new RegExp('('+terms.map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')','gi'),w=document.createTreeWalker(rt,NodeFilter.SHOW_TEXT,null),nodes=[],n,count=0;
while((n=w.nextNode())){if(n.parentNode.closest('script,style,mark,button,.why'))continue;if(re.test(n.nodeValue))nodes.push(n);re.lastIndex=0}
nodes.forEach(function(node){if(count>120)return;var frag=document.createDocumentFragment(),text=node.nodeValue,last=0,mm;re.lastIndex=0;while((mm=re.exec(text))){frag.appendChild(document.createTextNode(text.slice(last,mm.index)));var k=document.createElement('mark');k.className='hl';k.textContent=mm[0];frag.appendChild(k);last=mm.index+mm[0].length;count++;if(mm[0].length===0)re.lastIndex++}frag.appendChild(document.createTextNode(text.slice(last)));node.parentNode.replaceChild(frag,node)});
if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t)setTimeout(function(){t.scrollIntoView({block:'center'})},60)}})();
/* ---------- book viewer (PDF.js, reads book.pdf directly) ---------- */
var pdfP=null,PDFJS=null,labels=null,lb,st,cur=1,total=0,token=0,rid=0,rtask=null,curPage=null,cv=null,wrapEl=null,fit=1,vpw=1,vph=1,z=1,rtimer=0,ptrs={},pan=null,pinch=null,lastTap=0,pendingHL=[];
var ZMAX=8,ZDBL=2.6;
function getPdf(){if(!pdfP)pdfP=import(BASE+'pdfjs/pdf.min.mjs').then(function(m){PDFJS=m;m.GlobalWorkerOptions.workerSrc=BASE+'pdfjs/pdf.worker.min.mjs';return m.getDocument({url:'book.pdf',disableAutoFetch:true,rangeChunkSize:131072}).promise});return pdfP}
function getLabels(){if(!labels)labels=fetch(BASE+'labels.json').then(function(r){return r.json()}).catch(function(){return {}});return labels}
function capOf(n,lab){return 'PDF p.'+n+(lab&&lab[n]?' · book p.'+lab[n]:'')}
function isOpen(){return lb&&lb.classList.contains('open')}
function buildLb(){if(lb)return;lb=document.createElement('div');lb.className='lb';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
lb.innerHTML='<div class="lb-top"><div class="lb-cap"><span class="c"></span><span class="lb-n"></span></div><span class="lb-zl">100%</span><button class="zo" title="Zoom out (-)" aria-label="Zoom out">−</button><button class="zi" title="Zoom in (+)" aria-label="Zoom in">+</button><button class="zf" title="Fit to screen (0)" aria-label="Fit">Fit</button><button class="x" title="Close (Esc)" aria-label="Close">×</button></div><div class="lb-stage"><button class="lb-nav lb-prev" aria-label="Previous page">‹</button><div class="lb-load">Loading…</div><button class="lb-nav lb-next" aria-label="Next page">›</button></div><div class="lb-hint"><span class="en">Scroll to zoom · drag to move · double-click to zoom · ← → to turn pages</span><span class="zh">滾輪縮放 · 拖曳移動 · 雙擊放大 · ← → 換頁</span></div>';
document.body.appendChild(lb);st=$('.lb-stage',lb);
$('.x',lb).onclick=closeLb;$('.lb-prev',lb).onclick=function(){go(-1)};$('.lb-next',lb).onclick=function(){go(1)};
$('.zi',lb).onclick=function(){zoomCenter(z*1.4)};$('.zo',lb).onclick=function(){zoomCenter(z/1.4)};$('.zf',lb).onclick=function(){zoomCenter(1)};
st.addEventListener('wheel',function(e){e.preventDefault();setZ(z*Math.exp(-e.deltaY*(e.deltaMode===1?.05:e.ctrlKey?.01:.0015)),e.clientX,e.clientY)},{passive:false});
st.addEventListener('dblclick',function(e){if(e.target.closest('.lb-nav'))return;setZ(z>1.5?1:ZDBL,e.clientX,e.clientY)});
st.addEventListener('pointerdown',function(e){if(e.target.closest('.lb-nav'))return;ptrs[e.pointerId]={x:e.clientX,y:e.clientY};try{st.setPointerCapture(e.pointerId)}catch(_){}
var ids=Object.keys(ptrs);if(ids.length===1){pan={sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,sl:st.scrollLeft,stp:st.scrollTop,moved:false};if(z>1.001)st.classList.add('grab')}
else if(ids.length===2){pan=null;var p1=ptrs[ids[0]],p2=ptrs[ids[1]];pinch={d:Math.hypot(p1.x-p2.x,p1.y-p2.y)||1,z:z}}});
st.addEventListener('pointermove',function(e){if(!ptrs[e.pointerId])return;ptrs[e.pointerId]={x:e.clientX,y:e.clientY};var ks=Object.keys(ptrs);
if(pinch&&ks.length>=2){var p1=ptrs[ks[0]],p2=ptrs[ks[1]];setZ(pinch.z*Math.hypot(p1.x-p2.x,p1.y-p2.y)/pinch.d,(p1.x+p2.x)/2,(p1.y+p2.y)/2)}
else if(pan){if(Math.abs(e.clientX-pan.sx)+Math.abs(e.clientY-pan.sy)>6)pan.moved=true;if(z>1.001){st.scrollLeft=pan.sl-(e.clientX-pan.x);st.scrollTop=pan.stp-(e.clientY-pan.y)}}});
function endPtr(e){delete ptrs[e.pointerId];if(Object.keys(ptrs).length<2)pinch=null;
if(pan&&!Object.keys(ptrs).length){var dx=e.clientX-pan.sx,dy=e.clientY-pan.sy,touch=e.pointerType==='touch'||e.pointerType==='pen';
if(e.type==='pointerup'){if(!pan.moved){var el=document.elementFromPoint(e.clientX,e.clientY);if(el===st)closeLb();else if(touch&&el&&el.tagName==='CANVAS'){var now=Date.now();if(now-lastTap<320){lastTap=0;setZ(z>1.5?1:ZDBL,e.clientX,e.clientY)}else lastTap=now}}
else if(touch&&z<=1.001){if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(dx<0?1:-1);else if(dy>90&&Math.abs(dy)>Math.abs(dx)*1.5)closeLb()}}
pan=null}st.classList.remove('grab')}
st.addEventListener('pointerup',endPtr);st.addEventListener('pointercancel',endPtr);
addEventListener('resize',function(){if(!isOpen()||!curPage)return;clearTimeout(rtimer);rtimer=setTimeout(function(){computeFit();applySize();renderCurrent()},150)})}
function computeFit(){fit=Math.min(st.clientWidth/vpw,st.clientHeight/vph)}
function applySize(){if(!cv)return;var w=vpw*fit*z,h=vph*fit*z;cv.style.width=w+'px';cv.style.height=h+'px';if(wrapEl){wrapEl.style.width=w+'px';wrapEl.style.height=h+'px'}}
function updZ(){$('.lb-zl',lb).textContent=Math.round(z*100)+'%'}
function zoomCenter(nz){var r=st.getBoundingClientRect();setZ(nz,r.left+r.width/2,r.top+r.height/2)}
function setZ(nz,cx,cy){nz=Math.max(1,Math.min(ZMAX,nz));if(!cv||nz===z)return;var r=cv.getBoundingClientRect(),fx=Math.min(1,Math.max(0,(cx-r.left)/r.width)),fy=Math.min(1,Math.max(0,(cy-r.top)/r.height));
z=nz;applySize();var r2=cv.getBoundingClientRect();st.scrollLeft+=r2.left+fx*r2.width-cx;st.scrollTop+=r2.top+fy*r2.height-cy;if(z<=1.001){st.scrollLeft=0;st.scrollTop=0}
updZ();clearTimeout(rtimer);rtimer=setTimeout(renderCurrent,180)}
function renderCurrent(){if(!curPage)return;var my=++rid,page=curPage,k=Math.min(window.devicePixelRatio||1,2.5),cssW=vpw*fit*z,cssH=vph*fit*z,px=cssW*k*cssH*k;if(px>3.6e7)k*=Math.sqrt(3.6e7/px);
var v=page.getViewport({scale:fit*z*k}),c=document.createElement('canvas');c.width=Math.floor(v.width);c.height=Math.floor(v.height);c.style.width=cssW+'px';c.style.height=cssH+'px';
if(rtask){try{rtask.cancel()}catch(e){}}rtask=page.render({canvasContext:c.getContext('2d'),viewport:v});
rtask.promise.then(function(){if(my!==rid)return;var w=document.createElement('div');w.className='pgwrap';w.style.width=cssW+'px';w.style.height=cssH+'px';w.appendChild(c);
var oldWrap=wrapEl;cv=c;wrapEl=w;applySize();st.insertBefore(w,$('.lb-next',st));if(oldWrap)oldWrap.remove();var ld=$('.lb-load',st);if(ld)ld.style.display='none';
if(pendingHL.length)drawHighlights(my,page,w,cssW,cssH)}).catch(function(e){if(e&&e.name==='RenderingCancelledException')return})}
function drawHighlights(my,page,wrap,cssW,cssH){if(my!==rid||!PDFJS||!PDFJS.TextLayer)return;
var div=document.createElement('div');div.className='hllayer';div.style.width=cssW+'px';div.style.height=cssH+'px';wrap.appendChild(div);
var cvp=page.getViewport({scale:fit*z});
try{var tl=new PDFJS.TextLayer({textContentSource:page.streamTextContent(),container:div,viewport:cvp});
tl.render().then(function(){if(my!==rid){div.remove();return}
var spans=div.querySelectorAll('span'),hit=null;
spans.forEach(function(sp){var t=(sp.textContent||'').toLowerCase();if(pendingHL.some(function(term){return term.length>=4&&t.indexOf(term)>=0})){sp.classList.add('pdfhl');if(!hit)hit=sp}});
if(hit)setTimeout(function(){try{hit.scrollIntoView({block:'center',inline:'center',behavior:reduce?'auto':'smooth'})}catch(e){}},50)}).catch(function(){})}catch(e){}}
function showPage(n){token++;var my=token;cur=n;Promise.all([getPdf(),getLabels()]).then(function(r){var pdf=r[0],lab=r[1];total=pdf.numPages;n=cur=Math.min(Math.max(n,1),total);
$('.c',lb).textContent=capOf(n,lab);$('.lb-n',lb).textContent=n+' / '+total;$('.lb-prev',lb).style.visibility=n>1?'visible':'hidden';$('.lb-next',lb).style.visibility=n<total?'visible':'hidden';
return pdf.getPage(n).then(function(page){if(my!==token)return;curPage=page;var vp=page.getViewport({scale:1});vpw=vp.width;vph=vp.height;z=1;updZ();computeFit();st.scrollLeft=0;st.scrollTop=0;if(cv)applySize();renderCurrent()})}).catch(function(e){if(e&&e.name==='RenderingCancelledException')return;var ld=$('.lb-load',st);if(ld)ld.style.display='none';if(!$('.lb-err',st)){var d=document.createElement('div');d.className='lb-err';d.innerHTML='Could not load the book viewer.<br><a href="book.pdf#page='+n+'" target="_blank" rel="noopener">Open PDF page '+n+'</a>';st.appendChild(d)}})}
function go(d){var n=cur+d;if(n<1||(total&&n>total))return;showPage(n)}
function openLb(a){buildLb();z=1;wrapEl&&wrapEl.remove();wrapEl=null;cv=null;curPage=null;
pendingHL=(a.dataset.q?a.dataset.q.toLowerCase().split(/\s+/):PAGE_HL).filter(function(t){return t&&t.length>=4});
var ld=$('.lb-load',lb);if(ld)ld.style.display='grid';var er=$('.lb-err',lb);if(er)er.remove();lb.classList.add('open');document.body.classList.add('lbopen');$('.x',lb).focus();updZ();showPage(+a.dataset.p||1)}
function closeLb(){if(!lb)return;lb.classList.remove('open');document.body.classList.remove('lbopen')}
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.pgimg');if(a&&a.dataset.p&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();openLb(a)}});
document.addEventListener('keydown',function(e){if(!isOpen())return;
if(e.key==='Escape')closeLb();else if(e.key==='ArrowRight'||e.key==='PageDown')go(1);else if(e.key==='ArrowLeft'||e.key==='PageUp')go(-1);
else if(e.key==='+'||e.key==='='){e.preventDefault();zoomCenter(z*1.4)}else if(e.key==='-'||e.key==='_'){e.preventDefault();zoomCenter(z/1.4)}else if(e.key==='0'){zoomCenter(1)}
else if(e.key==='z'||e.key==='Z'||e.key===' '){e.preventDefault();zoomCenter(z>1.5?1:ZDBL)}});
/* figure thumbnails, rendered on demand */
var thumbs=$$('canvas.thumb');if(thumbs.length&&'IntersectionObserver'in window){var tio=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;tio.unobserve(e.target);drawThumb(e.target)})},{rootMargin:'250px'});thumbs.forEach(function(c){tio.observe(c)})}
function drawThumb(c){getPdf().then(function(pdf){return pdf.getPage(+c.dataset.p)}).then(function(page){var w=c.parentNode.clientWidth||240,vp=page.getViewport({scale:1}),dpr=Math.min(window.devicePixelRatio||1,2),v=page.getViewport({scale:w/vp.width*dpr});c.width=v.width;c.height=v.height;return page.render({canvasContext:c.getContext('2d'),viewport:v}).promise}).catch(function(){c.parentNode.classList.add('nothumb')})}
})();
