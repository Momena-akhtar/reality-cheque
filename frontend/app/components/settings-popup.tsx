'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SettingsPopup = ({ onClose }: { onClose: () => void }) => {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);
  const { user, updateUser, deleteUser, logout } = useAuth();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setUserInfo({
        username: user.username || '',
        email: user.email || '',
        password: '********'
      });
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      const updateData: any = {};
      
      if (formData.username !== user.username) {
        updateData.username = formData.username;
      }
      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }
      if (formData.password && formData.password !== '********') {
        updateData.password = formData.password;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save');
        setEditMode(false);
        return;
      }

      const success = await updateUser(user.id, updateData);
      
      if (success) {
        toast.success('Profile updated successfully');
        setEditMode(false);
        // Update the display data
        setUserInfo({
          username: formData.username,
          email: formData.email,
          password: '********'
        });
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('An error occurred while updating profile');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      const success = await deleteUser(user.id);
      
      if (success) {
        toast.success('Account deleted successfully');
        onClose();
      } else {
        toast.error('Failed to delete account');
      }
    } catch (error) {
      toast.error('An error occurred while deleting account');
    }
  };

  const getPlanColor = (str: string | undefined | null) => {
    switch (str?.toLowerCase()) {
      case "free":
        return "text-green-700";
      case "pro":
        return "text-yellow-700";
      case "enterprise":
        return "text-blue-700";
      default:
        return "text-primary";
    }
  };

  const capitalize = (str: string | undefined | null) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (!user) {
    return null;
  }

  return (
    <>
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
                className="w-full px-3 py-2 text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                disabled={!editMode}
                value={editMode ? formData.username : userInfo.username}
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
                value={editMode ? formData.email : userInfo.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-primary-text-faded mb-1">Password</label>
              <div className="relative">
                <input
                  type={editMode ? (showPassword ? "text" : "password") : "password"}
                  name="password"
                  placeholder={editMode ? "Enter new password" : "********"}
                  className="w-full px-3 py-2 pr-10 text-foreground border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                  disabled={!editMode}
                  value={editMode ? formData.password : "********"}
                  onChange={handleInputChange}
                />
                {editMode && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-text-faded hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 cursor-pointer" />
                    ) : (
                      <Eye className="w-4 h-4 cursor-pointer" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <button
              className="mt-2 px-4 py-2 text-sm hover:bg-primary-hover text-foreground rounded-lg border border-border cursor-pointer transition-all"
              onClick={editMode ? handleSaveChanges : () => {
                setEditMode(true);
                setShowPassword(false);
              }}
            >
              {editMode ? 'Save Changes' : 'Update Info'}
            </button>

            {editMode && (
              <button
                className="mt-2 px-4 py-2 text-sm hover:bg-gray-600 text-foreground rounded-lg border border-border cursor-pointer transition-all ml-2"
                onClick={() => {
                  setEditMode(false);
                  setShowPassword(false);
                  setFormData({
                    username: user.username || '',
                    email: user.email || '',
                    password: ''
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Divider */}
          <hr className="border-border my-4" />

          {/* Account Details */}
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <p className='flex gap-1 text-sm text-primary-text-faded'>
                Plan:{" "}
                <span className={getPlanColor(user?.plan)}>
                  {capitalize(user?.plan)}
                </span>
              </p>
              <button 
                className="flex text-sm hover:underline py-1 cursor-pointer text-foreground rounded-lg w-fit"
                onClick={() => router.push("/upgrade")}
              >
                Upgrade 
              </button>
            </div>
                <div className='flex justify-between items-center'>
              <p className='text-sm text-primary-text-faded'>Remaining Credits</p>
              <div className='flex items-center gap-1 relative'>
                <span className="text-sm">
                  ${user?.creditsPerMonth || 10}/mo
                </span>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowCreditsTooltip(true)}
                  onMouseLeave={() => setShowCreditsTooltip(false)}
                >
                  <Info className='w-4 h-4 cursor-pointer text-primary-text-faded hover:text-foreground transition-colors' />
                  {showCreditsTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-primary-text-faded whitespace-nowrap z-10">
                      Credits are equivalent to $10 worth of o3-mini API calls
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border my-4" />

          {/* Account Options */}
          <div className="space-y-4">
            <div className='flex justify-between items-center'>
              <p className='text-sm text-primary-text-faded'>Log out of all devices</p>
              <button 
                className="px-3 py-2 border border-border text-sm hover:bg-primary-hover cursor-pointer text-foreground rounded-lg w-fit"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
            <div className='flex justify-between items-center'>
              <p className='text-sm text-primary-text-faded'>Delete your account</p>
              <button 
                className="px-3 py-2 border border-red-600/30 hover:bg-red-600/40 cursor-pointer text-sm text-foreground rounded-lg w-fit"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[101]">
          <div className="bg-background text-foreground border border-border rounded-lg p-6 w-[400px] shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Account</h3>
            <p className="text-sm text-primary-text-faded mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm border border-border hover:bg-primary-hover cursor-pointer text-foreground rounded-lg"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 cursor-pointer text-white rounded-lg"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPopup;
