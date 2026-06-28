import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, UserRound, Lock, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Admin');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(email, password, role);
            if (user.role === 'Admin') navigate('/admin/dashboard');
            else if (user.role === 'Reception') navigate('/reception/dashboard');
            else if (user.role === 'Doctor') navigate('/doctor/dashboard');
            else if (user.role === 'Pharmacy') navigate('/pharmacy/inventory');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side - Branding */}
                <div className="md:w-1/2 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="w-12 h-12 text-accent" />
                            <h1 className="text-3xl font-bold tracking-tight">Sri Karuna</h1>
                        </div>
                        <h2 className="text-4xl font-extrabold mb-4 leading-tight">Advanced<br/>Hospital Management</h2>
                        <p className="text-red-100 text-lg opacity-90">Providing exceptional healthcare with state-of-the-art technology and compassionate professionals.</p>
                    </div>
                    
                    {/* Decorative Elements */}
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-700 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                </div>

                {/* Right Side - Login Form */}
                <div className="md:w-1/2 p-12 bg-surface">
                    <div className="mb-8 text-center md:text-left">
                        <h3 className="text-2xl font-bold text-gray-800">Welcome Back</h3>
                        <p className="text-gray-500 mt-1">Please sign in to your account</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded text-sm">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                                className="input-field bg-gray-50 cursor-pointer"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Reception">Reception</option>
                                <option value="Doctor">Doctor</option>
                                <option value="Laboratory">Laboratory</option>
                                <option value="Pharmacy">Pharmacy</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <UserRound className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="input-field pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="input-field pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Activity className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">© 2026 Sri Karuna Hospital. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
