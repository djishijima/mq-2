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
    AppDocument, // FIX: Import AppDocument
    BankScenario,
    BankSimulation,
    UserActivityLog,
    ApprovalHistory,
} from '../types';

// --- Utility/Helper Functions (moved to top for visibility) ---

export const logUserActivity = async (userId: string, action: string, details?: any): Promise<void> => {
    const supabase = getSupabase();
    // Ensure `details` is always an object or null
    const logDetails = details === undefined ? null : (typeof details === 'object' && details !== null ? details : { value: String(details) });

    const { error } = await supabase.from('user_activity_logs').insert({ user_id: userId, action, details: logDetails });
    if (error) {
        console.error('Failed to log user activity:', error);
    }
};

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
  project_id: dbArtifact.project_id, // FIX: Add project_id
  kind: dbArtifact.kind,
  title: dbArtifact.title,
  lead_id: dbArtifact.lead_id,
  customer_id: dbArtifact.customer_id,
  body_md: dbArtifact.body_md,
  content_json: dbArtifact.content_json, // FIX: Add content_json
  storage_path: dbArtifact.storage_path,
  status: dbArtifact.status,
  created_by: dbArtifact.created_by,
  created_by_user: dbArtifact.created_by_user, // FIX: Include created_by_user
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
    const supabase =