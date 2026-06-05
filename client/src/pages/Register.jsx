import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Register() {
  const [form,    setForm]    = useState({ name:'', email:'', password:'', role:'student', rollNumber:'', department:'', hostelBlock:'', roomNumber:'', year:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      toast.success('Account created! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>GateX</h1>
        <p style={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} placeholder="Full Name"     value={form.name}       onChange={e => setForm({...form, name:e.target.value})}       required />
          <input style={styles.input} placeholder="Email"         value={form.email}      onChange={e => setForm({...form, email:e.target.value})}      required type="email" />
          <input style={styles.input} placeholder="Password"      value={form.password}   onChange={e => setForm({...form, password:e.target.value})}   required type="password" />

          <select style={styles.input} value={form.role} onChange={e => setForm({...form, role:e.target.value})}>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>

          {form.role === 'student' && <>
            <input style={styles.input} placeholder="Roll Number"  value={form.rollNumber}  onChange={e => setForm({...form, rollNumber:e.target.value})} />
            <input style={styles.input} placeholder="Department"   value={form.department}  onChange={e => setForm({...form, department:e.target.value})} />
            <input style={styles.input} placeholder="Hostel Block" value={form.hostelBlock} onChange={e => setForm({...form, hostelBlock:e.target.value})} />
            <input style={styles.input} placeholder="Room Number"  value={form.roomNumber}  onChange={e => setForm({...form, roomNumber:e.target.value})} />
            <input style={styles.input} placeholder="Year"         value={form.year}        onChange={e => setForm({...form, year:e.target.value})} type="number" />
          </>}

          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f6fa' },
  card:      { background:'#fff', padding:'2.5rem', borderRadius:'12px', width:'100%', maxWidth:'420px', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  logo:      { fontSize:'2rem', fontWeight:'700', color:'#6c5ce7', textAlign:'center', marginBottom:'0.25rem' },
  subtitle:  { color:'#636e72', textAlign:'center', marginBottom:'2rem', fontSize:'0.9rem' },
  form:      { display:'flex', flexDirection:'column', gap:'1rem' },
  input:     { padding:'0.75rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.95rem', outline:'none' },
  btn:       { padding:'0.875rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', fontWeight:'600' },
  footer:    { textAlign:'center', marginTop:'1.5rem', fontSize:'0.875rem', color:'#636e72' },
  link:      { color:'#6c5ce7', textDecoration:'none', fontWeight:'500' },
}