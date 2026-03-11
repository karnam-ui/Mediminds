import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, updateDoc, doc, getDoc } from "firebase/firestore";

const Dashboard = () => {
  const { patientId } = useParams(); // Retrieves ID from URL (/patient/ID)
  const [patient, setPatient] = useState(null);
  const [meds, setMeds] = useState([]);
  const [queue, setQueue] = useState([]);
  const [alert, setAlert] = useState(null);
  const [buffer, setBuffer] = useState(1); // Escalation buffer (minutes)

  // 1. FETCH PATIENT DETAILS
  useEffect(() => {
    const fetchPatient = async () => {
      const docRef = doc(db, "patients", patientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setPatient(docSnap.data());
    };
    fetchPatient();
  }, [patientId]);

  // 2. FETCH MEDICINES FOR THIS SPECIFIC PATIENT
  useEffect(() => {
    // Nested collection path: patients/{id}/reminders
    const q = query(collection(db, "patients", patientId, "reminders"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMeds(data);
    });
    return () => unsubscribe();
  }, [patientId]);

  // 3. AUTOMATION & ESCALATION HEARTBEAT
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ":" + 
                      now.getMinutes().toString().padStart(2, '0');

      // Check for due medicines
      const dueMeds = meds.filter(m => 
        m.scheduledTime === timeStr && 
        !m.takenToday && 
        !queue.some(q => q.id === m.id)
      );

      if (dueMeds.length > 0) {
        setQueue(prev => [...prev, ...dueMeds.map(m => ({ ...m, sentAt: now.getTime() }))]);
      }

      // Escalation Logic
      if (queue.length > 0) {
        const currentMed = queue[0];
        const elapsed = (now.getTime() - currentMed.sentAt) / 60000;
        if (elapsed >= buffer && !alert) {
          setAlert(`🚨 URGENT: ${patient?.name || 'Patient'} missed ${currentMed.name}!`);
        }
      } else {
        setAlert(null);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [meds, queue, buffer, patient, alert]);

  // 4. MARK AS TAKEN
  const handleTaken = async (id) => {
    const medRef = doc(db, "patients", patientId, "reminders", id);
    await updateDoc(medRef, { takenToday: true });
    setQueue(prev => prev.filter(item => item.id !== id));
    setAlert(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Escalation Alert */}
      {alert && (
        <div className="bg-red-600 text-white p-4 rounded-2xl mb-6 flex justify-between items-center shadow-lg animate-pulse">
          <span className="font-bold">{alert}</span>
          <button className="bg-white text-red-600 px-4 py-1 rounded-lg text-sm font-bold">Call Now</button>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl">👤</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{patient?.name || "Loading..."}'s Dashboard</h2>
            <p className="text-gray-500 text-sm">Monitoring active medications</p>
          </div>
        </div>
        <Link to={`/patient/${patientId}/upload`} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition">
          📷 Scan Prescription
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MEDICATION LIST */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-gray-700">Daily Adherence</h3>
          <div className="space-y-4">
            {meds.length > 0 ? meds.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400 uppercase font-bold">{m.period} • {m.scheduledTime}</p>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-bold ${m.takenToday ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {m.takenToday ? '✓ TAKEN' : '○ PENDING'}
                </div>
              </div>
            )) : <p className="text-center py-10 text-gray-400">No medicines scheduled. Click "Scan Prescription" to start.</p>}
          </div>
        </div>

        {/* PHONE SIMULATION */}
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Patient Device View</p>
          <div className="w-72 h-[550px] bg-slate-900 rounded-[3rem] border-[10px] border-slate-800 shadow-2xl relative flex items-center justify-center p-4">
            <div className="absolute top-0 w-32 h-6 bg-slate-800 rounded-b-2xl"></div>
            {queue.length > 0 ? (
              <div className="bg-white p-5 rounded-2xl shadow-2xl w-full text-center">
                <p className="text-indigo-600 text-[10px] font-bold uppercase mb-1">New Message</p>
                <p className="text-gray-800 font-bold mb-4">It's time for your {queue[0].name}!</p>
                {queue.length > 1 && <p className="text-[10px] text-gray-400 mb-4">+{queue.length - 1} more pending</p>}
                <button 
                  onClick={() => handleTaken(queue[0].id)} 
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 shadow-md transition"
                >
                  ✅ I took it
                </button>
              </div>
            ) : (
              <div className="text-center opacity-20">
                <p className="text-white text-4xl mb-2">🔔</p>
                <p className="text-white text-xs">Standby</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;