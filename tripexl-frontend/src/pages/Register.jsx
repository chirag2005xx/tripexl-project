import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Input, Heading, VStack, useToast } from '@chakra-ui/react';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      toast({ title: 'Registration successful', status: 'success', duration: 3000, isClosable: true });
      navigate('/login');
    } else {
      toast({ title: data.error || 'Registration failed', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box bg="gray.50" minH="100vh" display="flex" justifyContent="center" alignItems="center" p={4}>
      <Box bg="white" p={8} rounded="md" shadow="md" width="100%" maxW="md">
        <Heading mb={6} textAlign="center">Register</Heading>
        <form onSubmit={handleRegister}>
          <VStack spacing={4}>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              focusBorderColor="green.400"
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              focusBorderColor="green.400"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              focusBorderColor="green.400"
            />
            <Button type="submit" colorScheme="green" width="full">Register</Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}

export default Register;
