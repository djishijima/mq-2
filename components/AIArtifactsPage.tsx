import React, { useState, useMemo } from 'react';
import { AIArtifact, EmployeeUser, SortConfig } from '../types';
import { Archive, X, FileText, Link as LinkIcon, Search, PieChart, Mail, Image as ImageIcon, ListOrdered } from './Icons';
import EmptyState from './ui/EmptyState';
import { formatDateTime } from '../utils';
import { getPublicUrl } from '../services/dataService';

const kindIcons: Record<string, React.ElementType> = {
  research: Search,
  proposal: FileText,
  estimate: ListOrdered,
  mail: Mail,
  analysis: PieChart,
  image: ImageIcon,
  default: Archive,
};

const ArtifactDetailModal: React.FC<{
    artifact: AIArtifact | null;
    onClose: () => void;
    userName: string;
}> = ({ artifact, onClose, userName }) => {
    if (!artifact) return null;
    
    const storageUrl = artifact.storage_path ? getPublicUrl(artifact.storage_path, 'ai') : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{artifact.title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            種別: {artifact.kind} | 作成者: {userName}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    {artifact.body_md && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">内容</h3>
                            <pre className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">{artifact.body_md}</pre>
                        </div>
                    )}
                    {storageUrl && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">添付ファイル</h3>
                             {artifact.kind === 'image' ? (
                                <img src={storageUrl} alt={artifact.title} className="max-w-full rounded-lg border border-slate-200 dark:border-slate-700" />
                             ) : (
                                <a href={storageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                                    <LinkIcon className="w-4 h-4" />
                                    ファイルを開く ({artifact.storage_path})
                                </a>
                             )}
                        </div>
                    )}
                </div>
                 <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">閉じる</button>
                </div>
            </div>
        </div>
    );
};

const ArtifactCard: React.FC<{ artifact: AIArtifact; userName: string; onSelect: () => void; }> = ({ artifact, userName, onSelect }) => {
  const Icon = kindIcons[artifact.kind] || kindIcons.default;
  const storageUrl = artifact.storage_path ? getPublicUrl(artifact.storage_path, 'ai') : null;

  return (
    <div onClick={onSelect} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-white leading-tight truncate">{artifact.title}</h3>
          <span className="text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-200 px-2 py-0.5 capitalize">{artifact.kind}</span>
        </div>
      </div>
      <div className="mt-4 text-sm text-slate-500 dark:text-slate-400 space-y-2 flex-grow min-h-[60px]">
        {artifact.kind === 'image' && storageUrl ? (
            <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-md overflow-hidden flex items-center justify-center">
                <img src={storageUrl} alt={artifact.title} className="w-full h-full object-cover" />
            </div>
        ) : artifact.body_md ? (
            <p className="line-clamp-3 text-xs">{artifact.body_md}</p>
        ) : null}
      </div>
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
        <span>{userName}</span>
        <span className="font-mono">{formatDateTime(artifact.createdAt)}</span>
      </div>
    </div>
  );
};

interface AIArtifactsPageProps {
  artifacts: AIArtifact[];
  allUsers: EmployeeUser[];
  searchTerm: string;
}

const AIArtifactsPage: React.FC<AIArtifactsPageProps> = ({ artifacts, allUsers, searchTerm }) => {
  const [selectedArtifact, setSelectedArtifact] = useState<AIArtifact | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  const usersById = useMemo(() => new Map(allUsers.map(u => [u.id, u.name])), [allUsers]);

  const filteredArtifacts = useMemo(() => {
    let filtered = artifacts;
    if (activeFilter !== 'all') {
        filtered = filtered.filter(a => a.kind === activeFilter);
    }
    if (!searchTerm) return filtered;
    const lowercasedTerm = searchTerm.toLowerCase();
    return filtered.filter(artifact =>
      artifact.title.toLowerCase().includes(lowercasedTerm) ||
      (usersById.get(artifact.created_by || '') || '').toLowerCase().includes(lowercasedTerm)
    );
  }, [artifacts, searchTerm, usersById, activeFilter]);

  const artifactKinds = useMemo(() => ['all', ...Array.from(new Set(artifacts.map(a => a.kind)))], [artifacts]);

  if (artifacts.length === 0 && !searchTerm) {
      return <EmptyState icon={Archive} title="AIドキュメントはありません" message="AIアシスタント機能を利用すると、生成されたレポートや提案書がここに保存されます。" />;
  }

  return (
      <>
        <div className="space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
                {artifactKinds.map(kind => (
                    <button key={kind} onClick={() => setActiveFilter(kind)}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${activeFilter === kind ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                    >
                        <span className="capitalize">{kind === 'all' ? 'すべて' : kind}</span>
                    </button>
                ))}
            </div>

             {filteredArtifacts.length === 0 ? (
                <EmptyState icon={Archive} title="該当するドキュメントはありません" message="検索条件またはフィルターを変更してください。" />
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredArtifacts.map((artifact) => (
                        <ArtifactCard
                            key={artifact.id}
                            artifact={artifact}
                            userName={usersById.get(artifact.created_by || '') || '不明'}
                            onSelect={() => setSelectedArtifact(artifact)}
                        />
                    ))}
                </div>
             )}
        </div>
        {selectedArtifact && (
            <ArtifactDetailModal 
                artifact={selectedArtifact} 
                onClose={() => setSelectedArtifact(null)} 
                userName={usersById.get(selectedArtifact.created_by || '') || '不明'}
            />
        )}
      </>
  );
};

export default AIArtifactsPage;