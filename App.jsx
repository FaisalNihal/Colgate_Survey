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
  Layers,
  Edit2,
  Search,
  RotateCcw,
  UploadCloud,
  Navigation
} from 'lucide-react';

// ============================================================================
// 1. CONFIGURATION (Paste your Google Apps Script Web App URL below)
// ============================================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQSOfhWskkHlwuYvyD90KoPPBqDJFohe-6UA_B3PSreFR2pBNBt8QYHIUc8Org10LjuQ/exec';
const GEMINI_API_KEY = '';

// Fallback accounts used ONLY when GOOGLE_SCRIPT_URL is blank (Preview Mode).
// Once GOOGLE_SCRIPT_URL is set, logins verify directly against your Google Sheet "Users" tab.
const FALLBACK_USERS = [
  { username: 'admin', fullName: 'Survey Supervisor', userType: 'admin', password: 'admin123' },
  { username: 'USR-001', fullName: 'Intern 01', userType: 'intern', password: 'colgate01' },
  { username: 'USR-002', fullName: 'Intern 02', userType: 'intern', password: 'colgate02' },
  { username: 'USR-003', fullName: 'Intern 03', userType: 'intern', password: 'colgate03' },
  { username: 'USR-004', fullName: 'Intern 04', userType: 'intern', password: 'colgate04' },
  { username: 'USR-005', fullName: 'Intern 05', userType: 'intern', password: 'colgate05' },
  { username: 'USR-006', fullName: 'Intern 06', userType: 'intern', password: 'colgate06' },
  { username: 'USR-007', fullName: 'Intern 07', userType: 'intern', password: 'colgate07' },
  { username: 'USR-008', fullName: 'Intern 08', userType: 'intern', password: 'colgate08' },
  { username: 'USR-009', fullName: 'Intern 09', userType: 'intern', password: 'colgate09' },
  { username: 'USR-010', fullName: 'Intern 10', userType: 'intern', password: 'colgate10' },
  { username: 'USR-011', fullName: 'Intern 11', userType: 'intern', password: 'colgate11' },
  { username: 'USR-012', fullName: 'Intern 12', userType: 'intern', password: 'colgate12' },
  { username: 'USR-013', fullName: 'Intern 13', userType: 'intern', password: 'colgate13' },
  { username: 'USR-014', fullName: 'Intern 14', userType: 'intern', password: 'colgate14' },
  { username: 'USR-015', fullName: 'Intern 15', userType: 'intern', password: 'colgate15' }
];

// ============================================================================
// 2. COMPLETE COMPANY & BRAND LIST + SKU RANGES (From outlet survey_2.xlsx)
// ============================================================================
const DEFAULT_COMPANY_BRANDS = {
  'Colgate-Palmolive': [
    'Colgate Strong Teeth',
    'Colgate MaxFresh',
    'Colgate Visible White',
    'Colgate Active Salt',
    'Colgate Sensitive',
    'Colgate Total',
    'Colgate Herbal',
    'Colgate Cibaca',
    'Colgate Kids',
    'Colgate ZigZag',
    'Colgate Super Flexi',
    'Colgate SlimSoft',
    'Colgate Extra Clean',
    'Colgate 360',
    'Colgate Plax'
  ],
  'Unilever': ['Pepsodent', 'CloseUp', 'Lever Ayush'],
  'Square Toiletries': ['White Plus', 'Magic'],
  'ACI': ['ACI Neem', 'ACI Herbal'],
  'Kohinoor Chemical': ['Tibet'],
  'Keya Cosmetics': ['Keya'],
  'Anfords': ['Anfords'],
  'Dabur': ['Dabur Red', 'Dabur Meswak', 'Dabur Babool', 'Dabur Herbal'],
  'Haleon (GSK)': ['Sensodyne', 'Parodontax', 'Aquafresh'],
  'Procter & Gamble': ['Oral-B', 'Crest'],
  'Johnson & Johnson': ['Listerine'],
  'Himalaya': ['Himalaya Complete Care', 'Himalaya Sparkling White', 'Himalaya Herbals'],
  'Hawley & Hazel': ['Darlie'],
  'Reckitt': ['Dettol'],
  'Marico': ['Mediker'],
  'Matador': ['Matador'],
  'RFL': ['RFL'],
  'Fresh': ['Fresh'],
  'Jordan': ['Jordan'],
  'Trisa': ['Trisa'],
  'Wisdom': ['Wisdom'],
  'Patanjali': ['Dant Kanti'],
  'Vicco': ['Vicco Vajradanti'],
  'Amway': ['Glister'],
  'Forever Living': ['Forever Bright'],
  'DXN': ['Ganozhi'],
  'Atomy': ['Atomy Toothpaste'],
  'LION': ['Systema'],
  'Sunstar': ['GUM'],
  'KAO': ['Guard Halo'],
  'Church & Dwight': ['Arm & Hammer']
};

const DEFAULT_SURVEY_CATALOG = {
  toothpaste: DEFAULT_COMPANY_BRANDS,
  toothbrush: DEFAULT_COMPANY_BRANDS,
  mouthwash: DEFAULT_COMPANY_BRANDS
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

const fetchLocationNameFromCoords = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lng)}&zoom=14&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!response.ok) return '';
    const json = await response.json();
    const addr = json.address || {};

    const rawArea =
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.borough ||
      addr.city_district ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      '';
    const rawCity =
      addr.city ||
      addr.state_district ||
      addr.district ||
      addr.town ||
      addr.state ||
      '';

    const cleanPlace = (val) =>
      String(val || '')
        .replace(/\s*(Metropolitan|District|Division|Sadar|Thana|Upazila)$/i, '')
        .trim();

    const area = cleanPlace(rawArea);
    const city = cleanPlace(rawCity);

    if (area && city && area.toLowerCase() !== city.toLowerCase()) {
      return `${area}, ${city}`;
    }
    if (area) return area;
    if (city) return city;

    if (json.display_name) {
      return json.display_name
        .split(',')
        .slice(0, 2)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');
    }
    return '';
  } catch {
    return '';
  }
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

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

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

  const [outletData, setOutletData] = useState({
    photoDataUrl: null,
    name: '',
    mobile: '',
    address: '',
    type: '',
    lat: '',
    lng: '',
    locationName: '',
    timestamp: ''
  });
  const [isOutletSaved, setIsOutletSaved] = useState(false);
  const [toothpasteData, setToothpasteData] = useState([]);
  const [toothbrushData, setToothbrushData] = useState([]);
  const [mouthwashData, setMouthwashData] = useState([]);

  // Master Catalog & SKU Ranges (Loads local edits or Google Sheet, falls back to outlet survey_2.xlsx)
  const [surveyCatalog, setSurveyCatalog] = useState(() => {
    try {
      const saved = localStorage.getItem('colgate_custom_catalog_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved catalog', e);
    }
    return DEFAULT_SURVEY_CATALOG;
  });
  const [skuSizeRanges, setSkuSizeRanges] = useState(() => {
    try {
      const saved = localStorage.getItem('colgate_custom_skus_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read saved SKU ranges', e);
    }
    return DEFAULT_SKU_SIZE_RANGES;
  });
  const [catalogSource, setCatalogSource] = useState(() => {
    if (GOOGLE_SCRIPT_URL) return 'Syncing Google Sheet...';
    try {
      if (localStorage.getItem('colgate_custom_catalog_v1')) return 'Admin Custom (Saved)';
    } catch {}
    return 'Excel Built-in';
  });
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  const persistCatalogLocally = (nextCatalog, nextSkus) => {
    try {
      localStorage.setItem('colgate_custom_catalog_v1', JSON.stringify(nextCatalog));
      localStorage.setItem('colgate_custom_skus_v1', JSON.stringify(nextSkus));
    } catch (e) {
      console.warn('Could not save catalog locally', e);
    }
  };

  const handleSaveCatalog = async (nextCatalog, nextSkus, options = { notify: false }) => {
    setSurveyCatalog(nextCatalog);
    setSkuSizeRanges(nextSkus);
    persistCatalogLocally(nextCatalog, nextSkus);

    if (!GOOGLE_SCRIPT_URL) {
      setCatalogSource('Admin Custom (Saved)');
      if (options.notify) {
        showModal(
          'Catalog Updated',
          'Your updated companies, brands, and SKU ranges are saved and active in the intern survey sections.',
          'success'
        );
      }
      return;
    }

    setIsSavingCatalog(true);
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_catalog',
          catalog: nextCatalog,
          skuRanges: nextSkus
        })
      });
      setCatalogSource('Google Sheet (Published)');
      if (options.notify) {
        showModal(
          'Published to Google Sheet',
          'Your updated companies, brands, and SKU ranges have been saved to Google Sheets and will appear for all interns.',
          'success'
        );
      }
    } catch (err) {
      console.error('Catalog save error:', err);
      setCatalogSource('Saved Locally (Sync Pending)');
      if (options.notify) {
        showModal(
          'Saved Locally',
          'Changes were saved on this device, but could not reach Google Sheets right now. Tap Publish again when online.',
          'warning'
        );
      }
    } finally {
      setIsSavingCatalog(false);
    }
  };

  const handleResetCatalog = async () => {
    try {
      localStorage.removeItem('colgate_custom_catalog_v1');
      localStorage.removeItem('colgate_custom_skus_v1');
    } catch {}
    await handleSaveCatalog(DEFAULT_SURVEY_CATALOG, DEFAULT_SKU_SIZE_RANGES, { notify: true });
    if (!GOOGLE_SCRIPT_URL) {
      setCatalogSource('Excel Built-in');
    }
  };

  const fetchCatalogFromSheet = () => {
    if (!GOOGLE_SCRIPT_URL) return;
    fetch(`${GOOGLE_SCRIPT_URL}?type=catalog`)
      .then((res) => res.json())
      .then((json) => {
        if (json.hasSheetCatalog && json.catalog) {
          const syncedCatalog = {
            toothpaste: json.catalog.toothpaste || {},
            toothbrush: json.catalog.toothbrush || {},
            mouthwash: json.catalog.mouthwash || {}
          };
          setSurveyCatalog(syncedCatalog);
          try {
            localStorage.setItem('colgate_custom_catalog_v1', JSON.stringify(syncedCatalog));
          } catch {}
          setCatalogSource(
            json.catalogSheetName
              ? `Google Sheet (${json.catalogSheetName})`
              : 'Google Sheet Synced'
          );
        } else if (json.catalog) {
          const hasAny =
            Object.keys(json.catalog.toothpaste || {}).length > 0 ||
            Object.keys(json.catalog.toothbrush || {}).length > 0 ||
            Object.keys(json.catalog.mouthwash || {}).length > 0;
          if (hasAny) {
            const syncedCatalog = {
              toothpaste: json.catalog.toothpaste || {},
              toothbrush: json.catalog.toothbrush || {},
              mouthwash: json.catalog.mouthwash || {}
            };
            setSurveyCatalog(syncedCatalog);
            setCatalogSource('Google Sheet Synced');
          }
        }
        if (Array.isArray(json.skuRanges) && json.skuRanges.length > 0) {
          setSkuSizeRanges(json.skuRanges);
          try {
            localStorage.setItem('colgate_custom_skus_v1', JSON.stringify(json.skuRanges));
          } catch {}
        }
      })
      .catch(() => {
        setCatalogSource('Excel Built-in (Offline Fallback)');
      });
  };

  useEffect(() => {
    fetchCatalogFromSheet();
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.userType === 'admin' || !GOOGLE_SCRIPT_URL) return;

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

  const handleSaveOutlet = () => {
    if (!outletData.photoDataUrl) {
      showModal(
        'Photo Required',
        'You cannot unlock the product sections without taking a photo of the outlet signboard first. Please turn ON your location and capture the live photo.',
        'error'
      );
      return;
    }
    if (!outletData.lat || !outletData.lng) {
      showModal(
        'Location Required',
        'GPS coordinates are required. Please turn ON your device Location (GPS) and detect your location before continuing.',
        'error'
      );
      return;
    }
    if (!outletData.name.trim()) {
      showModal('Outlet Name Required', 'Please enter or verify the Outlet Name before continuing.', 'error');
      return;
    }
    if (!outletData.address.trim()) {
      showModal(
        'Outlet Address Required',
        'Please write the Outlet Address before unlocking the product survey sections.',
        'error'
      );
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
      ].some((p) => p.company === 'Colgate' || p.company === 'Colgate-Palmolive');

      const newCoveredRecord = {
        outletId: `OUT-${Date.now()}`,
        internId: currentUser.username,
        outletName: outletData.name.trim(),
        outletType: outletData.type,
        mobile: outletData.mobile.trim(),
        address: outletData.address.trim(),
        locationName: outletData.locationName || '',
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
        locationName: '',
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
  // VIEW B: ADMIN PANEL
  // ==========================================================================
  if (currentUser.userType === 'admin') {
    return (
      <>
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          localOutlets={coveredOutlets}
          catalog={surveyCatalog}
          skuRanges={skuSizeRanges}
          catalogSource={catalogSource}
          isSavingCatalog={isSavingCatalog}
          onRefreshCatalog={fetchCatalogFromSheet}
          onSaveCatalog={handleSaveCatalog}
          onResetCatalog={handleResetCatalog}
        />
        <Modal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal({ ...modal, isOpen: false })}
        />
      </>
    );
  }

  // ==========================================================================
  // VIEW C: INTERN SURVEY APP
  // ==========================================================================
  const userCoveredOutlets = coveredOutlets.filter((item) =>
    sameId(item.internId, currentUser.username)
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans pb-20">
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
  catalogSource,
  isSavingCatalog,
  onRefreshCatalog,
  onSaveCatalog,
  onResetCatalog
}) => {
  const [remoteOutlets, setRemoteOutlets] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString(0));
  const [outletInternFilter, setOutletInternFilter] = useState('ALL');
  const [selectedIntern, setSelectedIntern] = useState('');
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

  const mergedUsersMap = new Map();
  if (!GOOGLE_SCRIPT_URL) {
    FALLBACK_USERS.forEach((u) => mergedUsersMap.set(u.username.toLowerCase(), u));
  }
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
        fullName: `Field User (${id})`,
        userType: 'intern',
        password: ''
      });
    }
  });

  const usersList = Array.from(mergedUsersMap.values());
  const internAccounts = usersList.filter(
    (u) => (u.userType || '').trim().toLowerCase() !== 'admin'
  );

  const internKeyString = internAccounts.map((u) => u.username).join('|');
  useEffect(() => {
    if (
      internAccounts.length > 0 &&
      (!selectedIntern || !internAccounts.some((u) => sameId(u.username, selectedIntern)))
    ) {
      setSelectedIntern(internAccounts[0].username);
    }
  }, [internKeyString, selectedIntern]);

  const activeRouteIntern =
    selectedIntern && internAccounts.some((u) => sameId(u.username, selectedIntern))
      ? selectedIntern
      : internAccounts[0]?.username || '';

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
        {adminTab === 'dashboard' && (
          <>
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
                        {o.locationName && (
                          <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{o.locationName}</span>
                          </p>
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

        {adminTab === 'routes' && (
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="adminInternSelect" className="block text-xs font-bold uppercase text-gray-700">
                  Select Intern to Track ({internAccounts.length} Interns)
                </label>
                {GOOGLE_SCRIPT_URL && (
                  <button
                    type="button"
                    onClick={fetchAdminData}
                    className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Refresh List
                  </button>
                )}
              </div>
              {internAccounts.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 font-medium">
                  No intern accounts loaded yet. Check your <strong>Users</strong> tab in Google Sheets and tap Refresh.
                </p>
              ) : (
                <select
                  id="adminInternSelect"
                  value={activeRouteIntern}
                  onChange={(e) => setSelectedIntern(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50 focus:ring-2 focus:ring-red-500"
                >
                  {internAccounts.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.username} — {u.fullName}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-gray-500">
                Choose an intern above and select a date below to inspect their route line, area circle, and distance covered.
              </p>
            </div>

            {activeRouteIntern && (
              <MapSection internId={activeRouteIntern} localRecords={allOutlets} />
            )}
          </div>
        )}

        {adminTab === 'users' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" /> Users Sheet ({usersList.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Manage usernames, roles (<code>admin</code> / <code>intern</code>), and passwords directly in your Google Sheet's <strong>Users</strong> tab.
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {usersList.map((u) => (
                <div key={u.username} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-gray-900">{u.username}</div>
                    <div className="text-[11px] text-gray-500">{u.fullName}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                      (u.userType || '').toLowerCase() === 'admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {u.userType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MASTER CATALOG & SKU RANGES */}
        {adminTab === 'catalog' && (
          <AdminCatalogManager
            catalog={catalog}
            skuRanges={skuRanges}
            catalogSource={catalogSource}
            isSavingCatalog={isSavingCatalog}
            onRefreshCatalog={onRefreshCatalog}
            onSaveCatalog={onSaveCatalog}
            onResetCatalog={onResetCatalog}
          />
        )}
      </main>

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
              <span className="text-[10px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// ============================================================================
// 6B. ADMIN CATALOG MANAGER (Add, Edit, Update & Delete Companies, Brands & SKUs)
// ============================================================================
const AdminCatalogManager = ({
  catalog,
  skuRanges,
  catalogSource,
  isSavingCatalog,
  onRefreshCatalog,
  onSaveCatalog,
  onResetCatalog
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState({ text: '', type: 'info' });
  const [confirmReset, setConfirmReset] = useState(false);

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyBrands, setNewCompanyBrands] = useState('');

  const [editingCompany, setEditingCompany] = useState(null);
  const [editingCompanyDraft, setEditingCompanyDraft] = useState('');
  const [confirmDeleteCompany, setConfirmDeleteCompany] = useState(null);

  const [brandDrafts, setBrandDrafts] = useState({});
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingBrandDraft, setEditingBrandDraft] = useState('');

  const [newSkuInput, setNewSkuInput] = useState('');
  const [editingSku, setEditingSku] = useState(null);
  const [editingSkuDraft, setEditingSkuDraft] = useState('');

  const showNotice = (text, type = 'success') => {
    setFeedbackBanner({ text, type });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev.text === text ? { text: '', type: 'info' } : prev));
    }, 3500);
  };

  const unifiedCompanies = (() => {
    const merged = {};
    ['toothpaste', 'toothbrush', 'mouthwash'].forEach((cat) => {
      const catMap = (catalog && catalog[cat]) || {};
      Object.entries(catMap).forEach(([comp, brands]) => {
        if (!merged[comp]) merged[comp] = [];
        (brands || []).forEach((b) => {
          if (!merged[comp].includes(b)) merged[comp].push(b);
        });
      });
    });
    return merged;
  })();

  const buildNextCatalog = (nextUnifiedMap) => ({
    toothpaste: nextUnifiedMap,
    toothbrush: nextUnifiedMap,
    mouthwash: nextUnifiedMap
  });

  const handleAddSku = (e) => {
    e.preventDefault();
    const clean = newSkuInput.trim();
    if (!clean) return;
    if (skuRanges.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      showNotice(`"${clean}" is already in the SKU list.`, 'error');
      return;
    }
    const updatedSkus = [...skuRanges, clean];
    setNewSkuInput('');
    onSaveCatalog(buildNextCatalog(unifiedCompanies), updatedSkus);
    showNotice(`Added SKU range "${clean}".`);
  };

  const handleSaveEditedSku = (oldSku) => {
    const clean = editingSkuDraft.trim();
    if (!clean) return;
    if (
      clean.toLowerCase() !== oldSku.toLowerCase() &&
      skuRanges.some((s) => s.toLowerCase() === clean.toLowerCase())
    ) {
      showNotice(`"${clean}" already exists.`, 'error');
      return;
    }
    const updatedSkus = skuRanges.map((s) => (s === oldSku ? clean : s));
    setEditingSku(null);
    setEditingSkuDraft('');
    onSaveCatalog(buildNextCatalog(unifiedCompanies), updatedSkus);
    showNotice(`Updated SKU range to "${clean}".`);
  };

  const handleDeleteSku = (targetSku) => {
    const updatedSkus = skuRanges.filter((s) => s !== targetSku);
    onSaveCatalog(buildNextCatalog(unifiedCompanies), updatedSkus);
    showNotice(`Removed SKU range "${targetSku}".`);
  };

  const handleAddCompany = (e) => {
    e.preventDefault();
    const cleanComp = newCompanyName.trim();
    if (!cleanComp) {
      showNotice('Please enter a company name.', 'error');
      return;
    }
    if (Object.keys(unifiedCompanies).some((c) => c.toLowerCase() === cleanComp.toLowerCase())) {
      showNotice(`Company "${cleanComp}" already exists in the catalog.`, 'error');
      return;
    }
    const parsedBrands = newCompanyBrands
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    const nextMap = {
      [cleanComp]: Array.from(new Set(parsedBrands)),
      ...unifiedCompanies
    };
    setNewCompanyName('');
    setNewCompanyBrands('');
    onSaveCatalog(buildNextCatalog(nextMap), skuRanges);
    showNotice(`Added company "${cleanComp}".`);
  };

  const handleSaveEditedCompany = (oldName) => {
    const cleanNew = editingCompanyDraft.trim();
    if (!cleanNew) return;
    if (
      cleanNew.toLowerCase() !== oldName.toLowerCase() &&
      Object.keys(unifiedCompanies).some((c) => c.toLowerCase() === cleanNew.toLowerCase())
    ) {
      showNotice(`Company "${cleanNew}" already exists.`, 'error');
      return;
    }
    const nextMap = {};
    Object.entries(unifiedCompanies).forEach(([k, v]) => {
      nextMap[k === oldName ? cleanNew : k] = v;
    });
    setEditingCompany(null);
    setEditingCompanyDraft('');
    onSaveCatalog(buildNextCatalog(nextMap), skuRanges);
    showNotice(`Renamed company to "${cleanNew}".`);
  };

  const handleDeleteCompany = (compName) => {
    const nextMap = { ...unifiedCompanies };
    delete nextMap[compName];
    setConfirmDeleteCompany(null);
    onSaveCatalog(buildNextCatalog(nextMap), skuRanges);
    showNotice(`Deleted company "${compName}".`);
  };

  const handleAddBrandToCompany = (compName) => {
    const draft = (brandDrafts[compName] || '').trim();
    if (!draft) return;
    const existing = unifiedCompanies[compName] || [];
    if (existing.some((b) => b.toLowerCase() === draft.toLowerCase())) {
      showNotice(`Brand "${draft}" already exists under ${compName}.`, 'error');
      return;
    }
    const nextMap = {
      ...unifiedCompanies,
      [compName]: [...existing, draft]
    };
    setBrandDrafts((prev) => ({ ...prev, [compName]: '' }));
    onSaveCatalog(buildNextCatalog(nextMap), skuRanges);
    showNotice(`Added brand "${draft}" to ${compName}.`);
  };

  const handleSaveEditedBrand = (compName, oldBrand) => {
    const cleanBrand = editingBrandDraft.trim();
    if (!cleanBrand) return;
    const existing = unifiedCompanies[compName] || [];
    if (
      cleanBrand.toLowerCase() !== oldBrand.toLowerCase() &&
      existing.some((b) => b.toLowerCase() === cleanBrand.toLowerCase())
    ) {
      showNotice(`Brand "${cleanBrand}" already exists under ${compName}.`, 'error');
      return;
    }
    const nextMap = {
      ...unifiedCompanies,
      [compName]: existing.map((b) => (b === oldBrand ? cleanBrand : b))
    };
    setEditingBrand(null);
    setEditingBrandDraft('');
    onSaveCatalog(buildNextCatalog(nextMap), skuRanges);
    showNotice(`Updated brand to "${cleanBrand}".`);
  };

  const handleDeleteBrand = (compName, targetBrand) => {
    const existing = unifiedCompanies[compName] || [];
    const nextMap = {
      ...unifiedCompanies,
      [compName]: existing.filter((b) => b !== targetBrand)
    };
    onSaveCatalog(buildNextCatalog(nextMap), skuRanges);
    showNotice(`Removed brand "${targetBrand}".`);
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredCompanies = Object.entries(unifiedCompanies).filter(([comp, brands]) => {
    if (!normalizedSearch) return true;
    return (
      comp.toLowerCase().includes(normalizedSearch) ||
      brands.some((b) => b.toLowerCase().includes(normalizedSearch))
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-600" /> Manage Companies, Brands & SKUs
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Changes made here automatically update the intern survey dropdowns.
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {isSavingCatalog ? 'Publishing...' : catalogSource}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isSavingCatalog}
            onClick={() =>
              onSaveCatalog(buildNextCatalog(unifiedCompanies), skuRanges, { notify: true })
            }
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {isSavingCatalog ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>{GOOGLE_SCRIPT_URL ? 'Publish to Google Sheet' : 'Save Catalog Changes'}</span>
          </button>

          {GOOGLE_SCRIPT_URL && onRefreshCatalog && (
            <button
              type="button"
              onClick={onRefreshCatalog}
              className="text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Pull from Sheet</span>
            </button>
          )}

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-bold text-gray-500 hover:text-red-600 px-2.5 py-2 rounded-xl flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Excel Defaults</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 ml-auto bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
              <span className="text-[11px] font-bold text-amber-900">Restore original list?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onResetCatalog();
                }}
                className="text-[11px] font-black text-red-600 hover:underline px-1"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-[11px] font-bold text-gray-600 hover:underline px-1"
              >
                No
              </button>
            </div>
          )}
        </div>

        {feedbackBanner.text && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              feedbackBanner.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
            Toothpaste SKU Size Ranges ({skuRanges.length})
          </h3>
        </div>

        <form onSubmit={handleAddSku} className="flex gap-2">
          <input
            type="text"
            value={newSkuInput}
            onChange={(e) => setNewSkuInput(e.target.value)}
            placeholder="Add new SKU range (e.g. 250 gm - 275 gm)"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-gray-50 focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add SKU
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {skuRanges.map((r) =>
            editingSku === r ? (
              <div
                key={r}
                className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-xl px-2 py-1"
              >
                <input
                  type="text"
                  value={editingSkuDraft}
                  onChange={(e) => setEditingSkuDraft(e.target.value)}
                  className="bg-white border border-red-300 rounded-lg px-2 py-0.5 text-xs font-bold text-gray-900 w-32"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEditedSku(r)}
                  className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                  title="Save SKU"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSku(null)}
                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                key={r}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold"
              >
                <span>{r}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSku(r);
                    setEditingSkuDraft(r);
                  }}
                  className="text-red-500 hover:text-red-800 p-0.5"
                  title="Edit SKU"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSku(r)}
                  className="text-red-400 hover:text-red-700 p-0.5"
                  title="Delete SKU"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <form
        onSubmit={handleAddCompany}
        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3"
      >
        <h3 className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add New Company & Brands
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            placeholder="Company Name (e.g. Bashundhara)"
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold bg-gray-50 focus:ring-2 focus:ring-red-500"
          />
          <input
            type="text"
            value={newCompanyBrands}
            onChange={(e) => setNewCompanyBrands(e.target.value)}
            placeholder="Brands (comma-separated, e.g. Brand 1, Brand 2)"
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-xs font-semibold bg-gray-50 focus:ring-2 focus:ring-red-500"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Company to Catalog
        </button>
      </form>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-800">
            All Companies & Brands ({filteredCompanies.length} of {Object.keys(unifiedCompanies).length})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company or brand..."
              className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold bg-gray-50 focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredCompanies.map(([comp, brands]) => {
            const isEditingThisComp = editingCompany === comp;
            const isConfirmingDelete = confirmDeleteCompany === comp;

            return (
              <div
                key={comp}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  {isEditingThisComp ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editingCompanyDraft}
                        onChange={(e) => setEditingCompanyDraft(e.target.value)}
                        className="flex-1 bg-white border border-red-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditedCompany(comp)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCompany(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-black text-gray-900 truncate">{comp}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 shrink-0">
                          {brands.length} {brands.length === 1 ? 'brand' : 'brands'}
                        </span>
                      </div>

                      {!isConfirmingDelete ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCompany(comp);
                              setEditingCompanyDraft(comp);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-white transition-colors"
                            title="Rename Company"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCompany(comp)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                            title="Delete Company"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-xl shrink-0">
                          <span className="text-[11px] font-bold text-red-800">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompany(comp)}
                            className="text-[11px] font-black text-red-600 hover:underline px-1"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteCompany(null)}
                            className="text-[11px] font-bold text-gray-600 hover:underline px-1"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {brands.length === 0 ? (
                    <span className="text-[11px] text-gray-400 italic">No brands added yet</span>
                  ) : (
                    brands.map((bName) => {
                      const isEditingThisBrand =
                        editingBrand &&
                        editingBrand.company === comp &&
                        editingBrand.oldBrand === bName;

                      return isEditingThisBrand ? (
                        <div
                          key={bName}
                          className="flex items-center gap-1 bg-white border border-red-300 rounded-lg px-2 py-1"
                        >
                          <input
                            type="text"
                            value={editingBrandDraft}
                            onChange={(e) => setEditingBrandDraft(e.target.value)}
                            className="border border-gray-200 rounded px-2 py-0.5 text-xs font-semibold w-32"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedBrand(comp, bName)}
                            className="p-0.5 text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Save Brand"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBrand(null)}
                            className="p-0.5 text-gray-500 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          key={bName}
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-800 shadow-2xs"
                        >
                          <span>{bName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBrand({ company: comp, oldBrand: bName });
                              setEditingBrandDraft(bName);
                            }}
                            className="text-gray-400 hover:text-red-600"
                            title="Edit Brand"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(comp, bName)}
                            className="text-gray-400 hover:text-red-600"
                            title="Remove Brand"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={brandDrafts[comp] || ''}
                    onChange={(e) =>
                      setBrandDrafts((prev) => ({ ...prev, [comp]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBrandToCompany(comp);
                      }
                    }}
                    placeholder={`+ Add new brand to ${comp}...`}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddBrandToCompany(comp)}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3 h-3" /> Add Brand
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. OUTLET INFORMATION SECTION (Strict GPS-ON Photo Gate + Location Name + Required Address)
// ============================================================================
const OutletSection = ({ data, setData, onSave, isSaved, showModal }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [isOpeningCamera, setIsOpeningCamera] = useState(false);
  const [isCheckingGps, setIsCheckingGps] = useState(false);
  const [isResolvingPlace, setIsResolvingPlace] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(() => (data.lat && data.lng ? 'active' : 'idle'));
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');
  const [isRunningOcr, setIsRunningOcr] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCameraStream();
  }, []);

  const acquireLiveGps = ({ silent = false } = {}) => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const msg = 'Location (GPS) is not supported on this device/browser.';
        setGpsStatus('off');
        setGpsErrorMsg(msg);
        if (!silent) {
          showModal('Location Required', msg, 'error');
        }
        resolve(null);
        return;
      }

      setIsCheckingGps(true);
      setGpsErrorMsg('');

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          const nowTimestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          setGpsStatus('active');
          setIsCheckingGps(false);

          setData((prev) => ({
            ...prev,
            lat,
            lng,
            timestamp: prev.timestamp || nowTimestamp
          }));

          setIsResolvingPlace(true);
          const placeName = await fetchLocationNameFromCoords(lat, lng);
          setIsResolvingPlace(false);

          if (placeName) {
            setData((prev) => ({
              ...prev,
              locationName: placeName
            }));
          }

          resolve({ lat, lng, locationName: placeName, timestamp: nowTimestamp });
        },
        (err) => {
          setIsCheckingGps(false);
          setGpsStatus('off');

          let reason =
            'Your device Location (GPS) appears to be OFF or permission was denied. Please turn ON Location and allow access to take a signboard photo.';
          if (err && err.code === 1) {
            reason =
              'Location access was denied. Please allow Location permission in your browser settings and turn ON GPS to take a photo.';
          } else if (err && err.code === 2) {
            reason =
              'Location is currently OFF or unavailable. Please turn ON your phone GPS / Location services first.';
          } else if (err && err.code === 3) {
            reason =
              'GPS signal timed out. Please make sure Location is ON and step near an open area, then try again.';
          }

          setGpsErrorMsg(reason);
          if (!silent) {
            showModal('Turn ON Location to Take Photo', reason, 'error');
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  };

  useEffect(() => {
    if (!data.lat || !data.lng) {
      acquireLiveGps({ silent: true });
    } else if (!data.locationName) {
      setIsResolvingPlace(true);
      fetchLocationNameFromCoords(data.lat, data.lng).then((placeName) => {
        setIsResolvingPlace(false);
        if (placeName) {
          setData((prev) => ({ ...prev, locationName: placeName }));
        }
      });
    }
  }, []);

  const handleStartLiveCamera = async () => {
    setIsOpeningCamera(true);
    try {
      const gpsResult = await acquireLiveGps({ silent: false });
      if (!gpsResult) {
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showModal(
          'Camera Unavailable',
          'Live camera access requires HTTPS and a compatible mobile browser. Please open the app over HTTPS (Netlify) in Chrome/Safari.',
          'error'
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        audio: false
      });

      streamRef.current = stream;
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch (err) {
      console.error('Camera start error:', err);
      showModal(
        'Camera Permission Required',
        'Could not open the live rear camera. Please allow camera permission and try again (gallery uploads are disabled).',
        'error'
      );
    } finally {
      setIsOpeningCamera(false);
    }
  };

  const runSignboardOcr = async (base64DataUrl) => {
    if (!GEMINI_API_KEY) return;
    setIsRunningOcr(true);
    try {
      const base64Body = base64DataUrl.split(',')[1];
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Extract shop signboard details as strict JSON with keys: outletName, mobile, address. Leave empty string if unreadable.'
                  },
                  { inlineData: { mimeType: 'image/jpeg', data: base64Body } }
                ]
              }
            ]
          })
        }
      );
      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        setData((prev) => ({
          ...prev,
          name: prev.name || parsed.outletName || '',
          mobile: prev.mobile || parsed.mobile || '',
          address: prev.address || parsed.address || ''
        }));
      }
    } catch {
      // Manual entry remains available
    } finally {
      setIsRunningOcr(false);
    }
  };

  const handleCaptureFrame = () => {
    if (!data.lat || !data.lng) {
      stopCameraStream();
      showModal(
        'Location Required',
        'GPS location must be active to capture the outlet signboard photo. Please turn ON Location first.',
        'error'
      );
      return;
    }

    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const compressedUrl = canvas.toDataURL('image/jpeg', 0.65);
    const capturedTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    stopCameraStream();

    setData((prev) => ({
      ...prev,
      photoDataUrl: compressedUrl,
      timestamp: capturedTime
    }));

    runSignboardOcr(compressedUrl);
  };

  const hasValidGps = Boolean(data.lat && data.lng);

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-red-600" /> 1. Live Signboard Photo
              <span className="text-red-600">*</span>
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Live camera capture only (no gallery uploads). Location (GPS) must be ON.
            </p>
          </div>
          {data.photoDataUrl && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Photo Captured
            </span>
          )}
        </div>

        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            hasValidGps
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : gpsStatus === 'off'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isCheckingGps ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : hasValidGps ? (
              <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-bold leading-snug">
              {isCheckingGps
                ? 'Checking device GPS location...'
                : hasValidGps
                ? `Location ON${data.locationName ? ` • ${data.locationName}` : ' • GPS Ready for Photo'}`
                : 'Location is OFF — Turn ON GPS to unlock the camera'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => acquireLiveGps({ silent: false })}
            disabled={isCheckingGps}
            className="text-[11px] font-extrabold bg-white px-2.5 py-1 rounded-lg border border-current/20 shadow-2xs shrink-0 hover:opacity-90"
          >
            {hasValidGps ? 'Refresh GPS' : 'Check GPS'}
          </button>
        </div>

        {gpsErrorMsg && !hasValidGps && (
          <p className="text-[11px] font-semibold text-red-600 px-1">{gpsErrorMsg}</p>
        )}

        {cameraActive ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border-2 border-red-500">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  GPS ON {data.locationName ? `• ${data.locationName}` : `(${data.lat}, ${data.lng})`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={stopCameraStream}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                type="button"
                onClick={handleCaptureFrame}
                className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" /> Capture Photo
              </button>
            </div>
          </div>
        ) : data.photoDataUrl ? (
          <div className="space-y-2.5">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-100">
              <img
                src={data.photoDataUrl}
                alt="Captured Outlet Signboard"
                className="w-full max-h-60 object-cover"
              />
              {isRunningOcr && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Reading signboard text...
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartLiveCamera}
              disabled={isOpeningCamera || isCheckingGps}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Camera className="w-4 h-4" /> Retake Live Signboard Photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartLiveCamera}
            disabled={isOpeningCamera || isCheckingGps}
            className={`w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.99] ${
              hasValidGps
                ? 'border-red-300 bg-red-50/40 hover:bg-red-50 text-red-700'
                : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-red-300'
            }`}
          >
            {isOpeningCamera || isCheckingGps ? (
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            ) : (
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                  hasValidGps ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                <Camera className="w-6 h-6" />
              </div>
            )}
            <span className="text-sm font-black">
              {isOpeningCamera
                ? 'Verifying GPS & Opening Camera...'
                : hasValidGps
                ? 'Take Live Signboard Photo'
                : 'Turn ON Location to Take Photo'}
            </span>
            <span className="text-[11px] text-gray-500 text-center">
              {hasValidGps
                ? 'Tap to open rear camera and capture outlet signboard'
                : 'Camera is locked while Location (GPS) is OFF'}
            </span>
          </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-red-600" /> 2. GPS & Timestamp Data
          </h2>
          <button
            type="button"
            onClick={() => acquireLiveGps({ silent: false })}
            disabled={isCheckingGps}
            className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 flex items-center gap-1"
          >
            {isCheckingGps ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <MapPin className="w-3 h-3" />
            )}
            <span>Detect GPS Now</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-red-50/70 border border-red-100">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-red-800 mb-1">
            Location Name (Auto-Detected from GPS)
          </label>
          <div className="flex items-center gap-2">
            {isResolvingPlace ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-600 shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <input
              type="text"
              readOnly
              value={
                isResolvingPlace
                  ? 'Detecting location name...'
                  : data.locationName ||
                    (hasValidGps ? 'Location name unavailable (GPS recorded)' : 'Turn ON GPS to detect area, city')
              }
              className="w-full bg-transparent text-xs font-extrabold text-gray-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Latitude
            </label>
            <input
              type="text"
              readOnly
              value={data.lat || ''}
              placeholder="Auto-detected"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-50 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Longitude
            </label>
            <input
              type="text"
              readOnly
              value={data.lng || ''}
              placeholder="Auto-detected"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold bg-slate-50 text-gray-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-red-500" /> Photo / Survey Timestamp
          </label>
          <input
            type="text"
            readOnly
            value={data.timestamp || ''}
            placeholder="Auto-recorded on GPS & photo capture"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-slate-50 text-gray-800"
          />
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3.5">
        <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-red-600" /> 3. Outlet Details
        </h2>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Outlet Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="e.g. Rahim General Store"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Outlet Type <span className="text-red-600">*</span>
          </label>
          <select
            value={data.type}
            onChange={(e) => setData({ ...data, type: e.target.value })}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
          >
            <option value="">-- Select Outlet Type --</option>
            {OUTLET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Outlet Address <span className="text-red-600">*</span>
          </label>
          <textarea
            rows={2}
            value={data.address}
            onChange={(e) => setData({ ...data, address: e.target.value })}
            placeholder="Write full shop address (House, Road, Block, Market)..."
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Owner / Shop Mobile Number (Optional)
          </label>
          <input
            type="tel"
            value={data.mobile}
            onChange={(e) => setData({ ...data, mobile: e.target.value })}
            placeholder="e.g. 017XXXXXXXX"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-medium bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
          />
        </div>

        <button
          type="button"
          onClick={onSave}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${
            isSaved
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
              : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-red-600/30'
          }`}
        >
          {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
          <span>{isSaved ? 'Outlet Saved — Update Details' : 'Save Outlet & Unlock Product Pages'}</span>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 8. PRODUCT VISIBILITY SECTION (Toothpaste, Toothbrush & Mouthwash)
// ============================================================================
const ProductSection = ({ category, title, data, setData, hasSKU, hasQty, catalog, skuRanges }) => {
  const categoryMap = (catalog && catalog[category]) || {};
  const companyNames = Object.keys(categoryMap);

  const addCompanySection = () => {
    setData((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        company: '',
        customCompany: '',
        customBrandDraft: '',
        brands: [],
        skus: [],
        totalQty: ''
      }
    ]);
  };

  const updateEntry = (id, patch) => {
    setData((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeEntry = (id) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItemInArray = (arr, value) =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleAddManualBrand = (entry) => {
    const clean = (entry.customBrandDraft || '').trim();
    if (!clean) return;
    if (entry.brands.includes(clean)) {
      updateEntry(entry.id, { customBrandDraft: '' });
      return;
    }
    updateEntry(entry.id, {
      brands: [...entry.brands, clean],
      customBrandDraft: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-gray-900">{title} Visibility</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Add each company available in this outlet{hasSKU ? ', select brands, SKU ranges & total stock' : ' and select visible brands'}.
          </p>
        </div>
        <button
          type="button"
          onClick={addCompanySection}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {data.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-xs font-semibold text-gray-500">
            No {title.toLowerCase()} companies added for this outlet yet.
          </p>
          <button
            type="button"
            onClick={addCompanySection}
            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Add First {title} Company
          </button>
        </div>
      ) : (
        data.map((entry, idx) => {
          const isOther = entry.company === '__OTHER__';
          const availableBrands = !isOther && entry.company ? categoryMap[entry.company] || [] : [];

          return (
            <div
              key={entry.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/80 space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-red-700">
                  {title} Company #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Company Name</label>
                <select
                  value={entry.company}
                  onChange={(e) =>
                    updateEntry(entry.id, {
                      company: e.target.value,
                      customCompany: '',
                      customBrandDraft: '',
                      brands: []
                    })
                  }
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select Company --</option>
                  {companyNames.map((comp) => (
                    <option key={comp} value={comp}>
                      {comp}
                    </option>
                  ))}
                  <option value="__OTHER__">Other (Write Company & Brand Manually)</option>
                </select>
              </div>

              {isOther && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Write Company Name
                  </label>
                  <input
                    type="text"
                    value={entry.customCompany || ''}
                    onChange={(e) => updateEntry(entry.id, { customCompany: e.target.value })}
                    placeholder="Enter company name..."
                    className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm font-semibold bg-red-50/40 focus:bg-white focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {entry.company && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    Select Brand(s) Available{' '}
                    <span className="text-[11px] font-medium text-gray-400">
                      ({entry.brands.length} selected)
                    </span>
                  </label>

                  {!isOther && availableBrands.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {availableBrands.map((brand) => {
                        const selected = entry.brands.includes(brand);
                        return (
                          <button
                            key={brand}
                            type="button"
                            onClick={() =>
                              updateEntry(entry.id, {
                                brands: toggleItemInArray(entry.brands, brand)
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                              selected
                                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5" />}
                            <span>{brand}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {entry.brands.filter((b) => !availableBrands.includes(b)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.brands
                        .filter((b) => !availableBrands.includes(b))
                        .map((customB) => (
                          <span
                            key={customB}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-600 text-white text-xs font-bold"
                          >
                            <span>{customB}</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateEntry(entry.id, {
                                  brands: entry.brands.filter((b) => b !== customB)
                                })
                              }
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={entry.customBrandDraft || ''}
                      onChange={(e) => updateEntry(entry.id, { customBrandDraft: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManualBrand(entry);
                        }
                      }}
                      placeholder={
                        isOther
                          ? 'Write brand name and tap Add...'
                          : 'Other brand not listed? Write here...'
                      }
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddManualBrand(entry)}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl shrink-0"
                    >
                      + Add Brand
                    </button>
                  </div>
                </div>
              )}

              {hasSKU && entry.company && (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Select SKU Size Range(s){' '}
                    <span className="text-[11px] font-medium text-gray-400">
                      ({entry.skus.length} selected)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(skuRanges || []).map((sku) => {
                      const selected = entry.skus.includes(sku);
                      return (
                        <button
                          key={sku}
                          type="button"
                          onClick={() =>
                            updateEntry(entry.id, {
                              skus: toggleItemInArray(entry.skus, sku)
                            })
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            selected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-slate-400'
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                          <span>{sku}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hasQty && entry.company && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Total Product Quantity for This Company (Pieces / Packs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={entry.totalQty}
                    onChange={(e) => updateEntry(entry.id, { totalQty: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

// ============================================================================
// 9. COVERED OUTLETS SECTION (Date Filtered Coverage History)
// ============================================================================
const CoveredOutletsSection = ({ internId, localRecords }) => {
  const [dateFilter, setDateFilter] = useState(getLocalDateString(0));
  const [remoteRecords, setRemoteRecords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCoverage = (targetDate) => {
    if (!GOOGLE_SCRIPT_URL) return;
    setIsLoading(true);
    const queryDate = targetDate ? `&date=${encodeURIComponent(targetDate)}` : '';
    fetch(`${GOOGLE_SCRIPT_URL}?type=coverage&internId=${encodeURIComponent(internId)}${queryDate}`)
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
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCoverage(dateFilter);
  }, [internId, dateFilter]);

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(-1);

  const baseList = (remoteRecords !== null ? remoteRecords : localRecords).map((r) => ({
    ...r,
    date: normalizeDateString(r.date)
  }));

  const filteredOutlets = dateFilter
    ? baseList.filter((item) => item.date === dateFilter)
    : baseList;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white p-5 rounded-2xl shadow-md shadow-red-600/20 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-100 block">
            {dateFilter ? `Outlets Covered on ${dateFilter}` : 'Total Outlets Covered (All Dates)'}
          </span>
          <span className="text-3xl font-black mt-1 block">{filteredOutlets.length}</span>
          <span className="text-[11px] text-red-100/90 mt-0.5 block">
            Intern: {internId} • Counted after submission
          </span>
        </div>
        {GOOGLE_SCRIPT_URL && (
          <button
            type="button"
            onClick={() => fetchCoverage(dateFilter)}
            disabled={isLoading}
            className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-all"
            title="Refresh from Google Sheet"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Filter by Date</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDateFilter(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              dateFilter === todayStr
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateFilter(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              dateFilter === yesterdayStr
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              dateFilter === ''
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-gray-50 text-gray-700 border-gray-200'
            }`}
          >
            All Dates
          </button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(normalizeDateString(e.target.value))}
            className="border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 bg-gray-50 ml-auto"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          <div className="bg-white p-8 rounded-2xl text-center text-xs font-bold text-gray-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-red-600" /> Syncing covered outlets...
          </div>
        ) : filteredOutlets.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center space-y-1">
            <p className="text-sm font-bold text-gray-700">No outlets covered on this date</p>
            <p className="text-xs text-gray-500">
              Outlets appear here immediately after tapping <strong>Submit Survey Data</strong>.
            </p>
          </div>
        ) : (
          filteredOutlets.map((item) => (
            <div
              key={item.outletId}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-gray-900">{item.outletName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                    {item.outletType}
                  </span>
                </div>
                {item.locationName && (
                  <p className="text-[11px] font-bold text-red-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{item.locationName}</span>
                  </p>
                )}
                {item.address && <p className="text-xs text-gray-600">{item.address}</p>}
                <p className="text-[11px] text-gray-400">
                  Submitted on <strong>{item.date}</strong> at {item.time}
                </p>
              </div>

              {item.photoUrl ? (
                <a
                  href={item.photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0"
                >
                  <span>Photo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shrink-0">
                  Submitted
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 10. DAILY ROUTE & COVERAGE CIRCLE MAP (100% Free OpenStreetMap + Leaflet)
// ============================================================================
const MapSection = ({ internId, localRecords }) => {
  const [routeDate, setRouteDate] = useState(getLocalDateString(0));
  const [routePoints, setRoutePoints] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [leafletReady, setLeafletReady] = useState(typeof window !== 'undefined' && Boolean(window.L));

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (window.L) {
      setLeafletReady(true);
      return;
    }

    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js-cdn')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js-cdn';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else {
      const checkTimer = setInterval(() => {
        if (window.L) {
          setLeafletReady(true);
          clearInterval(checkTimer);
        }
      }, 150);
      return () => clearInterval(checkTimer);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const getLocalPointsForDate = () => {
      const matching = (localRecords || []).filter(
        (r) =>
          sameId(r.internId, internId) &&
          (!routeDate || normalizeDateString(r.date) === routeDate) &&
          r.lat &&
          r.lng
      );
      return matching
        .map((r) => ({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lng),
          time: r.time || '',
          label: r.outletName || 'Outlet'
        }))
        .reverse();
    };

    const localDates = Array.from(
      new Set(
        (localRecords || [])
          .filter((r) => sameId(r.internId, internId) && r.lat && r.lng)
          .map((r) => normalizeDateString(r.date))
          .filter(Boolean)
      )
    )
      .sort()
      .reverse();

    if (!GOOGLE_SCRIPT_URL) {
      const pts = getLocalPointsForDate();
      setAvailableDates(localDates);
      setRoutePoints(pts.length > 0 ? pts : SAMPLE_PREVIEW_ROUTE);
      return;
    }

    setIsLoadingRoute(true);
    fetch(
      `${GOOGLE_SCRIPT_URL}?type=route&internId=${encodeURIComponent(internId)}&date=${encodeURIComponent(
        routeDate
      )}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const pts = Array.isArray(json.points)
          ? json.points
              .map((p) => ({
                lat: parseFloat(p.lat),
                lng: parseFloat(p.lng),
                time: p.time || '',
                label: p.label || ''
              }))
              .filter((p) => !isNaN(p.lat) && !isNaN(p.lng))
          : [];
        const remoteDates = Array.isArray(json.availableDates) ? json.availableDates : [];
        const mergedDates = Array.from(new Set([...remoteDates, ...localDates]))
          .sort()
          .reverse();
        setAvailableDates(mergedDates);
        setRoutePoints(pts.length > 0 ? pts : getLocalPointsForDate());
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableDates(localDates);
          setRoutePoints(getLocalPointsForDate());
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoute(false);
      });

    return () => {
      cancelled = true;
    };
  }, [internId, routeDate, localRecords]);

  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, { zoomControl: true }).setView([23.8103, 90.4125], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, [leafletReady]);

  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current || !layerGroupRef.current) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;

    group.clearLayers();
    if (!routePoints.length) return;

    const latLngs = routePoints.map((p) => [p.lat, p.lng]);

    if (latLngs.length >= 2) {
      L.polyline(latLngs, { color: '#CE1126', weight: 4, opacity: 0.9 }).addTo(group);
    }

    const centerLat = routePoints.reduce((s, p) => s + p.lat, 0) / routePoints.length;
    const centerLng = routePoints.reduce((s, p) => s + p.lng, 0) / routePoints.length;
    let maxDistMeters = 120;
    routePoints.forEach((p) => {
      const distM = haversineKm(centerLat, centerLng, p.lat, p.lng) * 1000;
      if (distM > maxDistMeters) maxDistMeters = distM;
    });

    L.circle([centerLat, centerLng], {
      radius: maxDistMeters + 80,
      color: '#CE1126',
      weight: 2,
      fillColor: '#CE1126',
      fillOpacity: 0.14
    }).addTo(group);

    routePoints.forEach((p, i) => {
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: i === 0 ? '#16a34a' : '#CE1126',
        fillOpacity: 1
      }).addTo(group);
      marker.bindPopup(
        `<strong>#${i + 1} ${p.label || 'GPS Stop'}</strong><br/>${p.time || ''}<br/>${p.lat.toFixed(
          5
        )}, ${p.lng.toFixed(5)}`
      );
    });

    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds.pad(0.25), { maxZoom: 16 });
  }, [leafletReady, routePoints]);

  const totalDistanceKm = computeTotalRouteKm(routePoints);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-red-600" /> Daily Route & Territory Circle
            </h2>
            <p className="text-[11px] text-gray-500">
              Tracking <strong>{internId}</strong> • Free OpenStreetMap (No API Key)
            </p>
          </div>
          <input
            type="date"
            value={routeDate}
            onChange={(e) => setRouteDate(normalizeDateString(e.target.value))}
            className="border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 bg-gray-50"
          />
        </div>

        {availableDates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-gray-500 mr-1">Dates with GPS:</span>
            {availableDates.slice(0, 7).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRouteDate(d)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  routeDate === d
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <span className="text-[10px] font-bold uppercase text-red-700 block">Distance Covered</span>
            <span className="text-xl font-black text-red-900">{totalDistanceKm.toFixed(2)} km</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-600 block">GPS Points Logged</span>
            <span className="text-xl font-black text-slate-900">{routePoints.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        {isLoadingRoute && (
          <div className="absolute inset-0 z-[400] bg-white/75 flex items-center justify-center text-xs font-bold text-red-700 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading GPS route...
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="w-full h-80 sm:h-96 rounded-xl z-0"
          style={{ minHeight: '320px' }}
        />
        {!isLoadingRoute && routePoints.length === 0 && (
          <p className="text-center text-xs font-semibold text-gray-500 py-3">
            No GPS route points logged for <strong>{internId}</strong> on <strong>{routeDate}</strong>.
          </p>
        )}
      </div>
    </div>
  );
};
