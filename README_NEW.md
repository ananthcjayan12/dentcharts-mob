# DentCharts - Clinic Management System

A modern, mobile-first React web application for dental clinic management, built with TypeScript and Tailwind CSS.

## Features

### 🏥 Core Functionality
- **Patient Management**: Add, view, and search patients with medical history
- **Appointment Scheduling**: Create, view, and manage appointments
- **Prescription Management**: Digital prescriptions with investigation reports
- **Invoice Generation**: Create detailed invoices with GST calculation
- **User Authentication**: Secure login and registration system

### 📱 Mobile-First Design
- Responsive design optimized for mobile devices
- Progressive Web App (PWA) support
- Clean, modern UI following the DentCharts design system
- Touch-friendly interface with smooth animations

### 🏗️ Technical Features
- **React 18** with TypeScript for type safety
- **React Router** for client-side navigation
- **Tailwind CSS** for utility-first styling
- **Context API** for state management
- **Mock Data** for development and testing
- **Reusable Components** following DRY principles

## Pages

1. **Landing Page** - Welcome screen with app introduction
2. **Login/Register** - User authentication with form validation
3. **Dashboard (Home)** - Overview with quick actions and upcoming appointments
4. **Patient Management** - List, search, and filter patients
5. **Appointments** - View and manage appointments by date
6. **New Appointment** - Create new appointments with patient selection
7. **Prescriptions** - Patient history and prescription management
8. **Invoice Creation** - Generate invoices with itemized billing
9. **Profile** - User profile management

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── InputField.tsx
│   │   ├── TopBar.tsx
│   │   └── BottomNav.tsx
│   └── layout/          # Layout components
│       ├── Layout.tsx
│       └── MobileContainer.tsx
├── contexts/            # React Context providers
│   └── AuthContext.tsx
├── data/               # Mock data for development
│   └── mockData.ts
├── pages/              # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── HomePage.tsx
│   ├── PatientsPage.tsx
│   ├── AppointmentsPage.tsx
│   ├── NewAppointmentPage.tsx
│   ├── PrescriptionPage.tsx
│   ├── InvoicePage.tsx
│   └── ProfilePage.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main app component with routing
└── index.tsx          # App entry point
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dentcharts-mob
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Secondary**: Green (#10B981)
- **Success**: Green shades
- **Warning**: Yellow/Orange shades
- **Error**: Red shades
- **Neutral**: Gray shades

### Typography
- **Headings**: Lato font family
- **Body Text**: Montserrat font family
- Responsive font sizes for mobile optimization

### Components
All components are built following the DRY (Don't Repeat Yourself) principle:
- Consistent styling through Tailwind utilities
- Reusable props interfaces
- Standardized component APIs

## Mock Data

The application includes comprehensive mock data for development:
- **Users**: Sample doctor profiles
- **Patients**: Patient records with medical history
- **Appointments**: Sample appointments with different statuses
- **Prescriptions**: Medical prescriptions and investigations

## Mobile Optimization

- Touch-friendly button sizes (minimum 44px tap targets)
- Optimized for screen sizes from 320px to 768px
- Smooth scrolling and transitions
- Mobile-first responsive design
- PWA features for native app-like experience

## Future Enhancements

### Planned Features
- Real API integration
- File upload functionality
- Push notifications
- Offline support
- Advanced reporting and analytics
- Multi-language support
- Dark mode theme

### Technical Improvements
- Unit and integration tests
- E2E testing with Cypress
- Performance optimization
- Accessibility enhancements (WCAG compliance)
- SEO optimization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Design inspiration from DentCharts Figma design
- React community for excellent documentation
- Tailwind CSS for the utility-first CSS framework
- TypeScript team for type safety in JavaScript

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
