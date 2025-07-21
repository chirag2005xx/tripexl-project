import {
  Box,
  Heading,
  Button,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Flex,
  Badge,
  Tooltip,
  Progress,
  Divider,
  Icon
} from "@chakra-ui/react";
import { FaSignature, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [showTraffic, setShowTraffic] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRenderersRef = useRef([]);
  const trafficLayerRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user.email;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  function getCompletion(checklist, total) {
    return Math.round(((checklist?.length || 0) / (total || 1)) * 100);
  }

  useEffect(() => {
    const userJobs = JSON.parse(localStorage.getItem(`jobs_${userId}`) || "[]");
    setJobs(userJobs);
  }, [userId]);

  useEffect(() => {
    if (!mapElement.current) return;

    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.onload = initializeMap;
    script.onerror = () => {
      console.error('Failed to load Google Maps');
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.google || !mapElement.current) return;
    const map = new window.google.maps.Map(mapElement.current, {
      center: { lat: 12.9716, lng: 77.5946 }, // Bangalore
      zoom: 10,
      mapTypeId: 'roadmap',
      styles: [
        // Add your map styles here or keep it empty...
      ]
    });

    mapRef.current = map;
    trafficLayerRef.current = new window.google.maps.TrafficLayer();
    setMapLoaded(true);
  };

  // --- FULL MAP JOBS VISUALIZATION LOGIC ---
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || jobs.length === 0) return;
    displayJobsOnMap();
    // eslint-disable-next-line
  }, [jobs, mapLoaded]);

  const displayJobsOnMap = () => {
    if (!mapRef.current) return;

    // Clear previous markers and directions
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    directionsRenderersRef.current.forEach(renderer => renderer.setMap(null));
    directionsRenderersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    jobs.forEach((job, index) => {
      if (!job.waypoints || job.waypoints.length === 0) return;

      // Markers for each waypoint
      job.waypoints.forEach((waypoint, wpIndex) => {
        const isStart = wpIndex === 0;
        const isEnd = wpIndex === job.waypoints.length - 1;

        let iconColor = "#007aff";
        let iconLabel = "•";
        if (isStart) {
          iconColor = "#28a745";
          iconLabel = "S";
        }
        if (isEnd) {
          iconColor = "#dc3545";
          iconLabel = "E";
        }

        const marker = new window.google.maps.Marker({
          position: { lat: waypoint.lat, lng: waypoint.lng },
          map: mapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: iconColor,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          label: {
            text: iconLabel,
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px;">
              <h4>Job #${job.id}</h4>
              <p><strong>Vehicle:</strong> ${job.vehicle}</p>
              <p><strong>Date:</strong> ${job.date}</p>
              <p><strong>ETA:</strong> ${job.eta}</p>
              <p><strong>Status:</strong> ${job.status}</p>
              <p><strong>Waypoint:</strong> ${wpIndex + 1} of ${job.waypoints.length}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend({ lat: waypoint.lat, lng: waypoint.lng });
        hasValidBounds = true;
      });

      // Draw route (polyline) between waypoints if more than 1
      if (job.waypoints.length > 1) {
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: mapRef.current,
          polylineOptions: {
            strokeColor: getJobColor(index),
            strokeWeight: 4,
            strokeOpacity: 0.7
          },
          suppressMarkers: true
        });

        directionsRenderersRef.current.push(directionsRenderer);

        const waypoints = job.waypoints.slice(1, -1).map(wp => ({
          location: { lat: wp.lat, lng: wp.lng },
          stopover: true
        }));

        directionsService.route({
          origin: { lat: job.waypoints[0].lat, lng: job.waypoints[0].lng },
          destination: {
            lat: job.waypoints[job.waypoints.length - 1].lat,
            lng: job.waypoints[job.waypoints.length - 1].lng
          },
          waypoints: waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false
        }, (result, status) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
          } else {
            console.error('Directions request failed due to ' + status);
          }
        });
      }
    });

    if (hasValidBounds) {
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  };
  // --- END FULL MAP JOBS VISUALIZATION ---

  const getJobColor = (index) => {
    const colors = [
      "#007aff", "#28a745", "#dc3545", "#ffc107", "#6f42c1", "#20c997", "#fd7e14"
    ];
    return colors[index % colors.length];
  };

  const toggleTraffic = () => {
    if (!mapRef.current || !trafficLayerRef.current) return;
    if (showTraffic) {
      trafficLayerRef.current.setMap(null);
      setShowTraffic(false);
    } else {
      trafficLayerRef.current.setMap(mapRef.current);
      setShowTraffic(true);
    }
  };

  const deleteJob = (jobId) => {
    const updatedJobs = jobs.filter((job) => job.id !== jobId);
    setJobs(updatedJobs);
    localStorage.setItem(`jobs_${userId}`, JSON.stringify(updatedJobs));
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const userJobs = JSON.parse(localStorage.getItem(`jobs_${userId}`) || "[]");
      setJobs(userJobs);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [userId]);

  const driverChecklistTotal = 20;
  const preJobChecklistTotal = 20;
  const vehicleChecklistTotal = 19;

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case "urgent": return "red";
      case "high": return "orange";
      case "medium": return "yellow";
      case "low": return "blue";
      default: return "gray";
    }
  };

  const jobTypeColor = (type) => {
    switch ((type || '').toLowerCase()) {
      case "delivery": return "purple";
      case "pickup": return "cyan";
      case "transport": return "teal";
      case "moving": return "orange";
      case "courier": return "purple";
      default: return "gray";
    }
  };

  return (
    <Box minH="100vh" position="relative" overflow="hidden" background="black" fontFamily="Inter, -apple-system, sans-serif">
      {/* Animated BG */}
      <Box position="absolute" top="0" left="0" right="0" bottom="0" background="linear-gradient(45deg, #000000 0%, #141414 50%, #000000 100%)" opacity="0.9" zIndex="0" />
      <Box position="absolute" top="-50%" left="-25%" width="150%" height="200%" background="radial-gradient(circle at 30% 30%, rgba(229, 9, 20, 0.15) 0%, transparent 50%)" animation="float 20s ease-in-out infinite" zIndex="0" />
      <Box position="absolute" top="20%" right="-20%" width="100%" height="100%" background="radial-gradient(circle at 70% 70%, rgba(229, 9, 20, 0.1) 0%, transparent 40%)" animation="pulse 15s ease-in-out infinite" zIndex="0" />

      {/* Dashboard content */}
      <Box p={8} position="relative" zIndex="10">
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading mb={2} fontSize="32px" bgGradient="linear(to-r, #E50914, #FF6B6B)" bgClip="text" fontWeight="900" letterSpacing="-0.025em">
              Welcome, {user.username || user.email || "User"} 👋
            </Heading>
            <Text color="gray.300">
              Manage your jobs and view your routes on the map below.
            </Text>
          </Box>
          <Button
            background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
            color="white"
            _hover={{
              background: "#F40612",
              transform: "translateY(-2px)",
              boxShadow: "0 12px 40px rgba(229, 9, 20, 0.4)"
            }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Flex>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Job list */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Button
                background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
                color="white"
                _hover={{
                  background: "#F40612",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 40px rgba(229, 9, 20, 0.4)"
                }}
                size="lg"
                onClick={() => navigate("/booking")}
              >
                Book a New Job
              </Button>
              <Box>
                <Heading size="md" mb={4} color="white">
                  Your Jobs ({jobs.length})
                </Heading>
                {jobs.length === 0 ? (
                  <Text color="gray.500">
                    No jobs booked yet. Click "Book a New Job" to get started!
                  </Text>
                ) : (
                  <VStack spacing={3} align="stretch" maxH="600px" overflowY="auto">
                    {jobs.map((job, index) => (
                      <Box
                        key={job.id}
                        background="rgba(0,0,0,0.6)"
                        backdropFilter="blur(8px)"
                        border="1px solid rgba(255,255,255,0.2)"
                        borderRadius="12px"
                        p={4}
                        boxShadow="0 8px 32px rgba(0,0,0,0.3)"
                      >
                        <Flex justify="space-between" align="start">
                          <Box w="100%">
                            {/* High-level Row */}
                            <HStack mb={2} wrap="wrap" align="center" spacing={2}>
                              <Text fontWeight="bold" color="white" fontSize="lg">
                                Job #{job.id}
                              </Text>
                              <Badge colorScheme="green">{job.status || 'booked'}</Badge>
                              {/* Priority badge */}
                              <Badge colorScheme={getPriorityColor(job.priority)}>{(job.priority || "Medium").toUpperCase()}</Badge>
                              {/* Job Type badge */}
                              <Badge colorScheme={jobTypeColor(job.jobType)}>{job.jobType || 'delivery'}</Badge>
                              {/* Urgent? */}
                              {job.isUrgent && (
                                <Tooltip label="Urgent Job">
                                  <Badge colorScheme="red" ml={1} px={2}>
                                    <Flex align="center" gap={1}>
                                      <Icon as={FaExclamationTriangle} mr={1} /> URGENT
                                    </Flex>
                                  </Badge>
                                </Tooltip>
                              )}
                              {/* Signature */}
                              {job.requiresSignature && (
                                <Tooltip label="Requires receiver signature">
                                  <Badge colorScheme="purple" ml={1}>
                                    <Icon as={FaSignature} mr={1} /> Signature
                                  </Badge>
                                </Tooltip>
                              )}
                            </HStack>
                            {/* Vehicle details */}
                            <HStack spacing={2} mb={1}>
                              <Text color="gray.400" fontSize="sm">
                                <strong>Vehicle:</strong> {job.vehicle} <strong>ID:</strong> {job.vehicleId}
                              </Text>
                              <Text color="gray.400" fontSize="sm">
                                <strong>Date:</strong> {job.date}
                              </Text>
                              <Text color="gray.400" fontSize="sm">
                                <strong>ETA:</strong> {job.eta}
                              </Text>
                              <Text color="gray.400" fontSize="sm">
                                <strong>Cost:</strong> ₹{job.estimatedCost}
                              </Text>
                            </HStack>
                            {/* Waypoints & Route */}
                            <HStack mb={1}>
                              <Text color="gray.400" fontSize="sm">
                                <strong>Waypoints:</strong> {job.waypoints?.length || 0}
                              </Text>
                              <Box w="16px" h="4px" bg={getJobColor(index)} borderRadius="2px" />
                              <Text fontSize="xs" color="gray.500">
                                Map color
                              </Text>
                            </HStack>
                            {/* Driver info */}
                            <HStack mb={1} spacing={4}>
                              <Text color="gray.500" fontSize="sm">
                                <strong>Driver:</strong> {job.driverName} ({job.driverLicense || "N/A"})
                                {job.driverPhone && " | "}<strong>{job.driverPhone}</strong>
                              </Text>
                              <Text color="gray.500" fontSize="sm">
                                <strong>Customer:</strong> {job.customerName} {job.customerPhone && `(${job.customerPhone})`}
                              </Text>
                            </HStack>
                            {/* Checklist completion */}
                            <HStack mb={2}>
                              <Tooltip label="Vehicle Checklist">
                                <Progress
                                  value={getCompletion(job.vehicleChecklist, vehicleChecklistTotal)}
                                  colorScheme="blue"
                                  size="sm"
                                  borderRadius="md"
                                  minW="60px"
                                  maxW="100px"
                                />
                              </Tooltip>
                              <Tooltip label="Driver Checklist">
                                <Progress
                                  value={getCompletion(job.driverChecklist, driverChecklistTotal)}
                                  colorScheme="pink"
                                  size="sm"
                                  borderRadius="md"
                                  minW="60px"
                                  maxW="100px"
                                />
                              </Tooltip>
                              <Tooltip label="Pre-Job Checklist">
                                <Progress
                                  value={getCompletion(job.preJobChecklist, preJobChecklistTotal)}
                                  colorScheme="green"
                                  size="sm"
                                  borderRadius="md"
                                  minW="60px"
                                  maxW="100px"
                                />
                              </Tooltip>
                            </HStack>
                            {/* Divider */}
                            <Divider borderColor="rgba(255,255,255,0.08)" my={2} />
                            {/* Package/instructions */}
                            {job.packageDetails && (
                              <Text color="gray.200" fontSize="sm" mb={1}>
                                <strong>Package:</strong> {job.packageDetails}
                              </Text>
                            )}
                            {job.specialInstructions && (
                              <Text color="gray.200" fontSize="sm" mb={1}>
                                <strong>Instructions:</strong> {job.specialInstructions}
                              </Text>
                            )}
                            {/* Notes/comments */}
                            {job.notes && (
                              <Text color="yellow.200" fontSize="xs" mb={1}>
                                <strong>Notes:</strong> {job.notes}
                              </Text>
                            )}
                            {job.comments && (
                              <Text color="cyan.200" fontSize="xs" mb={1}>
                                <strong>Comments:</strong> {job.comments}
                              </Text>
                            )}
                          </Box>
                          <Button size="xs" colorScheme="red" onClick={() => deleteJob(job.id)}>
                            Delete
                          </Button>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            </VStack>
          </GridItem>

          {/* Map */}
          <GridItem>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Heading size="md" color="white">
                  Jobs Map
                </Heading>
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={toggleTraffic}
                >
                  {showTraffic ? "Hide Traffic" : "Show Traffic"}
                </Button>
              </HStack>
              <Box
                ref={mapElement}
                width="100%"
                height="500px"
                border="1px solid rgba(255,255,255,0.2)"
                borderRadius="12px"
                bg="black"
              />
              {!mapLoaded && (
                <Text color="gray.500" textAlign="center">
                  Loading map...
                </Text>
              )}
              {jobs.length > 0 && (
                <Box
                  p={3}
                  background="rgba(229, 9, 20, 0.1)"
                  border="1px solid rgba(229, 9, 20, 0.3)"
                  borderRadius="8px"
                  backdropFilter="blur(5px)"
                >
                  <Text fontSize="sm" color="white">
                    <strong>Map Legend:</strong> Green markers (S) = Start points, Red markers (E) = End points. Each job has a different colored route. Click markers for job details.
                  </Text>
                </Box>
              )}
            </VStack>
          </GridItem>
        </Grid>
      </Box>

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

export default Dashboard;
