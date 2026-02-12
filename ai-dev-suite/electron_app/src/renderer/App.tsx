import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
import Home from './screens/Home';
import Tools from './screens/Tools';
import Chat from './screens/Chat';
import Drive from './screens/Drive';
import Memory from './screens/Memory';
import Settings from './screens/Settings';
import OllamaStatus from './components/OllamaStatus';
import QuitButton from './components/QuitButton';

export default function App() {
  return (
    <ChatProvider>
    <BrowserRouter>
      <div className="min-h-screen bg-whynot-bg dots-bg flex flex-col">
        <header className="border-b border-whynot-border bg-whynot-surface/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center justify-between h-14 px-6">
            <h1 className="text-lg font-semibold">
              <span className="text-whynot-accent">Zerwiz AI</span>
              <span className="text-whynot-body"> Dev Suite</span>
            </h1>
            <div className="flex items-center gap-4">
              <OllamaStatus />
              <QuitButton />
              <nav className="flex gap-1">
              {[
                { to: '/', label: 'Home' },
                { to: '/tools', label: 'Tools' },
                { to: '/chat', label: 'Chat' },
                { to: '/drive', label: 'Drive' },
                { to: '/memory', label: 'Memory' },
                { to: '/settings', label: 'Settings' },
              ].map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded text-sm ${isActive ? 'bg-whynot-accent/20 text-whynot-accent' : 'text-whynot-muted hover:text-whynot-body'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/drive" element={<Drive />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
    </ChatProvider>
  );
}
