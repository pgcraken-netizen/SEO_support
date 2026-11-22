export type Observation={date:string;rank:number|null};
export type Keyword={id:string;term:string;main:boolean;url:string;history:Observation[]};
export type Competitor={id:string;name:string;url:string;scores:(number|null)[]};
export type Ticket={id:string;title:string;description:string;url:string;priority:'高'|'中'|'低';hours:number;status:'todo'|'doing'|'review'|'done';steps:string[];checks:boolean[];evidence:string;createdAt:string};
export type Project={id:string;name:string;domain:string;keyword:string;location:string;device:string;target:number;deadline:string;sample:boolean;keywords:Keyword[];competitors:Competitor[];selfScores:(number|null)[];tickets:Ticket[]};
export type Store={version:1;active:string;projects:Project[]};
export const dimensions=['検索意図','情報の充実','技術品質'];
export const uid=()=>crypto.randomUUID();
export const today=()=>new Date().toLocaleDateString('sv-SE');
export function latest(k?:Keyword){return k?.history.slice().sort((a,b)=>a.date.localeCompare(b.date)).at(-1);}
export function median(values:number[]){if(!values.length)return null;const a=[...values].sort((a,b)=>a-b);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
export function upsertObservation(k:Keyword,o:Observation):Keyword{return {...k,history:[...k.history.filter(h=>h.date!==o.date),o].sort((a,b)=>a.date.localeCompare(b.date))};}
export function isStore(x:unknown):x is Store{
 if(!x||typeof x!=='object')return false;const s=x as Store;
 const str=(v:unknown)=>typeof v==='string';const score=(v:unknown)=>v===null||(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100);
 const rank=(v:unknown)=>v===null||(Number.isInteger(v)&&Number(v)>=1&&Number(v)<=100);
 return s.version===1&&str(s.active)&&Array.isArray(s.projects)&&s.projects.length>0&&new Set(s.projects.map(p=>p.id)).size===s.projects.length&&s.projects.some(p=>p.id===s.active)&&s.projects.every(p=>p&&[p.id,p.name,p.domain,p.keyword,p.location,p.device,p.deadline].every(str)&&typeof p.sample==='boolean'&&rank(p.target)&&p.target!==null&&Array.isArray(p.selfScores)&&p.selfScores.length===3&&p.selfScores.every(score)&&Array.isArray(p.keywords)&&p.keywords.filter(k=>k.main).length===1&&new Set(p.keywords.map(k=>k.id)).size===p.keywords.length&&p.keywords.every(k=>k&&[k.id,k.term,k.url].every(str)&&typeof k.main==='boolean'&&Array.isArray(k.history)&&k.history.every(h=>h&&/^\d{4}-\d{2}-\d{2}$/.test(h.date)&&rank(h.rank)))&&Array.isArray(p.competitors)&&p.competitors.every(c=>c&&[c.id,c.name,c.url].every(str)&&Array.isArray(c.scores)&&c.scores.length===3&&c.scores.every(score))&&Array.isArray(p.tickets)&&p.tickets.every(t=>t&&[t.id,t.title,t.description,t.url,t.evidence,t.createdAt].every(str)&&['高','中','低'].includes(t.priority)&&['todo','doing','review','done'].includes(t.status)&&typeof t.hours==='number'&&t.hours>0&&Array.isArray(t.steps)&&t.steps.every(str)&&Array.isArray(t.checks)&&t.checks.length===t.steps.length&&t.checks.every(c=>typeof c==='boolean')));
}
export function newProject(name:string,domain:string,keyword:string):Project{const deadline=new Date();deadline.setMonth(deadline.getMonth()+6);return {id:uid(),name,domain,keyword,location:'日本',device:'スマートフォン',target:1,deadline:deadline.toLocaleDateString('sv-SE'),sample:false,keywords:[{id:uid(),term:keyword,main:true,url:domain,history:[]}],competitors:[],selfScores:[null,null,null],tickets:[]};}
export function sampleProject():Project{
 const p=newProject('宇都宮 車検サイト','https://example.com','宇都宮 車検 おすすめ');
 const terms=['宇都宮 車検 おすすめ','宇都宮 車検 費用','宇都宮 車検 安い','宇都宮 車検 即日','車検 費用 内訳','宇都宮 車検 予約','車検 必要書類','宇都宮 車検 土日','車検 追加費用','宇都宮 車検 比較','車検 期間','宇都宮 車検 口コミ'];
 const ranks=[18,6,8,12,5,3,7,9,21,8,10,15];
 p.deadline='2027-05-31';p.sample=true;p.location='宇都宮市';p.selfScores=[85,52,90];
 p.keywords=terms.map((term,i)=>({id:uid(),term,main:i===0,url:i===0?'https://example.com/services/shaken/':'https://example.com/services/shaken/',history:[30,25,23,20,ranks[i]].map((r,j)=>({date:['2026-10-26','2026-11-02','2026-11-09','2026-11-16','2026-11-22'][j],rank:i===0?r:Math.min(100,ranks[i]+4-j)}))}));
 p.competitors=[{id:uid(),name:'競合 A',url:'https://competitor-a.example',scores:[78,88,84]},{id:uid(),name:'競合 B',url:'https://competitor-b.example',scores:[82,92,80]},{id:uid(),name:'競合 C',url:'https://competitor-c.example',scores:[75,84,88]}];
 p.tickets=[{id:uid(),title:'料金と追加費用を明確にする',description:'費用内訳と追加費用の発生条件を掲載し、比較検討中の疑問を解消します。',url:'/services/shaken/',priority:'高',hours:2,status:'todo',steps:['料金表に法定費用・基本料金・整備費用を分けて記載する','追加費用が発生する条件と事前見積もりの手順を追記する','スマートフォンで料金表の読みやすさを確認する'],checks:[false,false,false],evidence:'サンプル：上位3ページに費用内訳の掲載あり。自社は追加費用の説明が不足。',createdAt:today()},{id:uid(),title:'予約までの導線を分かりやすくする',description:'サービスページから予約フォームへ進めるボタンを設置します。',url:'/services/shaken/',priority:'高',hours:1,status:'doing',steps:['料金表の下に予約ボタンを追加する','予約フォームまで移動できることを確認する'],checks:[true,false],evidence:'サンプル：サービス本文中に予約リンクがない。',createdAt:today()},{id:uid(),title:'車検に必要な書類の案内を追加する',description:'来店前に準備する書類と、紛失時の対応を追記します。',url:'/services/shaken/',priority:'中',hours:1.5,status:'todo',steps:['必要書類を一覧にする','店舗の担当者に内容の正確性を確認する'],checks:[false,false],evidence:'サンプル：関連キーワード「車検 必要書類」に対応する説明が不足。',createdAt:today()}];return p;
}
export function initialStore():Store{const p=sampleProject();return {version:1,active:p.id,projects:[p]};}
export function csvCell(v:unknown){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
