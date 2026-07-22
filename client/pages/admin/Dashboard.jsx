import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [view,  setView]  = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [late,  setLate]  = useState([])

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
            { id:'dashboard',   label:'📊 Dashboard'       },
            { id:'staff',       label:'👤 Create Staff'    },
            { id:'students',    label:'🎓 Students'        },
            { id:'link-parent', label:'👨‍👩‍👧 Link Parent'     },
            { id:'link-tutor',  label:'🔗 Assign Tutor'   },
            { id:'late',        label:'⚠️ Late Returns'    },
            { id:'report',      label:'📈 Monthly Report'  },
          ].map(item => (
            <button key={item.id} style={{...s.navBtn, ...(view===item.id ? s.navActive : {})}} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </div>

      <div style={s.main}>
        {view === 'dashboard'   && <StatsView stats={stats} late={late} />}
        {view === 'staff'       && <CreateStaff />}
        {view === 'students'    && <StudentsList />}
        {view === 'link-parent' && <LinkParent />}
        {view === 'link-tutor'  && <LinkTutor />}
        {view === 'late'        && <LateReturns late={late} />}
        {view === 'report'      && <MonthlyReport />}
      </div>
    </div>
  )
}

function StatsView({ stats, late }) {
  return (
    <div>
      <h1 style={s.pageTitle}>Admin Dashboard</h1>
      {stats ? (
        <div style={s.statsRow}>
          {[
            { label:'Total Students',  value: stats.totalStudents,   color:'#6c5ce7' },
            { label:'Inside Hostel',   value: stats.studentsInside,  color:'#00b894' },
            { label:'Outside Hostel',  value: stats.studentsOutside, color:'#fdcb6e' },
            { label:'Pending Leaves',  value: stats.pendingLeaves,   color:'#e17055' },
            { label:'Late Returns',    value: stats.lateReturns,     color:'#d63031' },
            { label:'Today Exits',     value: stats.todayExits,      color:'#74b9ff' },
          ].map(stat => (
            <div key={stat.label} style={s.statCard}>
              <div style={{...s.statNum, color: stat.color}}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      ) : <p>Loading...</p>}
      {late.length > 0 && (
        <div style={s.alertBox}>
          <h3 style={s.alertTitle}>⚠️ {late.length} Late Return{late.length > 1 ? 's' : ''}</h3>
          {late.map((st, i) => (
            <div key={i} style={s.alertRow}>
              <span>{st.studentName} ({st.rollNumber})</span>
              <span style={{color:'#d63031'}}>{st.minutesLate} mins late</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateStaff() {
  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'warden' })
  const [loading, setLoading] = useState(false)
  const [staff,   setStaff]   = useState([])

  useEffect(() => {
    api.get('/admin/staff').then(r => setStaff(r.data.staff)).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/admin/create-staff', form)
      toast.success(`${form.role} account created!`)
      setForm({ name:'', email:'', password:'', role:'warden' })
      const res = await api.get('/admin/staff')
      setStaff(res.data.staff)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h1 style={s.pageTitle}>Create Staff Account</h1>
      <div style={s.formCard}>
        <form onSubmit={submit} style={s.form}>
          <div style={s.formRow}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input style={s.input} type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
            </div>
          </div>
          <div style={s.formRow}>
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Role</label>
              <select style={s.input} value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
                <option value="warden">Warden</option>
                <option value="tutor">Tutor</option>
                <option value="security">Security</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button style={s.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>

      <h2 style={{...s.pageTitle, fontSize:'1.25rem', marginTop:'2rem'}}>Existing Staff ({staff.length})</h2>
      {staff.map(st => (
        <div key={st._id} style={s.leaveCard}>
          <div style={s.leaveTop}>
            <span style={s.studentName}>{st.name}</span>
            <span style={{...s.badge, background: roleColor(st.role)}}>{st.role}</span>
          </div>
          <p style={{color:'#636e72', fontSize:'0.85rem'}}>{st.email}</p>
        </div>
      ))}
    </div>
  )
}

function StudentsList() {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/admin/students')
      .then(r => setStudents(r.data.students))
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 style={s.pageTitle}>Registered Students ({students.length})</h1>
      {loading ? <p>Loading...</p> : students.map(st => (
        <div key={st._id} style={s.leaveCard}>
          <div style={s.leaveTop}>
            <span style={s.studentName}>{st.name}</span>
            <span style={{...s.badge, background:'#6c5ce7'}}>{st.rollNumber}</span>
          </div>
          <div style={{display:'flex', gap:'1rem', color:'#636e72', fontSize:'0.85rem'}}>
            <span>{st.department}</span>
            <span>Block {st.hostelBlock} · Room {st.roomNumber}</span>
            <span>Year {st.year}</span>
            <span>{st.email}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function LinkParent() {
  const [students, setStudents] = useState([])
  const [form,     setForm]     = useState({ studentId:'', parentName:'', parentEmail:'', parentPassword:'' })
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    api.get('/admin/students').then(r => setStudents(r.data.students)).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/admin/link-parent', form)
      toast.success('Parent linked successfully!')
      setForm({ studentId:'', parentName:'', parentEmail:'', parentPassword:'' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h1 style={s.pageTitle}>Link Parent to Student</h1>
      <div style={s.formCard}>
        <form onSubmit={submit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Select Student</label>
            <select style={s.input} value={form.studentId} onChange={e => setForm({...form, studentId:e.target.value})} required>
              <option value="">-- Select Student --</option>
              {students.map(st => (
                <option key={st._id} value={st._id}>{st.name} ({st.rollNumber})</option>
              ))}
            </select>
          </div>
          <div style={s.formRow}>
            <div style={s.field}>
              <label style={s.label}>Parent Name</label>
              <input style={s.input} value={form.parentName} onChange={e => setForm({...form, parentName:e.target.value})} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Parent Email</label>
              <input style={s.input} type="email" value={form.parentEmail} onChange={e => setForm({...form, parentEmail:e.target.value})} required />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Parent Password</label>
            <input style={s.input} type="password" placeholder="Temporary password for parent" value={form.parentPassword} onChange={e => setForm({...form, parentPassword:e.target.value})} required />
          </div>
          <button style={s.submitBtn} disabled={loading}>
            {loading ? 'Linking...' : 'Link Parent'}
          </button>
        </form>
      </div>
    </div>
  )
}

function LinkTutor() {
  const [students, setStudents] = useState([])
  const [staff,    setStaff]    = useState([])
  const [tutorId,  setTutorId]  = useState('')
  const [selected, setSelected] = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    api.get('/admin/students').then(r => setStudents(r.data.students)).catch(() => {})
    api.get('/admin/staff').then(r => setStaff(r.data.staff.filter(s => s.role === 'tutor'))).catch(() => {})
  }, [])

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const submit = async () => {
    if (!tutorId || selected.length === 0) return toast.error('Select tutor and students')
    setLoading(true)
    try {
      await api.post('/admin/link-tutor', { tutorId, studentIds: selected })
      toast.success('Students assigned to tutor!')
      setSelected([])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h1 style={s.pageTitle}>Assign Students to Tutor</h1>
      <div style={s.formCard}>
        <div style={s.field}>
          <label style={s.label}>Select Tutor</label>
          <select style={s.input} value={tutorId} onChange={e => setTutorId(e.target.value)}>
            <option value="">-- Select Tutor --</option>
            {staff.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{marginTop:'1rem'}}>
          <label style={s.label}>Select Students ({selected.length} selected)</label>
          <div style={{marginTop:'0.5rem', maxHeight:'400px', overflowY:'auto'}}>
            {students.map(st => (
              <div key={st._id} style={{...s.leaveCard, cursor:'pointer', border: selected.includes(st._id) ? '2px solid #6c5ce7' : '2px solid transparent'}} onClick={() => toggle(st._id)}>
                <div style={s.leaveTop}>
                  <span style={s.studentName}>{st.name}</span>
                  <span style={{color:'#636e72', fontSize:'0.85rem'}}>{st.rollNumber}</span>
                </div>
                <p style={{color:'#636e72', fontSize:'0.85rem'}}>{st.department} · Block {st.hostelBlock}</p>
              </div>
            ))}
          </div>
        </div>
        <button style={{...s.submitBtn, marginTop:'1rem'}} onClick={submit} disabled={loading}>
          {loading ? 'Assigning...' : 'Assign Students'}
        </button>
      </div>
    </div>
  )
}

function LateReturns({ late }) {
  return (
    <div>
      <h1 style={s.pageTitle}>Late Returns</h1>
      {late.length === 0
        ? <div style={s.empty}><p>No late returns.</p></div>
        : late.map((st, i) => (
          <div key={i} style={{...s.leaveCard, borderLeft:'4px solid #d63031'}}>
            <div style={s.leaveTop}>
              <span style={s.studentName}>{st.studentName}</span>
              <span style={{...s.badge, background:'#d63031'}}>{st.minutesLate} mins late</span>
            </div>
            <div style={{display:'flex', gap:'1rem', color:'#636e72', fontSize:'0.85rem'}}>
              <span>Roll: {st.rollNumber}</span>
              <span>Block: {st.hostelBlock}</span>
              <span>Destination: {st.destination}</span>
              <span>Expected: {new Date(st.expectedReturn).toLocaleString()}</span>
            </div>
          </div>
        ))
      }
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
    } catch { toast.error('Failed') }
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

const roleColor = (role) => ({ admin:'#6c5ce7', warden:'#00b894', tutor:'#a29bfe', security:'#e17055' }[role] || '#b2bec3')

const s = {
  page:        { display:'flex', minHeight:'100vh', background:'#f5f6fa' },
  sidebar:     { width:'240px', background:'#2d3436', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', position:'fixed', height:'100vh', overflowY:'auto' },
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
  formCard:    { background:'#fff', padding:'2rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', maxWidth:'700px' },
  form:        { display:'flex', flexDirection:'column', gap:'1.25rem' },
  formRow:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
  field:       { display:'flex', flexDirection:'column', gap:'0.4rem' },
  label:       { fontSize:'0.875rem', fontWeight:'500', color:'#2d3436' },
  input:       { padding:'0.75rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.95rem', outline:'none' },
  submitBtn:   { padding:'0.875rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', fontWeight:'600', cursor:'pointer' },
  leaveCard:   { background:'#fff', padding:'1.25rem', borderRadius:'12px', marginBottom:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  leaveTop:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' },
  studentName: { fontWeight:'600', color:'#2d3436' },
  badge:       { padding:'0.25rem 0.75rem', borderRadius:'99px', fontSize:'0.8rem', color:'#fff', fontWeight:'500' },
  empty:       { textAlign:'center', padding:'3rem', color:'#636e72', background:'#fff', borderRadius:'12px' },
  alertBox2:   { background:'#fff5f5', border:'1.5px solid #d63031', borderRadius:'12px', padding:'1.25rem', marginTop:'1.5rem' },
  filterRow:   { display:'flex', gap:'1rem', marginBottom:'1.5rem', alignItems:'center' },
  select:      { padding:'0.6rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.9rem', outline:'none' },
  fetchBtn:    { padding:'0.6rem 1.25rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer' },
  summaryRow:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  typeRow:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' },
  typeCard:    { background:'#fff', padding:'1.25rem', borderRadius:'12px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  typeCount:   { fontSize:'1.75rem', fontWeight:'700', color:'#6c5ce7' },
  typeLabel:   { color:'#636e72', fontSize:'0.85rem', textTransform:'capitalize', marginTop:'0.25rem' },
}