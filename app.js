// app.js
// Wrappers seguros para acessar `window.firebaseAPI` dinamicamente
const getFirebase = () => window.firebaseAPI || {};

const signInWithGoogle = async (...args) => {
  const api = getFirebase();
  if (!api.signInWithGoogle) throw new Error('Firebase API não inicializado');
  return api.signInWithGoogle(...args);
};

const logout = async (...args) => {
  const api = getFirebase();
  if (!api.logout) throw new Error('Firebase API não inicializado');
  return api.logout(...args);
};

const onAuthChange = (callback) => {
  const api = getFirebase();
  if (api.onAuthChange) {
    return api.onAuthChange(callback);
  }

  // Se API não pronta, faça polling curto e registre quando estiver disponível
  let unsub = null;
  let stopped = false;
  const handle = setInterval(() => {
    const a = getFirebase();
    if (a.onAuthChange && !stopped) {
      unsub = a.onAuthChange(callback);
      clearInterval(handle);
    }
  }, 100);

  return () => {
    stopped = true;
    clearInterval(handle);
    if (typeof unsub === 'function') unsub();
  };
};

const saveUserData = async (...args) => {
  const api = getFirebase();
  if (!api.saveUserData) throw new Error('Firebase API não inicializado');
  return api.saveUserData(...args);
};

const loadUserData = async (...args) => {
  const api = getFirebase();
  if (!api.loadUserData) throw new Error('Firebase API não inicializado');
  return api.loadUserData(...args);
};

const { useState, useEffect } = React;
const { ChevronLeft, ChevronRight, Plus, Trash2, TrendingUp, TrendingDown, StickyNote, Bell, Settings, LogOut } = lucide;

function FinancialCalendar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState({});
  const [notes, setNotes] = useState({});
  const [reminders, setReminders] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions');
const [settings, setSettings] = useState({
  userName: 'Usuário',
  colorScheme: 'pink',
  font: 'sans',
  bgColor: 'black',
  // Efeitos visuais
  effects: {
    animatedGradient: false,
    dayPulse: false,
    shimmer: false,
    glow: false,
    intenseAnimations: false,
    confetti: true,
    ripple: true
  }
});
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'income'
  });
  const [savings, setSavings] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState('deposit');
  const [noteText, setNoteText] = useState('');
  const [reminderData, setReminderData] = useState({
    text: '',
    time: ''
  });
  const [recurringForm, setRecurringForm] = useState({
    description: '',
    amount: '',
    type: 'income',
    dayOfMonth: '1',
    frequency: 'monthly'
  });

  const [firebaseReady, setFirebaseReady] = useState(!!(window.firebaseAPI && window.firebaseAPI.signInWithGoogle));

  useEffect(() => {
    if (firebaseReady) return;
    let stopped = false;
    const handle = setInterval(() => {
      const api = window.firebaseAPI;
      if (api && api.signInWithGoogle && !stopped) {
        setFirebaseReady(true);
        clearInterval(handle);
      }
    }, 150);

    return () => { stopped = true; clearInterval(handle); };
  }, [firebaseReady]);

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const colorSchemes = {
    pink: { primary: 'pink-500', secondary: 'pink-400', tertiary: 'pink-300', hover: 'pink-900', bg: 'pink-900', border: 'pink-500', button: 'pink-600', buttonHover: 'pink-700' },
    blue: { primary: 'blue-500', secondary: 'blue-400', tertiary: 'blue-300', hover: 'blue-900', bg: 'blue-900', border: 'blue-500', button: 'blue-600', buttonHover: 'blue-700' },
    purple: { primary: 'purple-500', secondary: 'purple-400', tertiary: 'purple-300', hover: 'purple-900', bg: 'purple-900', border: 'purple-500', button: 'purple-600', buttonHover: 'purple-700' },
    green: { primary: 'emerald-500', secondary: 'emerald-400', tertiary: 'emerald-300', hover: 'emerald-900', bg: 'emerald-900', border: 'emerald-500', button: 'emerald-600', buttonHover: 'emerald-700' },
    orange: { primary: 'orange-500', secondary: 'orange-400', tertiary: 'orange-300', hover: 'orange-900', bg: 'orange-900', border: 'orange-500', button: 'orange-600', buttonHover: 'orange-700' }
  };

  const fonts = { sans: 'font-sans', serif: 'font-serif', mono: 'font-mono' };
  const bgColors = { black: 'bg-black', darkGray: 'bg-gray-900', darkBlue: 'bg-blue-950', darkPurple: 'bg-purple-950', darkGreen: 'bg-emerald-950', white: 'bg-white' };

  const colors = colorSchemes[settings.colorScheme];
  const fontClass = fonts[settings.font];
  const bgClass = bgColors[settings.bgColor];
  const textColorClass = settings.bgColor === 'white' ? 'text-gray-900' : `text-${colors.primary}`;
  const textSecondaryClass = settings.bgColor === 'white' ? 'text-gray-700' : `text-${colors.secondary}`;
  const textTertiaryClass = settings.bgColor === 'white' ? 'text-gray-600' : `text-${colors.tertiary}`;

  // Monitorar autenticação
  useEffect(() => {
    // fallback: se o Firebase não responder em X ms, sair do loading
    const FALLBACK_MS = 6000;
    let fallbackTimer = null;

    const unsubscribe = onAuthChange(async (userData) => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      setUser(userData);
      if (userData) {
        await loadAllUserData(userData.uid);
      }
      setLoading(false);
    });

    // Se nenhum callback ocorrer até o tempo limite, desbloqueia a UI para tentativa manual
    fallbackTimer = setTimeout(() => {
      console.warn('Firebase não respondeu no tempo esperado — mostrando UI de login.');
      setLoading(false);
    }, FALLBACK_MS);

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Carregar dados do usuário
  const loadAllUserData = async (userId) => {
    try {
      const data = await loadUserData(userId);
      if (data) {
        setTransactions(data.transactions || {});
        setNotes(data.notes || {});
        setReminders(data.reminders || {});
        setSettings({
  ...settings,
  ...(data.settings || {}),
  effects: {
    animatedGradient: false,
    dayPulse: false,
    shimmer: false,
    glow: false,
    intenseAnimations: false,
    confetti: true,
    ripple: true,
    ...(data.settings?.effects || {})
  }
});
        setRecurringTransactions(data.recurringTransactions || []);
         setSavings(data.savings || 0);
      setSavingsGoal(data.savingsGoal || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Salvar dados automaticamente
  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        saveUserData(user.uid, {
          transactions,
          notes,
          reminders,
          settings,
          recurringTransactions,
          savings,
          savingsGoal
        });
      }, 1000); // Debounce de 1 segundo
      
      return () => clearTimeout(timeoutId);
    }
  }, [transactions, notes, reminders, settings, recurringTransactions, user]);

 // Re-inicializar ícones quando modais abrem/fecham
  useEffect(() => {
    if (window.lucide) {
      // Timeout maior para garantir que DOM atualizou
      const timer = setTimeout(() => {
        lucide.createIcons();
        console.log('🔄 Ícones re-inicializados');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [showModal, showSettings, showAnalytics, showRecurringModal, showSavingsModal]);

  // Aplicar transações recorrentes
  useEffect(() => {
    if (!user) return;
    
    recurringTransactions.forEach(recurring => {
      const key = getDateKey(parseInt(recurring.dayOfMonth));
      const exists = transactions[key]?.some(t => 
        t.description === recurring.description && 
        t.amount === recurring.amount &&
        t.type === recurring.type
      );
      
      if (!exists) {
        const newTransaction = {
          id: Date.now() + Math.random(),
          description: recurring.description,
          amount: parseFloat(recurring.amount),
          type: recurring.type,
          recurring: true
        };
        
        setTransactions(prev => ({
          ...prev,
          [key]: [...(prev[key] || []), newTransaction]
        }));
      }
    });
  }, [currentDate, recurringTransactions, user]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setTransactions({});
      setNotes({});
      setReminders({});
      setRecurringTransactions([]);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };

  const changeMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getDateKey = (day) => {
    return `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
  };

  const calculateBalance = () => {
    let total = 0;
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    Object.entries(transactions).forEach(([key, dayTransactions]) => {
      const [year, month] = key.split('-').map(Number);
      if (year === currentYear && month === currentMonth) {
        dayTransactions.forEach(t => {
          total += t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount);
        });
      }
    });
    return total;
  };

  const calculateMonthlyStats = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    let totalIncome = 0;
    let totalExpense = 0;
    const categories = {};
    
    Object.entries(transactions).forEach(([key, dayTransactions]) => {
      const [year, month] = key.split('-').map(Number);
      if (year === currentYear && month === currentMonth) {
        dayTransactions.forEach(t => {
          if (t.type === 'income') {
            totalIncome += parseFloat(t.amount);
          } else {
            totalExpense += parseFloat(t.amount);
            const category = t.description.split(' ')[0];
            categories[category] = (categories[category] || 0) + parseFloat(t.amount);
          }
        });
      }
    });
    
    return { totalIncome, totalExpense, categories };
  };

  const getDayBalance = (day) => {
    const key = getDateKey(day);
    if (!transactions[key]) return 0;
    
    return transactions[key].reduce((sum, t) => {
      return sum + (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount));
    }, 0);
  };

  const handleAddTransaction = () => {
    if (!formData.description || !formData.amount) return;
    const key = getDateKey(selectedDay);
    const newTransaction = {
      id: Date.now(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type
    };
    setTransactions(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newTransaction]
    }));
    setFormData({ description: '', amount: '', type: 'income' });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const key = getDateKey(selectedDay);
    setNotes(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { id: Date.now(), text: noteText }]
    }));
    setNoteText('');
  };

  const handleAddReminder = () => {
    if (!reminderData.text.trim() || !reminderData.time) return;
    const key = getDateKey(selectedDay);
    setReminders(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), { id: Date.now(), text: reminderData.text, time: reminderData.time, notified: false }]
    }));
    setReminderData({ text: '', time: '' });
  };

  const handleDeleteTransaction = (day, transactionId) => {
    const key = getDateKey(day);
    setTransactions(prev => ({
      ...prev,
      [key]: prev[key].filter(t => t.id !== transactionId)
    }));
  };

  const handleDeleteNote = (day, noteId) => {
    const key = getDateKey(day);
    setNotes(prev => ({
      ...prev,
      [key]: prev[key].filter(n => n.id !== noteId)
    }));
  };

  const handleDeleteReminder = (day, reminderId) => {
    const key = getDateKey(day);
    setReminders(prev => ({
      ...prev,
      [key]: prev[key].filter(r => r.id !== reminderId)
    }));
  };

  const handleAddRecurring = () => {
    if (!recurringForm.description || !recurringForm.amount) return;
    const newRecurring = {
      id: Date.now(),
      description: recurringForm.description,
      amount: parseFloat(recurringForm.amount),
      type: recurringForm.type,
      dayOfMonth: recurringForm.dayOfMonth,
      frequency: recurringForm.frequency
    };
    setRecurringTransactions(prev => [...prev, newRecurring]);
    setRecurringForm({ description: '', amount: '', type: 'income', dayOfMonth: '1', frequency: 'monthly' });
  };

  const handleDeleteRecurring = (id) => {
    setRecurringTransactions(prev => prev.filter(r => r.id !== id));
  };

  // Função para aplicar presets de efeitos
  const applyEffectsPreset = (preset) => {
    const presets = {
      minimal: {
        animatedGradient: false,
        dayPulse: false,
        shimmer: false,
        glow: false,
        intenseAnimations: false,
        confetti: false,
        ripple: true
      },
      balanced: {
        animatedGradient: false,
        dayPulse: false,
        shimmer: false,
        glow: true,
        intenseAnimations: false,
        confetti: true,
        ripple: true
      },
      maximal: {
        animatedGradient: true,
        dayPulse: true,
        shimmer: true,
        glow: true,
        intenseAnimations: true,
        confetti: true,
        ripple: true
      }
    };
    
    setSettings(prev => ({
      ...prev,
      effects: presets[preset]
    }));
  };
  // Funções do Cofre
  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      alert('Digite um valor válido!');
      return;
    }

    if (transferType === 'deposit') {
      // Transferir do saldo para o cofre
      if (balance < amount) {
        alert('Saldo insuficiente!');
        return;
      }
      setSavings(prev => prev + amount);
    } else {
      // Retirar do cofre para o saldo
      if (savings < amount) {
        alert('Cofre sem saldo suficiente!');
        return;
      }
      setSavings(prev => prev - amount);
    }

    setTransferAmount('');
    setShowSavingsModal(false);
  };

  const handleSetGoal = (goal) => {
    setSavingsGoal(parseFloat(goal) || 0);
  };
const renderCalendar = () => {
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = [];

  // Espaços vazios antes do primeiro dia
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = getDateKey(day);
    const balance = getDayBalance(day);
let balanceGradient = 'from-white/10 to-white/5';

if (balance > 0) {
  balanceGradient = 'from-emerald-400/20 to-blue-400/10';
} else if (balance < 0) {
  balanceGradient = 'from-red-500/25 to-orange-500/10';
}

    const hasTransactions =
      transactions[key] && transactions[key].length > 0;
const today = new Date();
const isToday =
  day === today.getDate() &&
  currentDate.getMonth() === today.getMonth() &&
  currentDate.getFullYear() === today.getFullYear();

    days.push(
      <div
        key={day}
        onClick={() => {
          setSelectedDay(day);
          setShowModal(true);
        }}
className={`
  relative cursor-pointer h-24 p-3 rounded-2xl
  bg-gradient-to-br ${balanceGradient}
  backdrop-blur-md transition-all
  ${
    isToday
      ? 'ring-2 ring-white/70 shadow-xl scale-[1.03]'
      : 'shadow-md hover:brightness-110'
  }
`}


      >
        {/* Número do dia */}
        <div className="text-sm font-bold text-blue-200">
          {day}
        </div>

        {/* Descrição breve */}
        {hasTransactions && (
          <div className="mt-1 text-x text-gray-200 truncate">
            {transactions[key][0]?.description}
          </div>
        )}

        {/* Saldo do dia */}
        {balance !== 0 && (
          <div
            className={`absolute bottom-2 right-2 text-x font-bold ${
              balance > 0 ? 'text-green-300' : 'text-red-300'
            }`}
          >
            {balance > 0 ? '+' : '-'}R$
            {Math.abs(balance).toFixed(0)}
          </div>
        )}
      </div>
    );
  }

  return days;
};



  const balance = calculateBalance();
  const { totalIncome, totalExpense, categories } = calculateMonthlyStats();

  // Tela de Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <div className="text-pink-500 text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  // Tela de Login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center p-4">
        <div className="bg-black border-2 border-pink-500 rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-pink-500 mb-2">💰</h1>
            <h1 className="text-3xl font-bold text-pink-500 mb-2">Calendário Financeiro</h1>
            <p className="text-pink-300">Gerencie suas finanças com estilo</p>
          </div>
          
          <div className="mb-8 text-left space-y-3 text-pink-200">
            <p className="flex items-center gap-2">✅ Controle de entradas e saídas</p>
            <p className="flex items-center gap-2">✅ Análise de gastos detalhada</p>
            <p className="flex items-center gap-2">✅ Sincronização na nuvem</p>
            <p className="flex items-center gap-2">✅ Lembretes e notas</p>
          </div>

          <button onClick={handleLogin}
            disabled={!firebaseReady}
            className={`w-full bg-white text-gray-800 py-3 px-6 rounded-lg font-bold flex items-center justify-center gap-3 transition-colors shadow-lg ${!firebaseReady ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {firebaseReady ? 'Entrar com Google' : 'Conectando...'}
          </button>

          <p className="mt-4 text-xs text-pink-400">🔒 Seus dados são salvos com segurança no Firebase</p>
          {!firebaseReady && <p className="mt-2 text-xs text-yellow-300">Conectando ao Firebase — aguardando inicialização.</p>}
        </div>
      </div>
    );
  }

  // App Principal
  // App Principal
  return (
    <div className={`min-h-screen ${bgClass} p-4 relative overflow-hidden ${fontClass}`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <svg width="600" height="600" viewBox="0 0 200 200" className={`text-${colors.primary}`}>
          <g transform="translate(100,100)">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse key={i} cx="0" cy="-40" rx="25" ry="45" fill="currentColor" transform={`rotate(${angle})`} />
            ))}
            <circle cx="0" cy="0" r="15" fill="#fbbf24" />
          </g>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Moderno */}
        <div className={`${settings.effects.animatedGradient ? 'gradient-animate' : 'bg-gradient-to-br from-blue-300 to-darkblue-500'} rounded-2xl p-6 mb-6 shadow-2xl ${settings.effects.intenseAnimations ? 'animate-fade-in-fast' : 'animate-fade-in'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {user.photoURL && (
                <img src={user.photoURL} alt="Avatar" className={`w-14 h-14 rounded-2xl border-3 border-white/30 shadow-lg ${settings.effects.intenseAnimations ? 'animate-scale-in' : ''}`} />
              )}
              <div>
                <h1 className="text-3xl font-bold text-white">Calendário Financeiro</h1>
                <p className="text-lg text-white/80 mt-1 font-medium">{user.displayName || settings.userName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAnalytics(true)} className={`p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} ${settings.effects?.ripple ? 'ripple' : ''}`} title="Análise">
                <i data-lucide="bar-chart-3" className="w-6 h-6 text-white"></i>
              </button>
              <button onClick={() => { setShowSavingsModal(true); setTimeout(() => lucide.createIcons(), 200); }} className={`p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} ${settings.effects?.ripple ? 'ripple' : ''}`} title="Cofre">
                <i data-lucide="piggy-bank" className="w-6 h-6 text-white"></i>
              </button>
              <button onClick={() => { setShowRecurringModal(true); setTimeout(() => lucide.createIcons(), 200); }} className={`p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} ${settings.effects?.ripple ? 'ripple' : ''}`} title="Recorrentes">
                <i data-lucide="repeat" className="w-6 h-6 text-white"></i>
              </button>
              <button onClick={() => { setShowSettings(true); setTimeout(() => lucide.createIcons(), 200); }} className={`p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl transition-all ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} ${settings.effects?.ripple ? 'ripple' : ''}`}>
                <i data-lucide="settings" className="w-6 h-6 text-white"></i>
              </button>
              <button onClick={handleLogout} className={`p-3 bg-red-500/20 hover:bg-red-500/30 backdrop-blur rounded-xl transition-all ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} ${settings.effects?.ripple ? 'ripple' : ''}`} title="Sair">
                <i data-lucide="log-out" className="w-6 h-6 text-red-400"></i>
              </button>
            </div>
          </div>
          {/* Cards de Saldo Modernos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Receitas */}
            <div className={`bg-${colors.primary} rounded-2xl p-6 shadow-xl ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} relative overflow-hidden`}>
              {settings.effects?.shimmer && <div className="shimmer absolute inset-0"></div>}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/90">Receitas do Mês</span>
                  <i data-lucide="trending-up" className="w-8 h-8 text-white"></i>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  R$ {totalIncome.toFixed(2)}
                </div>
              </div>
            </div>
            {/* Despesas */}
            <div className={`bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-xl ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} relative overflow-hidden`}>
              {settings.effects?.shimmer && <div className="shimmer absolute inset-0"></div>}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/90">Despesas do Mês</span>
                  <i data-lucide="trending-down" className="w-8 h-8 text-white"></i>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  R$ {totalExpense.toFixed(2)}
                </div>
              </div>
            </div>
             {/* Saldo Total */}
            <div className={`rounded-2xl p-6 shadow-xl ${settings.effects?.intenseAnimations ? 'card-hover-intense' : 'card-hover-minimal'} relative overflow-hidden ${settings.effects?.glow ? 'glow' : ''}`}
              style={{ backgroundColor: `rgb(${
                settings.colorScheme === 'pink' ? '236, 72, 153' :
                settings.colorScheme === 'blue' ? '59, 130, 246' :
                settings.colorScheme === 'purple' ? '168, 85, 247' :
                settings.colorScheme === 'green' ? '16, 185, 129' :
                '249, 115, 22'
              })` }}
            >
              {settings.effects?.shimmer && <div className="shimmer absolute inset-0"></div>}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/90">Saldo Total</span>
                  <i data-lucide="wallet" className="w-8 h-8 text-white"></i>
                </div>
                <div className="text-4xl font-bold text-white mb-1">
                  R$ {balance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
       </div>

{/* Calendário */}
<div
  className="
    relative
    rounded-3xl
    p-6
    bg-gradient-to-br from-blue-600/10 via-blue-500/70 to-blue-100/10
    backdrop-blur-xl
    shadow-2xl
  "
>

  {/* Cabeçalho */}
  <div className="flex items-center justify-between mb-6">
    <button
      onClick={() => changeMonth(-1)}
      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
    >
      <i data-lucide="chevron-left" className="w-6 h-6 text-white"></i>
    </button>

    <h2 className="text-xl font-bold text-white">
      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
    </h2>

    <button
      onClick={() => changeMonth(1)}
      className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
    >
      <i data-lucide="chevron-right" className="w-6 h-6 text-white"></i>
    </button>
  </div>

  {/* Dias da semana */}
  <div className="grid grid-cols-7 text-center text-sm text-white/70 mb-3">
    {daysOfWeek.map(day => (
      <div key={day}>{day}</div>
    ))}
  </div>

  {/* Grid do calendário */}
  <div className="grid grid-cols-7 gap-3">
    {renderCalendar()}
  </div>
</div>


        {/* Modal do Dia */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div
  className="
    relative
    rounded-3xl
    p-6
    bg-gradient-to-br from-blue-600/80 via-blue-500/70 to-blue-700/80
    backdrop-blur-xl
    shadow-2xl
  "
>

              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${textColorClass}`}>Dia {selectedDay} - {monthNames[currentDate.getMonth()]}</h3>
                <button onClick={() => { setShowModal(false); setActiveTab('transactions'); }} className={`${textColorClass} hover:text-${colors.secondary} text-2xl`}>✕</button>
              </div>

              <div className={`flex gap-2 mb-4 border-b-2 border-${colors.border}`}>
                <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 font-semibold ${activeTab === 'transactions' ? `${textColorClass} border-b-2 border-${colors.primary}` : textSecondaryClass}`}>Transações</button>
                <button onClick={() => setActiveTab('notes')} className={`px-4 py-2 font-semibold ${activeTab === 'notes' ? `${textColorClass} border-b-2 border-${colors.primary}` : textSecondaryClass}`}>Notas</button>
                <button onClick={() => setActiveTab('reminders')} className={`px-4 py-2 font-semibold ${activeTab === 'reminders' ? `${textColorClass} border-b-2 border-${colors.primary}` : textSecondaryClass}`}>Lembretes</button>
              </div>

              {activeTab === 'transactions' && (
                <div>
                  <div className={`mb-6 p-4 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full px-3 py-2 mb-3 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`} placeholder="Descrição" />
                    <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full px-3 py-2 mb-3 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`} placeholder="Valor (R$)" />
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center">
                        <input type="radio" value="income" checked={formData.type === 'income'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mr-2" />
                        <span className="text-green-500 font-medium border-2 border-white px-2 py-1 rounded">Entrada</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" value="expense" checked={formData.type === 'expense'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="mr-2" />
                        <span className="text-red-500 font-medium border-2 border-white px-2 py-1 rounded">Saída</span>
                      </label>
                    </div>
                    <button onClick={handleAddTransaction} className={`w-full bg-${colors.button} text-white py-2 rounded-lg hover:bg-${colors.buttonHover} font-bold`}>Adicionar</button>
                  </div>
                  <div>
                    {transactions[getDateKey(selectedDay)]?.map((t) => (
                      <div key={t.id} className={`flex justify-between p-3 mb-2 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                        <div>
                          <div className={textTertiaryClass}>{t.description}</div>
                          <div className={`font-bold border-2 border-white rounded px-2 py-1 inline-block ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteTransaction(selectedDay, t.id)} className="text-red-500 p-2 border-2 border-white rounded">
                          <i data-lucide="trash-2" className="w-5 h-5"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <div className={`mb-6 p-4 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                    <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                      className={`w-full px-3 py-2 mb-3 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`} rows="3" placeholder="Nota..." />
                    <button onClick={handleAddNote} className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 font-bold">Adicionar Nota</button>
                  </div>
                  {notes[getDateKey(selectedDay)]?.map((note) => (
                    <div key={note.id} className="flex justify-between p-3 mb-2 bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg">
                      <p className={textTertiaryClass}>{note.text}</p>
                      <button onClick={() => handleDeleteNote(selectedDay, note.id)} className="text-red-500 p-2 border-2 border-white rounded">
                        <i data-lucide="trash-2" className="w-5 h-5"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reminders' && (
                <div>
                  <div className={`mb-6 p-4 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                    <input type="text" value={reminderData.text} onChange={(e) => setReminderData({ ...reminderData, text: e.target.value })}
                      className={`w-full px-3 py-2 mb-3 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`} placeholder="Lembrete" />
                    <input type="time" value={reminderData.time} onChange={(e) => setReminderData({ ...reminderData, time: e.target.value })}
                      className={`w-full px-3 py-2 mb-3 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`} />
                    <button onClick={handleAddReminder} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold">Adicionar Lembrete</button>
                  </div>
                  {reminders[getDateKey(selectedDay)]?.map((r) => (
                    <div key={r.id} className="flex justify-between p-3 mb-2 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg">
                      <div>
                        <p className={textTertiaryClass}>{r.text}</p>
                        <p className="text-sm text-blue-400">⏰ {r.time}</p>
                      </div>
                      <button onClick={() => handleDeleteReminder(selectedDay, r.id)} className="text-red-500 p-2 border-2 border-white rounded">
                        <i data-lucide="trash-2" className="w-5 h-5"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de Análise - Simplificado por espaço */}
        {showAnalytics && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className={`${bgClass} border-2 border-${colors.border} rounded-lg p-6 max-w-4xl w-full`}>
              <div className="flex justify-between mb-4">
                <h3 className={`text-2xl font-bold ${textColorClass}`}>Análise - {monthNames[currentDate.getMonth()]}</h3>
                <button onClick={() => setShowAnalytics(false)} className={`${textColorClass} text-2xl`}>✕</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border-2 border-green-500 rounded-lg">
                  <div className="text-sm text-green-400">Entradas</div>
                  <div className="text-2xl font-bold text-green-500">R$ {totalIncome.toFixed(2)}</div>
                </div>
                <div className="p-4 border-2 border-red-500 rounded-lg">
                  <div className="text-sm text-red-400">Saídas</div>
                  <div className="text-2xl font-bold text-red-500">R$ {totalExpense.toFixed(2)}</div>
                </div>
                <div className={`p-4 border-2 border-${colors.border} rounded-lg`}>
                  <div className={`text-sm ${textSecondaryClass}`}>Saldo</div>
                  <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>R$ {balance.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ===== MODAL DO COFRE ===== */}
        {showSavingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className={`${bgClass} border-2 border-${colors.border} rounded-lg shadow-xl p-6 max-w-2xl w-full`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${textColorClass} flex items-center gap-2`}>
                  <i data-lucide="piggy-bank" className="w-8 h-8"></i>
                  Cofre / Poupança
                </h3>
                <button onClick={() => setShowSavingsModal(false)} className={`${textColorClass} hover:text-${colors.secondary} text-2xl`}>✕</button>
              </div>
                            {/* Resumo do Cofre */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 border-2 border-${colors.border} rounded-lg`}>
                  <div className={`text-sm ${textSecondaryClass}`}>Saldo Disponível</div>
                  <div className={`text-3xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    R$ {balance.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 border-2 border-blue-500 rounded-lg">
                  <div className="text-sm text-blue-400">No Cofre</div>
                  <div className="text-3xl font-bold text-blue-400">
                    R$ {savings.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Meta de Economia */}
              {savingsGoal > 0 && (
                <div className={`mb-6 p-4 border-2 border-${colors.border} rounded-lg`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={textColorClass}>Meta de Economia</span>
                    <span className={`font-bold ${textColorClass}`}>R$ {savingsGoal.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((savings / savingsGoal) * 100, 100)}%` }}
                    />
                  </div>
                  <div className={`text-sm ${textSecondaryClass} text-center`}>
                    {((savings / savingsGoal) * 100).toFixed(1)}% da meta atingida
                  </div>
                </div>
              )}

              {/* Definir Meta */}
              <div className={`mb-6 p-4 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                <label className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>
                  {savingsGoal > 0 ? 'Alterar Meta de Economia' : 'Definir Meta de Economia'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5000.00"
                    className={`flex-1 px-3 py-2 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSetGoal(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      handleSetGoal(input.value);
                      input.value = '';
                    }}
                    className={`bg-${colors.button} text-white px-4 py-2 rounded-lg hover:bg-${colors.buttonHover} font-bold`}
                  >
                    Definir
                  </button>
                </div>
              </div>

              {/* Transferências */}
              <div className={`p-4 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                <label className={`block text-sm font-medium mb-3 ${textSecondaryClass}`}>
                  Transferir Dinheiro
                </label>

                <div className="flex gap-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="deposit"
                      checked={transferType === 'deposit'}
                      onChange={(e) => setTransferType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-blue-400 font-medium">Guardar no Cofre 💰</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="withdraw"
                      checked={transferType === 'withdraw'}
                      onChange={(e) => setTransferType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-green-400 font-medium">Retirar do Cofre 💵</span>
                  </label>
                </div>

                <input
                  type="number"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className={`w-full px-3 py-2 mb-3 border-2 border-${colors.border} ${bgClass} ${textTertiaryClass} rounded-lg`}
                  placeholder="Valor (R$)"
                />

                <button
                  onClick={handleTransfer}
                  className={`w-full ${transferType === 'deposit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white py-3 rounded-lg font-bold transition-colors`}
                >
                  {transferType === 'deposit' ? '💰 Depositar no Cofre' : '💵 Retirar do Cofre'}
                </button>
              </div>

              {/* Dicas */}
              <div className={`mt-6 p-3 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg`}>
                <p className="text-sm text-blue-300">
                  💡 <strong>Dica:</strong> Use o cofre para separar dinheiro e evitar gastar! 
                  Defina metas para conquistar objetivos como viagens, compras ou emergências.
                </p>
              </div>
            </div>
          </div>
        )}
{/* Modal de Configurações */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className={`${bgClass} border-2 border-${colors.border} rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${textColorClass}`}>Configurações</h3>
                <button onClick={() => setShowSettings(false)} className={`${textColorClass} hover:text-${colors.secondary} text-2xl`}>✕</button>
              </div>

              <div className="space-y-6">
                {/* Nome do Usuário */}
                <div>
                  <label className={`block text-sm font-medium mb-2 text-${colors.secondary}`}>Nome do Usuário</label>
                  <input type="text" value={settings.userName} onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                    className={`w-full px-3 py-2 border-2 border-${colors.border} ${bgClass} text-${colors.tertiary} rounded-lg`} placeholder="Digite seu nome" />
                </div>

                {/* Cor de Fundo */}
                <div>
                  <label className={`block text-sm font-medium mb-2 text-${colors.secondary}`}>Cor de Fundo</label>
                  <div className="grid grid-cols-6 gap-2">
                    <button onClick={() => setSettings({ ...settings, bgColor: 'black' })}
                      className={`h-12 rounded-lg border-2 ${settings.bgColor === 'black' ? 'border-white' : 'border-gray-600'} bg-black hover:border-white transition-colors`} title="Preto" />
                    <button onClick={() => setSettings({ ...settings, bgColor: 'white' })}
                      className={`h-12 rounded-lg border-2 ${settings.bgColor === 'white' ? 'border-gray-800' : 'border-gray-400'} bg-white hover:border-gray-800 transition-colors`} title="Branco" />
                    <button onClick={() => setSettings({ ...settings, bgColor: 'darkGray' })}
                      className={`h-12 rounded-lg border-2 ${settings.bgColor === 'darkGray' ? 'border-white' : 'border-gray-600'} bg-gray-900 hover:border-white transition-colors`} title="Cinza Escuro" />
                    <button onClick={() => setSettings({ ...settings, bgColor: 'darkBlue' })}
                      className={`h-12 rounded-lg border-2 ${settings.bgColor === 'darkBlue' ? 'border-white' : 'border-gray-600'} bg-blue-950 hover:border-white transition-colors`} title="Azul Escuro" />
                    <button onClick={() => setSettings({ ...settings, bgColor: 'darkPurple' })}
                      className={`h-12 rounded-lg border-2 ${settings.bgColor === 'darkPurple' ? 'border-white' : 'border-gray-600'} bg-purple-950 hover:border-white transition-colors`} title="Roxo Escuro" />
                    <button onClick={() => setSettings({ ...settings, bgColor: 'darkGreen' })}
                      className={`h-12 rounded-lg border-2 ${settings.bgColor === 'darkGreen' ? 'border-white' : 'border-gray-600'} bg-emerald-950 hover:border-white transition-colors`} title="Verde Escuro" />
                  </div>
                </div>

                {/* Esquema de Cores */}
                <div>
                  <label className={`block text-sm font-medium mb-2 text-${colors.secondary}`}>Cor Principal</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.keys(colorSchemes).map((scheme) => (
                      <button key={scheme} onClick={() => setSettings({ ...settings, colorScheme: scheme })}
                        className={`h-12 rounded-lg border-2 ${settings.colorScheme === scheme ? 'border-white' : 'border-gray-600'} bg-${colorSchemes[scheme].primary} hover:border-white transition-colors`} title={scheme} />
                    ))}
                  </div>
                </div>

                {/* Fonte */}
                <div>
                  <label className={`block text-sm font-medium mb-2 text-${colors.secondary}`}>Tipo de Fonte</label>
                  <div className="space-y-2">
                    <button onClick={() => setSettings({ ...settings, font: 'sans' })}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${settings.font === 'sans' ? `border-${colors.primary} bg-${colors.bg} bg-opacity-20` : 'border-gray-600'} text-${colors.tertiary} font-sans hover:bg-${colors.hover} hover:bg-opacity-30 transition-colors`}>
                      Sans Serif (Padrão)
                    </button>
                    <button onClick={() => setSettings({ ...settings, font: 'serif' })}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${settings.font === 'serif' ? `border-${colors.primary} bg-${colors.bg} bg-opacity-20` : 'border-gray-600'} text-${colors.tertiary} font-serif hover:bg-${colors.hover} hover:bg-opacity-30 transition-colors`}>
                      Serif (Elegante)
                    </button>
                    <button onClick={() => setSettings({ ...settings, font: 'mono' })}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${settings.font === 'mono' ? `border-${colors.primary} bg-${colors.bg} bg-opacity-20` : 'border-gray-600'} text-${colors.tertiary} font-mono hover:bg-${colors.hover} hover:bg-opacity-30 transition-colors`}>
                      Monospace (Técnica)
                    </button>
                  </div>
                </div>
              </div>
{/* Efeitos Visuais */}
                <div>
                  <label className={`block text-lg font-semibold mb-3 text-${colors.primary}`}>
                    ✨ Efeitos Visuais
                  </label>
                  
                  {/* Presets Rápidos */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => applyEffectsPreset('minimal')}
                      className={`px-4 py-3 rounded-lg border-2 ${!settings.effects.animatedGradient && !settings.effects.dayPulse ? `border-${colors.primary} bg-${colors.bg} bg-opacity-20` : 'border-gray-600'} text-${colors.tertiary} hover:bg-${colors.hover} hover:bg-opacity-30 transition-colors text-sm font-medium`}
                    >
                      🎨 Minimalista
                    </button>
                    <button
                      onClick={() => applyEffectsPreset('balanced')}
                      className={`px-4 py-3 rounded-lg border-2 ${settings.effects.glow && !settings.effects.animatedGradient ? `border-${colors.primary} bg-${colors.bg} bg-opacity-20` : 'border-gray-600'} text-${colors.tertiary} hover:bg-${colors.hover} hover:bg-opacity-30 transition-colors text-sm font-medium`}
                    >
                      ⚖️ Equilibrado
                    </button>
                    <button
                      onClick={() => applyEffectsPreset('maximal')}
                      className={`px-4 py-3 rounded-lg border-2 ${settings.effects.animatedGradient && settings.effects.dayPulse ? `border-${colors.primary} bg-${colors.bg} bg-opacity-20` : 'border-gray-600'} text-${colors.tertiary} hover:bg-${colors.hover} hover:bg-opacity-30 transition-colors text-sm font-medium`}
                    >
                      🚀 Maximalista
                    </button>
                  </div>

                  {/* Toggles Individuais */}
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Gradiente Animado no Header</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.animatedGradient}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, animatedGradient: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Pulsação nos Dias com Transações</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.dayPulse}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, dayPulse: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Efeito Shimmer nos Cards</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.shimmer}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, shimmer: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Glow no Cofre e Dia Atual</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.glow}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, glow: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Animações Intensas</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.intenseAnimations}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, intenseAnimations: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Confetti ao Atingir Meta</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.confetti}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, confetti: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className={`text-sm ${textSecondaryClass}`}>Efeito Ripple nos Botões</span>
                      <input
                        type="checkbox"
                        checked={settings.effects.ripple}
                        onChange={(e) => setSettings(prev => ({ ...prev, effects: { ...prev.effects, ripple: e.target.checked }}))}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              <button onClick={() => setShowSettings(false)}
                className={`w-full mt-6 bg-${colors.button} text-white py-3 rounded-lg hover:bg-${colors.buttonHover} transition-colors font-bold`}>
                Salvar Configurações
              </button>
            </div>
          </div>
        )}
        {/* Modal de Transações Recorrentes */}
        {showRecurringModal && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
            <div className={`${bgClass} border-2 border-${colors.border} rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${textColorClass}`}>Transações Recorrentes</h3>
                <button onClick={() => { setShowRecurringModal(false); setRecurringForm({ description: '', amount: '', type: 'income', dayOfMonth: '1', frequency: 'monthly' }); }}
                  className={`${textColorClass} hover:text-${colors.secondary} text-2xl`}>✕</button>
              </div>

              {/* Formulário de Recorrentes */}
              <div className={`mb-6 p-4 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                <div className="mb-3">
                  <label className={`block text-sm font-medium mb-1 text-${colors.secondary}`}>Descrição</label>
                  <input type="text" value={recurringForm.description} onChange={(e) => setRecurringForm({ ...recurringForm, description: e.target.value })}
                    className={`w-full px-3 py-2 border-2 border-${colors.border} ${bgClass} text-${colors.tertiary} rounded-lg`} placeholder="Ex: Aluguel, Salário, Netflix..." />
                </div>
                <div className="mb-3">
                  <label className={`block text-sm font-medium mb-1 text-${colors.secondary}`}>Valor (R$)</label>
                  <input type="number" step="0.01" value={recurringForm.amount} onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                    className={`w-full px-3 py-2 border-2 border-${colors.border} ${bgClass} text-${colors.tertiary} rounded-lg`} placeholder="0.00" />
                </div>
                <div className="mb-3">
                  <label className={`block text-sm font-medium mb-1 text-${colors.secondary}`}>Dia do Mês</label>
                  <input type="number" min="1" max="31" value={recurringForm.dayOfMonth} onChange={(e) => setRecurringForm({ ...recurringForm, dayOfMonth: e.target.value })}
                    className={`w-full px-3 py-2 border-2 border-${colors.border} ${bgClass} text-${colors.tertiary} rounded-lg`} />
                </div>
                <div className="mb-3">
                  <label className={`block text-sm font-medium mb-1 text-${colors.secondary}`}>Tipo</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input type="radio" value="income" checked={recurringForm.type === 'income'} onChange={(e) => setRecurringForm({ ...recurringForm, type: e.target.value })} className="mr-2" />
                      <span className="text-green-500 font-medium border-2 border-white px-2 py-1 rounded">Entrada</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" value="expense" checked={recurringForm.type === 'expense'} onChange={(e) => setRecurringForm({ ...recurringForm, type: e.target.value })} className="mr-2" />
                      <span className="text-red-500 font-medium border-2 border-white px-2 py-1 rounded">Saída</span>
                    </label>
                  </div>
                </div>
                <button onClick={handleAddRecurring}
                  className={`w-full bg-${colors.button} text-white py-2 rounded-lg hover:bg-${colors.buttonHover} transition-colors flex items-center justify-center gap-2 font-bold`}>
                  <i data-lucide="plus" className="w-5 h-5"></i>
                  Adicionar Recorrente
                </button>
              </div>

              {/* Lista de Recorrentes */}
              <div>
                <h4 className={`font-semibold mb-3 text-${colors.primary}`}>Transações Cadastradas</h4>
                {recurringTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {recurringTransactions.map((rec) => (
                      <div key={rec.id} className={`flex items-center justify-between p-3 bg-${colors.bg} bg-opacity-20 border border-${colors.border} rounded-lg`}>
                        <div>
                          <div className={`font-medium text-${colors.tertiary}`}>{rec.description}</div>
                          <div className="text-sm text-gray-400">Todo dia {rec.dayOfMonth} do mês</div>
                          <div className={`text-lg font-bold border-2 border-white rounded px-2 py-1 inline-block mt-1 ${rec.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {rec.type === 'income' ? '+' : '-'} R$ {rec.amount.toFixed(2)}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteRecurring(rec.id)} className="text-red-500 hover:text-red-300 p-2 border-2 border-white rounded">
                          <i data-lucide="trash-2" className="w-5 h-5"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-${colors.secondary} text-center py-4`}>Nenhuma transação recorrente cadastrada</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modais de Settings e Recorrentes - omitidos por espaço, mas funcionais */}
      </div>
    </div>
  );
}

// Renderizar o app
ReactDOM.render(<FinancialCalendar />, document.getElementById('root'));

// Inicializar ícones após render
setTimeout(() => { 
  if (window.lucide) {
    lucide.createIcons();
    console.log('✅ Ícones Lucide inicializados');
  } else {
    console.error('❌ Lucide não carregou');
  }
}, 500);

// Re-inicializar a cada 2 segundos (temporário para debug)
setInterval(() => {
  if (window.lucide) lucide.createIcons();
}, 2000);