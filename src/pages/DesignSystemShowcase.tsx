/**
 * Design System Showcase Page
 * Demonstrates all design system components and their usage
 */

import React from 'react';
import {
  Container,
  Grid,
  Stack,
  Flex,
  Button,
  Card,
  InputField,
  Typography,
  Badge,
  Avatar,
  Divider,
} from '../components';

const DesignSystemShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="xl">
        <Stack direction="vertical" spacing={12}>
          {/* Header */}
          <Stack direction="vertical" spacing={2} align="center">
            <Typography variant="h1" color="primary" align="center">
              Design System Showcase
            </Typography>
            <Typography variant="body1" color="secondary" align="center">
              Comprehensive design system based on Clinical Portal CRM Figma design
            </Typography>
          </Stack>

          {/* Typography Section */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Typography
            </Typography>
            <Stack direction="vertical" spacing={4}>
              <Typography variant="h1">Heading 1 - 48px</Typography>
              <Typography variant="h2">Heading 2 - 36px</Typography>
              <Typography variant="h3">Heading 3 - 30px</Typography>
              <Typography variant="h4">Heading 4 - 24px</Typography>
              <Typography variant="h5">Heading 5 - 20px</Typography>
              <Typography variant="h6">Heading 6 - 18px</Typography>
              <Typography variant="body1">Body 1 - Regular body text (16px)</Typography>
              <Typography variant="body2">Body 2 - Smaller body text (14px)</Typography>
              <Typography variant="caption">Caption - Small supporting text (12px)</Typography>
              <Typography variant="overline">Overline - Labels and tags</Typography>
            </Stack>
          </Card>

          {/* Buttons Section */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Buttons
            </Typography>
            
            <Stack direction="vertical" spacing={6}>
              <div>
                <Typography variant="h6" className="mb-3">Variants</Typography>
                <Flex gap={3} wrap="wrap">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="success">Success</Button>
                  <Button variant="warning">Warning</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </Flex>
              </div>

              <div>
                <Typography variant="h6" className="mb-3">Sizes</Typography>
                <Flex gap={3} align="center" wrap="wrap">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </Flex>
              </div>

              <div>
                <Typography variant="h6" className="mb-3">With Icons & Loading</Typography>
                <Flex gap={3} wrap="wrap">
                  <Button leftIcon={<span>📧</span>}>With Left Icon</Button>
                  <Button rightIcon={<span>→</span>}>With Right Icon</Button>
                  <Button isLoading>Loading Button</Button>
                </Flex>
              </div>
            </Stack>
          </Card>

          {/* Badges Section */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Badges
            </Typography>
            <Stack direction="vertical" spacing={4}>
              <div>
                <Typography variant="h6" className="mb-3">Variants</Typography>
                <Flex gap={2} wrap="wrap">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="gray">Default</Badge>
                </Flex>
              </div>

              <div>
                <Typography variant="h6" className="mb-3">Sizes</Typography>
                <Flex gap={2} align="center" wrap="wrap">
                  <Badge size="sm">Small</Badge>
                  <Badge size="md">Medium</Badge>
                  <Badge size="lg">Large</Badge>
                </Flex>
              </div>

              <div>
                <Typography variant="h6" className="mb-3">With Dot Indicator</Typography>
                <Flex gap={2} wrap="wrap">
                  <Badge variant="success" dot>Online</Badge>
                  <Badge variant="warning" dot>Away</Badge>
                  <Badge variant="danger" dot>Busy</Badge>
                  <Badge variant="gray" dot>Offline</Badge>
                </Flex>
              </div>
            </Stack>
          </Card>

          {/* Avatars Section */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Avatars
            </Typography>
            <Stack direction="vertical" spacing={4}>
              <div>
                <Typography variant="h6" className="mb-3">Sizes</Typography>
                <Flex gap={3} align="center" wrap="wrap">
                  <Avatar name="John Doe" size="sm" />
                  <Avatar name="Jane Smith" size="md" />
                  <Avatar name="Bob Wilson" size="lg" />
                  <Avatar name="Alice Brown" size="xl" />
                </Flex>
              </div>

              <div>
                <Typography variant="h6" className="mb-3">With Status</Typography>
                <Flex gap={3} align="center" wrap="wrap">
                  <Avatar name="User 1" status="online" />
                  <Avatar name="User 2" status="away" />
                  <Avatar name="User 3" status="busy" />
                  <Avatar name="User 4" status="offline" />
                </Flex>
              </div>
            </Stack>
          </Card>

          {/* Input Fields Section */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Input Fields
            </Typography>
            <Stack direction="vertical" spacing={4}>
              <InputField
                label="Default Input"
                placeholder="Enter text"
                helperText="This is helper text"
              />
              
              <InputField
                label="With Left Icon"
                placeholder="Search..."
                leftIcon={<span>🔍</span>}
              />
              
              <InputField
                label="With Error"
                placeholder="Enter email"
                error="Invalid email address"
              />
              
              <InputField
                label="Filled Variant"
                variant="filled"
                placeholder="Enter text"
              />

              <Grid cols={{ xs: 1, md: 2 }} gap={4}>
                <InputField
                  label="Small Size"
                  size="sm"
                  placeholder="Small input"
                />
                <InputField
                  label="Large Size"
                  size="lg"
                  placeholder="Large input"
                />
              </Grid>
            </Stack>
          </Card>

          {/* Cards Section */}
          <div>
            <Typography variant="h3" className="mb-6">
              Cards
            </Typography>
            <Grid cols={{ xs: 1, md: 2, lg: 4 }} gap={4}>
              <Card variant="default" padding="md">
                <Typography variant="h6" className="mb-2">Default Card</Typography>
                <Typography variant="body2" color="secondary">
                  Standard card with shadow and border
                </Typography>
              </Card>

              <Card variant="elevated" padding="md">
                <Typography variant="h6" className="mb-2">Elevated Card</Typography>
                <Typography variant="body2" color="secondary">
                  Card with more prominent shadow
                </Typography>
              </Card>

              <Card variant="outlined" padding="md">
                <Typography variant="h6" className="mb-2">Outlined Card</Typography>
                <Typography variant="body2" color="secondary">
                  Card with emphasized border
                </Typography>
              </Card>

              <Card variant="flat" padding="md" hoverable>
                <Typography variant="h6" className="mb-2">Hoverable Card</Typography>
                <Typography variant="body2" color="secondary">
                  Try hovering over this card
                </Typography>
              </Card>
            </Grid>
          </div>

          {/* Layout Components Section */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Layout Components
            </Typography>

            <Stack direction="vertical" spacing={6}>
              <div>
                <Typography variant="h6" className="mb-3">Stack - Vertical</Typography>
                <Stack direction="vertical" spacing={2}>
                  <Card padding="sm">Item 1</Card>
                  <Card padding="sm">Item 2</Card>
                  <Card padding="sm">Item 3</Card>
                </Stack>
              </div>

              <Divider />

              <div>
                <Typography variant="h6" className="mb-3">Stack - Horizontal</Typography>
                <Stack direction="horizontal" spacing={2}>
                  <Card padding="sm">Item 1</Card>
                  <Card padding="sm">Item 2</Card>
                  <Card padding="sm">Item 3</Card>
                </Stack>
              </div>

              <Divider />

              <div>
                <Typography variant="h6" className="mb-3">Flex - Space Between</Typography>
                <Flex justify="between" align="center">
                  <Typography variant="body1">Left Content</Typography>
                  <Button size="sm">Action</Button>
                </Flex>
              </div>

              <Divider label="Grid Layout" />

              <div>
                <Typography variant="h6" className="mb-3">Responsive Grid</Typography>
                <Grid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }} gap={3}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <Card key={num} padding="md" variant="flat">
                      <Typography variant="body2" align="center">
                        Grid Item {num}
                      </Typography>
                    </Card>
                  ))}
                </Grid>
              </div>
            </Stack>
          </Card>

          {/* Color Palette */}
          <Card padding="lg">
            <Typography variant="h3" className="mb-6">
              Color Palette
            </Typography>
            <Stack direction="vertical" spacing={6}>
              {/* Primary Colors */}
              <div>
                <Typography variant="h6" className="mb-3">Primary</Typography>
                <Flex gap={2} wrap="wrap">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="flex-1 min-w-[80px]">
                      <div className={`h-16 rounded-lg bg-primary-${shade} mb-2`} />
                      <Typography variant="caption" align="center">{shade}</Typography>
                    </div>
                  ))}
                </Flex>
              </div>

              {/* Success Colors */}
              <div>
                <Typography variant="h6" className="mb-3">Success</Typography>
                <Flex gap={2} wrap="wrap">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="flex-1 min-w-[80px]">
                      <div className={`h-16 rounded-lg bg-success-${shade} mb-2`} />
                      <Typography variant="caption" align="center">{shade}</Typography>
                    </div>
                  ))}
                </Flex>
              </div>

              {/* Warning Colors */}
              <div>
                <Typography variant="h6" className="mb-3">Warning</Typography>
                <Flex gap={2} wrap="wrap">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="flex-1 min-w-[80px]">
                      <div className={`h-16 rounded-lg bg-warning-${shade} mb-2`} />
                      <Typography variant="caption" align="center">{shade}</Typography>
                    </div>
                  ))}
                </Flex>
              </div>

              {/* Danger Colors */}
              <div>
                <Typography variant="h6" className="mb-3">Danger</Typography>
                <Flex gap={2} wrap="wrap">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                    <div key={shade} className="flex-1 min-w-[80px]">
                      <div className={`h-16 rounded-lg bg-danger-${shade} mb-2`} />
                      <Typography variant="caption" align="center">{shade}</Typography>
                    </div>
                  ))}
                </Flex>
              </div>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </div>
  );
};

export default DesignSystemShowcase;
