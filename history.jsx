import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const History = () => {
  const { patientId } = useParams();
  const [vitals, setVitals] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "patients", patientId, "health_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVitals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [patientId]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Vital Signs History</h2>
        <p className="text-gray-500 text-sm mt-1">Chronological record of all Blood Pressure and Sugar logs.</p>
      </div>
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase">
          <tr>
            <th className="px-8 py-4">Date</th>
            <th className="px-8 py-4">Blood Pressure</th>
            <th className="px-8 py-4">Blood Sugar</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {vitals.map(v => (
            <tr key={v.id} className="hover:bg-gray-50">
              <td className="px-8 py-5 text-sm text-gray-400">
                {v.timestamp?.toDate().toLocaleDateString()}
              </td>
              <td className="px-8 py-5 font-bold text-gray-800">{v.bp}</td>
              <td className="px-8 py-5 font-bold text-gray-800">{v.sugar} mg/dL</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;