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
import tt from "@tomtom-international/web-sdk-maps";

function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [showTraffic, setShowTraffic] = useState(false);

  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user.email;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const userJobs = JSON.parse(localStorage.getItem(`jobs_${userId}`) || "[]");
    setJobs(userJobs);
  }, [userId]);

  useEffect(() => {
    if (!mapElement.current) return;

    const map = tt.map({
      key: "yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99",
      container: mapElement.current,
      center: [77.5946, 12.9716],
      zoom: 10
    });

    mapRef.current = map;

    return () => {
      if (map) map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || jobs.length === 0) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

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

      const routeId = `route-${index}`;
      const geojson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: job.routeData.coordinates
        }
      };

      mapRef.current.addSource(routeId, { type: "geojson", data: geojson });
      mapRef.current.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": getJobColor(index),
          "line-width": 4,
          "line-opacity": 0.7
        }
      });

      job.waypoints.forEach((waypoint, wpIndex) => {
        const isStart = wpIndex === 0;
        const isEnd = wpIndex === job.waypoints.length - 1;

        let markerColor = "#007aff";
        if (isStart) markerColor = "#28a745";
        if (isEnd) markerColor = "#dc3545";

        const marker = new tt.Marker({ color: markerColor })
          .setLngLat([waypoint.lng, waypoint.lat])
          .addTo(mapRef.current);

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

        allBounds.extend([waypoint.lng, waypoint.lat]);
        hasValidBounds = true;
      });
    });

    if (hasValidBounds) {
      mapRef.current.fitBounds(allBounds, { padding: 50 });
    }
  }, [jobs]);

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

  const deleteJob = (jobId) => {
    const updatedJobs = jobs.filter((job) => job.id !== jobId);
    setJobs(updatedJobs);
    localStorage.setItem(`jobs_${userId}`, JSON.stringify(updatedJobs));
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

              {jobs.length > 0 && (
                <Box
                  p={3}
                  background="rgba(229, 9, 20, 0.1)"
                  border="1px solid rgba(229, 9, 20, 0.3)"
                  borderRadius="8px"
                  backdropFilter="blur(5px)"
                >
                  <Text fontSize="sm" color="white">
                    <strong>Map Legend:</strong> Green markers = Start points, Red markers = End points. Each job has a different colored route. Click markers for job details.
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
