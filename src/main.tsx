import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchInterval: 5000, staleTime: 3000 } },
})

const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#ffffff',
          logo: '',
        },
        externalWallets: { solana: { connectors: solanaConnectors } },
        loginMethods: ['wallet', 'email'],
        embeddedWallets: {
          solana: { createOnLogin: 'users-without-wallets' },
        },
      }}
    >
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </PrivyProvider>
  </StrictMode>,
)
