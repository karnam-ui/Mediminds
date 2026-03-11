import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot } from "firebase/firestore";

const MedVault = () => {
  const { patientId } = useParams();
  // Initialize as empty array to prevent .map() from crashing on first render
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;

    // Direct path to the reminders for this patient
    const q = query(collection(db, "patients", patientId, "reminders"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      setMeds(data);
      setLoading(false);
    }, (error) => {
      console.error("Vault Subscription Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [patientId]);

  if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Accessing Secure Vault...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
      <div className="p-8 bg-indigo-600 text-white">
        <h2 className="text-2xl font-bold italic underline">Live Med Vault</h2>
        <p className="opacity-80 text-sm mt-1">Active prescriptions in current rotation.</p>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meds.length > 0 ? meds.map((m) => (
          <div key={m.id} className="p-5 border-2 border-gray-50 rounded-2xl flex flex-col justify-between hover:border-indigo-200 transition-all bg-white shadow-sm">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg leading-tight">{m?.name || "Unnamed Med"}</h3>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md uppercase">
                  {m?.period}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">{m?.dosage || "Dosage not set"}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-400 font-mono">Slot: {m?.scheduledTime}</span>
              <div className={`w-3 h-3 rounded-full ${m?.takenToday ? 'bg-green-400' : 'bg-amber-400'}`}></div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center opacity-30">
            <span className="text-5xl mb-4">🔓</span>
            <p className="text-gray-500 font-bold italic text-xl">The vault is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedVault;