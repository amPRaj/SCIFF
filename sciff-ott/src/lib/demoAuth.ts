import type { User, Category, Film, SchoolSubscription, Banner } from './supabase';

// Demo data for testing
const demoSchool = {
  id: 'demo-school-1',
  name: 'Demo Public School',
  code: 'DEMO001',
  contact_email: 'admin@demo.school',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const demoUser: User = {
  id: 'demo-user-1',
  email: 'demo@sciff.internal',
  school_id: 'demo-school-1',
  username: 'demo',
  role: 'school_user',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  school: demoSchool
};

const demoAdminUser: User = {
  id: 'demo-admin-1',
  email: 'admin@sciff.internal',
  school_id: 'demo-school-1',
  username: 'admin',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  school: demoSchool
};

const demoCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Below 7 years',
    min_age: 0,
    max_age: 7,
    description: 'Content suitable for children below 7 years',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat-2',
    name: '10+ years',
    min_age: 10,
    max_age: 15,
    description: 'Content suitable for children 10 years and above',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'cat-3',
    name: '13+ years',
    min_age: 13,
    max_age: 18,
    description: 'Content suitable for teenagers 13 years and above',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const demoFilms: Film[] = [
  // Below 7 years
  {
    id: 'film-1',
    title: 'The Little Explorer',
    category_id: 'cat-1',
    external_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    runtime_seconds: 596,
    thumbnail_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
    description: 'A wonderful adventure story for young children',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'film-2',
    title: 'Magic Garden',
    category_id: 'cat-1',
    external_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    runtime_seconds: 653,
    thumbnail_url: 'https://images.unsplash.com/photo-1516975527983-3e2a11a9d9cb?w=500',
    description: 'Discover the magic in a beautiful garden',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // 10+ years
  {
    id: 'film-3',
    title: 'Space Adventure',
    category_id: 'cat-2',
    external_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    runtime_seconds: 888,
    thumbnail_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=500',
    description: 'Explore the mysteries of space and planets',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'film-4',
    title: 'The Young Scientist',
    category_id: 'cat-2',
    external_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    runtime_seconds: 734,
    thumbnail_url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500',
    description: 'Follow a young scientist\'s incredible discoveries',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  // 13+ years
  {
    id: 'film-5',
    title: 'Future Leaders',
    category_id: 'cat-3',
    external_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    runtime_seconds: 596,
    thumbnail_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500',
    description: 'Stories of young leaders making a difference',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const demoSubscriptions: SchoolSubscription[] = [
  {
    id: 'sub-1',
    school_id: 'demo-school-1',
    category_id: 'cat-1',
    start_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sub-2',
    school_id: 'demo-school-1',
    category_id: 'cat-2',
    start_date: new Date().toISOString(),
    expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const demoBanners: Banner[] = [
  {
    id: 'banner-1',
    title: 'Welcome to SCIFF 2024',
    image_url: 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=800&h=400&fit=crop',
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'banner-2',
    title: 'Film Festival Highlights',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class DemoAuthService {
  private currentUser: User | null = null;

  constructor() {
    this.sessionKey = this.generateSessionKey();
  }

  private generateSessionKey(): string {
    return `demo-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  async login(credentials: { username: string; password: string }) {
    // Demo login - accept 'demo'/'demo123' or 'admin'/'admin123'
    if (
      (credentials.username === 'demo' && credentials.password === 'demo123') ||
      (credentials.username === 'admin' && credentials.password === 'admin123')
    ) {
      this.currentUser = credentials.username === 'admin' ? demoAdminUser : demoUser;
      localStorage.setItem('demo_user', JSON.stringify(this.currentUser));
      return {
        success: true,
        user: this.currentUser
      };
    }

    return {
      success: false,
      error: 'Invalid credentials. Use demo/demo123 or admin/admin123'
    };
  }

  async logout() {
    this.currentUser = null;
    this.sessionKey = null;
    localStorage.removeItem('demo_user');
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    
    const stored = localStorage.getItem('demo_user');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }
    
    return null;
  }

  async checkSessionValidity(): Promise<boolean> {
    return this.currentUser !== null;
  }

  // Anti-piracy helpers (same as original)
  disableDevTools(): void {
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });

    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  enableWatermark(userInfo: { schoolId: string; userId: string }): void {
    if (!import.meta.env.VITE_WATERMARK_ENABLED) return;

    const watermark = document.createElement('div');
    watermark.id = 'sciff-watermark';
    watermark.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
      user-select: none;
      font-family: monospace;
    `;
    
    const now = new Date();
    watermark.textContent = `SCIFF DEMO | ${userInfo.schoolId.slice(-8)} | ${now.toLocaleString()}`;
    
    document.body.appendChild(watermark);

    setInterval(() => {
      const now = new Date();
      watermark.textContent = `SCIFF DEMO | ${userInfo.schoolId.slice(-8)} | ${now.toLocaleString()}`;
    }, 60000);
  }
}

// Demo data access functions
export const getDemoData = () => ({
  categories: demoCategories,
  films: demoFilms,
  subscriptions: demoSubscriptions,
  banners: demoBanners,
  school: demoSchool
});

export const demoAuthService = new DemoAuthService();