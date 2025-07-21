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
  Textarea,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  Stack,
  Badge,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

function Booking() {
  // Original states
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 });
  const [waypoints, setWaypoints] = useState([]);
  const [eta, setEta] = useState(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [routeData, setRouteData] = useState(null);

  // New enhanced states
  const [vehicleId, setVehicleId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [comments, setComments] = useState("");
  const [priority, setPriority] = useState("medium");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [jobType, setJobType] = useState("delivery");
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [packageDetails, setPackageDetails] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  // Checklist states
  const [vehicleChecklist, setVehicleChecklist] = useState([]);
  const [driverChecklist, setDriverChecklist] = useState([]);
  const [preJobChecklist, setPreJobChecklist] = useState([]);
  
  // Modal states
  const { isOpen: isVehicleModalOpen, onOpen: onVehicleModalOpen, onClose: onVehicleModalClose } = useDisclosure();
  const { isOpen: isDriverModalOpen, onOpen: onDriverModalOpen, onClose: onDriverModalClose } = useDisclosure();
  const { isOpen: isPreJobModalOpen, onOpen: onPreJobModalOpen, onClose: onPreJobModalClose } = useDisclosure();

  // Vehicle checklist items
  const vehicleChecklistItems = [
    "Fuel level adequate",
    "Tire pressure checked",
    "Engine oil level",
    "Brake fluid level",
    "Windshield washer fluid",
    "Lights working (headlights, taillights, indicators)",
    "Mirrors adjusted",
    "Seat belts functional",
    "Air conditioning working",
    "GPS/Navigation system working",
    "First aid kit present",
    "Fire extinguisher present",
    "Vehicle registration documents",
    "Insurance documents",
    "Emergency contact numbers",
    "Cargo area clean and secure",
    "Spare tire available",
    "Jack and tools present",
    "Vehicle exterior clean",
    "No visible damage"
  ];

  // Driver checklist items
  const driverChecklistItems = [
    "Valid driver's license",
    "License not expired",
    "No recent traffic violations",
    "Familiar with route",
    "Emergency contacts available",
    "Company ID badge",
    "Uniform/dress code compliance",
    "Phone charged and working",
    "Cash/payment methods ready",
    "Delivery receipts/forms",
    "Pen/writing materials",
    "Customer service training completed",
    "Safety training up to date",
    "Vehicle keys collected",
    "Daily log/timesheet ready",
    "Medical fitness cleared",
    "COVID-19 safety protocols followed",
    "Weather conditions assessed",
    "Traffic conditions checked",
    "Backup plans prepared"
  ];

  // Pre-job checklist items
  const preJobChecklistItems = [
    "Job details verified",
    "Customer contact confirmed",
    "Delivery address verified",
    "Package/cargo secured",
    "Route planned and optimized",
    "Expected delivery time communicated",
    "Special instructions reviewed",
    "Payment method confirmed",
    "Backup contact numbers available",
    "Vehicle assigned and ready",
    "Driver briefed on job requirements",
    "Weather conditions acceptable",
    "Traffic conditions assessed",
    "Alternative routes identified",
    "Emergency procedures reviewed",
    "Customer availability confirmed",
    "Delivery requirements understood",
    "Insurance coverage verified",
    "Documentation complete",
    "Supervisor approval obtained"
  ];

  // Original refs
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Calculate estimated cost based on distance
  useEffect(() => {
    if (routeData && routeData.distance) {
      const baseCost = 50;
      const perKmCost = vehicle === "truck" ? 15 : vehicle === "van" ? 10 : vehicle === "car" ? 8 : 5;
      const distanceInKm = routeData.distance / 1000;
      const calculated = baseCost + (distanceInKm * perKmCost);
      setEstimatedCost(Math.round(calculated));
    }
  }, [routeData, vehicle]);

  // Load Google Maps script (original code)
  useEffect(() => {
    if (window.google) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`;
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

  // Initialize map (original code)
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

  // Handle search (original code)
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

  // Handle route (original code)
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

  // Toggle traffic (original code)
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

  // Clear route (original code)
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

  // Validation function
  const validateForm = () => {
    const errors = [];
    
    if (!vehicle) errors.push("Vehicle type is required");
    if (!date) errors.push("Date is required");
    if (!vehicleId) errors.push("Vehicle ID is required");
    if (!driverName) errors.push("Driver name is required");
    if (!driverLicense) errors.push("Driver license is required");
    if (!customerName) errors.push("Customer name is required");
    if (!customerPhone) errors.push("Customer phone is required");
    if (waypoints.length < 2) errors.push("At least 2 waypoints are required");
    if (!routeData) errors.push("Route must be calculated");
    
    return errors;
  };

  // Enhanced booking handler
  const handleBooking = () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      toast({
        title: "Please fix the following errors:",
        description: errors.join(", "),
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const newJob = {
      id: Date.now().toString(),
      userId: user.id || user.email,
      
      // Basic details
      vehicle,
      vehicleId,
      date,
      jobType,
      priority,
      
      // Driver details
      driverName,
      driverLicense,
      driverPhone,
      
      // Customer details
      customerName,
      customerPhone,
      
      // Route and location
      waypoints,
      routeData,
      eta,
      
      // Additional details
      notes,
      comments,
      packageDetails,
      specialInstructions,
      estimatedCost,
      requiresSignature,
      isUrgent,
      
      // Checklists
      vehicleChecklist,
      driverChecklist,
      preJobChecklist,
      
      // Status and timestamps
      status: "booked",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingJobs = JSON.parse(localStorage.getItem(`jobs_${newJob.userId}`) || "[]");
    existingJobs.push(newJob);
    localStorage.setItem(`jobs_${newJob.userId}`, JSON.stringify(existingJobs));

    toast({
      title: "Job booked successfully!",
      description: `${vehicle} (#${vehicleId}) booked for ${date} - Driver: ${driverName}`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    // Reset form
    clearRoute();
    setVehicle("");
    setVehicleId("");
    setDate("");
    setSearchQuery("");
    setDriverName("");
    setDriverLicense("");
    setDriverPhone("");
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setComments("");
    setPackageDetails("");
    setSpecialInstructions("");
    setJobType("delivery");
    setPriority("medium");
    setRequiresSignature(false);
    setIsUrgent(false);
    setVehicleChecklist([]);
    setDriverChecklist([]);
    setPreJobChecklist([]);
    
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  const getCompletionPercentage = (checklist, totalItems) => {
    return Math.round((checklist.length / totalItems) * 100);
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

      <Box p={8} position="relative" zIndex="10" maxW="1200px" mx="auto">
        <VStack spacing={6}>
          <HStack justify="space-between" w="100%">
            <Heading
              bgGradient="linear(to-r, #E50914, #FF6B6B)"
              bgClip="text"
              fontWeight="900"
              fontSize="32px"
              letterSpacing="-0.02em"
            >
              Book a New Job
            </Heading>
            {isUrgent && (
              <Badge colorScheme="red" fontSize="md" p={2}>
                URGENT
              </Badge>
            )}
          </HStack>

          {/* Basic Job Details */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Basic Job Details</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel color="white">Job Type</FormLabel>
                <Select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                  <option value="transport">Transport</option>
                  <option value="moving">Moving</option>
                  <option value="courier">Courier</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Vehicle Type</FormLabel>
                <Select
                  placeholder="Select vehicle"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                >
                  <option value="bike">Bike</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Vehicle ID</FormLabel>
                <Input
                  placeholder="Enter vehicle ID"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Date</FormLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Priority</FormLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color="white">Estimated Cost (₹)</FormLabel>
                <NumberInput
                  value={estimatedCost}
                  onChange={(value) => setEstimatedCost(value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </SimpleGrid>

            <HStack mt={4} spacing={6}>
              <FormControl display="flex" alignItems="center">
                
                
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel color="white" mb="0">
                  Urgent Job
                </FormLabel>
                <Switch
                  isChecked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  colorScheme="red"
                />
              </FormControl>
            </HStack>
          </Box>

          {/* Driver Details */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Driver Details</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel color="white">Driver Name</FormLabel>
                <Input
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Driver License</FormLabel>
                <Input
                  placeholder="Enter license number"
                  value={driverLicense}
                  onChange={(e) => setDriverLicense(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Driver Phone</FormLabel>
                <Input
                  placeholder="Enter phone number"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>
            </SimpleGrid>
          </Box>

          {/* Customer Details */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Customer Details</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel color="white">Customer Name</FormLabel>
                <Input
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Customer Phone</FormLabel>
                <Input
                  placeholder="Enter customer phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                />
              </FormControl>
            </SimpleGrid>
          </Box>

          {/* Package & Special Instructions */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Package & Instructions</Heading>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="white">Package Details</FormLabel>
                <Textarea
                  placeholder="Describe the package/items to be transported"
                  value={packageDetails}
                  onChange={(e) => setPackageDetails(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Special Instructions</FormLabel>
                <Textarea
                  placeholder="Any special handling or delivery instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </Box>

          {/* Checklists */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Pre-Job Checklists</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <VStack>
                <Button
                  onClick={onDriverModalOpen}
                  bg="rgba(229, 9, 20, 0.8)"
                  color="white"
                  _hover={{ bg: "rgba(229, 9, 20, 1)" }}
                  w="100%"
                >
                  Driver Checklist
                </Button>
                <Text color="white" fontSize="sm">
                  {getCompletionPercentage(driverChecklist, driverChecklistItems.length)}% Complete
                </Text>
              </VStack>

              <VStack>
                <Button
                  onClick={onPreJobModalOpen}
                  bg="rgba(229, 9, 20, 0.8)"
                  color="white"
                  _hover={{ bg: "rgba(229, 9, 20, 1)" }}
                  w="100%"
                >
                  Pre-Job Checklist
                </Button>
                <Text color="white" fontSize="sm">
                  {getCompletionPercentage(preJobChecklist, preJobChecklistItems.length)}% Complete
                </Text>
              </VStack>
            </SimpleGrid>
          </Box>

          {/* Map and Route Planning */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Route Planning</Heading>
            
            <HStack w="100%" mb={4}>
              <Input
                placeholder="Search location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="rgba(0,0,0,0.6)"
                color="white"
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

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
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

            {routeData && (
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                <Alert status="info" bg="rgba(0,0,255,0.1)" color="white">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>ETA: {eta}</AlertTitle>
                  </Box>
                </Alert>
                <Alert status="info" bg="rgba(0,0,255,0.1)" color="white">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Distance: {(routeData.distance / 1000).toFixed(1)} km</AlertTitle>
                  </Box>
                </Alert>
                <Alert status="success" bg="rgba(0,255,0,0.1)" color="white">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Cost: ₹{estimatedCost}</AlertTitle>
                  </Box>
                </Alert>
              </SimpleGrid>
            )}

            {waypoints.length > 0 && (
              <Text color="blue.300" mb={4}>
                Waypoints: {waypoints.length} (click map to add more)
              </Text>
            )}

            <Box
              ref={mapElement}
              width="100%"
              height="400px"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="12px"
              bg="black"
            />
          </Box>

          {/* Notes and Comments */}
          <Box
            bg="rgba(0,0,0,0.8)"
            p={6}
            borderRadius="12px"
            border="1px solid rgba(255,255,255,0.1)"
            w="100%"
          >
            <Heading size="md" color="white" mb={4}>Notes & Comments</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel color="white">Internal Notes</FormLabel>
                <Textarea
                  placeholder="Internal notes for the team"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                  rows={4}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white">Additional Comments</FormLabel>
                <Textarea
                  placeholder="Any additional comments or observations"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  bg="rgba(0,0,0,0.6)"
                  color="white"
                  rows={4}
                />
              </FormControl>
            </SimpleGrid>
          </Box>

          {/* Book Job Button */}
          <Button
            size="lg"
            background="linear-gradient(135deg, #e50914 0%, #b20710 100%)"
            color="white"
            _hover={{ background: "#F40612" }}
            onClick={handleBooking}
            w="100%"
            py={6}
            fontSize="xl"
            fontWeight="bold"
          >
            Book Job
          </Button>
        </VStack>
      </Box>

      {/* Vehicle Checklist Modal */}
      <Modal isOpen={isVehicleModalOpen} onClose={onVehicleModalClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Vehicle Checklist</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CheckboxGroup
              value={vehicleChecklist}
              onChange={setVehicleChecklist}
            >
              <Stack spacing={3}>
                {vehicleChecklistItems.map((item, index) => (
                  <Checkbox key={index} value={item} colorScheme="red">
                    {item}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Text mr={4}>
              {vehicleChecklist.length} of {vehicleChecklistItems.length} completed
            </Text>
            <Button colorScheme="red" onClick={onVehicleModalClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Driver Checklist Modal */}
      <Modal isOpen={isDriverModalOpen} onClose={onDriverModalClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Driver Checklist</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CheckboxGroup
              value={driverChecklist}
              onChange={setDriverChecklist}
            >
              <Stack spacing={3}>
                {driverChecklistItems.map((item, index) => (
                  <Checkbox key={index} value={item} colorScheme="red">
                    {item}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Text mr={4}>
              {driverChecklist.length} of {driverChecklistItems.length} completed
            </Text>
            <Button colorScheme="red" onClick={onDriverModalClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Pre-Job Checklist Modal */}
      <Modal isOpen={isPreJobModalOpen} onClose={onPreJobModalClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Pre-Job Checklist</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <CheckboxGroup
              value={preJobChecklist}
              onChange={setPreJobChecklist}
            >
              <Stack spacing={3}>
                {preJobChecklistItems.map((item, index) => (
                  <Checkbox key={index} value={item} colorScheme="red">
                    {item}
                  </Checkbox>
                ))}
              </Stack>
            </CheckboxGroup>
          </ModalBody>
          <ModalFooter>
            <Text mr={4}>
              {preJobChecklist.length} of {preJobChecklistItems.length} completed
            </Text>
            <Button colorScheme="red" onClick={onPreJobModalClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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