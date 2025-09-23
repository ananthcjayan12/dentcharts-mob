# DentCharts - Clinic Management System

A modern React-based clinic management system designed for dental practices, featuring a mobile-first responsive design inspired by the provided Figma mockups.

## Features

### 🏥 Core Functionality
- **Landing Page** - Smart healthcare branding with professional design
- **Authentication** - Login and registration for doctors
- **Doctor Dashboard** - Overview of appointments, patients, and quick actions
- **Patient Profiles** - Comprehensive patient information and medical history
- **Prescription Management** - Digital prescription tracking and history
- **Appointment System** - Schedule and manage patient appointments

### 🎨 Design Principles
- **Mobile-First** - Optimized for mobile devices with responsive design
- **DRY Architecture** - Reusable components following Don't Repeat Yourself principles
- **Modern UI** - Clean, professional interface with consistent styling
- **Accessibility** - Built with accessibility best practices

### 🛠 Technical Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for utility-first styling
- **React Router** for navigation
- **Context API** for state management
- **Modern Hooks** for component logic

## Project Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── InputField.tsx
│   │   ├── TopBar.tsx
│   │   └── BottomNav.tsx
│   └── layout/           # Layout components
│       └── MobileContainer.tsx
├── contexts/             # React contexts
│   └── AuthContext.tsx
├── pages/               # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx
│   ├── ProfilePage.tsx
│   └── PrescriptionPage.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── App.tsx
├── index.tsx
└── index.css
```

## Component Architecture (DRY Principles)

### Reusable Components

1. **Button Component**
   - Multiple variants (primary, secondary, outline)
   - Different sizes (sm, md, lg)
   - Loading states
   - Consistent styling across app

2. **InputField Component**
   - Label and error handling
   - Icon support
   - Consistent validation styling

3. **Card Component**
   - Unified shadow and border radius
   - Clickable variants
   - Consistent spacing

4. **TopBar Component**
   - Back navigation
   - Menu options
   - Consistent header styling

5. **BottomNav Component**
   - Tab navigation
   - Active state management
   - Icon and label support

6. **MobileContainer Component**
   - Consistent mobile layout
   - Maximum width constraints
   - Centered design

### Shared Utilities

- **AuthContext**: Centralized authentication state
- **TypeScript Types**: Shared interfaces for data models
- **Tailwind Classes**: Utility classes for consistent styling

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view in browser

### Building for Production

```bash
npm run build
```

## Design System

### Colors
- **Primary**: Green tones (#259376) for medical/healthcare feel
- **Secondary**: Orange (#FF8D1D) for accent actions
- **Grays**: Various shades for text and backgrounds

### Typography
- **Headings**: Montserrat font family
- **Body**: Lato font family
- **Weights**: 300, 400, 600, 700, 800

### Components
- **Border Radius**: Consistent rounded corners (12px, 20px, full)
- **Shadows**: Light, elements, and card shadow variants
- **Spacing**: Consistent padding and margins using Tailwind scale

## Features Implementation

### Authentication Flow
1. Landing page with doctor login option
2. Login form with validation
3. Registration with professional details
4. Context-based auth state management

### Dashboard Features
1. Welcome header with doctor info
2. Today's appointments overview
3. Quick action cards (Patients, Appointments, Prescriptions, Invoices)
4. Upcoming appointments list
5. Search functionality

### Patient Management
1. Comprehensive patient profiles
2. Medical history tracking
3. Personal and contact information
4. Editable fields with proper validation

### Prescription System
1. Historical prescription viewing
2. Expandable/collapsible entries
3. Document upload functionality
4. Investigation results tracking

## Mobile Responsiveness

- **Container**: Maximum width with centered layout
- **Touch Targets**: Appropriate sizing for mobile interaction
- **Typography**: Optimized font sizes for mobile reading
- **Navigation**: Bottom tab navigation for thumb accessibility
- **Forms**: Large touch-friendly form elements

## Future Enhancements

- [ ] Real API integration
- [ ] Push notifications for appointments
- [ ] Offline functionality
- [ ] PDF generation for prescriptions
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced search and filtering
- [ ] Calendar integration
- [ ] Payment processing
- [ ] Report generation

## Contributing

1. Follow the established component patterns
2. Maintain TypeScript type safety
3. Use Tailwind CSS for styling
4. Follow DRY principles for reusable code
5. Ensure mobile-first responsive design

## License

This project is licensed under the MIT License.
