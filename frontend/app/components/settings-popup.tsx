'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SettingsPopup = ({ onClose }: { onClose: () => void }) => {
  const [editMode, setEditMode] = useState(false);
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    password: '********'
  });

  useEffect(() => {
    if (user) {
      setUserInfo({
        username: user.username || '',
        email: user.email || '',
        password: '********'
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
      <div className="bg-background text-[var(--foreground)] border border-border rounded-lg p-8 w-[400px] shadow-lg relative [&_input:-webkit-autofill]:bg-background [&_input:-webkit-autofill:hover]:bg-background [&_input:-webkit-autofill:focus]:bg-background [&_input:-webkit-autofill]:text-[var(--foreground)] [&_input:-webkit-autofill]:!transition-[background-color] [&_input:-webkit-autofill]:!duration-[5000s] [&_input:-webkit-autofill]:[text-fill-color:var(--foreground)] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
        <h2 className="text-lg font-semibold mb-4">Account Settings</h2>

      {/* User Info Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-primary-text-faded mb-1">Username</label>
          <input
            type="text"
            name="username"
            className="w-full px-3 py-2 bg-primary text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary-hover"
            disabled={!editMode}
            value={userInfo.username}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="block text-sm text-primary-text-faded mb-1">Email</label>
          <input
            type="email"
            name="email"
            className="w-full px-3 py-2 bg-primary text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary-hover"
            disabled={!editMode}
            value={userInfo.email}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label className="block text-sm text-primary-text-faded mb-1">Password</label>
          <input
            type="password"
            name="password"
            className="w-full px-3 py-2 bg-primary text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary-hover"
            disabled={!editMode}
            value={userInfo.password}
            onChange={handleInputChange}
          />
        </div>

        <button
          className="mt-2 px-4 py-2 bg-primary hover:bg-primary-hover text-foreground rounded transition-all"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Save Changes' : 'Update Info'}
        </button>
      </div>

      {/* Divider */}
      <hr className="border-border my-4" />

      {/* Account Options */}
      <div className="space-y-4">
        <button className="w-full text-left text-sm text-primary-text-faded hover:text-primary-text-hover">
          Log out of all devices
        </button>
        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-foreground rounded w-fit">
          Log out
        </button>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded w-fit">
          Delete account
        </button>
      </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
