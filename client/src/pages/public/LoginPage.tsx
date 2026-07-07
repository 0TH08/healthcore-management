import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../auth/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Redirect already-logged-in users to their role dashboard

  useEffect(() => {
    if (user) navigate(`/${user.role.toLowerCase()}`, { replace: true });
  }, [user, navigate]);

  // Calls AuthContext.login — the context handles storing token & user
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid email or password');
      }
    }
  };

  return (
    <div className="page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h1>Sign In</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
        <button type="submit" className="btn btn-primary btn-block">Sign In</button>
        <div className="card-links">
          <Link to="/register">Create an account</Link>
          <Link to="/recover-password">Forgot password?</Link>
        </div>
      </form>
    </div>
  );
}
