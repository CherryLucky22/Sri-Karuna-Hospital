import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-8">You don't have permission to access this page. Please contact the administrator if you believe this is a mistake.</p>
                <Link to="/" className="btn-primary inline-flex items-center justify-center w-full">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;
