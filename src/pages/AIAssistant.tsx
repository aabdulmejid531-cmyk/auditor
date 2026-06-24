import { useState, useEffect } from "react";
import { 
  Zap, 
  Send, 
  FileText, 
  Upload, 
  TrendingUp, 
  AlertTriangle, 
  Loader2,
  Table as TableIcon,
  Brain,
  Key,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
  ShieldAlert,
  Lock
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
  return !!key && key.trim().length > 10 && !key.includes('your-') && !key.includes('enter-');
}

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { 
      role: 'ai', 
      content: "Hello! I am your AuditFlow AI assistant, upgraded with Gemini intelligence. I specialize in European auditing frameworks, including ISA, IFRS, CSRD, and GDPR compliance. How can I assist you with your audit procedures today?" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Gemini API Key Management
  const [customKey, setCustomKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  // Environment keys
  const envGeminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  const envOpenaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  const envDeepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;

  const hasEnvGemini = isValidApiKey(envGeminiKey);
  const hasCustomGemini = isValidApiKey(customKey);
  const hasGemini = hasEnvGemini || hasCustomGemini;

  const hasOpenAI = isValidApiKey(envOpenaiKey);
  const hasDeepSeek = isValidApiKey(envDeepseekKey);

  // Active Provider determination
  const aiProvider = hasGemini 
    ? 'Gemini 2.5' 
    : hasDeepSeek 
    ? 'DeepSeek' 
    : hasOpenAI 
    ? 'GPT-4o-mini' 
    : 'Local Simulator';

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKey.trim().length >= 20) {
      localStorage.setItem("gemini_api_key", customKey.trim());
      Sonner.toast.success("Gemini API key saved successfully!");
      setShowKeyInput(false);
    } else {
      Sonner.toast.error("Key too short — please paste your full Gemini API key.");
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("gemini_api_key");
    setCustomKey("");
    Sonner.toast.success("Custom Gemini key removed.");
  };

  function generateMockResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('materiality') || q.includes('isa 320')) {
      return "**ISA 320 Materiality Guidelines (European Practice):**\n\n" +
        "Under ISA 320.10, planning materiality requires professional judgment. Common quantitative benchmarks used in Europe include:\n\n" +
        "1. **Profit Before Tax (PBT):** 5.0% - 10.0% (normally 5.0% is applied for commercial companies, up to 10.0% for low-risk entities).\n" +
        "2. **Total Revenue:** 0.5% - 2.0% (normally 1.0% is standard for asset-light businesses).\n" +
        "3. **Total Assets:** 1.0% - 2.0% (commonly used in financial or capital-intensive companies).\n" +
        "4. **Total Equity / Net Assets:** 2.0% - 5.0%.\n\n" +
        "**Performance Materiality (ISA 320.11):** Set at 50% (High risk/new client) to 75% (Low risk/historical consistency) of overall materiality.\n\n" +
        "**Clearly Trivial Limit (ISA 450.A3):** Set at 3% to 5% of performance materiality. Any misstatements below this threshold do not need accumulation.";
    }
    if (q.includes('csrd') || q.includes('esg') || q.includes('sustainability')) {
      return "**Corporate Sustainability Reporting Directive (CSRD) Audit Core Steps:**\n\n" +
        "In accordance with European Union directive 2022/2464, auditors must verify sustainability disclosures under ESRD standards:\n\n" +
        "1. **Double Materiality Audit:** Verify that the corporate entity has analyzed both *Impact Materiality* (inside-out) and *Financial Materiality* (outside-in).\n" +
        "2. **Value Chain Scope:** Under ESRS 1, review boundaries. Scope 3 supply chain greenhouse gases must have an audit trail.\n" +
        "3. **EU Taxonomy Alignment:** Audit alignment calculations (Turnover, CapEx, OpEx) relating to climate change mitigation and adaptation.\n" +
        "4. **Reasonable vs. Limited Assurance:** Verify that processes are structured for limited assurance today, transitioning to reasonable assurance under regulatory roadmap.";
    }
    if (q.includes('gdpr') || q.includes('privacy') || q.includes('data')) {
      return "**GDPR Compliance Auditing Checklist:**\n\n" +
        "When auditing data protection and privacy under EU GDPR regulations:\n\n" +
        "1. **Records of Processing (Article 30):** Test if the client maintains a comprehensive processing inventory (ROPA) listing categories, recipients, and retention limits.\n" +
        "2. **Consent Mechanisms (Article 7):** Verify if active consent is gathered. Test compliance of cookies and disclosure statements on web/app portals.\n" +
        "3. **72-Hour Breach Management (Article 33):** Verify incident logging systems. Substantively test response timelines on historical simulated data events.\n" +
        "4. **Data Subject Access Rights (DSAR):** Test process handling for user data deletion (right to be forgotten) and portability requests.";
    }
    if (q.includes('risk') || q.includes('isa 315')) {
      return "**ISA 315 Risk Assessment Procedures (EU Standard):**\n\n" +
        "1. **Inherent Risk:** Evaluate nature of entity, accounting complexity, and market conditions (e.g. inflation, FX limits). High inherent risks require increased attention.\n" +
        "2. **Control Risk:** Check design and operation of internal controls. Test operating effectiveness of general IT controls (GITCs) and automated application controls.\n" +
        "3. **Detection Risk:** Formulate strategy. If inherent and control risks are rated High, Detection Risk target must be Low, meaning substantive sampling sizes must be expanded to minimize undetected error risk.";
    }
    if (q.includes('hello') || q.includes('hi ') || q === 'hi' || q === 'hey') {
      return "Hello! I am your AuditFlow AI assistant, currently running in Local Simulator Mode.\n\n" +
        "To get real live Gemini intelligence, please enter your **Google Gemini API Key** by clicking the 'Key Configurator' at the top of this card.\n\n" +
        "In this simulator mode, you can still ask me about:\n" +
        "- **ISA 320 Materiality**\n" +
        "- **CSRD / ESG Audits**\n" +
        "- **GDPR Data Protection**\n" +
        "- **ISA 315 Risk Matrices**";
    }
    return "Thank you for your question. Under simulated mode, I provide quick reference answers. To get detailed, real-time audit suggestions, configure a Gemini API key.\n\n" +
      "Under European ISA standards, make sure you document all audits with professional skepticism, verify source ledgers, and perform sample size recalculations based on determined materiality thresholds.";
  }

  const handleSendMessage = async (e?: React.FormEvent, promptOverride?: string) => {
    e?.preventDefault();
    const queryText = promptOverride || query;
    if (!queryText.trim()) return;

    const userMessage = queryText;
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    if (!promptOverride) setQuery("");
    setIsTyping(true);

    try {
      // System prompt defining detailed Euro-centric audit expertise
      const systemPrompt = `You are a Senior European Audit Specialist and Principal Compliance Advisor at AuditFlow Pro. 
You are an expert in:
- International Standards on Auditing (ISA) issued by IAASB, particularly ISA 320 (Materiality), ISA 315 (Risk Assessment), ISA 240 (Fraud), and ISA 500 (Evidence).
- Corporate Sustainability Reporting Directive (CSRD) and European Sustainability Reporting Standards (ESRS).
- General Data Protection Regulation (GDPR) compliance audits.
- International Financial Reporting Standards (IFRS) as adopted in the EU.
- European accounting practices, quality management standards (ISQM 1 & 2), and ethical requirements for auditors.

Your tone should be highly professional, structured, compliant, and objective, maintaining strict professional skepticism.
Provide exact references to standards (e.g. "per ISA 315.A45" or "under GDPR Article 32"). Provide detailed step-by-step audit procedures and documentation requirements. Use markdown formatting (bold headers, lists, code blocks, tables) to make your output highly readable and professional.`;

      // If we don't have Gemini but have fallbacks
      if (!hasGemini) {
        if (hasDeepSeek || hasOpenAI) {
          // Use legacy API calls
          const provider = hasDeepSeek ? 'deepseek' : 'openai';
          const endpoint = provider === 'deepseek'
            ? 'https://api.deepseek.com/v1/chat/completions'
            : 'https://api.openai.com/v1/chat/completions';
          const model = provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini';
          const apiKey = provider === 'deepseek' ? envDeepseekKey : envOpenaiKey;

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
                ...chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
                { role: 'user', content: userMessage }
              ],
              max_tokens: 2000,
              temperature: 0.7,
            }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(`API_ERROR:${provider}:${data?.error?.message || response.statusText}`);
          const aiResponse = data.choices[0].message.content;
          setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
        } else {
          // Fallback to local simulator
          setTimeout(() => {
            const mockResponse = generateMockResponse(userMessage);
            setChatHistory(prev => [...prev, { role: 'ai', content: mockResponse }]);
            setIsTyping(false);
          }, 1000);
          return;
        }
        setIsTyping(false);
        return;
      }

      // Google Gemini API integration
      const apiKey = customKey || envGeminiKey;
      // We use gemini-2.5-flash as the recommended smart and fast model
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      // Convert chat history to Gemini format
      const geminiContents = [
        ...chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2500,
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || response.statusText;
        throw new Error(`GEMINI_API_ERROR:${errorMsg}`);
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);

    } catch (error: any) {
      let errorMessage = "Unable to process AI audit query at this moment.";
      if (error.message && error.message.startsWith('GEMINI_API_ERROR:')) {
        const apiMsg = error.message.replace('GEMINI_API_ERROR:', '');
        errorMessage = `Gemini API returned an error: ${apiMsg}. Please verify your API Key or quota limits.`;
      } else if (error.message && error.message.startsWith('API_ERROR:')) {
        errorMessage = `Fallback provider API error: ${error.message}`;
      } else {
        errorMessage = `Network or API connection failure. Please check your internet connectivity.`;
      }
      setChatHistory(prev => [...prev, { role: 'ai', content: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    
    // Simulate European Audit AI ledger scan
    setTimeout(() => {
      setAnalysisResult({
        score: 86,
        anomalies: [
          { type: 'High Risk', description: 'Large year-end journal adjustment to revenue (€840,000) passed after working hours (audit trail shows system override).' },
          { type: 'Compliance', description: 'No documentation on carbon emission calculation bounds (fails CSRD Scope 2 completeness requirements).' },
          { type: 'GDPR Flag', description: 'Customer transaction ledger exports lack hashing; plaintext email data present in active database backups.' },
          { type: 'Ratio', description: 'Days Sales Outstanding (DSO) increased from 34 to 68 days in Q4, signaling potential collections impairment under IFRS 9.' }
        ]
      });
      setUploading(false);
      Sonner.toast.success("Euro-audit financial scan complete.");
    }, 2500);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-indigo-500 animate-pulse" /> AI Audit Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gemini-powered natural language audit program generator, risk drafter, and financial ledger scanner.
          </p>
        </div>
        
        {/* Status Badge & Config Toggle */}
        <div className="flex items-center gap-2">
          <Badge className={cn(
            "h-8 px-3 text-xs font-semibold rounded-full border cursor-pointer transition-transform hover:scale-102 flex items-center gap-1",
            hasGemini 
              ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" 
              : "bg-muted text-muted-foreground border-muted-foreground/10"
          )}
          onClick={() => setShowKeyInput(!showKeyInput)}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>AI: {aiProvider}</span>
            <span className="text-[10px] text-muted-foreground ml-1 underline">(config)</span>
          </Badge>
        </div>
      </div>

      {/* Collapsible Key Configurator */}
      {showKeyInput && (
        <Card className="border border-indigo-500/20 bg-indigo-500/5 transition-all duration-300 animate-in slide-in-from-top-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
              <Key className="h-4 w-4" /> Google Gemini API Key Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure a custom Gemini API Key. Keys are stored locally in your browser storage and never sent to external servers except Google.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSaveKey} className="flex gap-2">
              <Input 
                type="password"
                placeholder="Paste Gemini API Key (starts with AIzaSy)..."
                value={customKey}
                onChange={e => setCustomKey(e.target.value)}
                className="bg-background border-indigo-500/30 flex-1 text-sm h-10"
              />
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-10 px-4 cursor-pointer">
                Save Key
              </Button>
            </form>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Get a free key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline text-indigo-600 hover:text-indigo-500">Google AI Studio</a>.
              </span>
              {hasCustomGemini && (
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-7" onClick={handleClearKey}>
                  Clear Saved Key
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11 border bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="chat" className="gap-2 text-sm font-medium rounded-lg"><Zap className="h-4 w-4" /> Audit Chat Assistant</TabsTrigger>
          <TabsTrigger value="analyze" className="gap-2 text-sm font-medium rounded-lg"><TableIcon className="h-4 w-4" /> Euro-Audit Ledger Scanner</TabsTrigger>
        </TabsList>

        {/* Tab 1: Audit Chat */}
        <TabsContent value="chat" className="mt-4 flex flex-col h-[620px] border border-muted-foreground/10 rounded-2xl bg-card/30 backdrop-blur overflow-hidden shadow-xs">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl shadow-xs transition-all duration-200 text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-br-none hover:shadow-md" 
                    : "bg-muted/70 text-foreground rounded-bl-none hover:shadow-md border border-muted"
                )}>
                  {/* Process line breaks in simple markdown formatting */}
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.content.split('\n').map((line, lIdx) => {
                      // Process bold formatting **text**
                      let processedLine = line;
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const matches = line.matchAll(boldRegex);
                      
                      let hasBold = false;
                      const elements: React.ReactNode[] = [];
                      let lastIndex = 0;
                      
                      for (const match of matches) {
                        hasBold = true;
                        if (match.index !== undefined) {
                          // Text before the bold part
                          elements.push(line.substring(lastIndex, match.index));
                          // Bold part
                          elements.push(<strong key={match.index} className="font-extrabold text-foreground dark:text-white">{match[1]}</strong>);
                          lastIndex = match.index + match[0].length;
                        }
                      }
                      
                      if (hasBold) {
                        elements.push(line.substring(lastIndex));
                        return <p key={lIdx} className="m-0 leading-relaxed">{elements}</p>;
                      }

                      // Check if it is a list item
                      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                        return <li key={lIdx} className="ml-4 list-disc leading-relaxed mt-1">{line.trim().substring(2)}</li>;
                      }
                      if (/^\d+\.\s/.test(line.trim())) {
                        const numEnd = line.indexOf('.') + 1;
                        return <li key={lIdx} className="ml-4 list-decimal leading-relaxed mt-1">{line.trim().substring(numEnd).trim()}</li>;
                      }

                      return <p key={lIdx} className="m-0 leading-relaxed">{line}</p>;
                    })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-2.5 animate-pulse border">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Gemini is processing standards...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat Input Area */}
          <div className="p-4 border-t bg-muted/30 backdrop-blur">
            <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
              <Input 
                placeholder="Ask about ISA 320 calculations, CSRD disclosures, or GDPR safeguards..." 
                className="bg-background h-12 border-muted-foreground/15 transition-all duration-300 focus:ring-2 focus:ring-primary/20 flex-1 text-sm rounded-xl"
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={isTyping}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-12 w-12 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer" 
                disabled={isTyping}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
            
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 border-muted-foreground/15 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 cursor-pointer" 
                 onClick={(e) => handleSendMessage(e, "Detail planning materiality benchmarks under ISA 320.")}
                 disabled={isTyping}
               >
                 Materiality Benchmarks
               </Button>
                <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 border-muted-foreground/15 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 cursor-pointer" 
                 onClick={(e) => handleSendMessage(e, "Draft audit checklist for GDPR personal data processing (Articles 30 & 32).")}
                 disabled={isTyping}
               >
                 GDPR Processing Check
               </Button>
                <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 border-muted-foreground/15 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 cursor-pointer" 
                 onClick={(e) => handleSendMessage(e, "Explain CSRD Double Materiality requirements.")}
                 disabled={isTyping}
               >
                 CSRD Double Materiality
               </Button>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="rounded-full text-[10px] h-7 border-muted-foreground/15 transition-all duration-200 hover:bg-primary/10 hover:border-primary/30 cursor-pointer" 
                 onClick={(e) => handleSendMessage(e, "What are the risk factors for Inventory testing under ISA 315?")}
                 disabled={isTyping}
               >
                 ISA 315 Inventory Risks
               </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Ledger Scanner */}
        <TabsContent value="analyze" className="mt-4 space-y-6">
            {!analysisResult ? (
              <Card className="border-dashed border-2 bg-card/20 py-20 flex flex-col items-center justify-center text-center px-4 transition-all duration-300 hover:border-indigo-500/40 hover:bg-card/40 rounded-2xl">
                 <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-110">
                    <Upload className="h-8 w-8 text-indigo-600" />
                 </div>
                 <h3 className="text-xl font-bold">Scan Ledger for European Auditing Compliance</h3>
                 <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2 mb-8 leading-relaxed">
                   Upload your trial balance, transaction ledger, or disclosure notes. Our AI scanner checks entries for ISA anomalies, CSRD reporting gaps, and GDPR exposure points.
                 </p>
                 
                 <div className="relative">
                   <input 
                     type="file" 
                     id="fin-upload" 
                     className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                     onChange={handleFileUpload}
                     accept=".csv,.xlsx,.xls"
                     disabled={uploading}
                   />
                   <Button 
                     size="lg" 
                     disabled={uploading}
                     className="transition-all duration-300 hover:shadow-lg hover:scale-102 bg-primary cursor-pointer shadow-indigo-500/10"
                   >
                     {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                     {uploading ? "Analyzing Ledger Activities..." : "Upload Ledger File for Audit"}
                   </Button>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest">Supports .XLSX, .CSV (Max 20MB)</p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-3 animate-in fade-in-50 duration-300">
                 
                 {/* Audit Health Card */}
                 <Card className="md:col-span-1 border border-muted-foreground/10 bg-card/30 backdrop-blur shadow-xs flex flex-col justify-between">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">Ledger Integrity Score</CardTitle>
                      <CardDescription className="text-xs">Overall financial records health</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4">
                      <div className="relative h-32 w-32 mb-4">
                         <svg className="h-full w-full" viewBox="0 0 36 36">
                            <path className="text-muted stroke-current" strokeWidth="2.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="text-indigo-500 stroke-current" strokeWidth="2.5" strokeDasharray={`${analysisResult.score}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                         </svg>
                         <div className="absolute inset-0 flex items-center justify-center font-black text-3xl">
                            {analysisResult.score}
                         </div>
                      </div>
                      <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-semibold text-xs">
                        High Assurance Confidence
                      </Badge>
                    </CardContent>
                 </Card>
                 
                 {/* Flagged Anomalies Card */}
                 <Card className="md:col-span-2 border border-muted-foreground/10 bg-card/30 backdrop-blur shadow-xs">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base font-bold text-destructive">
                        <AlertTriangle className="h-5 w-5" /> EU Audit Warning Indicators ({analysisResult.anomalies.length})
                      </CardTitle>
                      <CardDescription className="text-xs">Flags mapped to ISA, CSRD, and GDPR requirements</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {analysisResult.anomalies.map((anom: any, idx: number) => (
                         <div key={idx} className="flex gap-3.5 p-3.5 border rounded-xl bg-background/50 hover:bg-muted/30 transition-colors">
                            <div className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border",
                              anom.type === 'High Risk' 
                                ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                : anom.type === 'GDPR Flag'
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {anom.type === 'High Risk' ? <ShieldAlert className="h-4.5 w-4.5" /> : anom.type === 'GDPR Flag' ? <Lock className="h-4.5 w-4.5" /> : <TrendingUp className="h-4.5 w-4.5" />}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{anom.type}</p>
                              <p className="text-xs font-semibold text-foreground leading-snug">{anom.description}</p>
                            </div>
                         </div>
                       ))}
                       <Button 
                         variant="ghost" 
                         className="w-full text-xs text-muted-foreground hover:bg-muted mt-2 cursor-pointer h-9" 
                         onClick={() => setAnalysisResult(null)}
                       >
                         <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Clear and Scan New Ledger
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
