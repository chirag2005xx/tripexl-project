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
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import tt from "@tomtom-international/web-sdk-maps";

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
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const map = tt.map({
      key: "yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99",
      container: mapElement.current,
      center: [coords.lng, coords.lat],
      zoom: 10,
    });

    mapRef.current = map;

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const newWaypoint = { lat, lng };
      setWaypoints((prev) => [...prev, newWaypoint]);
      const marker = new tt.Marker().setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
    });

    return () => map.remove();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(
        `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(searchQuery)}.json?key=yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99`
      );
      const data = await res.json();
      const pos = data.results[0]?.position;
      if (pos) {
        mapRef.current.flyTo({
          center: [pos.lon, pos.lat],
          zoom: 14,
        });
      } else {
        toast({
          title: "No location found",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch {
      toast({
        title: "Search failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRoute = async () => {
    if (waypoints.length < 2) {
      toast({
        title: "Set at least 2 waypoints",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const locations = waypoints.map((wp) => `${wp.lat},${wp.lng}`).join(":");
    try {
      const res = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99&traffic=true&routeRepresentation=polyline`
      );
      const data = await res.json();

      if (data.routes && data.routes[0]) {
        const route = [];
        data.routes[0].legs.forEach((leg) => {
          leg.points.forEach((point) => {
            route.push([point.longitude, point.latitude]);
          });
        });

        const uniqueRoute = route.filter((coord, index, arr) => {
          return index === 0 || coord[0] !== arr[index - 1][0] || coord[1] !== arr[index - 1][1];
        });

        const geojson = {
          type: "Feature",
          geometry: { type: "LineString", coordinates: uniqueRoute },
        };

        if (mapRef.current.getSource("route")) {
          mapRef.current.removeLayer("route");
          mapRef.current.removeSource("route");
        }

        mapRef.current.addSource("route", { type: "geojson", data: geojson });
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#007aff", "line-width": 6, "line-opacity": 0.8 },
        });

        const bounds = new tt.LngLatBounds();
        uniqueRoute.forEach((coord) => bounds.extend(coord));
        mapRef.current.fitBounds(bounds, { padding: 50 });

        const travelTime = data.routes[0].summary.travelTimeInSeconds;
        setEta(`${Math.round(travelTime / 60)} min`);
        setRouteData({
          coordinates: uniqueRoute,
          travelTime,
          distance: data.routes[0].summary.lengthInMeters,
          summary: data.routes[0].summary,
        });
      } else {
        toast({
          title: "No route found",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch {
      toast({
        title: "Route calculation failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
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
          `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99`,
        ],
        tileSize: 256,
      });
      mapRef.current.addLayer({
        id: "traffic",
        type: "raster",
        source: "traffic",
      });
      setShowTraffic(true);
    }
  };

  const clearRoute = () => {
    setWaypoints([]);
    setEta(null);
    setRouteData(null);
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (mapRef.current.getSource("route")) {
      mapRef.current.removeLayer("route");
      mapRef.current.removeSource("route");
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

      <Box p={8} position="relative" zIndex="10">
        <VStack spacing={6}>
          <Heading
            bgGradient="linear(to-r, #E50914, #FF6B6B)"
            bgClip="text"
            fontWeight="900"
            fontSize="32px"
            letterSpacing="-0.02em"
          >
            Book a New Job
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
            <Select
              placeholder="Select vehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              bg="rgba(0,0,0,0.6)"
              color="white"
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
            />
          </SimpleGrid>

          <HStack w="100%">
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

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
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
            <Text fontWeight="bold" color="green.400">
              ETA: {eta}
            </Text>
          )}

          {waypoints.length > 0 && (
            <Text color="blue.300">
              Waypoints: {waypoints.length} (click map to add more)
            </Text>
          )}

          <Box
            ref={mapElement}
            width="100%"
            height="500px"
            border="1px solid rgba(255,255,255,0.2)"
            borderRadius="12px"
            bg="black"
          />
        </VStack>
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

export default Booking;
