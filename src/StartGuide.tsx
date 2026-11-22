import { useRef, useState, type FormEvent } from 'react';
import { Check, ListChecks } from 'lucide-react';
import { newProject, today, uid, upsertObservation, type Project } from './model';
import { completedSteps, steps } from './guide';
import './guide.css';

interface Props {
  project: Project;
  create: (project: Project) => void;
  edit: (fn: (project: Project) => Project) => void;
  openTickets: () => void;
}

const contentChecks = ['費用の内訳', 'サービスの提供条件', '利用する手順', '実例・実績', 'よくある質問への回答'];

export function StartGuide({ project, create, edit, openTickets }: Props) {
  const done = completedSteps(project);
  const current = done.indexOf(false);
  const total = steps.length;
  const count = done.filter(Boolean).length;
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const section = useRef<HTMLElement>(null);
  const primary = project.keywords.find(k => k.main)!;
  const focusHeading = () => requestAnimationFrame(() => section.current?.querySelector<HTMLElement>('h2')?.focus());
  const openForm = () => {
    setEditing(true);
    setError('');
    requestAnimationFrame(() => section.current?.querySelector<HTMLElement>('form input,form select')?.focus());
  };

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    if ([...form.values()].some(v => typeof v === 'string' && !v.trim())) {
      setError('空欄の項目を入力してください。');
      return;
    }
    if (current === 0) {
      const site = newProject(value('name'), value('url'), value('term'));
      site.target = Number(value('target'));
      site.location = value('location');
      site.device = value('device');
      create(site);
    } else if (current === 1) {
      const observation = { date: value('date'), rank: value('rank') === 'out' ? null : Number(value('rank')) };
      edit(p => ({ ...p, keywords: p.keywords.map(k => k.main ? upsertObservation(k, observation) : k) }));
    } else if (current === 2) {
      if (project.keywords.some(k => k.term === value('term'))) {
        setError('すでに登録済みです。別の言い方を1つ入力してください。');
        return;
      }
      const keyword = { id: uid(), main: false, term: value('term'), url: primary.url, history: [] };
      edit(p => ({ ...p, keywords: [...p.keywords, keyword] }));
    } else if (current === 3) {
      const url = new URL(value('url'));
      if (URL.canParse(project.domain) && url.hostname === new URL(project.domain).hostname) {
        setError('比較相手には、他のサイトのページURLを入力してください。');
        return;
      }
      let own = 0, peer = 0;
      contentChecks.forEach((_, index) => {
        const answer = value('check' + index);
        if (answer === 'both' || answer === 'own') own += 20;
        if (answer === 'both' || answer === 'peer') peer += 20;
      });
      edit(p => {
        const existing = p.competitors.find(c => c.url === url.href);
        const competitor = existing ?? { id: uid(), name: url.hostname, url: url.href, scores: [null, null, null] };
        const updated = { ...competitor, scores: [competitor.scores[0], peer, competitor.scores[2]] };
        return { ...p, selfScores: [p.selfScores[0], own, p.selfScores[2]],
          competitors: existing ? p.competitors.map(c => c.id === existing.id ? updated : c) : [...p.competitors, updated] };
      });
    } else if (current === 4) {
      const ticket = { id: uid(), title: value('task'), description: value('task'), evidence: value('why'), url: value('url'),
        priority: '中' as const, hours: Number(value('hours')), status: 'todo' as const,
        steps: [value('task'), '公開したページで変更を確認する'], checks: [false, false], createdAt: today() };
      edit(p => ({ ...p, tickets: [...p.tickets, ticket] }));
    }
    setEditing(false);
    setError('');
    focusHeading();
  }

  const formFields = () => {
    switch (current) {
      case 0: return <>
        <label>サイト名<input name="name" required maxLength={80} placeholder="例：宇都宮の車検センター" /></label>
        <label>自分のサイトのURL<input type="url" name="url" required pattern="https?://.*" placeholder="https://example.com" /></label>
        <label>見つけてほしい検索語<input name="term" required maxLength={120} placeholder="例：宇都宮 車検 おすすめ" /></label>
        <div className="guide-pair"><label>目指す順位<input name="target" required type="number" min="1" max="100" defaultValue="1" /></label>
          <label>検索する地域<input name="location" required defaultValue="日本" /></label></div>
        <label>検索に使う端末<select name="device"><option>スマートフォン</option><option>PC</option></select></label>
      </>;
      case 1: return <>
        <p className="guide-context">「{primary.term}」を {project.location}・{project.device} で検索してください。</p>
        <label>調べた日<input type="date" name="date" required defaultValue={today()} max={today()} /></label>
        <label>自社ページの順位<select name="rank" required defaultValue=""><option value="" disabled>順位を選ぶ</option>
          {Array.from({ length: 100 }, (_, i) => <option key={i} value={i+1}>{i+1}位</option>)}
          <option value="out">100位まで確認して見つからなかった</option></select></label>
      </>;
      case 2: return <><p className="guide-context">登録済みの検索語：{primary.term}</p><label>追加したい検索語<input name="term" required maxLength={120} placeholder="例：宇都宮 車検 費用" /></label></>;
      case 3: return <>
        <label>比較する他社ページのURL<input name="url" type="url" required pattern="https?://.*" placeholder="https://…" /></label>
        <p>次の情報は、どちらのページに載っていますか？ 各ページで1項目20点として「情報の充実」を集計します。</p>
        {contentChecks.map((check, i) => <label key={check}>{check}<select name={'check'+i} required defaultValue="">
          <option disabled value="">掲載されているページを選ぶ</option><option value="both">両方</option>
          <option value="own">自分のページのみ</option><option value="peer">他社のページのみ</option><option value="neither">どちらにもない</option>
        </select></label>)}
      </>;
      case 4: return <>
        <label>直すページのURL<input name="url" required defaultValue={primary.url || project.domain} /></label>
        <label>何を直しますか？<input name="task" required maxLength={120} placeholder="例：料金表に追加費用の条件を書く" /></label>
        <label>直す理由<textarea name="why" required placeholder="例：上位ページには追加費用の説明があり、自社にはなかった" /></label>
        <label>作業時間の見込み（時間）<input type="number" name="hours" min=".5" max="1000" step=".5" required defaultValue="1" /></label>
      </>;
    }
  };
  return <section ref={section} className="start-guide" aria-label="初回の操作ガイド">
    <header><div><h2 tabIndex={-1}>はじめてのSEO対策</h2><p aria-live="polite">{current < 0 ? '初回の準備ができました。改善チケットを開いて作業を始めましょう。' :
      (project.sample ? '下のグラフは見本です。まずは自分のサイトを登録しましょう。' : project.name + ' の続きから進められます。')}</p></div>
      <span className="guide-count" aria-label={total+'ステップ中'+count+'完了'}>{count} / {total} 完了</span></header>
    <progress value={count} max={total} aria-label="初回設定の進捗" />
    {current >= 0 || expanded ? <ol>{steps.map((step, i) =>
      <li key={step.title} className={i === current ? 'current' : done[i] ? 'finished' : ''} aria-current={i === current ? 'step' : undefined}>
        <span className="step-index" aria-label={'手順'+(i+1)}>{i+1}</span><div className="step-body"><h3>{step.title}{done[i] && <small><Check size={13}/>完了</small>}</h3>
          {i === current && <><p>{step.hint}</p>{editing ? <form key={current} onSubmit={save}>
            {formFields()}{error && <p role="alert">{error}</p>}
            <div className="guide-actions"><button className="button primary" type="submit">{i === 4 ? '改善チケットを保存' : '保存して次へ'}</button>
              <button className="button secondary" type="button" onClick={()=>{setEditing(false);setError('');focusHeading()}}>いったん閉じる</button></div>
          </form> : <button type="button" className="button primary" onClick={openForm}>{i+1}. {step.action}</button>}</>}
        </div>
      </li>)}</ol> : null}
    {current < 0 && <div className="guide-actions"><button className="button primary" onClick={openTickets}><ListChecks size={17}/>改善チケットを開く</button>
      <button className="button secondary" onClick={()=>setExpanded(!expanded)}>{expanded ? '手順を閉じる' : '完了した手順を見る'}</button></div>}
  </section>;
}
