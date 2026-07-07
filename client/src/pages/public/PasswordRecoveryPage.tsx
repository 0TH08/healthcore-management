import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  // Submits email to trigger password recovery email; sent flag hides form on success
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await apiClient.post('/auth/recover-password', { email });
      setMessage(res.data.message);
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      if (axiosErr?.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        {/* Only shows the form before the email is sent (sent == false) */}
        <h1>Password Recovery</h1>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <button type="submit" className="btn btn-primary btn-block">Send Recovery Link</button>
          </form>
        ) : null}
        <div className="card-links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
