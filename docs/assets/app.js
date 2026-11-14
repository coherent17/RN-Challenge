(function(){
var root=document.documentElement;
function setLang(l){root.dataset.lang=l;try{localStorage.setItem('lang',l)}catch(e){}
document.querySelectorAll('.lang button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.set===l)});
root.lang=l==='zh'?'zh-Hant':'en'}
document.querySelectorAll('.lang button').forEach(function(b){b.onclick=function(){setLang(b.dataset.set)}});
setLang(root.dataset.lang||'en');
var j=document.getElementById('jump');if(j)j.onchange=function(){location.href=j.value+(location.search||'')};
document.querySelectorAll('.q').forEach(function(q){
var ans=q.dataset.answer.split(',').map(Number),multi=ans.length>1,btns=q.querySelectorAll('.opts button');
btns.forEach(function(b){b.onclick=function(){if(q.dataset.done)return;
if(!multi)btns.forEach(function(x){x.classList.remove('sel')});b.classList.toggle('sel')}});
q.querySelector('.check').onclick=function(){q.dataset.done=1;
btns.forEach(function(b){var i=+b.dataset.i;if(ans.indexOf(i)>=0)b.classList.add('right');else if(b.classList.contains('sel'))b.classList.add('wrong')});
q.querySelector('.why').hidden=false}})
})();
