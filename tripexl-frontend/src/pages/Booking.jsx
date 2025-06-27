import { Box, VStack, Button, Input, Select, Text, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import tt from "@tomtom-international/web-sdk-maps";
import * as ttServices from "@tomtom-international/web-sdk-services";

function Booking() {
  const [vehicle, setVehicle] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore default
  const [waypoints, setWaypoints] = useState([]); // for multiple pins
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

    // click to add multiple waypoints
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      const newWaypoint = { lat, lng };
      setWaypoints((prev) => [...prev, newWaypoint]);
      const marker = new tt.Marker().setLngLat([lng, lat]).addTo(map);
      markersRef.current.push(marker);
      console.log("Added waypoint:", newWaypoint);
    });

    return () => map.remove();
  }, []);

  // search location
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
        alert("No location found");
      }
    } catch (err) {
      console.error("Search error", err);
      alert("Search failed, try again.");
    }
  };

  // calculate route and ETA
  const handleRoute = async () => {
    if (waypoints.length < 2) {
      alert("Please set at least 2 points (click on map).");
      return;
    }
    const locations = waypoints.map((wp) => `${wp.lat},${wp.lng}`).join(":");
    try {
      const res = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?key=yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99&traffic=true&routeRepresentation=polyline`
      );
      const data = await res.json();
      console.log("Route data", data);

      if (data.routes && data.routes[0]) {
        // Get the route coordinates from the guidance points
        const route = [];
        data.routes[0].legs.forEach(leg => {
          leg.points.forEach(point => {
            route.push([point.longitude, point.latitude]);
          });
        });

        // Also add guidance instruction points for better route visibility
        if (data.routes[0].guidance && data.routes[0].guidance.instructions) {
          data.routes[0].guidance.instructions.forEach(instruction => {
            if (instruction.point) {
              route.push([instruction.point.longitude, instruction.point.latitude]);
            }
          });
        }

        // Remove duplicate coordinates and sort
        const uniqueRoute = route.filter((coord, index, arr) => {
          return index === 0 || coord[0] !== arr[index-1][0] || coord[1] !== arr[index-1][1];
        });

        // draw route
        const geojson = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: uniqueRoute,
          },
        };

        // Remove existing route if present
        if (mapRef.current.getSource("route")) {
          mapRef.current.removeLayer("route");
          mapRef.current.removeSource("route");
        }

        mapRef.current.addSource("route", { type: "geojson", data: geojson });
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#007aff",
            "line-width": 6,
            "line-opacity": 0.8
          },
        });

        // Fit map to show entire route
        const bounds = new tt.LngLatBounds();
        uniqueRoute.forEach(coord => bounds.extend(coord));
        mapRef.current.fitBounds(bounds, { padding: 50 });

        // calculate ETA and store route data
        const travelTime = data.routes[0].summary.travelTimeInSeconds;
        const distance = data.routes[0].summary.lengthInMeters;
        setEta(`${Math.round(travelTime / 60)} min`);
        setRouteData({
          coordinates: uniqueRoute,
          travelTime,
          distance,
          summary: data.routes[0].summary
        });
      } else {
        alert("No route found.");
      }
    } catch (err) {
      console.error("Route error", err);
      alert("Route calculation failed");
    }
  };

  // Toggle traffic overlay
  const toggleTraffic = () => {
    if (!mapRef.current) return;
    
    if (showTraffic) {
      // Remove traffic layer
      if (mapRef.current.getLayer("traffic")) {
        mapRef.current.removeLayer("traffic");
        mapRef.current.removeSource("traffic");
      }
      setShowTraffic(false);
    } else {
      // Add traffic layer
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

  // Clear current route and waypoints
  const clearRoute = () => {
    // Clear waypoints
    setWaypoints([]);
    setEta(null);
    setRouteData(null);
    
    // Clear markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear route on map
    if (mapRef.current.getSource("route")) {
      mapRef.current.removeLayer("route");
      mapRef.current.removeSource("route");
    }
  };

  const handleBooking = () => {
    // Validation
    if (!vehicle) {
      toast({
        title: "Please select a vehicle",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!date) {
      toast({
        title: "Please select a date",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (waypoints.length < 2) {
      toast({
        title: "Please set at least 2 waypoints on the map",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!routeData) {
      toast({
        title: "Please calculate the route first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Get current user
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Create job object
    const newJob = {
      id: Date.now().toString(), // Simple ID generation
      userId: user.id || user.email, // Use user ID or email as identifier
      vehicle,
      date,
      waypoints,
      routeData,
      eta,
      status: "booked",
      createdAt: new Date().toISOString(),
      pickupAddress: "Click location", // You can enhance this with reverse geocoding
      dropoffAddress: "Click location",
    };

    // Get existing jobs for this user
    const existingJobs = JSON.parse(localStorage.getItem(`jobs_${newJob.userId}`) || "[]");
    
    // Add new job
    existingJobs.push(newJob);
    
    // Save to localStorage
    localStorage.setItem(`jobs_${newJob.userId}`, JSON.stringify(existingJobs));
    
    toast({
      title: "Job booked successfully!",
      description: `${vehicle} booked for ${date}`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    // Clear the form and route
    clearRoute();
    setVehicle("");
    setDate("");
    setSearchQuery("");
    
    // Navigate back to dashboard
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <Box p={8}>
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold" mb={4}>
          Book a New Job
        </Text>
        
        <Select placeholder="Select vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
          <option value="car">Car</option>
          <option value="van">Van</option>
          <option value="truck">Truck</option>
          <option value="bike">Bike</option>
        </Select>
        
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        
        <Input
          placeholder="Search location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <Button colorScheme="blue" onClick={handleSearch}>
          Search Location
        </Button>
        
        <Button colorScheme="purple" onClick={handleRoute}>
          Calculate Route
        </Button>
        
        <Button colorScheme="orange" onClick={toggleTraffic}>
          {showTraffic ? "Hide Traffic" : "Show Traffic"}
        </Button>
        
        <Button colorScheme="red" onClick={clearRoute}>
          Clear Route
        </Button>
        
        <Button colorScheme="green" onClick={handleBooking} size="lg">
          Book Job
        </Button>
        
        {eta && (
          <Text fontWeight="bold" color="green.600">
            ETA: {eta}
          </Text>
        )}
        
        {waypoints.length > 0 && (
          <Text color="blue.600">
            Waypoints: {waypoints.length} (Click map to add more)
          </Text>
        )}
        
        <Box
          ref={mapElement}
          mt={4}
          width="100%"
          height="500px"
          border="1px solid gray"
          borderRadius="md"
        />
      </VStack>
    </Box>
  );
}

export default Booking;