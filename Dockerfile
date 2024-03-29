# Base Image
# FROM node:lts-alpine
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

# Expose the port 
EXPOSE 3000

# Start the app
CMD ["node", "app.js"] 
