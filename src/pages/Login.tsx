import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';

const Login = () => {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [authLoading, user, from, navigate]);

  if (!authLoading && user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(username, password);
    if (error) setError(error.message);
    else navigate(from, { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/aifu-logo.svg"
            alt="AIFU"
            className="inline-block w-16 h-16 rounded-2xl shadow-md mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">Turniket Tizimi</h1>
          <p className="text-muted-foreground mt-1">Admin paneliga kirish</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Login</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? 'Kirish...' : 'Kirish'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
