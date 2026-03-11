import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const Reports = () => {
  const { patientId } = useParams();
  const [logs, setLogs] = useState([]);
  const [vitals, setVitals] = useState({ bp: '', sugar: '' });
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Fetch Weekly Health Logs
  useEffect(() => {
    if (!patientId) return;

    const qLogs = query(
      collection(db, "patients", patientId, "health_logs"), 
      orderBy("timestamp", "desc")
    );
    
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Firestore Logs Error:", err));
    
    return () => unsubLogs();
  }, [patientId]);

  // 2. CONCISE MONTHLY REPORT LOGIC
  const generateMonthlyReport = async () => {
    if (logs.length === 0) return alert("Please log at least one BP/Sugar update first.");
    setLoading(true);
    setAiAnalysis(""); 

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      // Sanitize: Convert Firestore logs to a clean string for the AI
      const recentLogs = logs.slice(0, 4)
        .map(l => `BP: ${l.bp}, Sugar: ${l.sugar}`)
        .join(" | ");

      const prompt = `Act as a medical assistant. Analyze these health logs: ${recentLogs}. 
      Provide a CONCISE response in this EXACT format:
      STABILITY: (One word: Stable or Unstable)
      RISKS: (One short sentence only)
      MEASURES: (3 short bullet points)`;
      
      const res = await model.generateContent(prompt);
      setAiAnalysis(res.response.text());
    } catch (err) {
      console.error("AI Error:", err);
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logVitals = async () => {
    if (!vitals.bp || !vitals.sugar) return alert("Please enter both BP and Sugar.");
    try {
      await addDoc(collection(db, "patients", patientId, "health_logs"), {
        bp: vitals.bp,
        sugar: vitals.sugar,
        timestamp: serverTimestamp()
      });
      setVitals({ bp: '', sugar: '' });
      alert("Vitals logged!");
    } catch (err) {
      alert("Error saving vitals.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LOGGING CARD */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800 italic">Log Weekly Vitals</h2>
          <div className="space-y-4 mb-4">
            <input 
              placeholder="BP (e.g. 120/80)" 
              value={vitals.bp} 
              onChange={e => setVitals({...vitals, bp: e.target.value})} 
              className="w-full p-3 border rounded-xl text-sm outline-indigo-500" 
            />
            <input 
              placeholder="Sugar (e.g. 110)" 
              value={vitals.sugar} 
              onChange={e => setVitals({...vitals, sugar: e.target.value})} 
              className="w-full p-3 border rounded-xl text-sm outline-indigo-500" 
            />
          </div>
          <button onClick={logVitals} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
            Save Weekly Update
          </button>
        </div>

        {/* AI ACTION CARD */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-center text-center">
          <h2 className="text-lg font-bold mb-2">Monthly Stability</h2>
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-widest">Powered by Gemini AI</p>
          <button 
            onClick={generateMonthlyReport} 
            className="bg-indigo-600 p-4 rounded-2xl text-sm font-bold hover:bg-indigo-500 transition active:scale-95 shadow-lg shadow-indigo-900/50"
          >
            📊 Analyze Trends & Risks
          </button>
        </div>
      </div>

      {/* RESULTS DISPLAY */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-indigo-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-indigo-600 font-bold">AI is analyzing health trends...</p>
        </div>
      )}

      {aiAnalysis && (
        <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-sm transition-all">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-indigo-600 text-xl font-bold">📊</span>
            <h3 className="text-indigo-600 font-bold uppercase text-xs tracking-widest">AI Monthly Stability Report</h3>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap font-medium leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;