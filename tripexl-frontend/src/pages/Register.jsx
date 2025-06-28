import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  useToast,
  Text,
} from "@chakra-ui/react";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  const handleRegister = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/auth/register`,   // 👈 changed
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      }
    );

    const data = await res.json();
    if (res.ok) {
      toast({
        title: "Registration successful! Please login.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/login");
    } else {
      toast({
        title: data.error || "Registration failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    toast({
      title: "Network error - please try again",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
};


  return (
    <Box
      minH="100vh"
      position="relative"
      display="flex"
      alignItems="center"
      justifyContent="center"
      background="black"
      fontFamily="Inter, -apple-system, sans-serif"
    >
      {/* Netflix style animated background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        background="linear-gradient(45deg, #000000 0%, #141414 50%, #000000 100%)"
        opacity="0.9"
        zIndex="0"
      />
      <Box
        position="absolute"
        top="-50%"
        left="-25%"
        width="150%"
        height="200%"
        background="radial-gradient(circle at 30% 30%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)"
        animation="float 20s ease-in-out infinite"
        zIndex="0"
      />
      <Box
        position="absolute"
        top="20%"
        right="-20%"
        width="100%"
        height="100%"
        background="radial-gradient(circle at 70% 70%, rgba(229, 9, 20, 0.1) 0%, transparent 40%)"
        animation="pulse 15s ease-in-out infinite"
        zIndex="0"
      />

      {/* Form container */}
      <Box
        bg="rgba(0,0,0,0.8)"
        p={8}
        rounded="lg"
        shadow="lg"
        width="100%"
        maxW="md"
        position="relative"
        zIndex="10"
      >
        <Heading
          mb={6}
          textAlign="center"
          fontWeight="900"
          fontSize="32px"
          letterSpacing="-0.02em"
          bgGradient="linear(to-r, #E50914, #FF6B6B)"
          bgClip="text"
        >
          Register
        </Heading>
        <form onSubmit={handleRegister}>
          <VStack spacing={4}>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              bg="rgba(0,0,0,0.6)"
              color="white"
              focusBorderColor="red.400"
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              bg="rgba(0,0,0,0.6)"
              color="white"
              focusBorderColor="red.400"
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              bg="rgba(0,0,0,0.6)"
              color="white"
              focusBorderColor="red.400"
            />
            <Button
              type="submit"
              width="full"
              background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
              color="white"
              _hover={{ background: "#F40612" }}
            >
              Register
            </Button>
          </VStack>
        </form>

        {/* Back to login */}
        <Box mt={6} textAlign="center">
          <Text color="gray.400">
            Already have an account?{" "}
            <Link to="/login">
              <Button variant="link" color="red.400" fontWeight="bold">
                Login here
              </Button>
            </Link>
          </Text>
        </Box>
      </Box>

      {/* keyframes for floating effect */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(2deg) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
      `}</style>
    </Box>
  );
}

export default Register;
