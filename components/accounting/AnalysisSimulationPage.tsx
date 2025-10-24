import React, { useMemo } from 'react';
import { RefreshCw, FileText, TrendingUp, Clock } from '../Icons';
import { BankScenario, BankSimulation, Document, EmployeeUser, Toast } from '../../types';

interface AnalysisSimulationPageProps {
documents: Document[];
scenarios: BankScenario[];
simulations: BankSimulation[];
onRefresh: () => void;
currentUser: EmployeeUser | null;
addToast: (message: string, type: Toast['type']) => void;
isAIOff: boolean;
}

const statusLabel: Record<BankSimulation['status'], { label: string; className: string }> = {
pending: { label:'未実行', className: 'bg-slate-200 text-slate-700' },
running: { label: '実行中', className: 'bg-blue-100 text-blue-700' },
failed: { label: '失敗', className: 'bg-red-100 text-red-700' },
succeeded: { label: '完了',className: 'bg-green-100 text-green-700' },
};

const AnalysisSimulationPage: React.FC<AnalysisSimulationPageProps> = ({
documents,
scenarios,
simulations,
onRefresh,
currentUser,
addToast,
isAIOff,
}) => {
const handleRefresh = () => {
addToast('AI分析データを再読み込みしました。', 'info');
onRefresh();
};

return (
<div>
<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
<h2 className="text-xl font-semibold text-slate-900 dark:text-white">AI分析シミュレーション</h2>
<p className="text-sm text-slate-600 dark:text-slate-400">
銀行向けの与信シナリオと最新のシミュレーション結果を確認できます。必要に応じてAIが生成した資料をダウンロードしてください。
</p>
{isAIOff && (
<p className="mt-2 text-sm text-red-500">AI機能が無効のため、新しいシミュレーションは実行できません。</p>
)}
</div>
<button
type="button"
onClick={handleRefresh}
className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
>
<RefreshCw className="h-4 w-4" />
データを更新
</button>

<div className="grid gap-6 lg:grid-cols-2">
<section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
<h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
<TrendingUp className="h-5 w-5 text-blue-500" />
シミュレーションシナリオ
</h3>
{scenarios.length === 0 ? (
<p className="text-sm text-slate-500 dark:text-slate-400">登録済みのシナリオがありません。</p>
):(
<ul className="space-y-3">
{scenarios.map((scenario) => (
<li key={scenario.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
<div className="flex items-center justify-between gap-3">
<div>
<p className="font-semibold text-slate-900 dark:text-white">{scenario.name}</p>
<p className="text-xs text-slate-500 dark:text-slate-400">作成日:{new Date(scenario.created_at).toLocaleDateString()}</p>
</div>
<span className="text-xs text-slate-500 dark:text-slate-400">種類:{scenario.sim_type}</span>
</div>
{scenario.assumptions && (
<pre className="mt-3 rounded-md bg-slate-50 dark:bg-slate-700/50 p-3 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
{JSON.stringify(scenario.assumptions, null, 2)}
</pre>
)}
</li>
))}
</ul>
)}
</section>

<section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
<h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
<Clock className="h-5 w-5 text-indigo-500" />
最新シミュレーション
</h3>
{simulations.length === 0 ? (
<p className="text-sm text-slate-500 dark:text-slate-400">実行済みのシミュレーションがありません。</p>
):(
<ul className="space-y-3">
{simulations.map((simulation) => {
const meta = statusLabel[simulation.status];
return (
<li key={simulation.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2">
<div className="flex items-center justify-between gap-3">
<div>
<p className="font-semibold text-slate-900 dark:text-white">{simulation.scenario_id}</p>
<p className="text-xs text-slate-500 dark:text-slate-400">
実行日時:{new Date(simulation.created_at).toLocaleString()}
<span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
{meta.label}
</span>
</p>
</div>
</div>
{simulation.outputs && (
<pre className="rounded-md bg-slate-50 dark:bg-slate-700/50 p-3 text-xs text-slate-600 dark:text-slate-200 whitespace-pre-wrap break-words">
{JSON.stringify(simulation.outputs, null, 2)}
</pre>
)}
</li>
);
})}
</ul>
)}
</section>
</div>

<section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
<h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
<FileText className="h-5 w-5 text-slate-500" />
解析ドキュメント
</h3>
{documents.length === 0 ? (
<p className="text-sm text-slate-500 dark:text-slate-400">AIが生成したドキュメントはまだありません。</p>
):(
<ul className="divide-y divide-slate-200 dark:divide-slate-700">
{documents.map((doc) => (
<li key={doc.id} className="py-3 flex items-center justify-between gap-4">
<div>
<p className="font-semibold text-slate-900 dark:text-white">{doc.file_name}</p>
<p className="text-xs text-slate-500 dark:text-slate-400">作成日: {new Date(doc.created_at).toLocaleString()}</p>
</div>
<span className="text-xs text-slate-500 dark:text-slate-300 whitespace-pre-wrap break-words text-right">
{doc.file_path}
</span>
</li>
))}
</ul>
)}
</section>

{!currentUser && (
<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
現在ログイン中のユーザー情報を取得できませんでした。AI分析の履歴が正しく保存されない可能性があります。
</div>
)}
</div>
);
};

export default AnalysisSimulationPage;