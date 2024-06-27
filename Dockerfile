# Base Image
FROM --platform=linux/amd64 node:lts-alpine

# Working directory
WORKDIR /usr/src/app

# Install system dependencies for ffmpeg (Alpine Linux)
RUN apk add --no-cache ffmpeg

# Copy project files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the application
RUN npm run build

# Verify the build output
RUN ls -la /usr/src/app/dist

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", "/usr/src/app/dist/app.js"]