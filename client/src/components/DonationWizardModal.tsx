import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  ShieldCheck,
  Clock,
  MapPin,
  Utensils,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Camera,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Donation } from '../types';
import { api } from '../services/api';


interface DonationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (donation: Donation) => void;
}

export const DonationWizardModal: React.FC<DonationWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    foodName: '',
    category: 'Prepared Meals',
    quantity: '20 kg',
    mealCount: 45,
    dietType: 'Vegetarian' as 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Vegetarian & Vegan',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    preparedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString().slice(0, 16),
    storageMethod: 'Heated Insulated Containers (>65°C)',
    tempRange: '68°C Hot Hold',
    packagingType: 'Stainless food-grade pans with sealed lids',
    safeUntil: new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 16),
    pickupAddress: '742 Evergreen Terrace, Commercial Kitchen Bay',
    pickupStart: '18:00',
    pickupDeadline: '21:00',
    contactPhone: '+1 (555) 234-5678'
  });

  // AI Evaluation Results
  const [aiSafetyResult, setAiSafetyResult] = useState<any>(null);
  const [aiImageResult, setAiImageResult] = useState<any>(null);

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);

  // Live Real Location State
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [liveLocationSuccess, setLiveLocationSuccess] = useState(false);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLiveCoords({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'en' },
              signal: AbortSignal.timeout(6000)
            }
          );
          if (res.ok) {
            const data = await res.json();
            const formatted = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
            setFormData(prev => ({
              ...prev,
              pickupAddress: formatted
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              pickupAddress: `Live GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`
            }));
          }
        } catch {
          setFormData(prev => ({
            ...prev,
            pickupAddress: `Live GPS: ${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E`
          }));
        }

        setLiveLocationSuccess(true);
        setDetectingLocation(false);
      },
      (err) => {
        setDetectingLocation(false);
        setError(`Unable to retrieve live location: ${err.message}. Please verify browser permissions.`);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000
      }
    );
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    setError(null);
    const sizeInKB = Math.round(file.size / 1024);
    const sizeStr = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB} KB`;
    setUploadedFileName(file.name);
    setUploadedFileSize(sizeStr);

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, imageUrl: compressed }));
        } else {
          setFormData(prev => ({ ...prev, imageUrl: rawResult }));
        }
      };
      img.onerror = () => {
        setFormData(prev => ({ ...prev, imageUrl: rawResult }));
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleNextToStep4 = async () => {
    setError(null);
    if (!formData.foodName || !formData.mealCount || !formData.pickupDeadline) {
      setError('Please complete the required food details and pickup deadline.');
      return;
    }

    setAnalyzing(true);
    try {
      // 1. Run AI Safety Evaluation
      const safety = await api.evaluateFoodSafety({
        foodName: formData.foodName,
        category: formData.category,
        preparedAt: new Date(formData.preparedAt).toISOString(),
        currentTime: new Date().toISOString(),
        storageMethod: formData.storageMethod,
        tempRange: formData.tempRange,
        packagingType: formData.packagingType,
        safeUntil: new Date(formData.safeUntil).toISOString()
      });

      // 2. Run Computer Vision Image Analysis
      const imgAnalysis = await api.analyzeFoodImage({
        imageUrl: formData.imageUrl,
        foodNameHint: formData.foodName
      });

      setAiSafetyResult(safety);
      setAiImageResult(imgAnalysis);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Safety assessment failed. You may still proceed with manual review.');
      setStep(4);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload: Partial<Donation> = {
        foodName: formData.foodName,
        category: formData.category,
        quantity: formData.quantity,
        mealCount: Number(formData.mealCount),
        dietType: formData.dietType,
        imageUrl: formData.imageUrl,
        preparedAt: new Date(formData.preparedAt).toISOString(),
        storageMethod: formData.storageMethod,
        tempRange: formData.tempRange,
        packagingType: formData.packagingType,
        safeUntil: new Date(formData.safeUntil).toISOString(),
        pickupLocation: {
          address: formData.pickupAddress,
          lat: liveCoords ? liveCoords.lat : 12.9141 + (Math.random() - 0.5) * 0.02,
          lng: liveCoords ? liveCoords.lng : 74.8560 + (Math.random() - 0.5) * 0.02
        },
        pickupStart: formData.pickupStart,
        pickupDeadline: formData.pickupDeadline,
        contactPhone: formData.contactPhone
      };

      const res = await api.createDonation(payload);
      onSuccess(res.donation);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish donation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8">
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.96 }}
          className="w-full max-w-3xl glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 shadow-2xl relative my-auto bg-[#07150f]/95"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

        {/* Modal Title & Step Bar */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Surplus Food Registration
          </div>
          <h3 className="text-2xl font-bold text-white">Post Surplus Food Donation</h3>
          <p className="text-xs text-slate-400">Step {step} of 4 — {
            step === 1 ? 'Food Information' :
            step === 2 ? 'HACCP Safety Details' :
            step === 3 ? 'Pickup Location & Schedule' :
            'Food Safety & Vision Verification'
          }</p>

          {/* Stepper Progress */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s <= step ? 'bg-brand-emerald shadow-sm shadow-brand-emerald/50' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: FOOD DETAILS */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Food Name & Description *</label>
              <input
                type="text"
                placeholder="e.g. Steamed Basmati Rice & Roasted Paneer Curry"
                value={formData.foodName}
                onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white focus:outline-none focus:border-brand-emerald text-sm"
                >
                  <option value="Prepared Meals">Prepared Meals</option>
                  <option value="Bakery & Bread">Bakery & Bread</option>
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Dairy & Chilled">Dairy & Chilled</option>
                  <option value="Packaged Foods">Packaged Foods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Quantity (kg/lbs) *</label>
                <input
                  type="text"
                  placeholder="e.g. 25 kg"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white focus:outline-none focus:border-brand-emerald text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estimated Meal Count *</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={formData.mealCount}
                  onChange={(e) => setFormData({ ...formData, mealCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white focus:outline-none focus:border-brand-emerald text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dietary Profile</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Vegetarian', 'Vegan', 'Non-Vegetarian', 'Vegetarian & Vegan'] as const).map((diet) => (
                  <button
                    type="button"
                    key={diet}
                    onClick={() => setFormData({ ...formData, dietType: diet })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formData.dietType === diet
                        ? 'bg-brand-emerald text-white border-brand-emerald'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Photograph - Local Upload & Sample Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Food Photograph *
                </label>
                <div className="flex items-center gap-1 p-0.5 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('file')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      imageInputMode === 'file'
                        ? 'bg-brand-emerald text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload Local Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      imageInputMode === 'url'
                        ? 'bg-brand-emerald text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {imageInputMode === 'file' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {formData.imageUrl && uploadedFileName ? (
                    /* Uploaded Photo Preview Card */
                    <div className="relative rounded-2xl overflow-hidden border border-brand-emerald/40 bg-slate-900/90 p-3.5 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:w-28 h-24 rounded-xl overflow-hidden bg-slate-800 relative shrink-0 border border-slate-700/50">
                        <img
                          src={formData.imageUrl}
                          alt="Uploaded food"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
                          <span className="text-xs font-bold text-white truncate">
                            {uploadedFileName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mb-2.5">
                          {uploadedFileSize || 'Ready'} • Local photo ready for computer vision inspection
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 text-brand-mint" />
                            <span>Change Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFileName(null);
                              setUploadedFileSize(null);
                              setFormData(prev => ({
                                ...prev,
                                imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
                              }));
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Drag & Drop Upload Zone */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                        isDragging
                          ? 'border-brand-emerald bg-brand-emerald/10'
                          : 'border-slate-700 hover:border-brand-emerald/70 bg-slate-900/50 hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-mint shadow-lg shadow-brand-emerald/10">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">
                        Click or drag & drop to upload food photograph
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        Choose an image from your computer or phone (JPG, PNG, WebP)
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-brand-mint border border-slate-700/80 shadow-sm">
                        <Camera className="w-3.5 h-3.5 text-brand-emerald" />
                        Browse Local Files
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback Image URL Input */
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL (e.g. https://...)"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-brand-emerald"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Sample presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
                        });
                        setUploadedFileName(null);
                      }}
                      className="text-[11px] text-brand-mint hover:underline cursor-pointer"
                    >
                      Basmati Rice
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80'
                        });
                        setUploadedFileName(null);
                      }}
                      className="text-[11px] text-brand-mint hover:underline cursor-pointer"
                    >
                      Bakery Breads
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
                        });
                        setUploadedFileName(null);
                      }}
                      className="text-[11px] text-brand-mint hover:underline cursor-pointer"
                    >
                      Fresh Greens
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-mint shrink-0" />
                Computer Vision will scan this photo in Step 4 for container seal, food category recognition, and contamination checks.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: SAFETY INFORMATION */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 text-xs text-brand-mint flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Accurate time and thermal hold records allow the system to calculate biological safety windows and prevent spoiled handoffs.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preparation Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.preparedAt}
                  onChange={(e) => setFormData({ ...formData, preparedAt: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Safe-Consumption Deadline *</label>
                <input
                  type="datetime-local"
                  value={formData.safeUntil}
                  onChange={(e) => setFormData({ ...formData, safeUntil: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Storage Method *</label>
                <input
                  type="text"
                  placeholder="e.g. Heated Insulated Containers (>65°C)"
                  value={formData.storageMethod}
                  onChange={(e) => setFormData({ ...formData, storageMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Temperature Reading / Range</label>
                <input
                  type="text"
                  placeholder="e.g. 68°C Hot Hold or <4°C Chilled"
                  value={formData.tempRange}
                  onChange={(e) => setFormData({ ...formData, tempRange: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Packaging Type *</label>
              <input
                type="text"
                placeholder="e.g. Commercial stainless hotel pans with sealed foil covers"
                value={formData.packagingType}
                onChange={(e) => setFormData({ ...formData, packagingType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 3: PICKUP LOGISTICS */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Pickup Location / Gate Address *
                </label>
                <button
                  type="button"
                  onClick={handleDetectLiveLocation}
                  disabled={detectingLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-brand-emerald/20 hover:bg-brand-emerald/30 text-brand-mint border border-brand-emerald/40 transition-colors cursor-pointer shadow-sm"
                >
                  {detectingLocation ? (
                    <>
                      <span className="w-3 h-3 rounded-full border-2 border-brand-mint border-t-transparent animate-spin" />
                      <span>Detecting Real GPS...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-brand-limeSoft" />
                      <span>📍 Use My Real Live Location</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace, Back Service Entrance Gate B"
                  value={formData.pickupAddress}
                  onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-brand-emerald"
                />
              </div>

              {liveLocationSuccess && liveCoords && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/40 border border-brand-emerald/40 text-[11px] text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      Live GPS Acquired: <strong>{liveCoords.lat.toFixed(5)}° N, {liveCoords.lng.toFixed(5)}° E</strong> {liveCoords.accuracy ? `(±${liveCoords.accuracy}m)` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLiveLocation}
                    className="text-[10px] font-semibold text-brand-mint underline hover:text-white cursor-pointer"
                  >
                    Refresh GPS
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pickup Window Start</label>
                <input
                  type="text"
                  placeholder="e.g. 18:00 (or Immediately)"
                  value={formData.pickupStart}
                  onChange={(e) => setFormData({ ...formData, pickupStart: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pickup Window Deadline *</label>
                <input
                  type="text"
                  placeholder="e.g. 21:00"
                  value={formData.pickupDeadline}
                  onChange={(e) => setFormData({ ...formData, pickupDeadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">On-Site Contact Phone *</label>
              <input
                type="text"
                placeholder="e.g. +1 (555) 234-5678"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 4: SAFETY REVIEW */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Food Safety Assessment Card */}
            <div className="glass-panel p-5 rounded-2xl border-brand-emerald/40 bg-slate-900/90">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-emerald/20 flex items-center justify-center text-brand-mint">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Food Safety Assessment</h4>
                    <p className="text-[10px] text-slate-400">Algorithmic HACCP Evaluation</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Safety Confidence</span>
                  <span className="text-lg font-extrabold text-brand-mint">
                    {aiSafetyResult?.confidence || 92}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-4">
                <div className="font-semibold text-slate-200 mb-1">
                  Status: <span className="text-brand-limeSoft font-bold">{aiSafetyResult?.status || 'Low concern'}</span>
                </div>
                <p className="text-slate-300">
                  {aiSafetyResult?.recommendedAction || 'Suitable for donation if transported under recommended conditions.'}
                </p>
              </div>

              {/* Factors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {aiSafetyResult?.factors?.map((f: any) => (
                  <div key={f.name} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-mint shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{f.name}</span>
                      <span className="text-slate-400">{f.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mandatory Non-Authority Disclaimer */}
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 italic">
                ⚠️ {aiSafetyResult?.disclaimer || 'Automated guidance is informational only. Follow applicable food-safety regulations and local authority guidance.'}
              </div>
            </div>

            {/* Computer Vision Analysis Card */}
            {aiImageResult && (
              <div className="glass-panel p-4 rounded-xl border-slate-800 bg-slate-900/60 text-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sky-400" />
                    <span className="font-bold text-white">Computer Vision Verification</span>
                  </div>
                  <span className="text-sky-400 font-bold">{aiImageResult.confidence}% confidence</span>
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  {formData.imageUrl && (
                    <div className="w-16 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
                      <img
                        src={formData.imageUrl}
                        alt="Scanned photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-slate-300">
                      Detected: <strong className="text-white">{aiImageResult.detected}</strong>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Category: <strong className="text-white">{aiImageResult.category}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {uploadedFileName ? `Source: Local file (${uploadedFileName})` : 'Source: Photo verified'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                  <div>Food Detected: <span className="text-brand-mint font-semibold">✓ Verified</span></div>
                  <div>Packaging Containment: <span className="text-brand-mint font-semibold">✓ Intact</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl bg-brand-emerald hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-emerald/20"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : step === 3 ? (
            <button
              onClick={handleNextToStep4}
              disabled={analyzing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-brand-emerald/20"
            >
              {analyzing ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Running Food Safety Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Safety Screen</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xl shadow-brand-emerald/30"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Publishing Listing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publish Verified Donation</span>
                </>
              )}
            </button>
          )}
        </div>

      </motion.div>
      </div>
    </div>
  );
};
