'use client';

import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaCheckCircle, FaLightbulb, FaChartLine, FaTrophy, FaTools, FaUsers, FaShieldAlt } from 'react-icons/fa';

export default function EnhancedAIResults({ data, feature }) {
  // Predictive Maintenance View
  if (feature.id === 'maintenance') {
    return (
      <div className="space-y-6">
        {/* Maintenance Alerts */}
        {data.maintenanceAlerts && data.maintenanceAlerts.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#f59e0b' }}>
              🔧 Maintenance Alerts
            </h3>
            {data.maintenanceAlerts.map((alert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl p-4"
                style={{
                  background: alert.priority === 'HIGH' ? 'rgba(244,63,94,0.1)' : alert.priority === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                  border: `1px solid ${alert.priority === 'HIGH' ? '#f43f5e' : alert.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'}40`
                }}
              >
                <div className="flex items-start gap-3">
                  <FaExclamationTriangle size={20} style={{ color: alert.priority === 'HIGH' ? '#f43f5e' : alert.priority === 'MEDIUM' ? '#f59e0b' : '#10b981' }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="ff-badge" style={{ 
                        background: alert.priority === 'HIGH' ? 'rgba(244,63,94,0.2)' : alert.priority === 'MEDIUM' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                        color: alert.priority === 'HIGH' ? '#f43f5e' : alert.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'
                      }}>
                        {alert.priority}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: '#f0f0f4' }}>{alert['machine/area']}</span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#9090a4' }}>{alert.issue}</p>
                    <p className="text-xs" style={{ color: '#54546a' }}>Impact: {alert.estimatedImpact}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="rounded-xl p-5" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#10b981' }}>
              <FaLightbulb size={14} /> Recommendations
            </h3>
            <ul className="space-y-2">
              {data.recommendations.slice(0, 5).map((rec, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2" style={{ color: '#9090a4' }}>
                  <FaCheckCircle size={12} style={{ color: '#10b981', marginTop: 3, flexShrink: 0 }} />
                  <span>{typeof rec === 'string' ? rec : rec.action || JSON.stringify(rec)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Summary */}
        {data.dataAnalyzed && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <p className="text-xs mb-1" style={{ color: '#7878a0' }}>Records</p>
              <p className="text-lg font-bold" style={{ color: '#f0f0f4' }}>{data.dataAnalyzed.recordCount}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <p className="text-xs mb-1" style={{ color: '#7878a0' }}>Defect Rate</p>
              <p className="text-lg font-bold" style={{ color: '#f59e0b' }}>{data.dataAnalyzed.avgDefectRate}%</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <p className="text-xs mb-1" style={{ color: '#7878a0' }}>Time Range</p>
              <p className="text-lg font-bold" style={{ color: '#6366f1' }}>{data.dataAnalyzed.timeRange}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Resource Optimization View
  if (feature.id === 'resources') {
    return (
      <div className="space-y-6">
        {data.staffingRecommendations && data.staffingRecommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#10b981' }}>
              <FaUsers size={14} /> Staffing Recommendations
            </h3>
            {data.staffingRecommendations.map((rec, idx) => (
              <div key={idx} className="rounded-xl p-4 mb-3" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
                <p className="text-sm font-semibold mb-2" style={{ color: '#f0f0f4' }}>{rec.department || 'Department'}</p>
                <p className="text-sm" style={{ color: '#9090a4' }}>{rec.recommendation || JSON.stringify(rec)}</p>
              </div>
            ))}
          </div>
        )}

        {data.currentMetrics && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p className="text-xs mb-1" style={{ color: '#818cf8' }}>Total Employees</p>
              <p className="text-2xl font-bold" style={{ color: '#f0f0f4' }}>{data.currentMetrics.totalEmployees}</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.1))', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-xs mb-1" style={{ color: '#10b981' }}>Departments</p>
              <p className="text-2xl font-bold" style={{ color: '#f0f0f4' }}>{data.currentMetrics.departmentCount}</p>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,146,60,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs mb-1" style={{ color: '#f59e0b' }}>Avg Productivity</p>
              <p className="text-2xl font-bold" style={{ color: '#f0f0f4' }}>{data.currentMetrics.avgProductivity}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Quality Control View
  if (feature.id === 'quality') {
    return (
      <div className="space-y-6">
        {data.currentMetrics && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.15))', border: '2px solid rgba(16,185,129,0.3)' }}>
            <FaShieldAlt size={40} style={{ color: '#10b981', margin: '0 auto 16px' }} />
            <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#10b981' }}>Quality Score</p>
            <p className="text-5xl font-bold mb-2" style={{ color: '#f0f0f4' }}>{data.currentMetrics.qualityScore}</p>
            <p className="text-xs" style={{ color: '#7878a0' }}>Defect Rate: {data.currentMetrics.overallDefectRate}% • {data.currentMetrics.totalRecordsAnalyzed} records</p>
          </div>
        )}

        {data.detailedBreakdown && data.detailedBreakdown.byProduct && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#f59e0b' }}>Defect Rate by Product</h3>
            {data.detailedBreakdown.byProduct.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b" style={{ borderColor: '#1f1f28' }}>
                <span className="text-sm" style={{ color: '#f0f0f4' }}>{item.product}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 rounded-full" style={{ background: '#1f1f28' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(parseFloat(item.defectRate) * 10, 100)}%`, background: parseFloat(item.defectRate) > 5 ? '#f43f5e' : '#10b981' }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: parseFloat(item.defectRate) > 5 ? '#f43f5e' : '#10b981' }}>{item.defectRate}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Performance Benchmark View
  if (feature.id === 'benchmark') {
    return (
      <div className="space-y-6">
        {data.performanceGrade && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))', border: '2px solid rgba(99,102,241,0.3)' }}>
            <FaTrophy size={40} style={{ color: '#6366f1', margin: '0 auto 16px' }} />
            <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#6366f1' }}>Performance Grade</p>
            <p className="text-5xl font-bold" style={{ color: '#f0f0f4' }}>{data.performanceGrade}</p>
          </div>
        )}

        {data.currentMetrics && data.benchmarks && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#818cf8' }}>Metrics vs Industry</h3>
            
            <div className="rounded-xl p-4" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: '#7878a0' }}>Efficiency</span>
                <span className="text-sm font-semibold" style={{ color: data.currentMetrics.efficiency >= data.benchmarks.efficiency ? '#10b981' : '#f43f5e' }}>
                  {data.currentMetrics.efficiency}% (Target: {data.benchmarks.efficiency}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: '#1f1f28' }}>
                <div className="h-full rounded-full" style={{ width: `${(data.currentMetrics.efficiency / data.benchmarks.efficiency) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: '#7878a0' }}>Defect Rate</span>
                <span className="text-sm font-semibold" style={{ color: data.currentMetrics.defectRate <= data.benchmarks.defectRate ? '#10b981' : '#f43f5e' }}>
                  {data.currentMetrics.defectRate}% (Target: {data.benchmarks.defectRate}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: '#1f1f28' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min((data.benchmarks.defectRate / data.currentMetrics.defectRate) * 100, 100)}%`, background: data.currentMetrics.defectRate <= data.benchmarks.defectRate ? '#10b981' : '#f43f5e' }} />
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: '#7878a0' }}>Profit Margin</span>
                <span className="text-sm font-semibold" style={{ color: data.currentMetrics.profitMargin >= data.benchmarks.profitMargin ? '#10b981' : '#f59e0b' }}>
                  {data.currentMetrics.profitMargin}% (Target: {data.benchmarks.profitMargin}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: '#1f1f28' }}>
                <div className="h-full rounded-full" style={{ width: `${(data.currentMetrics.profitMargin / data.benchmarks.profitMargin) * 100}%`, background: 'linear-gradient(90deg, #10b981, #14b8a6)' }} />
              </div>
            </div>
          </div>
        )}

        {data.strengths && data.strengths.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#10b981' }}>
              <FaCheckCircle size={14} /> Strengths
            </h3>
            <ul className="space-y-2">
              {data.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm" style={{ color: '#9090a4' }}>• {strength}</li>
              ))}
            </ul>
          </div>
        )}

        {data.weaknesses && data.weaknesses.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#f43f5e' }}>
              <FaExclamationTriangle size={14} /> Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {data.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-sm" style={{ color: '#9090a4' }}>• {weakness}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fallback: Generic JSON view
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="rounded-xl p-4" style={{ background: '#17171c', border: '1px solid #1f1f28' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#818cf8' }}>
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </p>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap" style={{ color: '#9090a4' }}>
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </pre>
        </div>
      ))}
    </div>
  );
}
