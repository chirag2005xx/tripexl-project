import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Input, Heading, VStack, useToast } from '@chakra-ui/react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    
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
          id: data.user?.id || data.id || email, // Use API user ID or fallback to email
          email: email,
          username: data.user?.username || data.username || email.split('@')[0],
          ...data.user // Include any other user data from API
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
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" display="flex" justifyContent="center" alignItems="center" p={4}>
      <Box bg="white" p={8} rounded="md" shadow="md" width="100%" maxW="md">
        <Heading mb={6} textAlign="center">Login</Heading>
        <form onSubmit={handleLogin}>
          <VStack spacing={4}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              focusBorderColor="blue.400"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              focusBorderColor="blue.400"
            />
            <Button type="submit" colorScheme="blue" width="full">Sign In</Button>
          </VStack>
        </form>
        
        {/* Demo credentials for testing */}
        <Box mt={4} p={3} bg="blue.50" borderRadius="md">
          <Heading size="sm" mb={2}>Demo Credentials (for testing):</Heading>
          <VStack spacing={1} fontSize="sm">
            <Box>Email: demo@example.com</Box>
            <Box>Password: demo123</Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;