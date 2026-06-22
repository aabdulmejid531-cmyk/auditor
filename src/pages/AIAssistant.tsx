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
import { openaiApiKey } from "@/integrations/supabase/client";

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: "Hello! I am your AuditFlow AI assistant. I'm trained on Ethiopian accounting standards and IFRS. How can I help you today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery("");
    setIsTyping(true);

    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = `You are an expert audit assistant specializing in Ethiopian accounting standards and IFRS. Provide practical, actionable advice for auditors working in Ethiopia. Focus on:
      - Ethiopian-specific compliance requirements
      - IFRS implementation challenges in Ethiopia
      - Risk assessment for Ethiopian businesses
      - Audit procedures for local business environments
      - Documentation requirements for Ethiopian regulators
      
      Keep responses concise, professional, and focused on audit quality and compliance.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('AI Error:', error);
      let errorMessage = "I'm currently unable to process your request. Please try again later.";
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = "AI service is not configured. Please contact your administrator.";
        } else if (error.message.includes('Failed to get')) {
          errorMessage = "Unable to connect to AI service. Please check your internet connection.";
        }
      }
      
      setChatHistory(prev => [...prev, { role: 'ai', content: errorMessage }]);
      Sonner.toast.error(errorMessage);
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
        <span className="text-sm text-muted-foreground">Powered by GPT-4o-mini</span>
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
