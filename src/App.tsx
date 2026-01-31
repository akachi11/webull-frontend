import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/Signup'
import SignIn from './pages/SignIn'
import { VerifyEmail } from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import AllStocks from './pages/AllStocks'
import TradePage from './pages/TradePage'
import P2PTrading from './pages/P2PPage'
import P2PTradePage from './pages/P2PTradePage'
import P2PPendingTradePage from './pages/P2PWaitingPage'
import P2PTradeConfirmationPage from './pages/ConfirmP2P'
import Profile from './pages/Profile'
import Portfolio from './pages/Portfolio'
// import SignIn from './pages/SignIn'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" replace />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stocks" element={<AllStocks />} />
        <Route path="/trade/:symbol" element={<TradePage />} />
        <Route path="/p2p/:symbol" element={<P2PTrading />} />
        <Route path="/p2p" element={<P2PTrading />} />
        <Route path="/p2p/trade/:id" element={<P2PTradePage />} />
        <Route path="/p2p/trades/:tradeId" element={<P2PPendingTradePage />} />
        <Route path="/p2p/confirm/:tradeId" element={<P2PTradeConfirmationPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App