import { Routes, Route } from "react-router-dom"
import "./styles/app.css"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import DashboardPage from "./pages/DashboardPage"
import CurriculumDeskPage from "./pages/CurriculumDeskPage"
import ChatbotPage from "./pages/ChatbotPage"

const App = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />

    <main className="flex-1">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/curriculum"
          element={
            <ProtectedRoute>
              <CurriculumDeskPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/chatbot"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>

    <Footer />
  </div>
)

export default App