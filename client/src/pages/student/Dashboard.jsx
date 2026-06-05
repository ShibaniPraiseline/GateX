import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [leaves,  setLeaves]  = useState([])
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState('dashboard') // 'dashboard' | 'apply' | 'leaves'
  const [form,    setForm]    = useState({
    type: 'regular', reason: '', destination: '', fromDate: '', toDate: ''
  })

  useEffect(() => { fetchLeaves() }, [])

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/leave/my')
      setLeaves(res.data.leaves)
    } catch {
      toast.error('Failed to fetch leaves')
    } finally {
      setLoading(false)
    }
  }

  const applyLeave = async (e) => {
    e.preventDefault()
    try {
      await api.post('/leave/apply', form)
      toast.success('Leave applied successfully!')
      setForm({ type:'regular', reason:'', destination:'', fromDate:'', toDate:'' })
      setView('leaves')
      fetchLeaves()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    }
  }

  const statusColor = (status) => ({
    pending:          '#fdcb6e',
    parent_approved:  '#74b9ff',
    tutor_approved:   '#a29bfe',
    fully_approved:   '#00b894',
    rejected:         '#d63031',
  }[status] || '#b2bec3')

  const statusLabel = (status) => ({
    pending:          'Pending',
    parent_approved:  'Parent Approved',
    tutor_approved:   'Tutor Approved',
    fully_approved:   'Fully Approved ✓',
    rejected:         'Rejected',
  }[status] || status)

  const active   = leaves.filter(l => l.status === 'fully_approved' && l.outpass)
  const pending  = leaves.filter(l => !['fully_approved','rejected'].includes(l.status))
  const rejected = leaves.filter(l => l.status === 'rejected')

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <h2 style={s.logo}>GateX</h2>
        <div style={s.userInfo}>
          <div style={s.avatar}>{user.name[0]}</div>
          <div>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>Student</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[
            { id:'dashboard', label:'📊 Dashboard' },
            { id:'apply',     label:'✏️ Apply Leave' },
            { id:'leaves',    label:'📋 My Leaves' },
            { id:'visitors',      label:'👥 Visitor Requests' },
            { id:'announcements', label:'📢 Announcements' },
          ].map(item => (
            <button
              key={item.id}
              style={{...s.navBtn, ...(view===item.id ? s.navActive : {})}}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </div>

      {/* Main content */}
      <div style={s.main}>

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div>
            <h1 style={s.pageTitle}>Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <div style={s.statsRow}>
              <div style={s.statCard}>
                <div style={s.statNum}>{pending.length}</div>
                <div style={s.statLabel}>Pending Requests</div>
              </div>
              <div style={s.statCard}>
                <div style={{...s.statNum, color:'#00b894'}}>{active.length}</div>
                <div style={s.statLabel}>Approved Leaves</div>
              </div>
              <div style={s.statCard}>
                <div style={{...s.statNum, color:'#d63031'}}>{rejected.length}</div>
                <div style={s.statLabel}>Rejected</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statNum}>{leaves.length}</div>
                <div style={s.statLabel}>Total Requests</div>
              </div>
            </div>

            <h2 style={s.sectionTitle}>Recent Leaves</h2>
            {loading ? <p>Loading...</p> : leaves.slice(0,5).map(leave => (
              <div key={leave._id} style={s.leaveCard}>
                <div style={s.leaveTop}>
                  <span style={s.leaveType}>{leave.type}</span>
                  <span style={{...s.badge, background: statusColor(leave.status)}}>
                    {statusLabel(leave.status)}
                  </span>
                </div>
                <p style={s.leaveReason}>{leave.reason}</p>
                <p style={s.leaveDates}>
                  {new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}
                </p>
                {leave.outpass && (
                  <div style={s.qrBox}>
                    <p style={{fontSize:'0.8rem', color:'#636e72', marginBottom:'0.5rem'}}>Your Outpass QR</p>
                    <img src={leave.outpass.qrImage} alt="QR Code" style={{width:'150px', height:'150px'}} />
                    <p style={{fontSize:'0.75rem', color:'#b2bec3', marginTop:'0.25rem'}}>Show this to security</p>
                  </div>
                )}
              </div>
            ))}

            {leaves.length === 0 && !loading && (
              <div style={s.empty}>
                <p>No leave requests yet.</p>
                <button style={s.applyBtn} onClick={() => setView('apply')}>Apply for Leave</button>
              </div>
            )}
          </div>
        )}

        {/* APPLY LEAVE VIEW */}
        {view === 'apply' && (
          <div>
            <h1 style={s.pageTitle}>Apply for Leave</h1>
            <div style={s.formCard}>
              <form onSubmit={applyLeave} style={s.form}>
                <div style={s.formRow}>
                  <div style={s.field}>
                    <label style={s.label}>Leave Type</label>
                    <select style={s.input} value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                      <option value="regular">Regular</option>
                      <option value="weekend">Weekend</option>
                      <option value="medical">Medical</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Destination</label>
                    <input style={s.input} placeholder="City / Address" value={form.destination} onChange={e => setForm({...form, destination:e.target.value})} required />
                  </div>
                </div>
                <div style={s.formRow}>
                  <div style={s.field}>
                    <label style={s.label}>From Date</label>
                    <input style={s.input} type="date" value={form.fromDate} onChange={e => setForm({...form, fromDate:e.target.value})} required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>To Date</label>
                    <input style={s.input} type="date" value={form.toDate} onChange={e => setForm({...form, toDate:e.target.value})} required />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Reason</label>
                  <textarea style={{...s.input, height:'100px', resize:'vertical'}} placeholder="Explain your reason..." value={form.reason} onChange={e => setForm({...form, reason:e.target.value})} required />
                </div>
                <button style={s.submitBtn} type="submit">Submit Application</button>
              </form>
            </div>
          </div>
        )}

        {/* MY LEAVES VIEW */}
        {view === 'leaves' && (
          <div>
            <h1 style={s.pageTitle}>My Leave Requests</h1>
            {loading ? <p>Loading...</p> : leaves.length === 0 ? (
              <div style={s.empty}><p>No leave requests found.</p></div>
            ) : leaves.map(leave => (
              <div key={leave._id} style={s.leaveCard}>
                <div style={s.leaveTop}>
                  <span style={s.leaveType}>{leave.type}</span>
                  <span style={{...s.badge, background: statusColor(leave.status)}}>
                    {statusLabel(leave.status)}
                  </span>
                </div>
                <p style={s.leaveReason}><strong>Reason:</strong> {leave.reason}</p>
                <p style={s.leaveReason}><strong>Destination:</strong> {leave.destination}</p>
                <p style={s.leaveDates}>
                  {new Date(leave.fromDate).toLocaleDateString()} → {new Date(leave.toDate).toLocaleDateString()}
                </p>
                <div style={s.approvalRow}>
                  {['parent','tutor','warden'].map(role => (
                    <div key={role} style={{...s.approvalChip, background: statusColor(leave.approvals?.[role]?.status)}}>
                      {role}: {leave.approvals?.[role]?.status || 'pending'}
                    </div>
                  ))}
                </div>
                {leave.outpass?.qrImage && (
                  <div style={s.qrBox}>
                    <p style={{fontSize:'0.8rem', color:'#636e72', marginBottom:'0.5rem'}}>Outpass QR Code</p>
                    <img src={leave.outpass.qrImage} alt="QR" style={{width:'150px', height:'150px'}} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {view === 'visitors' && <VisitorView />}
        {view === 'announcements' && <AnnouncementsView />}
      </div>
    </div>
  )
}
function VisitorView() {
  const [visitors, setVisitors] = useState([])
  const [form,     setForm]     = useState({ visitorName:'', visitorPhone:'', relation:'', purpose:'', visitDate:'' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.get('/visitor/my').then(r => setVisitors(r.data.visitors)).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/visitor/request', form)
      toast.success('Visitor request created')
      setShowForm(false)
      const res = await api.get('/visitor/my')
      setVisitors(res.data.visitors)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const confirm = async (id) => {
    try {
      await api.post(`/visitor/${id}/confirm`)
      toast.success('Visitor confirmed')
      const res = await api.get('/visitor/my')
      setVisitors(res.data.visitors)
    } catch (err) { toast.error('Failed') }
  }

  const statusColor = (st) => ({ pending:'#fdcb6e', student_confirmed:'#74b9ff', approved:'#00b894', rejected:'#d63031', visited:'#636e72' }[st] || '#b2bec3')

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h1 style={s.pageTitle}>Visitor Requests</h1>
        <button style={s.submitBtn} onClick={() => setShowForm(!showForm)}>+ New Visitor</button>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <form onSubmit={submit} style={s.form}>
            <div style={s.formRow}>
              <div style={s.field}><label style={s.label}>Visitor Name</label><input style={s.input} value={form.visitorName} onChange={e => setForm({...form, visitorName:e.target.value})} required /></div>
              <div style={s.field}><label style={s.label}>Phone</label><input style={s.input} value={form.visitorPhone} onChange={e => setForm({...form, visitorPhone:e.target.value})} required /></div>
            </div>
            <div style={s.formRow}>
              <div style={s.field}><label style={s.label}>Relation</label><input style={s.input} placeholder="Father / Mother / Guardian" value={form.relation} onChange={e => setForm({...form, relation:e.target.value})} required /></div>
              <div style={s.field}><label style={s.label}>Visit Date</label><input style={s.input} type="date" value={form.visitDate} onChange={e => setForm({...form, visitDate:e.target.value})} required /></div>
            </div>
            <div style={s.field}><label style={s.label}>Purpose</label><textarea style={{...s.input, height:'80px'}} value={form.purpose} onChange={e => setForm({...form, purpose:e.target.value})} required /></div>
            <button style={s.submitBtn} type="submit">Submit</button>
          </form>
        </div>
      )}

      {visitors.map(v => (
        <div key={v._id} style={s.leaveCard}>
          <div style={s.leaveTop}>
            <span style={s.leaveType}>{v.visitorName} ({v.relation})</span>
            <span style={{...s.badge, background: statusColor(v.status)}}>{v.status.replace(/_/g,' ')}</span>
          </div>
          <p style={s.leaveReason}>{v.purpose} · 📞 {v.visitorPhone}</p>
          <p style={s.leaveDates}>Visit: {new Date(v.visitDate).toLocaleDateString()}</p>
          {v.status === 'pending' && (
            <button style={{...s.submitBtn, marginTop:'0.75rem', padding:'0.5rem 1rem', fontSize:'0.85rem'}} onClick={() => confirm(v._id)}>Confirm Visit</button>
          )}
          {v.qrImage && (
            <div style={s.qrBox}>
              <p style={{fontSize:'0.8rem', color:'#636e72', marginBottom:'0.5rem'}}>Visitor QR Pass</p>
              <img src={v.qrImage} alt="Visitor QR" style={{width:'150px', height:'150px'}} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    api.get('/announcements').then(r => setAnnouncements(r.data.announcements)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 style={s.pageTitle}>Announcements</h1>
      {announcements.length === 0
        ? <div style={s.empty}><p>No announcements at the moment.</p></div>
        : announcements.map(a => (
          <div key={a._id} style={s.leaveCard}>
            <div style={s.leaveTop}>
              <span style={s.leaveType}>{a.title}</span>
              <span style={{color:'#b2bec3', fontSize:'0.8rem'}}>{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
            <p style={s.leaveReason}>{a.body}</p>
            <p style={{color:'#b2bec3', fontSize:'0.8rem', marginTop:'0.5rem'}}>Posted by {a.postedBy?.name}</p>
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
  avatar:      { width:'40px', height:'40px', borderRadius:'50%', background:'#6c5ce7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1.1rem' },
  userName:    { color:'#fff', fontWeight:'500', fontSize:'0.9rem' },
  userRole:    { color:'#b2bec3', fontSize:'0.75rem' },
  nav:         { display:'flex', flexDirection:'column', gap:'0.5rem', flex:1 },
  navBtn:      { padding:'0.75rem 1rem', background:'transparent', border:'none', color:'#b2bec3', borderRadius:'8px', textAlign:'left', fontSize:'0.9rem', cursor:'pointer' },
  navActive:   { background:'#6c5ce7', color:'#fff' },
  logoutBtn:   { padding:'0.75rem', background:'transparent', border:'1px solid #636e72', color:'#b2bec3', borderRadius:'8px', fontSize:'0.9rem' },
  main:        { marginLeft:'240px', padding:'2rem', flex:1 },
  pageTitle:   { fontSize:'1.75rem', fontWeight:'700', marginBottom:'1.5rem', color:'#2d3436' },
  statsRow:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'2rem' },
  statCard:    { background:'#fff', padding:'1.5rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  statNum:     { fontSize:'2rem', fontWeight:'700', color:'#6c5ce7' },
  statLabel:   { color:'#636e72', fontSize:'0.85rem', marginTop:'0.25rem' },
  sectionTitle:{ fontSize:'1.1rem', fontWeight:'600', marginBottom:'1rem', color:'#2d3436' },
  leaveCard:   { background:'#fff', padding:'1.25rem', borderRadius:'12px', marginBottom:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  leaveTop:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' },
  leaveType:   { fontWeight:'600', textTransform:'capitalize', color:'#2d3436' },
  badge:       { padding:'0.25rem 0.75rem', borderRadius:'99px', fontSize:'0.8rem', color:'#fff', fontWeight:'500' },
  leaveReason: { color:'#636e72', fontSize:'0.9rem', margin:'0.25rem 0' },
  leaveDates:  { color:'#b2bec3', fontSize:'0.85rem', marginTop:'0.25rem' },
  approvalRow: { display:'flex', gap:'0.5rem', marginTop:'0.75rem', flexWrap:'wrap' },
  approvalChip:{ padding:'0.2rem 0.6rem', borderRadius:'99px', fontSize:'0.75rem', color:'#fff' },
  qrBox:       { marginTop:'1rem', padding:'1rem', background:'#f5f6fa', borderRadius:'8px', display:'inline-block' },
  formCard:    { background:'#fff', padding:'2rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', maxWidth:'700px' },
  form:        { display:'flex', flexDirection:'column', gap:'1.25rem' },
  formRow:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  field:       { display:'flex', flexDirection:'column', gap:'0.4rem' },
  label:       { fontSize:'0.875rem', fontWeight:'500', color:'#2d3436' },
  input:       { padding:'0.75rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.95rem', outline:'none' },
  submitBtn:   { padding:'0.875rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', fontWeight:'600' },
  empty:       { textAlign:'center', padding:'3rem', color:'#636e72' },
  applyBtn:    { marginTop:'1rem', padding:'0.75rem 1.5rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer' },
}