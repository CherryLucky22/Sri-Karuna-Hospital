import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, UserRound, Lock, AlertCircle, ShieldCheck, Users, BarChart3, HeartPulse, ShieldPlus, Mail, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedRole', role);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedRole');
            }
            const user = await login(email, password, role);
            if (user.role === 'Admin') navigate('/admin/dashboard');
            else if (user.role === 'Reception') navigate('/reception/dashboard');
            else if (user.role === 'Doctor') navigate('/doctor/dashboard');
            else if (user.role === 'Pharmacy') navigate('/pharmacy/inventory');
            else if (user.role === 'Laboratory') navigate('/lab/dashboard');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Background Waves (SVG) */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-40">
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="none" stroke="#dbeafe" strokeWidth="2" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128"></path>
                    <path fill="none" stroke="#bfdbfe" strokeWidth="2" d="M0,256L48,245.3C96,235,192,213,288,213.3C384,213,480,235,576,245.3C672,256,768,256,864,240.3C960,224,1056,192,1152,192C1248,192,1344,224,1392,240L1440,256"></path>
                </svg>
            </div>
            
            <div className="max-w-[950px] w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row relative z-10 border border-gray-100">
                
                {/* Left Side - Branding */}
                <div className="md:w-[45%] bg-[#082247] text-white flex flex-col justify-between p-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')] bg-cover bg-center opacity-15 mix-blend-screen"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#082247] via-transparent to-transparent opacity-80"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-10">
                            <Activity className="w-8 h-8 text-yellow-400" />
                            <h1 className="text-xl font-bold tracking-tight">Sri Karuna Hospital</h1>
                        </div>
                        <h2 className="text-3xl font-extrabold mb-4 leading-snug">Advanced<br/><span className="text-[#3b82f6]">Hospital</span><br/>Management</h2>
                        <p className="text-blue-100/80 text-xs mt-4 max-w-[250px] leading-relaxed">
                            Providing exceptional healthcare with state-of-the-art technology and compassionate professionals.
                        </p>
                    </div>
                    
                    <div className="relative z-10 grid grid-cols-4 gap-2 mt-12 pt-6 border-t border-white/10">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2 shadow-inner">
                                <ShieldCheck className="w-4 h-4 text-blue-300" />
                            </div>
                            <span className="text-[9px] font-medium text-blue-100/90 leading-tight">Secure<br/>Access</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2 shadow-inner">
                                <Users className="w-4 h-4 text-blue-300" />
                            </div>
                            <span className="text-[9px] font-medium text-blue-100/90 leading-tight">Role Based<br/>Dashboard</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2 shadow-inner">
                                <BarChart3 className="w-4 h-4 text-blue-300" />
                            </div>
                            <span className="text-[9px] font-medium text-blue-100/90 leading-tight">Real-time<br/>Analytics</span>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center mb-2 shadow-inner">
                                <HeartPulse className="w-4 h-4 text-blue-300" />
                            </div>
                            <span className="text-[9px] font-medium text-blue-100/90 leading-tight">Better<br/>Care</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="md:w-[55%] p-10 lg:p-12 bg-white flex flex-col justify-center relative">
                    <div className="absolute top-8 right-8 grid grid-cols-3 gap-1.5 opacity-20">
                        {[...Array(9)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>)}
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#1a73e8] shadow-sm border border-blue-100">
                            <ShieldPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Welcome Back</h3>
                            <p className="text-gray-500 text-xs mt-0.5">Please sign in to your account</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 flex items-center gap-2 rounded-lg text-xs font-medium">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">Role</label>
                            <div className="relative">
                                <UserRound className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <select 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-700 appearance-none bg-transparent cursor-pointer hover:border-gray-300 transition-colors"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Reception">Reception</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Pharmacy">Pharmacy</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input 
                                    type="email" 
                                    id="email"
                                    name="email"
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-700 placeholder-gray-400 hover:border-gray-300 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    id="password"
                                    name="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm text-gray-700 placeholder-gray-400 hover:border-gray-300 transition-colors"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center pt-1 px-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-3.5 h-3.5 text-[#1a73e8] border-gray-300 rounded focus:ring-[#1a73e8] cursor-pointer" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="text-[11px] text-gray-600 font-medium">Remember me</span>
                            </label>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-[0_4px_14px_0_rgba(26,115,232,0.39)] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Activity className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4" />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] text-gray-400 font-medium">© 2026 Sri Karuna Hospital. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
