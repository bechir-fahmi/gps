# Stage 1: Build the Angular app
FROM node:20 AS build

WORKDIR /app

ARG ENV
ENV ENVIRONMENT=${ENV}

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy the script to modify the CSS
COPY scripts/modify-theme.sh /modify-theme.sh

# Run the script to modify the CSS file
RUN chmod +x /modify-theme.sh && /modify-theme.sh

# Build the Angular application
RUN npm run build

# Stage 2: Serve the Angular app using Nginx
FROM nginx:alpine

# Copy built Angular app to Nginx's html directory
COPY --from=build /app/dist/amena/browser /usr/share/nginx/html

# Copy custom nginx configuration
COPY ./nginx.conf ./etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
