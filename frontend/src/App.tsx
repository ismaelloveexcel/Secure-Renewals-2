import { useState } from 'react'

type Section = 'home' | 'employees' | 'onboarding' | 'external' | 'admin'

function App() {
  const [activeSection, setActiveSection] = useState<Section>('home')

  if (activeSection !== 'home') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 capitalize">
            {activeSection === 'external' ? 'External Users' : activeSection}
          </h2>
          <p className="text-gray-600 mb-6">This section is under development.</p>
          <button
            onClick={() => setActiveSection('home')}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <p className="text-gray-600 text-lg tracking-wide mb-2">baynunah<span className="text-emerald-500">.</span></p>
        <h1 className="text-4xl font-light tracking-widest text-gray-800">HR PORTAL</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 w-80">
        <button
          onClick={() => setActiveSection('employees')}
          className="bg-white rounded-tl-[4rem] rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Employees</span>
        </button>

        <button
          onClick={() => setActiveSection('onboarding')}
          className="bg-white rounded-tr-[4rem] rounded-tl-lg rounded-bl-lg rounded-br-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Onboarding</span>
        </button>

        <button
          onClick={() => setActiveSection('external')}
          className="bg-white rounded-bl-[4rem] rounded-tl-lg rounded-tr-lg rounded-br-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide text-center">External<br/>Users</span>
        </button>

        <button
          onClick={() => setActiveSection('admin')}
          className="bg-white rounded-br-[4rem] rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-lg p-6 flex flex-col items-center justify-center hover:shadow-xl transition-shadow aspect-square"
        >
          <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">Admin</span>
        </button>
      </div>
    </div>
  )
}

export default App
