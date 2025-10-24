import { getSupabase } from './supabaseClient';
import {
    EmployeeUser,
    Job,
    Customer,
    JournalEntry,
    User,
    AccountItem,
    Lead,
    ApprovalRoute,
    PurchaseOrder,
    InventoryItem,
    Employee,
    Toast,
    ConfirmationDialogProps,
    BugReport,
    Estimate,
    ApplicationWithDetails,
    Application,
    Invoice,
    InboxItem,
    InvoiceData,
    InboxItemStatus,
    ApplicationCode,
    BugReportStatus,
    ManufacturingStatus,
    InvoiceItem,
    EstimateStatus,
    MasterAccountItem,
    PaymentRecipient,
    Department,
    InvoiceStatus,
    LeadStatus,
    AllocationDivision,
    Title,
    AIArtifact,
    EstimateItem,
    AnalysisProject,
    Document,
    BankScenario,
    BankSimulation,
    UserActivityLog,
    ApprovalHistory,
} from '../types';

// --- Utility/Helper Functions (moved to top for visibility) ---

// FIX: Moved logUserActivity to the top
export const logUserActivity = async (userId: string, action: string, details?: any): Promise<void> => {
    const supabase = getSupabase();
    // Ensure `details` is always an object or null
    const logDetails = details === undefined ? null : (typeof details === 'object' && details !== null ? details : { value: String(details) });

    const { error } = await supabase.from('user_activity_logs').insert({ user_id: userId, action, details: logDetails });
    if (error) {
        console.error('Failed to log user activity:', error);
    }
};

// FIX: Moved addApprovalHistory to the top
export const addApprovalHistory = async (applicationId: string, userId: string, action: ApprovalHistory['action'], comment: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('approval_history').insert({
        application_id: applicationId,
        user_id: userId,
        action,
        comment,
    });
    if (error) {
        console.error('Failed to add approval history:', error);
    }
};


// Mappers from snake_case (DB) to camelCase (JS)
const dbJobToJob = (dbJob: any): Job => ({
    id: dbJob.id,
    jobNumber: dbJob.job_number,
    clientName: dbJob.client_name,
    title: dbJob.title,
    status: dbJob.status,
    dueDate: dbJob.due_date,
    quantity: dbJob.quantity,
    paperType: dbJob.paper_type,
    finishing: dbJob.finishing,
    details: dbJob.details,
    createdAt: dbJob.created_at,
    price: dbJob.price,
    variableCost: dbJob.variable_cost,
    invoiceStatus: dbJob.invoice_status,
    invoicedAt: dbJob.invoiced_at,
    paidAt: dbJob.paid_at,
    readyToInvoice: dbJob.ready_to_invoice,
    invoiceId: dbJob.invoice_id,
    manufacturingStatus: dbJob.manufacturing_status,
    aiAnalysisReport: dbJob.ai_analysis_report, // FIX: Add aiAnalysisReport mapping
});

const jobToDbJob = (job: Partial<Job>): any => ({
    job_number: job.jobNumber,
    client_name: job.clientName,
    title: job.title,
    status: job.status,
    due_date: job.dueDate,
    quantity: job.quantity,
    paper_type: job.paperType,
    finishing: job.finishing,
    details: job.details,
    price: job.price,
    variable_cost: job.variableCost,
    invoice_status: job.invoiceStatus,
    invoiced_at: job.invoicedAt,
    paid_at: job.paidAt,
    ready_to_invoice: job.readyToInvoice,
    invoice_id: job.invoiceId,
    manufacturing_status: job.manufacturingStatus,
    ai_analysis_report: job.aiAnalysisReport, // FIX: Add aiAnalysisReport mapping
});

const dbCustomerToCustomer = (dbCustomer: any): Customer => ({
    id: dbCustomer.id,
    customerCode: dbCustomer.customer_code,
    customerName: dbCustomer.customer_name,
    customerNameKana: dbCustomer.customer_name_kana,
    representative: dbCustomer.representative,
    phoneNumber: dbCustomer.phone_number,
    address1: dbCustomer.address_1,
    companyContent: dbCustomer.company_content,
    annualSales: dbCustomer.annual_sales,
    employeesCount: dbCustomer.employees_count,
    note: dbCustomer.note,
    infoSalesActivity: dbCustomer.info_sales_activity,
    infoRequirements: dbCustomer.info_requirements,
    infoHistory: dbCustomer.info_history,
    createdAt: dbCustomer.created_at,
    postNo: dbCustomer.post_no,
    address2: dbCustomer.address_2,
    fax: dbCustomer.fax,
    closingDay: dbCustomer.closing_day,
    monthlyPlan: dbCustomer.monthly_plan,
    payDay: dbCustomer.pay_day,
    recoveryMethod: dbCustomer.recovery_method,
    userId: dbCustomer.user_id,
    name2: dbCustomer.name2,
    websiteUrl: dbCustomer.website_url,
    zipCode: dbCustomer.zip_code,
    foundationDate: dbCustomer.foundation_date,
    capital: dbCustomer.capital,
    customerRank: dbCustomer.customer_rank,
    customerDivision: dbCustomer.customer_division,
    salesType: dbCustomer.sales_type,
    creditLimit: dbCustomer.credit_limit,
    payMoney: dbCustomer.pay_money,
    bankName: dbCustomer.bank_name,
    branchName: dbCustomer.branch_name,
    accountNo: dbCustomer.account_no,
    salesUserCode: dbCustomer.sales_user_code,
    startDate: dbCustomer.start_date,
    endDate: dbCustomer.end_date,
    drawingDate: dbCustomer.drawing_date,
    salesGoal: dbCustomer.sales_goal,
    infoSalesIdeas: dbCustomer.info_sales_ideas,
    customerContactInfo: dbCustomer.customer_contact_info,
    aiAnalysis: dbCustomer.ai_analysis,
});

const customerToDbCustomer = (customer: Partial<Customer>): any => {
    const dbData: { [key: string]: any } = {};
    for (const key in customer) {
        const camelKey = key as keyof Customer;
        const snakeKey = camelKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbData[snakeKey] = customer[camelKey];
    }
    return dbData;
};

const dbLeadToLead = (dbLead: any): Lead => ({
    id: dbLead.id,
    status: dbLead.status,
    createdAt: dbLead.created_at,
    name: dbLead.name,
    email: dbLead.email,
    phone: dbLead.phone,
    company: dbLead.company,
    source: dbLead.source,
    tags: dbLead.tags,
    message: dbLead.message,
    updatedAt: dbLead.updated_at,
    referrer: dbLead.referrer,
    referrerUrl: dbLead.referrer_url,
    landingPageUrl: dbLead.landing_page_url,
    searchKeywords: dbLead.search_keywords,
    utmSource: dbLead.utm_source,
    utmMedium: dbLead.utm_medium,
    utmCampaign: dbLead.utm_campaign,
    utmTerm: dbLead.utm_term,
    utmContent: dbLead.utm_content,
    userAgent: dbLead.user_agent,
    ipAddress: dbLead.ip_address,
    deviceType: dbLead.device_type,
    browserName: dbLead.browser_name,
    osName: dbLead.os_name,
    country: dbLead.country,
    city: dbLead.city,
    region: dbLead.region,
    employees: dbLead.employees,
    budget: dbLead.budget,
    timeline: dbLead.timeline,
    inquiryType: dbLead.inquiry_type,
    inquiryTypes: dbLead.inquiry_types,
    infoSalesActivity: dbLead.info_sales_activity,
    score: dbLead.score,
    aiAnalysisReport: dbLead.ai_analysis_report,
    aiDraftProposal: dbLead.ai_draft_proposal,
    aiInvestigation: dbLead.ai_investigation, // FIX: Add aiInvestigation mapping
});

const leadToDbLead = (lead: Partial<Lead>): any => {
    const dbData: { [key: string]: any } = {};
    for (const key in lead) {
        const camelKey = key as keyof Lead;
        const snakeKey = camelKey.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        dbData[snakeKey] = lead[camelKey];
    }
    return dbData;
};

const dbBugReportToBugReport = (dbReport: any): BugReport => ({
    id: dbReport.id,
    reporterName: dbReport.reporter_name,
    reportType: dbReport.report_type,
    summary: dbReport.summary,
    description: dbReport.description,
    status: dbReport.status,
    createdAt: dbReport.created_at,
});

const bugReportToDbBugReport = (report: Partial<BugReport>): any => ({
    reporter_name: report.reporterName,
    report_type: report.reportType,
    summary: report.summary,
    description: report.description,
    status: report.status,
});

const dbApplicationCodeToApplicationCode = (d: any): ApplicationCode => ({
    id: d.id,
    code: d.code,
    name: d.name,
    description: d.description,
    createdAt: d.created_at,
});

const dbApprovalRouteToApprovalRoute = (d: any): ApprovalRoute => ({
    id: d.id,
    name: d.name,
    routeData: {
        steps: (d.route_data?.steps || []).map((s: any) => ({
            approverId: s.approver_id,
        })),
    },
    createdAt: d.created_at,
});

const dbAIArtifactToAIArtifact = (dbArtifact: any): AIArtifact => ({
  id: dbArtifact.id,
  project_id: dbArtifact.project_id, // Add project_id
  kind: dbArtifact.kind,
  title: dbArtifact.title,
  lead_id: dbArtifact.lead_id,
  customer_id: dbArtifact.customer_id,
  body_md: dbArtifact.body_md,
  content_json: dbArtifact.content_json, // Add content_json
  storage_path: dbArtifact.storage_path,
  status: dbArtifact.status,
  created_by: dbArtifact.created_by,
  created_by_user: dbArtifact.created_by_user, // Include created_by_user
  createdAt: dbArtifact.created_at,
  updatedAt: dbArtifact.updated_at,
});

const dbEstimateToEstimate = (dbEstimate: any, allUsers?: User[]): Estimate => {
    const estimate: Estimate = {
        id: dbEstimate.id,
        leadId: dbEstimate.lead_id,
        customerId: dbEstimate.customer_id,
        customerName: dbEstimate.customer_name,
        totalAmount: dbEstimate.total_amount,
        status: dbEstimate.status,
        bodyMd: dbEstimate.body_md,
        createdBy: dbEstimate.created_by,
        createdAt: dbEstimate.created_at,
        updatedAt: dbEstimate.updated_at,
        title: dbEstimate.title,
        notes: dbEstimate.notes,
        jsonData: dbEstimate.json_data,
        pdfPath: dbEstimate.pdf_path,
        estimateDate: dbEstimate.estimate_date,
        items: dbEstimate.json_data || [],
    };
    if (allUsers && estimate.createdBy) {
        estimate.user = allUsers.find(u => u.id === estimate.createdBy);
    }
    return estimate;
};

const estimateToDbEstimate = (estimate: Partial<Estimate>): any => ({
    lead_id: estimate.leadId,
    customer_id: estimate.customerId,
    customer_name: estimate.customerName,
    total_amount: estimate.totalAmount,
    status: estimate.status,
    body_md: estimate.bodyMd,
    created_by: estimate.createdBy,
    title: estimate.title,
    notes: estimate.notes,
    json_data: estimate.jsonData || estimate.items,
    pdf_path: estimate.pdfPath,
    estimate_date: estimate.estimateDate,
});


export const isSupabaseUnavailableError = (error: any): boolean => {
    if (!error) return false;
    const message = typeof error === 'string' ? error : error.message || error.details || error.error_description;
    if (!message) return false;
    return /fetch failed/i.test(message) || /failed to fetch/i.test(message) || /network/i.test(message);
};

// --- Data Service Functions ---

export const getJobs = async (): Promise<Job[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('jobs').select('*').order('job_number', { ascending: false });
    if (error) throw new Error(`Failed to fetch jobs: ${error.message}`);
    return (data || []).map(dbJobToJob);
};

export const addJob = async (jobData: Omit<Job, 'id' | 'createdAt' | 'jobNumber'>): Promise<Job> => {
    const supabase = getSupabase();
    const dbJob = jobToDbJob(jobData);
    const { data, error } = await supabase.from('jobs').insert(dbJob).select().single();
    if (error) throw new Error(`Failed to add job: ${error.message}`);
    return dbJobToJob(data);
};

export const updateJob = async (id: string, updates: Partial<Job>): Promise<Job> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('jobs').update(jobToDbJob(updates)).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update job: ${error.message}`);
    return dbJobToJob(data);
};

export const deleteJob = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete job: ${error.message}`);
};

export const getCustomers = async (): Promise<Customer[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch customers: ${error.message}`);
    return (data || []).map(dbCustomerToCustomer);
};

export const addCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('customers').insert(customerToDbCustomer(customerData)).select().single();
    if (error) throw new Error(`Failed to add customer: ${error.message}`);
    return dbCustomerToCustomer(data);
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('customers').update(customerToDbCustomer(updates)).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update customer: ${error.message}`);
    return dbCustomerToCustomer(data);
};


export const getJournalEntries = async (): Promise<JournalEntry[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('journal_entries').select('*').order('date', { ascending: false });
    if (error) throw new Error(`Failed to fetch journal entries: ${error.message}`);
    return data || [];
};

export const addJournalEntry = async (entryData: Omit<JournalEntry, 'id'|'date'>): Promise<JournalEntry> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('journal_entries').insert(entryData).select().single();
    if (error) throw new Error(`Failed to add journal entry: ${error.message}`);
    return data;
};

export async function getUsers(): Promise<EmployeeUser[]> {
    const supabase = getSupabase();
    let data: any[] | null = null;
    let error: any = null;

    const { data: viewData, error: viewError } = await supabase
      .from('v_employees_active')
      .select('user_id, name, department, title, email, role, created_at')
      .order('name', { ascending: true });

    if (viewError) {
        console.warn("Could not fetch from 'v_employees_active' view, falling back to 'users' table. Error:", viewError.message);
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .order('name', { ascending: true });
        
        data = userData?.map(u => ({
            user_id: u.id, name: u.name, department: null, title: u.role === 'admin' ? '管理者' : 'スタッフ',
            email: u.email, role: u.role, created_at: u.created_at
        })) || [];
        error = userError;
    } else {
        data = viewData;
    }
  
    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    return (data || []).map(u => ({
        id: u.user_id, name: u.name, department: u.department, title: u.title,
        email: u.email, role: u.role, createdAt: u.created_at
    }));
}

export const addUser = async (userData: { name: string, email: string | null, role: 'admin' | 'user' }): Promise<void> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('users').insert({ email: userData.email, name: userData.name, role: userData.role }).select().single();
    if (error) throw new Error(`Failed to add user: ${error.message}. This might fail if the user doesn't exist in auth.users. An invite flow might be required.`);
    return;
};

export const updateUser = async (id: string, updates: Partial<EmployeeUser>): Promise<void> => {
    const supabase = getSupabase();
    const { error: userError } = await supabase.from('users').update({ name: updates.name, email: updates.email, role: updates.role }).eq('id', id);
    if (userError) throw new Error(`Failed to update user: ${userError.message}`);

    const { error: employeeError } = await supabase.from('employees').update({ department: updates.department, title: updates.title }).eq('user_id', id);
    if (employeeError) throw new Error(`Failed to update employee details: ${employeeError.message}`);
};

export const deleteUser = async (userId: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('employees').update({ active: false }).eq('user_id', userId);
    if (error) throw new Error(`Failed to delete user (deactivate employee): ${error.message}`);
};

export const getLeads = async (): Promise<Lead[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch leads: ${error.message}`);
    return (data || []).map(dbLeadToLead);
};

export const addLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('leads').insert(leadToDbLead(leadData)).select().single();
    if (error) throw new Error(`Failed to add lead: ${error.message}`);
    return dbLeadToLead(data);
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
    const supabase = getSupabase();
    const { updatedAt, ...restOfUpdates } = updates;
    const { data, error } = await supabase.from('leads').update(leadToDbLead(restOfUpdates)).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update lead: ${error.message}`);
    return dbLeadToLead(data);
};

export const deleteLead = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete lead: ${error.message}`);
};

export const getApprovalRoutes = async (): Promise<ApprovalRoute[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('approval_routes').select('*');
    if (error) throw new Error(`Failed to fetch approval routes: ${error.message}`);
    return (data || []).map(dbApprovalRouteToApprovalRoute);
};
export const addApprovalRoute = async (routeData: any): Promise<ApprovalRoute> => {
    const supabase = getSupabase();
    const dbRouteData = { name: routeData.name, route_data: { steps: routeData.routeData.steps.map((s:any) => ({ approver_id: s.approverId })) } };
    const { data, error } = await supabase.from('approval_routes').insert(dbRouteData).select().single();
    if (error) throw new Error(`Failed to add approval route: ${error.message}`);
    return dbApprovalRouteToApprovalRoute(data);
};
export const updateApprovalRoute = async (id: string, updates: Partial<ApprovalRoute>): Promise<ApprovalRoute> => {
    const supabase = getSupabase();
    const dbUpdates = { name: updates.name, route_data: { steps: updates.routeData!.steps.map(s => ({ approver_id: s.approverId }))}};
    const { data, error } = await supabase.from('approval_routes').update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update approval route: ${error.message}`);
    return dbApprovalRouteToApprovalRoute(data);
};
export const deleteApprovalRoute = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('approval_routes').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete approval route: ${error.message}`);
};

export const getApplications = async (currentUser: User | null): Promise<ApplicationWithDetails[]> => {
    const supabase = getSupabase();
    let query = supabase
        .from('applications')
        .select(`*, applicant:applicant_id(*), application_code:application_code_id(*), approval_route:approval_route_id(*)`)
        .order('created_at', { ascending: false });
    
    // Admins can see all applications, regular users only their own or those pending their approval
    if (currentUser?.role !== 'admin') {
        query = query.or(`applicant_id.eq.${currentUser?.id},approver_id.eq.${currentUser?.id}`);
    }
        
    const { data, error } = query;
        
    if (error) throw new Error(`Failed to fetch applications: ${error.message}`);
    
    // Fetch approval history for each application
    const applicationIds = data?.map(app => app.id) || [];
    const { data: historyData, error: historyError } = await supabase
        .from('approval_history')
        .select('*, user:user_id(name)')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: true });

    if (historyError) console.error("Failed to fetch approval history:", historyError);
    const historyMap = new Map<string, ApprovalHistory[]>();
    historyData?.forEach(h => {
        if (!historyMap.has(h.application_id)) {
            historyMap.set(h.application_id, []);
        }
        historyMap.get(h.application_id)?.push({ ...h, user: h.user || { name: '不明' } });
    });

    return (data || []).map(app => {
        const appWithDetails: ApplicationWithDetails = {
            id: app.id, applicantId: app.applicant_id, applicationCodeId: app.application_code_id, formData: app.form_data, status: app.status,
            submittedAt: app.submitted_at, approvedAt: app.approved_at, rejectedAt: app.rejected_at, currentLevel: app.current_level,
            approverId: app.approver_id, rejectionReason: app.rejection_reason, approvalRouteId: app.approval_route_id,
            createdAt: app.created_at, updatedAt: app.updated_at,
            applicant: app.applicant,
            applicationCode: app.application_code ? dbApplicationCodeToApplicationCode(app.application_code) : undefined,
            approvalRoute: app.approval_route ? dbApprovalRouteToApprovalRoute(app.approval_route) : undefined,
            approvalHistory: historyMap.get(app.id) || [],
        };
        return appWithDetails;
    });
};
export const getApplicationCodes = async (): Promise<ApplicationCode[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('application_codes').select('*');
    if (error) throw new Error(`Failed to fetch application codes: ${error.message}`);
    return (data || []).map(dbApplicationCodeToApplicationCode);
};
export const submitApplication = async (appData: any, applicantId: string): Promise<Application> => {
    const supabase = getSupabase();

    const { data: routeData, error: routeError } = await supabase.from('approval_routes').select('route_data').eq('id', appData.approvalRouteId).single();
    if (routeError) throw new Error(`承認ルートの取得に失敗しました: ${routeError.message}`);
    if (!routeData?.route_data?.steps || routeData.route_data.steps.length === 0) throw new Error('選択された承認ルートに承認者が設定されていません。');

    const firstApproverId = routeData.route_data.steps[0].approver_id;

    const { data, error } = await supabase.from('applications').insert({
        application_code_id: appData.applicationCodeId, form_data: appData.formData, approval_route_id: appData.approvalRouteId,
        applicant_id: applicantId, status: 'pending_approval', submitted_at: new Date().toISOString(), current_level: 1, approver_id: firstApproverId,
    }).select().single();

    if (error) throw new Error(`Failed to submit application: ${error.message}`);

    // Log the submission action
    await logUserActivity(applicantId, 'application_submitted', { applicationId: data.id, applicationCode: appData.applicationCodeId, status: 'pending_approval' });
    await addApprovalHistory(data.id, applicantId, 'submitted', '申請が提出されました。');

    return data;
};

export const approveApplication = async (app: ApplicationWithDetails, currentUser: User, comment: string = ''): Promise<void> => {
    const supabase = getSupabase();
    if (!app.approvalRoute?.routeData.steps) throw new Error('承認ルート情報が見つかりません。');

    const nextLevel = app.currentLevel + 1;
    const isFinalApproval = nextLevel > app.approvalRoute.routeData.steps.length;

    let updates: Partial<Application> = {};
    if (isFinalApproval) {
        updates = {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approverId: null, // No more approvers
            currentLevel: nextLevel -1, // Keep current level at previous to indicate completion of steps
        };
    } else {
        const nextApproverId = app.approvalRoute.routeData.steps[nextLevel - 1]?.approverId;
        if (!nextApproverId) throw new Error('次の承認者が見つかりません。承認ルートを確認してください。');
        updates = {
            currentLevel: nextLevel,
            approverId: nextApproverId,
        };
    }

    const { error } = await supabase.from('applications').update(updates).eq('id', app.id);
    if (error) throw new Error(`Failed to approve application: ${error.message}`);

    await logUserActivity(currentUser.id, 'application_approved', { applicationId: app.id, nextStatus: updates.status || 'pending_approval', currentLevel: app.currentLevel, nextLevel: updates.currentLevel, comment });
    await addApprovalHistory(app.id, currentUser.id, 'approved', comment || '承認しました。');
};

export const rejectApplication = async (app: ApplicationWithDetails, reason: string, currentUser: User): Promise<void> => {
    const supabase = getSupabase();
    if (!reason.trim()) throw new Error('差し戻し理由を入力してください。');

    const { error } = await supabase.from('applications').update({
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
        approverId: null, // No longer pending anyone's approval
    }).eq('id', app.id);

    if (error) throw new Error(`Failed to reject application: ${error.message}`);

    await logUserActivity(currentUser.id, 'application_rejected', { applicationId: app.id, reason });
    await addApprovalHistory(app.id, currentUser.id, 'rejected', reason);
};

export const cancelApplication = async (appId: string, userId: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('applications').update({
        status: 'cancelled',
        rejectedAt: new Date().toISOString(), // Using rejectedAt as cancelledAt for simplicity
        approverId: null,
        rejectionReason: '申請者による取り消し',
    }).eq('id', appId);

    if (error) throw new Error(`Failed to cancel application: ${error.message}`);
    await logUserActivity(userId, 'application_cancelled', { applicationId: appId });
    await addApprovalHistory(appId, userId, 'cancelled', '申請が取り消されました。');
};

export const getAccountItems = async (): Promise<AccountItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('account_items').select('*');
    if (error) throw new Error(`Failed to fetch account items: ${error.message}`);
    return (data || []).map(d => ({ ...d, sortOrder: d.sort_order, categoryCode: d.category_code, createdAt: d.created_at, updatedAt: d.updated_at, isActive: d.is_active }));
};

export const getActiveAccountItems = async (): Promise<MasterAccountItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('account_items').select('id, code, name, category_code').eq('is_active', true).order('sort_order', { nullsFirst: false }).order('code');
    if (error) throw new Error(`Failed to fetch active account items: ${error.message || JSON.stringify(error)}`);
    return (data || []).map(d => ({ ...d, id: d.id, code: d.code, name: d.name, categoryCode: d.category_code }));
};

export const saveAccountItem = async (item: Partial<AccountItem>): Promise<void> => {
    const supabase = getSupabase();
    const dbItem = { code: item.code, name: item.name, category_code: item.categoryCode, is_active: item.isActive, sort_order: item.sortOrder };
    const { error } = await supabase.from('account_items').upsert({ id: item.id, ...dbItem });
    if (error) throw new Error(`勘定科目の保存に失敗しました: ${error.message}`);
};

export const deactivateAccountItem = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('account_items').update({ is_active: false }).eq('id', id);
    if (error) throw new Error(`勘定科目の無効化に失敗しました: ${error.message}`);
};

export const getPaymentRecipients = async (q?: string): Promise<PaymentRecipient[]> => {
    const supabase = getSupabase();
    let query = supabase.from('payment_recipients').select('id, recipient_code, company_name, recipient_name').order('company_name', { nullsFirst: false }).order('recipient_name', { nullsFirst: false });

    if (q && q.trim()) {
        query = query.ilike('company_name', `%${q}%`);
    }
    const { data, error } = await query.limit(1000);
    if (error) throw new Error(`Failed to fetch payment recipients: ${error.message || JSON.stringify(error)}`);
    return (data || []).map(d => ({ id: d.id, recipientCode: d.recipient_code, companyName: d.company_name, recipientName: d.recipient_name }));
};

export const savePaymentRecipient = async (item: Partial<PaymentRecipient>): Promise<void> => {
    const supabase = getSupabase();
    const dbItem = { recipient_code: item.recipientCode, company_name: item.companyName, recipient_name: item.recipientName };
    const { error } = await supabase.from('payment_recipients').upsert({ id: item.id, ...dbItem });
    if (error) throw new Error(`支払先の保存に失敗しました: ${error.message}`);
};

export const deletePaymentRecipient = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('payment_recipients').delete().eq('id', id);
    if (error) throw new Error(`支払先の削除に失敗しました: ${error.message}`);
};

export const getAllocationDivisions = async (): Promise<AllocationDivision[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('allocation_divisions').select('*').order('name');
    if (error) throw new Error(`振分区分の取得に失敗しました: ${error.message}`);
    return (data || []).map(d => ({...d, createdAt: d.created_at, isActive: d.is_active}));
};

export const saveAllocationDivision = async (item: Partial<AllocationDivision>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('allocation_divisions').upsert({ id: item.id, name: item.name, is_active: item.isActive });
    if (error) throw new Error(`振分区分の保存に失敗しました: ${error.message}`);
};

export const deleteAllocationDivision = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('allocation_divisions').delete().eq('id', id);
    if (error) throw new Error(`振分区分の削除に失敗しました: ${error.message}`);
};

export const getDepartments = async (): Promise<Department[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('departments').select('id, name').order('name');
    if (error) throw new Error(`Failed to fetch departments: ${error.message}`);
    return data as Department[];
};

export const saveDepartment = async (item: Partial<Department>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('departments').upsert({ id: item.id, name: item.name });
    if (error) throw new Error(`部署の保存に失敗しました: ${error.message}`);
};

export const deleteDepartment = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) throw new Error(`部署の削除に失敗しました: ${error.message}`);
};

export const getTitles = async (): Promise<Title[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('employee_titles').select('*').order('name');
    if (error) throw new Error(`役職の取得に失敗しました: ${error.message}`);
    return (data || []).map(d => ({...d, createdAt: d.created_at, isActive: d.is_active}));
};

export const saveTitle = async (item: Partial<Title>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('employee_titles').upsert({ id: item.id, name: item.name, is_active: item.isActive });
    if (error) throw new Error(`役職の保存に失敗しました: ${error.message}`);
};

export const deleteTitle = async (id: string): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('employee_titles').delete().eq('id', id);
    if (error) throw new Error(`役職の削除に失敗しました: ${error.message}`);
};


export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('purchase_orders').select('*').order('order_date', { ascending: false });;
    if (error) throw new Error(`Failed to fetch purchase orders: ${error.message}`);
    return (data || []).map(d => ({ ...d, supplierName: d.supplier_name, itemName: d.item_name, orderDate: d.order_date, unitPrice: d.unit_price }));
};

export const addPurchaseOrder = async (order: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('purchase_orders').insert({
        supplier_name: order.supplierName, item_name: order.itemName, order_date: order.orderDate,
        quantity: order.quantity, unit_price: order.unitPrice, status: order.status,
    }).select().single();
    if (error) throw new Error(`Failed to add purchase order: ${error.message}`);
    return data as PurchaseOrder;
}


export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inventory_items').select('*').order('name');
    if (error) throw new Error(`Failed to fetch inventory items: ${error.message}`);
    return (data || []).map(d => ({ ...d, unitPrice: d.unit_price }));
};

export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inventory_items').insert({
        name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, unit_price: item.unitPrice
    }).select().single();
    if (error) throw new Error(`Failed to add inventory item: ${error.message}`);
    return data as InventoryItem;
}

export const updateInventoryItem = async (id: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inventory_items').update({
        name: item.name, category: item.category, quantity: item.quantity, unit: item.unit, unit_price: item.unitPrice
    }).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update inventory item: ${error.message}`);
    return data as InventoryItem;
}


export const getEmployees = async (): Promise<Employee[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw new Error(`Failed to fetch employees: ${error.message}`);
    return (data || []).map(d => ({...d, hireDate: d.hire_date, createdAt: d.created_at}));
};
export const getBugReports = async (): Promise<BugReport[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bug_reports').select('*').order('created_at', {ascending: false});
    if (error) throw new Error(`Failed to fetch bug reports: ${error.message}`);
    return (data || []).map(dbBugReportToBugReport);
};
export const addBugReport = async (report: any): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('bug_reports').insert({ ...bugReportToDbBugReport(report), status: '未対応' });
    if (error) throw new Error(`Failed to add bug report: ${error.message}`);
};
export const updateBugReport = async (id: string, updates: Partial<BugReport>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('bug_reports').update(bugReportToDbBugReport(updates)).eq('id', id);
    if (error) throw new Error(`Failed to update bug report: ${error.message}`);
};

export const getEstimates = async (): Promise<Estimate[]> => {
    const supabase = getSupabase();
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw new Error(`Failed to fetch users for estimates: ${usersError.message}`);

    const { data, error } = await supabase.from('estimates').select('*');
    if (error) throw new Error(`Failed to fetch estimates: ${error.message}`);
    return (data || []).map(d => dbEstimateToEstimate(d, users || []));
};

export const addEstimate = async (estimateData: Partial<Estimate>): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('estimates').insert(estimateToDbEstimate(estimateData));
    if (error) throw new Error(`Failed to add estimate: ${error.message}`);
};

export const updateEstimate = async (id: string, updates: Partial<Estimate>): Promise<Estimate> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('estimates').update(estimateToDbEstimate(updates)).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update estimate: ${error.message}`);
    const users = (await getUsers()) as User[];
    return dbEstimateToEstimate(data, users);
};


export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const supabase = getSupabase();
    const dbUpdates: any = {};
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.paidAt) dbUpdates.paid_at = updates.paidAt;
    
    const { data, error } = await supabase.from('invoices').update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update invoice: ${error.message}`);
    if (!data) throw new Error(`Invoice with ID ${id} not found after update.`); // FIX: Ensure data is not null before returning
    return data;
};


// --- Implemented Functions ---

export const getInvoices = async (): Promise<Invoice[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('invoices').select('*, items:invoice_items(*)').order('invoice_date', { ascending: false });
    if (error) throw new Error(`Failed to fetch invoices: ${error.message}`);
    return (data || []).map(inv => ({
        id: inv.id, invoiceNo: inv.invoice_no, invoiceDate: inv.invoice_date, dueDate: inv.due_date, customerName: inv.customer_name,
        subtotalAmount: inv.subtotal_amount, taxAmount: inv.tax_amount, totalAmount: inv.total_amount, status: inv.status,
        createdAt: inv.created_at, paidAt: inv.paid_at,
        items: inv.items.map((item: any) => ({
            id: item.id, invoiceId: item.invoice_id, jobId: item.job_id, description: item.description,
            quantity: item.quantity, unit: item.unit, unitPrice: item.unit_price, lineTotal: item.line_total, sortIndex: item.sort_index
        }))
    }));
};

export const createInvoiceFromJobs = async (jobIds: string[]): Promise<{ invoiceNo: string }> => {
    const supabase = getSupabase();
    const { data: jobsToInvoice, error: jobsError } = await supabase.from('jobs').select('*').in('id', jobIds);
    if (jobsError) throw new Error(`Failed to fetch jobs for invoicing: ${jobsError.message}`);
    if (!jobsToInvoice || jobsToInvoice.length === 0) throw new Error("No jobs found for invoicing.");

    const customerName = jobsToInvoice[0].client_name;
    const subtotal = jobsToInvoice.reduce((sum, job) => sum + job.price, 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const invoiceNo = `INV-${Date.now()}`;

    const { data: newInvoice, error: invoiceError } = await supabase.from('invoices').insert({
        invoice_no: invoiceNo, invoice_date: new Date().toISOString().split('T')[0], customer_name: customerName,
        subtotal_amount: subtotal, tax_amount: tax, total_amount: total, status: 'issued',
    }).select().single();
    if (invoiceError) throw new Error(`Failed to create invoice record: ${invoiceError.message}`);
    if (!newInvoice) throw new Error('Failed to create invoice, no data returned.'); // FIX: Ensure newInvoice is not null

    const invoiceItems: Omit<InvoiceItem, 'id'>[] = jobsToInvoice.map((job, index) => ({
        invoiceId: newInvoice.id, jobId: job.id, description: `${job.title} (案件番号: ${job.job_number})`,
        quantity: 1, unit: '式', unitPrice: job.price, lineTotal: job.price, sortIndex: index,
    }));
    const { error: itemsError } = await supabase.from('invoice_items').insert(invoiceItems.map(item => ({...item, invoice_id: item.invoiceId, job_id: item.jobId, unit_price: item.unitPrice, line_total: item.lineTotal, sort_index: item.sortIndex})));
    if (itemsError) throw new Error(`Failed to create invoice items: ${itemsError.message}`);

    const { error: updateJobsError } = await supabase.from('jobs').update({
        invoice_id: newInvoice.id, invoice_status: InvoiceStatus.Invoiced, invoiced_at: new Date().toISOString(),
    }).in('id', jobIds);
    if (updateJobsError) throw new Error(`Failed to update jobs after invoicing: ${updateJobsError.message}`);

    return { invoiceNo };
};

export const uploadFile = async (file: File | Blob, bucket: string, fileName: string): Promise<{ path: string }> => {
    const supabase = getSupabase();
    const fileToUpload = file instanceof File ? file : new File([file], fileName);
    const filePath = `${Date.now()}-${fileToUpload.name}`;
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, fileToUpload);
    if (error) throw new Error(`Failed to upload to ${bucket}: ${error.message}`);
    if (!data) throw new Error(`File upload to ${bucket} returned no data.`); // FIX: Ensure data is not null
    return { path: data.path };
};

export const getPublicUrl = (path: string, bucket: string): string | null => {
    if (!path) return null;
    const supabase = getSupabase();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};


export const getInboxItems = async (): Promise<InboxItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inbox_items').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch inbox items: ${error.message}`);

    return (data || []).map(item => {
        const url = getPublicUrl(item.file_path, 'inbox');
        return {
            id: item.id, fileUrl: url || '', extractedData: item.extracted_data, errorMessage: item.error_message,
            createdAt: item.created_at, fileName: item.file_name, filePath: item.file_path, mimeType: item.mime_type, status: item.status,
        }
    });
};

export const addInboxItem = async (item: Omit<InboxItem, 'id' | 'createdAt' | 'fileUrl'>): Promise<InboxItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inbox_items').insert({
        file_name: item.fileName, file_path: item.filePath, mime_type: item.mimeType, status: item.status,
        extracted_data: item.extractedData, error_message: item.errorMessage,
    }).select().single();
    if (error) throw new Error(`Failed to add inbox item: ${error.message}`);
    if (!data) throw new Error('Failed to add inbox item, no data returned.'); // FIX: Ensure data is not null
    return data as InboxItem;
};

export const updateInboxItem = async (id: string, updates: Partial<InboxItem>): Promise<InboxItem> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('inbox_items').update({
        status: updates.status, extracted_data: updates.extractedData,
    }).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update inbox item: ${error.message}`);
    if (!data) throw new Error(`Inbox item with ID ${id} not found after update.`); // FIX: Ensure data is not null
    
    const url = getPublicUrl(data.file_path, 'inbox');
    return { ...data, fileUrl: url || '', extractedData: data.extracted_data } as InboxItem;
};

export const deleteInboxItem = async (itemToDelete: InboxItem): Promise<void> => {
    const supabase = getSupabase();
    const { error: storageError } = await supabase.storage.from('inbox').remove([itemToDelete.filePath]);
    if (storageError) console.error("Storage deletion failed, proceeding with DB deletion:", storageError);

    const { error: dbError } = await supabase.from('inbox_items').delete().eq('id', itemToDelete.id);
    if (dbError) throw new Error(`Failed to delete inbox item from DB: ${dbError.message}`);
};

export const updateJobReadyToInvoice = async (jobId: string, value: boolean): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('jobs').update({ ready_to_invoice: value }).eq('id', jobId);
    if (error) throw new Error(`Failed to update job ready status: ${error.message}`);
};

// --- AI Artifacts ---
export const addAIArtifact = async (artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AIArtifact> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ai_artifacts').insert(artifactData).select().single();
    if (error) throw new Error(`Failed to add AI artifact: ${error.message}`);
    if (!data) throw new Error('Failed to add AI artifact, no data returned.'); // FIX: Ensure data is not null
    return dbAIArtifactToAIArtifact(data);
};

export const updateAIArtifact = async (id: string, updates: Partial<AIArtifact>): Promise<AIArtifact> => {
    const supabase = getSupabase();
    const dbUpdates = {
      storage_path: updates.storage_path
    };
    const { data, error } = await supabase.from('ai_artifacts').update(dbUpdates).eq('id', id).select().single();
    if (error) throw new Error(`Failed to update AI artifact: ${error.message}`);
    if (!data) throw new Error(`AI artifact with ID ${id} not found after update.`); // FIX: Ensure data is not null
    return dbAIArtifactToAIArtifact(data);
};

export const getAIArtifactsForLead = async (leadId: string): Promise<AIArtifact[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ai_artifacts').select('*, created_by_user:created_by(name)').eq('lead_id', leadId).order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch AI artifacts for lead: ${error.message}`);
    return (data || []).map(d => ({
        ...dbAIArtifactToAIArtifact(d),
        created_by_user: d.created_by_user || { name: '不明' }
    }));
};

export const getAIArtifacts = async (): Promise<AIArtifact[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('ai_artifacts').select('*, created_by_user:created_by(name)').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch AI artifacts: ${error.message}`);
    return (data || []).map(d => ({
        ...dbAIArtifactToAIArtifact(d),
        created_by_user: d.created_by_user || { name: '不明' }
    }));
};

// --- Analysis Projects ---

export const getAnalysisProjects = async (): Promise<AnalysisProject[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('analysis_projects').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch analysis projects: ${error.message}`);
    return data || [];
};

export const addAnalysisProject = async (projectData: Partial<Omit<AnalysisProject, 'id' | 'created_at' | 'status'>>): Promise<AnalysisProject> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('analysis_projects').insert(projectData).select().single();
    if (error) throw new Error(`Failed to add analysis project: ${error.message}`);
    if (!data) throw new Error('Failed to add analysis project, no data returned.'); // FIX: Ensure data is not null
    return data;
};

export const getDocuments = async (projectId: string): Promise<Document[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    return data || [];
};

export const addDocument = async (docData: Partial<Omit<Document, 'id' | 'created_at'>>): Promise<Document> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('documents').insert(docData).select().single();
    if (error) throw new Error(`Failed to add document: ${error.message}`);
    if (!data) throw new Error('Failed to add document, no data returned.'); // FIX: Ensure data is not null
    return data;
};

export const updateDocumentStatus = async (docId: string, status: Document['status']): Promise<void> => {
    const supabase = getSupabase();
    const { error } = await supabase.from('documents').update({ status }).eq('id', docId);
    if (error) throw new Error(`Failed to update document status: ${error.message}`);
};

export const getBankScenarios = async (projectId: string): Promise<BankScenario[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bank_scenarios').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch bank scenarios: ${error.message}`);
    return data || [];
};

export const addBankScenario = async (scenarioData: Partial<Omit<BankScenario, 'id' | 'created_at'>>): Promise<BankScenario> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bank_scenarios').insert(scenarioData).select().single();
    if (error) throw new Error(`Failed to add bank scenario: ${error.message}`);
    if (!data) throw new Error('Failed to add bank scenario, no data returned.'); // FIX: Ensure data is not null
    return data;
};

export const getBankSimulations = async (scenarioId: string): Promise<BankSimulation[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bank_simulations').select('*').eq('scenario_id', scenarioId).order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch bank simulations: ${error.message}`);
    return data || [];
};

export const addBankSimulation = async (simulationData: Partial<Omit<BankSimulation, 'id' | 'created_at' | 'completed_at'>>): Promise<BankSimulation> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bank_simulations').insert(simulationData).select().single();
    if (error) throw new Error(`Failed to add bank simulation: ${error.message}`);
    if (!data) throw new Error('Failed to add bank simulation, no data returned.'); // FIX: Ensure data is not null
    return data;
};

export const getUserActivityLogs = async (userId: string): Promise<UserActivityLog[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('user_activity_logs').select('*, user:user_id(name)').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch user activity logs: ${error.message}`);
    return (data || []).map(d => ({
        id: d.id,
        user_id: d.user_id,
        action: d.action,
        details: d.details,
        created_at: d.created_at,
        user: d.user || { name: '不明' }
    }));
};