'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Info, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/ui/logo';
import Theme from '../components/ui/theme';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function SignInPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [signupStep, setSignupStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    
    // Step 1 fields
    const [userType, setUserType] = useState<'agency' | 'freelancer'>('agency');
    const [usageType, setUsageType] = useState<'personal' | 'clients'>('clients');
    
    // Step 2 fields
    const [agencyName, setAgencyName] = useState('');
    const [website, setWebsite] = useState('');
    const [clientsServed, setClientsServed] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [idealClientProfile, setIdealClientProfile] = useState('');
    const [bigBrands, setBigBrands] = useState('');
    const [caseStudies, setCaseStudies] = useState('');
    const [leadSources, setLeadSources] = useState<string[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState('');
    
    // Step 3 fields
    const [services, setServices] = useState<Array<{name: string, description: string}>>([]);
    const [pricingPackages, setPricingPackages] = useState<Array<{name: string, price: string, description: string}>>([]);
    const [currentOffers, setCurrentOffers] = useState<Array<{name: string, description: string, packageId: string}>>([]);
    const [stepByStepProcess, setStepByStepProcess] = useState<Array<{packageId: string, steps: Array<{order: number, description: string}>}>>([]);
    const [timelineToResults, setTimelineToResults] = useState<Array<{packageId: string, timeline: string}>>([]);
    
    // Service/package management
    const [newService, setNewService] = useState({name: '', description: ''});
    const [newPackage, setNewPackage] = useState({name: '', price: '', description: ''});
    const [newOffer, setNewOffer] = useState({name: '', description: '', packageId: ''});
    const [newStep, setNewStep] = useState({packageId: '', description: '', order: 1});
    const [newTimeline, setNewTimeline] = useState({packageId: '', timeline: ''});
    
    // Skip options
    const [skipStep2, setSkipStep2] = useState(false);
    const [skipStep3, setSkipStep3] = useState(false);
    const [showStep2Tooltip, setShowStep2Tooltip] = useState(false);
    const [showStep3Tooltip, setShowStep3Tooltip] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { refreshUser } = useAuth();
    const router = useRouter();

    const leadSourceOptions = [
        "Upwork", "Fiverr", "Linkedin", "Cold Email", "B2B/Other Agencies", 
        "SEO", "Social Media (FB, IG, etc)", "Google Ads", "Meta Ads", 
        "Influencers", "Conferences", "Others"
    ];

    const handleLeadSourceToggle = (source: string) => {
        setLeadSources(prev => 
            prev.includes(source) 
                ? prev.filter(s => s !== source)
                : [...prev, source]
        );
    };

    const addService = () => {
        if (newService.name.trim()) {
            setServices(prev => [...prev, {...newService, name: newService.name.trim(), description: newService.description.trim() || ''}]);
            setNewService({name: '', description: ''});
        }
    };

    const removeService = (index: number) => {
        setServices(prev => prev.filter((_, i) => i !== index));
    };

    const addPackage = () => {
        if (newPackage.name.trim() && newPackage.price.trim()) {
            setPricingPackages(prev => [...prev, {...newPackage, name: newPackage.name.trim(), price: newPackage.price.trim(), description: newPackage.description.trim() || ''}]);
            setNewPackage({name: '', price: '', description: ''});
        }
    };

    const removePackage = (index: number) => {
        setPricingPackages(prev => prev.filter((_, i) => i !== index));
    };

    const addOffer = () => {
        if (newOffer.name.trim() && newOffer.packageId.trim()) {
            setCurrentOffers(prev => [...prev, {...newOffer, name: newOffer.name.trim(), description: newOffer.description.trim() || '', packageId: newOffer.packageId.trim()}]);
            setNewOffer({name: '', description: '', packageId: ''});
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

    const updateStep = (processIndex: number, stepIndex: number, field: 'description', value: string) => {
        setStepByStepProcess(prev => prev.map((p, i) => 
            i === processIndex 
                ? {...p, steps: p.steps.map((s, sIndex) => 
                    sIndex === stepIndex ? {...s, [field]: value} : s
                )}
                : p
        ));
    };

    const updateStepProcess = (processIndex: number, field: 'packageId', value: string) => {
        setStepByStepProcess(prev => prev.map((p, i) => 
            i === processIndex ? {...p, [field]: value} : p
        ));
    };

    const removeStep = (processIndex: number, stepIndex: number) => {
        setStepByStepProcess(prev => prev.map((p, i) => 
            i === processIndex 
                ? {...p, steps: p.steps.filter((_, sIndex) => sIndex !== stepIndex).map((s, sIndex) => ({...s, order: sIndex + 1}))}
                : p
        ));
    };

    const removeStepProcess = (index: number) => {
        setStepByStepProcess(prev => prev.filter((_, i) => i !== index));
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

    const updateTimeline = (index: number, field: 'packageId' | 'timeline', value: string) => {
        setTimelineToResults(prev => prev.map((timeline, i) => 
            i === index ? {...timeline, [field]: value} : timeline
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSignUp && signupStep === 1) {
            if (!username || !email || !password || !userType || !usageType) {
                toast.error('Please fill in all required fields');
                return;
            }
            setSignupStep(2);
            return;
        }
        
        if (isSignUp && signupStep === 2) {
            if (!agencyName) {
                toast.error('Please provide your agency name');
                return;
            }
            // If skip is checked, go directly to step 3
            if (skipStep2) {
                setSignupStep(3);
                return;
            }
            setSignupStep(3);
            return;
        }
        
        if (isSignUp && signupStep === 3) {
            // If skip is checked, proceed with registration
            if (skipStep3) {
                // Continue with registration
            } else {
                // Check if at least some basic info is provided
                if (services.length === 0 && pricingPackages.length === 0) {
                    toast.error('Please add at least one service or pricing package, or check "Set up later"');
                    return;
                }
            }
        }
        
        setLoading(true);
        try {
            let url = `${API_BASE}/auth/${isSignUp ? 'register' : 'login'}`;
            let body: any = isSignUp
                ? { 
                    username, 
                    email, 
                    password, 
                    role: 'user',
                    userType,
                    usageType,
                    agencyName,
                    website: skipStep2 ? '' : website,
                    services: skipStep3 ? [] : services,
                    pricingPackages: skipStep3 ? [] : pricingPackages,
                    currentOffers: skipStep3 ? [] : currentOffers,
                    caseStudies: skipStep2 ? '' : caseStudies,
                    clientsServed: skipStep2 ? 0 : (clientsServed ? parseInt(clientsServed) : 0),
                    targetAudience: skipStep2 ? '' : targetAudience,
                    idealClientProfile: skipStep2 ? '' : idealClientProfile,
                    bigBrands: skipStep2 ? '' : bigBrands,
                    stepByStepProcess: skipStep3 ? [] : stepByStepProcess,
                    timelineToResults: skipStep3 ? [] : timelineToResults,
                    leadSources: skipStep2 ? [] : leadSources,
                    monthlyRevenue: skipStep2 ? 0 : (monthlyRevenue ? parseInt(monthlyRevenue) : 0)
                  }
                : { email, password, role: 'user' };
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Registration failed');
            } else {
                toast.success(isSignUp ? 'Registration successful!' : 'Login successful!');
                await refreshUser();
                if (isSignUp) {
                    router.push('/upgrade');
                } else {
                    router.push('/');
                }
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateOffer = (index: number, field: 'name' | 'description' | 'packageId', value: string) => {
        setCurrentOffers(prev => prev.map((offer, i) => 
            i === index ? {...offer, [field]: value} : offer
        ));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 pt-20">
            {/**Header */}
            <div 
             className="fixed h-16 m-auto top-0 left-0 right-0 z-50 flex justify-between items-center p-4 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300"
            >
                <Logo />
                <Theme />
            </div>
            <div className={`bg-background text-foreground border border-border rounded-lg p-8 shadow-lg [&_input:-webkit-autofill]:bg-background [&_input:-webkit-autofill:hover]:bg-background [&_input:-webkit-autofill:focus]:bg-background [&_input:-webkit-autofill]:text-foreground [&_input:-webkit-autofill]:!transition-[background-color] [&_input:-webkit-autofill]:!duration-[5000s] [&_input:-webkit-autofill]:[text-fill-color:var(--foreground)] [&_input:-webkit-autofill]:[-webkit-text-fill-color:var(--foreground)] ${isSignUp ? 'w-full max-w-[800px]' : 'w-full max-w-[500px]'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                    <Link href="/" className="text-gray-500 hover:text-gray-700 cursor-pointer">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </Link>
                </div>
                
                {/* Steps Navigation for Signup */}
                {isSignUp && (
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center ${signupStep >= 1 ? 'text-foreground' : 'text-muted'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${signupStep >= 1 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                    1
                                </div>
                                <span className="ml-2 text-sm font-medium">Personal Info</span>
                            </div>
                            <div className={`w-8 h-0.5 ${signupStep >= 2 ? 'bg-background' : 'bg-muted'}`}></div>
                            <div className={`flex items-center ${signupStep >= 2 ? 'text-foreground' : 'text-muted'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${signupStep >= 2 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                    2
                                </div>
                                <span className="ml-2 text-sm font-medium">Basic Info</span>
                            </div>
                            <div className={`w-8 h-0.5 ${signupStep >= 3 ? 'bg-background' : 'bg-muted'}`}></div>
                            <div className={`flex items-center ${signupStep >= 3 ? 'text-foreground' : 'text-muted'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${signupStep >= 3 ? 'border-primary bg-primary text-foreground' : 'border-gray-300'}`}>
                                    3
                                </div>
                                <span className="ml-2 text-sm font-medium">Services & Pricing</span>
                            </div>
                        </div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Sign In Mode - Only Email and Password */}
                    {!isSignUp && (
                        <>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <div className="text-right mt-1">
                                    <Link href="/forgot" className="text-sm text-primary-text-faded hover:text-primary-text-hover transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* Sign Up Step 1 - Personal Info */}
                    {isSignUp && signupStep === 1 && (
                        <>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute cursor-pointer right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Which describes you best?</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="userType"
                                            value="agency"
                                            checked={userType === 'agency'}
                                            onChange={(e) => setUserType(e.target.value as 'agency' | 'freelancer')}
                                            className="text-primary"
                                        />
                                        <span>Agency</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="userType"
                                            value="freelancer"
                                            checked={userType === 'freelancer'}
                                            onChange={(e) => setUserType(e.target.value as 'agency' | 'freelancer')}
                                            className="text-primary"
                                        />
                                        <span>Freelancer</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">How will you be using our tools?</label>
                                <div className="space-y-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="usageType"
                                            value="personal"
                                            checked={usageType === 'personal'}
                                            onChange={(e) => setUsageType(e.target.value as 'personal' | 'clients')}
                                            className="text-primary"
                                        />
                                        <span>I will use it for myself / my team</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="usageType"
                                            value="clients"
                                            checked={usageType === 'clients'}
                                            onChange={(e) => setUsageType(e.target.value as 'personal' | 'clients')}
                                            className="text-primary"
                                        />
                                        <span>I will use it for my clients</span>
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* Sign Up Step 2 - Basic Info */}
                    {isSignUp && signupStep === 2 && (
                        <>
                            <div>
                                <label htmlFor="agencyName" className="block text-sm font-medium mb-1">
                                    What is your {userType === 'agency' ? 'agency' : 'business'} name?
                                </label>
                                <input
                                    type="text"
                                    id="agencyName"
                                    value={agencyName}
                                    onChange={(e) => setAgencyName(e.target.value)}
                                    placeholder={`Enter your ${userType === 'agency' ? 'agency' : 'business'} name`}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                    required
                                />
                            </div>
                            
                            {!skipStep2 && (
                                <>
                            <div>
                                <label htmlFor="website" className="block text-sm font-medium mb-1">
                                            Website 
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://yourwebsite.com"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="clientsServed" className="block text-sm font-medium mb-1">
                                    Number of clients served
                                </label>
                                <input
                                    type="number"
                                    id="clientsServed"
                                    value={clientsServed}
                                    onChange={(e) => setClientsServed(e.target.value)}
                                    placeholder="e.g., 25"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                />
                            </div>
                            
                            <div>
                                        <label htmlFor="idealClientProfile" className="block text-sm font-medium mb-1">
                                            Ideal Client Profile
                                </label>
                                        <textarea
                                            id="idealClientProfile"
                                            value={idealClientProfile}
                                            onChange={(e) => setIdealClientProfile(e.target.value)}
                                            placeholder="Describe your ideal client"
                                            rows={3}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover resize-none"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">
                                    Target Audience
                                </label>
                                <input
                                    type="text"
                                    id="targetAudience"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="Who is your target audience?"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="bigBrands" className="block text-sm font-medium mb-1">
                                            Big brands you've worked with and results
                                </label>
                                <textarea
                                    id="bigBrands"
                                    value={bigBrands}
                                    onChange={(e) => setBigBrands(e.target.value)}
                                    placeholder="List major clients and their results"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover resize-none"
                                />
                            </div>
                            
                            <div>
                                        <label htmlFor="caseStudies" className="block text-sm font-medium mb-1">
                                            Case studies 
                                </label>
                                <textarea
                                            id="caseStudies"
                                            value={caseStudies}
                                            onChange={(e) => setCaseStudies(e.target.value)}
                                            placeholder="Share your best case studies and results"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover resize-none"
                                />
                            </div>
                            
                            <div>
                                        <label className="block text-sm font-medium mb-2">
                                            How are you currently getting leads?
                                </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {leadSourceOptions.map((source) => (
                                                <label key={source} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                                        type="checkbox"
                                                        checked={leadSources.includes(source)}
                                                        onChange={() => handleLeadSourceToggle(source)}
                                                        className="text-primary"
                                                    />
                                                    <span className="text-sm">{source}</span>
                                                </label>
                                            ))}
                            </div>
                            </div>
                            
                            <div>
                                <label htmlFor="monthlyRevenue" className="block text-sm font-medium mb-1">
                                    Monthly revenue ($)
                                </label>
                                <input
                                    type="number"
                                    id="monthlyRevenue"
                                    value={monthlyRevenue}
                                    onChange={(e) => setMonthlyRevenue(e.target.value)}
                                    placeholder="e.g., 50000"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover"
                                        />
                                    </div>
                                </>
                            )}
                            
                            <div className="flex items-center justify-center space-x-2 mt-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={skipStep2}
                                        onChange={(e) => setSkipStep2(e.target.checked)}
                                        className="text-primary"
                                    />
                                    <span className="text-sm">Set up later</span>
                                </label>
                                <div 
                                    className="relative"
                                    onMouseEnter={() => setShowStep2Tooltip(true)}
                                    onMouseLeave={() => setShowStep2Tooltip(false)}
                                >
                                    <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                    {showStep2Tooltip && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-primary-text-faded whitespace-nowrap z-10">
                                            You can always set this up later
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* Sign Up Step 3 - Services & Pricing */}
                    {isSignUp && signupStep === 3 && (
                        <>
                            {!skipStep3 && (
                                <>
                                    <div className="space-y-6">
                                        {/* Services */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3">Services</label>
                                            <div className="space-y-2">
                                                {services.map((service, index) => (
                                                    <div key={index} className="flex border border-border rounded-lg items-center gap-2 p-2 bg-muted/20 rounded-lg">
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
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Description (optional)"
                                                        value={newService.description}
                                                        onChange={(e) => setNewService(prev => ({...prev, description: e.target.value}))}
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addService}
                                                        className="p-2 bg-primary text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pricing Packages */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3">Pricing Packages</label>
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
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Price ($)"
                                                        value={newPackage.price}
                                                        onChange={(e) => setNewPackage(prev => ({...prev, price: e.target.value}))}
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Description (optional)"
                                                        value={newPackage.description}
                                                        onChange={(e) => setNewPackage(prev => ({...prev, description: e.target.value}))}
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addPackage}
                                                        className="p-2 bg-primary text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Current Offers */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3">Current Offers</label>
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
                                                        className="w-48 px-3 py-2 border border-border text-muted-foreground cursor-pointer rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
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
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Description (optional)"
                                                        value={newOffer.description}
                                                        onChange={(e) => setNewOffer(prev => ({...prev, description: e.target.value}))}
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addOffer}
                                                        className="p-2 bg-primary text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Step-by-Step Process */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3">Step-by-Step Process</label>
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
                                                        className="w-48 px-3 py-2 border border-border text-muted-foreground cursor-pointer rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
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
                                                        className="w-24 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Step description"
                                                        value={newStep.description}
                                                        onChange={(e) => setNewStep(prev => ({...prev, description: e.target.value}))}
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addStep}
                                                        className="p-2 bg-primary text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline to Results */}
                                        <div>
                                            <label className="block text-sm font-medium mb-3">Timeline to Results</label>
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
                                                        className="w-48 px-3 py-2 border border-border text-muted-foreground cursor-pointer rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
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
                                                        className="flex-1 px-3 py-2 border border-border rounded-lg bg-background outline-none focus:border-primary-hover focus:ring-1 focus:ring-primary-hover text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addTimeline}
                                                        className="p-2 bg-primary text-foreground cursor-pointer rounded-full hover:bg-primary-hover transition-colors"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className="flex items-center justify-center space-x-2 mt-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={skipStep3}
                                        onChange={(e) => setSkipStep3(e.target.checked)}
                                        className="text-primary"
                                    />
                                    <span className="text-sm">Set up later</span>
                                </label>
                                <div 
                                    className="relative"
                                    onMouseEnter={() => setShowStep3Tooltip(true)}
                                    onMouseLeave={() => setShowStep3Tooltip(false)}
                                >
                                    <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                                    {showStep3Tooltip && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background border border-border rounded-lg shadow-lg text-xs text-primary-text-faded whitespace-nowrap z-10">
                                            You can always set this up later
                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-border"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div className="flex space-x-3">
                        {isSignUp && signupStep > 1 && (
                            <button 
                                type="button" 
                                onClick={() => setSignupStep(signupStep - 1)}
                                className="flex-1 cursor-pointer mx-auto border border-border text-foreground py-2 rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={`cursor-pointer mx-auto border border-border text-foreground py-2 rounded-lg hover:bg-primary-hover transition-colors ${isSignUp && signupStep > 1 ? 'flex-1' : 'w-full'}`}
                        >
                            {loading 
                                ? (isSignUp ? 'Signing Up...' : 'Signing In...') 
                                : (isSignUp 
                                    ? (signupStep === 3 ? 'Sign Up' : 'Next') 
                                    : 'Sign In'
                                  )
                            }
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center text-sm">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary-text-faded cursor-pointer hover:text-primary-text-hover">
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
