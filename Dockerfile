FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Set build-time environment variables
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_API_URL

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the application (react-scripts builds to /app/build folder)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage (react-scripts outputs to 'build' not 'dist')
COPY --from=build /app/build /usr/share/nginx/html

# Create nginx config for React Router (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]