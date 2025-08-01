"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Computer, Users } from 'lucide-react';
import { signup } from '../actions'

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'member' | 'core-team'>('member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {email, password};
    try {
      console.log(data);
      signup(data);
    } catch (error) {
      console.error('Signup failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Computer className="h-12 w-12 text-neon-blue mx-auto glow-blue" />
          <h1 className="text-3xl font-bold text-neon">CSI Dashboard</h1>
          <p className="text-muted-foreground">Sign up to your account</p>
        </div>

        <Card className="bg-dark-surface border-border glow-blue">
          <CardHeader>
            <CardTitle>Welcome To CSI Portal</CardTitle>
            <CardDescription>Choose your account type and sign up</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'member' | 'core-team')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="member" className="flex items-center gap-2">
                  <Computer className="h-4 w-4" />
                  CSI Member
                </TabsTrigger>
                <TabsTrigger value="core-team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Core Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="member" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full glow-blue" 
                    // disabled={loading}
                  >
                    {/* {loading ? 'Signing in...' : 'Sign In as Member'} */}Sign Up
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="core-team" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="core-email">Email</Label>
                    <Input
                      id="core-email"
                      type="email"
                      placeholder="admin@csi.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="core-password">Password</Label>
                    <Input
                      id="core-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="w-full glow-purple" 
                    // disabled={loading}
                  >
                    {/* {loading ? 'Signing in...' : 'Sign In as Core Team'} */}
                    Sign Up
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}