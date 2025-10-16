import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PublicHeader } from '@/components/PublicHeader';

export default function Auth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [authType, setAuthType] = useState<'login' | 'signup' | 'reset-password'>('login');
  
  // Reset password state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/stocks');
      }
    };
    checkSession();
  }, [navigate]);

  // 2FA Timer
  useEffect(() => {
    if (!show2FA) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Code expired. Please request a new one.');
          setShow2FA(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show2FA]);

  const send2FACode = async (email: string, type: 'login' | 'signup' | 'reset-password') => {
    try {
      const { error } = await supabase.functions.invoke('send-2fa-code', {
        body: { email, type },
      });

      if (error) throw error;

      setAuthType(type);
      setCurrentEmail(email);
      setShow2FA(true);
      setTimeRemaining(120);
      setTwoFACode('');
      
      toast.success('Verification code sent to your email');
    } catch (error: any) {
      console.error('2FA error:', error);
      toast.error('Failed to send verification code');
      throw error;
    }
  };

  const verify2FACode = async () => {
    if (twoFACode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: {
          email: currentEmail,
          code: twoFACode,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Invalid or expired code');
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Verification failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setCurrentPassword(password);
      await send2FACode(email, 'login');
    } catch (error: any) {
      setIsLoading(false);
    }
  };

  const completeLogin = async () => {
    const verified = await verify2FACode();
    if (!verified) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });

      if (error) throw error;

      toast.success('Welcome back to TradeX!');
      setShow2FA(false);
      navigate('/stocks');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      setCurrentPassword(password);
      await send2FACode(email, 'signup');
    } catch (error: any) {
      setIsLoading(false);
    }
  };

  const completeSignup = async () => {
    const verified = await verify2FACode();
    if (!verified) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: currentEmail,
        password: currentPassword,
      });

      if (error) throw error;

      toast.success('Account created successfully! Logging you in...');
      setShow2FA(false);
      navigate('/stocks');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await send2FACode(resetEmail, 'reset-password');
      setShowResetPassword(false);
    } catch (error: any) {
      setIsLoading(false);
    }
  };

  const completePasswordReset = async () => {
    const verified = await verify2FACode();
    if (!verified) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentEmail);

      if (error) throw error;

      toast.success('Password reset link sent to your email');
      setShow2FA(false);
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend2FA = async () => {
    try {
      await send2FACode(currentEmail, authType);
    } catch (error) {
      // Error already handled in send2FACode
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TradeX
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="bg-card border-2 border-primary/10">
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to your TradeX account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="bg-background"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent" disabled={isLoading}>
                      {isLoading ? 'Processing...' : 'Sign In'}
                    </Button>
                    
                    <Button
                      variant="link"
                      className="w-full text-sm"
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                    >
                      Forgot password?
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="bg-card border-2 border-primary/10">
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Get started with AI-powered trading insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="bg-background"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent" disabled={isLoading}>
                      {isLoading ? 'Processing...' : 'Create Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 2FA Dialog */}
          <Dialog open={show2FA} onOpenChange={setShow2FA}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enter Verification Code</DialogTitle>
                <DialogDescription>
                  We've sent a 6-digit code to {currentEmail}. Enter it below to continue.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="2fa-code">Verification Code</Label>
                  <Input
                    id="2fa-code"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono bg-background"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Time remaining: <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                  </p>
                </div>
                <Button
                  onClick={() => {
                    if (authType === 'login') completeLogin();
                    else if (authType === 'signup') completeSignup();
                    else if (authType === 'reset-password') completePasswordReset();
                  }}
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  disabled={isLoading || twoFACode.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleResend2FA}
                  className="w-full"
                  disabled={isLoading}
                >
                  Resend Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you a verification code.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <Button onClick={handleForgotPassword} className="w-full bg-gradient-to-r from-primary to-accent" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TradeX
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered trading platform for smarter investment decisions
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Features</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Security</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">About</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Blog</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Careers</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Documentation</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">&copy; 2025 TradeX. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
