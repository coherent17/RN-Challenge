/* Mock exam: adaptive (CAT-style) and fixed-length simulations. Training tool, not a predictor of real results. */
(function(){
'use strict';
var NX=window.NX;if(!NX)return;
var $=function(s,c){return(c||document).querySelector(s)},$$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
var esc=NX.esc,bi=NX.bi,L=NX.L,sameSet=NX.sameSet;
var CATS={
 MC:{w:.20,en:'Management of Care',zh:'照護管理'},SI:{w:.12,en:'Safety & Infection Control',zh:'安全與感染控制'},
 HP:{w:.09,en:'Health Promotion & Maintenance',zh:'健康促進與維護'},PI:{w:.09,en:'Psychosocial Integrity',zh:'心理社會整合'},
 BC:{w:.09,en:'Basic Care & Comfort',zh:'基本照護與舒適'},PH:{w:.15,en:'Pharmacological & Parenteral Therapies',zh:'藥物與靜脈治療'},
 RR:{w:.12,en:'Reduction of Risk Potential',zh:'降低風險潛能'},PA:{w:.14,en:'Physiological Adaptation',zh:'生理適應'}};
var MODES={cat:{name:['Full NCLEX simulation','完整 NCLEX 模擬'],min:85,max:150,mins:300,adaptive:true,breaks:[60,120]},
 f75:{name:['75-question mock','75 題模擬'],n:75,mins:90,adaptive:false,breaks:[38]},
 f25:{name:['25-question sprint','25 題衝刺'],n:25,mins:30,adaptive:false,breaks:[]}};
var PASS_STD=0.9,ALL=[],run=null,timerId=0,setup=$('#ex-setup'),box=$('#ex-run'),res=$('#ex-res');
function store(){var S=NX.S();S.exams=S.exams||[];return S}
function pad(n){return('0'+n).slice(-2)}
function clock(ms){ms=Math.max(0,Math.round(ms/1000));var h=Math.floor(ms/3600),m=Math.floor(ms%3600/60);return h+':'+pad(m)+':'+pad(ms%60)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function P(th,b){return 1/(1+Math.exp(-(th-b)))}

fetch(NX.BASE+'questions.json').then(function(r){return r.json()}).then(function(d){ALL=d.filter(function(q){return q.cat});ALL.forEach(function(q,i){q.id=i});var n=$('#ex-n');if(n)n.textContent=ALL.length;renderHist()});
$$('.mode').forEach(function(b){b.onclick=function(){if(ALL.length)start(b.dataset.mode)}});

function renderHist(){var h=store().exams,el=$('#ex-hist');if(!h.length){el.innerHTML='';return}
el.innerHTML='<div class="card rv in"><h3>'+L('Your recent attempts','最近的作答紀錄')+'</h3><div class="hist">'+h.slice(0,6).map(function(x){var d=new Date(x.t);
return '<div class="hrow"><span>'+d.toLocaleDateString()+'</span><span>'+L(x.name[0],x.name[1])+'</span><span>'+x.n+' '+L('questions','題')+'</span><b>'+Math.round(x.acc*100)+'%</b>'+(x.v?'<span class="vb '+x.v+'">'+(x.v==='pass'?L('Pass','通過'):L('Not yet','未通過'))+'</span>':'<span></span>')+'</div>'}).join('')+'</div></div>'}

/* ---------- question selection ---------- */
function fixedSet(n){var cats=Object.keys(CATS),alloc={},tot=0;cats.forEach(function(k){alloc[k]=Math.round(CATS[k].w*n);tot+=alloc[k]});
while(tot<n){alloc.PA++;tot++}while(tot>n){alloc.PA--;tot--}
var pick=[],used={};cats.forEach(function(k){shuffle(ALL.filter(function(q){return q.cat===k})).slice(0,alloc[k]).forEach(function(q){pick.push(q);used[q.id]=1})});
if(pick.length<n)shuffle(ALL.filter(function(q){return!used[q.id]})).slice(0,n-pick.length).forEach(function(q){pick.push(q)});return shuffle(pick)}
function pickCat(){var n=run.answered.length+1,best=null,bd=-1e9;Object.keys(CATS).forEach(function(k){if(!run.pool.some(function(q){return q.cat===k&&!run.used[q.id]}))return;var d=CATS[k].w*n-(run.counts[k]||0);if(d>bd){bd=d;best=k}});return best}
function nextItem(){var M=run.M;if(!M.adaptive)return run.list[run.answered.length];var k=pickCat();if(!k)return null;
var c=run.pool.filter(function(q){return q.cat===k&&!run.used[q.id]});c.sort(function(a,b){return Math.abs(a.b-run.theta)-Math.abs(b.b-run.theta)});var top=c.slice(0,4);return top[Math.floor(Math.random()*top.length)]}
function estimate(){var th=run.theta;for(var it=0;it<25;it++){var g=-th/4,h=-.25;run.answered.forEach(function(a){var p=P(th,a.q.b);g+=(a.ok?1:0)-p;h-=p*(1-p)});var d=g/-h;th=Math.max(-5,Math.min(5,th+d));if(Math.abs(d)<1e-4)break}
run.theta=th;var info=.25;run.answered.forEach(function(a){var p=P(th,a.q.b);info+=p*(1-p)});run.se=1/Math.sqrt(info);run.traj.push([th,run.se])}

/* ---------- run (screen modelled on the NCSBN/Pearson VUE exam frame) ---------- */
var nxEl=null;
function frame(inner,right){return '<div class="nx-top"><span class="nx-title">'+L('NCLEX-RN Practice Exam – '+run.M.name[0],'NCLEX-RN 練習測驗 – '+run.M.name[1])+'</span><span class="nx-r">'+(right||'')+'</span></div>'+inner}
function openFrame(){if(nxEl)return;nxEl=document.createElement('div');nxEl.className='nx';document.body.appendChild(nxEl);document.body.classList.add('nx-on')}
function closeFrame(){if(nxEl){nxEl.remove();nxEl=null}document.body.classList.remove('nx-on')}
function dialog(title,msg,btns){var m=document.createElement('div');m.className='modal nxd';m.innerHTML='<div class="mbox"><h4>'+title+'</h4><div class="nxd-b"><span class="nxd-i">i</span><p>'+msg+'</p></div><div class="mbtns">'+btns.map(function(b,i){return '<button type="button" class="nxbtn" data-b="'+i+'">'+b[0]+'</button>'}).join('')+'</div></div>';document.body.appendChild(m);
$$('[data-b]',m).forEach(function(el){el.onclick=function(){m.remove();btns[+el.dataset.b][1]()}});var f=$('[data-b]',m);if(f)f.focus();return m}
function start(mode){var M=MODES[mode];run={mode:mode,M:M,pool:ALL.slice(),used:{},counts:{},answered:[],flagged:{},theta:0,se:2,traj:[],t0:0,deadline:0,list:M.adaptive?null:fixedSet(M.n),cur:null,qStart:0,done:false};
setup.hidden=true;res.hidden=true;scrollTo({top:0});openFrame();intro()}
function intro(){var M=run.M;nxEl.innerHTML=frame('<div class="nx-tool"></div><div class="nx-main"><div class="nx-gut"></div><div class="nx-body intro"><h2>'+L('NCLEX-RN PRACTICE EXAM','NCLEX-RN 練習測驗')+'</h2>'+
'<p>'+L('This practice exam is modelled on how the NCLEX is delivered. It is a training tool and is not affiliated with NCSBN or Pearson VUE.','本練習測驗仿照 NCLEX 的作答方式，僅供訓練使用，與 NCSBN 或 Pearson VUE 無關。')+'</p><ul>'+
'<li>'+L('Answer each question to continue. You cannot go back or skip.','每題都必須作答才能繼續，無法回上一題或跳過。')+'</li>'+
'<li>'+L('You will not see whether an answer was right until the exam ends.','考試結束前不會看到答案對錯。')+'</li>'+
'<li>'+L('Time allowed: '+M.mins+' minutes. The clock is shown at the top right.','限時 '+M.mins+' 分鐘，倒數計時顯示於右上角。')+'</li>'+
(M.adaptive?'<li>'+L('Between '+M.min+' and '+M.max+' questions. The exam may end as soon as the result is clear.','共 '+M.min+'–'+M.max+' 題；結果明確時可能提前結束。')+'</li>':'<li>'+L(M.n+' questions.',M.n+' 題。')+'</li>')+
'<li>'+L('Use the Calculator button for calculations.','計算題可使用「Calculator」按鈕。')+'</li></ul><p>'+L('Click the <b>Next</b> button to proceed.','請按 <b>Next</b> 開始。')+'</p></div></div>'+
'<div class="nx-bot"><span></span><button type="button" class="nx-next" id="nx-go"><span><u>N</u>ext</span><span class="ar">➔</span></button><button type="button" class="nx-quit" id="nx-quit">'+L('Cancel','取消')+'</button></div>');
$('#nx-go').onclick=begin;$('#nx-quit').onclick=function(){run=null;closeFrame();setup.hidden=false}}
function begin(){run.t0=Date.now();run.deadline=run.t0+run.M.mins*60000;clearInterval(timerId);timerId=setInterval(tick,1000);next()}
function tick(){if(!run||run.done)return;var left=run.deadline-Date.now(),t=$('#ex-t');if(t){t.textContent=clock(left);t.classList.toggle('low',left<600000)}if(left<=0)finish('time')}
function next(){var q=nextItem();if(!q){finish(run.M.adaptive?'max':'complete');return}run.cur=q;run.qStart=Date.now();render(q)}
function splitPrompt(t){var m=t.match(/^([\s\S]*?[.。!！]["”)]?\s*)([^.。!！]*[?？]["”)]?\s*)$/);return m&&m[1].trim()?[m[1].trim(),m[2].trim()]:['',t]}
function stemHtml(st){var e=splitPrompt(st.en),z=splitPrompt(st.zh),same=st.en===st.zh;
function one(parts,lang){return (parts[0]?'<p class="nx-sc">'+esc(parts[0])+'</p>':'')+'<p class="nx-prompt"><span class="ar">➤</span><span>'+esc(parts[1])+'</span></p>'}
return same?one(e):'<div class="en">'+one(e)+'</div><div class="zh">'+one(z)+'</div>'}
function flagSvg(on){return '<svg viewBox="0 0 24 24"'+(on?' fill="currentColor"':' fill="none"')+' stroke="currentColor" stroke-width="2"><path d="M5 3v18M5 4h11l-3 4 3 4H5"/></svg>'}
function render(q){var M=run.M,n=run.answered.length+1,multi=q.answer.length>1,tot=M.adaptive?null:M.n,flagged=!!run.flagged[q.id];
nxEl.hidden=false;nxEl.innerHTML=frame('<div class="nx-tool"><button type="button" id="ex-calc"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2"/></svg>Calculator</button><button type="button" id="ex-flag" class="'+(flagged?'on':'')+'" title="'+'Flag for review (Space)'+'">'+flagSvg(flagged)+'<span>'+L('Flag','標記')+'</span></button><button type="button" id="ex-exit">'+L('End exam','結束考試')+'</button></div>'+
'<div class="nx-main"><div class="nx-gut"></div><div class="nx-body" id="nx-body">'+stemHtml(q.stem)+(multi?'<p class="nx-sata">'+L('Select all that apply.','請選出所有適當的答案。')+'</p>':'')+
'<ul class="nxo">'+q.options.map(function(o,i){return '<li><label class="nxl"><input type="'+(multi?'checkbox':'radio')+'" name="nxo" value="'+i+'"><span class="nn">'+(i+1)+'.</span><span class="txt">'+bi(o)+'</span></label></li>'}).join('')+'</ul></div></div>'+
'<div class="nx-bot"><span></span><button type="button" class="nx-next" id="ex-next"><span><u>N</u>ext</span><span class="ar">➔</span></button></div>','<span class="nx-timer" id="ex-t">'+clock(run.deadline-Date.now())+'</span><span class="nx-cnt"><svg viewBox="0 0 24 24"><path d="M4 7h14M4 12h14M4 17h14"/></svg>'+(tot?n+' of '+tot:'Item '+n)+'</span>');
var inputs=$$('input[name=nxo]',nxEl);
function go(){var sel=inputs.filter(function(x){return x.checked}).map(function(x){return+x.value});if(!sel.length){dialog(L('Response Required','需要作答'),L('You cannot continue with this question unanswered.','此題尚未作答，無法繼續。'),[['OK',function(){}]]);return}submit(q,sel)}
function toggleFlag(){run.flagged[q.id]=!run.flagged[q.id];var b=$('#ex-flag',nxEl);if(b){b.classList.toggle('on',run.flagged[q.id]);b.innerHTML=flagSvg(run.flagged[q.id])+'<span>'+L('Flag','標記')+'</span>'}}
$('#ex-next').onclick=go;$('#ex-flag').onclick=toggleFlag;
$('#ex-calc').onclick=calc;$('#ex-exit').onclick=function(){dialog(L('End Exam','結束考試'),L('End the exam now? Your answers so far will be scored, but there is no pass/fail verdict.','現在結束考試？已作答的題目會計分，但不會產生通過／未通過判定。'),[[L('End exam','結束考試'),function(){finish('quit')}],[L('Cancel','取消'),function(){}]])};
nxEl.scrollTop=0;if($('#nx-body'))$('#nx-body').scrollTop=0}
document.addEventListener('keydown',function(e){if(!run||run.done||!nxEl||nxEl.hidden||$('.modal'))return;if(/textarea|select/i.test(e.target.tagName))return;var k=e.key;
if(k==='n'||k==='N'){e.preventDefault();var b=$('#ex-next')||$('#nx-go');if(b)b.click()}else if(k===' '){e.preventDefault();var f=$('#ex-flag',nxEl);if(f)f.click()}else if(/^[1-9]$/.test(k)){var inp=$$('input[name=nxo]',nxEl)[+k-1];if(inp){inp.click()}}});
function submit(q,sel){var ok=sameSet(sel,q.answer);run.answered.push({q:q,sel:sel,ok:ok,sec:Math.round((Date.now()-run.qStart)/1000)});run.used[q.id]=1;run.counts[q.cat]=(run.counts[q.cat]||0)+1;estimate();
var n=run.answered.length,M=run.M;
if(M.adaptive&&n>=M.min){var lo=run.theta-1.96*run.se,hi=run.theta+1.96*run.se;if(lo>PASS_STD)return finish('ci-pass');if(hi<PASS_STD)return finish('ci-fail');if(n>=M.max)return finish('max')}
if(!M.adaptive&&n>=M.n)return finish('complete');
if(M.breaks.indexOf(n)>=0&&!run['b'+n]){run['b'+n]=1;return askBreak()}
next()}

/* ---------- breaks and calculator ---------- */
function askBreak(){dialog(L('Optional Break','可選擇的休息'),L('You can take a break now. The exam clock keeps running while you are on break.','你現在可以休息。休息期間考試計時不會停止。'),[[L('Take a break','休息一下'),function(){nxEl.hidden=true;var m=document.createElement('div');m.className='modal nxd';m.innerHTML='<div class="mbox"><h4>'+L('On Break','休息中')+'</h4><div class="nxd-b"><span class="nxd-i">i</span><p>'+L('Time left on the exam clock: ','剩餘考試時間：')+'<b id="bk-t">'+clock(run.deadline-Date.now())+'</b></p></div><div class="mbtns"><button type="button" class="nxbtn" data-resume>'+L('Resume exam','繼續考試')+'</button></div></div>';document.body.appendChild(m);var iv=setInterval(function(){var e=$('#bk-t');if(e)e.textContent=clock(run.deadline-Date.now())},1000);$('[data-resume]',m).onclick=function(){clearInterval(iv);m.remove();nxEl.hidden=false;next()}}],[L('Continue now','直接繼續'),function(){next()}]])}
function calc(){if($('.calc'))return;var m=document.createElement('div');m.className='modal calc';var keys=['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','±','0','.','='];
m.innerHTML='<div class="mbox calcbox"><div class="cdisp">0</div><div class="cgrid">'+keys.map(function(k){return '<button type="button" data-k="'+k+'" class="'+('÷×−+='.indexOf(k)>=0?'op':'')+'">'+k+'</button>'}).join('')+'</div><button class="btn" data-close style="margin-top:12px;width:100%;justify-content:center">'+L('Close','關閉')+'</button></div>';document.body.appendChild(m);
var cur='0',acc=null,op=null,fresh=false,dsp=$('.cdisp',m);
function fmt(x){return isFinite(x)?String(parseFloat(x.toPrecision(12))):'Error'}
function show(){dsp.textContent=cur}
function comp(){var a=acc,b=parseFloat(cur);return op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:op==='÷'?a/b:b}
function press(k){if(cur==='Error'&&k!=='C'){return}
if(/^\d$/.test(k)){cur=(fresh||cur==='0')?k:cur+k;fresh=false}else if(k==='.'){if(fresh){cur='0.';fresh=false}else if(cur.indexOf('.')<0)cur+='.'}
else if(k==='C'){cur='0';acc=null;op=null;fresh=false}else if(k==='⌫'){cur=cur.length>1?cur.slice(0,-1):'0'}else if(k==='±'){cur=fmt(-parseFloat(cur))}else if(k==='%'){cur=fmt(parseFloat(cur)/100)}
else if(k==='='){if(op){cur=fmt(comp());op=null;acc=null;fresh=true}}
else{if(op&&!fresh){acc=comp();cur=fmt(acc)}else acc=parseFloat(cur);op=k;fresh=true}show()}
$$('[data-k]',m).forEach(function(b){b.onclick=function(){press(b.dataset.k)}});
function close(){m.remove();document.removeEventListener('keydown',kd,true)}
function kd(e){var map={'*':'×','/':'÷','-':'−','Enter':'=','Backspace':'⌫'},k=map[e.key]||e.key;if(e.key==='Escape'){e.stopPropagation();close();return}
if(/^[0-9.+%]$/.test(k)||'×÷−=⌫'.indexOf(k)>=0||k==='c'||k==='C'){e.preventDefault();e.stopPropagation();press(k==='c'?'C':k)}}
document.addEventListener('keydown',kd,true);$('[data-close]',m).onclick=close;m.onclick=function(e){if(e.target===m)close()}}

/* ---------- results ---------- */
function finish(reason){if(run.done)return;run.done=true;clearInterval(timerId);var M=run.M,A=run.answered,n=A.length,ok=A.filter(function(a){return a.ok}).length,acc=n?ok/n:0,verdict=null;
if(M.adaptive){if(reason==='ci-pass')verdict='pass';else if(reason==='ci-fail')verdict='fail';else if((reason==='max'||reason==='time')&&n>=M.min)verdict=run.theta>PASS_STD?'pass':'fail';else if(reason==='time'&&n<M.min)verdict='fail'}
var S=store();S.exams.unshift({t:Date.now(),mode:run.mode,name:M.name,n:n,acc:acc,v:verdict,th:run.theta});S.exams=S.exams.slice(0,20);NX.save();
if(n>=5){NX.award(Math.min(120,15+ok)+(verdict==='pass'?50:0),'exam finished');if(verdict==='pass'||acc>=.8)setTimeout(NX.confetti,500)}
closeFrame();$$('.modal').forEach(function(m){m.remove()});box.hidden=true;res.hidden=false;renderResult(reason,verdict,n,ok,acc);scrollTo({top:0})}
var WHY={'ci-pass':['Your ability estimate stayed above the passing standard with 95% confidence, so the test stopped.','你的能力估計值以 95% 信心高於通過標準，因此提前結束。'],
 'ci-fail':['Your ability estimate stayed below the passing standard with 95% confidence, so the test stopped.','你的能力估計值以 95% 信心低於通過標準，因此提前結束。'],
 'max':['You reached the maximum number of questions, so the result comes from your final ability estimate.','已達最多題數，依最終能力估計值判定。'],
 'time':['Time ran out, so the result comes from your ability estimate at that point.','時間用盡，依當時的能力估計值判定。'],
 'quit':['You ended the exam early, so there is no verdict.','你提前結束考試，因此沒有判定結果。'],'complete':['Fixed-length set finished.','固定題數題組已完成。']};
function chart(){var T=run.traj;if(T.length<2)return '';var W=640,H=230,pl=34,pr=10,pt=12,pb=26,n=T.length;function X(i){return pl+(i/(Math.max(n-1,1)))*(W-pl-pr)}function Y(v){v=Math.max(-3,Math.min(3,v));return pt+(3-v)/6*(H-pt-pb)}
var up=T.map(function(t,i){return X(i)+','+Y(t[0]+1.96*t[1])}),lo=T.map(function(t,i){return X(n-1-i)+','+Y(T[n-1-i][0]-1.96*T[n-1-i][1])}),line=T.map(function(t,i){return X(i)+','+Y(t[0])}).join(' ');
var min85=run.M.min&&n>run.M.min?'<line class="ch-m" x1="'+X(run.M.min-1)+'" x2="'+X(run.M.min-1)+'" y1="'+pt+'" y2="'+(H-pb)+'"/><text class="ch-t" x="'+(X(run.M.min-1)+4)+'" y="'+(pt+10)+'">85</text>':'';
return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Ability estimate over the exam"><polygon class="ch-band" points="'+up.concat(lo).join(' ')+'"/><line class="ch-pass" x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/><text class="ch-t" x="4" y="'+(Y(0)+4)+'">'+'pass'+'</text>'+min85+'<polyline class="ch-line" points="'+line+'"/><text class="ch-t" x="'+pl+'" y="'+(H-6)+'">1</text><text class="ch-t" x="'+(W-pr-14)+'" y="'+(H-6)+'">'+n+'</text></svg>'}
function renderResult(reason,verdict,n,ok,acc){var M=run.M,A=run.answered,why=WHY[reason]||['',''],spent=Date.now()-run.t0,byCat={};
A.forEach(function(a){var c=byCat[a.q.cat]||(byCat[a.q.cat]={n:0,ok:0});c.n++;if(a.ok)c.ok++});
var bars=Object.keys(CATS).filter(function(k){return byCat[k]}).map(function(k){var c=byCat[k],p=Math.round(c.ok/c.n*100);return '<div class="cbar"><span class="cn">'+L(CATS[k].en,CATS[k].zh)+'</span><div class="cb"><i style="width:'+p+'%" class="'+(p>=70?'g':p>=50?'y':'r')+'"></i></div><b>'+p+'%</b><small>'+c.ok+'/'+c.n+'</small></div>'}).join('');
var missed=A.filter(function(a){return!a.ok});
var rev=missed.map(function(a){var q=a.q,letters=function(l){return l.map(function(i){return 'ABCDEFGH'[i]}).join(', ')||'—'};
return '<details class="mrev"><summary><b>'+L('Ch '+q.ch,'第 '+q.ch+' 章')+'</b> · '+bi({en:q.stem.en.length>120?q.stem.en.slice(0,120)+'…':q.stem.en,zh:q.stem.zh.length>70?q.stem.zh.slice(0,70)+'…':q.stem.zh})+'</summary><div class="mbody"><p class="mq">'+bi(q.stem)+'</p><ul class="opts">'+q.options.map(function(o,i){var right=q.answer.indexOf(i)>=0,mine=a.sel.indexOf(i)>=0;return '<li><div class="ro '+(right?'right':mine?'wrong':'')+'"><span class="ltr">'+'ABCDEFGH'[i]+'</span><span class="txt">'+bi(o)+'</span></div></li>'}).join('')+'</ul><p class="why2"><b>'+L('Correct: ','正確答案：')+letters(q.answer)+' · '+L('You chose: ','你選：')+letters(a.sel)+'</b><br>'+bi(q.why)+'</p>'+NX.pageTag(q.refs,(q.why&&q.why.en)||(q.stem&&q.stem.en))+'<a href="ch'+('0'+q.ch).slice(-2)+'.html#practice">'+L('Open chapter '+q.ch,'前往第 '+q.ch+' 章')+'</a></div></details>'}).join('');
res.innerHTML='<div class="verdict '+(verdict||'none')+'"><span class="vk">'+(M.adaptive?L('Simulated result','模擬結果'):L('Your score','你的成績'))+'</span><h2>'+(verdict==='pass'?L('PASS','通過'):verdict==='fail'?L('NOT YET','尚未通過'):Math.round(acc*100)+'%')+'</h2><p>'+L(why[0],why[1])+'</p></div>'+
'<div class="rstats"><div><b>'+n+'</b><span>'+L('questions','題數')+'</span></div><div><b>'+Math.round(acc*100)+'%</b><span>'+L('correct','答對率')+'</span></div><div><b>'+clock(spent)+'</b><span>'+L('time used','用時')+'</span></div>'+(M.adaptive?'<div><b>'+run.theta.toFixed(2)+'</b><span>'+L('ability ± '+(1.96*run.se).toFixed(2),'能力值 ± '+(1.96*run.se).toFixed(2))+'</span></div>':'')+(Object.keys(run.flagged).filter(function(k){return run.flagged[k]}).length?'<div><b>'+Object.keys(run.flagged).filter(function(k){return run.flagged[k]}).length+'</b><span>'+L('flagged (no revisit, like the real exam)','已標記（如正式考試，無法返回）')+'</span></div>':'')+'</div>'+
(M.adaptive&&chart()?'<div class="card"><h3>'+L('Ability estimate over the exam','作答過程中的能力估計')+'</h3>'+chart()+'<p class="note">'+L('Line = your estimated level. Shaded band = 95% confidence. The test stops once the band is entirely above or below the dashed pass line (after question 85).','實線＝估計能力；陰影＝95% 信賴區間。第 85 題之後，區間完全高於或低於虛線（通過標準）時即結束。')+'</p></div>':'')+
'<div class="card"><h3>'+L('Performance by exam category','各考試類別表現')+'</h3><div class="cbars">'+bars+'</div></div>'+
(missed.length?'<h3 class="rh">'+L('Review your '+missed.length+' missed question'+(missed.length>1?'s':''),'檢討答錯的 '+missed.length+' 題')+'</h3>'+rev:'<div class="card"><p>'+L('You answered every question correctly — nothing to review.','全部答對，沒有需要檢討的題目！')+'</p></div>')+
'<p class="note disc">'+L('Training simulation only. Question difficulty here is estimated, not statistically calibrated like the real NCLEX, so this verdict does not predict your real result.','僅為訓練用模擬。本站題目難度為估算，並未像正式 NCLEX 以統計校準，因此判定結果無法預測實際考試成績。')+'</p>'+
'<div class="cta" style="justify-content:center"><button class="btn pri big" id="ex-again">'+L('Back to exam menu','回到模擬考選單')+'</button><a class="btn big" href="index.html">'+L('Study chapters','回章節學習')+'</a></div>';
NX.fillBookLabels(res);$('#ex-again').onclick=function(){res.hidden=true;setup.hidden=false;renderHist();scrollTo({top:0})}}
})();
