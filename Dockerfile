# Use official Node.js image as base
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy only package.json first to leverage Docker caching
COPY package.json ./

# Generate a fresh package-lock.json
RUN npm install --package-lock-only

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the source code
COPY . .

# Set permissions and entrypoint
RUN chmod +x /app/entrypoint.sh

# Define the action entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
