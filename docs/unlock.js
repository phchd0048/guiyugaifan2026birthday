'use strict';
(()=>{
const settings={"salt":"CzAegYDTYMh0okgW7wQGZQ==","iv":"+DMoYcNwP7iHfjBh","iterations":600000,"files":["activity-01.enc?v=400b896439bccc6c","activity-02.enc?v=400b896439bccc6c","activity-03.enc?v=400b896439bccc6c","activity-04.enc?v=400b896439bccc6c","activity-05.enc?v=400b896439bccc6c"]};
const form=document.querySelector('#unlock-form'),field=document.querySelector('#passphrase'),button=document.querySelector('#unlock-button'),message=document.querySelector('#message');
let ciphertext=null,busy=false;
function info(text,error=false){message.textContent=text;message.classList.toggle('error',error)}
function bytes(base64){return Uint8Array.from(atob(base64),c=>c.charCodeAt(0))}
if(!window.isSecureContext||!window.crypto?.subtle){info('请使用支持加密功能的浏览器，通过 HTTPS 网页链接打开。',true);return}
button.disabled=false;
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!field.value)return;busy=true;button.disabled=true;field.disabled=true;
 const passphrase=field.value;field.value='';
 try{
  if(!ciphertext){try{const files=settings.files||['activity.enc'],parts=[];let size=0;for(let i=0;i<files.length;i++){info('正在读取活动内容 '+(i+1)+' / '+files.length+'，首次打开需要一点时间……');const response=await fetch('./'+files[i],{cache:'default',credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('network');const part=new Uint8Array(await response.arrayBuffer());parts.push(part);size+=part.length}const joined=new Uint8Array(size);let offset=0;for(const part of parts){joined.set(part,offset);offset+=part.length}ciphertext=joined.buffer}catch{info('活动内容未能下载，请检查网络后重试。',true);return}}
  info('正在验证访问口令……');
  let clear;
  try{const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes(settings.salt),iterations:settings.iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(settings.iv),tagLength:128},key,ciphertext)}catch{info('口令不正确，请重新输入。',true);return}
  const html=new TextDecoder('utf-8',{fatal:true}).decode(clear);
  if(!html.startsWith('<!doctype html>')&&!html.startsWith('<!DOCTYPE html>'))throw Error('invalid-document');
  ciphertext=null;info('验证通过，正在进入……');
  // Only the complete authenticated document is executed. No plaintext is stored.
  document.open();document.write(html);document.close();
 }catch{info('页面未能载入，请重新打开后再试。',true)}finally{busy=false;if(button.isConnected){button.disabled=false;field.disabled=false;field.focus()}}
});
})();
