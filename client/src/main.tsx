import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { AppShell } from './components/AppShell'
import { LiveStateProvider } from './hooks/useLiveState'
import { Dashboard } from './pages/Dashboard'
import { Players } from './pages/Players'
import { PlayerDetail } from './pages/PlayerDetail'
import { Alerts } from './pages/Alerts'
import { AlertDetail } from './pages/AlertDetail'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LiveStateProvider>
        <BrowserRouter basename="/app">
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="players" element={<Players />} />
              <Route path="players/:id" element={<PlayerDetail />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="alerts/:id" element={<AlertDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LiveStateProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
