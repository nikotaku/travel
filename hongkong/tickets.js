'use strict';
(() => {
  const status = document.querySelector('#wallet-status');
  const slots = ['outbound', 'inbound', 'osaka', 'hongkong'];
  const names = {outbound:'往路搭乗用', inbound:'復路搭乗用', osaka:'大阪ホテル', hongkong:'香港ホテル'};
  const viewer = document.querySelector('#ticket-viewer');
  const body = document.querySelector('#ticket-viewer-body');
  let currentUrl;
  const dbReady = new Promise((resolve,reject) => {
    const request = indexedDB.open('hk2026-ticket-wallet',1);
    request.onupgradeneeded = () => request.result.createObjectStore('files',{keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  async function transaction(mode, run) {
    const db = await dbReady;
    return new Promise((resolve,reject) => {
      const tx = db.transaction('files',mode);
      const request = run(tx.objectStore('files'));
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('保存失敗'));
    });
  }
  const all = () => transaction('readonly', s => s.getAll());
  const put = record => transaction('readwrite', s => s.put(record));
  function closeViewer() {
    viewer.close(); body.replaceChildren();
    if(currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  function show(record) {
    if(currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(record.blob);
    document.querySelector('#ticket-viewer-title').textContent = names[record.slot] + ' / 予約控え';
    const download = document.querySelector('#ticket-download');
    download.href = currentUrl; download.download = record.name;
    body.replaceChildren(); body.classList.remove('zoomed');
    const pdf = record.blob.type === 'application/pdf';
    const media = document.createElement(pdf ? 'iframe' : 'img');
    media.src = currentUrl;
    if(pdf) media.title = record.name;
    else media.alt = record.name;
    body.append(media);
    document.querySelector('#ticket-zoom').hidden = pdf;
    document.querySelector('#ticket-zoom').textContent = '拡大する';
    viewer.showModal();
  }
  document.querySelector('#close-ticket-viewer').addEventListener('click',closeViewer);
  viewer.addEventListener('cancel',e => {e.preventDefault();closeViewer();});
  document.querySelector('#ticket-zoom').addEventListener('click', e => {
    const zoomed = body.classList.toggle('zoomed'); e.target.textContent = zoomed ? '全体を見る' : '拡大する';
  });
  async function render() {
    const files = await all();
    for(const slot of slots) {
      const host = document.querySelector('#ticket-'+slot); host.replaceChildren();
      const records = files.filter(r=>r.slot===slot);
      if(!records.length) {
        const p = document.createElement('p'); p.textContent = slot==='outbound'||slot==='inbound' ? '原本はまだこの端末にありません。上の解除コードで取り込めます。' : '予約控えは未登録です。画像またはPDFを追加できます。'; host.append(p);
      }
      records.forEach(record => {
        const row = document.createElement('div'); row.className='ticket-file';
        const info = document.createElement('div'); const title = document.createElement('b'); title.textContent=record.name;
        const small = document.createElement('small'); small.textContent='この端末に保存済み'; info.append(title,small);
        const open = document.createElement('button'); open.className='button primary'; open.textContent='原本を表示'; open.type='button'; open.addEventListener('click',()=>show(record));
        const remove = document.createElement('button'); remove.className='button'; remove.textContent='削除'; remove.type='button';
        remove.addEventListener('click',async()=>{
          if(!confirm('この端末から「'+record.name+'」を削除しますか？')) return;
          try { await transaction('readwrite',s=>s.delete(record.id)); await render(); status.textContent='この端末から削除しました。'; } catch {status.textContent='削除できませんでした。';}
        });
        row.append(info,open,remove); host.append(row);
      });
    }
    document.querySelector('#ticket-unlock').hidden = files.some(r=>r.id==='original-outbound') && files.some(r=>r.id==='original-inbound') && files.some(r=>r.id==='original-hongkong');
    status.textContent=files.length ? files.length+'件の控えをこの端末に保存済み。原本を開いて確認してください。' : '控えは未保存です。取り込み後は同じ端末で開けます。';
  }
  const decode = value => Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  document.querySelector('#unlock-form').addEventListener('submit',async e=>{
    e.preventDefault(); const button=e.target.querySelector('button'); button.disabled=true;
    status.textContent='航空券・ホテルの原本を確認・保存しています…';
    try {
      const response=await fetch('./tickets.enc.json?v=9'); if(!response.ok) throw new Error('network');
      const bundle=await response.json();
      const code=document.querySelector('#ticket-code').value.replace(/[\s-]/g,'').toLowerCase();
      const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
      const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(bundle.salt),iterations:600000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(bundle.iv)},key,decode(bundle.data));
      const records=JSON.parse(new TextDecoder().decode(plain));
      for(const record of records) await put({id:'original-'+record.slot,slot:record.slot,name:record.name,blob:new Blob([decode(record.data)],{type:record.type})});
      document.querySelector('#ticket-code').value=''; await render();
    } catch {status.textContent='取り込めませんでした。解除コード・通信状態・端末の空き容量を確認して再試行してください。';}
    finally {button.disabled=false;}
  });
  document.querySelectorAll('[data-ticket-upload]').forEach(input=>input.addEventListener('change',async()=>{
    const files=[...input.files]; let count=0;
    try {
      for(const file of files) {
        if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type) || file.size>20*1024*1024) throw new Error('format');
        await put({id:crypto.randomUUID(),slot:input.dataset.ticketUpload,name:file.name,blob:file}); count++;
      }
      await render(); status.textContent=count+'件をこの端末に保存しました。';
    } catch {await render().catch(()=>{}); status.textContent=count+'件保存済み。残りは保存できませんでした。JPEG・PNG・WebP・PDF（各20MB以下）と空き容量を確認してください。';}
    finally {input.value='';}
  }));
  render().catch(()=>{status.textContent='このブラウザーでは端末への保存を利用できません。通常のSafariやChromeで開いてください。';});
})();
