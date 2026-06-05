import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import RoomView from './components/RoomView';

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (jwtToken, userData) => {
    console.log('Login called with:', { jwtToken, userData });
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    setActiveRoom(null);
    setCurrentView('dashboard');
  };

  // Show Auth if not logged in
  if (!token || !user) {
    return <Auth onAuthSuccess={handleLogin} />;
  }

  // Profile View
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-24" style={{ backgroundColor: user.avatar_color + '20' }} />
          <div className="relative mt-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-md border-4 border-white" style={{ backgroundColor: user.avatar_color }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-4">{user.full_name}</h2>
            <p className="text-sm text-gray-400 font-medium">{user.email}</p>
            
            <div className="w-full mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 text-center">
              <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-600">Personal System Member Token ID</span>
              <code className="block mt-2 font-mono font-bold text-lg text-indigo-700 bg-white border border-indigo-200 px-4 py-2 rounded-lg shadow-inner select-all">
                {user.unique_code || 'Not assigned yet'}
              </code>
              <p className="text-xs text-gray-500 mt-3">
                Share this ID with room admins to join rooms
              </p>
            </div>

            <button 
              onClick={() => {
                if (user.unique_code) {
                  navigator.clipboard.writeText(user.unique_code);
                  alert('Unique ID copied to clipboard!');
                }
              }} 
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              📋 Copy to Clipboard
            </button>

            <button onClick={() => setCurrentView('dashboard')} className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-xl text-sm transition">
              Return to Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (activeRoom) {
    return (
      <RoomView room={activeRoom} token={token} userId={user.id} onBack={() => setActiveRoom(null)} />
    );
  }

  return (
    <Dashboard 
      user={user} 
      token={token} 
      onSelectRoom={setActiveRoom} 
      onLogout={handleLogout} 
      onOpenProfile={() => setCurrentView('profile')} 
    />
  );
}

export default App;