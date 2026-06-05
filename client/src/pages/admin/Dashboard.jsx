import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [view,    setView]    = useState('dashboard')
  const [stats,   setStats]   = useState(null)
  const [late,    setLate]    = useState([])

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.stats)).catch(() => {})
    api.get('/dashboard/late-returns').then(r => setLate(r.data.lateStudents)).catch(() => {})
  }, [])

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <h2 style={s.logo}>GateX</h2>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0]}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Admin</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[
            { id:'dashboard',    label:'📊 Dashboard' },
            { id:'late',         label:'⚠️ Late Returns' },
            { id:'report',       label:'📈 Monthly Report' },
          ].map(item => (
            <button key={item.id} style={{...s.navBtn, ...(view===item.id ? s.navActive : {})}} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </div>

      <div style={s.main}>

        {view === 'dashboard' && (
          <div>
            <h1 style={s.pageTitle}>Admin Dashboard</h1>
            {stats ? (
              <div style={s.statsRow}>
                {[
                  { label:'Total Students',    value: stats.totalStudents,   color:'#6c5ce7' },
                  { label:'Inside Hostel',     value: stats.studentsInside,  color:'#00b894' },
                  { label:'Outside Hostel',    value: stats.studentsOutside, color:'#fdcb6e' },
                  { label:'Pending Leaves',    value: stats.pendingLeaves,   color:'#e17055' },
                  { label:'Late Returns',      value: stats.lateReturns,     color:'#d63031' },
                  { label:'Today Exits',       value: stats.todayExits,      color:'#74b9ff' },
                ].map(stat => (
                  <div key={stat.label} style={s.statCard}>
                    <div style={{...s.statNum, color: stat.color}}>{stat.value}</div>
                    <div style={s.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            ) : <p>Loading stats...</p>}

            {late.length > 0 && (
              <div style={s.alertBox}>
                <h3 style={s.alertTitle}>⚠️ {late.length} Late Return{late.length > 1 ? 's' : ''}</h3>
                {late.map((student, i) => (
                  <div key={i} style={s.alertRow}>
                    <span>{student.studentName} ({student.rollNumber})</span>
                    <span style={{color:'#d63031'}}>{student.minutesLate} mins late</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'late' && (
          <div>
            <h1 style={s.pageTitle}>Late Returns</h1>
            {late.length === 0
              ? <div style={s.empty}><p>No late returns. All students returned on time.</p></div>
              : late.map((student, i) => (
                <div key={i} style={s.lateCard}>
                  <div style={s.lateTop}>
                    <span style={s.studentName}>{student.studentName}</span>
                    <span style={{...s.badge, background:'#d63031'}}>{student.minutesLate} mins late</span>
                  </div>
                  <div style={s.lateDetails}>
                    <span>Roll: {student.rollNumber}</span>
                    <span>Block: {student.hostelBlock}</span>
                    <span>Destination: {student.destination}</span>
                    <span>Expected: {new Date(student.expectedReturn).toLocaleString()}</span>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {view === 'report' && <MonthlyReport />}
      </div>
    </div>
  )
}

function MonthlyReport() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [month,   setMonth]   = useState(new Date().getMonth())
  const [year,    setYear]    = useState(new Date().getFullYear())

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/dashboard/monthly-report?month=${month}&year=${year}`)
      setReport(res.data)
    } catch { toast.error('Failed to fetch report') }
    finally   { setLoading(false) }
  }

  useEffect(() => { fetchReport() }, [])

  return (
    <div>
      <h1 style={s.pageTitle}>Monthly Report</h1>
      <div style={s.filterRow}>
        <select style={s.select} value={month} onChange={e => setMonth(e.target.value)}>
          {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <input style={s.select} type="number" value={year} onChange={e => setYear(e.target.value)} />
        <button style={s.fetchBtn} onClick={fetchReport}>Generate</button>
      </div>

      {loading ? <p>Loading...</p> : report && (
        <div>
          <div style={s.summaryRow}>
            {[
              { label:'Total',    value: report.summary.total,    color:'#6c5ce7' },
              { label:'Approved', value: report.summary.approved, color:'#00b894' },
              { label:'Rejected', value: report.summary.rejected, color:'#d63031' },
              { label:'Pending',  value: report.summary.pending,  color:'#fdcb6e' },
            ].map(item => (
              <div key={item.label} style={s.statCard}>
                <div style={{...s.statNum, color: item.color}}>{item.value}</div>
                <div style={s.statLabel}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={s.typeRow}>
            {Object.entries(report.summary.byType).map(([type, count]) => (
              <div key={type} style={s.typeCard}>
                <div style={s.typeCount}>{count}</div>
                <div style={s.typeLabel}>{type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page:        { display:'flex', minHeight:'100vh', background:'#f5f6fa' },
  sidebar:     { width:'240px', background:'#2d3436', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', position:'fixed', height:'100vh' },
  logo:        { color:'#6c5ce7', fontSize:'1.5rem', fontWeight:'700' },
  userInfo:    { display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 0', borderBottom:'1px solid #636e72' },
  avatar:      { width:'40px', height:'40px', borderRadius:'50%', background:'#74b9ff', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1.1rem' },
  userName:    { color:'#fff', fontWeight:'500', fontSize:'0.9rem' },
  userRole:    { color:'#b2bec3', fontSize:'0.75rem' },
  nav:         { display:'flex', flexDirection:'column', gap:'0.5rem', flex:1 },
  navBtn:      { padding:'0.75rem 1rem', background:'transparent', border:'none', color:'#b2bec3', borderRadius:'8px', textAlign:'left', fontSize:'0.9rem', cursor:'pointer' },
  navActive:   { background:'#6c5ce7', color:'#fff' },
  logoutBtn:   { padding:'0.75rem', background:'transparent', border:'1px solid #636e72', color:'#b2bec3', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer' },
  main:        { marginLeft:'240px', padding:'2rem', flex:1 },
  pageTitle:   { fontSize:'1.75rem', fontWeight:'700', marginBottom:'1.5rem', color:'#2d3436' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  statCard:    { background:'#fff', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  statNum:     { fontSize:'2rem', fontWeight:'700' },
  statLabel:   { color:'#636e72', fontSize:'0.85rem', marginTop:'0.25rem' },
  alertBox:    { background:'#fff5f5', border:'1.5px solid #d63031', borderRadius:'12px', padding:'1.25rem', marginTop:'1.5rem' },
  alertTitle:  { color:'#d63031', fontWeight:'600', marginBottom:'0.75rem' },
  alertRow:    { display:'flex', justifyContent:'space-between', padding:'0.4rem 0', borderTop:'1px solid #ffeaea', fontSize:'0.9rem' },
  lateCard:    { background:'#fff', padding:'1.25rem', borderRadius:'12px', marginBottom:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:'4px solid #d63031' },
  lateTop:     { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' },
  studentName: { fontWeight:'600', color:'#2d3436' },
  badge:       { padding:'0.25rem 0.75rem', borderRadius:'99px', fontSize:'0.8rem', color:'#fff', fontWeight:'500' },
  lateDetails: { display:'flex', gap:'1rem', color:'#636e72', fontSize:'0.85rem', flexWrap:'wrap' },
  empty:       { textAlign:'center', padding:'3rem', color:'#636e72', background:'#fff', borderRadius:'12px' },
  filterRow:   { display:'flex', gap:'1rem', marginBottom:'1.5rem', alignItems:'center' },
  select:      { padding:'0.6rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.9rem', outline:'none' },
  fetchBtn:    { padding:'0.6rem 1.25rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer' },
  summaryRow:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  typeRow:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' },
  typeCard:    { background:'#fff', padding:'1.25rem', borderRadius:'12px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  typeCount:   { fontSize:'1.75rem', fontWeight:'700', color:'#6c5ce7' },
  typeLabel:   { color:'#636e72', fontSize:'0.85rem', textTransform:'capitalize', marginTop:'0.25rem' },
}