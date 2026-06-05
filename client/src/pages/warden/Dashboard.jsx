import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [view,    setView]    = useState('dashboard')
  const [stats,   setStats]   = useState(null)
  const [leaves,  setLeaves]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchPending()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats')
      setStats(res.data.stats)
    } catch { toast.error('Failed to fetch stats') }
  }

  const fetchPending = async () => {
    try {
      const res = await api.get('/leave/pending')
      setLeaves(res.data.leaves)
    } catch { toast.error('Failed to fetch leaves') } 
    finally { setLoading(false) }
  }

  const processLeave = async (id, action, comment='') => {
    try {
      await api.post(`/leave/${id}/approve`, { action, comment })
      toast.success(`Leave ${action} successfully`)
      fetchPending()
      fetchStats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    }
  }

  const statusColor = (s) => ({ pending:'#fdcb6e', parent_approved:'#74b9ff', tutor_approved:'#a29bfe', fully_approved:'#00b894', rejected:'#d63031' }[s] || '#b2bec3')

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <h2 style={s.logo}>GateX</h2>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0]}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Warden</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[
            { id:'dashboard', label:'📊 Dashboard' },
            { id:'pending',   label:'📋 Pending Approvals' },
            { id:'all',       label:'📁 All Leaves' },
            { id:'visitors', label:'👥 Visitor Approvals' },
          ].map(item => (
            <button key={item.id} style={{...s.navBtn, ...(view===item.id ? s.navActive : {})}} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </div>

      <div style={s.main}>

        {view === 'dashboard' && stats && (
          <div>
            <h1 style={s.pageTitle}>Warden Dashboard</h1>
            <div style={s.statsRow}>
              {[
                { label:'Total Students',    value: stats.totalStudents,    color:'#6c5ce7' },
                { label:'Inside Hostel',     value: stats.studentsInside,   color:'#00b894' },
                { label:'Outside Hostel',    value: stats.studentsOutside,  color:'#fdcb6e' },
                { label:'Pending Approvals', value: stats.pendingLeaves,    color:'#e17055' },
                { label:'Late Returns',      value: stats.lateReturns,      color:'#d63031' },
                { label:'Today Exits',       value: stats.todayExits,       color:'#74b9ff' },
              ].map(stat => (
                <div key={stat.label} style={s.statCard}>
                  <div style={{...s.statNum, color: stat.color}}>{stat.value}</div>
                  <div style={s.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={s.refreshRow}>
              <button style={s.refreshBtn} onClick={() => { fetchStats(); fetchPending() }}>↻ Refresh</button>
              <span style={s.cacheNote}>Stats cached for 60s</span>
            </div>

            <h2 style={s.sectionTitle}>Pending Approvals ({leaves.length})</h2>
            {leaves.slice(0,3).map(leave => (
              <LeaveCard key={leave._id} leave={leave} onProcess={processLeave} statusColor={statusColor} />
            ))}
            {leaves.length === 0 && <p style={{color:'#636e72'}}>No pending approvals.</p>}
          </div>
        )}

        {view === 'pending' && (
          <div>
            <h1 style={s.pageTitle}>Pending Approvals</h1>
            {loading ? <p>Loading...</p> : leaves.length === 0
              ? <p style={{color:'#636e72'}}>No pending approvals.</p>
              : leaves.map(leave => (
                <LeaveCard key={leave._id} leave={leave} onProcess={processLeave} statusColor={statusColor} />
              ))
            }
          </div>
        )}

        {view === 'all' && <AllLeaves statusColor={statusColor} />}
        {view === 'visitors' && <VisitorApprovals />}
      </div>
    </div>
  )
}

function LeaveCard({ leave, onProcess, statusColor }) {
  const [comment, setComment] = useState('')
  const [open,    setOpen]    = useState(false)

  return (
    <div style={s.leaveCard}>
      <div style={s.leaveTop}>
        <div>
          <span style={s.studentName}>{leave.student?.name}</span>
          <span style={s.rollNum}> · {leave.student?.rollNumber} · {leave.student?.hostelBlock}-{leave.student?.roomNumber}</span>
        </div>
        <span style={{...s.badge, background: statusColor(leave.status)}}>
          {leave.status.replace(/_/g,' ')}
        </span>
      </div>
      <div style={s.leaveDetails}>
        <span style={s.leaveType}>{leave.type}</span>
        <span>{leave.destination}</span>
        <span>{new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}</span>
      </div>
      <p style={s.leaveReason}>{leave.reason}</p>

      <div style={s.actionRow}>
        <button style={s.approveBtn} onClick={() => onProcess(leave._id, 'approved', comment)}>✓ Approve</button>
        <button style={s.rejectBtn}  onClick={() => onProcess(leave._id, 'rejected', comment)}>✗ Reject</button>
        <button style={s.detailBtn}  onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Add Comment'}
        </button>
      </div>

      {open && (
        <textarea
          style={{...s.commentBox}}
          placeholder="Optional comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />
      )}
    </div>
  )
}

function AllLeaves({ statusColor }) {
  const [leaves,  setLeaves]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/leave/all')
      .then(res => setLeaves(res.data.leaves))
      .catch(() => toast.error('Failed to fetch'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 style={s.pageTitle}>All Leave Requests</h1>
      {leaves.map(leave => (
        <div key={leave._id} style={s.leaveCard}>
          <div style={s.leaveTop}>
            <span style={s.studentName}>{leave.student?.name} · {leave.student?.rollNumber}</span>
            <span style={{...s.badge, background: statusColor(leave.status)}}>{leave.status.replace(/_/g,' ')}</span>
          </div>
          <div style={s.leaveDetails}>
            <span>{leave.type}</span>
            <span>{leave.destination}</span>
            <span>{new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function VisitorApprovals() {
  const [visitors, setVisitors] = useState([])

  useEffect(() => {
    api.get('/visitor/pending').then(r => setVisitors(r.data.visitors)).catch(() => {})
  }, [])

  const process = async (id, action) => {
    try {
      await api.post(`/visitor/${id}/approve`, { action })
      toast.success(`Visitor ${action}`)
      const res = await api.get('/visitor/pending')
      setVisitors(res.data.visitors)
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <h1 style={s.pageTitle}>Pending Visitor Approvals ({visitors.length})</h1>
      {visitors.length === 0
        ? <p style={{color:'#636e72'}}>No pending visitor approvals.</p>
        : visitors.map(v => (
          <div key={v._id} style={s.leaveCard}>
            <div style={s.leaveTop}>
              <span style={s.studentName}>{v.visitorName} → {v.student?.name}</span>
              <span style={{...s.badge, background:'#74b9ff'}}>Awaiting Approval</span>
            </div>
            <div style={s.leaveDetails}>
              <span>📞 {v.visitorPhone}</span>
              <span>Relation: {v.relation}</span>
              <span>📅 {new Date(v.visitDate).toLocaleDateString()}</span>
              <span>Block: {v.student?.hostelBlock}</span>
            </div>
            <p style={s.leaveReason}>{v.purpose}</p>
            <div style={s.actionRow}>
              <button style={s.approveBtn} onClick={() => process(v._id, 'approved')}>✓ Approve</button>
              <button style={s.rejectBtn}  onClick={() => process(v._id, 'rejected')}>✗ Reject</button>
            </div>
          </div>
        ))
      }
    </div>
  )
}

const s = {
  page:        { display:'flex', minHeight:'100vh', background:'#f5f6fa' },
  sidebar:     { width:'240px', background:'#2d3436', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', position:'fixed', height:'100vh' },
  logo:        { color:'#6c5ce7', fontSize:'1.5rem', fontWeight:'700' },
  userInfo:    { display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 0', borderBottom:'1px solid #636e72' },
  avatar:      { width:'40px', height:'40px', borderRadius:'50%', background:'#00b894', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1.1rem' },
  userName:    { color:'#fff', fontWeight:'500', fontSize:'0.9rem' },
  userRole:    { color:'#b2bec3', fontSize:'0.75rem' },
  nav:         { display:'flex', flexDirection:'column', gap:'0.5rem', flex:1 },
  navBtn:      { padding:'0.75rem 1rem', background:'transparent', border:'none', color:'#b2bec3', borderRadius:'8px', textAlign:'left', fontSize:'0.9rem', cursor:'pointer' },
  navActive:   { background:'#6c5ce7', color:'#fff' },
  logoutBtn:   { padding:'0.75rem', background:'transparent', border:'1px solid #636e72', color:'#b2bec3', borderRadius:'8px', fontSize:'0.9rem' },
  main:        { marginLeft:'240px', padding:'2rem', flex:1 },
  pageTitle:   { fontSize:'1.75rem', fontWeight:'700', marginBottom:'1.5rem', color:'#2d3436' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  statCard:    { background:'#fff', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  statNum:     { fontSize:'2rem', fontWeight:'700' },
  statLabel:   { color:'#636e72', fontSize:'0.85rem', marginTop:'0.25rem' },
  refreshRow:  { display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' },
  refreshBtn:  { padding:'0.5rem 1rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  cacheNote:   { color:'#b2bec3', fontSize:'0.8rem' },
  sectionTitle:{ fontSize:'1.1rem', fontWeight:'600', marginBottom:'1rem' },
  leaveCard:   { background:'#fff', padding:'1.25rem', borderRadius:'12px', marginBottom:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  leaveTop:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' },
  studentName: { fontWeight:'600', color:'#2d3436' },
  rollNum:     { color:'#636e72', fontSize:'0.85rem' },
  badge:       { padding:'0.25rem 0.75rem', borderRadius:'99px', fontSize:'0.8rem', color:'#fff', fontWeight:'500' },
  leaveDetails:{ display:'flex', gap:'1rem', color:'#636e72', fontSize:'0.85rem', margin:'0.5rem 0', flexWrap:'wrap' },
  leaveType:   { textTransform:'capitalize', fontWeight:'500', color:'#2d3436' },
  leaveReason: { color:'#636e72', fontSize:'0.9rem', margin:'0.25rem 0' },
  actionRow:   { display:'flex', gap:'0.75rem', marginTop:'1rem' },
  approveBtn:  { padding:'0.5rem 1.25rem', background:'#00b894', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  rejectBtn:   { padding:'0.5rem 1.25rem', background:'#d63031', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  detailBtn:   { padding:'0.5rem 1.25rem', background:'#f5f6fa', color:'#636e72', border:'1px solid #dfe6e9', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  commentBox:  { width:'100%', marginTop:'0.75rem', padding:'0.75rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.9rem', resize:'vertical', height:'80px' },
}