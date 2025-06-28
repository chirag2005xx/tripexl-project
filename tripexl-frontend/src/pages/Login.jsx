import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast({ 
          title: 'Login successful', 
          status: 'success', 
          duration: 3000, 
          isClosable: true 
        });
        
        // Store token and user info
        localStorage.setItem('token', data.token);
        
        // Store user info (assuming the API returns user data)
        const userInfo = {
          id: data.user?.id || data.id || email,
          email: email,
          username: data.user?.username || data.username || email.split('@')[0],
          ...data.user
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        
        navigate('/dashboard');
      } else {
        toast({ 
          title: data.error || 'Login failed', 
          status: 'error', 
          duration: 3000, 
          isClosable: true 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // For development/testing - allow demo login
      if (email === 'demo@example.com' && password === 'demo123') {
        const demoUser = {
          id: 'demo_user',
          email: 'demo@example.com',
          username: 'Demo User'
        };
        
        localStorage.setItem('token', 'demo_token');
        localStorage.setItem('user', JSON.stringify(demoUser));
        
        toast({ 
          title: 'Demo login successful', 
          status: 'success', 
          duration: 3000, 
          isClosable: true 
        });
        
        navigate('/dashboard');
      } else {
        toast({ 
          title: 'Network error - please try again', 
          status: 'error', 
          duration: 3000, 
          isClosable: true 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'black',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Netflix-style background with gradient overlay */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'linear-gradient(45deg, #000000 0%, #434343 50%, #000000 100%)',
          opacity: '0.9'
        }}
      />
      
      {/* Animated background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-25%',
          width: '150%',
          height: '200%',
          background: 'radial-gradient(circle at 30% 30%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)',
          animation: 'float 20s ease-in-out infinite'
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '-20%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 70% 70%, rgba(229, 9, 20, 0.1) 0%, transparent 40%)',
          animation: 'pulse 15s ease-in-out infinite'
        }}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(2deg) scale(1.05); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .input-field {
          transition: all 0.2s ease;
        }
        
        .input-field:hover {
          border-color: rgba(255, 255, 255, 0.7);
        }
        
        .input-field:focus {
          border-color: #E50914;
          box-shadow: 0 0 0 1px #E50914;
          background: rgba(51, 51, 51, 0.9);
          outline: none;
        }
        
        .floating-label {
          transition: all 0.2s ease;
          pointer-events: none;
        }
        
        .sign-in-btn {
          transition: all 0.2s ease;
        }
        
        .sign-in-btn:hover:not(:disabled) {
          background: #F40612;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(229, 9, 20, 0.4);
        }
        
        .sign-in-btn:active:not(:disabled) {
          transform: translateY(0px);
        }
        
        .register-link:hover {
          text-decoration: underline;
          color: #E50914;
        }
      `}</style>

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: '10',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: '16px'
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '48px',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '450px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top gradient line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(to right, transparent, #E50914, transparent)'
            }}
          />

          {/* Netflix-style logo/brand */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '32px',
                background: 'linear-gradient(to right, #E50914, #FF6B6B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '900',
                letterSpacing: '-0.025em',
                marginBottom: '8px',
                margin: 0
              }}
            >
              TRIPEXL JOB DISPATCH SYSTEM
            </h1>
            <p
              style={{
                color: '#9CA3AF',
                fontSize: '14px',
                fontWeight: '500',
                margin: 0
              }}
            >
              Sign in to manage your jobs and vehicles
            </p>
          </div>

          <div onSubmit={handleLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  style={{
                    width: '100%',
                    background: 'rgba(51, 51, 51, 0.7)',
                    border: '1px solid rgba(128, 128, 128, 0.7)',
                    color: 'white',
                    fontSize: '16px',
                    height: '56px',
                    padding: '16px',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
                <label
                  className="floating-label"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: email ? '8px' : '50%',
                    transform: email ? 'translateY(0)' : 'translateY(-50%)',
                    fontSize: email ? '12px' : '16px',
                    color: email ? '#E50914' : '#9CA3AF',
                    fontWeight: '500'
                  }}
                >
                  Email address
                </label>
              </div>

              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  style={{
                    width: '100%',
                    background: 'rgba(51, 51, 51, 0.7)',
                    border: '1px solid rgba(128, 128, 128, 0.7)',
                    color: 'white',
                    fontSize: '16px',
                    height: '56px',
                    padding: '16px',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
                <label
                  className="floating-label"
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: password ? '8px' : '50%',
                    transform: password ? 'translateY(0)' : 'translateY(-50%)',
                    fontSize: password ? '12px' : '16px',
                    color: password ? '#E50914' : '#9CA3AF',
                    fontWeight: '500'
                  }}
                >
                  Password
                </label>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="sign-in-btn"
                style={{
                  width: '100%',
                  height: '56px',
                  background: '#E50914',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: '16px', margin: 0 }}>
              New to Tripexl?{' '}
              <span
                onClick={handleRegisterClick}
                className="register-link"
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
              >
                Sign up now
              </span>
            </p>
          </div>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px',
              background: 'rgba(229, 9, 20, 0.1)',
              border: '1px solid rgba(229, 9, 20, 0.3)',
              borderRadius: '8px',
              backdropFilter: 'blur(5px)'
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                color: '#E50914',
                marginBottom: '12px',
                fontWeight: 'bold',
                margin: '0 0 12px 0'
              }}
            >
              Demo Access
            </h3>
            <div style={{ fontSize: '14px', color: '#D1D5DB' }}>
              <div style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#9CA3AF', marginRight: '8px' }}>Email:</span>
                <span style={{ color: 'white' }}>demo@example.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: '#9CA3AF', marginRight: '8px' }}>Password:</span>
                <span style={{ color: 'white' }}>demo123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;