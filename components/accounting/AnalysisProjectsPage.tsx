import React, { useState } from 'react';
import { AnalysisProject, EmployeeUser, Toast } from '../../types';
import { PlusCircle, Briefcase, Eye, Loader } from '../Icons';
import EmptyState from '../ui/EmptyState';
import { addAnalysisProject } from '../../services/dataService';
import ProjectDetailPage from './ProjectDetailPage';

interface AnalysisProjectsPageProps {
    projects: AnalysisProject[];
    onRefresh: () => void;
    currentUser: EmployeeUser | null;
    addToast: (message: string, type: Toast['type']) => void;
    isAIOff: boolean;
}

const AnalysisProjectsPage: React.FC<AnalysisProjectsPageProps> = ({ projects, onRefresh, currentUser, addToast, isAIOff }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !currentUser) return;
        setIsCreating(true);
        try {
            await addAnalysisProject({ name: newProjectName, created_by: currentUser.id });
            addToast('新規プロジェクトを作成しました。', 'success');
            onRefresh();
            setNewProjectName('');
        } catch (e) {
            addToast(e instanceof Error ? e.message : 'プロジェクトの作成に失敗しました。', 'error');
        } finally {
            setIsCreating(false);
        }
    };
    
    if (selectedProjectId) {
        return <ProjectDetailPage 
            projectId={selectedProjectId} 
            onBack={() => setSelectedProjectId(null)} 
            currentUser={currentUser}
            addToast={addToast}
            isAIOff={isAIOff}
            projectName={projects.find(p => p.id === selectedProjectId)?.name || 'プロジェクト'}
        />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="新規プロジェクト名"
                        className="w-full text-base bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg p-3 focus:ring-blue-500"
                        disabled={isCreating}
                    />
                    <button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()} className="w-48 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400">
                        {isCreating ? <Loader className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                        新規作成
                    </button>
                </div>
            </div>

            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">{project.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{project.status}</p>
                            <div className="mt-auto pt-4 flex justify-end">
                                <button onClick={() => setSelectedProjectId(project.id)} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                                    <Eye className="w-4 h-4" />
                                    プロジェクトを開く
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState icon={Briefcase} title="分析プロジェクトがありません" message="最初のプロジェクトを作成して、経営分析を始めましょう。" />
            )}
        </div>
    );
};

export default AnalysisProjectsPage;
