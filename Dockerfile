# Base Image
FROM --platform=linux/amd64 node:lts-alpine

# Working directory
WORKDIR /usr/src/app

# Install system dependencies for ffmpeg (Alpine Linux)
RUN apk add --no-cache ffmpeg

# Copy project files
COPY package*.json ./

# Install Node.js dependencies with reliability flags
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install --network-timeout=100000 --retry=3 --no-audit

# Copy the rest of your application code
COPY . .

# Build the application
RUN npm run build

# Verify the build output
RUN ls -la /usr/src/app/dist

# Expose the port - change to 8080 for Cloud Run
EXPOSE 8080

# Start the app
CMD ["node", "/usr/src/app/dist/app.js"]