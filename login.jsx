import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && password) {
      // CONSISTENT ID GENERATION: 
      // This ensures that the same email always gets the same ID, 
      // and thus sees the same Firestore data.
      const userId = btoa(email.toLowerCase().trim()).substring(0, 15); 
      
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", userId); 
      localStorage.setItem("userEmail", email.toLowerCase().trim());
      
      setAuth(true);
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 border border-white">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-black">M</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">MediMinds</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to your caregiver portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Email Address" required
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-400"
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg mt-4 transition hover:bg-indigo-700">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;