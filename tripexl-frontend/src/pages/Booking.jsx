import {
  Box,
  VStack,
  Button,
  Input,
  Select,
  Text,
  useToast,
  Heading,
  HStack,
  SimpleGrid,
  Flex, // Import Flex for side-by-side layout
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Booking() {
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [waypoints, setWaypoints] = useState([]);
  const [eta, setEta] = useState(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [routeData, setRouteData] = useState(null);

  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_Maps_API_KEY}&libraries=geometry,places`;
    script.async = true;
    script.onload = initializeMap;
    script.onerror = () => {
      toast({
        title: "Failed to load Google Maps",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
      center: { lat: coords.lat, lng: coords.lng },
      zoom: 10,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }]
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242f3e" }]
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }]
        },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }]
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }]
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" }]
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76" }]
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }]
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }]
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }]
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" }]
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" }]
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" }]
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948" }]
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }]
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }]
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d" }]
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#17263c" }]
        }
      ]
    });

    mapRef.current = map;

    // Initialize directions service and renderer
    directionsServiceRef.current = new window.google.maps.DirectionsService();
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      draggable: true,
      polylineOptions: {
        strokeColor: "#007aff",
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    // Initialize traffic layer
    trafficLayerRef.current = new window.google.maps.TrafficLayer();

    // Add click listener to add waypoints
    map.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const newWaypoint = { lat, lng };
      setWaypoints((prev) => [...prev, newWaypoint]);

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: `Waypoint ${waypoints.length + 1}`
      });
      markersRef.current.push(marker);
    });
  };

  const handleSearch = async () => {
    if (!searchQuery || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();

    try {
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({ address: searchQuery }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error('No results found'));
          }
        });
      });

      const location = results[0].geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(14);

    } catch (error) {
      toast({
        title: "No location found",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRoute = async () => {
    if (waypoints.length < 2 || !directionsServiceRef.current || !directionsRendererRef.current) {
      toast({
        title: "Set at least 2 waypoints",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const waypointsForRoute = waypoints.slice(1, -1).map(wp => ({
      location: new window.google.maps.LatLng(wp.lat, wp.lng),
      stopover: true
    }));

    try {
      const result = await new Promise((resolve, reject) => {
        directionsServiceRef.current.route({
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          waypoints: waypointsForRoute,
          optimizeWaypoints: true,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false
        }, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error('Directions request failed'));
          }
        });
      });

      directionsRendererRef.current.setDirections(result);
      directionsRendererRef.current.setMap(mapRef.current);

      // Calculate total duration and distance
      let totalDuration = 0;
      let totalDistance = 0;

      result.routes[0].legs.forEach(leg => {
        totalDuration += leg.duration.value;
        totalDistance += leg.distance.value;
      });

      setEta(`${Math.round(totalDuration / 60)} min`);
      setRouteData({
        directions: result,
        travelTime: totalDuration,
        distance: totalDistance,
        summary: {
          travelTimeInSeconds: totalDuration,
          lengthInMeters: totalDistance
        }
      });

    } catch (error) {
      toast({
        title: "Route calculation failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleTraffic = () => {
    if (!trafficLayerRef.current) return;

    if (showTraffic) {
      trafficLayerRef.current.setMap(null);
      setShowTraffic(false);
    } else {
      trafficLayerRef.current.setMap(mapRef.current);
      setShowTraffic(true);
    }
  };

  const clearRoute = () => {
    setWaypoints([]);
    setEta(null);
    setRouteData(null);

    // Clear markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Clear directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }
  };

  const handleBooking = () => {
    if (!vehicle || !date || waypoints.length < 2 || !routeData) {
      toast({
        title: "Please complete all details and calculate the route",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const newJob = {
      id: Date.now().toString(),
      userId: user.id || user.email,
      vehicle,
      date,
      waypoints,
      routeData,
      eta,
      status: "booked",
      createdAt: new Date().toISOString(),
    };

    const existingJobs = JSON.parse(localStorage.getItem(`jobs_${newJob.userId}`) || "[]");
    existingJobs.push(newJob);
    localStorage.setItem(`jobs_${newJob.userId}`, JSON.stringify(existingJobs));

    toast({
      title: "Job booked successfully",
      description: `${vehicle} booked for ${date}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    clearRoute();
    setVehicle("");
    setDate("");
    setSearchQuery("");
    setTimeout(() => navigate("/dashboard"), 2000);
  };

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

      <Flex p={8} position="relative" zIndex="10" direction={{ base: "column", md: "row" }} spacing={8}>
        {/* Left Section: Booking Controls */}
        <VStack spacing={6} align="stretch" flex="1" mr={{ md: 8 }}>
          <Heading
            bgGradient="linear(to-r, #E50914, #FF6B6B)"
            bgClip="text"
            fontWeight="900"
            fontSize="32px"
            letterSpacing="-0.02em"
          >
            Book a New Job
          </Heading>

          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
            <Select
              placeholder="Select vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              bg="rgba(0,0,0,0.6)"
              color="white"
              _placeholder={{ color: "gray.400" }}
            >
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="truck">Truck</option>
              <option value="bike">Bike</option>
            </Select>

            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              bg="rgba(0,0,0,0.6)"
              color="white"
              _placeholder={{ color: "gray.400" }}
            />
          </SimpleGrid>

          <HStack>
            <Input
              placeholder="Search location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="rgba(0,0,0,0.6)"
              color="white"
              _placeholder={{ color: "gray.400" }}
            />
            <Button
              background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
              color="white"
              _hover={{ background: "#F40612" }}
              onClick={handleSearch}
            >
              Search
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
            <Button
              background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
              color="white"
              onClick={handleRoute}
            >
              Calculate Route
            </Button>
            <Button colorScheme="orange" onClick={toggleTraffic}>
              {showTraffic ? "Hide Traffic" : "Show Traffic"}
            </Button>
            <Button colorScheme="red" onClick={clearRoute}>
              Clear Route
            </Button>
          </SimpleGrid>

          <Button
            size="lg"
            background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
            color="white"
            onClick={handleBooking}
          >
            Book Job
          </Button>

          {eta && (
            <Text fontWeight="bold" color="green.400" textAlign="center">
              ETA: {eta}
            </Text>
          )}

          {waypoints.length > 0 && (
            <Text color="blue.300" textAlign="center">
              Waypoints: {waypoints.length} (click map to add more)
            </Text>
          )}
        </VStack>

        {/* Right Section: Map */}
        <Box
          ref={mapElement}
          flex="2" // Map takes more space
          height={{ base: "400px", md: "700px" }} // Responsive height
          border="1px solid rgba(255,255,255,0.2)"
          borderRadius="12px"
          bg="black"
        />
      </Flex>

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

export default Booking;