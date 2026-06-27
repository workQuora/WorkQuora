import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
};

const JobMap = ({ jobs = [], center = [23.2599, 77.4126], isFreelancerMap = false }) => {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-gray-700 shadow-xl z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        <MapUpdater center={center} />
        {jobs.map((job) => {
          if (!job.location?.coordinates) return null;
          return (
            <Marker key={job._id || job.id} position={[job.location.coordinates[1], job.location.coordinates[0]]}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{job.category || job.company}</p>
                  <p className="font-bold text-emerald-600 mb-3">{job.budget}</p>
                  <button onClick={() => navigate(isFreelancerMap ? `/freelancer/${job._id || job.id}` : `/job/${job._id || job.id}`)}
                    className="w-full bg-indigo-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer">
                    {isFreelancerMap ? 'View Profile' : 'View Details'}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default JobMap;