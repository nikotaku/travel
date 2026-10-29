'use strict';
(() => {
const phrases=[["hotel","荷物を預けたい","可唔可以寄存行李？","ho2 m4 ho2 ji5 gei3 cyun4 hang4 lei5","Can I leave my luggage here?","預ける前に料金も確認"],["hotel","荷物預かりは有料？","寄存行李要唔要收費？","gei3 cyun4 hang4 lei5 jiu3 m4 jiu3 sau1 fai3","Is there a charge for luggage storage?",""],["hotel","何時までに荷物を受け取る？","最遲幾點要攞返行李？","zeoi3 ci4 gei2 dim2 jiu3 lo2 faan1 hang4 lei5","What is the latest time I can collect my luggage?",""],["hotel","予約しています","我有訂房。","ngo5 jau5 deng6 fong2","I have a reservation.","予約控えを一緒に見せる"],["hotel","チェックインしたい","我想辦理入住。","ngo5 soeng2 baan6 lei5 jap6 zyu6","I'd like to check in, please.",""],["hotel","Wi-Fiのパスワードは？","Wi-Fi 密碼係乜嘢？","Wi-Fi mat6 maa5 hai6 mat1 je5","What is the Wi-Fi password?",""],["food","1人です","一位，唔該。","jat1 wai2, m4 goi1","A table for one, please.",""],["food","これを1つください","呢個要一份，唔該。","ni1 go3 jiu3 jat1 fan6, m4 goi1","One of these, please.","メニューを指さす"],["food","おすすめは？","有咩推介？","jau5 me1 teoi1 gaai3","What do you recommend?",""],["food","辛くしないで","唔要辣，唔該。","m4 jiu3 laat6, m4 goi1","Not spicy, please.",""],["food","水をください","唔該，畀杯水我。","m4 goi1, bei2 bui1 seoi2 ngo5","Could I have a glass of water, please?",""],["food","持ち帰りで","外賣，唔該。","ngoi6 maai6, m4 goi1","Takeaway, please.",""],["food","お会計をお願いします","埋單，唔該。","maai4 daan1, m4 goi1","The bill, please.",""],["pay","いくらですか？","幾多錢？","gei2 do1 cin2","How much is it?",""],["pay","カードで払える？","可唔可以碌卡？","ho2 m4 ho2 ji5 luk1 kaat1","Can I pay by card?",""],["pay","Apple Payは使える？","可唔可以用 Apple Pay？","ho2 m4 ho2 ji5 jung6 Apple Pay","Do you accept Apple Pay?","対応していてもカード側の制限で払えない場合あり"],["pay","現金だけですか？","係咪只收現金？","hai6 mai6 zi2 sau1 jin6 gam1","Is it cash only?","注文前に確認"],["pay","レシートをください","唔該，畀張收據我。","m4 goi1, bei2 zoeng1 sau1 geoi3 ngo5","Could I have a receipt, please?",""],["travel","駅はどこ？","港鐵站喺邊度？","gong2 tit3 zaam6 hai2 bin1 dou6","Where is the MTR station?",""],["travel","ここへ行きたい","我想去呢度。","ngo5 soeng2 heoi3 ni1 dou6","I'd like to go here.","住所や地図を一緒に見せる"],["travel","旺角へ行きますか？","呢架車去唔去旺角？","ni1 gaa3 ce1 heoi3 m4 heoi3 wong6 gok3","Does this go to Mong Kok?","バスなどに乗る前"],["travel","どこで降りればいい？","我應該喺邊度落車？","ngo5 jing1 goi1 hai2 bin1 dou6 lok6 ce1","Where should I get off?","行き先の地図を見せる"],["cruise","これが乗船バウチャーです","呢張係我嘅船票。","ni1 zoeng1 hai6 ngo5 ge3 syun4 piu3","Here is my cruise voucher.","eチケットを一緒に見せる"],["cruise","21:20発の船はここ？","請問九點二十分開嘅船係咪喺度上船？","cing2 man6 gau2 dim2 ji6 sap6 fan1 hoi1 ge3 syun4 hai6 mai6 hai2 dou6 soeng5 syun4","Is this where I board the nine twenty p.m. cruise?","10/29のドリーマークルーズ"],["cruise","9号埠頭の5番バースは？","請問九號碼頭五號泊位喺邊度？","cing2 man6 gau2 hou6 maa5 tau4 ng5 hou6 bok6 wai2 hai2 bin1 dou6","Where is berth five at Central Pier Nine?","9号埠頭内の5番乗船位置"],["help","すみません・ありがとう","唔該。","m4 goi1（ンゴーイ）","Excuse me. Thank you.","呼びかけやサービスへのお礼"],["help","ゆっくり話してください","唔該，講慢啲。","m4 goi1, gong2 maan6 di1","Could you speak more slowly, please?",""],["help","英語は話せますか？","你識唔識講英文？","nei5 sik1 m4 sik1 gong2 jing1 man4","Do you speak English?",""],["help","トイレはどこ？","廁所喺邊度？","ci3 so2 hai2 bin1 dou6","Where is the toilet?",""],["help","助けてください","唔該，幫吓我。","m4 goi1, bong1 haa5 ngo5","Please help me.","緊急時は近くのスタッフにも画面を見せる"]];
const list=document.querySelector('#phrase-list'),status=document.querySelector('#phrase-audio-status'),search=document.querySelector('#phrase-search'),dialog=document.querySelector('#phrase-viewer');
const supported='speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const synth=supported?window.speechSynthesis:null;
let voices=[],category='all',activeUtterance=null,shown=null,watchdog=null;
const cantonese=()=>voices.find(v=>/^(zh[-_]HK|yue)([-_]|$)/i.test(v.lang));
const english=()=>voices.find(v=>/^en[-_]HK$/i.test(v.lang))||voices.find(v=>/^en[-_](GB|US)$/i.test(v.lang))||voices.find(v=>/^en([_-]|$)/i.test(v.lang));
function reset(){clearTimeout(watchdog);if(synth)synth.cancel();activeUtterance=null;}
function refreshVoices(){
 voices=synth?synth.getVoices():[];
 document.querySelectorAll('[data-cantonese]').forEach(b=>b.disabled=!cantonese());
 document.querySelector('#phrase-show-speak').disabled=!cantonese();
 status.textContent=!supported?'このブラウザーは音声再生に対応していません。カードを大きく表示して相手に見せてください。':cantonese()?'広東語・英語をタップして再生できます。':'広東語音声をこの端末で検出できません。英語再生、または大きく表示を使ってください。';
}
function speak(row,lang){
 reset();if(!supported){refreshVoices();return;}
 voices=synth.getVoices();const voice=lang==='zh'?cantonese():english();
 if(lang==='zh'&&!voice){refreshVoices();return;}
 const utterance=new SpeechSynthesisUtterance(lang==='zh'?row[2]:row[4]);
 utterance.lang=lang==='zh'?'zh-HK':(voice?.lang||'en-GB');
 if(voice)utterance.voice=voice;
 utterance.rate=document.querySelector('#phrase-slow').checked?0.7:0.92;
 activeUtterance=utterance;
 const text='「'+row[1]+'」';
 status.textContent=text+'を再生しています…';
 utterance.onend=()=>{if(activeUtterance===utterance){clearTimeout(watchdog);activeUtterance=null;status.textContent=text+'の再生が終わりました。';}};
 utterance.onerror=()=>{if(activeUtterance===utterance){clearTimeout(watchdog);activeUtterance=null;status.textContent='音声を再生できませんでした。音量・音声設定を確認するか、大きく表示して伝えてください。';}};
 utterance.onstart=()=>clearTimeout(watchdog);
 synth.speak(utterance);
 watchdog=setTimeout(()=>{if(activeUtterance===utterance){reset();status.textContent='音声が開始されませんでした。端末の読み上げ音声・音量を確認し、もう一度押してください。';}},8000);
}
function button(text,handler){const b=document.createElement('button');b.type='button';b.className='button';b.textContent=text;b.addEventListener('click',handler);return b;}
function show(row){shown=row;document.querySelector('#phrase-show-jp').textContent=row[1];document.querySelector('#phrase-show-zh').textContent=row[2];document.querySelector('#phrase-show-en').textContent=row[4];dialog.showModal();}
function render(){
 const needle=search.value.trim().toLowerCase();
 const visible=phrases.filter(r=>(category==='all'||r[0]===category)&&r.join(' ').toLowerCase().includes(needle));
 list.replaceChildren();
 for(const row of visible){
  const card=document.createElement('article');card.className='phrase-card';
  const title=document.createElement('h2');title.textContent=row[1];
  const zh=document.createElement('p');zh.className='phrase-zh';zh.lang='zh-HK';zh.textContent=row[2];
  const reading=document.createElement('p');reading.className='phrase-reading';reading.textContent=row[3];
  const en=document.createElement('p');en.className='phrase-en';en.lang='en';en.textContent=row[4];
  const actions=document.createElement('div');actions.className='button-row';
  const cant=button('▶ 広東語',()=>speak(row,'zh'));cant.classList.add('primary');cant.dataset.cantonese='';cant.disabled=!cantonese();cant.setAttribute('aria-label',row[1]+'を広東語で再生');
  const eng=button('▶ 英語',()=>speak(row,'en'));eng.disabled=!supported;eng.setAttribute('aria-label',row[1]+'を英語で再生');
  const large=button('大きく見せる',()=>show(row));large.setAttribute('aria-label',row[1]+'を大きく見せる');
  actions.append(cant,eng,large);card.append(title,zh,reading,en,actions);
  if(row[5]){const note=document.createElement('small');note.textContent=row[5];card.append(note);}
  list.append(card);
 }
 document.querySelector('#phrase-count').textContent=visible.length?visible.length+' / '+phrases.length+' フレーズ':'見つかりませんでした。別の言葉で検索してください。';
}
document.querySelectorAll('[data-phrase-category]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.phraseCategory;document.querySelectorAll('[data-phrase-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();}));
search.addEventListener('input',render);
document.querySelector('#phrase-stop').addEventListener('click',()=>{reset();status.textContent='音声を止めました。';});
document.querySelector('#phrase-show-speak').addEventListener('click',()=>shown&&speak(shown,'zh'));
document.querySelector('#phrase-show-english').disabled=!supported;
document.querySelector('#phrase-show-english').addEventListener('click',()=>shown&&speak(shown,'en'));
document.querySelector('#phrase-viewer-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',reset);
document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
window.addEventListener('pagehide',reset);
if(synth)synth.addEventListener('voiceschanged',refreshVoices);
refreshVoices();render();
})();
