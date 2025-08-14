'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Info, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
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

  // Profile setup state (reusing from signup)
  const [agencyName, setAgencyName] = useState(user?.agencyName || '');
  const [services, setServices] = useState(user?.services || []);
  const [website, setWebsite] = useState(user?.website || '');
  const [pricingPackages, setPricingPackages] = useState(user?.pricingPackages || []);
  const [currentOffers, setCurrentOffers] = useState(user?.currentOffers || []);
  const [caseStudies, setCaseStudies] = useState(user?.caseStudies || '');
  const [clientsServed, setClientsServed] = useState(user?.clientsServed || 0);
  const [targetAudience, setTargetAudience] = useState(user?.targetAudience || '');
  const [idealClientProfile, setIdealClientProfile] = useState(user?.idealClientProfile || '');
  const [bigBrands, setBigBrands] = useState(user?.bigBrands || '');
  const [stepByStepProcess, setStepByStepProcess] = useState(user?.stepByStepProcess || []);
  const [timelineToResults, setTimelineToResults] = useState(user?.timelineToResults || []);
  const [leadSources, setLeadSources] = useState(user?.leadSources || []);
  const [monthlyRevenue, setMonthlyRevenue] = useState(user?.monthlyRevenue || 0);

  // New item states
  const [newService, setNewService] = useState({ name: '', description: '' });
  const [newPackage, setNewPackage] = useState({ name: '', price: '', description: '' });
  const [newOffer, setNewOffer] = useState({ name: '', description: '', packageId: '' });
  const [newStep, setNewStep] = useState({ packageId: '', description: '', order: 1 });
  const [newTimeline, setNewTimeline] = useState({ packageId: '', timeline: '' });

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
      
      // Initialize profile data
      setAgencyName(user.agencyName || '');
      setServices(user.services || []);
      setWebsite(user.website || '');
      setPricingPackages(user.pricingPackages || []);
      setCurrentOffers(user.currentOffers || []);
      setCaseStudies(user.caseStudies || '');
      setClientsServed(user.clientsServed || 0);
      setTargetAudience(user.targetAudience || '');
      setIdealClientProfile(user.idealClientProfile || '');
      setBigBrands(user.bigBrands || '');
      setStepByStepProcess(user.stepByStepProcess || []);
      setTimelineToResults(user.timelineToResults || []);
      setLeadSources(user.leadSources || []);
      setMonthlyRevenue(user.monthlyRevenue || 0);
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

  const handleSaveProfileSetup = async () => {
    if (!user) return;

    try {
      const updateData = {
        agencyName,
        services,
        website,
        pricingPackages,
        currentOffers,
        caseStudies,
        clientsServed,
        targetAudience,
        idealClientProfile,
        bigBrands,
        stepByStepProcess,
        timelineToResults,
        leadSources,
        monthlyRevenue
      };

      const success = await updateUser(user.id, updateData);
      
      if (success) {
        toast.success('Profile setup completed successfully');
        setShowProfileSetup(false);
      } else {
        toast.error('Failed to save profile setup');
      }
    } catch (error) {
      toast.error('An error occurred while saving profile setup');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
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
        router.push('/');
      } else {
        toast.error('Failed to delete account');
      }
    } catch (error) {
      toast.error('An error occurred while deleting account');
    }
  };

  // Profile setup functions (reused from signup)
  const addService = () => {
    if (newService.name.trim()) {
      setServices(prev => [...prev, { name: newService.name.trim(), description: newService.description.trim() }]);
      setNewService({ name: '', description: '' });
    }
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const addPackage = () => {
    if (newPackage.name.trim() && newPackage.price.trim()) {
      setPricingPackages(prev => [...prev, { name: newPackage.name.trim(), price: newPackage.price.trim(), description: newPackage.description.trim() }]);
      setNewPackage({ name: '', price: '', description: '' });
    }
  };

  const removePackage = (index: number) => {
    setPricingPackages(prev => prev.filter((_, i) => i !== index));
  };

  const addOffer = () => {
    if (newOffer.name.trim()) {
      setCurrentOffers(prev => [...prev, { name: newOffer.name.trim(), description: newOffer.description.trim(), packageId: newOffer.packageId }]);
      setNewOffer({ name: '', description: '', packageId: '' });
    }
  };

  const removeOffer = (index: number) => {
    setCurrentOffers(prev => prev.filter((_, i) => i !== index));
  };

  const addStep = () => {
    if (newStep.packageId.trim() && newStep.description.trim()) {
      const existingProcess = stepByStepProcess.find(p => p.packageId === newStep.packageId);
      if (existingProcess) {
        setStepByStepProcess(prev => prev.map(p => 
          p.packageId === newStep.packageId 
            ? {...p, steps: [...p.steps, {order: newStep.order, description: newStep.description.trim()}]}
            : p
        ));
      } else {
        setStepByStepProcess(prev => [...prev, {
          packageId: newStep.packageId.trim(),
          steps: [{order: newStep.order, description: newStep.description.trim()}]
        }]);
      }
      setNewStep({packageId: '', description: '', order: 1});
    }
  };

  const removeStep = (processIndex: number, stepIndex: number) => {
    setStepByStepProcess(prev => prev.map((p, i) => 
      i === processIndex 
        ? {...p, steps: p.steps.filter((_, sIndex) => sIndex !== stepIndex).map((s, sIndex) => ({...s, order: sIndex + 1}))}
        : p
    ));
  };

  const addTimeline = () => {
    if (newTimeline.packageId.trim() && newTimeline.timeline.trim()) {
      setTimelineToResults(prev => [...prev, {
        packageId: newTimeline.packageId.trim(),
        timeline: newTimeline.timeline.trim()
      }]);
      setNewTimeline({packageId: '', timeline: ''});
    }
  };

  const removeTimeline = (index: number) => {
    setTimelineToResults(prev => prev.filter((_, i) => i !== index));
  };

  const getTierColor = (str: string | undefined | null) => {
    switch (str?.toLowerCase()) {
      case "tier1":
        return "text-green-700";
      case "tier2":
        return "text-yellow-700";
      case "tier3":
        return "text-blue-700";
      default:
        return "text-primary";
    }
  };

  const formatTierName = (str: string | undefined | null) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1, 4) + " " + str.slice(4);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* User Info Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
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

            <div className="flex gap-2">
              <button
                className="px-4 py-2 text-sm hover:bg-primary-hover text-foreground rounded-lg border border-border cursor-pointer transition-all"
                onClick={editMode ? handleSaveChanges : () => {
                  setEditMode(true);
                  setShowPassword(false);
                }}
              >
                {editMode ? 'Save Changes' : 'Update Info'}
              </button>

              {editMode && (
                <button
                  className="px-4 py-2 text-sm hover:bg-gray-600 text-foreground rounded-lg border border-border cursor-pointer transition-all"
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
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Details</h2>
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <p className='flex gap-1 text-sm text-primary-text-faded'>
                Tier:{" "}
                <span className={getTierColor(user?.tier)}>
                  {formatTierName(user?.tier)}
                </span>
              </p>
              <button 
                className="flex text-sm hover:underline py-1 cursor-pointer text-foreground rounded-lg w-fit"
                onClick={() => router.push("/upgrade")}
              >
                Change Tier
              </button>
            </div>
            <div className='flex justify-between items-center'>
              <p className='text-sm text-primary-text-faded'>Remaining Credits</p>
              <div className='flex items-center gap-1 relative'>
                <span className="text-sm">
                  ${user?.totalCredits !== undefined && user?.usedCredits !== undefined 
                    ? (user.totalCredits - user.usedCredits).toFixed(3)
                    : '0.000'
                  } credits remaining
                </span>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowCreditsTooltip(true)}
                  onMouseLeave={() => setShowCreditsTooltip(false)}
                >
                  <Info className='w-4 h-4 cursor-pointer text-primary-text-faded hover:text-foreground transition-colors' />
                  {showCreditsTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-primary-text-faded whitespace-nowrap z-10">
                      Credits represent your remaining API usage. Each AI generation consumes credits worth o3 API calls.
                      <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Setup Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Profile Setup</h2>
            <button
              className="px-4 py-2 text-sm border border-border cursor-pointer text-foreground rounded-lg hover:bg-primary-hover transition-all"
              onClick={() => setShowProfileSetup(!showProfileSetup)}
            >
              {showProfileSetup ? 'Hide Setup' : 'Complete Profile'}
            </button>
          </div>

          {showProfileSetup && (
            <div className="space-y-6">
              {/* Agency Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Agency Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Agency Name</label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      placeholder="Enter your agency name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Case Studies</label>
                    <textarea
                      value={caseStudies}
                      onChange={(e) => setCaseStudies(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      rows={3}
                      placeholder="Describe your case studies and success stories"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Clients Served</label>
                    <input
                      type="number"
                      value={clientsServed}
                      onChange={(e) => setClientsServed(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Target Audience</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      placeholder="Who is your target audience?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ideal Client Profile</label>
                    <textarea
                      value={idealClientProfile}
                      onChange={(e) => setIdealClientProfile(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      rows={3}
                      placeholder="Describe your ideal client profile"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Big Brands You've Worked With</label>
                    <input
                      type="text"
                      value={bigBrands}
                      onChange={(e) => setBigBrands(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      placeholder="List notable brands you've worked with"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Revenue</label>
                    <input
                      type="number"
                      value={monthlyRevenue}
                      onChange={(e) => setMonthlyRevenue(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-medium mb-3">Services</h3>
                <div className="space-y-2">
                  {services.map((service, index) => (
                    <div key={index} className="flex border border-border rounded-lg items-center gap-2 p-2 bg-muted/20">
                      <span className="flex-1 text-sm">{service.name}</span>
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-red-500 cursor-pointer border border-red-700 p-1 rounded-full hover:text-foreground transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Service name"
                      value={newService.name}
                      onChange={(e) => setNewService(prev => ({...prev, name: e.target.value}))}
                      className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newService.description}
                      onChange={(e) => setNewService(prev => ({...prev, description: e.target.value}))}
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <button
                      type="button"
                      onClick={addService}
                      className="p-2 border border-border  text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pricing Packages */}
              <div>
                <h3 className="text-lg font-medium mb-3">Pricing Packages</h3>
                <div className="space-y-2">
                  {pricingPackages.map((pkg, index) => (
                    <div key={index} className="flex border border-border items-center gap-2 p-2 bg-muted/20 rounded-lg">
                      <span className="flex-1 text-sm">{pkg.name} - ${pkg.price}</span>
                      <button
                        type="button"
                        onClick={() => removePackage(index)}
                        className="text-red-500 cursor-pointer border border-red-700 p-1 rounded-full hover:text-foreground transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Package name"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage(prev => ({...prev, name: e.target.value}))}
                      className="w-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <input
                      type="text"
                      placeholder="Price ($)"
                      value={newPackage.price}
                      onChange={(e) => setNewPackage(prev => ({...prev, price: e.target.value}))}
                      className="w-32 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newPackage.description}
                      onChange={(e) => setNewPackage(prev => ({...prev, description: e.target.value}))}
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <button
                      type="button"
                      onClick={addPackage}
                      className="p-2 border border-border text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Offers */}
              <div>
                <h3 className="text-lg font-medium mb-3">Current Offers</h3>
                <div className="space-y-2">
                  {currentOffers.map((offer, index) => (
                    <div key={index} className="flex border border-border items-center gap-2 p-2 bg-muted/20 rounded-lg">
                      <span className="flex-1 text-sm">
                        {offer.name}
                        {offer.packageId && pricingPackages[parseInt(offer.packageId)] && (
                          <span className="text-muted-foreground ml-2">({pricingPackages[parseInt(offer.packageId)].name})</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOffer(index)}
                        className="text-red-500 cursor-pointer border border-red-700 p-1 rounded-full hover:text-foreground transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <select
                      value={newOffer.packageId}
                      onChange={(e) => setNewOffer(prev => ({...prev, packageId: e.target.value}))}
                      className="w-48 bg-card px-3 py-2 border border-border text-muted-foreground cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    >
                      <option value="">Package</option>
                      {pricingPackages.map((pkg, pkgIndex) => (
                        <option key={pkgIndex} value={pkgIndex.toString()}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Offer name"
                      value={newOffer.name}
                      onChange={(e) => setNewOffer(prev => ({...prev, name: e.target.value}))}
                      className="w-48 px-3 py-2 border border-border rounded-lg  focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newOffer.description}
                      onChange={(e) => setNewOffer(prev => ({...prev, description: e.target.value}))}
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <button
                      type="button"
                      onClick={addOffer}
                      className="p-2 border border-border text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Process */}
              <div>
                <h3 className="text-lg font-medium mb-3">Step-by-Step Process</h3>
                <div className="space-y-2">
                  {stepByStepProcess.map((process, index) => (
                    <div key={index} className="p-2 bg-muted/20 rounded-lg border border-border">
                      <div className="text-sm font-medium mb-1">{pricingPackages[parseInt(process.packageId)]?.name}</div>
                      <div className="space-y-1 ml-3">
                        {process.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{step.order}.</span>
                            <span className="text-sm">{step.description}</span>
                            <button
                              type="button"
                              onClick={() => removeStep(index, stepIndex)}
                              className="text-red-500 cursor-pointer border border-red-700 p-1 rounded-full hover:text-foreground transition-colors ml-auto"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <select
                      value={newStep.packageId}
                      onChange={(e) => setNewStep(prev => ({...prev, packageId: e.target.value}))}
                      className="w-48 bg-card px-3 py-2 border border-border text-muted-foreground cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    >
                      <option value="">Package</option>
                      {pricingPackages.map((pkg, pkgIndex) => (
                        <option key={pkgIndex} value={pkgIndex.toString()}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Step order"
                      value={newStep.order || ''}
                      onChange={(e) => setNewStep(prev => ({...prev, order: parseInt(e.target.value) || 0}))}
                      className="w-24 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <input
                      type="text"
                      placeholder="Step description"
                      value={newStep.description}
                      onChange={(e) => setNewStep(prev => ({...prev, description: e.target.value}))}
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <button
                      type="button"
                      onClick={addStep}
                      className="p-2 border border-border text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline to Results */}
              <div>
                <h3 className="text-lg font-medium mb-3">Timeline to Results</h3>
                <div className="space-y-2">
                  {timelineToResults.map((timeline, index) => (
                    <div key={index} className="flex border border-border items-center gap-2 p-2 bg-muted/20 rounded-lg">
                      <span className="flex-1 text-sm">{pricingPackages[parseInt(timeline.packageId)]?.name}: {timeline.timeline}</span>
                      <button
                        type="button"
                        onClick={() => removeTimeline(index)}
                        className="text-red-500 cursor-pointer border border-red-700 p-1 rounded-full hover:text-foreground transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <select
                      value={newTimeline.packageId}
                      onChange={(e) => setNewTimeline(prev => ({...prev, packageId: e.target.value}))}
                      className="w-48 bg-card px-3 py-2 border border-border text-muted-foreground cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    >
                      <option value="">Package</option>
                      {pricingPackages.map((pkg, pkgIndex) => (
                        <option key={pkgIndex} value={pkgIndex.toString()}>
                          {pkg.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Timeline"
                      value={newTimeline.timeline}
                      onChange={(e) => setNewTimeline(prev => ({...prev, timeline: e.target.value}))}
                      className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover"
                    />
                    <button
                      type="button"
                      onClick={addTimeline}
                      className="p-2 border border-border text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Lead Sources */}
              <div>
                <h3 className="text-lg font-medium mb-3">Lead Sources</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Upwork", "Fiverr", "Linkedin", "Cold Email", "B2B/Other Agencies", 
                    "SEO", "Social Media (FB, IG, etc)", "Google Ads", "Meta Ads", 
                    "Influencers", "Conferences", "Others"
                  ].map((source) => (
                    <label key={source} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={leadSources.includes(source)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setLeadSources(prev => [...prev, source]);
                          } else {
                            setLeadSources(prev => prev.filter(s => s !== source));
                          }
                        }}
                        className="text-primary"
                      />
                      <span className="text-sm">{source}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Profile Setup Button */}
              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleSaveProfileSetup}
                  className="w-[50%] sm:w-[full] px-6 py-3 border border-border cursor-pointer text-foreground rounded-lg hover:bg-primary-hover transition-all font-medium"
                >
                  Save Profile Setup
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Options */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Options</h2>
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
    </div>
  );
}