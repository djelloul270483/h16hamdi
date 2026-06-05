import { useState } from 'react';
import { Lock, Eye, EyeOff, Building2 } from 'lucide-react';

const PASSWORD = 'Simou2015';
const STORAGE_KEY = 'app_auth';

interface Props {
  children: React.ReactNode;
}

export default function PasswordGuard({ children }: Props) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === 'true'
  );
  const [input, setInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 500);
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 ${shake ? 'animate-bounce' : ''}`}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 text-center">الإقامة الجامعية</h1>
          <p className="text-sm text-amber-600 text-center">عين الباي 16 - قسنطينة</p>
        </div>

        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Lock className="w-6 h-6 text-slate-600" />
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mb-6">أدخل كلمة المرور للدخول</p>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="كلمة المرور"
            className={`w-full px-4 py-3 rounded-xl border-2 text-center text-slate-700 focus:outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-amber-400'
            }`}
            autoFocus
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">كلمة المرور غير صحيحة</p>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/30"
        >
          دخول
        </button>
      </div>
    </div>
  );
}
