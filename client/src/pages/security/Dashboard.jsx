import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [view,    setView]    = useState('scan')
  const [token,   setToken]   = useState('')
  const [result,  setResult]  = useState(null)
  const [outside, setOutside] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchOutside() }, [])

  const fetchOutside = async () => {
    try {
      const res = await api.get('/security/currently-outside')
      setOutside(res.data.students)
    } catch { toast.error('Failed to fetch') }
  }

  const handleScan = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/security/scan', { qrToken: token })
      setResult({ success: true, data: res.data })
      toast.success(res.data.message)
      setToken('')
      fetchOutside()
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Scan failed' })
      toast.error(err.response?.data?.message || 'Invalid QR')
    } finally {
      setLoading(false)
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
            <div style={s.userRole}>Security</div>
          </div>
        </div>
        <nav style={s.nav}>
          {[
            { id:'scan',    label:'📷 QR Scanner' },
            { id:'outside', label:'🚶 Currently Outside' },
          ].map(item => (
            <button key={item.id} style={{...s.navBtn, ...(view===item.id ? s.navActive : {})}} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <button style={s.logoutBtn} onClick={logout}>Sign Out</button>
      </div>

      <div style={s.main}>

        {view === 'scan' && (
          <div>
            <h1 style={s.pageTitle}>QR Scanner</h1>
            <div style={s.scanCard}>
              <p style={s.scanHint}>Enter the QR token to record exit or entry</p>
              <form onSubmit={handleScan} style={s.scanForm}>
                <input
                  style={s.scanInput}
                  placeholder="Paste QR token here..."
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  required
                  autoFocus
                />
                <button style={s.scanBtn} disabled={loading}>
                  {loading ? 'Scanning...' : '⚡ Scan'}
                </button>
              </form>

              {result && (
                <div style={{...s.resultBox, background: result.success ? '#00b89420' : '#d6303120', border: `1.5px solid ${result.success ? '#00b894' : '#d63031'}`}}>
                  {result.success ? (
                    <div>
                      <p style={{...s.resultTitle, color:'#00b894'}}>✓ {result.data.message}</p>
                      <div style={s.resultGrid}>
                        <div style={s.resultItem}><span style={s.resultLabel}>Student</span><span style={s.resultVal}>{result.data.outpass.studentName}</span></div>
                        <div style={s.resultItem}><span style={s.resultLabel}>Roll No</span><span style={s.resultVal}>{result.data.outpass.rollNumber}</span></div>
                        <div style={s.resultItem}><span style={s.resultLabel}>Block</span><span style={s.resultVal}>{result.data.outpass.hostelBlock}</span></div>
                        <div style={s.resultItem}><span style={s.resultLabel}>Status</span><span style={s.resultVal}>{result.data.outpass.status}</span></div>
                        <div style={s.resultItem}><span style={s.resultLabel}>Expected Return</span><span style={s.resultVal}>{new Date(result.data.outpass.expectedReturn).toLocaleString()}</span></div>
                        {result.data.outpass.exitTime && <div style={s.resultItem}><span style={s.resultLabel}>Exit Time</span><span style={s.resultVal}>{new Date(result.data.outpass.exitTime).toLocaleString()}</span></div>}
                        {result.data.outpass.entryTime && <div style={s.resultItem}><span style={s.resultLabel}>Entry Time</span><span style={s.resultVal}>{new Date(result.data.outpass.entryTime).toLocaleString()}</span></div>}
                      </div>
                    </div>
                  ) : (
                    <p style={{...s.resultTitle, color:'#d63031'}}>✗ {result.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'outside' && (
          <div>
            <div style={s.outsideHeader}>
              <h1 style={s.pageTitle}>Currently Outside ({outside.length})</h1>
              <button style={s.refreshBtn} onClick={fetchOutside}>↻ Refresh</button>
            </div>

            {outside.length === 0 ? (
              <div style={s.empty}><p>All students are inside the hostel.</p></div>
            ) : (
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thead}>
                      <th style={s.th}>Student</th>
                      <th style={s.th}>Roll No</th>
                      <th style={s.th}>Block</th>
                      <th style={s.th}>Destination</th>
                      <th style={s.th}>Exit Time</th>
                      <th style={s.th}>Expected Return</th>
                      <th style={s.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outside.map((student, i) => (
                      <tr key={i} style={student.isLate ? s.lateRow : s.row}>
                        <td style={s.td}>{student.studentName}</td>
                        <td style={s.td}>{student.rollNumber}</td>
                        <td style={s.td}>{student.hostelBlock}</td>
                        <td style={s.td}>{student.destination}</td>
                        <td style={s.td}>{new Date(student.exitTime).toLocaleString()}</td>
                        <td style={s.td}>{new Date(student.expectedReturn).toLocaleString()}</td>
                        <td style={s.td}>
                          <span style={{...s.badge, background: student.isLate ? '#d63031' : '#00b894'}}>
                            {student.isLate ? '⚠ Late' : 'On Time'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page:         { display:'flex', minHeight:'100vh', background:'#f5f6fa' },
  sidebar:      { width:'240px', background:'#2d3436', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem', position:'fixed', height:'100vh' },
  logo:         { color:'#6c5ce7', fontSize:'1.5rem', fontWeight:'700' },
  userInfo:     { display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem 0', borderBottom:'1px solid #636e72' },
  avatar:       { width:'40px', height:'40px', borderRadius:'50%', background:'#e17055', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1.1rem' },
  userName:     { color:'#fff', fontWeight:'500', fontSize:'0.9rem' },
  userRole:     { color:'#b2bec3', fontSize:'0.75rem' },
  nav:          { display:'flex', flexDirection:'column', gap:'0.5rem', flex:1 },
  navBtn:       { padding:'0.75rem 1rem', background:'transparent', border:'none', color:'#b2bec3', borderRadius:'8px', textAlign:'left', fontSize:'0.9rem', cursor:'pointer' },
  navActive:    { background:'#6c5ce7', color:'#fff' },
  logoutBtn:    { padding:'0.75rem', background:'transparent', border:'1px solid #636e72', color:'#b2bec3', borderRadius:'8px', fontSize:'0.9rem', cursor:'pointer' },
  main:         { marginLeft:'240px', padding:'2rem', flex:1 },
  pageTitle:    { fontSize:'1.75rem', fontWeight:'700', marginBottom:'1.5rem', color:'#2d3436' },
  scanCard:     { background:'#fff', padding:'2rem', borderRadius:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', maxWidth:'600px' },
  scanHint:     { color:'#636e72', marginBottom:'1.5rem' },
  scanForm:     { display:'flex', gap:'1rem' },
  scanInput:    { flex:1, padding:'0.75rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.95rem', outline:'none' },
  scanBtn:      { padding:'0.75rem 1.5rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.95rem', fontWeight:'600', cursor:'pointer' },
  resultBox:    { marginTop:'1.5rem', padding:'1.25rem', borderRadius:'10px' },
  resultTitle:  { fontWeight:'600', fontSize:'1rem', marginBottom:'1rem' },
  resultGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' },
  resultItem:   { display:'flex', flexDirection:'column', gap:'0.2rem' },
  resultLabel:  { fontSize:'0.75rem', color:'#636e72', textTransform:'uppercase', letterSpacing:'0.05em' },
  resultVal:    { fontSize:'0.9rem', fontWeight:'500', color:'#2d3436' },
  outsideHeader:{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' },
  refreshBtn:   { padding:'0.5rem 1rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'0.85rem', cursor:'pointer' },
  empty:        { textAlign:'center', padding:'3rem', color:'#636e72', background:'#fff', borderRadius:'12px' },
  tableWrap:    { background:'#fff', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  table:        { width:'100%', borderCollapse:'collapse' },
  thead:        { background:'#f5f6fa' },
  th:           { padding:'0.875rem 1rem', textAlign:'left', fontSize:'0.8rem', fontWeight:'600', color:'#636e72', textTransform:'uppercase', letterSpacing:'0.05em' },
  row:          { borderTop:'1px solid #f5f6fa' },
  lateRow:      { borderTop:'1px solid #f5f6fa', background:'#fff5f5' },
  td:           { padding:'0.875rem 1rem', fontSize:'0.9rem', color:'#2d3436' },
  badge:        { padding:'0.2rem 0.6rem', borderRadius:'99px', fontSize:'0.75rem', color:'#fff', fontWeight:'500' },
}