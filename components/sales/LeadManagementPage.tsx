import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, SortConfig, Toast, ConfirmationDialogProps, EmployeeUser, Estimate } from '../../types';
import { Loader, Pencil, Trash2, Mail, Eye, CheckCircle, Lightbulb, List, KanbanSquare, Search, Users, TrendingUp } from '../Icons';
import { LeadDetailModal } from './LeadDetailModal';
import LeadStatusBadge from './LeadStatusBadge';
import LeadKanbanView from './LeadKanbanView';
import { generateLeadReplyEmail, investigateLeadCompany } from '../../services/geminiService';
import { formatDate } from '../../utils';
import EmptyState from '../ui/EmptyState';
import SortableHeader from '../ui/SortableHeader';
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu';
import StatCard from '../StatCard';


interface LeadManagementPageProps {
  leads: Lead[];
  searchTerm: string;
  onRefresh: () => void;
  onUpdateLead: (leadId: string, updatedData: Partial<Lead>) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  addToast: (message: string, type: Toast['type']) => void;
  requestConfirmation: (dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => void;
  currentUser: EmployeeUser | null;
  isAIOff: boolean;
  onAddEstimate: (estimate: Partial<Estimate>) => Promise<void>;
}

const LeadManagementPage: React.FC<LeadManagementPageProps> = ({ leads, searchTerm, onRefresh, onUpdateLead, onDeleteLead, addToast, requestConfirmation, currentUser, isAIOff, onAddEstimate }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'updatedAt', direction: 'descending' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [editingStatusLeadId, setEditingStatusLeadId] = useState<string | null>(null);
    const [isReplyingTo, setIsReplyingTo] = useState<string | null>(null);
    const [isMarkingContacted, setIsMarkingContacted] = useState<string | null>(null);
    const [investigatingLeadId, setInvestigatingLeadId] = useState<string | null>(null);

    const summaryStats = useMemo(() => {
        const totalLeads = leads.length;
        if (totalLeads === 0) {
            return { totalLeads: 0, newLeads: 0, qualifiedLeads: 0, conversionRate: 0 };
        }
        const newLeads = leads.filter(l => l.status === LeadStatus.New || l.status === LeadStatus.Untouched).length;
        const qualifiedLeads = leads.filter(l => l.status === LeadStatus.Qualified).length;
        const convertedLeads = leads.filter(l => l.status === LeadStatus.Converted || l.status === LeadStatus.Closed).length;
        const conversionRate = (convertedLeads / totalLeads) * 100;
        return { totalLeads, newLeads, qualifiedLeads, conversionRate };
    }, [leads]);

    const handleRowClick = (lead: Lead) => {
        setSelectedLead(lead);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedLead(null);
    };

    const handleSaveLead = async (leadId: string, updatedData: Partial<Lead>) => {
        await onUpdateLead(leadId, updatedData);
        if (selectedLead && selectedLead.id === leadId) {
            setSelectedLead(prev => prev ? { ...prev, ...updatedData } as Lead : null);
        }
    };
    
    const handleDeleteClick = (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        requestConfirmation({
            title: 'リードの削除',
            message: `本当にリード「${lead.company} / ${lead.name}」を削除しますか？この操作は元に戻せません。`,
            onConfirm: async () => {
                await onDeleteLead(lead.id);
                if (selectedLead && selectedLead.id === lead.id) {
                    handleCloseModal();
                }
            }
        });
    };
    
    const handleInvestigateCompany = async (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        if (isAIOff) {
            addToast('AI機能は現在無効です。', 'error');
            return;
        }
        setInvestigatingLeadId(lead.id);
        try {
            // FIX: Passed currentUser.id as the second argument
            const result = await investigateLeadCompany(lead.company, currentUser?.id || 'anonymous');
            // FIX: Property 'aiInvestigation' does not exist on type 'Partial<Lead>'. This is fixed by updating types.ts
            await onUpdateLead(lead.id, { aiInvestigation: result, updatedAt: new Date().toISOString() });
            addToast('企業調査が完了しました。', 'success');
        } catch (error) {
            addToast(error instanceof Error ? `企業調査エラー: ${error.message}` : '企業情報の補完に失敗しました。', 'error');
        } finally {
            setInvestigatingLeadId(null);
        }
    };

    const handleGenerateReply = async (lead: Lead) => {
        if (!lead.email) {
            addToast('返信先のメールアドレスが登録されていません。', 'error');
            return;
        }
        if (!currentUser) {
            addToast('ログインユーザー情報が見つかりません。', 'error');
            return;
        }
        setIsReplyingTo(lead.id);
        try {
            // FIX: Passed currentUser.id as the third argument
            const { subject, body } = await generateLeadReplyEmail(lead, currentUser.name, currentUser.id);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(gmailUrl, '_blank');
            
            const timestamp = new Date().toLocaleString('ja-JP');
            const logMessage = `[${timestamp}] AI返信メールを作成しました。`;
            const updatedInfo = `${logMessage}\n${lead.infoSalesActivity || ''}`.trim();
            
            await onUpdateLead(lead.id, { 
                infoSalesActivity: updatedInfo, 
                status: LeadStatus.Contacted,
                updatedAt: new Date().toISOString(),
            });
            addToast('Gmailの下書きを作成しました。', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'AIによるメール作成に失敗しました。', 'error');
        } finally {
            setIsReplyingTo(null);
        }
    };

    const handleMarkContacted = async (e: React.MouseEvent, lead: Lead) => {
        e.stopPropagation();
        setIsMarkingContacted(lead.id);
        try {
            const timestamp = new Date().toLocaleString('ja-JP');
            const logMessage = `[${timestamp}] ステータスを「${lead.status}」から「${LeadStatus.Contacted}」に変更しました。`;
            const updatedInfo = `${logMessage}\n${lead.infoSalesActivity || ''}`.trim();

            await onUpdateLead(lead.id, {
                status: LeadStatus.Contacted,
                infoSalesActivity: updatedInfo,
                updatedAt: new Date().toISOString(),
            });
            addToast('ステータスを「コンタクト済」に更新しました。', 'success');
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'ステータスの更新に失敗しました。', 'error');
        } finally {
            setIsMarkingContacted(null);
        }
    };

    const filteredLeads = useMemo(() => {
        if (!searchTerm) return leads;
        const lower = searchTerm.toLowerCase();
        return leads.filter(l => 
            l.name.toLowerCase().includes(lower) ||
            l.company.toLowerCase().includes(lower) ||
            l.status.toLowerCase().includes(lower) ||
            (l.source && l.source.toLowerCase().includes(lower))
        );
    }, [leads, searchTerm]);

    const sortedLeads = useMemo(() => {
        let sortableItems = [...filteredLeads];
        if (sortConfig) {
            sortableItems.sort((a, b) => {
                let aVal: any = a[sortConfig.key as keyof Lead];
                let bVal: any = b[sortConfig.key as keyof Lead];

                if (sortConfig.key === 'inquiryTypes') {
                    aVal = a.inquiryTypes ? a.inquiryTypes.join(', ') : (a.inquiryType || '');
                    bVal = b.inquiryTypes ? b.inquiryTypes.join(', ') : (b.inquiryType || '');
                }
                
                if (sortConfig.key === 'updatedAt') {
                    aVal = a.updatedAt || a.createdAt;
                    bVal = b.updatedAt || b.createdAt;
                }

                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                
                if (String(aVal).toLowerCase() < String(bVal).toLowerCase()) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (String(aVal).toLowerCase() > String(bVal).toLowerCase()) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredLeads, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="総リード数" value={summaryStats.totalLeads.toString()} icon={<Users className="w-6 h-6 text-indigo-600"/>} />
                <StatCard title="新規リード" value={summaryStats.newLeads.toString()} icon={<Lightbulb className="w-6 h-6 text-blue-600"/>} />
                <StatCard title="有望リード" value={summaryStats.qualifiedLeads.toString()} icon={<TrendingUp className="w-6 h-6 text-green-600"/>} />
                <StatCard title="コンバージョン率" value={`${summaryStats.conversionRate.toFixed(1)}%`} icon={<CheckCircle className="w-6 h-6 text-purple-600"/>} />
            </div>

            <div className="flex justify-end mb-4">
                <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                        <List className="w-4 h-4" /> リスト
                    </button>
                    <button onClick={() => setViewMode('kanban')} className={`px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                        <KanbanSquare className="w-4 h-4" /> カンバン
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <SortableHeader sortKey="updatedAt" label="最終更新日時" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="company" label="会社名 / 担当者" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="status" label="ステータス" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="inquiryTypes" label="問い合わせ種別" sortConfig={sortConfig} requestSort={requestSort} />
                                    <SortableHeader sortKey="email" label="メール" sortConfig={sortConfig} requestSort={requestSort} />
                                    <th scope="col" className="px-6 py-3 font-medium text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLeads.map((lead) => (
                                    <tr 
                                      key={lead.id} 
                                      className="group bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 cursor-pointer odd:bg-slate-50 dark:odd:bg-slate-800/50"
                                      onClick={() => handleRowClick(lead)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(lead.updatedAt || lead.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                {lead.company} <span className="font-normal text-slate-500">/ {lead.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            {editingStatusLeadId === lead.id ? (
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => {
                                                        const newStatus = e.target.value as LeadStatus;
                                                        onUpdateLead(lead.id, { status: newStatus, updatedAt: new Date().toISOString() });
                                                        setEditingStatusLeadId(null);
                                                    }}
                                                    onBlur={() => setEditingStatusLeadId(null)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                    className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg p-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingStatusLeadId(lead.id) }}
                                                    className="w-full text-left relative group/status p-1 flex items-center gap-2"
                                                >
                                                    <LeadStatusBadge status={lead.status} />
                                                    <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover/status:opacity-100 transition-opacity" />
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {lead.inquiryTypes && lead.inquiryTypes.length > 0
                                                ? <div className="flex flex-wrap gap-1">{lead.inquiryTypes.slice(0, 2).map(type => <span key={type} className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-600">{type}</span>)}</div>
                                                : (lead.inquiryType || '-')
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{lead.email || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleRowClick(lead)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" title="詳細表示">
                                                    <Eye className="w-5 h-5"/>
                                                </button>
                                                <button onClick={(e) => handleInvestigateCompany(e, lead)} disabled={isAIOff || investigatingLeadId === lead.id} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50" title="AIで企業調査">
                                                    {investigatingLeadId === lead.id ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                                </button>
                                                {lead.status === LeadStatus.Untouched && (
                                                    <button onClick={(e) => handleMarkContacted(e, lead)} disabled={isMarkingContacted === lead.id} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50" title="コンタクト済にする">
                                                        {isMarkingContacted === lead.id ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                    </button>
                                                )}
                                                <button onClick={(e) => { e.stopPropagation(); handleGenerateReply(lead); }} disabled={isAIOff || isReplyingTo === lead.id} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50" title="AIで返信作成">
                                                    {isReplyingTo === lead.id ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                                                </button>
                                                <button onClick={(e) => handleDeleteClick(e, lead)} className="p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50" title="削除">
                                                    <Trash2 className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                 {sortedLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            <EmptyState 
                                                icon={Lightbulb}
                                                title={searchTerm ? '検索結果がありません' : 'リードがありません'}
                                                message={searchTerm ? '検索条件を変更してください。' : '「新規作成」から最初のリードを登録してください。'}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <LeadKanbanView leads={filteredLeads} onUpdateLead={onUpdateLead} onCardClick={handleRowClick} />
            )}
            {isModalOpen && <LeadDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                lead={selectedLead}
                onSave={handleSaveLead}
                onDelete={onDeleteLead}
                addToast={addToast}
                requestConfirmation={requestConfirmation}
                currentUser={currentUser}
                onGenerateReply={handleGenerateReply}
                isAIOff={isAIOff}
                onAddEstimate={onAddEstimate}
            />}
        </>
    );
};

export default LeadManagementPage;