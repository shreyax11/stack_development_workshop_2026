"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import "../../app/auth.css"
import Link from "next/link";
import axios from "axios";
import { backendService } from "@/services/api";
import { useAuth } from "@/context/authContext";

const SignupPage = () => {
    const {loginauth} = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await backendService.signup(name, email,password);
    loginauth(response);
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState ("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="auth-container">
            <div
                className="glass-card auth-card"
            >
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join the project management portal</p>
                </div>


                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="label">Full Name</label>
                        <div className="input-relative">
                            <User className="input-icon" />
                            <input
                                type="text"
                                required
                                className="input input-with-icon"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

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
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="label">Confirm Password</label>
                        <div className="input-relative">
                            <Lock className="input-icon" />
                            <input
                                type="password"
                                required
                                className="input input-with-icon"
                                placeholder="Enter confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        style={{ marginTop: '1.5rem' }}
                    >
                        Sign Up
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link href="/login" className="auth-link">
                        Login
                    </Link>
                </p>
            </div>
        </div>
  )
}

export default SignupPage;