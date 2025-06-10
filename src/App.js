import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';

// --- Supabase Mock Configuration ---
// IMPORTANT: This is a MOCK implementation for demonstration purposes.
// For a real application, you would install @supabase/supabase-js via npm/yarn
// and use 'import { createClient } from "@supabase/supabase-js";'
// and replace 'YOUR_SUPABASE_URL' and 'YOUR_SUPABASE_ANON_KEY' with actual values.

const supabase = { // Directly define the mock supabase object
  auth: {
    signInWithPassword: async ({ email, password }) => {
      console.log('MOCK: signInWithPassword', email, password);
      // Simulate successful login for specific mock users
      if (email === 'customer@example.com' && password === 'password') {
        localStorage.setItem('mockUserSession', JSON.stringify({ id: 'uuid-mock-customer', email: 'customer@example.com' }));
        return { data: { user: { id: 'uuid-mock-customer', email: 'customer@example.com' } }, error: null };
      }
      if (email === 'admin@example.com' && password === 'password') {
        localStorage.setItem('mockUserSession', JSON.stringify({ id: 'uuid-mock-admin', email: 'admin@example.com' }));
        return { data: { user: { id: 'uuid-mock-admin', email: 'admin@example.com' } }, error: null };
      }
      if (email === 'delivery@example.com' && password === 'password') {
        localStorage.setItem('mockUserSession', JSON.stringify({ id: 'uuid-mock-delivery', email: 'delivery@example.com' }));
        return { data: { user: { id: 'uuid-mock-delivery', email: 'delivery@example.com' } }, error: null };
      }
      if (email === 'partner@example.com' && password === 'password') {
        localStorage.setItem('mockUserSession', JSON.stringify({ id: 'uuid-mock-partner', email: 'partner@example.com' }));
        return { data: { user: { id: 'uuid-mock-partner', email: 'partner@example.com' } }, error: null };
      }
      return { data: null, error: { message: 'Invalid mock credentials. Try customer@example.com/password.' } };
    },
    signUp: async ({ email, password, options }) => {
      console.log('MOCK: signUp', email, password, options.data);
      if (email === 'exists@example.com') {
        return { data: null, error: { message: 'Mock: Email already exists.' } };
      }
      // Simulate successful signup
      const newUser = { id: `uuid-mock-${Date.now()}`, email: email };
      localStorage.setItem('mockUserSession', JSON.stringify(newUser)); // Store mock session
      return { data: { user: newUser }, error: null };
    },
    signOut: async () => {
      console.log('MOCK: signOut');
      localStorage.removeItem('mockUserSession'); // Clear mock session
      return { error: null };
    },
    getSession: async () => {
      console.log('MOCK: getSession');
      const mockLoggedOutUser = localStorage.getItem('mockUserSession');
      if (mockLoggedOutUser) {
        const user = JSON.parse(mockLoggedOutUser);
        return { data: { session: { user: user } }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback) => {
      console.log('MOCK: onAuthStateChange - Not truly reactive, but simulates initial session check');
      const mockLoggedOutUser = localStorage.getItem('mockUserSession');
      if (mockLoggedOutUser) {
        const user = JSON.parse(mockLoggedOutUser);
        callback('SIGNED_IN', { user: user });
      } else {
        callback('SIGNED_OUT', null);
      }

      return { data: { subscription: { unsubscribe: () => console.log('MOCK: auth listener unsubscribed') } } };
    }
  },
  from: (tableName) => ({
    select: (columns) => ({
      eq: (column, value) => ({
        single: async () => {
          console.log(`MOCK: from('${tableName}').select('${columns}').eq('${column}', '${value}').single()`);
          // Simulate fetching user roles from 'profiles' table
          if (tableName === 'profiles' && column === 'id') {
            if (value === 'uuid-mock-customer') return { data: { role: 'customer' }, error: null };
            if (value === 'uuid-mock-admin') return { data: { role: 'admin' }, error: null };
            if (value === 'uuid-mock-delivery') return { data: { role: 'delivery_partner' }, error: null };
            if (value === 'uuid-mock-partner') return { data: { role: 'partner' }, error: null };
          }
          return { data: null, error: { message: 'Mock: Profile not found' } };
        }
      })
    }),
    insert: async (data) => {
      console.log(`MOCK: from('${tableName}').insert(${JSON.stringify(data)})`);
      return { data: data, error: null };
    }
  })
};

// --- Mock Data ---
const mockLabTests = [
  { id: 'lt-1', name: 'Complete Blood Count (CBC)', price: 350, description: 'Basic blood test for overall health.' },
  { id: 'lt-2', name: 'Blood Glucose (Fasting)', price: 200, description: 'Measures blood sugar levels after fasting.' },
  { id: 'lt-3', name: 'Lipid Profile', price: 800, description: 'Checks cholesterol and triglyceride levels.' },
  { id: 'lt-4', name: 'Thyroid Profile (T3, T4, TSH)', price: 1200, description: 'Evaluates thyroid gland function.' },
  { id: 'lt-5', name: 'Vitamin D (25-OH)', price: 1500, description: 'Measures Vitamin D levels.' },
  { id: 'lt-6', name: 'Urine Analysis', price: 250, description: 'Screens for various health conditions.' },
  { id: 'lt-7', name: 'Liver Function Test (LFT)', price: 900, description: 'Assesses liver health.' },
  { id: 'lt-8', name: 'Kidney Function Test (KFT)', price: 850, description: 'Evaluates kidney function.' },
];

const mockMedicines = [
  { id: 'med-1', name: 'Paracetamol 500mg', price: 10, stock: 500, description: 'Fever and pain relief.' },
  { id: 'med-2', name: 'Amoxicillin 250mg', price: 25, stock: 300, description: 'Antibiotic for bacterial infections.' },
  { id: 'med-3', name: 'Ibuprofen 400mg', price: 15, stock: 400, description: 'Anti-inflammatory for pain and swelling.' },
  { id: 'med-4', name: 'Antacid Gel', price: 50, stock: 200, description: 'Relieves heartburn and indigestion.' },
  { id: 'med-5', name: 'Multivitamin (A-Z)', price: 120, stock: 150, description: 'Daily essential vitamins and minerals.' },
  { id: 'med-6', name: 'Cough Syrup (Dry Cough)', price: 80, stock: 100, description: 'Soothes dry cough.' },
  { id: 'med-7', name: 'Cetirizine 10mg', price: 5, stock: 600, description: 'Antihistamine for allergies.' },
  { id: 'med-8', name: 'ORS Powder', price: 20, stock: 250, description: 'Oral rehydration solution.' },
  { id: 'med-9', name: 'Pain Relief Balm', price: 75, stock: 120, description: 'Topical relief for muscular pain.' },
  { id: 'med-10', name: 'Hand Sanitizer 100ml', price: 60, stock: 300, description: 'Kills germs instantly.' },
];

const mockGroceryItems = [
  { id: 'groc-1', name: 'Basmati Rice 1kg', price: 100, stock: 200, category: 'Grains' },
  { id: 'groc-2', name: 'Toor Dal 500g', price: 60, stock: 150, category: 'Pulses' },
  { id: 'groc-3', name: 'Wheat Flour 1kg', price: 50, stock: 180, category: 'Grains' },
  { id: 'groc-4', name: 'Sugar 1kg', price: 45, stock: 250, category: 'Staples' },
  { id: 'groc-5', name: 'Cooking Oil 1L (Sunflower)', price: 180, stock: 100, category: 'Oils' },
  { id: 'groc-6', name: 'Milk 1L (Full Cream)', price: 30, stock: 300, category: 'Dairy' },
  { id: 'groc-7', name: 'Eggs (12 pack)', price: 70, stock: 120, category: 'Dairy' },
  { id: 'groc-8', name: 'Fresh Bread (Brown)', price: 35, stock: 90, category: 'Bakery' },
  { id: 'groc-9', name: 'Apples 1kg', price: 150, stock: 80, category: 'Fruits' },
  { id: 'groc-10', name: 'Onions 1kg', price: 40, stock: 200, category: 'Vegetables' },
  { id: 'groc-11', name: 'Potatoes 1kg', price: 30, stock: 220, category: 'Vegetables' },
  { id: 'groc-12', name: 'Tomatoes 1kg', price: 50, stock: 190, category: 'Vegetables' },
];

const mockOrders = [
  { id: 'ord-1', customerName: 'Alice Smith', type: 'lab_test', status: 'pending', total: 350, items: [{ name: 'CBC Test', quantity: 1 }] },
  { id: 'ord-2', customerName: 'Bob Johnson', type: 'medicine', status: 'prescription_pending', total: 100, items: [{ name: 'Paracetamol', quantity: 2 }, { name: 'Antacid Gel', quantity: 1 }] },
  { id: 'ord-3', customerName: 'Grace Lee', type: 'grocery', status: 'out_for_delivery', total: 300, items: [{ name: 'Basmati Rice', quantity: 1 }, { name: 'Milk', quantity: 2 }] },
  { id: 'ord-4', customerName: 'Alice Smith', type: 'medicine', status: 'delivered', total: 200, items: [{ name: 'Ibuprofen', quantity: 3 }] },
  { id: 'ord-5', customerName: 'Harry Wilson', type: 'lab_test', status: 'confirmed', total: 800, items: [{ name: 'Lipid Profile', quantity: 1 }] },
];

const mockPrescriptions = [
  { id: 'pres-1', customerName: 'Bob Johnson', status: 'pending', url: 'mock_prescription_bob.pdf' },
  { id: 'pres-2', customerName: 'Ivy Davis', status: 'pending', url: 'mock_prescription_ivy.pdf' },
];

const mockDeliveries = [
  { id: 'del-1', orderId: 'ord-3', customerName: 'Grace Lee', address: '789 Pine Ln, Hyd', status: 'picked', type: 'grocery', routeInfo: 'Shortest path via MG Road' },
  { id: 'del-2', orderId: 'ord-5', customerName: 'Harry Wilson', address: '101 Elm Rd, Hyd', status: 'assigned', type: 'lab_test', routeInfo: 'Needs to visit lab then customer' },
];

const mockLabTestBookings = [
  { id: 'book-1', customerName: 'Alice Smith', testName: 'CBC Test', scheduledTime: '2025-06-15T10:00:00Z', status: 'pending' },
  { id: 'book-2', customerName: 'Harry Wilson', testName: 'Lipid Profile', scheduledTime: '2025-06-16T14:00:00Z', status: 'pending' },
];


// --- Cart Context ---
const CartContext = createContext(null);

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem('guestCart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse guest cart from localStorage", e);
        localStorage.removeItem('guestCart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes (for guest users)
  useEffect(() => {
    localStorage.setItem('guestCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        return [...prevItems, { ...item, quantity }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Mock function to simulate cart transfer (in a real app, this would involve a backend API call)
  const transferCartToUser = (userId) => {
    console.log(`MOCK: Transferring guest cart for userId: ${userId}. Items:`, cartItems);
    // In a real app, send cartItems to backend to save to user's database cart
    clearCart(); // Clear local guest cart after transfer
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, transferCartToUser }}>
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => useContext(CartContext);


// --- Auth Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'customer', 'admin', 'delivery_partner', 'partner'
  const [userId, setUserId] = useState(null); // Supabase Auth User ID
  const [guestId, setGuestId] = useState(() => {
    const storedGuestId = localStorage.getItem('guestId');
    if (storedGuestId) {
      return storedGuestId;
    }
    const newGuestId = crypto.randomUUID(); // Generate a new guest ID
    localStorage.setItem('guestId', newGuestId);
    return newGuestId;
  });

  const { transferCartToUser } = useCart(); // Access cart context

  useEffect(() => {
    const handleAuthStateChange = async (event, session) => {
      if (session && session.user) {
        setUser(session.user);
        setUserId(session.user.id);
        // localStorage.setItem('mockUserSession', JSON.stringify(session.user)); // Stored in login/signup directly now

        // Fetch user role from the public.profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user profile:", error.message);
          setUserRole('customer'); // Default to customer on error
        } else if (profile) {
          setUserRole(profile.role);
        } else {
          console.log("User profile not found in public.profiles. Defaulting to customer role.");
          setUserRole('customer'); // Default if no profile found
        }

        // --- Cart Transfer on Login/Signup ---
        transferCartToUser(session.user.id);

      } else {
        setUser(null);
        setUserId(null);
        setUserRole(null);
        localStorage.removeItem('mockUserSession'); // Clear mock session
      }
      setLoading(false);
    };

    // Initial check and set up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('INITIAL_SESSION', session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [transferCartToUser]);

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      console.error("Login error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true }; // onAuthStateChange handles state updates
  };

  const signup = async (email, password, fullName, phoneNumber, role) => {
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          role: role,
        }
      }
    });

    if (signUpError) {
      setLoading(false);
      console.error("Signup error:", signUpError.message);
      return { success: false, error: signUpError.message };
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            full_name: fullName,
            phone_number: phoneNumber,
            role: role,
            address: "N/A", // Placeholder
          },
        ]);

      if (profileError) {
        console.error("Error saving user profile to public.profiles:", profileError.message);
        return { success: false, error: "Account created, but profile could not be saved. Please contact support." };
      }
    }

    setLoading(false);
    return { success: true, message: "Signup successful. Check your email for verification if required (in real app)." };
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error("Logout error:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true }; // onAuthStateChange handles state updates
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, userId, guestId, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- Top Navigation Bar ---
const TopBar = ({ toggleDrawer, onLoginSignupClick }) => {
  const { user, userRole, userId, logout } = useAuth();
  const { cartItems } = useCart();

  const getUserRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'customer': return 'Customer';
      case 'delivery_partner': return 'Delivery Partner';
      case 'partner': return 'Partner (Lab/Pharmacy)';
      default: return 'Guest';
    }
  };

  return (
    <nav className="bg-blue-600 p-4 text-white shadow-md flex items-center justify-between">
      <div className="flex items-center">
        <button onClick={toggleDrawer} className="text-white focus:outline-none mr-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
        <h1 className="text-xl font-bold">SmartCare+</h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="text-white focus:outline-none relative">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5H3m0 0l-.7-2H1m7 15a2 2 0 100-4 2 2 0 000 4zm11 0a2 2 100-4 2 2 0 000 4z"></path></svg>
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-800 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {user ? (
          <div className="flex items-center space-x-2">
            <span className="hidden md:block text-sm">Hello, {user.email} ({getUserRoleText(userRole)})</span>
            <span className="hidden md:block text-xs opacity-80">UID: {userId}</span>
            <button onClick={logout} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300">
              Logout
            </button>
          </div>
        ) : (
          <button onClick={onLoginSignupClick} className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300">
            Login / Sign Up
          </button>
        )}
      </div>
    </nav>
  );
};

// --- Left Navigation Drawer ---
const AppDrawer = ({ open, toggleDrawer, navigateTo }) => {
  const { userRole, user } = useAuth();

  let menuItems = [];

  if (user) {
    switch (userRole) {
      case 'customer':
        menuItems = [
          { text: 'Home', path: '/' },
          { text: 'Customer Dashboard', path: '/customer' },
        ];
        break;
      case 'admin':
        menuItems = [
          { text: 'Home', path: '/' },
          { text: 'Admin Panel', path: '/admin' },
        ];
        break;
      case 'delivery_partner':
        menuItems = [
          { text: 'Home', path: '/' },
          { text: 'Delivery Partner', path: '/delivery-partner' },
        ];
        break;
      case 'partner':
        menuItems = [
          { text: 'Home', path: '/' },
          { text: 'Partner Panel', path: '/partner' },
        ];
        break;
      default:
        menuItems = [{ text: 'Home', path: '/' }];
    }
  } else {
    menuItems = [{ text: 'Home', path: '/' }]; // Guest users see home page
  }


  return (
    <div className={`fixed inset-0 z-40 transition-transform transform ${open ? 'translate-x-0' : '-translate-x-full'} md:hidden`}
         onClick={toggleDrawer}>
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg p-4 flex flex-col"
           onClick={e => e.stopPropagation()}> {/* Prevent closing when clicking inside */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-blue-600">SmartCare+ Menu</h2>
          <button onClick={toggleDrawer} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="mt-5">
          <ul>
            {menuItems.map((item) => (
              <li key={item.text} className="mb-2">
                <button
                  onClick={() => navigateTo(item.path)}
                  className="block w-full text-left py-2 px-4 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 focus:outline-none transition duration-150"
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black opacity-50"></div>}
    </div>
  );
};


// --- Login/Signup Modal Component ---
const LoginSignupModal = ({ open, onClose, isSignupDefault = false }) => {
  const { login, signup, loading } = useAuth();
  const [isLoginView, setIsLoginView] = useState(!isSignupDefault);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form on modal open/view change
  useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhoneNumber('');
    setRole('customer');
    setError('');
    setSuccess('');
  }, [open, isLoginView]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isLoginView) {
      const result = await login(email, password);
      if (result.success) {
        setSuccess("Login successful! Redirecting...");
        setTimeout(onClose, 1000); // Close modal on success
        window.location.reload(); // Force reload to update auth context correctly in mock
      } else {
        setError(result.error);
      }
    } else {
      const result = await signup(email, password, fullName, phoneNumber, role);
      if (result.success) {
        setSuccess(result.message || "Account created successfully! Redirecting...");
        setTimeout(onClose, 1000); // Close modal on success
        window.location.reload(); // Force reload to update auth context correctly in mock
      } else {
        setError(result.error);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center font-sans">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm m-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-blue-700">{isLoginView ? 'Login' : 'Sign Up'} to SmartCare+</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {!isLoginView && (
            <>
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="tel" placeholder="Phone Number (+91XXXXXXXXXX)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-3 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-3 mb-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="delivery_partner">Delivery Partner</option>
                <option value="partner">Partner (Lab/Pharmacy)</option>
              </select>
            </>
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 mb-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          {!isLoginView && <p className="text-sm text-gray-500 mb-3">Minimum 6 characters</p>}

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative mb-3" role="alert">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative mb-3" role="alert">{success}</div>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            {loading ? 'Loading...' : (isLoginView ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
            <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="text-blue-600 hover:underline font-semibold focus:outline-none">
              {isLoginView ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};


// --- Customer Module Components ---
const LabTestTab = () => {
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredTests = mockLabTests.filter(test =>
    test.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6">Book Lab Test</h2>
      <input
        type="text"
        placeholder="Search Lab Tests"
        className="w-full p-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTests.length > 0 ? (
          filteredTests.map(test => (
            <div key={test.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{test.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                <p className="text-xl font-bold text-blue-600">₹{test.price.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end">
                <button onClick={() => addToCart(test)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 shadow-md">
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            No lab tests found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

const MedicineTab = () => {
  const { cartItems, addToCart } = useCart(); // Access cartItems to pass to LLM
  const [searchTerm, setSearchTerm] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [showLlmModal, setShowLlmModal] = useState(false);

  const filteredMedicines = mockMedicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [openPrescriptionModal, setOpenPrescriptionModal] = useState(false);

  const handleUploadPrescription = () => {
    console.log("Upload Prescription clicked! (Mock)");
    setOpenPrescriptionModal(true);
  };

  const handlePrescriptionModalClose = () => {
    setOpenPrescriptionModal(false);
  };

  const getGeminiHealthInsights = async () => {
    setIsLlmLoading(true);
    setLlmResponse('');
    setShowLlmModal(true);

    const medicineNames = cartItems.map(item => item.name).join(', ');
    let prompt = `Given these medicines in a shopping cart: ${medicineNames}. Please provide concise general health advice or potential common interactions. Focus on common knowledge, not medical diagnosis. If the list is empty, suggest general advice on healthy living.`;

    if (cartItems.length === 0) {
      prompt = "Provide concise general health advice on maintaining a healthy lifestyle, including diet, exercise, and sleep. Avoid medical diagnosis.";
    }

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                // You can add more generation config here, e.g., temperature, maxOutputTokens
            }
        };
        const apiKey = ""; // Canvas will automatically provide it in runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            setLlmResponse(result.candidates[0].content.parts[0].text);
        } else {
            setLlmResponse("Could not generate insights. Please try again.");
            console.error("Gemini API returned unexpected structure:", result);
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        setLlmResponse("Failed to fetch health insights. Please check your network or try again later.");
    } finally {
        setIsLlmLoading(false);
    }
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6">Order Medicines</h2>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <input
          type="text"
          placeholder="Search Medicines"
          className="w-full sm:flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleUploadPrescription} className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md shadow-md transition duration-300">
          Upload Prescription
        </button>
        <button onClick={getGeminiHealthInsights} disabled={isLlmLoading} className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-2 px-4 rounded-md shadow-md transition duration-300 flex items-center justify-center">
            ✨ {isLlmLoading ? 'Generating...' : 'Get Health Insights'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map(med => (
            <div key={med.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{med.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{med.description}</p>
                <p className="text-sm text-gray-600">Stock: {med.stock}</p>
                <p className="text-xl font-bold text-blue-600 mt-2">₹{med.price.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => addToCart(med)}
                  disabled={med.stock === 0}
                  className={`py-2 px-4 rounded-md font-semibold transition duration-300 shadow-md ${
                    med.stock > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {med.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            No medicines found matching your search.
          </div>
        )}
      </div>

      {/* Prescription Upload Modal */}
      {openPrescriptionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center font-sans">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-blue-700">Upload Prescription</h3>
              <button onClick={handlePrescriptionModalClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="py-4">
              <p className="text-gray-700 mb-4">Please upload your doctor's prescription for medicine orders.</p>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <p className="mt-2 text-sm text-gray-500">Accepted formats: PDF, JPG, JPEG, PNG</p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button onClick={handlePrescriptionModalClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-md transition duration-300">Cancel</button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300">Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* LLM Health Insights Modal */}
      {showLlmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center font-sans">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg m-4 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-blue-700">Health Insights ✨</h3>
              <button onClick={() => setShowLlmModal(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="py-4 max-h-96 overflow-y-auto">
              {isLlmLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-gray-600">Generating insights...</p>
                </div>
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">{llmResponse}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button onClick={() => setShowLlmModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GroceryTab = () => {
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const filteredGroceries = mockGroceryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6">Order Groceries</h2>
      <input
        type="text"
        placeholder="Search Grocery Items"
        className="w-full p-3 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroceries.length > 0 ? (
          filteredGroceries.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-1">Category: {item.category}</p>
                <p className="text-sm text-gray-600">Stock: {item.stock}</p>
                <p className="text-xl font-bold text-blue-600 mt-2">₹{item.price.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.stock === 0}
                  className={`py-2 px-4 rounded-md font-semibold transition duration-300 shadow-md ${
                    item.stock > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            No grocery items found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { cartItems, clearCart, removeFromCart } = useCart();
  const [activeTab, setActiveTab] = useState('labTests'); // Default to 'labTests' tab
  const [openLoginSignupModal, setOpenLoginSignupModal] = useState(false);
  const [isSignupDefault, setIsSignupDefault] = useState(false);

  const handlePlaceOrder = () => {
    if (!user) {
      setOpenLoginSignupModal(true);
      setIsSignupDefault(false); // Default to login view
    } else {
      console.log("MOCK: Placing order for authenticated user with cart:", cartItems);
      alert("Order placed successfully! (Mock)");
      clearCart();
    }
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'labTests': return <LabTestTab />;
      case 'medicines': return <MedicineTab />;
      case 'groceries': return <GroceryTab />;
      case 'myOrders':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">My Orders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockOrders.filter(order => user && order.customerName === 'Alice Smith').map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-gray-500 text-sm">Order ID: {order.id}</p>
                  <p className="text-lg font-semibold text-gray-800">Type: {order.type.replace('_', ' ').toUpperCase()}</p>
                  <p className={`font-bold ${order.status === 'delivered' ? 'text-green-600' : (order.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600')}`}>Status: {order.status.toUpperCase()}</p>
                  <p className="text-sm text-gray-700">Items: {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                  <p className="text-xl font-bold text-blue-600 mt-2">Total: ₹{order.total.toFixed(2)}</p>
                  <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">View Details</button>
                </div>
              ))}
              {(!user || mockOrders.filter(order => order.customerName === 'Alice Smith').length === 0) && (
                  <div className="col-span-full text-center text-gray-500 py-8">
                      {user ? 'You have no orders yet.' : 'Please login to view your orders.'}
                  </div>
              )}
            </div>
          </div>
        );
      case 'myCart':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">My Cart</h2>
            {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    Your cart is empty. Add some items to get started!
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cartItems.map(item => (
                            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                <p className="text-sm text-gray-600">Price: ₹{item.price.toFixed(2)} each</p>
                                <p className="text-xl font-bold text-blue-600 mt-2">Subtotal: ₹{(item.price * item.quantity).toFixed(2)}</p>
                                <button onClick={() => removeFromCart(item.id)} className="mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm transition duration-300 self-end">Remove</button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <p className="text-2xl font-bold text-gray-800">Total: ₹{calculateCartTotal()}</p>
                        <button onClick={handlePlaceOrder} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md shadow-lg transition duration-300">
                            Place Order
                        </button>
                    </div>
                </>
            )}
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-8">Welcome, {user ? 'Customer!' : 'Guest!'}</h1>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex flex-wrap -mb-px text-sm font-medium text-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
          <button
            className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'labTests' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
            onClick={() => setActiveTab('labTests')}
          >
            Book Lab Test
          </button>
          <button
            className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'medicines' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
            onClick={() => setActiveTab('medicines')}
          >
            Order Medicines
          </button>
          <button
            className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'groceries' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
            onClick={() => setActiveTab('groceries')}
          >
            Order Groceries
          </button>
          <button
            className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'myOrders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
            onClick={() => setActiveTab('myOrders')}
          >
            My Orders
          </button>
          <button
            className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'myCart' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300'}`}
            onClick={() => setActiveTab('myCart')}
          >
            My Cart
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md">
        {renderTabContent()}
      </div>

      <LoginSignupModal open={openLoginSignupModal} onClose={() => setOpenLoginSignupModal(false)} isSignupDefault={isSignupDefault} />
    </div>
  );
};


// --- Admin Module Components ---
const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('orders');
  const [llmInsight, setLlmInsight] = useState('');
  const [isLlmLoading, setIsLlmLoading] = useState(false);
  const [showLlmModal, setShowLlmModal] = useState(false);

  const getGeminiReportInsights = async () => {
    setIsLlmLoading(true);
    setLlmInsight('');
    setShowLlmModal(true);

    const prompt = `Based on the following mock data for a small-town business named SmartCare+:
Daily Revenue: ₹15,230
Top 5 ordered medicines this month: ${mockMedicines.slice(0, 5).map(m => m.name).join(', ')}
Most common test types: ${mockLabTests.slice(0, 2).map(t => t.name).join(', ')}

Please provide a brief summary of key trends and suggest potential business strategies to improve growth and customer engagement. Be concise and actionable.`;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                // You can add more generation config here, e.g., temperature, maxOutputTokens
            }
        };
        const apiKey = ""; // Canvas will automatically provide it in runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            setLlmInsight(result.candidates[0].content.parts[0].text);
        } else {
            setLlmInsight("Could not generate insights. Please try again.");
            console.error("Gemini API returned unexpected structure:", result);
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        setLlmInsight("Failed to fetch report insights. Please check your network or try again later.");
    } finally {
        setIsLlmLoading(false);
    }
  };


  const renderContent = () => {
    switch (selectedTab) {
      case 'orders':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">All Orders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-gray-500 text-sm">Order ID: {order.id}</p>
                  <p className="text-lg font-semibold text-gray-800">Customer: {order.customerName}</p>
                  <p className="text-base text-gray-700">Type: {order.type.replace('_', ' ').toUpperCase()}</p>
                  <p className={`font-bold ${order.status === 'delivered' ? 'text-green-600' : (order.status.includes('pending') ? 'text-yellow-600' : 'text-blue-600')}`}>Status: {order.status.toUpperCase()}</p>
                  <p className="text-sm text-gray-700">Items: {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                  <p className="text-xl font-bold text-blue-600 mt-2">Total: ₹{order.total.toFixed(2)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">View Details</button>
                    {(order.status === 'pending' || order.status === 'prescription_pending') && (
                      <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition duration-300">Dispatch</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Inventory Management</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Medicines</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {mockMedicines.map(med => (
                <div key={med.id} className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-lg font-semibold text-gray-800">{med.name}</p>
                  <p className="text-gray-600">Stock: {med.stock} | Price: ₹{med.price.toFixed(2)}</p>
                  <button className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition duration-300">Edit</button>
                </div>
              ))}
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 mb-8">Add New Medicine</button>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Groceries</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {mockGroceryItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-lg font-semibold text-gray-800">{item.name}</p>
                  <p className="text-gray-600">Stock: {item.stock} | Price: ₹{item.price.toFixed(2)}</p>
                  <button className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition duration-300">Edit</button>
                </div>
              ))}
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300">Add New Grocery</button>
          </div>
        );
      case 'prescriptions':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Prescription Approvals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockPrescriptions.length > 0 ? (
                mockPrescriptions.map(pres => (
                  <div key={pres.id} className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-lg font-semibold text-gray-800">Customer: {pres.customerName}</p>
                    <p className="text-gray-600">Status: {pres.status.toUpperCase()}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition duration-300">View PDF</button>
                      <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">Approve</button>
                      <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">Reject</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                  No pending prescriptions.
                </div>
              )}
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Daily Revenue Analytics</h2>
            <div className="bg-blue-50 p-6 rounded-lg shadow-md text-center mb-8">
              <p className="text-3xl font-bold text-blue-700">Daily Revenue: ₹15,230 (Mock Data)</p>
              <button onClick={getGeminiReportInsights} disabled={isLlmLoading} className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-blue-900 font-bold py-2 px-4 rounded-md shadow-md transition duration-300 flex items-center justify-center mx-auto">
                ✨ {isLlmLoading ? 'Generating Insights...' : 'Generate Report Insights'}
              </button>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Diagnostic Test Results</h3>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <input type="text" placeholder="Customer Search" className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select className="w-full p-3 mb-4 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Order</option>
                <option value="ord-1">ord-1 (CBC Test - Alice Smith)</option>
                <option value="ord-5">ord-5 (Lipid Profile - Harry Wilson)</option>
              </select>
              <div className="flex items-center space-x-4">
                <label className="block text-blue-600 bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-md cursor-pointer text-sm font-semibold transition duration-300">
                  Upload Result PDF
                  <input type="file" hidden accept=".pdf" />
                </label>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300">Submit Result</button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-8">Admin Panel</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4 bg-white rounded-lg shadow-md p-4">
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('orders')}
              >
                View All Orders
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'inventory' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('inventory')}
              >
                Inventory Management
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'prescriptions' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('prescriptions')}
              >
                Approve Prescriptions
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('analytics')}
              >
                Analytics & Upload Results
              </button>
            </li>
          </ul>
        </div>
        <div className="md:w-3/4 bg-white rounded-lg shadow-md">
          {renderContent()}
        </div>
      </div>

      {/* LLM Analytics Insights Modal */}
      {showLlmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center font-sans">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg m-4 relative">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-blue-700">Report Insights ✨</h3>
              <button onClick={() => setShowLlmModal(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="py-4 max-h-96 overflow-y-auto">
              {isLlmLoading ? (
                <div className="flex justify-center items-center py-8">
                  <p className="text-gray-600">Generating insights...</p>
                </div>
              ) : (
                <p className="text-gray-800 whitespace-pre-wrap">{llmInsight}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button onClick={() => setShowLlmModal(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Delivery Partner Module Components ---
const DeliveryPartnerDashboard = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-8">Delivery Partner Dashboard</h1>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">Assigned Deliveries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDeliveries.length > 0 ? (
            mockDeliveries.map(delivery => (
              <div key={delivery.id} className="bg-gray-50 rounded-lg shadow-sm p-4 border border-gray-200 flex flex-col">
                <p className="text-gray-500 text-sm">Order ID: {delivery.orderId}</p>
                <p className="text-lg font-semibold text-gray-800">Customer: {delivery.customerName}</p>
                <p className="text-gray-700">Address: {delivery.address}</p>
                <p className="text-gray-700">Type: {delivery.type.replace('_', ' ').toUpperCase()}</p>
                <p className={`font-bold ${delivery.status === 'delivered' ? 'text-green-600' : (delivery.status === 'picked' ? 'text-blue-600' : 'text-yellow-600')}`}>Status: {delivery.status.toUpperCase()}</p>
                <p className="text-sm text-gray-600 mt-1">Route: {delivery.routeInfo}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {delivery.status === 'assigned' && (
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">Mark Picked</button>
                  )}
                  {delivery.status === 'picked' && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm transition duration-300">Mark Delivered</button>
                  )}
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition duration-300">View Map</button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              No assigned deliveries at the moment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Partner Module Components ---
const PartnerDashboard = () => {
  const [selectedTab, setSelectedTab] = useState('labTests'); // Default to lab tests for partners

  const renderContent = () => {
    switch (selectedTab) {
      case 'labTests':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Diagnostic Lab Test Availability</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockLabTests.map(test => (
                <div key={test.id} className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-lg font-semibold text-gray-800">{test.name}</p>
                  <p className="text-gray-600">Price: ₹{test.price.toFixed(2)}</p>
                  <p className={`font-semibold ${test.is_available ? 'text-green-600' : 'text-red-600'}`}>Available: {test.is_available ? 'Yes' : 'No'}</p>
                  <button className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md text-sm transition duration-300">Toggle Availability</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'testBookings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Pending Test Booking Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockLabTestBookings.length > 0 ? (
                mockLabTestBookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-md p-4">
                    <p className="text-lg font-semibold text-gray-800">Test: {booking.testName}</p>
                    <p className="text-gray-700">Customer: {booking.customerName}</p>
                    <p className="text-gray-700">Scheduled: {new Date(booking.scheduledTime).toLocaleString()}</p>
                    <p className={`font-bold ${booking.status === 'pending' ? 'text-yellow-600' : 'text-blue-600'}`}>Status: {booking.status.toUpperCase()}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">Confirm</button>
                          <button className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm transition duration-300">Decline</button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                  No pending test booking requests.
                </div>
              )}
            </div>
          </div>
        );
      case 'medicineInventory':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-blue-700 mb-6">Synced Medicine Inventory (Pharmacy Partner)</h2>
            <p className="text-gray-600 mb-4">
                This data is synced from the Admin Dashboard and is read-only for pharmacy partners.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockMedicines.map(med => (
                <div key={med.id} className="bg-white rounded-lg shadow-md p-4">
                  <p className="text-lg font-semibold text-gray-800">{med.name}</p>
                  <p className="text-gray-600">Stock: {med.stock}</p>
                  <p className="text-gray-600">Price: ₹{med.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-800 mb-8">Partner Panel</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4 bg-white rounded-lg shadow-md p-4">
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'labTests' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('labTests')}
              >
                Manage Lab Tests
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'testBookings' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('testBookings')}
              >
                Test Booking Requests
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left py-2 px-4 rounded-md font-medium transition duration-150 ${selectedTab === 'medicineInventory' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setSelectedTab('medicineInventory')}
              >
                View Medicine Inventory
              </button>
            </li>
          </ul>
        </div>
        <div className="md:w-3/4 bg-white rounded-lg shadow-md">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App = () => {
  const { user, userRole, loading, guestId } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  const [showLoginSignupModal, setShowLoginSignupModal] = useState(false);


  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const navigateTo = (path) => {
    window.location.hash = path;
    setDrawerOpen(false); // Close drawer on navigation
    setShowLoginSignupModal(false); // Close modal if navigating away
  };

  const handleOpenLoginSignupModal = () => {
    setShowLoginSignupModal(true);
  };

  const handleCloseLoginSignupModal = () => {
    setShowLoginSignupModal(false);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-xl font-semibold text-gray-700">Loading User Data...</p>
        </div>
      );
    }

    // Default view for guests or after login/signup is the CustomerDashboard
    if (!user || userRole === 'customer') {
      return <CustomerDashboard />;
    }

    // Authenticated user: Render dashboard based on role
    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'delivery_partner':
        return <DeliveryPartnerDashboard />;
      case 'partner':
        return <PartnerDashboard />;
      default:
        return (
          <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
            <h2 className="text-2xl text-gray-700 font-semibold mb-4">Unknown User Role</h2>
            <p className="text-gray-600 mb-6">Please contact support.</p>
            <button onClick={() => supabase.auth.signOut()} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300">Logout</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Tailwind CSS CDN: Removed explicit script tag, relying on environment to provide it */}
      <TopBar toggleDrawer={toggleDrawer} onLoginSignupClick={handleOpenLoginSignupModal} />
      <AppDrawer open={drawerOpen} toggleDrawer={toggleDrawer} navigateTo={navigateTo} />
      
      {/* Main Content Area */}
      <main className="flex-grow">
        {renderContent()}
      </main>

      <LoginSignupModal open={showLoginSignupModal} onClose={handleCloseLoginSignupModal} />
    </div>
  );
};

export default function Root() {
    return (
        <CartProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </CartProvider>
    );
}
