import { useState } from "react";
import { 
  Zap, 
  Send, 
  FileText, 
  Upload, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Table as TableIcon,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import * as Sonner from "sonner";
import { cn } from "@/lib/utils";

function isValidApiKey(key: string | undefined): boolean {
  return !!key && key.startsWith('sk-') && !key.includes('your-') && !key.includes('enter-');
}

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Hello! I am your AuditFlow AI assistant. I'm trained on Ethiopian accounting standards and IFRS. How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
  const hasDeepSeek = isValidApiKey(deepseekKey);
  const hasOpenAI = isValidApiKey(openaiKey);
  const aiProvider = hasDeepSeek ? 'DeepSeek' : hasOpenAI ? 'GPT-4o-mini' : 'local';

  function generateMockResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('risk')) {
      return "Based on my analysis of common risks in Ethiopian firms, here are the key areas to address:\n\n**1. Foreign Currency Risk** - Ethiopian firms face significant exposure to currency fluctuations. For import-heavy businesses, verify that foreign exchange gains/losses are properly calculated per IAS 21. Recommend substantive testing on FX transactions.\n\n**2. VAT Compliance Risk** - Withholding VAT on supplier payments and timely filing are recurring issues. Check that input VAT on imports includes proper customs documentation per Ethiopian proclamation.\n\n**3. Cash Control Weaknesses** - Ethiopia's cash-heavy economy requires robust internal controls. Recommend surprise cash counts, segregation of duties, and daily POS-to-bank reconciliations.\n\n**4. Inventory Valuation** - Per IAS 2, ensure lower of cost and NRV is applied, especially for seasonal/perishable goods. Verify GRN-to-invoice matching.";
    }
    if (q.includes('inventory') || q.includes('stock')) {
      return "**Inventory Audit Procedures (IAS 2):**\n\n**1. Existence:** Attend year-end physical count. For Ethiopian firms, pay special attention to goods in transit at ports (DJIBOUTI corridor) and bonded warehouses.\n\n**2. Valuation:** Verify cost formulas (FIFO/weighted average) are consistently applied. Test NRV for slow-moving items - consider seasonal demand patterns unique to Ethiopian markets.\n\n**3. Rights & Obligations:** Confirm ownership through purchase invoices, GRN records, and supplier statements. Watch for goods held on consignment.\n\n**4. Cut-off:** Test receiving and shipping records around year-end. Common error: goods received after year-end but recorded as purchases.\n\n**Documentation needed:** Stock count sheets, GRN registers, supplier invoices, and cost/build-up schedules.";
    }
    if (q.includes('vat') || q.includes('tax')) {
      return "**Ethiopian VAT Compliance Guidelines:**\n\n**VAT Rate:** 15% standard rate per Ethiopian VAT Proclamation.\n\n**Key Testing Areas:**\n- Verify withholding VAT (2% for transporters, 50% for suppliers not filing regularly)\n- Check input VAT claims have valid ETR receipts or tax invoices\n- Confirm VAT returns are filed monthly by the 15th\n- Test VAT on imports includes proper customs duty assessment\n\n**Common Compliance Gaps:**\n- Late filing penalties (5% per month)\n- Incorrect application of exempt supplies (e.g., financial services, raw food)\n- Failure to adjust output VAT on credit notes\n\n**For audit evidence:** Request VAT returns, receipts, ETR machine Z-readings, and customs clearance documents.";
    }
    if (q.includes('cash') || q.includes('petty')) {
      return "**Cash Audit Program for Ethiopian Firms:**\n\n**Risk:** Cash-heavy transactions are high-risk in Ethiopia due to low banking penetration in some sectors.\n\n**Key Procedures:**\n1. **Surprise Cash Count** - Count all cash on hand simultaneously at different locations\n2. **Bank Reconciliation** - Compare cash book to bank statements; obtain bank certificates directly\n3. **Petty Cash** - Test imprest system compliance; verify vouchers have proper authorization and receipts\n4. **Cash Sales** - Reconcile ETR/Z-report readings to bank deposits for retail businesses\n5. **Segregation of Duties** - Ensure cash handling, recording, and reconciliation are done by different staff\n\n**Red Flags:** Frequent cash advances to employees, manual receipts without ETR, negative cash balances on the general ledger.";
    }
    if (q.includes('ifrs') || q.includes('ias')) {
      return "**IFRS Implementation in Ethiopia - Key Considerations:**\n\n**IFRS 9 - Financial Instruments:**\n- Apply expected credit loss (ECL) model for trade receivables\n- Ethiopian firms with significant receivables from government contracts need careful ECL assessment\n\n**IFRS 16 - Leases:**\n- Most land in Ethiopia is held through long-term lease agreements from the government\n- These may qualify as operating leases under IFRS 16 if they don't convey substantially all risks/rewards\n\n**IAS 36 - Impairment:**\n- Test assets for impairment indicators (inflation, currency devaluation, political instability)\n\n**IAS 21 - FX:**\n- Ethiopia's managed float currency regime creates unique FX gain/loss recognition issues\n- Monetary items denominated in foreign currency must be retranslated at each reporting date\n\n**IAS 2 - Inventory:**\n- NRV calculation must consider import restrictions, supply chain delays, and seasonal demand";
    }
    if (q.includes('finding') || q.includes('draft') || q.includes('report')) {
      return "**Audit Finding Draft Template:**\n\n**Title:** [Area] - [Specific Issue]\n\n**Condition (What is wrong?):**\nDuring our audit of [area] for the year ended [date], we noted that [describe the actual condition found]. Our testing of [sample size] items revealed [error rate] exceptions.\n\n**Criteria (What should be?):**\nPer [IFRS/IAS/Company Policy/Proclamation]: [cite the specific standard or requirement].\n\n**Cause (Why did it happen?):**\nThis was due to [root cause - e.g., inadequate training, lack of supervision, weak system controls].\n\n**Effect (So what?):**\nThis resulted in [quantify the impact in ETB if possible]. This could lead to [material misstatement/regulatory penalty/tax exposure].\n\n**Recommendation:**\nWe recommend management [specific action]. Consider implementing [control improvement] by [date].\n\n**Management Response:**\n[To be filled after discussion]";
    }
    if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q === 'hey') {
      return "Hello! I am your AuditFlow AI assistant, powered by Ethiopian auditing standards expertise and IFRS knowledge.\n\nI can help you with:\n- **Risk Assessment** - Identify and evaluate risks for Ethiopian firms\n- **Audit Procedures** - Step-by-step guidance for substantive testing\n- **IFRS Standards** - Practical application in the Ethiopian context\n- **Tax Compliance** - VAT, withholding tax, and corporate income tax\n- **Finding Drafting** - Create professional audit findings\n- **Internal Controls** - Evaluate and strengthen controls\n\nWhat area are you working on today?";
    }
    return "Thank you for your question. Based on my knowledge of Ethiopian accounting standards and IFRS, here are my thoughts:\n\n" +
      "To provide the most accurate guidance, please specify:\n" +
      "1. The specific accounting/auditing standard you're dealing with (IFRS 9, IAS 16, etc.)\n" +
      "2. The type of engagement (audit, review, compilation, tax)\n" +
      "3. The industry/sector (banking, manufacturing, trade, services)\n" +
      "4. Whether this relates to an Ethiopian entity specifically\n\n" +
      "Alternatively, ask me about: risks, inventory, VAT, cash controls, IFRS standards, or finding drafting.";
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery("");
    setIsTyping(true);

    try {
      if (!hasDeepSeek && !hasOpenAI) {
        const mockResponse = generateMockResponse(userMessage);
        setChatHistory(prev => [...prev, { role: 'ai', content: mockResponse }]);
        setIsTyping(false);
        return;
      }

      const systemPrompt = `You are a senior audit expert specializing in Ethiopian accounting standards, IFRS, and international auditing standards. You provide detailed, practical, and actionable advice for auditors and accountants working in Ethiopia.

Your capabilities:
- Deep knowledge of IFRS (IFRS 9, 15, 16, IAS 36, etc.) and Ethiopian-specific adaptations
- Ethiopian tax compliance (VAT, withholding tax, corporate income tax, rental income tax)
- Risk assessment and internal control evaluation for Ethiopian businesses
- Audit planning, substantive testing, and sampling methodologies
- Drafting audit findings, management letters, and audit reports
- Ethiopian regulatory requirements (AABE, Ministry of Revenue, etc.)
- Financial statement analysis and ratio interpretation

When responding:
1. Be specific and reference exact standards (e.g., "per IAS 37.14")
2. Give practical examples relevant to the Ethiopian business context
3. Provide step-by-step guidance when asked about procedures
4. Include specific documentation requirements
5. Distinguish between IFRS requirements and local Ethiopian GAAP/regulations
6. Suggest proper audit evidence to gather
7. Quantify materiality thresholds in Ethiopian Birr (ETB) when relevant

Keep responses thorough but focused. Always prioritize professional skepticism and audit quality.`;

      const provider = hasDeepSeek ? 'deepseek' : 'openai';
      const endpoint = provider === 'deepseek'
        ? 'https://api.deepseek.com/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';
      const apiKey = provider === 'deepseek' ? deepseekKey : openaiKey;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 2000,
          temperature: 0.8,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const apiError = data?.error?.message || response.statusText;
        throw new Error(`API_ERROR:${provider}:${apiError}`);
      }

      const aiResponse = data.choices[0].message.content;
      
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      let errorMessage = "I'm currently unable to process your request. Please try again later.";
      
      if (error instanceof Error) {
        if (error.message.startsWith('API_ERROR:')) {
          const parts = error.message.split(':');
          const provider = parts[1];
          const apiMsg = parts.slice(2).join(':');
          
          if (apiMsg.toLowerCase().includes('api key') || apiMsg.toLowerCase().includes('incorrect') || apiMsg.toLowerCase().includes('invalid')) {
            errorMessage = provider === 'deepseek'
              ? "Invalid DeepSeek API key. Get one at https://platform.deepseek.com and add it to your .env file as VITE_DEEPSEEK_API_KEY."
              : "Invalid OpenAI API key. Get one at https://platform.openai.com and add it to your .env file as VITE_OPENAI_API_KEY.";
          } else if (apiMsg.toLowerCase().includes('insufficient_quota') || apiMsg.toLowerCase().includes('rate limit') || apiMsg.toLowerCase().includes('exceeded')) {
            errorMessage = `${provider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} API quota exceeded. Check your billing at ${provider === 'deepseek' ? 'https://platform.deepseek.com' : 'https://platform.openai.com/account/billing'}.`;
          } else if (apiMsg.toLowerCase().includes('context length') || apiMsg.toLowerCase().includes('token')) {
            errorMessage = "Your question is too long. Please try a shorter, more specific question.";
          } else {
            errorMessage = `${provider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} API error: ${apiMsg}`;
          }
        } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          errorMessage = "Unable to connect to the AI service. Check your internet connection.";
        }
      }
      
      setChatHistory(prev => [...prev, { role: 'ai', content: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    
    // Mock analysis
    setTimeout(() => {
      setAnalysisResult({
        score: 72,
        anomalies: [
          { type: 'High Risk', description: 'Unusual spike in "Other Expenses" in Q4 (340% above average)' },
          { type: 'Compliance', description: 'Missing required disclosure for related party transactions' },
          { type: 'Ratio', description: 'Quick ratio (0.4) is significantly below industry benchmark (1.2)' }
        ]
      });
      setUploading(false);
      Sonner.toast.success("Financial analysis complete");
    }, 3000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Audit Intelligence</h1>
        <p className="text-muted-foreground">Advanced natural language assistance and financial anomaly detection.</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">
          {aiProvider === 'DeepSeek' ? 'Powered by DeepSeek' : aiProvider === 'GPT-4o-mini' ? 'Powered by GPT-4o-mini' : 'Local mode - no API key configured'}
        </span>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="chat" className="gap-2"><Zap className="h-4 w-4" /> Audit Chat</TabsTrigger>
          <TabsTrigger value="analyze" className="gap-2"><TableIcon className="h-4 w-4" /> Financial Analyzer</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6 flex flex-col h-[600px] border rounded-2xl bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm transition-all duration-200",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-none hover:shadow-md" 
                    : "bg-muted rounded-bl-none hover:shadow-md"
                )}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-medium">AI is thinking...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t bg-muted/20">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                placeholder="Ask about standards, risk assessment, or findings drafting..." 
                className="bg-background h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={isTyping}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 transition-all duration-200 hover:scale-105 hover:shadow-md" 
                disabled={isTyping}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <div className="flex gap-2 mt-3">
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30" 
                 onClick={() => {setQuery("Common risks for Ethiopian retail firms"); handleSendMessage();}}
               >
                 Risks for Retail
               </Button>
                <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30" 
                 onClick={() => {setQuery("Draft a finding for weak internal control over cash"); handleSendMessage();}}
               >
                 Draft Cash Finding
               </Button>
                <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30" 
                 onClick={() => {setQuery("Explain IFRS 16 impacts in Ethiopia"); handleSendMessage();}}
               >
                 IFRS 16 Impacts
               </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analyze" className="mt-6 space-y-6">
            {!analysisResult ? (
              <Card className="border-dashed border-2 bg-muted/10 py-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/20">
                 <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 transition-transform duration-200 hover:scale-110">
                    <Upload className="h-8 w-8 text-primary" />
                 </div>
                 <h3 className="text-xl font-bold">Upload Trial Balance or Financial Statements</h3>
                 <p className="text-muted-foreground max-w-md mx-auto mt-2 mb-8">
                   Upload an Excel or CSV file. Our AI will automatically detect anomalies, check ratios, and flag missing disclosures based on Ethiopian standards.
                 </p>
                 <div className="relative">
                   <input 
                     type="file" 
                     id="fin-upload" 
                     className="absolute inset-0 opacity-0 cursor-pointer" 
                     onChange={handleFileUpload}
                     accept=".csv,.xlsx,.xls"
                     disabled={uploading}
                   />
                   <Button 
                     size="lg" 
                     disabled={uploading}
                     className="transition-all duration-200 hover:shadow-lg hover:scale-105"
                   >
                     {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                     {uploading ? "Analyzing Financials..." : "Select File for AI Analysis"}
                   </Button>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest">Supports .XLSX, .CSV (Max 20MB)</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                 <Card className="md:col-span-1 transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                   <CardHeader>
                     <CardTitle>Health Score</CardTitle>
                     <CardDescription>Overall financial consistency</CardDescription>
                   </CardHeader>
                   <CardContent className="flex flex-col items-center justify-center pt-4">
                     <div className="relative h-32 w-32 mb-4">
                        <svg className="h-full w-full" viewBox="0 0 36 36">
                           <path className="text-muted stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                           <path className="text-primary stroke-current" strokeWidth="3" strokeDasharray={`${analysisResult.score}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-3xl">
                           {analysisResult.score}
                        </div>
                     </div>
                     <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Moderate Confidence</Badge>
                   </CardContent>
                 </Card>
                 
                 <Card className="md:col-span-2 transition-all duration-200 hover:shadow-lg">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <AlertTriangle className="h-5 w-5 text-amber-500" /> AI-Detected Anomalies
                     </CardTitle>
                     <CardDescription>Flags requiring auditor investigation</CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      {analysisResult.anomalies.map((anom: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-3 border rounded-lg bg-card hover:bg-muted/30 hover:shadow-md transition-all duration-200 cursor-pointer">
                           <div className={cn(
                             "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110",
                             anom.type === 'High Risk' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                           )}>
                              <TrendingUp className="h-5 w-5" />
                           </div>
                           <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{anom.type}</p>
                              <p className="text-sm font-medium">{anom.description}</p>
                           </div>
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        className="w-full text-xs transition-all duration-200 hover:bg-muted/50" 
                        onClick={() => setAnalysisResult(null)}
                      >
                        Run New Analysis
                      </Button>
                   </CardContent>
                 </Card>
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
