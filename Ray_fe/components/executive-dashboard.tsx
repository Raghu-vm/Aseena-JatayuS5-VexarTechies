'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Users,
  Zap,
  FileText,
  Clock,
  Target,
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  AlertTriangle,
  Shield,
  Download,
  ChevronRight,
} from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'

// KPI Data
const kpiMetrics = [
  { label: 'Employees', value: '248', trend: '+5%', icon: Users, color: 'cyan' },
  { label: 'Active Users', value: '186', trend: '+12%', icon: Activity, color: 'cyan' },
  { label: 'Open Tickets', value: '42', trend: '-8%', icon: AlertCircle, color: 'red' },
  { label: 'SLA Compliance', value: '96.5%', trend: '+2.1%', icon: Target, color: 'green' },
  { label: 'Avg Resolution', value: '4.2h', trend: '-15%', icon: Clock, color: 'emerald' },
  { label: 'AI Automation', value: '68%', trend: '+18%', icon: Zap, color: 'cyan' },
  { label: 'KB Usage', value: '73%', trend: '+6%', icon: FileText, color: 'emerald' },
  { label: 'Dept Health', value: '8.6/10', trend: '+0.5', icon: BarChart3, color: 'cyan' },
]

// AI Executive Insights
const aiInsights = [
  {
    title: 'SLA Risks Detected',
    description: 'IT Support dept approaching SLA breach - 3 tickets critical',
    severity: 'high',
    action: 'Review',
  },
  {
    title: 'Ticket Spike Alert',
    description: 'Sales dept showing 34% increase in tickets - investigate cause',
    severity: 'medium',
    action: 'Analyze',
  },
  {
    title: 'Department Insights',
    description: 'Finance dept efficiency up 12% - best practices to replicate',
    severity: 'success',
    action: 'Learn',
  },
  {
    title: 'KB Opportunities',
    description: '18 frequently asked questions not covered in Knowledge Base',
    severity: 'info',
    action: 'Create',
  },
]

// Department Performance Heatmap Data
const departmentPerformance = [
  { department: 'IT Support', tickets: 12, avgTime: 3.2, sla: 97, productivity: 88, efficiency: 85 },
  { department: 'HR', tickets: 8, avgTime: 2.1, sla: 99, productivity: 92, efficiency: 90 },
  { department: 'Finance', tickets: 5, avgTime: 4.5, sla: 94, productivity: 85, efficiency: 82 },
  { department: 'Sales', tickets: 15, avgTime: 2.8, sla: 96, productivity: 91, efficiency: 88 },
  { department: 'Operations', tickets: 9, avgTime: 3.8, sla: 95, productivity: 87, efficiency: 84 },
]

// Ticket Intelligence Data
const ticketTrends = [
  { day: 'Mon', manual: 24, email: 18, ai: 12 },
  { day: 'Tue', manual: 28, email: 22, ai: 15 },
  { day: 'Wed', manual: 22, email: 19, ai: 18 },
  { day: 'Thu', manual: 35, email: 28, ai: 22 },
  { day: 'Fri', manual: 32, email: 25, ai: 28 },
  { day: 'Sat', manual: 18, email: 12, ai: 14 },
  { day: 'Sun', manual: 15, email: 10, ai: 9 },
]

// Escalations Data
const escalationData = [
  { date: 'Week 1', escalations: 8, resolved: 6 },
  { date: 'Week 2', escalations: 12, resolved: 9 },
  { date: 'Week 3', escalations: 10, resolved: 8 },
  { date: 'Week 4', escalations: 6, resolved: 5 },
]

// Knowledge Governance
const kbMetrics = [
  { metric: 'Total Documents', value: '342', trend: '+8%', status: 'good' },
  { metric: 'Outdated Docs', value: '12', trend: '-3%', status: 'warning' },
  { metric: 'Avg Version', value: '2.4', trend: '+0.2', status: 'good' },
  { metric: 'Approval Rate', value: '94%', trend: '+2%', status: 'good' },
]

// Workforce Intelligence
const productivityTrends = [
  { week: 'W1', productivity: 82, utilization: 78, engagement: 85 },
  { week: 'W2', productivity: 85, utilization: 80, engagement: 87 },
  { week: 'W3', productivity: 83, utilization: 79, engagement: 84 },
  { week: 'W4', productivity: 88, utilization: 82, engagement: 89 },
]

// Alerts & Risks
const alerts = [
  { severity: 'high', title: 'SLA Breach Risk', message: 'IT Support: 3 tickets critical - action required', icon: AlertTriangle },
  { severity: 'medium', title: 'System Alert', message: 'API integration offline for 12 minutes - investigating', icon: AlertCircle },
  { severity: 'medium', title: 'Department Backlog', message: 'Finance dept showing high ticket backlog', icon: BarChart3 },
  { severity: 'low', title: 'KB Update', message: '5 documents marked as outdated - review suggested', icon: FileText },
]

// Navigation Items for Executive Sidebar
export const executiveNavItems = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'analytics', label: 'Operational Analytics', icon: BarChart3 },
  { id: 'departments', label: 'Departments', icon: Users },
  { id: 'workforce', label: 'Workforce Intelligence', icon: Brain },
  { id: 'tickets', label: 'Ticket Intelligence', icon: AlertCircle },
  { id: 'knowledge', label: 'Knowledge Governance', icon: BookOpen },
  { id: 'ai', label: 'AI Intelligence', icon: Zap },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'alerts', label: 'Alerts & Risks', icon: AlertTriangle },
  { id: 'audit', label: 'Audit Logs', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Target },
]

export function ExecutiveDashboard() {
  const [activeSection, setActiveSection] = useState('overview')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-900'
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900'
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-cyan-50 via-white to-cyan-100 dark:from-cyan-950/90 dark:via-slate-950 dark:to-slate-950 p-8 space-y-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Executive Intelligence Center</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-1">AI-Powered Operational Mission Control</p>
          </div>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Ribbon - Premium Card Design */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiMetrics.map((metric, idx) => {
            const Icon = metric.icon
            const isPositive = metric.trend.startsWith('+')
            const colorClasses = {
              cyan: 'from-cyan-50 to-cyan-100/50 dark:from-cyan-950/20 dark:to-cyan-900/10 text-cyan-700 dark:text-cyan-400',
              emerald:
                'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 text-emerald-700 dark:text-emerald-400',
              green: 'from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 text-green-700 dark:text-green-400',
              red: 'from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10 text-red-700 dark:text-red-400',
            }

            return (
              <Card
                key={idx}
                className={`p-6 border-0 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 bg-gradient-to-br ${
                  colorClasses[metric.color as keyof typeof colorClasses]
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{metric.label}</p>
                    <p className="text-3xl font-bold mt-2">{metric.value}</p>
                  </div>
                  <Icon className="h-8 w-8 opacity-40" />
                </div>
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.trend}
                  </span>
                  <span className="text-xs opacity-70">vs last week</span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* AI Executive Insights Section */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-900 dark:text-cyan-100 mb-4">AI Executive Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, idx) => (
            <Card key={idx} className="p-6 border-0 shadow-sm hover:shadow-md transition-all bg-cyan-50/90 dark:bg-cyan-950/80">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <Brain className="h-5 w-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{insight.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    insight.severity === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : insight.severity === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : insight.severity === 'success'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                </span>
                <Button variant="ghost" size="sm" className="gap-1 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20">
                  {insight.action}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Ticket Intelligence Section */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Creation Trends */}
          <Card className="lg:col-span-2 p-6 border-0 shadow-sm bg-cyan-50/90 dark:bg-cyan-950/80">
            <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-100 mb-4">Ticket Creation Sources</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ticketTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="day" stroke="rgba(0,0,0,0.5)" />
                <YAxis stroke="rgba(0,0,0,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Bar dataKey="manual" fill="#3b82f6" name="Manual" radius={[6, 6, 0, 0]} />
                <Bar dataKey="email" fill="#8b5cf6" name="Email" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ai" fill="#06b6d4" name="AI-Generated" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Escalations Tracking */}
          <Card className="p-6 border-0 shadow-sm bg-cyan-50/90 dark:bg-cyan-950/80">
            <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-100 mb-4">Escalations</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={escalationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="date" stroke="rgba(0,0,0,0.5)" />
                <YAxis stroke="rgba(0,0,0,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '16px' }} />
                <Line type="monotone" dataKey="escalations" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* Department Performance Matrix */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 border-0 shadow-sm bg-cyan-50/90 dark:bg-cyan-950/80">
          <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-100 mb-6">Department Performance Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Department
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Tickets
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Avg Time
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    SLA Compliance
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Productivity
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody>
                {departmentPerformance.map((dept, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">{dept.department}</td>
                    <td className="text-center py-4 px-4 text-slate-600 dark:text-slate-400">{dept.tickets}</td>
                    <td className="text-center py-4 px-4 text-slate-600 dark:text-slate-400">{dept.avgTime}h</td>
                    <td className="text-center py-4 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          dept.sla >= 95
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {dept.sla}%
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                            style={{ width: `${dept.productivity}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white w-7">{dept.productivity}%</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                            style={{ width: `${dept.efficiency}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white w-7">{dept.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Knowledge Governance Section */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kbMetrics.map((item, idx) => (
            <Card key={idx} className="p-6 border-0 shadow-sm bg-cyan-50/90 dark:bg-cyan-950/80">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                    {item.metric}
                  </p>
                  <p className="text-3xl font-bold text-cyan-900 dark:text-cyan-100 mt-2">{item.value}</p>
                </div>
                <BookOpen className="h-8 w-8 text-cyan-600 opacity-40" />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-600">{item.trend}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Workforce Intelligence */}
      <div className="max-w-7xl mx-auto">
        <Card className="p-6 border-0 shadow-sm bg-cyan-50/90 dark:bg-cyan-950/80">
          <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-100 mb-4">Workforce Intelligence</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productivityTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="week" stroke="rgba(0,0,0,0.5)" />
              <YAxis stroke="rgba(0,0,0,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '16px' }} />
              <Area type="monotone" dataKey="productivity" fill="#06b6d4" stroke="#06b6d4" fillOpacity={0.3} />
              <Area type="monotone" dataKey="utilization" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="engagement" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alerts & Risk Center */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-900 dark:text-cyan-100 mb-4">Alerts & Risk Center</h2>
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const Icon = alert.icon
            const colorClass = {
              high: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              medium: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
              low: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            }

            return (
              <Card
                key={idx}
                className={`p-4 border shadow-sm hover:shadow-md transition-all ${
                  colorClass[alert.severity as keyof typeof colorClass]
                } bg-cyan-50/90 dark:bg-cyan-950/80`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Icon
                      className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                        alert.severity === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : alert.severity === 'medium'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">{alert.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{alert.message}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`flex-shrink-0 ${
                      alert.severity === 'high'
                        ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                        : alert.severity === 'medium'
                        ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        : 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    Review
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
