import { Box, Heading, Button, Text, VStack, HStack, Grid, GridItem, Card, CardBody, Badge, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import tt from "@tomtom-international/web-sdk-maps";

function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [showTraffic, setShowTraffic] = useState(false);
  
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Get user info
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user.email;

  // Load user's jobs
  useEffect(() => {
    const userJobs = JSON.parse(localStorage.getItem(`jobs_${userId}`) || "[]");
    setJobs(userJobs);
  }, [userId]);

  // Initialize map
  useEffect(() => {
    if (!mapElement.current) return;

    const map = tt.map({
      key: "yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99",
      container: mapElement.current,
      center: [77.5946, 12.9716], // Bangalore default
      zoom: 10,
    });

    mapRef.current = map;

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Display all jobs on map
  useEffect(() => {
    if (!mapRef.current || jobs.length === 0) return;

    // Clear existing markers and routes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Remove existing route layers
    jobs.forEach((_, index) => {
      const routeId = `route-${index}`;
      if (mapRef.current.getSource(routeId)) {
        mapRef.current.removeLayer(routeId);
        mapRef.current.removeSource(routeId);
      }
    });

    const allBounds = new tt.LngLatBounds();
    let hasValidBounds = false;

    jobs.forEach((job, index) => {
      if (!job.routeData || !job.waypoints) return;

      // Add route to map
      const routeId = `route-${index}`;
      const geojson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: job.routeData.coordinates,
        },
      };

      mapRef.current.addSource(routeId, { type: "geojson", data: geojson });
      mapRef.current.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": getJobColor(index),
          "line-width": 4,
          "line-opacity": 0.7
        },
      });

      // Add markers for waypoints
      job.waypoints.forEach((waypoint, wpIndex) => {
        const isStart = wpIndex === 0;
        const isEnd = wpIndex === job.waypoints.length - 1;
        
        let markerColor = "#007aff";
        if (isStart) markerColor = "#28a745"; // Green for start
        if (isEnd) markerColor = "#dc3545"; // Red for end

        const marker = new tt.Marker({ color: markerColor })
          .setLngLat([waypoint.lng, waypoint.lat])
          .addTo(mapRef.current);

        // Add popup with job info
        const popup = new tt.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 10px;">
            <h4>Job #${job.id}</h4>
            <p><strong>Vehicle:</strong> ${job.vehicle}</p>
            <p><strong>Date:</strong> ${job.date}</p>
            <p><strong>ETA:</strong> ${job.eta}</p>
            <p><strong>Status:</strong> ${job.status}</p>
          </div>
        `);

        marker.setPopup(popup);
        markersRef.current.push(marker);

        // Extend bounds
        allBounds.extend([waypoint.lng, waypoint.lat]);
        hasValidBounds = true;
      });
    });

    // Fit map to show all routes
    if (hasValidBounds) {
      mapRef.current.fitBounds(allBounds, { padding: 50 });
    }
  }, [jobs]);

  // Get different colors for different job routes
  const getJobColor = (index) => {
    const colors = ["#007aff", "#28a745", "#dc3545", "#ffc107", "#6f42c1", "#20c997", "#fd7e14"];
    return colors[index % colors.length];
  };

  // Toggle traffic overlay
  const toggleTraffic = () => {
    if (!mapRef.current) return;
    
    if (showTraffic) {
      if (mapRef.current.getLayer("traffic")) {
        mapRef.current.removeLayer("traffic");
        mapRef.current.removeSource("traffic");
      }
      setShowTraffic(false);
    } else {
      mapRef.current.addSource("traffic", {
        type: "raster",
        tiles: [
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99`
        ],
        tileSize: 256
      });
      
      mapRef.current.addLayer({
        id: "traffic",
        type: "raster",
        source: "traffic"
      });
      setShowTraffic(true);
    }
  };

  // Delete a job
  const deleteJob = (jobId) => {
    const updatedJobs = jobs.filter(job => job.id !== jobId);
    setJobs(updatedJobs);
    localStorage.setItem(`jobs_${userId}`, JSON.stringify(updatedJobs));
  };

  return (
    <Box p={8}>
      <Heading mb={4}>Welcome, {user.username || user.email || "User"} 👋</Heading>
      <Text mb={6}>Manage your jobs and view your routes on the map below.</Text>
      
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
        {/* Left side - Job list and actions */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            <Button colorScheme="green" size="lg" onClick={() => navigate("/booking")}>
              Book a New Job
            </Button>
            
            <Box>
              <Heading size="md" mb={4}>Your Jobs ({jobs.length})</Heading>
              {jobs.length === 0 ? (
                <Text color="gray.500">No jobs booked yet. Click "Book a New Job" to get started!</Text>
              ) : (
                <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                  {jobs.map((job, index) => (
                    <Card key={job.id} size="sm">
                      <CardBody>
                        <Flex justify="space-between" align="start">
                          <Box>
                            <HStack mb={2}>
                              <Text fontWeight="bold">Job #{job.id}</Text>
                              <Badge colorScheme="green">{job.status}</Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              <strong>Vehicle:</strong> {job.vehicle}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>Date:</strong> {job.date}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>ETA:</strong> {job.eta}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              <strong>Waypoints:</strong> {job.waypoints?.length || 0}
                            </Text>
                            <HStack mt={2}>
                              <Box w="20px" h="4px" bg={getJobColor(index)} borderRadius="2px" />
                              <Text fontSize="xs" color="gray.500">Route color on map</Text>
                            </HStack>
                          </Box>
                          <Button size="xs" colorScheme="red" onClick={() => deleteJob(job.id)}>
                            Delete
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </GridItem>

        {/* Right side - Map */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Heading size="md">Jobs Map</Heading>
              <Button size="sm" colorScheme="orange" onClick={toggleTraffic}>
                {showTraffic ? "Hide Traffic" : "Show Traffic"}
              </Button>
            </HStack>
            
            <Box
              ref={mapElement}
              width="100%"
              height="500px"
              border="1px solid gray"
              borderRadius="md"
              bg="gray.100"
            />
            
            {jobs.length > 0 && (
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.700">
                  <strong>Map Legend:</strong> Green markers = Start points, Red markers = End points. 
                  Each job has a different colored route. Click markers for job details.
                </Text>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default Dashboard;