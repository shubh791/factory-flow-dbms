'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaRobot, 
  FaCog, 
  FaUsers, 
  FaShieldAlt, 
  FaChartBar,
  FaTimes,
  FaSyncAlt,
  FaLightbulb
} from 'react-icons/fa';
import API from '@/lib/api';
import EnhancedAIResults from './EnhancedAIResults';

const AI_FEATURES = [
  {
    id: 'maintenance',
    title: 'Predictive Maintenance',
    subtitle: 'Equipment failure prediction',
    icon: FaCog,
    color: '#f59e0b',
    endpoint: '/ai/predictive-maintenance',
  },
  {
    id: 'resources',
    title: 'Resource Optimization',
    subtitle: 'Staffing & allocation',
    icon: FaUsers,
    color: '#10b981',
    endpoint: '/ai/resource-optimization',
  },
  {
    id: 'quality',
    title: 'Quality Control AI',
    subtitle: 'Defect pattern analysis',
    icon: FaShieldAlt,
    color: '#f43f5e',
    endpoint: '/ai/quality-control',
  },
  {
    id: 'benchmark',
    title: 'Performance Benchmark',
    subtitle: 'Industry comparison',
    icon: FaChartBar,
    color: '#6366f1',
    endpoint: '/ai/performance-benchmark',
  },
];

export default function AICommandCenter({ onClose }) {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchInsight = async (feature) => {
    setLoading(true);
    setError(null);
    setData(null);
    setSelectedFeature(feature);

    try {
      const response = await API.get(feature.endpoint);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl ff-glass"
        style={{ border: '1px solid rgba(99,102,241,0.3)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#1f1f28' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center ff-pulse-glow"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
              <FaRobot size={20} color="white" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#f0f0f4' }}>AI Command Center</h2>
              <p className="text-xs" style={{ color: '#7878a0' }}>Industrial Intelligence Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: '#17171c', color: '#7878a0' }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 h-[calc(90vh-80px)]">
          {/* Features List */}
          <div className="lg:border-r overflow-y-auto p-6 space-y-3" style={{ borderColor: '#1f1f28', background: '#0f0f13' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#54546a' }}>
              AI Features
            </p>
            {AI_FEATURES.map((feature) => (
              <motion.button
                key={feature.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchInsight(feature)}
                className="w-full text-left rounded-xl p-4 transition-all"
                style={{
                  background: selectedFeature?.id === feature.id ? '#17171c' : '#0c0c0f',
                  border: `1px solid ${selectedFeature?.id === feature.id ? feature.color + '40' : '#1f1f28'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: feature.color + '15', color: feature.color }}
                  >
                    <feature.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-1" style={{ color: '#f0f0f4' }}>
                      {feature.title}
                    </p>
                    <p className="text-xs" style={{ color: '#7878a0' }}>
                      {feature.subtitle}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 overflow-y-auto p-6">
            {!selectedFeature && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)' }}>
                  <FaLightbulb size={32} style={{ color: '#6366f1' }} />
                </div>
                <p className="text-lg font-semibold mb-2" style={{ color: '#f0f0f4' }}>
                  Select an AI Feature
                </p>
                <p className="text-sm" style={{ color: '#7878a0', maxWidth: 400 }}>
                  Choose from advanced AI-powered insights to optimize your industrial operations
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 border-4 rounded-full animate-spin mb-4"
                  style={{ borderColor: '#1f1f28', borderTopColor: '#6366f1' }} />
                <p className="text-sm font-medium" style={{ color: '#f0f0f4' }}>Analyzing data...</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl p-6" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#f43f5e' }}>Analysis Failed</p>
                <p className="text-sm" style={{ color: '#7878a0' }}>{error}</p>
              </div>
            )}

            {data && selectedFeature && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: selectedFeature.color + '15', color: selectedFeature.color }}>
                    <selectedFeature.icon size={22} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold" style={{ color: '#f0f0f4' }}>
                      {selectedFeature.title}
                    </h3>
                    <p className="text-xs" style={{ color: '#7878a0' }}>
                      {selectedFeature.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => fetchInsight(selectedFeature)}
                    className="ff-btn ff-btn-secondary"
                    style={{ padding: '8px 12px', fontSize: 11 }}
                  >
                    <FaSyncAlt size={10} />
                    Refresh
                  </button>
                </div>

                <EnhancedAIResults data={data} feature={selectedFeature} />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
