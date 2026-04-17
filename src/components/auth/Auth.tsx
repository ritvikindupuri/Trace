import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Shield, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';

import Logo from '../ui/Logo';

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface AuthProps {
  onLogin: (user: any) => void;
  onBackToLanding?: () => void;
}

export default function Auth({ onLogin, onBackToLanding }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user);
        toast.success('Welcome back!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name,
          createdAt: new Date().toISOString()
        });
        
        onLogin(userCredential.user);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F7] p-6 relative">
      {onBackToLanding && (
        <button 
          onClick={onBackToLanding}
          className="absolute top-8 left-8 flex items-center gap-2 text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm font-medium group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-[#D2D2D7] flex items-center justify-center group-hover:border-[#1D1D1F] transition-colors">
            <ArrowRight className="rotate-180" size={16} />
          </div>
          Back to Landing Page
        </button>
      )}
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center mb-8 gap-4">
          <Logo size={32} />
          <div className="text-center">
            <p className="text-[#86868B] mt-1">macOS Security Intelligence Platform</p>
          </div>
        </div>

        <Card className="border-[#D2D2D7] rounded-3xl shadow-xl overflow-hidden bg-white">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <CardHeader className="space-y-1 pt-8">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Enter your credentials to access your security research' 
                : 'Join the next generation of macOS security engineering'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              {!isLogin && (
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-[#86868B]" size={16} />
                    <Input 
                      placeholder="Full Name" 
                      className="pl-10 rounded-xl border-[#D2D2D7] h-11"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-[#86868B]" size={16} />
                  <Input 
                    type="email" 
                    placeholder="Email Address" 
                    className="pl-10 rounded-xl border-[#D2D2D7] h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-[#86868B]" size={16} />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    className="pl-10 rounded-xl border-[#D2D2D7] h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {isLogin && (
                <div className="flex justify-end">
                  <Button variant="link" className="text-xs text-blue-600 p-0 h-auto">
                    Forgot password?
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8">
              <Button 
                type="submit" 
                className="w-full rounded-xl bg-[#0071E3] hover:bg-[#0077ED] h-11 font-bold text-sm shadow-lg shadow-blue-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Get Started'}
                    <ArrowRight className="ml-2" size={18} />
                  </>
                )}
              </Button>
              <div className="text-sm text-center text-[#86868B]">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  type="button"
                  className="text-blue-600 font-semibold hover:underline"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
          <div className="flex items-center gap-2 grayscale">
            <Shield size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure</span>
          </div>
          <div className="flex items-center gap-2 grayscale">
            <Lock size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
