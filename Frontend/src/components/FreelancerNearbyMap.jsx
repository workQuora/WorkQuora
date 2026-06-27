import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Navigation, Settings, Clock, Zap, ChevronRight, Crosshair } from 'lucide-react';
import { setDiscoveryRadius, fetchNearbyJobs } from '../redux/freelancerSlice';
import { geoApi } from '../api/endpoints';

const FreelancerNearbyMap = () => {
  const dispatch = useDispatch();
  const { radar, isLoading } = useSelector((state) => state.freelancer);
  const clientLocation = useSelector((state) => state.client.details.currentLocation);
  const { radiusKm, jobsFeed } = radar;

  const lat = clientLocation?.lat || 23.2599;
  const lng = clientLocation?.lng || 77.4126;
  const city = clientLocation?.city || 'Bhopal, MP';

  useEffect(() => {
    dispatch(fetchNearbyJobs({ lat, lng, radiusKm }));
    geoApi.setRadius(radiusKm).catch(() => {}); // fire-and-forget
  }, [radiusKm, lat, lng, dispatch]);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] bg-[#09090B] overflow-hidden font-sans">
      {/* Map background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-indigo-500 rounded-full relative z-10 shadow-[0_0_20px_#6366f1]"></div>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-500/50 ${isLoading ? 'animate-ping w-96 h-96 opacity-0 transition-all duration-1000' : 'w-32 h-32 opacity-20'}`}></div>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-500/20 ${isLoading ? 'animate-ping w-[800px] h-[800px] opacity-0 transition-all delay-300' : 'w-64 h-64 opacity-10'}`}></div>
        </div>
      </div>

      <div className="relative z-10 h-full max-w-md w-full p-6 flex flex-col pointer-events-none">
        <div className="bg-[#09090B]/60 backdrop-blur-2xl border border-white/10 rounded-3xl h-full flex flex-col shadow-2xl shadow-black/50 pointer-events-auto overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white tracking-tight">Work Radar</h2>
              <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5">
                <Settings className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-white/5 py-2 px-3 rounded-xl border border-white/5 w-full">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>Current: <strong className="text-white">{city}</strong></span>
            </div>
          </div>

          {/* Radius Slider */}
          <div className="p-6 bg-gradient-to-b from-transparent to-black/20">
            <div className="flex justify-between items-end mb-4">
              <p className="text-sm font-medium text-zinc-400">Discovery Radius</p>
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-lg">
                <Crosshair className="w-4 h-4" /> {radiusKm} <span className="text-sm font-medium text-zinc-500">KM</span>
              </div>
            </div>
            <div className="relative w-full h-2 bg-zinc-800 rounded-full">
              <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"
                style={{ width: `${(radiusKm / 200) * 100}%` }}></div>
              <input type="range" min="1" max="200" value={radiusKm}
                onChange={(e) => dispatch(setDiscoveryRadius(parseInt(e.target.value)))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              <span>1 KM</span><span>200 KM</span>
            </div>
          </div>

          {/* Job Feed */}
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-white">Live Opportunities</p>
              {isLoading && <span className="text-xs text-indigo-400 animate-pulse">Scanning...</span>}
            </div>

            {jobsFeed.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-5 h-5 text-zinc-500" />
                </div>
                <p className="text-zinc-400 text-sm">No jobs found in this radius.</p>
                <button onClick={() => dispatch(setDiscoveryRadius(50))} className="text-indigo-400 text-sm font-medium mt-2 hover:text-indigo-300">
                  Expand to 50 KM
                </button>
              </div>
            ) : (
              jobsFeed.map((job) => (
                <div key={job._id || job.id}
                  className="group relative bg-[#09090B] border border-white/5 hover:border-indigo-500/30 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-medium text-sm group-hover:text-indigo-400 transition-colors pr-4">{job.title}</h3>
                    {job.urgent && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] uppercase font-bold rounded-full whitespace-nowrap">
                        <Zap className="w-3 h-3 fill-current" /> Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-400 font-semibold mb-3">₹{job.budget?.toLocaleString('en-IN') || job.minBudget}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.distance?.toFixed(1) || '?'} KM</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.location?.city || 'Nearby'}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerNearbyMap;