import { GoogleGenAI, Type, GenerateContentResponse, Chat, FunctionDeclaration, Modality } from "@google/genai";
import { AISuggestions, Customer, CompanyAnalysis, InvoiceData, AIJournalSuggestion, User, ApplicationCode, Estimate, EstimateItem, Lead, ApprovalRoute, Job, LeadStatus, JournalEntry, LeadScore, Application, ApplicationWithDetails, CompanyInvestigation, CustomProposalContent, LeadProposalPackage, MarketResearchReport, FinancialSimulationResult, AnalysisProject, Document, TimeSeriesMetric, BankScenario, Plan, AIArtifact } from '../types';
import { formatJPY, base64ToBlob, decode, decodeAudioData, encode } from "../utils";
import { logUserActivity, addAIArtifact, uploadFile, getPublicUrl } from './dataService'; // Import addAIArtifact and uploadFile

// AI機能をグローバルに制御する環境変数
const NEXT_PUBLIC_AI_OFF = process.env.VITE_AI_OFF === '1';

const API_KEY = process.env.VITE_API_KEY;

if (!API_KEY && !NEXT_PUBLIC_AI_OFF) {
  console.error("VITE_API_KEY environment variable not set. AI functions might be unavailable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = "gemini-2.5-flash";

const checkOnlineAndAIOff = () => {
    if (NEXT_PUBLIC_AI_OFF) {
        throw new Error('AI機能は現在無効です。');
    }
    if (!navigator.onLine) {
        throw new Error('オフラインです。ネットワーク接続を確認してください。');
    }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw error; // Propagate AbortError directly
        }
        if (retries > 0) {
            console.warn(`AI API call failed, retrying (${retries} retries left):`, error);
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
        }
        throw error;
    }
}

const suggestJobSchema = {
  type: Type.OBJECT,
  properties: {
    clientName: { type: Type.STRING, description: "依頼主の会社名。プロンプトから抽出できた場合のみ設定する。プロンプトに会社名がなければ、このフィールドは含めない。" },
    title: { type: Type.STRING, description: "印刷案件の簡潔でプロフェッショナルなタイトル。例：「カフェオープン記念 A5チラシ」" },
    quantity: { type: Type.INTEGER, description: "この種の案件で一般的または推奨される数量。例：1000" },
    paperType: { type: Type.STRING, description: "提供されたリストから最も適した用紙を選択。" },
    finishing: { type: Type.STRING, description: "提供されたリストから推奨される加工オプションを選択。" },
    details: { type: Type.STRING, description: "色、両面/片面、目的など、仕様を含む案件要件の詳細な説明。" },
    price: { type: Type.INTEGER, description: "この案件の現実的な販売価格（P）。数量、用紙、加工を考慮して見積もってください。例：85000" },
    variableCost: { type: Type.INTEGER, description: "この案件の現実的な変動費（V）。主に用紙代やインク代など。一般的に価格の40-60%程度です。例：35000" },
  },
  required: ["title", "quantity", "paperType", "finishing", "details", "price", "variableCost"],
};

export const getBusinessAnalysisAndSuggestions = async (files: { base64: string; mimeType: string }[], userId: string): Promise<{ analysis: string; suggestions: string[] }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const parts: any[] = files.map(file => ({
            inlineData: {
                data: file.base64,
                mimeType: file.mimeType,
            },
        }));

        const promptText = `あなたはMQ会計に精通した経営コンサルタントです。
        添付された複数期間にわたる財務データ（画像やPDFなど）を統合・分析し、月別・年別の傾向を読み解いてください。
        その上で、経営改善のための具体的な提案を3つ、箇条書きで生成してください。

        ## 出力フォーマット (JSON)
        {
          "analysis": "月別・年別の売上、利益、コスト構造の変動に関する分析サマーリー。",
          "suggestions": [
            "改善提案1",
            "改善提案2",
            "改善提案3"
          ]
        }
        `;
        parts.push({ text: promptText });
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_business_analysis_start', { prompt: promptText, fileCount: files.length });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_business_analysis_finish', { prompt: promptText, response: result });
        return result;
    });
};


export const suggestJobParameters = async (
    prompt: string,
    paperTypes: string[],
    finishingOptions: string[],
    file: { base64: string; mimeType: string; name?: string } | undefined,
    userId: string, // FIX: Added userId parameter
): Promise<AISuggestions> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const textPrompt = `以下の依頼内容に基づき、印刷案件のパラメータを提案してください。
依頼内容: "${prompt}"

選択可能な用紙リスト: ${paperTypes.join(', ')}
選択可能な加工リスト: ${finishingOptions.join(', ')}

上記リストに最適なものがない場合は、依頼内容に最も近い一般的なものを提案してください。`;

        const textPart = { text: textPrompt };
        const parts = [];

        if (file) {
            const filePart = {
                inlineData: {
                    data: file.base64,
                    mimeType: file.mimeType,
                },
            };
            parts.push(filePart);
            textPart.text = `このファイル（仕様書やメールのスクリーンショットなど）と以下のテキストを参考に、印刷案件のパラメータを提案してください。\n\n${textPrompt}`;
        }
        parts.push(textPart);

        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_job_suggestion_start', { prompt, fileName: file?.name });

        const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: { responseMimeType: "application/json", responseSchema: suggestJobSchema },
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_job_suggestion_finish', { prompt, response: result });
        return result;
    });
};

export const analyzeCompany = async (customer: Customer, userId: string): Promise<CompanyAnalysis> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下の企業情報に基づいて、詳細な企業分析レポートをJSON形式で作成してください。Web検索も活用し、最新の情報を反映させてください。

企業名: ${customer.customerName}
ウェブサイト: ${customer.websiteUrl || '情報なし'}
事業内容: ${customer.companyContent || '情報なし'}
既存の営業活動情報: ${customer.infoSalesActivity || '情報なし'}
要求事項: ${customer.infoRequirements || '情報なし'}

JSONのフォーマットは以下のようにしてください:
{
  "swot": "企業の強み、弱み、機会、脅威を分析したSWOT分析の結果。箇条書きで記述。",
  "painPointsAndNeeds": "企業が抱えているであろう課題や潜在的なニーズ。箇条書きで記述。",
  "suggestedActions": "これらの分析に基づき、当社が提案できる具体的なアクションや印刷案件。箇条書きで記述。",
  "proposalEmail": {
    "subject": "提案メールの件名",
    "body": "提案メールの本文。担当者名は[あなたの名前]としてください。"
  }
}
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_company_analysis_start', { customerId: customer.id, customerName: customer.customerName });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Changed to Pro for more complex analysis
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }

        try {
            const result = JSON.parse(jsonStr);
            const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            const sources = rawChunks.map((chunk: any) => chunk.web).filter(Boolean).map((webChunk: any) => ({ uri: webChunk.uri, title: webChunk.title }));
            const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
            
            const finalResult = { ...result, sources: uniqueSources };
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_company_analysis_finish', { customerId: customer.id, response: finalResult });
            return finalResult;
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", e);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_company_analysis_error', { customerId: customer.id, error: e instanceof Error ? e.message : String(e), rawResponse: jsonStr });
            // Fallback: return the text as part of the analysis.
            return {
                 swot: "JSON解析エラー",
                 painPointsAndNeeds: jsonStr,
                 suggestedActions: "",
                 proposalEmail: { subject: "エラー", body: "AIからの応答を解析できませんでした。" }
            };
        }
    });
};

export const investigateLeadCompany = async (companyName: string, userId: string): Promise<CompanyInvestigation> => {
    checkOnlineAndAIOff();
    const modelWithSearch = 'gemini-2.5-flash';
    return withRetry(async () => {
        const prompt = `企業名「${companyName}」について、その事業内容、最近のニュース、市場での評判を調査し、簡潔にまとめてください。`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_investigation_start', { companyName });

        const response = await ai.models.generateContent({
            model: modelWithSearch,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const summary = response.text;
        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const sources: { uri: string; title: string; }[] = (rawChunks || [])
            .map((chunk: any) => chunk.web)
            .filter((web: any): web is { uri: string; title: string } => 
                Boolean(web && typeof web.uri === 'string' && typeof web.title === 'string')
            );

        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
        
        const result = { summary, sources: uniqueSources };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_investigation_finish', { companyName, response: result });
        return result;
    });
};

export const enrichCustomerData = async (customerName: string, userId: string): Promise<Partial<Customer>> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `企業名「${customerName}」について、Web検索を用いて以下の情報を調査し、必ずJSON形式で返してください。見つからない情報はnullとしてください。
- 公式ウェブサイトURL (websiteUrl)
- 事業内容 (companyContent)
- 年商 (annualSales)
- 従業員数 (employeesCount)
- 本社の住所 (address1)
- 代表電話番号 (phoneNumber)
- 代表者名 (representative)`;
        
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_customer_enrichment_start', { customerName });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], // Added googleSearch
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        
        const parsed = JSON.parse(jsonStr);
        
        const cleanedData: Partial<Customer> = {};
        for (const key in parsed) {
            if (parsed[key] !== null && parsed[key] !== undefined) {
                cleanedData[key as keyof Customer] = parsed[key];
            }
        }
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_customer_enrichment_finish', { customerName, response: cleanedData });
        return cleanedData;
    });
};


const extractInvoiceSchema = {
    type: Type.OBJECT,
    properties: {
        vendorName: { type: Type.STRING, description: "請求書の発行元企業名。" },
        invoiceDate: { type: Type.STRING, description: "請求書の発行日 (YYYY-MM-DD形式)。" },
        totalAmount: { type: Type.NUMBER, description: "請求書の合計金額（税込）。" },
        description: { type: Type.STRING, description: "請求内容の簡潔な説明。" },
        costType: { type: Type.STRING, description: "この費用が変動費(V)か固定費(F)かを推測してください。", enum: ["V", "F"] },
        account: { type: Type.STRING, description: "この請求内容に最も適した会計勘定科目を提案してください。例: 仕入高, 広告宣伝費, 事務用品費" },
        relatedCustomer: { type: Type.STRING, description: "この費用に関連する顧客名（もしあれば）。" },
        project: { type: Type.STRING, description: "この費用に関連する案件名やプロジェクト名（もしあれば）。" }
    },
    required: ["vendorName", "invoiceDate", "totalAmount", "description", "costType", "account"],
};

export const extractInvoiceDetails = async (imageBase64: string, mimeType: string, userId: string): Promise<InvoiceData> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const imagePart = { inlineData: { data: imageBase64, mimeType } };
        const textPart = { text: "この画像から請求書の詳細情報を抽出してください。" };
        
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_invoice_ocr_start', { mimeType, imageSize: imageBase64.length });

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: "application/json", responseSchema: extractInvoiceSchema },
        });
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_invoice_ocr_finish', { response: result });
        return result;
    });
};

const suggestJournalEntrySchema = {
    type: Type.OBJECT,
    properties: {
        account: { type: Type.STRING, description: "この取引に最も適した勘定科目。" },
        description: { type: Type.STRING, description: "取引内容を簡潔に説明する摘要。" },
        debit: { type: Type.NUMBER, description: "借方の金額。貸方の場合は0。" },
        credit: { type: Type.NUMBER, description: "貸方の金額。借方の場合は0。" }
    },
    required: ["account", "description", "debit", "credit"]
};

export const suggestJournalEntry = async (prompt: string, userId: string): Promise<AIJournalSuggestion> => {
  checkOnlineAndAIOff();
  return withRetry(async () => {
    const fullPrompt = `以下の日常的な取引内容を会計仕訳に変換してください。「${prompt}」`;
    // FIX: Pass userId to logUserActivity
    await logUserActivity(userId, 'ai_journal_suggestion_start', { prompt: fullPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: { responseMimeType: "application/json", responseSchema: suggestJournalEntrySchema },
    });
    const jsonStr = response.text.trim();
    const result = JSON.parse(jsonStr);
    // FIX: Pass userId to logUserActivity
    await logUserActivity(userId, 'ai_journal_suggestion_finish', { prompt: fullPrompt, response: result });
    return result;
  });
};

export const generateSalesEmail = async (customer: Customer, senderName: string, userId: string): Promise<{ subject: string; body: string }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `顧客名「${customer.customerName}」向けの営業提案メールを作成してください。送信者は「${senderName}」です。`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_sales_email_start', { customerId: customer.id, customerName: customer.customerName });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
        const text = response.text;
        const subjectMatch = text.match(/件名:\s*(.*)/);
        const bodyMatch = text.match(/本文:\s*([\s\S]*)/);
        
        const result = {
            subject: subjectMatch ? subjectMatch[1].trim() : 'ご提案の件',
            body: bodyMatch ? bodyMatch[1].trim() : text,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_sales_email_finish', { customerId: customer.id, response: result });
        return result;
    });
};

export const generateLeadReplyEmail = async (lead: Lead, senderName: string, userId: string): Promise<{ subject: string; body: string }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のリード情報に対して、初回の返信メールを作成してください。
会社名: ${lead.company}
担当者名: ${lead.name}様
問い合わせ内容: ${lead.message || '記載なし'}
送信者: ${senderName}`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_reply_email_start', { leadId: lead.id, company: lead.company });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
        const text = response.text;
        const subjectMatch = text.match(/件名:\s*(.*)/);
        const bodyMatch = text.match(/本文:\s*([\s\S]*)/);
        
        const result = {
            subject: subjectMatch ? subjectMatch[1].trim() : 'お問い合わせありがとうございます',
            body: bodyMatch ? bodyMatch[1].trim() : text,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_reply_email_finish', { leadId: lead.id, response: result });
        return result;
    });
};

export const analyzeLeadData = async (leads: Lead[], userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のリードデータ（${leads.length}件）を分析し、営業活動に関する簡潔なインサイトや提案を1つ生成してください。
        特に、有望なリードの傾向や、アプローチすべきセグメントなどを指摘してください。
        
        データサンプル:
        ${JSON.stringify(leads.slice(0, 3).map(l => ({ company: l.company, status: l.status, inquiryType: l.inquiryType, message: l.message })), null, 2)}
        `;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_analysis_start', { leadCount: leads.length });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_analysis_finish', { response: result });
        return result;
    });
};

export const getDashboardSuggestion = async (jobs: Job[], userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const recentJobs = jobs.slice(0, 5).map(j => ({
            title: j.title,
            price: j.price,
            variableCost: j.variableCost,
            margin: j.price - j.variableCost,
            marginRate: j.price > 0 ? ((j.price - j.variableCost) / j.price) * 100 : 0
        }));

        const prompt = `あなたは印刷会社の経営コンサルタントです。以下の最近の案件データ（${recentJobs.length}件）を分析し、経営改善のための具体的で簡潔な提案を1つしてください。多角的な視点（収益性、効率性、戦略的価値）から分析し、 actionable な提案を生成してください。

データサンプル:
${JSON.stringify(recentJobs, null, 2)}
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_dashboard_suggestion_start', { jobCount: jobs.length });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_dashboard_suggestion_finish', { response: result });
        return result;
    });
};

export const generateDailyReportSummary = async (customerName: string, activityContent: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のキーワードを元に、営業日報の活動内容をビジネス文書としてまとめてください。
訪問先: ${customerName}
キーワード: ${activityContent}`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_daily_report_summary_start', { customerName, activityContent });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_daily_report_summary_finish', { response: result });
        return result;
    });
};

export const generateWeeklyReportSummary = async (keywords: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のキーワードを元に、週報の報告内容をビジネス文書としてまとめてください。
キーワード: ${keywords}`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_weekly_report_summary_start', { keywords });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_weekly_report_summary_finish', { response: result });
        return result;
    });
};

const draftEstimateSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "見積の件名。顧客の依頼内容を反映し、具体的で分かりやすいものにする。例：「2025年度 会社案内パンフレット制作」" },
        items: {
            type: Type.ARRAY,
            description: "見積の明細項目。印刷会社の標準的な項目で構成する。",
            items: {
                type: Type.OBJECT,
                properties: {
                    division: { 
                        type: Type.STRING, 
                        description: "項目区分",
                        enum: ['用紙代', 'デザイン・DTP代', '刷版代', '印刷代', '加工代', 'その他', '初期費用', '月額費用']
                    },
                    content: { type: Type.STRING, description: "具体的な作業内容や品名。用紙の種類や厚さ、加工の種類などを記載。" },
                    quantity: { type: Type.NUMBER, description: "数量。単位と対応させる。" },
                    unit: { type: Type.STRING, description: "単位（例：部, 枚, 式, 連, 月）" },
                    unitPrice: { type: Type.NUMBER, description: "単価" },
                    price: { type: Type.NUMBER, description: "金額 (数量 * 単価)" },
                    cost: { type: Type.NUMBER, description: "この項目にかかる原価" },
                },
                required: ["division", "content", "quantity", "unit", "unitPrice", "price", "cost"]
            }
        },
        deliveryDate: { type: Type.STRING, description: "希望納期 (YYYY-MM-DD形式)" },
        paymentTerms: { type: Type.STRING, description: "支払条件。例：「月末締め翌月末払い」" },
        deliveryMethod: { type: Type.STRING, description: "納品方法。例：「指定倉庫へ一括納品」" },
        notes: { type: Type.STRING, description: "補足事項や備考。見積の有効期限なども記載する。" }
    },
    required: ["title", "items", "deliveryDate", "paymentTerms"]
};

export const draftEstimate = async (prompt: string, userId: string): Promise<Partial<Estimate>> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const fullPrompt = `あなたは日本の印刷会社で20年以上の経験を持つベテランの見積担当者です。以下の顧客からの要望に基づき、現実的で詳細な見積の下書きをJSON形式で作成してください。原価計算も行い、適切な利益を乗せた単価と金額を設定してください。

【重要】もし顧客の要望が倉庫管理、定期発送、サブスクリプション型のサービスを示唆している場合、必ず「初期費用」と「月額費用」の項目を立てて見積を作成してください。その際の単位は、初期費用なら「式」、月額費用なら「月」としてください。

顧客の要望: "${prompt}"`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_estimate_draft_start', { prompt: fullPrompt });

        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: { responseMimeType: "application/json", responseSchema: draftEstimateSchema as any },
        });
        const jsonStr = response.text.trim();
        const parsed = JSON.parse(jsonStr);
        // Ensure items array exists
        if (!parsed.items) {
            parsed.items = [];
        }
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_estimate_draft_finish', { prompt: fullPrompt, response: parsed });
        return parsed;
    });
};

export const generateProposalSection = async (
    sectionTitle: string,
    customer: Customer,
    job: Job | undefined,
    estimate: Estimate | undefined,
    userId: string, // FIX: Added userId parameter
): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        let context = `
顧客情報:
- 顧客名: ${customer.customerName}
- 事業内容: ${customer.companyContent || 'N/A'}
- 既知の要求事項: ${customer.infoRequirements || 'N/A'}
- これまでの営業活動: ${customer.infoSalesActivity || 'N/A'}
- Webサイト: ${customer.websiteUrl || 'N/A'}
`;

        if (job) {
            context += `
関連案件情報:
- 案件名: ${job.title}
- 案件詳細: ${job.details}
- 金額: ${formatJPY(job.price)}
`;
        }

        if (estimate) {
            context += `
関連見積情報:
- 見積件名: ${estimate.title}
- 見積合計: ${formatJPY(estimate.totalAmount)}
- 見積項目: ${estimate.items?.map(i => `${i.content} (${formatJPY(i.price)})`).join(', ') || ''}
`;
        }

        const prompt = `
あなたはプロのビジネスコンサルタントです。以下のコンテキスト情報と、必要に応じてWeb検索の結果を活用して、提案書の「${sectionTitle}」セクションの文章を作成してください。プロフェッショナルで、説得力があり、顧客の利益に焦点を当てた文章を生成してください。

${context}

「${sectionTitle}」セクションの下書きを生成してください。
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_proposal_section_start', { customerId: customer.id, sectionTitle, job: job?.id, estimate: estimate?.id });

        const response = await ai.models.generateContent({ 
            model: "gemini-2.5-pro", // Changed to Pro for more complex proposal sections
            contents: prompt, 
            config: { 
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
            },
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_proposal_section_finish', { sectionTitle, response: result });
        return result;
    });
};

const scoreLeadSchema = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "このリードの有望度を0から100のスコアで評価してください。" },
        rationale: { type: Type.STRING, description: "スコアの根拠を簡潔に説明してください。" }
    },
    required: ["score", "rationale"]
};

export const scoreLead = async (lead: Lead, userId: string): Promise<LeadScore> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のリード情報を分析し、有望度をスコアリングしてください。
会社名: ${lead.company}
問い合わせ種別: ${lead.inquiryTypes?.join(', ') || lead.inquiryType}
メッセージ: ${lead.message}`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_score_start', { leadId: lead.id });

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: scoreLeadSchema },
        });
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_score_finish', { leadId: lead.id, response: result });
        return result;
    });
};

export const startBugReportChat = (): Chat => {
    checkOnlineAndAIOff(); // Will throw if AI is off or offline
    const systemInstruction = `あなたはバグ報告と改善要望を受け付けるアシスタントです。ユーザーからの報告内容をヒアリングし、以下のJSON形式で最終的に出力してください。
    { "report_type": "bug" | "improvement", "summary": "簡潔な件名", "description": "詳細な内容" }
    このJSONを出力するまでは、自然な会話でユーザーから情報を引き出してください。`;
    return ai.chats.create({ model, config: { systemInstruction } });
};

export const processApplicationChat = async (history: { role: 'user' | 'model', content: string }[], appCodes: ApplicationCode[], users: User[], routes: ApprovalRoute[], userId: string): Promise<string> => {
  checkOnlineAndAIOff();
  return withRetry(async () => {
      const prompt = `あなたは申請アシスタントです。ユーザーとの会話履歴と以下のマスター情報に基づき、ユーザーの申請を手伝ってください。
最終的に、ユーザーの申請内容を以下のJSON形式で出力してください。それまでは自然な会話を続けてください。
{ "applicationCodeId": "...", "formData": { ... }, "approvalRouteId": "..." }

会話履歴: ${JSON.stringify(history)}
申請種別マスター: ${JSON.stringify(appCodes)}
承認ルートマスター: ${JSON.stringify(routes)}
`;
      // FIX: Pass userId to logUserActivity
      await logUserActivity(userId, 'ai_application_chat_start', { chatHistory: history.map(m => m.content), appCodeCount: appCodes.length });

      const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {},
        });
      const result = response.text;
      // FIX: Pass userId to logUserActivity
      await logUserActivity(userId, 'ai_application_chat_finish', { response: result });
      return result;
  });
};

export const generateClosingSummary = async (type: '月次' | '年次', currentJobs: Job[], prevJobs: Job[], currentJournal: JournalEntry[], prevJournal: JournalEntry[], userId: string): Promise<string> => {
  checkOnlineAndAIOff();
  return withRetry(async () => {
    const prompt = `以下のデータに基づき、${type}決算のサマリーを生成してください。前月比や課題、改善提案を含めてください。`;
    // In a real scenario, you'd pass the data, but for brevity we'll just send the prompt.
    // FIX: Pass userId to logUserActivity
    await logUserActivity(userId, 'ai_closing_summary_start', { type, jobCount: currentJobs.length });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro", // Changed to Pro for more complex financial summaries
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
        },
    });
    const result = response.text;
    // FIX: Pass userId to logUserActivity
    await logUserActivity(userId, 'ai_closing_summary_finish', { response: result });
    return result;
  });
};

export const startBusinessConsultantChat = (): Chat => {
    checkOnlineAndAIOff(); // Will throw if AI is off or offline
    const systemInstruction = `あなたは、中小企業の印刷会社を専門とする経験豊富な経営コンサルタントです。あなたの目的は、経営者がデータに基づいたより良い意思決定を行えるよう支援することです。提供されたデータコンテキストとユーザーからの質問に基づき、Web検索も活用して、具体的で実行可能なアドバイスを提供してください。専門的かつデータに基づいた、簡潔な回答を心がけてください。`;
    return ai.chats.create({ 
        model, 
        config: { 
            systemInstruction,
            tools: [{ googleSearch: {} }] 
        } 
    });
};

export const generateLeadAnalysisAndProposal = async (lead: Lead, userId: string): Promise<{ analysisReport: string; draftProposal: string; }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のリード情報とWeb検索の結果を組み合わせて、企業分析レポートと提案書のドラフトを生成し、指定されたJSON形式で出力してください。

リード情報:
- 会社名: ${lead.company}
- 担当者名: ${lead.name}
- 問い合わせ内容: ${lead.message || '具体的な内容は記載されていません。'}

Web検索を活用して、企業の事業内容、最近の動向、および問い合わせ内容に関連する業界の課題を調査してください。
その上で、当社の印刷・物流サービスがどのように役立つかを具体的に提案してください。

出力JSONフォーマット:
{
  "analysisReport": "リードの会社、問い合わせ内容、Webサイト(あれば)を基にした簡潔な分析レポート。企業の潜在的なニーズや、当社が提供できる価値についてMarkdown形式で記述してください。",
  "draftProposal": "分析レポートに基づいた提案書のドラフト。Markdown形式で記述し、「1. 背景と課題」「2. 提案内容」「3. 期待される効果」「4. 概算費用」のセクションを含めてください。「4. 概算費用」: 概算費用を具体的に提示してください。もし書籍の保管や発送代行のような継続的なサービスが含まれる場合、必ず「初期費用」と「月額費用」に分けて、保管料、発送手数料などの具体的な項目と金額を提示してください。"
}
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_analysis_proposal_start', { leadId: lead.id, company: lead.company });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { 
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }

        try {
            const result = JSON.parse(jsonStr);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_lead_analysis_proposal_finish', { leadId: lead.id, response: result });
            return result;
        } catch (e) {
            console.error("Failed to parse JSON from Gemini for lead analysis:", e);
            console.error("Received text:", jsonStr);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_lead_analysis_proposal_error', { leadId: lead.id, error: e instanceof Error ? e.message : String(e), rawResponse: jsonStr });
            // Fallback: return the text as part of the analysis if JSON parsing fails.
            return {
                 analysisReport: "AIからの応答を解析できませんでした。以下に生の応答を示します。\n\n" + jsonStr,
                 draftProposal: "AIからの応答を解析できませんでした。"
            };
        }
    });
};

export const generateMarketResearchReport = async (topic: string, userId: string): Promise<MarketResearchReport> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下のトピックについて、Web検索を活用して詳細な市場調査レポートを、必ず指定されたJSON形式で作成してください。

調査トピック: "${topic}"

レポートには、市場の概要、主要トレンド、競合分析、ビジネスチャンス、脅威/リスクを含めてください。
JSONフォーマット:
{
    "title": "調査トピックを反映した、レポート全体のタイトル。",
    "summary": "調査結果全体の簡潔なエグゼクティブサマリー。",
    "trends": ["市場の主要なトレンド。箇条書きで複数挙げる。"],
    "competitorAnalysis": "主要な競合他社の動向や戦略に関する分析。",
    "opportunities": ["調査結果から導き出されるビジネスチャンスや機会。箇条書きで複数挙げる。"],
    "threats": ["市場に潜む脅威やリスク。箇条書きで複数挙げる。"]
}`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_market_research_start', { topic });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        const result = JSON.parse(jsonStr);

        const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = rawChunks.map((chunk: any) => chunk.web).filter(Boolean).map((webChunk: any) => ({ uri: webChunk.uri, title: webChunk.title }));
        const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
        
        const finalResult = { ...result, sources: uniqueSources };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_market_research_finish', { topic, response: finalResult });
        return finalResult;
    });
};

export const generateCustomProposalContent = async (lead: Lead, userId: string): Promise<CustomProposalContent> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `あなたは「文唱堂印刷株式会社」の優秀なセールスコンサルタントです。以下のリード情報を基に、Webリサーチを徹底的に行い、その企業のためだけの本格的な提案資料のコンテンツを、必ず指定されたJSON形式で生成してください。

## リード情報
- 企業名: ${lead.company}
- Webサイト: ${lead.landingPageUrl || '不明'}
- 問い合わせ内容: ${lead.message || '具体的な内容は記載されていません。'}

## 指示
1.  **ディープリサーチ**: Google検索を駆使して、上記企業の事業内容、最近のニュース、業界での立ち位置、IR情報などを調査し、深く理解してください。
2.  **コンテンツ生成**: リサーチ結果と問い合わせ内容を統合し、以下の各セクションの文章を生成してください。文章はプロフェッショナルかつ説得力のあるものにしてください。
3.  **JSON出力**: 必ず以下のJSONフォーマットに従って出力してください。
{
    "coverTitle": "提案書の表紙のタイトル。例:「株式会社〇〇様向け 物流効率化のご提案」",
    "businessUnderstanding": "Webリサーチに基づいた、提案先企業の事業内容の理解。客観的な事実を簡潔にまとめる。",
    "challenges": "リサーチ結果と問い合わせ内容から推測される、提案先企業が抱える課題やニーズの仮説。箇条書きで記述。",
    "proposal": "上記の課題を解決するための、自社（文唱堂印刷）の具体的なサービス提案。提供する価値やメリットを明確にする。",
    "conclusion": "提案の締めくくりと、次のアクションを促す力強い結びの言葉。"
}`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_custom_proposal_content_start', { leadId: lead.id, company: lead.company });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        try {
            const result = JSON.parse(jsonStr);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_custom_proposal_content_finish', { leadId: lead.id, response: result });
            return result;
        } catch (e) {
            console.error("Failed to parse JSON from Gemini for custom proposal:", e);
            console.error("Received text:", jsonStr);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_custom_proposal_content_error', { leadId: lead.id, error: e instanceof Error ? e.message : String(e), rawResponse: jsonStr });
            throw new Error("AIからの提案書コンテンツの生成に失敗しました。");
        }
    });
};

export const createLeadProposalPackage = async (lead: Lead, userId: string): Promise<LeadProposalPackage> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `あなたは「文唱堂印刷株式会社」の非常に優秀なセールスコンサルタントです。以下のリード情報を分析し、次のタスクを実行してください。

## リード情報
- 企業名: ${lead.company}
- Webサイト: ${lead.landingPageUrl || '不明'}
- 問い合わせ内容: ${lead.message || '具体的な内容は記載されていません。'}

## タスク
1.  **リードの分類**: この問い合わせが、当社のサービスに対する**本物の関心**にもとづくものか、あるいは単なる**営業メール（売り込み）**かを判断してください。
2.  **本物のリードの場合**:
    a. **ディープリサーチ**: Google検索を駆使して、上記企業の事業内容、最近のニュース、業界での立ち位置、IR情報などを調査し、深く理解してください。
    b. **提案コンテンツ生成**: リサーチ結果と問い合わせ内容を統合し、「株式会社〇〇様向け 物流効率化のご提案」のようなタイトルで提案書コンテンツ（カバータイトル、事業理解、課題、提案、結論）をJSON形式で生成してください。
    c. **概算見積もり生成**: 提案内容に基づき、初期費用と月額費用（保管料、発送手数料など）に分けた概算見積もり項目をJSON形式で生成してください。
3.  **営業メールの場合**: その理由を簡潔にまとめてください。

## 出力フォーマット（JSON）
この関数は最終的なJSONオブジェクトを返します。
{
    "isSalesLead": true, // 本物の営業リードであればtrue、営業メールであればfalse
    "reason": "営業メールと判断した理由（isSalesLeadがfalseの場合のみ）",
    "proposal": { // isSalesLeadがtrueの場合のみ
        "coverTitle": "提案書の表紙タイトル",
        "businessUnderstanding": "事業理解",
        "challenges": "課題",
        "proposal": "提案内容",
        "conclusion": "結論"
    },
    "estimate": [ // isSalesLeadがtrueの場合のみ
        {
            "division": "初期費用" | "月額費用",
            "content": "項目内容",
            "quantity": number,
            "unit": "式" | "月" | "件" | "部",
            "unitPrice": number,
            "price": number,
            "cost": number
        }
    ]
}
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_lead_proposal_package_start', { leadId: lead.id, company: lead.company });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        try {
            const result = JSON.parse(jsonStr);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_lead_proposal_package_finish', { leadId: lead.id, response: result });
            return result;
        } catch (e) {
            console.error("Failed to parse JSON from Gemini for lead proposal package:", e);
            console.error("Received text:", jsonStr);
            // FIX: Pass userId to logUserActivity
            await logUserActivity(userId, 'ai_lead_proposal_package_error', { leadId: lead.id, error: e instanceof Error ? e.message : String(e), rawResponse: jsonStr });
            throw new Error("AIからの提案パッケージの生成に失敗しました。");
        }
    });
};

export const getChatbotResponse = async (userMessage: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_chatbot_request', { message: userMessage });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userMessage,
            config: {},
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_chatbot_response', { response: result });
        return result;
    });
};

export const processUnstructuredData = async (text: string, userName: string, file: { base64: string; mimeType: string } | undefined, userId: string): Promise<GenerateContentResponse> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const parts = [];
        if (file) {
            parts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
        }
        parts.push({ text: `以下の情報（テキストまたは添付ファイル）を解析し、適切なビジネスアクション（リードの追加、顧客情報の更新、案件の追加など）をJSON形式の関数呼び出しとして提案してください。もし直接的な関数呼び出しができない場合は、自然な言葉で応答してください。
提供された情報: "${text}"

利用可能な関数:
- add_lead(company: string, name: string, email?: string, phone?: string, source?: string, message?: string): 新規リードを追加します。
- update_customer(customerName: string, updates: object): 既存の顧客情報を更新します。
- add_job(clientName: string, title: string, quantity: number, paperType: string, finishing: string, details: string, dueDate: string, price: number, variableCost: number): 新規印刷案件を追加します。

これらの関数以外は使用しないでください。
`});
        
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_data_entry_start', { text, fileName: file?.base64 ? 'file_attached' : undefined });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
            config: {
                tools: [{
                    functionDeclarations: [
                        { name: "add_lead", parameters: { type: Type.OBJECT, properties: { company: { type: Type.STRING }, name: { type: Type.STRING }, email: { type: Type.STRING }, phone: { type: Type.STRING }, source: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["company", "name"] } },
                        { name: "update_customer", parameters: { type: Type.OBJECT, properties: { customerName: { type: Type.STRING }, updates: { type: Type.OBJECT } }, required: ["customerName", "updates"] } },
                        { name: "add_job", parameters: { type: Type.OBJECT, properties: { clientName: { type: Type.STRING }, title: { type: Type.STRING }, quantity: { type: Type.NUMBER }, paperType: { type: Type.STRING }, finishing: { type: Type.STRING }, details: { type: Type.STRING }, dueDate: { type: Type.STRING }, price: { type: Type.NUMBER }, variableCost: { type: Type.NUMBER } }, required: ["clientName", "title", "quantity", "paperType", "finishing", "details", "dueDate", "price", "variableCost"] } },
                    ],
                }],
                thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
            },
        });
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_data_entry_finish', { response: response.text, functionCalls: response.functionCalls });
        return response;
    });
};

export const analyzeImage = async (base64: string, mimeType: string, prompt: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const imagePart = { inlineData: { data: base64, mimeType } };
        const textPart = { text: prompt };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_image_analysis_start', { prompt, mimeType, imageSize: base64.length });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                thinkingConfig: { thinkingBudget: 100 }, // For Flash model, a smaller budget is appropriate if no maxOutputTokens
            },
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_image_analysis_finish', { prompt, response: result });
        return result;
    });
};

export const editImageWithText = async (base64: string, mimeType: string, prompt: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const imagePart = { inlineData: { data: base64, mimeType } };
        const textPart = { text: prompt };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_image_edit_start', { prompt, mimeType, imageSize: base64.length });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const resultBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!resultBase64) {
            throw new Error('AIが画像を生成できませんでした。');
        }
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_image_edit_finish', { prompt, imageSize: resultBase64.length });
        return resultBase64;
    });
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4', userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_image_generation_start', { prompt, aspectRatio });

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        const resultBase64 = response.generatedImages[0].image.imageBytes;
        if (!resultBase64) {
            throw new Error('AIが画像を生成できませんでした。');
        }
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_image_generation_finish', { prompt, imageSize: resultBase64.length });
        return resultBase64;
    });
};

export const generateSpeech = async (text: string, userId: string): Promise<{ audioBlob: Blob, artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_tts_start', { text });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error('AIが音声を生成できませんでした。');
        }

        const audioBlob = base64ToBlob(base64Audio, 'audio/wav'); // Assume WAV for now

        const artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> = {
            kind: 'tts',
            title: `音声合成: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
            body_md: text,
            created_by: userId,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_tts_finish', { text, audioSize: base64Audio.length });
        return { audioBlob, artifactData };
    });
};

export const transcribeAudio = async (audioBlob: Blob, userId: string): Promise<{ text: string, artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const audioBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_audio_transcription_start', { audioSize: audioBlob.size, mimeType: audioBlob.type });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { data: audioBase64, mimeType: 'audio/webm' } },
                    { text: 'この音声を文字起こししてください。' },
                ],
            },
            config: {
                thinkingConfig: { thinkingBudget: 100 }, // For Flash model, a smaller budget is appropriate
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AIが音声を文字起こしできませんでした。');
        }

        const artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> = {
            kind: 'audio_transcription',
            title: `音声文字起こし (${new Date().toLocaleDateString()})`,
            body_md: text,
            created_by: userId,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_audio_transcription_finish', { transcriptionText: text.substring(0, 100) });
        return { text, artifactData };
    });
};

export const analyzeVideo = async (videoFile: File, prompt: string, userId: string): Promise<{ text: string, artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const videoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(videoFile);
        });

        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_video_analysis_start', { prompt, videoSize: videoFile.size, mimeType: videoFile.type });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [
                    { inlineData: { data: videoBase64, mimeType: videoFile.type } },
                    { text: prompt },
                ],
            },
            config: {
                thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AIが動画を分析できませんでした。');
        }

        const artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> = {
            kind: 'video_analysis',
            title: `動画分析: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
            body_md: text,
            created_by: userId,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_video_analysis_finish', { analysisResult: text.substring(0, 100) });
        return { text, artifactData };
    });
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', setLoadingMessage: (message: string) => void, userId: string): Promise<{ videoUrl: string, artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_video_generation_start', { prompt, aspectRatio });
        setLoadingMessage('動画生成リクエストを送信中...');

        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            },
        });

        setLoadingMessage('動画生成中... (数分かかります)');
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            setLoadingMessage(`動画生成中... (進捗: ${operation.metadata?.state || 'Unknown'})`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('AIが動画を生成できませんでした。');
        }

        // Fetch the video blob using the download link and the API key
        const response = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        
        const videoUrl = URL.createObjectURL(videoBlob);

        const artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> = {
            kind: 'video_generation',
            title: `動画生成: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
            body_md: prompt,
            created_by: userId,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_video_generation_finish', { prompt, videoUrl });
        return { videoUrl, artifactData };
    });
};

export const transcribeVideoWithTimestamps = async (videoFile: File, prompt: string, userId: string): Promise<Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>>> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const videoBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(videoFile);
        });

        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_video_transcription_start', { prompt, videoSize: videoFile.size, mimeType: videoFile.type });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [
                    { inlineData: { data: videoBase64, mimeType: videoFile.type } },
                    { text: `${prompt} タイムスタンプ付きで出力してください。` },
                ],
            },
            config: {
                thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AIが動画を文字起こしできませんでした。');
        }

        const artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> = {
            kind: 'video_transcription',
            title: `動画文字起こし: ${videoFile.name.substring(0, 50)}${videoFile.name.length > 50 ? '...' : ''}`,
            body_md: text,
            created_by: userId,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_video_transcription_finish', { transcriptionText: text.substring(0, 100) });
        return artifactData;
    });
};

export const generateManuscript = async (characterCount: number, referenceText: string, referenceFile: { base64: string; mimeType: string } | null, specFile: { base64: string; mimeType: string } | null, userId: string): Promise<Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>>> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const parts = [];
        let promptText = `以下の指示と参照情報に基づいて、約${characterCount}文字の原稿を作成してください。`;

        if (referenceText) {
            promptText += `\n\n参照テキスト:\n${referenceText}`;
        }
        if (referenceFile) {
            parts.push({ inlineData: { data: referenceFile.base64, mimeType: referenceFile.mimeType } });
            promptText += `\n\n添付の参照ファイルの内容も考慮してください。`;
        }
        if (specFile) {
            parts.push({ inlineData: { data: specFile.base64, mimeType: specFile.mimeType } });
            promptText += `\n\n添付の仕様書/指示書の内容を厳守してください。`;
        }
        parts.push({ text: promptText });

        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_copywriting_start', { characterCount, hasRefText: !!referenceText, hasRefFile: !!referenceFile, hasSpecFile: !!specFile });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts },
            config: {
                maxOutputTokens: Math.round(characterCount * 2), // Approximate token count
                thinkingConfig: { thinkingBudget: Math.max(100, Math.round(characterCount / 5)) },
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('AIが原稿を生成できませんでした。');
        }

        const artifactData: Partial<Omit<AIArtifact, 'id' | 'createdAt' | 'updatedAt'>> = {
            kind: 'copywriting',
            title: `AI生成原稿 (${characterCount}文字)`,
            body_md: text,
            created_by: userId,
        };
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_copywriting_finish', { generatedLength: text.length });
        return artifactData;
    });
};

export const analyzeDocumentContent = async (prompt: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_document_analysis_start', { prompt });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }, // Added thinking config
            },
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_document_analysis_finish', { result: result.substring(0, 100) });
        return result;
    });
};

export const runBankSimulation = async (documents: Document[], scenario: BankScenario, userId: string): Promise<{ analysis_summary: string, simulation_result: any, source_artifacts: { file_id: string; file_name: string }[] }> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下の資料とシナリオに基づいて、銀行融資シミュレーションを実行し、その分析サマリーと結果をJSON形式で提供してください。
資料: ${JSON.stringify(documents.map(d => ({ name: d.file_name, extracted_text: d.extracted_text })))}
シナario: ${JSON.stringify(scenario)}
JSONフォーマット: { "analysis_summary": "概要", "simulation_result": { ... }, "source_artifacts": [ { "file_id": "doc-id", "file_name": "name" } ] }
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_bank_simulation_start', { scenarioId: scenario.id, docCount: documents.length });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.substring(7, jsonStr.length - 3).trim();
        }
        const result = JSON.parse(jsonStr);
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_bank_simulation_finish', { scenarioId: scenario.id, result: result.analysis_summary });
        return result;
    });
};

export const generateBankLoanProposalText = async (documentSummary: string, scenarioName: string, simulationResult: string, userId: string): Promise<string> => {
    checkOnlineAndAIOff();
    return withRetry(async () => {
        const prompt = `以下の情報に基づいて、銀行への融資提案書（事業計画書）の本文を作成してください。

資料の要約: ${documentSummary}
シミュレーションシナリオ: ${scenarioName}
シミュレーション結果: ${simulationResult}

プロフェッショナルで、銀行が関心を持つポイント（返済能力、成長戦略など）を強調し、具体的かつ説得力のある内容にしてください。
`;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_bank_proposal_text_start', { scenarioName, simulationResult: simulationResult.substring(0, 100) });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });
        const result = response.text;
        // FIX: Pass userId to logUserActivity
        await logUserActivity(userId, 'ai_bank_proposal_text_finish', { result: result.substring(0, 100) });
        return result;
    });
};