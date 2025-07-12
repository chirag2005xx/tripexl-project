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
  Badge
} from "@chakra-ui/react";
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

  // Load jobs from localStorage
  useEffect(() => {
    const userJobs = JSON.parse(localStorage.getItem(`jobs_${userId}`) || "[]");
    setJobs(userJobs);
  }, [userId]);

  // Initialize Google Maps
  useEffect(() => {
    if (!mapElement.current) return;

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
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
      center: { lat: 12.9716, lng: 77.5946 }, // Bangalore coordinates
      zoom: 10,
      mapTypeId: 'roadmap',
      styles: [
        {
          "featureType": "all",
          "elementType": "geometry.fill",
          "stylers": [{ "weight": "2.00" }]
        },
        {
          "featureType": "all",
          "elementType": "geometry.stroke",
          "stylers": [{ "color": "#9c9c9c" }]
        },
        {
          "featureType": "all",
          "elementType": "labels.text",
          "stylers": [{ "visibility": "on" }]
        },
        {
          "featureType": "landscape",
          "elementType": "all",
          "stylers": [{ "color": "#f2f2f2" }]
        },
        {
          "featureType": "landscape",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "landscape.man_made",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "poi",
          "elementType": "all",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "road",
          "elementType": "all",
          "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
        },
        {
          "featureType": "road",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#eeeeee" }]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#7b7b7b" }]
        },
        {
          "featureType": "road",
          "elementType": "labels.text.stroke",
          "stylers": [{ "color": "#ffffff" }]
        },
        {
          "featureType": "road.highway",
          "elementType": "all",
          "stylers": [{ "visibility": "simplified" }]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.icon",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "transit",
          "elementType": "all",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "water",
          "elementType": "all",
          "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
        },
        {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [{ "color": "#c8d7d4" }]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#070707" }]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.stroke",
          "stylers": [{ "color": "#ffffff" }]
        }
      ]
    });

    mapRef.current = map;

    // Initialize traffic layer
    trafficLayerRef.current = new window.google.maps.TrafficLayer();
    
    // Mark map as loaded
    setMapLoaded(true);
  };

  // Display jobs on map when map is loaded or jobs change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || jobs.length === 0) return;

    displayJobsOnMap();
  }, [jobs, mapLoaded]);

  const displayJobsOnMap = () => {
    if (!mapRef.current) return;

    // Clear existing markers and direction renderers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    directionsRenderersRef.current.forEach((renderer) => renderer.setMap(null));
    directionsRenderersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidBounds = false;

    jobs.forEach((job, index) => {
      if (!job.waypoints || job.waypoints.length === 0) return;

      console.log(`Processing job ${index + 1}:`, job); // Debug log

      // Create markers for each waypoint
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

      // Draw routes between waypoints if there are multiple waypoints
      if (job.waypoints.length > 1) {
        const directionsService = new window.google.maps.DirectionsService();
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: mapRef.current,
          polylineOptions: {
            strokeColor: getJobColor(index),
            strokeWeight: 4,
            strokeOpacity: 0.7
          },
          suppressMarkers: true // We're using custom markers
        });

        directionsRenderersRef.current.push(directionsRenderer);

        // Create waypoints for directions service
        const waypoints = job.waypoints.slice(1, -1).map(waypoint => ({
          location: { lat: waypoint.lat, lng: waypoint.lng },
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

  const getJobColor = (index) => {
    const colors = [
      "#007aff",
      "#28a745",
      "#dc3545",
      "#ffc107",
      "#6f42c1",
      "#20c997",
      "#fd7e14"
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

  // Refresh jobs when coming back from booking
  useEffect(() => {
    const handleStorageChange = () => {
      const userJobs = JSON.parse(localStorage.getItem(`jobs_${userId}`) || "[]");
      setJobs(userJobs);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes when the window gains focus
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, [userId]);

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      background="black"
      fontFamily="Inter, -apple-system, sans-serif"
    >
      {/* Netflix-like animated background */}
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

      {/* Dashboard content */}
      <Box p={8} position="relative" zIndex="10">
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading
              mb={2}
              fontSize="32px"
              bgGradient="linear(to-r, #E50914, #FF6B6B)"
              bgClip="text"
              fontWeight="900"
              letterSpacing="-0.025em"
            >
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
                  <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
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
                          <Box>
                            <HStack mb={2}>
                              <Text fontWeight="bold" color="white">
                                Job #{job.id}
                              </Text>
                              <Badge colorScheme="green">{job.status}</Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.400">
                              <strong>Vehicle:</strong> {job.vehicle}
                            </Text>
                            <Text fontSize="sm" color="gray.400">
                              <strong>Date:</strong> {job.date}
                            </Text>
                            <Text fontSize="sm" color="gray.400">
                              <strong>ETA:</strong> {job.eta}
                            </Text>
                            <Text fontSize="sm" color="gray.400">
                              <strong>Waypoints:</strong> {job.waypoints?.length || 0}
                            </Text>
                            <HStack mt={2}>
                              <Box
                                w="20px"
                                h="4px"
                                bg={getJobColor(index)}
                                borderRadius="2px"
                              />
                              <Text fontSize="xs" color="gray.500">
                                Route color on map
                              </Text>
                            </HStack>
                          </Box>
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={() => deleteJob(job.id)}
                          >
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