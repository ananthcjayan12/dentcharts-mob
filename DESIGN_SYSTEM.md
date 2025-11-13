# Design System Documentation

## Overview

This design system is extracted from the Clinical Portal CRM Figma design and provides a comprehensive set of design tokens, components, and layout utilities for building consistent and responsive interfaces.

## 🎨 Design Tokens

### Colors

The color system includes semantic colors organized in shades from 50 (lightest) to 900 (darkest):

```typescript
import { colors } from './styles/tokens';

// Primary colors
colors.primary[500] // Main primary color
colors.primary[600] // Darker shade for hover states

// Semantic colors
colors.success[500] // Success states
colors.warning[500] // Warning states
colors.danger[500]  // Error/danger states

// Neutral colors
colors.gray[100]    // Light backgrounds
colors.gray[500]    // Body text
colors.gray[900]    // Headings
```

### Typography

Based on Poppins font family with consistent sizing and weights:

```typescript
import { typography } from './styles/tokens';

// Font sizes
typography.fontSize.xs   // 12px
typography.fontSize.sm   // 14px
typography.fontSize.base // 16px
typography.fontSize.lg   // 18px
typography.fontSize.xl   // 20px
typography.fontSize['2xl'] // 22px

// Font weights
typography.fontWeight.normal   // 400
typography.fontWeight.medium   // 500
typography.fontWeight.semibold // 600
typography.fontWeight.bold     // 700
```

### Spacing

Based on 4px grid system:

```typescript
import { spacing } from './styles/tokens';

// Common spacing values
spacing[1]  // 4px
spacing[2]  // 8px
spacing[4]  // 16px
spacing[6]  // 24px
spacing[8]  // 32px
```

### Breakpoints

Mobile-first responsive breakpoints:

```typescript
import { breakpoints } from './styles/tokens';

breakpoints.sm  // 640px  - Small devices (phones)
breakpoints.md  // 768px  - Medium devices (tablets)
breakpoints.lg  // 1024px - Large devices (desktops)
breakpoints.xl  // 1280px - Extra large devices
```

## 📦 Components

### Layout Components

#### Container

Provides consistent max-width and horizontal padding:

```tsx
import { Container } from '@/components';

<Container size="xl">
  <h1>Content with max-width constraint</h1>
</Container>

// Props
size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
fluid?: boolean
```

#### Grid

Responsive grid layout:

```tsx
import { Grid } from '@/components';

<Grid 
  cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} 
  gap={4}
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>

// Props
cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
gap?: number
```

#### Stack

Vertical or horizontal layout with spacing:

```tsx
import { Stack } from '@/components';

<Stack direction="vertical" spacing={4} align="center">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// Props
direction?: 'vertical' | 'horizontal'
spacing?: number
align?: 'start' | 'center' | 'end' | 'stretch'
justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
wrap?: boolean
```

#### Flex

Flexible box layout:

```tsx
import { Flex } from '@/components';

<Flex 
  direction="row" 
  justify="between" 
  align="center" 
  gap={4}
>
  <div>Left</div>
  <div>Right</div>
</Flex>

// Props
direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse'
align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
wrap?: 'wrap' | 'nowrap' | 'wrap-reverse'
gap?: number
```

### UI Components

#### Button

Consistent button styles with variants and sizes:

```tsx
import { Button } from '@/components';

<Button 
  variant="primary" 
  size="md"
  leftIcon={<IconComponent />}
  isLoading={false}
>
  Click Me
</Button>

// Variants
variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'

// Sizes
size?: 'xs' | 'sm' | 'md' | 'lg'

// Props
isLoading?: boolean
fullWidth?: boolean
leftIcon?: React.ReactNode
rightIcon?: React.ReactNode
```

#### Card

Container component with elevation and padding:

```tsx
import { Card } from '@/components';

<Card 
  variant="elevated" 
  padding="md"
  hoverable
  onClick={() => console.log('clicked')}
>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Variants
variant?: 'default' | 'elevated' | 'outlined' | 'flat'

// Padding
padding?: 'none' | 'sm' | 'md' | 'lg'

// Props
hoverable?: boolean
onClick?: () => void
```

#### InputField

Form input with label and validation:

```tsx
import { InputField } from '@/components';

<InputField
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  error="Invalid email address"
  helperText="We'll never share your email"
  leftIcon={<EmailIcon />}
  size="md"
  variant="outlined"
/>

// Variants
variant?: 'outlined' | 'filled'

// Sizes
size?: 'sm' | 'md' | 'lg'

// Props
label?: string
error?: string
helperText?: string
leftIcon?: React.ReactNode
rightIcon?: React.ReactNode
fullWidth?: boolean
```

#### Typography

Semantic text component:

```tsx
import { Typography } from '@/components';

<Typography 
  variant="h1" 
  color="primary"
  weight="bold"
  align="center"
>
  Page Title
</Typography>

// Variants
variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline'

// Colors
color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'success' | 'warning' | 'danger'

// Weights
weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'

// Alignment
align?: 'left' | 'center' | 'right' | 'justify'
```

#### Badge

Status indicators and labels:

```tsx
import { Badge } from '@/components';

<Badge 
  variant="success" 
  size="md"
  dot
>
  Active
</Badge>

// Variants
variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray'

// Sizes
size?: 'sm' | 'md' | 'lg'

// Props
dot?: boolean // Shows colored dot indicator
```

#### Avatar

User profile images with status:

```tsx
import { Avatar } from '@/components';

<Avatar
  src="/path/to/image.jpg"
  name="John Doe"
  size="md"
  status="online"
/>

// Sizes
size?: 'sm' | 'md' | 'lg' | 'xl'

// Status
status?: 'online' | 'offline' | 'away' | 'busy'

// Props
src?: string  // Image URL
alt?: string
name?: string // Used for initials if no image
```

#### Divider

Visual separator:

```tsx
import { Divider } from '@/components';

// Horizontal divider
<Divider />

// With label
<Divider label="OR" />

// Vertical divider
<Divider orientation="vertical" />

// Props
orientation?: 'horizontal' | 'vertical'
label?: string
color?: 'light' | 'medium' | 'dark'
```

## 🎯 Usage Examples

### Responsive Card Grid

```tsx
import { Container, Grid, Card, Typography, Badge } from '@/components';

function PatientGrid() {
  return (
    <Container size="xl">
      <Typography variant="h2" className="mb-6">
        Patients
      </Typography>
      
      <Grid cols={{ xs: 1, sm: 2, lg: 3 }} gap={4}>
        {patients.map(patient => (
          <Card key={patient.id} hoverable padding="md">
            <Flex justify="between" align="start" className="mb-3">
              <Avatar 
                name={patient.name} 
                src={patient.avatar} 
                size="lg" 
              />
              <Badge variant="success">Active</Badge>
            </Flex>
            
            <Typography variant="h5" className="mb-1">
              {patient.name}
            </Typography>
            
            <Typography variant="body2" color="secondary">
              {patient.email}
            </Typography>
          </Card>
        ))}
      </Grid>
    </Container>
  );
}
```

### Form Layout

```tsx
import { Container, Stack, InputField, Button } from '@/components';

function LoginForm() {
  return (
    <Container size="sm">
      <Stack direction="vertical" spacing={4}>
        <Typography variant="h3" align="center">
          Sign In
        </Typography>
        
        <InputField
          label="Email"
          type="email"
          placeholder="Enter your email"
          leftIcon={<EmailIcon />}
        />
        
        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<LockIcon />}
        />
        
        <Button variant="primary" size="lg" fullWidth>
          Sign In
        </Button>
        
        <Divider label="OR" />
        
        <Button variant="outline" fullWidth>
          Sign in with Google
        </Button>
      </Stack>
    </Container>
  );
}
```

### Responsive Navigation

```tsx
import { Flex, Container, Button, Avatar } from '@/components';

function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <Container size="xl">
        <Flex justify="between" align="center" className="h-16">
          {/* Logo */}
          <Typography variant="h5" weight="bold" color="primary">
            DentCharts
          </Typography>
          
          {/* Desktop Navigation */}
          <Flex gap={2} className="hidden md:flex">
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Patients</Button>
            <Button variant="ghost">Appointments</Button>
          </Flex>
          
          {/* User Menu */}
          <Avatar name="John Doe" size="md" status="online" />
        </Flex>
      </Container>
    </header>
  );
}
```

## 🔧 Tailwind Configuration

The design system extends Tailwind CSS with custom tokens. Use Tailwind classes for rapid development:

```tsx
// Using design system colors
<div className="bg-primary-500 text-white">Primary background</div>
<div className="text-success-600">Success text</div>

// Using spacing scale
<div className="p-4 m-6">Padding 16px, Margin 24px</div>

// Using typography
<h1 className="text-2xl font-semibold">Heading with design system sizing</h1>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
</div>
```

## 📱 Responsive Best Practices

1. **Mobile-First**: Start with mobile layout and enhance for larger screens
2. **Touch Targets**: Minimum 44px × 44px for interactive elements
3. **Breakpoint Usage**: Use `sm:`, `md:`, `lg:` prefixes for responsive classes
4. **Flexible Layouts**: Use Grid and Flex components for adaptive layouts
5. **Typography Scale**: Adjust font sizes across breakpoints for readability

## 🎨 Theming

Access theme tokens programmatically:

```typescript
import { theme, getColor, getSpacing } from '@/components';

// Get color value
const primaryColor = getColor('primary.500'); // Returns '#3B82F6'

// Get spacing value
const mediumSpacing = getSpacing(4); // Returns '1rem'

// Access full theme
const buttonHeight = theme.components.button.height.md; // Returns '2.5rem'
```

## 🚀 Performance Considerations

- All components use Tailwind CSS for optimal bundle size
- Icons and images should be lazy loaded
- Use `React.memo` for frequently re-rendered components
- Implement code splitting for large component libraries

## ♿ Accessibility

- All interactive components support keyboard navigation
- Focus states are clearly visible
- Color contrast meets WCAG AA standards
- Semantic HTML elements used throughout
- ARIA attributes included where necessary

## 📚 Additional Resources

- Figma Design: [Clinical Portal CRM](https://www.figma.com/design/uRLUh1kMSehMQJNlwjyraW/Clinical-Portal-CRM)
- Tailwind CSS: [Documentation](https://tailwindcss.com)
- React Documentation: [react.dev](https://react.dev)
