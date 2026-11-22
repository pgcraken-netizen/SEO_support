import { dimensions, latest } from './model';
import type { Project } from './model';
import { rankSignal, scoreSignal } from './signals';
import type { Signal, Tone } from './signals';
import './indicators.css';

export function Status({ signal }: { signal: Signal }) {
  return <span className={'indicator-label signal-' + signal.tone}>{signal.label}</span>;
}

export function Comparison({ project }: { project: Project }) {
  return <div className="benchmark">
    {dimensions.map((name, i) => {
      const score = project.selfScores[i];
      const result = scoreSignal(score, project.competitors.map(peer => peer.scores[i]));
      return <div className="benchmark-row" key={name}>
        <div className="benchmark-heading"><strong>{name}</strong><Status signal={result} /></div>
        <div className="gauge" aria-hidden="true">
          {score !== null && <div className={'gauge-value signal-' + result.tone} style={{ width: score + '%' }} />}
          {result.benchmark !== null && <i className="benchmark-marker" style={{ left: result.benchmark + '%' }} />}
        </div>
        <div className="gauge-caption">
          <span>自社 <b>{score === null ? '未評価' : score + '点'}</b></span>
          <span>競合中央値 {result.benchmark === null ? '未評価' : result.benchmark + '点（' + result.count + '件）'}</span>
          {result.difference !== null && <b>差 {result.difference > 0 ? '+' : ''}{result.difference}点</b>}
        </div>
      </div>;
    })}
    <details className="thresholds"><summary>比較グラフの読み方</summary>
      <p>横棒は自社の点数（0〜100点）、縦線は評価済みの競合ページの中央値です。緑は中央値以上、黄は不足が10点以内、赤は10点を超える不足。比較できる値がない場合は灰色です。</p>
    </details>
  </div>;
}

export function RelatedDistribution({ project }: { project: Project }) {
  const items = project.keywords.filter(k => !k.main);
  const counts: Record<Tone, number> = { good: 0, near: 0, poor: 0, unknown: 0 };
  for (const keyword of items) counts[rankSignal(latest(keyword), 10).tone]++;
  const bands = [['good', '10位以内'], ['near', '11〜13位'], ['poor', '14位以下・圏外'], ['unknown', '未計測']] as const;
  return <section className="distribution"><h2>関連キーワードの順位分布</h2>
    {items.length > 0 ? <><div className="distribution-track" aria-hidden="true">{bands.map(([tone]) =>
      <i key={tone} className={'signal-' + tone} style={{ flexGrow: counts[tone] }} />)}</div>
      <div className="distribution-legend">{bands.map(([tone, label]) =>
        <span key={tone}><i className={'signal-' + tone} />{label} <b>{counts[tone]}件</b></span>)}</div></>
      : <p>関連キーワードを追加すると分布を表示します。</p>}
  </section>;
}
