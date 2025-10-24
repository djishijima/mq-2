import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import CreateJobModal from './components/CreateJobModal';
import JobDetailModal from './components/JobDetailModal';
import CustomerList from './components/CustomerList';
import CustomerDetailModal from './components/CustomerDetailModal';
import { CompanyAnalysisModal } from './components/CompanyAnalysisModal';
import LeadManagementPage from './components/sales/LeadManagementPage';
import CreateLeadModal from './components/sales/CreateLeadModal';
import PlaceholderPage from './components/PlaceholderPage';
import UserManagementPage from './components/admin/UserManagementPage';
import ApprovalRouteManagementPage from './components/admin/ApprovalRouteManagementPage';
import BugReportList from './components/admin/BugReportList';
import BugReportChatModal from './components/BugReportChatModal';
import SettingsPage from './components/SettingsPage';
import AccountingPage from './components/Accounting';
import SalesPipelinePage from './components/sales/SalesPipelinePage';
import InventoryManagementPage from './components/inventory/InventoryManagementPage';
import CreateInventoryItemModal from './components/inventory/CreateInventoryItemModal';
import ManufacturingPipelinePage from './components/manufacturing/ManufacturingPipelinePage';
import ManufacturingOrdersPage from './components/manufacturing/ManufacturingOrdersPage';
import PurchasingManagementPage from './components/purchasing/PurchasingManagementPage';
import CreatePurchaseOrderModal from './components/purchasing/CreatePurchaseOrderModal';
import EstimateManagementPage from './components/sales/EstimateManagementPage';
import SalesRanking from './components/accounting/SalesRanking';
import BusinessPlanPage from './components/accounting/BusinessPlanPage';
import ApprovalWorkflowPage from './components/accounting/ApprovalWorkflowPage';
import BusinessSupportPage from './components/BusinessSupportPage';
import AIChatPage from './components/AIChatPage';
import MarketResearchPage from './components/MarketResearchPage';
import AIArtifactsPage from './components/AIArtifactsPage';
import AIDataEntryPage from './components/AIDataEntryPage';
import { ToastContainer } from './components/Toast';
import ConfirmationDialog from './components/ConfirmationDialog';
import ManufacturingCostManagement from './components/accounting/ManufacturingCostManagement';
import AuditLogPage from './components/admin/AuditLogPage';
import JournalQueuePage from './components/admin/JournalQueuePage';
import MasterManagementPage from './components/admin/MasterManagementPage';
import DatabaseSetupInstructionsModal from './components/DatabaseSetupInstructionsModal';
import AIImageStudioPage from './components/AIImageStudioPage';
import AIImageGenerationPage from './components/AIImageGenerationPage';
import Chatbot from './components/Chatbot';
import BusinessAnalysisPage from './components/accounting/BusinessAnalysisPage';
import AITextToSpeechPage from './components/ai/AITextToSpeechPage';
import AIAudioTranscriptionPage from './components/ai/AIAudioTranscriptionPage';
import AIVideoAnalysisPage from './components/ai/AIVideoAnalysisPage';
import AIVideoGenerationPage from './components/ai/AIVideoGenerationPage';
import AIVideoTranscriptionPage from './components/ai/AIVideoTranscriptionPage';
import AICopywritingPage from './components/ai/AICopywritingPage';
import PeriodClosingPage from './components/accounting/PeriodClosingPage';
import AnalysisProjectsPage from './components/accounting/AnalysisProjectsPage';
import ProjectDetailPage from './components/accounting/ProjectDetailPage';
import AnalysisSimulationPage from './components/accounting/AnalysisSimulationPage';


import * as dataService from './services/dataService';
import * as geminiService from './services/geminiService';
import { hasSupabaseCredentials } from './services/supabaseClient';

// FIX: Document type aliased to AppDocument to avoid collision with global Document
import { Page, Job, Customer, JournalEntry, User, AccountItem, Lead, ApprovalRoute, PurchaseOrder, InventoryItem, Employee, Toast, ConfirmationDialogProps, BugReport, Estimate, ApplicationWithDetails, Invoice, EmployeeUser, Department, PaymentRecipient, MasterAccountItem, AllocationDivision, Title, AIArtifact, AnalysisProject, Document as AppDocument, BankScenario, BankSimulation, UserActivityLog, InvoiceStatus } from './types';
import { PlusCircle, Loader, AlertTriangle, RefreshCw, Settings, MessageCircle } from './components/Icons';
import { createDemoDataState, DemoDataState } from './services/demoData'; // Import demo data and its type

const PAGE_TITLES: Record<Page, string> = {
    analysis_dashboard: 'ホーム',
    sales_leads: 'リード管理',
    sales_customers: '取引先管理',
    sales_pipeline: 'パイプライン（進捗）',
    sales_estimates: '見積管理',
    sales_orders: '案件・受注管理',
    sales_billing: '売上請求 (AR)',
    analysis_ranking: '売上ランキング',
    purchasing_orders: '発注 (PO)',
    purchasing_invoices: '仕入計上 (AP)',
    purchasing_payments: '支払管理',
    inventory_management: '在庫管理',
    manufacturing_orders: '製造指示',
    manufacturing_progress: '製造パイプライン',
    manufacturing_cost: '製造原価',
    hr_attendance: '勤怠',
    hr_man_hours: '工数',
    hr_labor_cost: '人件費配賦',
    approval_list: '承認一覧',
    approval_form_expense: '経費精算',
    approval_form_transport: '交通費申請',
    approval_form_leave: '休暇申請',
    approval_form_approval: '稟議',
    approval_form_daily: '日報',
    approval_form_weekly: '週報',
    accounting_journal: '仕訳帳',
    accounting_general_ledger: '総勘定元帳',
    accounting_trial_balance: '試算表',
    accounting_tax_summary: '消費税集計',
    accounting_period_closing: '締処理',
    accounting_business_plan: '経営計画',
    business_analysis: '経営分析',
    business_support_proposal: '提案書作成',
    ai_business_consultant: 'AIチャット',
    ai_market_research: 'AI市場調査',
    ai_artifacts: 'AIドキュメント',
    ai_data_entry: 'AIデータ入力',
    ai_image_studio: 'AI画像編集/分析',
    ai_image_generation: 'AIイラスト生成',
    ai_tts: 'AI音声合成',
    ai_audio_transcription: 'AI音声文字起こし',
    ai_video_analysis: 'AI動画分析',
    ai_video_generation: 'AI動画生成',
    ai_video_transcription: 'AI動画文字起こし',
    ai_copywriting: 'AI原稿作成',
    ai_prompt_history: 'AIプロンプト履歴', // Assuming this page exists from types, but not necessarily in sidebar
    admin_audit_log: 'マイアクティビティ',
    admin_journal_queue: 'ジャーナル・キュー',
    admin_user_management: 'ユーザー管理',
    admin_route_management: '承認ルート管理',
    admin_master_management: 'マスタ管理',
    admin_bug_reports: '改善要望一覧',
    settings: '設定',
    accounting_analysis_projects: '分析プロジェクト',
    accounting_project_detail: 'プロジェクト詳細',
    accounting_analysis_simulation: '財務シミュレーション',
};

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('analysis_dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
    const [accountItems, setAccountItems] = useState<AccountItem[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRoute[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allUsers, setAllUsers] = useState<EmployeeUser[]>([]);
    const [currentUser, setCurrentUser] = useState<EmployeeUser | null>(null);
    const [bugReports, setBugReports] = useState<BugReport[]>([]);
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [allocationDivisions, setAllocationDivisions] = useState<AllocationDivision[]>([]);
    const [employeeTitles, setEmployeeTitles] = useState<Title[]>([]);
    const [aiArtifacts, setAiArtifacts] = useState<AIArtifact[]>([]);
    const [userActivityLogs, setUserActivityLogs] = useState<UserActivityLog[]>([]);
    const [analysisProjects, setAnalysisProjects] = useState<AnalysisProject[]>([]);
    // FIX: Use AppDocument alias for Document
    const [documents, setDocuments] = useState<AppDocument[]>([]);
    const [bankScenarios, setBankScenarios] = useState<BankScenario[]>([]);
    const [bankSimulations, setBankSimulations] = useState<BankSimulation[]>([]);


    const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
    const [isJobDetailModalOpen, setIsJobDetailModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);

    const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);
    const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerDetailMode, setCustomerDetailMode] = useState<'view' | 'edit' | 'new'>('view');

    const [isCompanyAnalysisModalOpen, setIsCompanyAnalysisModalOpen] = useState(false);
    const [companyAnalysisResult, setCompanyAnalysisResult] = useState<any>(null);
    const [isCompanyAnalysisLoading, setIsCompanyAnalysisLoading] = useState(false);
    const [companyAnalysisError, setCompanyAnalysisError] = useState('');

    const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
    const [isCreateInventoryItemModalOpen, setIsCreateInventoryItemModalOpen] = useState(false);
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
    const [isCreatePurchaseOrderModalOpen, setIsCreatePurchaseOrderModalOpen] = useState(false);

    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogProps & { isOpen: boolean }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, onClose: () => { }
    });

    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isBugReportChatModalOpen, setIsBugReportChatModalOpen] = useState(false);

    const [isSupabaseConnected, setIsSupabaseConnected] = useState(hasSupabaseCredentials());
    const [showDatabaseSetupInstructions, setShowDatabaseSetupInstructions] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // FIX: Use process.env for environment variables
    const isDemoMode = useMemo(() => process.env.VITE_MODE === 'demo', []);
    const isAIOff = useMemo(() => process.env.VITE_AI_OFF === '1', []);

    const addToast = useCallback((message: string, type: Toast['type']) => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
    }, []);

    const requestConfirmation = useCallback((dialog: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
        setConfirmationDialog({ ...dialog, isOpen: true, onClose: () => setConfirmationDialog(prev => ({ ...prev, isOpen: false })) });
    }, [setConfirmationDialog]);

    const fetchAllData = useCallback(async () => {
        if (isDemoMode) {
            const demoData: DemoDataState = createDemoDataState();
            setJobs(demoData.jobs);
            setCustomers(demoData.customers);
            setJournalEntries(demoData.journalEntries);
            setAccountItems(demoData.accountItems);
            setLeads(demoData.leads);
            setApprovalRoutes(demoData.approvalRoutes);
            setPurchaseOrders(demoData.purchaseOrders);
            setInventoryItems(demoData.inventoryItems);
            setEmployees(demoData.employees);
            setAllUsers(demoData.employeeUsers);
            setBugReports(demoData.bugReports);
            setEstimates(demoData.estimates);
            setApplications(demoData.applications);
            setInvoices(demoData.invoices);
            setDepartments(demoData.departments);
            // FIX: Access allocationDivisions correctly from demoData
            setAllocationDivisions(demoData.allocationDivisions);
            // FIX: Access titles correctly from demoData
            setEmployeeTitles(demoData.employeeUsers.map(u => ({ id: u.id, name: u.title || '', isActive: true, createdAt: u.createdAt }))); // Assuming EmployeeUser.title can map to Title.name
            // FIX: Access aiArtifacts correctly from demoData
            setAiArtifacts(demoData.aiArtifacts);
            setUserActivityLogs(demoData.userActivityLogs);
            setAnalysisProjects(demoData.analysisProjects);
            setDocuments(demoData.documents);
            setBankScenarios(demoData.bankScenarios);
            setBankSimulations(demoData.bankSimulations);

            if (!currentUser && demoData.employeeUsers.length > 0) {
                setCurrentUser(demoData.employeeUsers[0]);
            } else if (currentUser) {
                const updatedCurrentUser = demoData.employeeUsers.find(u => u.id === currentUser.id);
                if (updatedCurrentUser) setCurrentUser(updatedCurrentUser);
                else setCurrentUser(demoData.employeeUsers[0] || null);
            }
            setIsSupabaseConnected(true); // Treat as connected for UI purposes in demo mode
            setConnectionError(null);
            return;
        }

        // Production Mode Data Fetching
        if (!isSupabaseConnected) {
            setConnectionError("Supabase接続情報が設定されていません。");
            return;
        }

        try {
            setConnectionError(null);
            const [
                jobsData,
                customersData,
                journalEntriesData,
                accountItemsData,
                leadsData,
                approvalRoutesData,
                purchaseOrdersData,
                inventoryItemsData,
                employeesData,
                usersData,
                bugReportsData,
                estimatesData,
                applicationCodesData,
                invoicesData,
                departmentsData,
                allocationDivisionsData,
                employeeTitlesData,
                aiArtifactsData,
                analysisProjectsData,
            ] = await Promise.all([
                dataService.getJobs(),
                dataService.getCustomers(),
                dataService.getJournalEntries(),
                dataService.getAccountItems(),
                dataService.getLeads(),
                dataService.getApprovalRoutes(),
                dataService.getPurchaseOrders(),
                dataService.getInventoryItems(),
                dataService.getEmployees(),
                dataService.getUsers(),
                dataService.getBugReports(),
                dataService.getEstimates(),
                dataService.getApplicationCodes(),
                dataService.getInvoices(),
                dataService.getDepartments(),
                dataService.getAllocationDivisions(),
                dataService.getTitles(),
                dataService.getAIArtifacts(),
                dataService.getAnalysisProjects(),
            ]);

            setJobs(jobsData);
            setCustomers(customersData);
            setJournalEntries(journalEntriesData);
            setAccountItems(accountItemsData);
            setLeads(leadsData);
            setApprovalRoutes(approvalRoutesData);
            setPurchaseOrders(purchaseOrdersData);
            setInventoryItems(inventoryItemsData);
            setEmployees(employeesData);
            setAllUsers(usersData);
            setBugReports(bugReportsData);
            setEstimates(estimatesData);
            // FIX: Pass currentUser to getApplications
            setApplications(await dataService.getApplications(currentUser)); 
            setInvoices(invoicesData);
            setDepartments(departmentsData);
            setAllocationDivisions(allocationDivisionsData);
            setEmployeeTitles(employeeTitlesData);
            setAiArtifacts(aiArtifactsData);
            setAnalysisProjects(analysisProjectsData);

            if (currentUser) {
                setUserActivityLogs(await dataService.getUserActivityLogs(currentUser.id));
            }


            if (!currentUser && usersData.length > 0) {
                setCurrentUser(usersData[0]); // Select first user as default
            } else if (currentUser) {
                // Ensure currentUser object is up-to-date with fetched data
                const updatedCurrentUser = usersData.find(u => u.id === currentUser.id);
                if (updatedCurrentUser) {
                    setCurrentUser(updatedCurrentUser);
                } else {
                    // Current user might have been deleted or deactivated
                    setCurrentUser(usersData[0] || null);
                }