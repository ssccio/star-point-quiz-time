import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
}

export const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Settings className="w-16 h-16 text-indigo-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Enter admin password to continue</p>
        </div>
        
        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            className="h-12 text-lg"
          />
          <Button 
            onClick={handleLogin}
            className="w-full min-h-[60px] text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
          >
            Access Admin Panel
          </Button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>Demo password: admin123</p>
        </div>
      </Card>
    </div>
  );
};