import { useState, useEffect } from 'react';
import { LogOut, Plus, Home, User, Layers, Trash2, Users } from 'lucide-react';

export default function Dashboard({ user, token, onSelectRoom, onLogout, onOpenProfile }) {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('Hostel');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joining, setJoining] = useState(false);

  const fetchRooms = async () => {
    const res = await fetch('http://localhost:5000/api/rooms', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setRooms(data);
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    const res = await fetch('http://localhost:5000/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: roomName, type: roomType })
    });
    if (res.ok) {
      setRoomName('');
      fetchRooms();
      alert('Room created successfully! Share the room code with friends.');
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!confirm(`Are you sure you want to delete "${roomName}"? This will delete ALL expenses and cannot be undone!`)) return;
    
    const res = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      alert('Room deleted successfully');
      fetchRooms();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete room');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoining(true);
    
    try {
      const res = await fetch(`http://localhost:5000/api/rooms/find-by-code/${joinRoomCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error('Invalid room code');
      }
      
      const room = await res.json();
      
      const joinRes = await fetch(`http://localhost:5000/api/rooms/${room.id}/join-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: joinRoomCode })
      });
      
      const data = await joinRes.json();
      
      if (joinRes.ok) {
        alert(`✅ Join request sent to ${room.name} admin!\nYou'll be notified when approved.`);
        setShowJoinModal(false);
        setJoinRoomCode('');
      } else {
        alert(data.error || 'Failed to send join request');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6 transition-colors">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div onClick={onOpenProfile} className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold cursor-pointer transition transform hover:scale-105 shadow-sm" style={{ backgroundColor: user.avatar_color }}>
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-950 dark:text-white">HostelSplit Panel</h1>
            <p onClick={onOpenProfile} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium">View identity tracking token</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowJoinModal(true)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            <Users size={16}/> Join Room
          </button>
          <button onClick={onOpenProfile} className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
            <User size={16}/> Profile
          </button>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition">
            <LogOut size={16}/> Leave
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2"><Layers size={14}/> Active Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="group relative p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow">
                <div onClick={() => onSelectRoom(room)} className="cursor-pointer flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl"><Home size={20} /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white leading-snug">{room.name}</h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">{room.type} Space</p>
                    <span className="inline-block mt-3 text-[10px] font-mono bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-2 py-0.5 rounded-md text-gray-500 dark:text-gray-400 font-semibold">
                      Code: {room.invite_code}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteRoom(room.id, room.name)}
                  className="absolute top-3 right-3 p-1.5 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {rooms.length === 0 && <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 dark:text-gray-500 text-sm font-medium">No tracking rooms created yet.</div>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit transition-colors">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Plus size={18} className="text-indigo-600 dark:text-indigo-400"/> Create Space</h3>
          <form onSubmit={handleCreateRoom} className="space-y-3">
            <input type="text" placeholder="Room/Event Title" value={roomName} onChange={e => setRoomName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900" required />
            <select value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Hostel">🏡 Hostel / Room / PG</option>
              <option value="Trip">✈️ Trip / Travel Account</option>
              <option value="Mess">🍳 Mess / Shared Kitchen</option>
            </select>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-sm shadow-indigo-100 dark:shadow-none">
              Generate Space Container
            </button>
          </form>
        </div>
      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full transition-colors">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Join a Room</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Enter the room code shared by the admin</p>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Enter Room Code (e.g., HS-ABCD12)"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  {joining ? 'Sending...' : 'Request to Join'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}