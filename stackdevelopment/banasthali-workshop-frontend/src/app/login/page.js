"use client";

import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import "../../app/auth.css";
import Link from "next/link";
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from "@/context/authContext";
import { backendService } from "@/services/api";

const Loginpage = () => {
    const router = useRouter();
    const {loginauth} = useAuth();
    const [email,setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
       try{
            e.preventDefault();
            setLoading(true);
            setError('');
        // Submit Login User logic
            const response = await backendService.login(email,password);
            console.log("login response", response);
            loginauth(response);
            setLoading(false);
       }catch(err){
            setError(err?.message);
            setLoading(false);
       }
    }

  return (
    <div className="auth-container">
        <div
            className="glass-card auth-card"
        >
            <div className="auth-header">
                <h1>Welcome Back</h1>
                <p>Sign in to manage your projects</p>
            </div>

            {error && <div className="error-msg">
             {error}
            </div>}

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label className="label">Email Address</label>
                    <div className="input-relative">
                        <Mail className="input-icon" />
                        <input
                            type="email"
                            required
                            className="input input-with-icon"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="input-group">
                    <label className="label">Password</label>
                    <div className="input-relative">
                        <Lock className="input-icon" />
                        <input
                            type="password"
                            required
                            className="input input-with-icon"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full"
                    style={{ marginTop: '1.5rem' }}
                >
                    {loading ? 
                        <div className="spinner"></div> :
                        "Sign In"
                    }
                </button>
            </form>

            <p className="auth-footer">
                Don't have an account?{' '}
                <Link href="/signup" className="auth-link">
                    Create an account
                </Link>
            </p>
        </div>
    </div>
  )
}

export default Loginpage;