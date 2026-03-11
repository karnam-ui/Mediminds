import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const Upload = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // Array of medicines to be saved
  const [times, setTimes] = useState({ Morning: "08:00", Afternoon: "14:00", Night: "20:00" });

  // Manual Form State
  const [manualMed, setManualMed] = useState({ name: '', dosage: '', period: 'Morning' });

  // --- 1. AI SCANNING LOGIC ---
  const handleAI = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const prompt = `Extract medicines from prescription. Categorize as Morning, Afternoon, or Night. Output ONLY a JSON array: [{"name": "Med", "dosage": "1 tab", "period": "Morning"}]`;
        
        const res = await model.generateContent([prompt, { inlineData: { data: base64, mimeType: file.type } }]);
        const match = res.response.text().match(/\[[\s\S]*\]/);
        
        if (match) {
          const parsed = JSON.parse(match[0]);
          setResults(prev => [...prev, ...parsed]); // Add scanned results to the staging list
        }
      } catch (err) {
        console.error(err);
        alert("AI Processing Failed.");
      } finally {
        setLoading(false);
      }
    };
  };

  // --- 2. MANUAL ADDITION LOGIC ---
  const handleManualAdd = () => {
    if (!manualMed.name || !manualMed.dosage) return alert("Please fill all fields");
    setResults(prev => [...prev, manualMed]);
    setManualMed({ name: '', dosage: '', period: 'Morning' }); // Clear manual form
  };

  const removeResult = (index) => {
    setResults(prev => prev.filter((_, i) => i !== index));
  };

  // --- 3. FINAL SAVE TO FIREBASE ---
  const saveToPatientProfile = async (shouldOverwrite) => {
    if (!patientId) return;
    try {
      setLoading(true);
      const colPath = collection(db, "patients", patientId, "reminders");

      if (shouldOverwrite) {
        const snap = await getDocs(colPath);
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }

      for (let med of results) {
        await addDoc(colPath, {
          ...med,
          scheduledTime: times[med.period] || "08:00",
          takenToday: false,
          timestamp: serverTimestamp()
        });
      }

      navigate(`/patient/${patientId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link to={`/patient/${patientId}`} className="text-indigo-600 font-bold">← Back to Dashboard</Link>
      
      {/* SECTION 1: SLOTS */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border">
        <h2 className="text-xl font-bold mb-4">1. Configure Slots</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.keys(times).map(p => (
            <div key={p}>
              <label className="block text-xs font-bold text-gray-400 mb-1">{p}</label>
              <input type="time" value={times[p]} onChange={e => setTimes({...times, [p]: e.target.value})} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 2A: AI SCAN */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border h-full">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">📷 AI Auto-Scan</h2>
          <input type="file" onChange={handleAI} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700" />
          <p className="mt-2 text-[10px] text-gray-400">Upload an image of the handwritten or printed prescription.</p>
        </div>

        {/* SECTION 2B: MANUAL ENTRY */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border h-full">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">✍️ Add Manually</h2>
          <div className="space-y-3">
            <input placeholder="Med Name (e.g. Crocin)" value={manualMed.name} onChange={e => setManualMed({...manualMed, name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
            <input placeholder="Dosage (e.g. 1 Tablet)" value={manualMed.dosage} onChange={e => setManualMed({...manualMed, dosage: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
            <select value={manualMed.period} onChange={e => setManualMed({...manualMed, period: e.target.value})} className="w-full p-2 border rounded-lg text-sm bg-white">
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </select>
            <button onClick={handleManualAdd} className="w-full bg-indigo-50 text-indigo-700 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 transition">
              + Add to List
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: VERIFICATION TABLE */}
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-500 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">3. Final Verification</h2>
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                <div>
                  <span className="font-bold text-gray-800">{r.name}</span>
                  <span className="text-xs text-gray-400 ml-2">({r.dosage} • {r.period})</span>
                </div>
                <button onClick={() => removeResult(i)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4">
            <button onClick={() => saveToPatientProfile(false)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 transition hover:scale-[1.02]">
              Save All
            </button>
            <button onClick={() => { if(window.confirm("Delete current and replace?")) saveToPatientProfile(true); }} className="flex-1 border-2 border-red-50 text-red-500 py-4 rounded-2xl font-bold hover:bg-red-50 transition">
              Overwrite
            </button>
          </div>
        </div>
      )}
      
      {loading && <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-bold text-indigo-900">Analysing...</p>
        </div>
      </div>}
    </div>
  );
};

export default Upload;