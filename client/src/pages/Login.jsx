import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name}!`)
      const routes = {
        student: '/student', tutor: '/tutor', warden: '/warden',
        security: '/security', admin: '/admin', parent: '/parent'
      }
      navigate(routes[user.role])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>GateX</h1>
        <p style={styles.subtitle}>Hostel Leave & Access Management</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>

          <button style={{...styles.btn, opacity: loading ? 0.7 : 1}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>
          Student or Parent?{' '}
          <Link to="/register" style={styles.link}>Create account</Link>
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
  form:      { display:'flex', flexDirection:'column', gap:'1.25rem' },
  field:     { display:'flex', flexDirection:'column', gap:'0.4rem' },
  label:     { fontSize:'0.875rem', fontWeight:'500', color:'#2d3436' },
  input:     { padding:'0.75rem 1rem', border:'1.5px solid #dfe6e9', borderRadius:'8px', fontSize:'0.95rem', outline:'none' },
  btn:       { padding:'0.875rem', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:'8px', fontSize:'1rem', fontWeight:'600', marginTop:'0.5rem' },
  footer:    { textAlign:'center', marginTop:'1.5rem', fontSize:'0.875rem', color:'#636e72' },
  link:      { color:'#6c5ce7', textDecoration:'none', fontWeight:'500' },
}