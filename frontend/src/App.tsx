import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import LiveGrid from '@/pages/LiveGrid'
import Predictions from '@/pages/Predictions'
import TransformerHealth from '@/pages/TransformerHealth'
import Alerts from '@/pages/Alerts'
import AIAssistant from '@/pages/AIAssistant'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live-grid" element={<LiveGrid />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/transformers" element={<TransformerHealth />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/assistant" element={<AIAssistant />} />
      </Routes>
    </Layout>
  )
}
