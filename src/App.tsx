import { Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { Join } from './pages/Join'
import { StudentSession } from './pages/StudentSession'
import { TeacherDashboard } from './pages/TeacherDashboard'
import { TeacherSession } from './pages/TeacherSession'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/session/:sessionId" element={<TeacherSession />} />
      <Route path="/join/:joinCode" element={<Join />} />
      <Route path="/student/session/:sessionId" element={<StudentSession />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
