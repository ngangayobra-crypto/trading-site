import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { AdminPage } from './pages/AdminPage'
import { AssetPage } from './pages/AssetPage'
import { AuthPage } from './pages/AuthPage'
import { HistoryPage } from './pages/HistoryPage'
import { LandingPage } from './pages/LandingPage'
import { MarketsPage } from './pages/MarketsPage'
import { OrdersPage } from './pages/OrdersPage'
import { OverviewPage } from './pages/OverviewPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { SettingsPage } from './pages/SettingsPage'
import { TradePage } from './pages/TradePage'
import { WatchlistPage } from './pages/WatchlistPage'
import { DemoTradingProvider, useTrading } from './services/trading-context'

const queryClient = new QueryClient()

function ProtectedApp() {
  const { session } = useTrading()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/app" element={<OverviewPage />} />
        <Route path="/app/markets" element={<MarketsPage />} />
        <Route path="/app/markets/:symbol" element={<AssetPage />} />
        <Route path="/app/trade" element={<TradePage />} />
        <Route path="/app/portfolio" element={<PortfolioPage />} />
        <Route path="/app/orders" element={<OrdersPage />} />
        <Route path="/app/history" element={<HistoryPage />} />
        <Route path="/app/watchlist" element={<WatchlistPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
        <Route path="/app/admin" element={<AdminPage />} />
      </Routes>
    </AppLayout>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DemoTradingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/app/*" element={<ProtectedApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DemoTradingProvider>
    </QueryClientProvider>
  )
}

export default App
