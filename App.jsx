import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Save,
  Plus,
  Trash2,
  Map as MapIcon,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Lock,
  Check,
  Clock,
  Compass,
  LogOut,
  CheckSquare,
  Calendar,
  Store,
  RefreshCw,
  Users,
  BarChart3,
  ShieldCheck,
  ExternalLink,
  Layers
} from 'lucide-react';

// ============================================================================
// 1. PRODUCTION CONFIGURATION
// ============================================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQSOfhWskkHlwuYvyD90KoPPBqDJFohe-6UA_B3PSreFR2pBNBt8QYHIUc8Org10LjuQ/exec';
const GEMINI_API_KEY = '';

const FALLBACK_USERS = [
  { username: 'admin', fullName: 'Survey Supervisor', userType: 'admin', password: 'admin123' },
  ...Array.from({ length: 15 }, (_, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    return {
      username: `USR-${num}`,
      fullName: `Field Intern ${num}`,
      userType: 'intern',
      password: `colgate${num}`
    };
  })
];

// ============================================================================
// 2. PRODUCT CATALOG & SKU RANGES (Embedded from outlet survey.xlsx + Sheet Sync)
// ============================================================================
const DEFAULT_SURVEY_CATALOG = {
  toothpaste: {
    'Colgate': [
      'Colgate Strong Teeth',
      'Colgate MaxFresh',
      'Colgate Visible White',
      'Colgate Active Salt',
      'Colgate Sensitive Plus',
      'Colgate Total',
      'Colgate Herbal',
      'Colgate Kids',
      'Colgate Vedshakti',
      'Colgate Charcoal Clean'
    ],
    'Unilever': ['Pepsodent', 'CloseUp', 'Lever Ayush'],
    'Square Toiletries': ['White Plus', 'Magic Toothpowder'],
    'ACI': ['ACI Neem', 'ACI Herbal'],
    'Kohinoor Chemical': ['Tibet Toothpaste', 'Tibet Toothpowder'],
    'Keya Cosmetics': ['Keya Toothpaste'],
    'Dabur': ['Dabur Red', 'Meswak', 'Babool', 'Dabur Herbal'],
    'Haleon (GSK)': ['Sensodyne', 'Parodontax'],
    'Procter & Gamble': ['Oral-B Toothpaste', 'Crest'],
    'Himalaya': ['Himalaya Complete Care', 'Himalaya Sparkling White', 'Himalaya Herbals'],
    'Marico': ['Mediker'],
    'Imported / Others': ['Darlie', 'Aquafresh', 'Signal', 'Amway Glister']
  },
  toothbrush: {
    'Colgate': [
      'Colgate Super Flexi',
      'Colgate ZigZag',
      'Colgate SlimSoft',
      'Colgate Extra Clean',
      'Colgate Gentle',
      'Colgate 360°',
      'Colgate Kids'
    ],
    'Unilever': ['Pepsodent Toothbrush', 'CloseUp Toothbrush'],
    'Square Toiletries': ['White Plus Toothbrush'],
    'ACI': ['ACI Toothbrush'],
    'Dabur': ['Dabur Toothbrush'],
    'Haleon (GSK)': ['Sensodyne Toothbrush'],
    'Procter & Gamble': ['Oral-B'],
    'Imported / Others': [
      'Jordan',
      'Trisa',
      'Wisdom',
      'Matador Toothbrush',
      'RFL Toothbrush',
      'Fresh Toothbrush'
    ]
  },
  mouthwash: {
    'Colgate': [
      'Colgate Plax Peppermint',
      'Colgate Plax Fresh Tea',
      'Colgate Plax Sensitive',
      'Colgate Total Mouthwash',
      'Colgate Plax Complete Care'
    ],
    'Unilever': ['Pepsodent Mouthwash', 'CloseUp Mouthwash'],
    'Haleon (GSK)': ['Sensodyne Mouthwash'],
    'Procter & Gamble': ['Oral-B Mouthwash'],
    'Johnson & Johnson': ['Listerine'],
    'Reckitt': ['Dettol Mouthwash'],
    'Imported / Others': ['Betadine', 'Hexisol']
  }
};

const DEFAULT_SKU_SIZE_RANGES = [
  '10 gm - 25 gm',
  '30 gm - 45 gm',
  '50 gm - 75 gm',
  '80 gm - 100 gm',
  '120 gm - 150 gm',
  '175 gm - 200 gm',
  '220 gm - 300 gm',
  '350 gm+'
];

const OUTLET_TYPES = ['Grocery', 'Pharmacy', 'Cosmetics', 'Kiosk', 'Supermarket'];

const SAMPLE_PREVIEW_ROUTE = [
  { lat: 23.8103, lng: 90.4125, time: '09:15 AM', label: 'Outlet #1 (Preview)' },
  { lat: 23.8113, lng: 90.4135, time: '09:42 AM', label: 'Outlet #2 (Preview)' },
  { lat: 23.8123, lng: 90.4120, time: '10:10 AM', label: 'Outlet #3 (Preview)' },
  { lat: 23.8130, lng: 90.4140, time: '10:38 AM', label: 'Outlet #4 (Preview)' }
];

// ============================================================================
// 3. HELPER UTILITIES (Dates & Haversine Distance)
// ============================================================================
const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateString = (raw) => {
  if (!raw) return '';
  const str = String(raw).trim().replace(/^'/, '');
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return str;
};

const sameId = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
};

const computeTotalRouteKm = (points) => {
  if (!points || points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return total;
};

// ============================================================================
// 4. MODAL COMPONENT
// ============================================================================
const Modal = ({ isOpen, title, message, type = 'info', onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          {type === 'error' ? (
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          ) : type === 'success' ? (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          )}
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm shadow hover:bg-red-700 active:scale-[0.98] transition-all"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 5. MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('colgate_auth_user_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loginRole, setLoginRole] = useState('intern');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('outlet');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Covered Outlets History State
  const [coveredOutlets, setCoveredOutlets] = useState(() => {
    try {
      const saved = localStorage.getItem('colgate_covered_outlets_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read local coverage history', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('colgate_covered_outlets_v1', JSON.stringify(coveredOutlets));
    } catch (e) {
      console.warn('Could not persist local coverage history', e);
    }
  }, [coveredOutlets]);

  // Survey Data State
  const [outletData, setOutletData] = useState({
    photoDataUrl: null,
    name: '',
    mobile: '',
    address: '',
    type: '',
    lat: '',
    lng: '',
    timestamp: ''
  });
  const [isOutletSaved, setIsOutletSaved] = useState(false);
  const [toothpasteData, setToothpasteData] = useState([]);
  const [toothbrushData, setToothbrushData] = useState([]);
  const [mouthwashData, setMouthwashData] = useState([]);

  // Master Catalog & SKU Ranges (Starts with outlet survey.xlsx data, syncs with Google Sheet if available)
  const [surveyCatalog, setSurveyCatalog] = useState(DEFAULT_SURVEY_CATALOG);
  const [skuSizeRanges, setSkuSizeRanges] = useState(DEFAULT_SKU_SIZE_RANGES);
  const [catalogSource, setCatalogSource] = useState('Excel Built-in');

  useEffect(() => {
    if (!GOOGLE_SCRIPT_URL) return;
    fetch(`${GOOGLE_SCRIPT_URL}?type=catalog`)
      .then((res) => res.json())
      .then((json) => {
        if (json.catalog && Object.keys(json.catalog).length > 0) {
          setSurveyCatalog((prev) => ({
            toothpaste: Object.keys(json.catalog.toothpaste || {}).length > 0 ? json.catalog.toothpaste : prev.toothpaste,
            toothbrush: Object.keys(json.catalog.toothbrush || {}).length > 0 ? json.catalog.toothbrush : prev.toothbrush,
            mouthwash: Object.keys(json.catalog.mouthwash || {}).length > 0 ? json.catalog.mouthwash : prev.mouthwash
          }));
          setCatalogSource('Google Sheet Synced');
        }
        if (Array.isArray(json.skuRanges) && json.skuRanges.length > 0) {
          setSkuSizeRanges(json.skuRanges);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'intern' || !GOOGLE_SCRIPT_URL) return;

    const sendGpsHeartbeat = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'log_gps',
              internId: currentUser.username,
              lat: pos.coords.latitude.toFixed(6),
              lng: pos.coords.longitude.toFixed(6)
            })
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };

    const intervalId = setInterval(sendGpsHeartbeat, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const showModal = (title, message, type = 'info') => {
    setModal({ isOpen: true, title, message, type });
  };

  // Authenticate against Google Sheet "Users" tab (with fallback for offline/preview)
  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);

    try {
      // 1. Live Google Sheet "Users" Tab Verification
      if (GOOGLE_SCRIPT_URL) {
        const loginUrl = `${GOOGLE_SCRIPT_URL}?type=login&username=${encodeURIComponent(cleanUser)}&password=${encodeURIComponent(cleanPass)}`;
        const response = await fetch(loginUrl);
        const result = await response.json();

        if (result.valid) {
          const userObj = {
            username: result.username,
            fullName: result.fullName || result.username,
            userType: (result.userType || 'intern').toLowerCase()
          };
          setCurrentUser(userObj);
          localStorage.setItem('colgate_auth_user_v1', JSON.stringify(userObj));
          setActiveTab('outlet');
          setAdminTab('dashboard');
          return;
        } else {
          setLoginError(result.message || 'Invalid username or password.');
          return;
        }
      }

      // 2. Local Preview / Fallback Check (when GOOGLE_SCRIPT_URL is empty)
      const matched = FALLBACK_USERS.find(
        (u) => u.username.toLowerCase() === cleanUser.toLowerCase() && u.password === cleanPass
      );

      if (!matched) {
        setLoginError('Invalid username or password. Please check your credentials and try again.');
        return;
      }

      const userObj = {
        username: matched.username,
        fullName: matched.fullName,
        userType: matched.userType
      };
      setCurrentUser(userObj);
      localStorage.setItem('colgate_auth_user_v1', JSON.stringify(userObj));
      setActiveTab('outlet');
      setAdminTab('dashboard');
    } catch (err) {
      console.error('Login check error:', err);
      setLoginError('Unable to reach Google Sheet server. Please check your internet connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('colgate_auth_user_v1');
    setCurrentUser(null);
    setActiveTab('outlet');
    setAdminTab('dashboard');
  };

  // STRICT VALIDATION: Photo and mandatory fields must be completed
  const handleSaveOutlet = () => {
    if (!outletData.photoDataUrl) {
      showModal(
        'Photo Required',
        'You cannot unlock the product sections without taking a photo of the outlet signboard first. Please tap the camera button to capture the live photo.',
        'error'
      );
      return;
    }
    if (!outletData.name.trim()) {
      showModal('Outlet Name Required', 'Please enter or verify the Outlet Name before continuing.', 'error');
      return;
    }
    if (!outletData.type) {
      showModal('Outlet Type Required', 'Please select an Outlet Type (e.g. Grocery, Pharmacy) from the dropdown.', 'error');
      return;
    }

    setIsOutletSaved(true);
    showModal(
      'Outlet Locked & Saved',
      'Outlet details have been saved. Product survey sections are now unlocked.',
      'success'
    );
  };

  const handleSubmitFinalSurvey = async () => {
    if (isSubmitting || !currentUser) return;
    setIsSubmitting(true);

    const normalizeEntries = (entries) =>
      entries
        .filter((item) => item.company)
        .map((item) => {
          const resolvedCompany =
            item.company === '__OTHER__'
              ? (item.customCompany || '').trim() || 'Other'
              : item.company;
          const pendingBrand = (item.customBrandDraft || '').trim();
          const mergedBrands =
            pendingBrand && !(item.brands || []).includes(pendingBrand)
              ? [...(item.brands || []), pendingBrand]
              : item.brands || [];

          return {
            company: resolvedCompany,
            brands: mergedBrands,
            skus: item.skus || [],
            totalQty: item.totalQty || ''
          };
        });

    const normalizedToothpaste = normalizeEntries(toothpasteData);
    const normalizedToothbrush = normalizeEntries(toothbrushData);
    const normalizedMouthwash = normalizeEntries(mouthwashData);

    try {
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'submit_survey',
            internId: currentUser.username,
            outlet: outletData,
            products: {
              toothpaste: normalizedToothpaste,
              toothbrush: normalizedToothbrush,
              mouthwash: normalizedMouthwash
            }
          })
        });
      }

      const todayStr = getLocalDateString(0);
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const totalCompaniesCount =
        normalizedToothpaste.length + normalizedToothbrush.length + normalizedMouthwash.length;
      const totalToothpasteUnits = normalizedToothpaste.reduce(
        (sum, item) => sum + (parseInt(item.totalQty, 10) || 0),
        0
      );
      const hasColgate = [
        ...normalizedToothpaste,
        ...normalizedToothbrush,
        ...normalizedMouthwash
      ].some((p) => p.company === 'Colgate');

      const newCoveredRecord = {
        outletId: `OUT-${Date.now()}`,
        internId: currentUser.username,
        outletName: outletData.name.trim(),
        outletType: outletData.type,
        mobile: outletData.mobile.trim(),
        address: outletData.address.trim() || 'GPS Location Recorded',
        lat: parseFloat(outletData.lat) || null,
        lng: parseFloat(outletData.lng) || null,
        date: todayStr,
        time: timeStr,
        companiesCount: totalCompaniesCount,
        toothpasteUnits: totalToothpasteUnits,
        hasColgate,
        photoUrl: ''
      };

      setCoveredOutlets((prev) => [newCoveredRecord, ...prev]);

      showModal(
        'Survey Saved & Outlet Covered!',
        `"${outletData.name}" has been stored in the database and added to your Covered Outlets list for ${todayStr}.`,
        'success'
      );

      setOutletData({
        photoDataUrl: null,
        name: '',
        mobile: '',
        address: '',
        type: '',
        lat: '',
        lng: '',
        timestamp: ''
      });
      setIsOutletSaved(false);
      setToothpasteData([]);
      setToothbrushData([]);
      setMouthwashData([]);
      setActiveTab('outlet');
    } catch (error) {
      console.error('Save error:', error);
      showModal('Submission Error', 'Failed to save survey. Please check your internet connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // VIEW A: UNIFIED LOGIN PORTAL (Intern Login & Admin Login)
  // ==========================================================================
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100/50 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />
          
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 mb-3">
              <span className="text-2xl font-black tracking-tighter">CP</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">User Portal</h1>
            <p className="text-xs text-red-700/80 font-medium tracking-wide mt-1">Colgate Retail Visibility Audit</p>
          </div>

          {/* Role Switcher: Intern Login vs Admin Login */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setLoginRole('intern');
                setLoginError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                loginRole === 'intern'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Intern Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginRole('admin');
                setLoginError('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                loginRole === 'admin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin Login
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                {loginRole === 'admin' ? 'Admin Username' : 'Intern Username'}
              </label>
              <input
                required
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full border-gray-200 rounded-xl shadow-sm focus:border-red-600 focus:ring-red-600 p-3 text-sm font-semibold border bg-gray-50/50"
                placeholder={loginRole === 'admin' ? 'Enter admin username' : 'e.g. USR-001'}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Password</label>
              <input
                required
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border-gray-200 rounded-xl shadow-sm focus:border-red-600 focus:ring-red-600 p-3 text-sm border bg-gray-50/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full text-white p-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2 disabled:opacity-60 ${
                loginRole === 'admin'
                  ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/25'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/30'
              }`}
            >
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoggingIn
                ? 'Signing In...'
                : loginRole === 'admin'
                ? 'Sign In as Admin'
                : 'Sign In as Intern'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================================================
  // VIEW B: ADMIN PANEL (When logged in user has userType === 'admin')
  // ==========================================================================
  if (currentUser.userType === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        localOutlets={coveredOutlets}
        catalog={surveyCatalog}
        skuRanges={skuSizeRanges}
        catalogSource={catalogSource}
      />
    );
  }

  // ==========================================================================
  // VIEW C: INTERN SURVEY APP (When logged in user has userType === 'intern')
  // ==========================================================================
  const userCoveredOutlets = coveredOutlets.filter((item) =>
    sameId(item.internId, currentUser.username)
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white px-4 py-3.5 shadow-md z-10 sticky top-0 flex items-center justify-between border-b border-red-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white text-red-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
            CP
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-tight">Colgate Visibility Survey</h1>
            <p className="text-red-100 text-[11px] font-medium tracking-wide">
              User: {currentUser.username} • {GOOGLE_SCRIPT_URL ? 'Cloud Connected' : 'Local Preview Mode'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 shadow-sm ${
              activeTab === 'map'
                ? 'bg-white text-red-700 border-white'
                : 'bg-red-800/60 hover:bg-red-800 text-white border-red-400/30'
            }`}
            title="Open Daily Route Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-800/60 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-400/30 transition-all active:scale-95 shadow-sm"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'outlet' && (
          <OutletSection 
            data={outletData} 
            setData={setOutletData} 
            onSave={handleSaveOutlet} 
            isSaved={isOutletSaved}
            showModal={showModal}
          />
        )}

        {activeTab === 'toothpaste' && (
          <ProductSection 
            category="toothpaste"
            title="Toothpaste" 
            data={toothpasteData} 
            setData={setToothpasteData} 
            hasSKU={true}
            hasQty={true}
            catalog={surveyCatalog}
            skuRanges={skuSizeRanges}
          />
        )}

        {activeTab === 'toothbrush' && (
          <ProductSection 
            category="toothbrush"
            title="Toothbrush" 
            data={toothbrushData} 
            setData={setToothbrushData} 
            hasSKU={false}
            hasQty={false}
            catalog={surveyCatalog}
            skuRanges={skuSizeRanges}
          />
        )}

        {activeTab === 'mouthwash' && (
          <ProductSection 
            category="mouthwash"
            title="Mouthwash" 
            data={mouthwashData} 
            setData={setMouthwashData} 
            hasSKU={false}
            hasQty={false}
            catalog={surveyCatalog}
            skuRanges={skuSizeRanges}
          />
        )}

        {activeTab === 'coverage' && (
          <CoveredOutletsSection
            internId={currentUser.username}
            localRecords={userCoveredOutlets}
          />
        )}

        {activeTab === 'map' && (
          <MapSection
            internId={currentUser.username}
            localRecords={userCoveredOutlets}
          />
        )}

        {/* Submit Button available on Product tabs */}
        {['toothpaste', 'toothbrush', 'mouthwash'].includes(activeTab) && isOutletSaved && (
          <div className="pt-4 pb-8">
            <button
              onClick={handleSubmitFinalSurvey}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-2xl font-bold shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-rose-800 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSubmitting ? 'Saving to Google Sheet...' : 'Submit Survey Data'}
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-1.5 shadow-[0_-4px_15px_rgba(0,0,0,0.04)] z-20">
        {[
          { id: 'outlet', label: 'Outlet', icon: MapPin, locked: false },
          { id: 'toothpaste', label: 'Toothpaste', icon: ClipboardList, locked: !isOutletSaved },
          { id: 'toothbrush', label: 'Toothbrush', icon: ClipboardList, locked: !isOutletSaved },
          { id: 'mouthwash', label: 'Mouthwash', icon: ClipboardList, locked: !isOutletSaved },
          {
            id: 'coverage',
            label: 'Coverage',
            icon: CheckSquare,
            locked: false,
            badgeCount: userCoveredOutlets.length
          },
          { id: 'map', label: 'Route Map', icon: MapIcon, locked: false }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.locked) {
                  showModal(
                    'Section Locked',
                    'Please take a live signboard photo and complete the Outlet Details on the first page to unlock the product survey tabs.',
                    'warning'
                  );
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`relative flex flex-col items-center p-1.5 rounded-xl flex-1 transition-all ${
                isActive
                  ? 'text-red-600 bg-red-50/90 font-bold'
                  : tab.locked
                  ? 'text-gray-300'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-red-600' : ''}`} />
                {tab.locked && (
                  <Lock className="w-3 h-3 text-red-500 absolute -top-1 -right-1.5 bg-white rounded-full p-0.5 shadow" />
                )}
                {!tab.locked && typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                    {tab.badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Notification Modal */}
      <Modal 
        isOpen={modal.isOpen} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />
    </div>
  );
}

// ============================================================================
// 6. ADMIN DASHBOARD COMPONENT
// ============================================================================
const AdminDashboard = ({
  currentUser,
  onLogout,
  adminTab,
  setAdminTab,
  localOutlets,
  catalog,
  skuRanges,
  catalogSource
}) => {
  const [remoteOutlets, setRemoteOutlets] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(0));
  const [outletInternFilter, setOutletInternFilter] = useState('ALL');
  const [selectedIntern, setSelectedIntern] = useState('USR-001');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAdminData = () => {
    if (!GOOGLE_SCRIPT_URL) return;
    setIsSyncing(true);
    fetch(`${GOOGLE_SCRIPT_URL}?type=admin_data`)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.outlets)) {
          setRemoteOutlets(
            json.outlets.map((o) => ({
              ...o,
              date: normalizeDateString(o.date)
            }))
          );
        }
        if (Array.isArray(json.users)) {
          setRemoteUsers(json.users);
        }
      })
      .catch(() => {})
      .finally(() => setIsSyncing(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const allOutlets = (remoteOutlets !== null ? remoteOutlets : localOutlets).map((o) => ({
    ...o,
    date: normalizeDateString(o.date)
  }));

  // Merge fallback users + Google Sheet Users + any intern IDs present in submitted outlets so the list is never empty
  const mergedUsersMap = new Map();
  FALLBACK_USERS.forEach((u) => mergedUsersMap.set(u.username.toLowerCase(), u));
  if (Array.isArray(remoteUsers)) {
    remoteUsers.forEach((u) => {
      if (u.username) {
        mergedUsersMap.set(u.username.trim().toLowerCase(), {
          ...u,
          username: u.username.trim()
        });
      }
    });
  }
  allOutlets.forEach((o) => {
    const id = String(o.internId || '').trim();
    if (id && !mergedUsersMap.has(id.toLowerCase())) {
      mergedUsersMap.set(id.toLowerCase(), {
        username: id,
        fullName: `Field Intern (${id})`,
        userType: 'intern',
        password: ''
      });
    }
  });

  const usersList = Array.from(mergedUsersMap.values());
  const internAccounts = usersList.filter(
    (u) => (u.userType || 'intern').toLowerCase() === 'intern'
  );

  useEffect(() => {
    if (internAccounts.length > 0 && !internAccounts.some((u) => sameId(u.username, selectedIntern))) {
      setSelectedIntern(internAccounts[0].username);
    }
  }, [internAccounts.length]);

  const todayStr = getLocalDateString(0);
  const todayOutletsCount = allOutlets.filter((o) => o.date === todayStr).length;

  const dateFilteredOutlets = selectedDate
    ? allOutlets.filter((o) => o.date === selectedDate)
    : allOutlets;

  const visibleOutletsList =
    outletInternFilter === 'ALL'
      ? dateFilteredOutlets
      : dateFilteredOutlets.filter((o) => sameId(o.internId, outletInternFilter));

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans pb-20">
      {/* Admin Header */}
      <header className="bg-gradient-to-r from-slate-900 via-red-900 to-red-700 text-white px-4 py-3.5 shadow-md z-10 sticky top-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white text-red-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-tight">Admin Control Panel</h1>
            <p className="text-red-100 text-[11px] font-medium">
              {currentUser.fullName} ({currentUser.username}) • {GOOGLE_SCRIPT_URL ? 'Google Sheet Live' : 'Preview Mode'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminTab('routes')}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all ${
              adminTab === 'routes'
                ? 'bg-white text-red-700 border-white'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="Track Intern Routes on Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          {GOOGLE_SCRIPT_URL && (
            <button
              onClick={fetchAdminData}
              disabled={isSyncing}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              title="Sync latest rows from Google Sheet"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 1: ADMIN OVERVIEW & INTERN COVERAGE LEADERBOARD */}
        {adminTab === 'dashboard' && (
          <>
            {/* Top KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-4 rounded-2xl shadow-md shadow-red-600/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 block">
                  Total Covered
                </span>
                <span className="text-2xl font-black mt-1 block">{allOutlets.length}</span>
                <span className="text-[10px] text-red-100/90 block">Target: 60,000</span>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Today ({todayStr})
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">{todayOutletsCount}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block">Outlets Submitted</span>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Field Team
                </span>
                <span className="text-2xl font-black text-gray-900 mt-1 block">{internAccounts.length}</span>
                <span className="text-[10px] text-gray-500 font-semibold block">Active Interns</span>
              </div>
            </div>

            {/* Date Filter & Intern Coverage Breakdown */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-red-600" /> Intern Coverage Summary
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    How many outlets each intern visited on {selectedDate || 'all dates'} vs total
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${
                      selectedDate === todayStr
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(normalizeDateString(e.target.value))}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-800 bg-gray-50"
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate('')}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      All Dates
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {internAccounts.map((intern) => {
                  const dateCount = dateFilteredOutlets.filter((o) =>
                    sameId(o.internId, intern.username)
                  ).length;
                  const totalInternCount = allOutlets.filter((o) =>
                    sameId(o.internId, intern.username)
                  ).length;

                  return (
                    <div key={intern.username} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900">{intern.username}</span>
                        <span className="text-xs text-gray-500 ml-2 truncate">{intern.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            dateCount > 0
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {selectedDate ? `${dateCount} on date` : `${totalInternCount} total`}
                        </span>
                        {selectedDate && (
                          <span className="text-[11px] font-semibold text-gray-500">
                            ({totalInternCount} all-time)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setOutletInternFilter(
                              sameId(outletInternFilter, intern.username) ? 'ALL' : intern.username
                            )
                          }
                          className="text-[11px] font-bold text-red-600 hover:underline"
                        >
                          Outlets
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIntern(intern.username);
                            setAdminTab('routes');
                          }}
                          className="text-[11px] font-bold text-slate-600 hover:text-red-600 underline"
                        >
                          Route
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visited Outlets List (With Intern Filter + Photo & Product Visibility) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Store className="w-4 h-4 text-red-600" /> Visited Outlets ({visibleOutletsList.length})
                </h2>

                <select
                  value={outletInternFilter}
                  onChange={(e) => setOutletInternFilter(e.target.value)}
                  className="border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 bg-gray-50"
                >
                  <option value="ALL">All Interns ({dateFilteredOutlets.length})</option>
                  {internAccounts.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.username} ({u.fullName})
                    </option>
                  ))}
                </select>
              </div>

              {visibleOutletsList.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  No visited outlets found for {selectedDate || 'all dates'}
                  {outletInternFilter !== 'ALL' ? ` by ${outletInternFilter}` : ''}.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {visibleOutletsList.map((o) => (
                    <div key={o.outletId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-gray-900">{o.outletName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-700">
                            {o.outletType}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                            {o.internId}
                          </span>
                        </div>
                        {o.address && (
                          <p className="text-[11px] text-gray-600">{o.address}</p>
                        )}
                        <p className="text-[11px] text-gray-500">
                          Visited on <strong>{o.date}</strong> at {o.time}
                          {o.mobile ? ` • Mob: ${o.mobile}` : ''}
                        </p>
                      </div>

                      {o.photoUrl ? (
                        <a
                          href={o.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-red-600 bg-white border border-red-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 hover:bg-red-50 shadow-sm"
                        >
                          <span>Photo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded shrink-0">
                          Submitted
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: ADMIN INTERN ROUTE & TERRITORY CIRCLE TRACKER */}
        {adminTab === 'routes' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
              <label htmlFor="adminInternSelect" className="block text-xs font-bold uppercase text-gray-700">
                Select Intern to Track ({internAccounts.length} Interns)
              </label>
              <select
                id="adminInternSelect"
                value={selectedIntern}
                onChange={(e) => setSelectedIntern(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50 focus:ring-2 focus:ring-red-500"
              >
                {internAccounts.map((u) => (
                  <option key={u.username} value={u.username}>
                    {u.username} — {u.fullName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Choose an intern above and select a date below to inspect their route line, area circle, and distance covered.
              </p>
            </div>

            <MapSection internId={selectedIntern} localRecords={allOutlets} />
          </div>
        )}

        {/* TAB 3: USERS & GOOGLE SHEET CREDENTIALS OVERVIEW */}
        {adminTab === 'users' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" /> User Accounts (`Users` Sheet Tab)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                To add an intern, change a password, or change <code>user_type</code> (<code>admin</code> vs <code>intern</code>), edit the <strong>Users</strong> tab directly inside your Google Sheet—changes take effect on the next login!
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-gray-700 uppercase text-[10px] font-bold">
                    <th className="p-3 border-b">Username</th>
                    <th className="p-3 border-b">Full Name</th>
                    <th className="p-3 border-b">User Type</th>
                    <th className="p-3 border-b">Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((u) => (
                    <tr key={u.username} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-gray-900">{u.username}</td>
                      <td className="p-3 text-gray-600">{u.fullName}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            (u.userType || '').toLowerCase() === 'admin'
                              ? 'bg-slate-900 text-white'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {u.userType}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-500">
                        {u.password || '••••••••'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY, BRAND & SKU MASTER LISTS (From Excel / Google Sheet) */}
        {adminTab === 'catalog' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-600" /> Product Master Lists
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {catalogSource}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                All companies, brands, and SKU ranges from your Excel file are pre-loaded in the app. You can also edit them anytime in the <strong>Catalog</strong> & <strong>SKU_Ranges</strong> tabs of your Google Sheet.
              </p>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block mb-2">
                  Toothpaste SKU Size Ranges ({skuRanges.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skuRanges.map((sku) => (
                    <span key={sku} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                      {sku}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {['toothpaste', 'toothbrush', 'mouthwash'].map((cat) => {
              const catMap = catalog[cat] || {};
              return (
                <div key={cat} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-800">
                    {cat} Companies & Brands ({Object.keys(catMap).length})
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {Object.entries(catMap).map(([comp, brands]) => (
                      <div key={comp} className="py-2.5">
                        <span className="text-xs font-bold text-gray-900 block mb-1">{comp}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(brands || []).map((b) => (
                            <span key={b} className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Admin Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-1.5 shadow-[0_-4px_15px_rgba(0,0,0,0.04)] z-20">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'routes', label: 'Intern Routes', icon: MapIcon },
          { id: 'users', label: 'Users Sheet', icon: Users },
          { id: 'catalog', label: 'Catalog', icon: Layers }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`flex flex-col items-center p-1.5 rounded-xl flex-1 transition-all ${
                isActive ? 'text-red-600 bg-red-50 font-bold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'text-red-600' : ''}`} />
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// ============================================================================
// 7. COVERED OUTLETS SECTION (With Date Filter & Google Sheet Sync)
// ============================================================================
const CoveredOutletsSection = ({ internId, localRecords }) => {
  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(-1);

  const [filterMode, setFilterMode] = useState('today');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [remoteRecords, setRemoteRecords] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchCoverageFromSheet = () => {
    if (!GOOGLE_SCRIPT_URL) return;
    setIsSyncing(true);
    const url = `${GOOGLE_SCRIPT_URL}?type=coverage&internId=${encodeURIComponent(internId)}`;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.outlets)) {
          setRemoteRecords(
            json.outlets.map((o) => ({
              ...o,
              date: normalizeDateString(o.date)
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setIsSyncing(false));
  };

  useEffect(() => {
    fetchCoverageFromSheet();
  }, [internId]);

  // Combine Google Sheet rows with any just-submitted local rows (deduped by outletName + date + time)
  const normalizedLocal = localRecords.map((o) => ({
    ...o,
    date: normalizeDateString(o.date)
  }));

  const records = (() => {
    if (remoteRecords === null) return normalizedLocal;
    const combined = [...remoteRecords];
    normalizedLocal.forEach((loc) => {
      const exists = combined.some(
        (rem) =>
          rem.outletId === loc.outletId ||
          (rem.outletName === loc.outletName && rem.date === loc.date && rem.time === loc.time)
      );
      if (!exists) combined.unshift(loc);
    });
    return combined;
  })();

  const activeDateTarget =
    filterMode === 'today'
      ? todayStr
      : filterMode === 'yesterday'
      ? yesterdayStr
      : filterMode === 'custom'
      ? normalizeDateString(selectedDate)
      : null;

  const filteredRecords = activeDateTarget
    ? records.filter((item) => normalizeDateString(item.date) === activeDateTarget)
    : records;

  const todayCount = records.filter((item) => normalizeDateString(item.date) === todayStr).length;
  const totalCount = records.length;

  const handleDatePickerChange = (e) => {
    const val = normalizeDateString(e.target.value);
    if (val) {
      setSelectedDate(val);
      setFilterMode('custom');
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Summary Header Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <CheckSquare className="text-red-600 w-5 h-5" /> Covered Outlets
          </h2>
          <div className="flex items-center gap-2">
            {GOOGLE_SCRIPT_URL && (
              <button
                type="button"
                onClick={fetchCoverageFromSheet}
                disabled={isSyncing}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Refresh from Google Sheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-600' : ''}`} />
              </button>
            )}
            <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full">
              {internId}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Outlets are counted here automatically once you press <strong>Submit Survey Data</strong> and the record is stored in Google Sheets.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-3.5 rounded-2xl shadow-md shadow-red-600/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 block">
              {filterMode === 'all' ? 'Filtered Total' : 'Selected Date'}
            </span>
            <span className="text-2xl font-black mt-0.5 block">{filteredRecords.length}</span>
            <span className="text-[10px] text-red-100/90 truncate block">
              {activeDateTarget || 'All Dates'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Today
            </span>
            <span className="text-2xl font-black text-gray-900 mt-0.5 block">{todayCount}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block">Submitted</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              All-Time
            </span>
            <span className="text-2xl font-black text-gray-900 mt-0.5 block">{totalCount}</span>
            <span className="text-[10px] text-gray-500 font-medium block">Outlets</span>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-red-600" /> Filter by Date
          </span>
          {activeDateTarget && (
            <span className="text-xs font-mono font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
              {activeDateTarget}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setFilterMode('today');
              setSelectedDate(todayStr);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterMode === 'today'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Today ({todayCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('yesterday');
              setSelectedDate(yesterdayStr);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterMode === 'yesterday'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Yesterday
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterMode === 'all'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Dates ({totalCount})
          </button>
        </div>

        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">
            Or Pick Specific Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDatePickerChange}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 bg-gray-50/70 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      {/* Covered Outlets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Submitted Outlets ({filteredRecords.length})
          </h3>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center">
            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No outlets covered on this date</p>
            <p className="text-xs text-gray-500 mt-1">
              Complete an outlet survey and press <strong>Submit Survey Data</strong> to log coverage.
            </p>
          </div>
        ) : (
          filteredRecords.map((outlet, idx) => (
            <div
              key={outlet.outletId}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
                  #{filteredRecords.length - idx}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{outlet.outletName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {outlet.outletType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{outlet.address}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" /> {outlet.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" /> {outlet.time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 gap-1.5">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Submitted
                </span>
                {typeof outlet.companiesCount === 'number' && (
                  <span className="text-[11px] font-semibold text-gray-600">
                    {outlet.companiesCount} {outlet.companiesCount === 1 ? 'company' : 'companies'}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 8. OUTLET SECTION COMPONENT (With Client-Side 800px Image Compression)
// ============================================================================
const OutletSection = ({ data, setData, onSave, isSaved, showModal }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fetchLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          const currentTime = new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium'
          });
          setData((prev) => ({
            ...prev,
            lat,
            lng,
            timestamp: prev.timestamp || currentTime
          }));
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocation failed', error);
          setIsLocating(false);
          showModal('GPS Note', 'Unable to fetch GPS automatically. Please check device location permissions or enter coordinates manually.', 'warning');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      showModal('Error', 'Geolocation is not supported on this device.', 'error');
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      showModal('Camera Permission Required', 'Unable to access camera directly. Please grant camera permissions in your browser.', 'error');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Compress signboard photo to max 800px width (~40 KB) so 60,000 photos fit inside free 15 GB Google Drive
      const MAX_WIDTH = 800;
      const scale = video.videoWidth > MAX_WIDTH ? MAX_WIDTH / video.videoWidth : 1;
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
      stopCamera();

      const captureTime = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });

      setData((prev) => ({
        ...prev,
        photoDataUrl: dataUrl,
        timestamp: captureTime
      }));

      fetchLocation();

      if (GEMINI_API_KEY) {
        processImageWithGemini(dataUrl);
      }
    }
  };

  const processImageWithGemini = async (base64Url) => {
    setIsExtracting(true);
    try {
      const base64Data = base64Url.split(',')[1];
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: "Analyze this image of a store signboard. Extract the store information and return strictly a raw JSON object with keys: 'name', 'mobile', 'address'. Do not use markdown backticks."
              },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
            ]
          }
        ]
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const extracted = JSON.parse(cleanText);

        setData((prev) => ({
          ...prev,
          name: extracted.name || prev.name,
          mobile: extracted.mobile || prev.mobile,
          address: extracted.address || prev.address
        }));
        showModal('Signboard Scanned', 'Signboard text auto-detected. Please verify the information.', 'success');
      } catch (parseError) {
        showModal('Manual Input Required', 'Signboard text was unclear. Please type the outlet name and details manually.', 'warning');
      }
    } catch (error) {
      console.warn('OCR fallback:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <MapPin className="text-red-600 w-5 h-5" /> Outlet Identity
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          A live photo of the outlet signboard is mandatory to unlock the rest of the survey.
        </p>
        
        {/* Signboard Camera Box */}
        {!data.photoDataUrl ? (
          <div className="mb-6">
            {!isCameraOpen ? (
              <button 
                onClick={startCamera}
                disabled={isSaved}
                className="w-full h-36 border-2 border-dashed border-red-300 rounded-2xl bg-red-50/60 flex flex-col items-center justify-center text-red-600 hover:bg-red-100/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group p-4"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform border border-red-100">
                  <Camera className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-red-700">Take Signboard Photo (Mandatory)</span>
                <span className="text-[11px] text-gray-500 mt-1">Live camera only • No gallery uploads allowed</span>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] md:aspect-video w-full">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button onClick={stopCamera} className="bg-white/20 backdrop-blur text-white p-3 rounded-full hover:bg-white/30">
                    <X className="w-6 h-6" />
                  </button>
                  <button onClick={capturePhoto} className="bg-red-600 border-4 border-white text-white p-4 rounded-full shadow-lg hover:bg-red-700">
                    <Camera className="w-8 h-8" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 relative rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-sm">
            <img src={data.photoDataUrl} alt="Signboard" className="w-full h-48 object-cover" />
            
            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
              <Check className="w-3 h-3" /> Photo Captured (~40 KB)
            </div>

            {!isSaved && (
              <button 
                onClick={() => setData((prev) => ({ ...prev, photoDataUrl: null }))}
                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-md hover:bg-red-700"
                title="Retake photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {isExtracting && (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                <span className="text-xs font-bold text-red-700 uppercase tracking-wider text-center">Auto-reading Signboard via AI OCR...</span>
              </div>
            )}
          </div>
        )}

        {/* Outlet Details Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Outlet Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={data.name} 
              onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isSaved}
              className="w-full border-gray-300 rounded-xl p-3 border text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100" 
              placeholder="e.g. Rahim General Store" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Mobile Number</label>
              <input 
                type="tel" 
                value={data.mobile} 
                onChange={(e) => setData((prev) => ({ ...prev, mobile: e.target.value }))}
                disabled={isSaved}
                className="w-full border-gray-300 rounded-xl p-3 border text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100" 
                placeholder="e.g. 017..." 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Outlet Type <span className="text-red-500">*</span>
              </label>
              <select 
                value={data.type}
                onChange={(e) => setData((prev) => ({ ...prev, type: e.target.value }))}
                disabled={isSaved}
                className="w-full border-gray-300 rounded-xl p-3 border text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 bg-white"
              >
                <option value="">Select Type</option>
                {OUTLET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Address</label>
            <textarea 
              value={data.address} 
              onChange={(e) => setData((prev) => ({ ...prev, address: e.target.value }))}
              disabled={isSaved}
              className="w-full border-gray-300 rounded-xl p-3 border text-sm font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 resize-none" 
              rows={2}
              placeholder="Store address details" 
            />
          </div>

          {/* GPS Coordinates & Timestamp Section */}
          <div className="bg-gradient-to-br from-slate-50 to-red-50/25 p-4 rounded-xl border border-red-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Compass className="w-4 h-4 text-red-600" /> GPS & Timestamp Data
              </span>
              <button
                type="button"
                onClick={fetchLocation}
                disabled={isSaved || isLocating}
                className="text-xs font-semibold text-red-600 bg-white border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <MapPin className="w-3.5 h-3.5" />}
                {isLocating ? 'Detecting...' : 'Detect GPS Now'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                <input 
                  type="text"
                  value={data.lat}
                  onChange={(e) => setData((prev) => ({ ...prev, lat: e.target.value }))}
                  disabled={isSaved}
                  className="w-full bg-white border-gray-300 rounded-lg p-2.5 text-xs font-mono border focus:ring-2 focus:ring-red-500 disabled:bg-gray-100" 
                  placeholder="e.g. 23.8103"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                <input 
                  type="text"
                  value={data.lng}
                  onChange={(e) => setData((prev) => ({ ...prev, lng: e.target.value }))}
                  disabled={isSaved}
                  className="w-full bg-white border-gray-300 rounded-lg p-2.5 text-xs font-mono border focus:ring-2 focus:ring-red-500 disabled:bg-gray-100" 
                  placeholder="e.g. 90.4125"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Survey Timestamp
              </label>
              <input 
                type="text"
                value={data.timestamp}
                onChange={(e) => setData((prev) => ({ ...prev, timestamp: e.target.value }))}
                disabled={isSaved}
                className="w-full bg-white border-gray-300 rounded-lg p-2.5 text-xs font-mono border focus:ring-2 focus:ring-red-500 disabled:bg-gray-100" 
                placeholder="Auto-detected upon photo capture"
              />
            </div>
          </div>
        </div>

        {!isSaved ? (
          <button 
            onClick={onSave}
            className={`w-full mt-6 py-3.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
              !data.photoDataUrl || !data.name || !data.type
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-600/25 hover:from-red-700 hover:to-red-800'
            }`}
          >
            <Lock className="w-4 h-4" /> Save & Unlock Product Sections
          </button>
        ) : (
          <div className="w-full mt-6 bg-emerald-50 text-emerald-800 py-3 rounded-xl font-bold text-center border border-emerald-200 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Outlet Info Locked & Products Unlocked
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// ============================================================================
// 9. PRODUCT SECTION COMPONENT (Toothpaste, Toothbrush, Mouthwash)
// ============================================================================
const ProductSection = ({ category, title, data, setData, hasSKU, hasQty, catalog, skuRanges }) => {
  const categoryCatalog = (catalog && catalog[category]) || DEFAULT_SURVEY_CATALOG[category] || {};
  const activeSkuRanges = skuRanges || DEFAULT_SKU_SIZE_RANGES;

  const addCompanyEntry = () => {
    setData([
      ...data,
      {
        id: Date.now(),
        company: '',
        customCompany: '',
        customBrandDraft: '',
        brands: [],
        skus: [],
        totalQty: ''
      }
    ]);
  };

  const removeCompanyEntry = (entryId) => {
    setData(data.filter((item) => item.id !== entryId));
  };

  const updateCompany = (entryId, company) => {
    setData(
      data.map((item) => {
        if (item.id === entryId) {
          return {
            ...item,
            company,
            customCompany: '',
            customBrandDraft: '',
            brands: [],
            skus: [],
            totalQty: ''
          };
        }
        return item;
      })
    );
  };

  const updateField = (entryId, field, value) => {
    setData(data.map((item) => (item.id === entryId ? { ...item, [field]: value } : item)));
  };

  const toggleBrand = (entryId, brandName) => {
    setData(
      data.map((item) => {
        if (item.id !== entryId) return item;
        const brandsList = item.brands || [];
        if (brandsList.includes(brandName)) {
          return { ...item, brands: brandsList.filter((b) => b !== brandName) };
        } else {
          return { ...item, brands: [...brandsList, brandName] };
        }
      })
    );
  };

  const addCustomBrand = (entryId) => {
    setData(
      data.map((item) => {
        if (item.id !== entryId) return item;
        const newBrand = (item.customBrandDraft || '').trim();
        if (!newBrand) return item;
        const brandsList = item.brands || [];
        const updatedBrands = brandsList.includes(newBrand) ? brandsList : [...brandsList, newBrand];
        return { ...item, brands: updatedBrands, customBrandDraft: '' };
      })
    );
  };

  const toggleSku = (entryId, skuRange) => {
    setData(
      data.map((item) => {
        if (item.id !== entryId) return item;
        const skusList = item.skus || [];
        if (skusList.includes(skuRange)) {
          return { ...item, skus: skusList.filter((s) => s !== skuRange) };
        } else {
          return { ...item, skus: [...skusList, skuRange] };
        }
      })
    );
  };

  const updateTotalQty = (entryId, totalQty) => {
    setData(
      data.map((item) => {
        if (item.id === entryId) {
          return { ...item, totalQty };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{title} Visibility</h2>
          <p className="text-xs text-gray-500">Record all companies & brands present in this outlet</p>
        </div>
        <button 
          onClick={addCompanyEntry}
          className="flex items-center gap-1.5 bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Company
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-2xl border-2 border-dashed border-red-200">
          <p className="text-gray-500 mb-3 text-sm">No {title.toLowerCase()} companies added yet.</p>
          <button 
            onClick={addCompanyEntry} 
            className="text-red-600 font-bold text-sm hover:underline"
          >
            + Add First Company
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((item, index) => {
            const isOtherCompany = item.company === '__OTHER__';
            const availableBrands = !isOtherCompany && item.company ? categoryCatalog[item.company] || [] : [];
            const customAddedBrands = (item.brands || []).filter((b) => !availableBrands.includes(b));
            const isColgate = item.company === 'Colgate';
            const displayCompanyName = isOtherCompany
              ? (item.customCompany || '').trim() || 'Other Company'
              : item.company;

            return (
              <div 
                key={item.id} 
                className={`bg-white p-5 rounded-2xl shadow-sm border transition-all relative ${
                  isColgate ? 'border-red-300 ring-2 ring-red-500/10' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                      isColgate ? 'bg-red-600' : 'bg-slate-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Company Entry</span>
                    {isColgate && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Colgate Focus
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => removeCompanyEntry(item.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="Remove entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Company Dropdown */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Company Name
                  </label>
                  <select 
                    value={item.company}
                    onChange={(e) => updateCompany(item.id, e.target.value)}
                    className="w-full border-gray-300 rounded-xl p-2.5 border text-sm font-semibold focus:ring-2 focus:ring-red-500 bg-gray-50/70"
                  >
                    <option value="">-- Choose Company --</option>
                    {Object.keys(categoryCatalog).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__OTHER__">Other (Write Company & Brand Manually)</option>
                  </select>
                </div>

                {/* Manual Company Input when "Other" is chosen */}
                {isOtherCompany && (
                  <div className="mb-4 bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">
                        Write Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.customCompany || ''}
                        onChange={(e) => updateField(item.id, 'customCompany', e.target.value)}
                        placeholder="Enter company name manually..."
                        className="w-full bg-white border-amber-300 rounded-xl p-2.5 text-sm font-semibold border focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                )}

                {/* Brand Selection (Catalog + Manual Entry) */}
                {item.company && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                        {isOtherCompany
                          ? 'Write & Add Brand Name(s)'
                          : 'Select Brands Present in Outlet (Multiple)'}
                      </label>

                      {availableBrands.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {availableBrands.map((bName) => {
                            const isSelected = (item.brands || []).includes(bName);
                            return (
                              <button
                                key={bName}
                                type="button"
                                onClick={() => toggleBrand(item.id, bName)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                {bName}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {customAddedBrands.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2.5">
                          {customAddedBrands.map((customBrand) => (
                            <span
                              key={customBrand}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white border border-red-600 shadow-sm flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {customBrand}
                              <button
                                type="button"
                                onClick={() => toggleBrand(item.id, customBrand)}
                                className="ml-1 hover:text-red-200"
                                title="Remove brand"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.customBrandDraft || ''}
                          onChange={(e) => updateField(item.id, 'customBrandDraft', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomBrand(item.id);
                            }
                          }}
                          placeholder={
                            isOtherCompany
                              ? 'Type brand name and tap Add...'
                              : '+ Add unlisted brand manually...'
                          }
                          className="flex-1 border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold border focus:ring-2 focus:ring-red-500 bg-gray-50/60"
                        />
                        <button
                          type="button"
                          onClick={() => addCustomBrand(item.id)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>

                    {/* Toothpaste Details: SKU Size Range & Single Total Quantity */}
                    {hasSKU && (
                      <div className="space-y-4 pt-3 border-t border-gray-100">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                            Select SKU Size Range (Multiple)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {activeSkuRanges.map((skuRange) => {
                              const isSkuSelected = (item.skus || []).includes(skuRange);
                              return (
                                <button
                                  key={skuRange}
                                  type="button"
                                  onClick={() => toggleSku(item.id, skuRange)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                    isSkuSelected
                                      ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {isSkuSelected && <Check className="w-3 h-3" />}
                                  {skuRange}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {hasQty && (
                          <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                            <label className="block text-xs font-bold text-red-900 mb-1 uppercase tracking-wider">
                              Total Product Quantity of {displayCompanyName} in Outlet
                            </label>
                            <p className="text-[11px] text-gray-500 mb-2">
                              Enter the total units for this company across all selected brands & SKU ranges (e.g. 100)
                            </p>
                            <div className="relative">
                              <input 
                                type="number"
                                min="0"
                                value={item.totalQty || ''}
                                onChange={(e) => updateTotalQty(item.id, e.target.value)}
                                placeholder="Total units (e.g. 100)"
                                className="w-full bg-white text-sm font-bold p-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                              <span className="absolute right-3.5 top-3.5 text-xs font-bold text-gray-400 uppercase">
                                Units
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 10. DAILY ROUTE MAP SECTION (100% Free OpenStreetMap + Circle + Distance)
// ============================================================================
const MapSection = ({ internId, localRecords }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(0));
  const [remotePoints, setRemotePoints] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  useEffect(() => {
    setRemotePoints(null);
    if (!GOOGLE_SCRIPT_URL || !internId) return;
    setIsLoadingRoute(true);
    const url = `${GOOGLE_SCRIPT_URL}?type=route&internId=${encodeURIComponent(internId)}&date=${encodeURIComponent(selectedDate)}`;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.points)) {
          setRemotePoints(
            json.points.filter((p) => !isNaN(parseFloat(p.lat)) && !isNaN(parseFloat(p.lng))).map((p) => ({
              ...p,
              lat: parseFloat(p.lat),
              lng: parseFloat(p.lng)
            }))
          );
        } else {
          setRemotePoints([]);
        }
      })
      .catch(() => setRemotePoints([]))
      .finally(() => setIsLoadingRoute(false));
  }, [internId, selectedDate]);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      setMapReady(true);
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setMapReady(true);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          setMapReady(true);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const localDayPoints = localRecords
    .filter(
      (r) =>
        sameId(r.internId, internId) &&
        normalizeDateString(r.date) === selectedDate &&
        r.lat &&
        r.lng
    )
    .reverse()
    .map((r, i) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lng),
      time: r.time,
      label: `Outlet #${i + 1}: ${r.outletName}`
    }));

  const hasLiveGpsData =
    (remotePoints && remotePoints.length > 0) || localDayPoints.length > 0;

  const activePoints =
    remotePoints && remotePoints.length > 0
      ? remotePoints
      : localDayPoints.length > 0
      ? localDayPoints
      : !GOOGLE_SCRIPT_URL
      ? SAMPLE_PREVIEW_ROUTE
      : [];

  const isUsingSample = !GOOGLE_SCRIPT_URL && !hasLiveGpsData;
  const distanceKm = computeTotalRouteKm(activePoints);

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current || !window.L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center (Dhaka) when an intern has 0 GPS points on the chosen date
    if (activePoints.length === 0) {
      const map = window.L.map(mapContainerRef.current, { zoomControl: true }).setView(
        [23.8103, 90.4125],
        13
      );
      mapInstanceRef.current = map;
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      setTimeout(() => map.invalidateSize(), 250);
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }

    const coords = activePoints.map((p) => [p.lat, p.lng]);
    const avgLat = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
    const avgLng = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

    const map = window.L.map(mapContainerRef.current, {
      zoomControl: true
    }).setView([avgLat, avgLng], 15);
    mapInstanceRef.current = map;

    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (coords.length > 1) {
      window.L.polyline(coords, {
        color: '#ce1126',
        weight: 4,
        opacity: 0.9
      }).addTo(map);
    }

    window.L.circle(coords[0], {
      radius: 20,
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.85
    })
      .bindPopup(`<b>Start Point</b><br>${activePoints[0].label || activePoints[0].time}`)
      .addTo(map);

    activePoints.slice(1, -1).forEach((pt, idx) => {
      window.L.circleMarker([pt.lat, pt.lng], {
        radius: 6,
        color: '#ce1126',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2.5
      })
        .bindPopup(`<b>${pt.label || `Stop #${idx + 2}`}</b><br>Time: ${pt.time}`)
        .addTo(map);
    });

    let maxDistMeters = 120;
    coords.forEach((c) => {
      const dMeters = haversineKm(avgLat, avgLng, c[0], c[1]) * 1000;
      if (dMeters + 60 > maxDistMeters) maxDistMeters = dMeters + 60;
    });

    window.L.circle([avgLat, avgLng], {
      radius: maxDistMeters,
      color: '#dc2626',
      fillColor: '#f87171',
      fillOpacity: 0.18
    }).addTo(map);

    const lastPt = activePoints[activePoints.length - 1];
    window.L.circleMarker([lastPt.lat, lastPt.lng], {
      radius: 8,
      color: '#991b1b',
      fillColor: '#dc2626',
      fillOpacity: 1
    })
      .bindPopup(`<b>Latest Location</b><br>${lastPt.label || lastPt.time}`)
      .addTo(map);

    if (coords.length > 1) {
      map.fitBounds(coords, { padding: [40, 40] });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapReady, internId, selectedDate, remotePoints, localRecords]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[70vh] flex flex-col">
      <div className="p-4 border-b border-gray-100 bg-red-50/40 space-y-2.5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-800">Daily Route Tracker</h2>
            <p className="text-xs text-gray-500">
              Intern: <strong>{internId}</strong>{' '}
              {isLoadingRoute
                ? '• Loading GPS...'
                : isUsingSample
                ? '• Sample Route Preview'
                : activePoints.length > 0
                ? `• ${activePoints.length} GPS Points`
                : `• No GPS logs on ${selectedDate}`}
            </p>
          </div>
          <div className="text-right">
            <span className="block text-base font-black text-red-600">{distanceKm.toFixed(2)} km</span>
            <span className="text-[11px] text-gray-500">Distance Covered</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] font-bold text-gray-600 uppercase">Route Date:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(getLocalDateString(0))}
              className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                selectedDate === getLocalDateString(0)
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(normalizeDateString(e.target.value))}
              className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-semibold bg-white focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative z-0">
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="flex items-center gap-2 text-red-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading OpenStreetMap...</span>
            </div>
          </div>
        )}
        {mapReady && !isLoadingRoute && GOOGLE_SCRIPT_URL && activePoints.length === 0 && (
          <div className="absolute top-3 left-3 right-3 z-[400] bg-white/95 backdrop-blur border border-amber-200 rounded-xl px-3.5 py-2.5 shadow-md text-xs font-semibold text-amber-900 text-center">
            No outlets or GPS pings recorded for <strong>{internId}</strong> on <strong>{selectedDate}</strong>.
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '350px' }} />
      </div>
    </div>
  );
};
