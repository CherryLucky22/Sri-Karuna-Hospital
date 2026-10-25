import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, UserRound, Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, Users, BarChart3, Heart, ChevronDown, Globe } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

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
        <div className="min-h-screen overflow-y-auto overflow-x-hidden bg-cover bg-center flex items-center justify-center p-4 md:p-8 pb-[100px] md:pb-[100px] relative font-sans" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop')" }}>

            {/* Dark Blur Overlay for the entire page background */}
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"></div>

            {/* Main Login Card */}
            <div className="max-w-[850px] w-[92%] min-h-[440px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">

                {/* Left Panel: Branding & Info */}
                <div className="md:w-[55%] relative flex flex-col justify-between p-6 lg:p-8 text-white overflow-hidden">
                    {/* Left Panel Background Image */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>

                    {/* Gradient Overlay to ensure text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/30"></div>

                    {/* Content z-10 */}
                    <div className="relative z-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-10">
                            <div className="bg-white p-1 rounded-xl flex items-center justify-center shadow-lg overflow-hidden h-10 w-10">
                                <img src="/logo.jpg" alt="Sri Karuna Hospital" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-wide leading-tight drop-shadow-sm">Sri Karuna Hospital</h2>
                                <p className="text-[9px] text-gray-200 font-medium tracking-wide">CARE • COMPASSION • COMMITMENT</p>
                            </div>
                        </div>

                        {/* Hero Text */}
                        <div className="mb-8">
                            <h1 className="text-3xl lg:text-4xl font-bold leading-[1.15] mb-4 tracking-tight">
                                Advanced<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">Hospital</span><br />
                                Management
                            </h1>
                            <div className="w-10 h-1 bg-blue-500 rounded-full mb-4"></div>
                            <p className="text-slate-200 text-sm leading-relaxed font-light max-w-[90%]">
                                Providing exceptional healthcare with state-of-the-art technology and compassionate professionals.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Grid */}
                    <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-auto">
                        <div className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-white mb-1">Secure Access</h4>
                                <p className="text-[9px] text-gray-300 leading-snug">Protected &<br />Encrypted</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
                                <Users className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-white mb-1">Role Based<br />Dashboard</h4>
                                <p className="text-[9px] text-gray-300 leading-snug mt-1">Smart & Organized<br />Interface</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
                                <BarChart3 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-white mb-1">Real-time<br />Analytics</h4>
                                <p className="text-[9px] text-gray-300 leading-snug mt-1">Data-driven<br />Decisions</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center text-center gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/15 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-400/30">
                                <Heart className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-white mb-1">Better Care</h4>
                                <p className="text-[9px] text-gray-300 leading-snug">Patients First,<br />Always</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Login Form */}
                <div className="md:w-[45%] bg-white p-6 lg:p-8 flex flex-col justify-center">

                    <div className="flex flex-col items-center mb-6">
                        <div className="mb-3 drop-shadow-md hover:scale-105 transition-transform duration-300">
                            <img src="/logo.jpg" alt="Sri Karuna Hospital Logo" className="w-20 h-20 object-contain rounded-full shadow-sm bg-white p-1.5" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#0f172a] tracking-tight">Welcome</h2>
                    </div>

                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-100 text-red-600 flex items-center gap-2 rounded-xl text-xs font-bold">
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-gray-800 ml-1">Role</label>
                            <div className="relative">
                                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-blue-500 transition-all appearance-none text-gray-800 cursor-pointer"
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Reception">Reception</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Laboratory">Laboratory</option>
                                    <option value="Pharmacy">Pharmacy</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-gray-800 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold text-gray-800 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400 text-gray-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center pt-1 pb-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#0d47a1] focus:ring-[#0d47a1] cursor-pointer"
                                />
                                <span className="text-[12px] font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Remember me</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0c4a9a] hover:bg-[#0a3875] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_rgb(12,74,154,0.3)]"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Copyright */}
                    <p className="text-center text-[10px] font-medium text-gray-400 mt-8">
                        &copy; 2026 Sri Karuna Hospital. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Developer Footer - Full Width Bottom Bar */}
            <div className="fixed bottom-0 left-0 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.1)] border-t border-white/60 px-6 md:px-12 py-2.5 flex items-center justify-between z-50 w-full transition-all duration-300">
                
                {/* Profile */}
                <div className="flex items-center gap-3">
                    <img src="/developer.png" alt="Kadari Uday" className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 object-cover" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Developer</span>
                        <span className="text-[14px] font-black text-slate-800 leading-none">Kadari Uday</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
                
                {/* Socials */}
                <div className="flex items-center gap-2.5">
                    <a href="https://portfolio-kadariudays-projects.vercel.app/" title="View Portfolio" target="_blank" rel="noopener noreferrer" className="h-9 px-3.5 flex items-center gap-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <Globe className="w-4 h-4 stroke-[2]" />
                        <span className="text-[11px] font-bold tracking-wide">Portfolio</span>
                    </a>
                    <a href="https://github.com/Kadariuday" title="GitHub" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-200 transition-colors">
                        <FaGithub className="w-4 h-4" />
                    </a>
                    <a href="https://www.linkedin.com/in/kadari-uday/" title="LinkedIn" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                        <FaLinkedin className="w-4 h-4" />
                    </a>
                </div>
            </div>

        </div>
    );
};

export default Login;
