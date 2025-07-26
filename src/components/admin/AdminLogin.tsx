import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, AlertTriangle } from "lucide-react";

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error?: string | null;
}

export const AdminLogin = ({ onLogin, error }: AdminLoginProps) => {
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    onLogin(password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md space-y-6 p-8">
        <div className="space-y-4 text-center">
          <Settings className="mx-auto h-16 w-16 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">Enter admin password to continue</p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            className="h-12 text-lg"
          />
          <Button
            onClick={handleLogin}
            className="min-h-[60px] w-full bg-indigo-600 text-lg font-semibold hover:bg-indigo-700"
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
