import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const PatientSelector = () => {
  const [patients, setPatients] = useState([]);
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    // FETCH ISOLATION: Query only patients belonging to this specific userId
    const q = query(collection(db, "patients"), where("ownerId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [userId]);

  const addPatient = async () => {
    if (!newName) return;
    await addDoc(collection(db, "patients"), { name: newName, ownerId: userId });
    setNewName("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">MediMinds Portal</h1>
          <p className="text-slate-500 font-medium mt-1">Select a profile to start health monitoring.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {patients.map(p => (
            <div key={p.id} onClick={() => navigate(`/patient/${p.id}`)} 
                 className="group bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer border border-slate-100 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-600 transition-colors">
                <span className="text-3xl group-hover:scale-110 transition-transform">👤</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{p.name}</h2>
              <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Open File →</p>
            </div>
          ))}

          <div className="bg-slate-200/30 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-300 flex flex-col justify-center items-center gap-4">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Patient Name..." 
                   className="w-full bg-white px-4 py-3 rounded-2xl text-sm border-none shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={addPatient} className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-indigo-600 transition-colors shadow-lg">
              + Add Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSelector;