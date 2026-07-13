import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Image as ImageIcon, Video, Calendar, Clock, Activity, Trash2, Edit } from 'lucide-react';
import adminApi from '../api/adminApi';

const AdminAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const emptyFormData = {
    title: '', brandName: '', description: '', targetLink: '',
    mediaType: 'IMAGE', platform: 'BOTH', startDate: '', endDate: '',
    dailyFrequency: 3, durationSeconds: 5
  };
  const [formData, setFormData] = useState(emptyFormData);
  const [mediaFile, setMediaFile] = useState(null);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/ads');
      setAds(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setMediaFile(e.target.files[0]);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setFormData(emptyFormData);
    setMediaFile(null);
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title || '', brandName: ad.brandName || '', description: ad.description || '',
      targetLink: ad.targetLink || '', mediaType: ad.mediaType || 'IMAGE', platform: ad.platform || 'BOTH',
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '', endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
      dailyFrequency: ad.dailyFrequency ?? 3, durationSeconds: ad.durationSeconds ?? 5,
    });
    setMediaFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => form.append(key, formData[key]));
      if (mediaFile) {
        form.append('media', mediaFile);
      }

      if (editingAd) {
        await adminApi.put(`/ads/${editingAd._id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await adminApi.post('/ads', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      closeModal();
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${editingAd ? 'update' : 'create'} ad`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    try {
      await adminApi.delete(`/ads/${id}`);
      fetchAds();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ad');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white mb-1">Ad Campaigns</h1>
          <p className="text-xs text-gray-500">Manage platform advertisements and track analytics</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <Plus size={16} /> Create Ad
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="bg-[#151521] border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1a1a2e] text-xs uppercase text-gray-400">
              <tr>
                <th className="px-6 py-4">Brand / Campaign</th>
                <th className="px-6 py-4">Media</th>
                <th className="px-6 py-4">Status & Duration</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ads.map(ad => (
                <tr key={ad._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white mb-1">{ad.brandName}</div>
                    <div className="text-xs text-gray-400">{ad.title}</div>
                    <div className="text-[10px] bg-white/10 w-fit px-2 py-0.5 rounded mt-1">{ad.platform}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      {ad.mediaType === 'VIDEO' ? <Video size={14} className="text-blue-400" /> : <ImageIcon size={14} className="text-green-400" />}
                      <a href={ad.mediaUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Media</a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${ad.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs font-semibold">{ad.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between w-32"><span>Views:</span> <span className="font-semibold text-white">{ad.impressions}</span></div>
                      <div className="flex justify-between w-32"><span>Clicks:</span> <span className="font-semibold text-white">{ad.clicks}</span></div>
                      <div className="flex justify-between w-32"><span>CTR:</span> <span className="font-semibold text-white">{ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%</span></div>
                      <div className="flex justify-between w-32 text-gray-400"><span>Watch Time:</span> <span>{(ad.totalWatchTimeSeconds / 60).toFixed(1)}m</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEditModal(ad)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(ad._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 text-sm">No ad campaigns found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT AD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151521] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">{editingAd ? 'Edit Ad Campaign' : 'Create Ad Campaign'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Brand Name</label>
                  <input type="text" name="brandName" value={formData.brandName} onChange={handleInputChange} required className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Campaign Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Target URL (On Click)</label>
                <input type="url" name="targetLink" value={formData.targetLink} onChange={handleInputChange} required className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" placeholder="https://" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Description (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none h-20" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Media Type</label>
                  <select name="mediaType" value={formData.mediaType} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none">
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Upload Media{editingAd ? ' (Optional — leave blank to keep existing)' : ''}</label>
                  <input type="file" accept={formData.mediaType === 'IMAGE' ? 'image/*' : 'video/*'} onChange={handleFileChange} required={!editingAd} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Platform</label>
                  <select name="platform" value={formData.platform} onChange={handleInputChange} className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none">
                    <option value="BOTH">Both</option>
                    <option value="WEB">Web Only</option>
                    <option value="MOBILE">Mobile Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Daily Frequency / User</label>
                  <input type="number" name="dailyFrequency" value={formData.dailyFrequency} onChange={handleInputChange} min="1" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Duration (Seconds)</label>
                  <input type="number" name="durationSeconds" value={formData.durationSeconds} onChange={handleInputChange} min="1" className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" disabled={saving || (!editingAd && !mediaFile)} className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : editingAd ? 'Save Changes' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAds;
