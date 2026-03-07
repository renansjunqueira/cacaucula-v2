import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { ChevronLeft, ChevronRight, BarChart2, TrendingUp, Users, Clock } from 'lucide-react'
import '../styles/Dashboard.css'

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

const CHART_COLORS = [
  '#C65348', '#E7B15B', '#D9B3C9', '#6B9AC4', '#7BC67E',
  '#E88F6A', '#9B6EA3', '#4ECDC4', '#F7DC6F', '#A8D8B9'
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: 13,
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: <strong>{Number(entry.value).toFixed(1)}h</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { isAdmin, collaborator: currentUser } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [loading, setLoading] = useState(true)
  const [barData, setBarData] = useState([])      // [{ name: 'Ana', total: 120 }]
  const [pieData, setPieData] = useState([])       // [{ name: 'Proj X', value: 50 }]
  const [detailedData, setDetailedData] = useState([]) // per collaborator+project stacked
  const [stats, setStats] = useState({ totalHours: 0, activeCollabs: 0, activeProjects: 0 })

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

      let logsQuery = supabase
        .from('time_logs')
        .select(`
          logged_hours,
          collaborator_id,
          project_id,
          collaborators ( name ),
          projects ( name )
        `)
        .gte('date', startDate)
        .lte('date', endDate)

      if (!isAdmin) logsQuery = logsQuery.eq('collaborator_id', currentUser.id)

      const { data: logs, error } = await logsQuery

      if (error) {
        setLoading(false)
        return
      }

      const totalHours = (logs || []).reduce((sum, l) => sum + Number(l.logged_hours), 0)

      // Bar chart: hours per collaborator
      const collabMap = {}
      const projectMap = {}
      const collabProjectMap = {} // { collabName: { projName: hours } }

      for (const log of logs || []) {
        const collabName = log.collaborators?.name || log.collaborator_id
        const projName = log.projects?.name || log.project_id
        const h = Number(log.logged_hours)

        collabMap[collabName] = (collabMap[collabName] || 0) + h
        projectMap[projName] = (projectMap[projName] || 0) + h

        if (!collabProjectMap[collabName]) collabProjectMap[collabName] = {}
        collabProjectMap[collabName][projName] = (collabProjectMap[collabName][projName] || 0) + h
      }

      const bar = Object.entries(collabMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, total]) => ({ name, total: Number(total.toFixed(1)) }))

      const pie = Object.entries(projectMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value: Number(value.toFixed(1)) }))

      // Stacked bar: projects per collaborator
      const allProjects = Object.keys(projectMap)
      const detailed = Object.entries(collabProjectMap).map(([collab, projs]) => {
        const entry = { name: collab }
        for (const proj of allProjects) {
          entry[proj] = Number((projs[proj] || 0).toFixed(1))
        }
        return entry
      })

      const activeCollabs = new Set((logs || []).map(l => l.collaborator_id)).size
      const activeProjects = new Set((logs || []).map(l => l.project_id)).size

      setBarData(bar)
      setPieData(pie)
      setDetailedData({ rows: detailed, projects: allProjects })
      setStats({
        totalHours: Number(totalHours.toFixed(1)),
        activeCollabs,
        activeProjects,
      })
      setLoading(false)
    }
    load()
  }, [year, month, isAdmin, currentUser])

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: `${color}18` }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão consolidada das horas registradas</p>
        </div>

        <div className="month-selector">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span className="month-label">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="stats-grid">
            <StatCard
              icon={Clock}
              label="Horas no mês"
              value={`${stats.totalHours}h`}
              color="var(--color-primary)"
            />
            {isAdmin && (
              <StatCard
                icon={Users}
                label="Colaboradores ativos"
                value={stats.activeCollabs}
                color="var(--color-secondary)"
              />
            )}
            <StatCard
              icon={TrendingUp}
              label="Projetos com lançamentos"
              value={stats.activeProjects}
              color="#6B9AC4"
            />
          </div>

          <div className="charts-grid">
            {/* Bar chart: total by collaborator — admin only */}
            {isAdmin && <div className="card chart-card">
              <div className="chart-header">
                <BarChart2 size={18} color="var(--color-primary)" />
                <h3 className="chart-title">Horas por Colaborador</h3>
              </div>
              {barData.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 24px' }}>
                  <p>Nenhum registro encontrado neste mês.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#6b6b6b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b6b6b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Horas"
                      fill="var(--color-primary)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>}

            {/* Pie chart: distribution by project */}
            <div className="card chart-card">
              <div className="chart-header">
                <div style={{
                  width: 18, height: 18,
                  background: 'var(--color-secondary)',
                  borderRadius: '50%',
                  flexShrink: 0
                }} />
                <h3 className="chart-title">Distribuição por Projeto</h3>
              </div>
              {pieData.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 24px' }}>
                  <p>Nenhum registro encontrado neste mês.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={40}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: '#6b6b6b' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Stacked bar: projects per collaborator — admin only */}
          {isAdmin && detailedData.rows?.length > 0 && detailedData.projects?.length > 0 && (
            <div className="card chart-card" style={{ marginTop: 20 }}>
              <div className="chart-header">
                <BarChart2 size={18} color="var(--color-primary)" />
                <h3 className="chart-title">Horas por Projeto × Colaborador</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={detailedData.rows} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b6b6b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={v => <span style={{ fontSize: 12, color: '#6b6b6b' }}>{v}</span>} />
                  {detailedData.projects.map((proj, i) => (
                    <Bar
                      key={proj}
                      dataKey={proj}
                      stackId="a"
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      radius={i === detailedData.projects.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
