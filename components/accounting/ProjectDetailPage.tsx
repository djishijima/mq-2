import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Document, BankScenario, BankSimulation, EmployeeUser, Toast, SimType } from '../../types';
import * as dataService from '../../services/dataService';
import * as geminiService from '../../services/geminiService';
import { Loader, Upload, AlertTriangle, FileText, ArrowRight, Sparkles, CheckCircle, Clock, PlusCircle } from '../Icons';
import { generateMultipagePdf } from '../../utils';
import BusinessPlanPdfContent from '../reports/BusinessPlanPdfContent';

interface ProjectDetailPageProps {
    projectId: string;
    projectName: string;
    onBack: () => void;
    currentUser: EmployeeUser | null;
    addToast: (message: string, type: Toast['type']) => void;
    isAIOff: boolean;
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ projectId, projectName, onBack, currentUser, addToast, isAIOff }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [scenarios, setScenarios] = useState<BankScenario[]>([]);
    const [simulations, setSimulations] = useState<BankSimulation[]>([]);
    const [newScenario, setNewScenario] = useState<{name: string, sim_type: SimType, assumptions: string}>({name: '', sim_type: '返済計画', assumptions: '{\n  "principal": 100000000,\n  "rate": 0.02,\n  "months": 84\n}'});
    const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
    
    // Loading states
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreatingScenario, setIsCreatingScenario] = useState(false);
    const [runningSimulationId, setRunningSimulationId] = useState<string | null>(null);
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

    const [dragOver, setDragOver] = useState(false);

    const loadData = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const [docs, scens] = await Promise.all([
                dataService.getDocuments(projectId),
                dataService.getBankScenarios(projectId),
            ]);
            setDocuments(docs);
            setScenarios(scens);

            if (scens.length > 0) {
                const sims = await Promise.all(scens.map(s => dataService.getBankSimulations(s.id)));
                setSimulations(sims.flat());
                if (!selectedScenarioId) {
                    setSelectedScenarioId(scens[0].id);
                }
            } else {
                setSimulations([]);
            }
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'データの読み込みに失敗しました。', 'error');
        } finally {
            setIsDataLoading(false);
        }
    }, [projectId, addToast, selectedScenarioId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFiles = (files: File[]) => {
        if (files.length === 0) return;
        setIsUploading(true);
        const uploadPromises = files.map(async (file) => {
            try {
                const path = await dataService.uploadFile(file, 'ai', file.name);
                return await dataService.addDocument({
                    project_id: projectId,
                    file_name: file.name,
                    file_path: path.path,
                    mime_type: file.type,
                    status: 'uploaded',
                });
            } catch (e) {
                addToast(`'${file.name}' のアップロードに失敗: ${e instanceof Error ? e.message : '不明なエラー'}`, 'error');
                return null;
            }
        });

        Promise.all(uploadPromises).then(async (newDocs) => {
            const successfulDocs = newDocs.filter((doc): doc is Document => doc !== null);
            setDocuments(prev => [...successfulDocs.reverse(), ...prev]);
            setIsUploading(false);
            if(successfulDocs.length > 0) {
              addToast(`${successfulDocs.length}件のファイルをアップロードしました。AIによる解析を自動で開始します。`, 'success');
              for (const doc of successfulDocs) {
                await handleAnalyzeDocument(doc.id);
              }
            }
        });
    };

    const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); };
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { handleFiles(Array.from(e.target.files || [])); e.target.value = ''; };
    
    const handleAnalyzeDocument = async (docId: string) => {
        const doc = documents.find(d => d.id === docId) || (await dataService.getDocuments(projectId)).find(d => d.id === docId);
        if (!doc || isAIOff) return;
        if (!currentUser) { // FIX: Added currentUser check
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }

        try {
            await dataService.updateDocumentStatus(docId, 'processing');
            setDocuments(prev => prev.map(d => d.id === docId ? {...d, status: 'processing'} : d));
            
            // FIX: Pass currentUser.id as the second argument
            const extractedData = await geminiService.analyzeDocumentContent(`ファイル名: ${doc.file_name} の内容を解析してください。`, currentUser.id);
            
            await dataService.addAIArtifact({
                project_id: projectId,
                kind: 'その他',
                title: `解析結果: ${doc.file_name}`,
                content_json: extractedData,
                file_path: doc.file_path,
                created_by: currentUser.id, // FIX: Added created_by
            });
            
            await dataService.updateDocumentStatus(docId, 'processed');
            addToast(`「${doc.file_name}」の解析が完了しました。`, 'success');
            // Refresh documents to get the new status
            const updatedDocs = await dataService.getDocuments(projectId);
            setDocuments(updatedDocs);
        } catch (e) {
            await dataService.updateDocumentStatus(docId, 'failed');
            setDocuments(prev => prev.map(d => d.id === docId ? {...d, status: 'failed'} : d));
            addToast(`「${doc.file_name}」の解析に失敗: ${e instanceof Error ? e.message : '不明なエラー'}`, 'error');
        }
    };
    
    const handleCreateScenario = async () => {
        if (!newScenario.name.trim() || !newScenario.assumptions.trim() || isAIOff) return;
        if (!currentUser) { // FIX: Added currentUser check
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsCreatingScenario(true);
        try {
            const assumptionsJson = JSON.parse(newScenario.assumptions);
            const createdScenario = await dataService.addBankScenario({
                project_id: projectId,
                name: newScenario.name,
                sim_type: newScenario.sim_type,
                assumptions: assumptionsJson,
                created_by: currentUser.id, // FIX: Added created_by
            });
            setScenarios(prev => [createdScenario, ...prev]);
            setNewScenario({name: '', sim_type: '返済計画', assumptions: '{\n  "principal": 100000000,\n  "rate": 0.02,\n  "months": 84\n}'});
            addToast('新規シナリオを作成しました。', 'success');
        } catch (e) {
            addToast(e instanceof Error ? `シナリオ作成エラー: ${e.message}` : 'JSON形式が正しくありません。', 'error');
        } finally {
            setIsCreatingScenario(false);
        }
    };

    const handleRunSimulation = async (scenario: BankScenario) => {
        if (isAIOff) return;
        if (!currentUser) { // FIX: Added currentUser check
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        setRunningSimulationId(scenario.id);
        try {
            const processedDocs = documents.filter(d => d.status === 'processed');
            if (processedDocs.length === 0) {
                throw new Error("分析可能な資料がありません。");
            }
            // FIX: Pass currentUser.id as the third argument
            const aiResult = await geminiService.runBankSimulation(processedDocs, scenario, currentUser.id);
            const newSim = await dataService.addBankSimulation({
                scenario_id: scenario.id,
                inputs: { documents: processedDocs.map(d => d.id), assumptions: scenario.assumptions },
                outputs: { summary: aiResult.analysis_summary, result: aiResult.simulation_result },
                source_artifacts: aiResult.source_artifacts,
                status: 'succeeded'
            });
            setSimulations(prev => [newSim, ...prev]);
            setSelectedScenarioId(scenario.id);
            addToast(`シナリオ「${scenario.name}」のシミュレーションが完了しました。`, 'success');
        } catch(e) {
            addToast(e instanceof Error ? `シミュレーションエラー: ${e.message}` : '不明なエラーが発生しました。', 'error');
        } finally {
            setRunningSimulationId(null);
        }
    };

    const handleGeneratePdf = async (simulation: BankSimulation) => {
        const scenario = scenarios.find(s => s.id === simulation.scenario_id);
        if (!simulation.outputs || !scenario) return;
        if (!currentUser) { // FIX: Added currentUser check
            addToast('ユーザー情報が見つかりません。', 'error');
            return;
        }
        setGeneratingPdfId(simulation.id);
        try {
            // FIX: Pass currentUser.id as the fourth argument
            const planText = await geminiService.generateBankLoanProposalText(
                JSON.stringify(documents.map(d => d.file_name)),
                scenario.name,
                JSON.stringify(simulation.outputs, null, 2),
                currentUser.id
            );
            
            const hiddenDiv = document.createElement('div');
            hiddenDiv.id = 'pdf-gen-container';
            hiddenDiv.style.position = 'absolute';
            hiddenDiv.style.left = '-9999px';
            document.body.appendChild(hiddenDiv);
            
            const pdfRoot = ReactDOM.createRoot(hiddenDiv);
            pdfRoot.render(<BusinessPlanPdfContent planText={planText} projectName={projectName} />);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await generateMultipagePdf('business-plan-pdf-content', `事業計画書_${projectName}_${scenario.name}.pdf`);
            
            document.body.removeChild(hiddenDiv);

        } catch(e) {
            addToast(e instanceof Error ? `PDF生成エラー: ${e.message}` : 'PDFの生成に失敗しました。', 'error');
        } finally {
            setGeneratingPdfId(null);
        }
    };
    
    const DocumentStatusIcon = ({ status }: { status: Document['status'] }) => {
        switch(status) {
            case 'processing': return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
            case 'processed': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    const allDocsProcessed = useMemo(() => documents.length > 0 && documents.every(d => d.status === 'processed' || d.status === 'failed'), [documents]);
    const processingProgress = useMemo(() => {
        const processedCount = documents.filter(d => d.status === 'processed' || d.status === 'failed').length;
        return documents.length > 0 ? (processedCount / documents.length) * 100 : 0;
    }, [documents]);

    const latestSimulationForSelectedScenario = useMemo(() => {
        if (!selectedScenarioId) return null;
        return simulations
            .filter(s => s.scenario_id === selectedScenarioId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
    }, [simulations, selectedScenarioId]);

    const Section: React.FC<{title: string, step: number, children: React.ReactNode, locked?: boolean, lockMessage?: string}> = ({title, step, children, locked, lockMessage}) => (
         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 relative">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{`STEP ${step}: ${title}`}</h3>
            <div className={`${locked ? 'opacity-40 pointer-events-none' : ''}`}>
                {children}
            </div>
            {locked && (
                <div className="absolute inset-0 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <p className="font-semibold text-slate-600 dark:text-slate-300 p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg">{lockMessage}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="text-blue-600 hover:underline mb-4">&larr; プロジェクト一覧に戻る</button>
            <h2 className="text-2xl font-bold">{projectName}</h2>
            
            <Section title="資料の準備" step={1}>
                <div 
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
                    onDrop={handleFileDrop}
                    className={`relative p-8 border-2 border-dashed rounded-lg text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50' : 'border-slate-300 dark:border-slate-600'}`}
                >
                    <input type="file" id="file-upload-dnd" multiple onChange={handleFileInput} className="hidden" />
                    <label htmlFor="file-upload-dnd" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-slate-400" />
                        <p className="mt-2 font-semibold">ドラッグ＆ドロップで一括アップロード</p>
                        <p className="text-sm text-slate-500">またはクリックしてファイルを選択 (複数可)</p>
                    </label>
                </div>
                {documents.length > 0 && (
                    <div className="mt-4">
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                           {documents.map(doc => (
                               <li key={doc.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-between">
                                   <div className="flex items-center gap-3">
                                       <FileText className="w-5 h-5 text-slate-500"/>
                                       <span className="font-medium text-sm">{doc.file_name}</span>
                                   </div>
                                   <div className="text-xs capitalize flex items-center gap-1.5"><DocumentStatusIcon status={doc.status} /> {doc.status === 'uploaded' ? '解析待ち' : doc.status === 'processing' ? 'AI解析中' : doc.status === 'processed' ? '完了' : 'エラー'}</div>
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </Section>
            
            <Section title="AIによる自動分析" step={2}>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${processingProgress}%` }}></div>
                </div>
                 <p className="text-sm text-slate-500 mt-2 text-center">
                    {documents.length === 0 ? "資料をアップロードしてください" : allDocsProcessed ? "全ての資料の分析が完了しました。" : "AIが資料を分析中です..."}
                 </p>
            </Section>
            
            <Section title="シナリオとシミュレーション" step={3} locked={!allDocsProcessed} lockMessage="STEP 2 のAI分析完了後に有効になります">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">シナリオ作成</h4>
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <input type="text" placeholder="シナリオ名" value={newScenario.name} onChange={e => setNewScenario(p => ({...p, name: e.target.value}))} className="w-full p-2 rounded"/>
                            <select value={newScenario.sim_type} onChange={e => setNewScenario(p => ({...p, sim_type: e.target.value as SimType}))} className="w-full p-2 rounded">
                                {(['借入枠', '返済計画', '金利感応', '資金繰り'] as SimType[]).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <textarea placeholder="前提条件 (JSON)" value={newScenario.assumptions} onChange={e => setNewScenario(p => ({...p, assumptions: e.target.value}))} rows={5} className="w-full p-2 rounded font-mono text-xs"/>
                            <button onClick={handleCreateScenario} disabled={isCreatingScenario || isAIOff} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50">
                                {isCreatingScenario ? <Loader className="w-5 h-5 animate-spin"/> : <PlusCircle className="w-5 h-5"/>} シナリオ作成
                            </button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">シナリオ一覧</h4>
                        <ul className="space-y-2">
                            {scenarios.map(s => (
                                <li key={s.id} className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${selectedScenarioId === s.id ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-50 dark:bg-slate-700/50'}`} onClick={() => setSelectedScenarioId(s.id)}>
                                    <span className="font-medium">{s.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleRunSimulation(s);}} disabled={runningSimulationId === s.id || isAIOff} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 disabled:opacity-50">
                                        {runningSimulationId === s.id ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} シミュレーション実行
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {latestSimulationForSelectedScenario && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold mb-2">シミュレーション結果 (最新)</h4>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-4">
                            <div>
                                <h5 className="font-semibold text-sm">分析サマリー</h5>
                                <p className="text-sm whitespace-pre-wrap">{latestSimulationForSelectedScenario.outputs.summary}</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-sm">シミュレーション結果</h5>
                                <pre className="text-xs bg-black/50 p-2 rounded-md overflow-x-auto"><code>{JSON.stringify(latestSimulationForSelectedScenario.outputs.result, null, 2)}</code></pre>
                            </div>
                            <div>
                                <h5 className="font-semibold text-sm">算定根拠ファイル</h5>
                                <ul className="list-disc pl-5 text-sm">
                                    {latestSimulationForSelectedScenario.source_artifacts?.map(artifact => (
                                        <li key={artifact.file_id}>{artifact.file_name}</li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={() => handleGeneratePdf(latestSimulationForSelectedScenario)} disabled={generatingPdfId === latestSimulationForSelectedScenario.id} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50">
                                {generatingPdfId === latestSimulationForSelectedScenario.id ? <Loader className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5"/>} 融資用 計画書PDF生成
                            </button>
                        </div>
                    </div>
                )}
            </Section>
        </div>
    );
};

export default ProjectDetailPage;