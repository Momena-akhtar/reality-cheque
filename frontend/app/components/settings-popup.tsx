'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SettingsPopup = ({ onClose }: { onClose: () => void }) => {
  const [editMode, setEditMode] = useState(false);
  const { user } = useAuth();
  const { logout } = useAuth();
  const router = useRouter()

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
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    setEditMode(false);
  };
  const capitalize = (str: string | undefined | null) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1)
};
  const getPlanColor = (str: string | undefined | null ) => {
    switch (str?.toLowerCase()){
      case "free":
        return <p className='text-green-700'>{capitalize(str)}</p>
      case "pro":
        return <p className='text-yellow-700'>{capitalize(str)}</p>
      case "free":
        return <p className='text-blue-700'>{capitalize(str)}</p>
      default:
        return <p className='text-primary'>{capitalize(str)}</p>
    }
  }
  return ( 
    <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
      <div className="bg-background text-foreground border border-border rounded-lg p-8 w-[570px] shadow-lg relative [&_input:-webkit-autofill]:bg-background [&_input:-webkit-autofill:hover]:bg-background [&_input:-webkit-autofill:focus]:bg-background [&_input:-webkit-autofill]:text-[var(--foreground)] [&_input:-webkit-autofill]:!transition-[background-color] [&_input:-webkit-autofill]:!duration-[5000s] [&_input:-webkit-autofill]:[text-fill-color:var(--foreground)] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)]">
        <button onClick={onClose} className="absolute cursor-pointer top-3 right-3 text-foreground hover:text-primary-hover text-xl font-bold">&times;</button>
        <h2 className="text-lg font-semibold mb-4">Account Settings</h2>

      {/* User Info Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-primary-text-faded mb-1">Username</label>
          <input
            type="text"
            name="username"
            className="w-full px-3 py-2  text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
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
            className="w-full px-3 py-2 text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
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
            className="w-full px-3 py-2  text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
            disabled={!editMode}
            value={userInfo.password}
            onChange={handleInputChange}
          />
        </div>

        <button
          className="mt-2 px-4 py-2 text-sm hover:bg-primary-hover text-foreground rounded-lg border border-border cursor-pointer transition-all"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Save Changes' : 'Update Info'}
        </button>
      </div>

      {/* Divider */}
      <hr className="border-border my-4" />

      {/*Account Details */}
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <p className='flex gap-1 text-sm text-primary-text-faded'>Plan: <span>{" "}{getPlanColor(user?.plan)}</span></p>
        <button className="flex text-sm hover:underline py-1 cursor-pointer text-foreground rounded-lg w-fit"
        onClick={() => router.push("/upgrade")}>
          Upgrade 
        </button>
        </div>
        <div className='flex justify-between items-center'>
          <p className='text-sm text-primary-text-faded'>Remaining Credits</p>
        <span className="text-sm"
        >
          ${(user?.creditsPerMonth)?.toString()}/mo
        </span>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border my-4" />

      {/* Account Options */}
      <div className="space-y-4">
        <div className='flex justify-between items-center'>
          <p className='text-sm text-primary-text-faded'>Log out of all devices</p>
        <button className="px-3 py-2 border border-border text-sm hover:bg-primary-hover cursor-pointer text-foreground rounded-lg w-fit"
        onClick={handleLogout}>
          Log out
        </button>
        </div>
          <div className='flex justify-between items-center'>
        <p className='text-sm text-primary-text-faded'>Delete your account</p>
        <button className="px-3 py-2 border border-red-600/30 hover:bg-red-600/40 cursor-pointer text-sm text-foreground rounded-lg w-fit">
          Delete account
        </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SettingsPopup;
