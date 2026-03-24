# DaingGrader Web Application

Educational web platform for fish (Daing) grading and classification. Features a modern, Monday.com-inspired UI with a Roboflow-style dataset management interface.

## 🎨 Design Features

- **Monday.com-inspired sidebar**: Dark blue navigation sidebar with smooth transitions and active states
- **Roboflow-style Dataset page**: Professional dataset management with filters, image grid, and annotations
- **Responsive design**: Mobile-friendly with collapsible sidebar and adaptive layouts
- **Subtle animations**: Smooth transitions and hover effects throughout

## 📋 Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Python backend** running (see backend folder for setup)

## 🚀 Quick Start

> **This is the web app** (runs in the browser with Vite).  
> The **mobile app** (in the `DaingApp` / `DaingGrader` folder) uses **Expo** — run that with `npx expo start` and use Expo Go on your device. This folder is web-only.

### 1. Install Dependencies

Navigate to the web app directory and install dependencies:

```bash
cd daing-grader-web
npm install
```

### 2. Configure Backend API (Optional)

The app is wired to connect to your Python backend. To configure the API endpoint:

1. Create a `.env` file in the `daing-grader-web` directory (or update `src/services/api.ts` directly)
2. Add your backend URL:

```env
VITE_API_URL=http://localhost:8000
```

**Note**: If the backend isn't running, the app will use mock responses for development (see `src/services/auth.service.ts`).

### 3. Start the Web App (browser)

```bash
npm run dev
```
or
```bash
npm start
```

The app opens in your **browser** at `http://localhost:5173` (or the next available port). This is a normal web app, not Expo Go.

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## 📁 Project Structure

```
daing-grader-web/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── auth/          # Login/Register forms
│   │   ├── dataset/       # Dataset page components
│   │   │   ├── DatasetSidebar.tsx
│   │   │   ├── DatasetFilters.tsx
│   │   │   └── ImageGrid.tsx
│   │   ├── home/          # Home page components
│   │   ├── layout/        # Header, Footer, Sidebar, Layout
│   │   └── ui/            # Reusable UI components
│   ├── pages/             # Page components
│   │   ├── HomePage.tsx
│   │   ├── DatasetPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AboutUsPage.tsx
│   │   ├── AboutDaingPage.tsx
│   │   └── ContactPage.tsx
│   ├── services/          # API integration
│   │   ├── api.ts         # Axios instance
│   │   └── auth.service.ts # Auth API calls
│   ├── styles/
│   │   └── globals.css    # Global styles & Tailwind
│   ├── App.tsx            # Main app with routing
│   └── main.tsx           # Entry point
├── package.json
├── tailwind.config.js     # Tailwind configuration
└── vite.config.ts         # Vite configuration
```

## 🔌 Backend Integration

### Current Status

The frontend is **fully wired** to call backend endpoints, but includes **mock responses** for development when endpoints aren't available:

- ✅ **Login/Register forms**: Ready to call `/auth/login` and `/auth/register`
- ✅ **Profile page**: Ready to call `/auth/profile` and `/auth/me`
- ✅ **API interceptors**: Automatically adds JWT tokens to requests
- ✅ **Error handling**: Gracefully handles missing endpoints

### Backend Endpoints Expected

When you're ready to connect the backend, implement these endpoints:

#### Authentication
- `POST /auth/login` - Login user
  ```json
  { "email": "user@example.com", "password": "password" }
  ```
  Response: `{ "token": "jwt-token", "user": {...} }`

- `POST /auth/register` - Register new user
  ```json
  { "name": "John Doe", "email": "user@example.com", "password": "password" }
  ```
  Response: `{ "token": "jwt-token", "user": {...} }`

- `GET /auth/me` - Get current user (requires auth token)
  Response: `{ "email": "...", "name": "..." }`

- `PUT /auth/profile` - Update user profile (requires auth token)
  ```json
  { "name": "John Doe", "email": "user@example.com" }
  ```

#### Dataset (Future)
- `GET /dataset/images` - Get all dataset images
- `GET /dataset/images/:id` - Get single image details
- `POST /dataset/images` - Upload new image

### Testing Without Backend

The app works without a backend! When endpoints return 404 or connection errors, the app uses mock responses so you can:
- Test login/register forms
- Navigate through pages
- See the UI in action
- Develop frontend features independently

## 🎯 Key Features

### Navigation
- **Main Sidebar**: Dark blue sidebar with navigation links (Home, Dataset, About Us, About Daing, Contact)
- **Dataset Sidebar**: Roboflow-style sidebar with DATA, MODELS, DEPLOY sections
- **Top Bar**: User actions (Sign in, Profile) and branding

### Dataset Page
- **Image Grid**: Responsive grid with thumbnail previews
- **Filters**: Search, filename filter, split/classes/tags dropdowns, sort options
- **Annotations**: Toggle to show/hide orange annotation overlays
- **Selection**: Multi-select with checkbox controls
- **Pagination**: Navigate through large datasets
- **View Modes**: Grid and list views (list coming soon)

### Authentication
- **Login Form**: Email/password with "Remember me" option
- **Register Form**: Full name, email, password, confirm password
- **Profile Page**: Edit profile, change password, view activity
- **Auto-redirect**: Redirects to login on 401 errors

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Framer Motion** - Animations (ready to use)

## 🎨 Customization

### Colors

Edit `tailwind.config.js` or `src/styles/globals.css` to customize:

- **Primary**: `#0ea5e9` (Sky Blue)
- **Sidebar**: `#1e3a5f` (Dark Blue)
- **Surface**: `#f1f5f9` (Light Grey)
- **Status colors**: Done (green), Progress (orange), Stuck (red)

### Styling

- Global styles: `src/styles/globals.css`
- Tailwind config: `tailwind.config.js`
- Component styles: Inline Tailwind classes

## 📝 Development Notes

### Mock Data

- Dataset page uses mock images (174 items)
- Login/Register use mock tokens when backend unavailable
- Profile page shows placeholder user data

### Environment Variables

Create `.env` in `daing-grader-web/`:

```env
VITE_API_URL=http://localhost:8000
```

### Common Commands

```bash
# Install dependencies
npm install

# Start web app (opens in browser)
npm run dev
# or
npm start

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is taken, Vite will automatically use the next available port.

### Backend Connection Errors

If you see connection errors in the console, that's normal if the backend isn't running. The app will use mock responses.

### Build Errors

Make sure all dependencies are installed:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Backend Integration**: Implement auth endpoints in your Python backend
2. **Dataset API**: Connect dataset page to real image data
3. **Image Upload**: Add upload functionality to dataset page
4. **Hero Carousel**: Add 4+ slides to home page carousel
5. **Content Pages**: Fill in About Us, About Daing, Contact pages

## 📄 License

University Project - Educational Use

---

**Note**: This web app and the mobile app (`DaingGrader/`) are separate projects but share the same Python backend API.
