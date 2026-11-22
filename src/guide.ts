import type { Project } from './model';

export const steps = [
  { title: '自分のサイトと目標を決める', action: 'サイトと目標を登録', hint: 'どのサイトを、どんな言葉で検索したときに見つけてほしいですか？' },
  { title: '今の検索順位を記録する', action: '調べた順位を入力', hint: '登録した言葉でGoogle検索し、広告や地図を除いて自社ページが何番目か数えます。' },
  { title: '一緒に追う検索語を追加する', action: '関連する検索語を入力', hint: 'お客さまが別の言い方で探すときの言葉を1つ選びます。例：「宇都宮 車検 費用」。' },
  { title: '上位のページと見比べる', action: '2つのページを比較', hint: '同じ言葉で上位に出た他社ページを1つ開き、自社ページと見比べます。' },
  { title: '最初の改善を1件決める', action: '改善する内容を入力', hint: '比較して気づいたことから、ページのどこをどう直すか1つだけ決めます。' },
] as const;

export function completedSteps(project: Project): boolean[] {
  if (project.sample) return steps.map(() => false);
  const comparable = project.competitors.some(peer =>
    peer.scores.some((score, i) => score !== null && project.selfScores[i] !== null));
  return [
    true,
    project.keywords.some(k => k.main && k.history.length > 0),
    project.keywords.some(k => !k.main),
    comparable,
    project.tickets.length > 0,
  ];
}
