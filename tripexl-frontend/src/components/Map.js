import React, { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

const Map = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = tt.map({
      key: 'yoabHUGGcgHjDQHK6tSAXXx8gqxlUb99',
      container: mapRef.current,
      center: [77.5946, 12.9716], // Bengaluru default center
      zoom: 10,
    });

    map.addControl(new tt.NavigationControl());

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '500px', borderRadius: '12px' }}
    />
  );
};

export default Map;
