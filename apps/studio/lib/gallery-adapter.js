/* Adapter for the unchanged, approved template. Only behavior and factual copy. */
(() => {
 // Legacy :target rules conflict with History API after reload. Classes are the single navigation source.
 for(const sheet of document.styleSheets){if(sheet.href)continue;for(let i=sheet.cssRules.length-1;i>=0;i--){if(sheet.cssRules[i].selectorText?.includes(':target'))sheet.deleteRule(i);}}
 const ctx=window.BELEM_SERVER_CONTEXT;
 let revision=ctx.revision,dirty=false,saving=false,pending=false,conflict=false;
 const status=document.querySelector('#gallery .sub');
 status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 function savedCopy(){return selected.size+' fotografias escolhidas · '+ctx.included+' incluídas no pacote. Escolhas salvas.';}
 function notice(message,retry=false){status.replaceChildren(document.createTextNode(message));if(retry){const button=document.createElement('button');button.type='button';button.textContent=conflict?'Recarregar e conferir':'Tentar salvar novamente';button.onclick=()=>{if(conflict)location.reload();else{pending=true;void flush();}};status.append(document.createElement('br'),button);}}
 async function flush(){
  if(saving||conflict)return false;
  saving=true;
  try{
   while(pending){pending=false;const ids=[...selected].map(i=>ctx.photos[i].id);notice('Salvando suas escolhas…');
    const response=await fetch('/api/v1/gallery/'+ctx.id+'/selection',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({photoIds:ids,revision})});
    const data=await response.json();if(!response.ok){conflict=response.status===409;throw new Error(data.error||'Não foi possível salvar.');}revision=data.revision;
   }
   dirty=false;notice(savedCopy());return true;
  }catch(e){dirty=true;pending=false;notice(e instanceof TypeError?'Não foi possível confirmar o salvamento. Verifique a conexão e tente novamente.':e.message||'Conexão interrompida. Suas últimas escolhas ainda não foram salvas.',true);return false;}
  finally{saving=false;}
 }
 persistBelemState=function(){dirty=true;pending=true;void flush();};
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 const oldFinish=belemFinish;
 belemFinish=async function(){if(saving){notice('Aguarde o salvamento das suas escolhas.');return;}if(dirty){pending=true;if(!await flush())return;}oldFinish();document.querySelector('#finish .last>p').textContent='Suas fotografias escolhidas estão salvas para o estúdio.';document.querySelector('#finish .npnotice').textContent='Esta etapa registra a seleção das fotografias. Loja, pedido e pagamento ainda não estão disponíveis; não há cobrança.';};
 const oldNavigate=belemNavigate;
 belemNavigate=function(destination,ev){if(!['home','gallery','slides','shop','review','finish'].includes(destination))return false;if(ev)ev.preventDefault();if(location.hash!=='#'+destination)history.pushState(null,'',location.pathname+'#'+destination);return oldNavigate(destination,ev);};
 window.addEventListener('popstate',()=>oldNavigate(location.hash.slice(1)||'home'));
 const initial=['gallery','slides','home'].includes(location.hash.slice(1))?location.hash.slice(1):'home';
 history.replaceState(null,'',location.pathname+'#'+initial);oldNavigate(initial);
 let wantsOpening=false;
 const originalToggle=toggleOpeningMusic,originalStart=startOpeningMusic;
 toggleOpeningMusic=function(){wantsOpening=openingAudio.paused;originalToggle();};
 startOpeningMusic=function(){if(wantsOpening)originalStart();};
 const viewer=document.getElementById('photoViewer');viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Fotografia ampliada');
 let trigger=null;const open=openPhotoViewer,close=closePhotoViewer;
 openPhotoViewer=function(i){if(!viewer.classList.contains('active'))trigger=document.activeElement;open(i);for(const key of ['home','gallery','shop','review','finish','slides'])document.getElementById(key).inert=true;viewer.querySelector('button').focus();};
 closePhotoViewer=function(){const wasOpen=viewer.classList.contains('active');close();for(const key of ['home','gallery','shop','review','finish','slides'])document.getElementById(key).inert=false;if(wasOpen&&trigger)trigger.focus();};
 viewer.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=Array.from(viewer.querySelectorAll('button'));const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
 const oldCounts=updateCounts;updateCounts=function(){oldCounts();document.querySelectorAll('.card').forEach(card=>card.querySelector('.heart').setAttribute('aria-pressed',String(selected.has(Number(card.dataset.index)))));};updateCounts();notice(savedCopy());
 const sheet=document.createElement('style');sheet.textContent='@media(prefers-reduced-motion:reduce){.show .image #slideImg,.show .image #slideImgNext{transition:none!important}.bigstar{animation:none!important}}';document.head.append(sheet);
})();
