import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [leaves,  setLeaves]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPending() }, [])

  const fetchPending = async () => {
    try {
      const res = await api.get('/leave/pending')
      setLeaves(res.data.leaves)
    } catch { toast.error('Failed to fetch') }
    finally   { setLoading(false) }
  }

  const processLeave = async (id, action) => {
    try {
      await api.post(`/leave/${id}/approve`, { action })
      toast.success(`Leave ${action}`)
      fetchPending()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.sidebar}>
        <h2 style={s.logo}>GateX</h2>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0]}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Parent</div>
          </div>
        </div>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </div>

      <div style={s.main}>
        <h1 style={s.pageTitle}>Leave Approval Requests</h1>
        <p style={{color:'#636e72', marginBottom:'1.5rem'}}>Review and approve your child's leave requests.</p>

        {loading ? <p>Loading...</p> : leaves.length === 0
          ? <div style={s.empty}><p>No pending requests from your child.</p></div>
          : leaves.map(leave => (
            <div key={leave._id} style={s.leaveCard}>
              <div style={s.leaveTop}>
                <span style={s.studentName}>{leave.student?.name}</span>
                <span style={{...s.badge, background:'#fdcb6e'}}>Awaiting Your Approval</span>
              </div>
              <div style={s.leaveDetails}>
                <span style={{textTransform:'capitalize', fontWeight:'500'}}>{leave.type} Leave</span>
                <span>📍 {leave.destination}</span>
                <span>📅 {new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}</span>
              </div>
              <p style={s.leaveReason}>"{leave.reason}"</p>
              <div style={s.actionRow}>
                <button style={s.approveBtn} onClick={() => processLeave(leave._id, 'approved')}>✓ Approve</button>
                <button style={s.rejectBtn}  onClick={() => processLeave(leave._id, 'rejected')}>✗ Reject</button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

const s = {
  page:        { display:'flex', minHeight:'100vh', background:'#f5f6fa' },
  sidebar:     { width:'240px', background:'#2d3436', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', position:'fixed', height:'100vh' },
  logo:        { color:'#6c5ce7', fontSize:'1.5rem', fontWeight:'700' },
  userInfo:    { display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 0', borderBottom:'1px solid #636e72' },
  avatar:      { width:'40px', height:'40px', borderRadius:'50%', background:'#fd79a8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1.1rem' },
  userName:    { color:'#fff', fontWeight:'500', fontSize:'0.9rem' },
  userRole:    { color:'#b2bec3', fontSize:'0.75rem' },
  logoutBtn:   { marginTop:'auto', padding:'0.75rem', background:'transparent', border:'1px solid #636e72', color:'#b2bec3', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer' },
  main:        { marginLeft:'240px', padding:'2rem', flex:1 },
  pageTitle:   { fontSize:'1.75rem', fontWeight:'700', marginBottom:'0.5rem', color:'#2d3436' },
  leaveCard:   { background:'#fff', padding:'1.25rem', borderRadius:'12px', marginBottom:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  leaveTop:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' },
  studentName: { fontWeight:'600', color:'#2d3436', fontSize:'1rem' },
  badge:       { padding:'0.25rem 0.75rem', borderRadius:'99px', fontSize:'0.8rem', color:'#fff', fontWeight:'500' },
  leaveDetails:{ display:'flex', gap:'1rem', color:'#636e72', fontSize:'0.85rem', margin:'0.5rem 0', flexWrap:'wrap' },
  leaveReason: { color:'#636e72', fontSize:'0.9rem', fontStyle:'italic', margin:'0.5rem 0' },
  actionRow:   { display:'flex', gap:'0.75rem', marginTop:'1rem' },
  approveBtn:  { padding:'0.5rem 1.25rem', background:'#00b894', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  rejectBtn:   { padding:'0.5rem 1.25rem', background:'#d63031', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  empty:       { textAlign:'center', padding:'3rem', color:'#636e72', background:'#fff', borderRadius:'12px' },
}