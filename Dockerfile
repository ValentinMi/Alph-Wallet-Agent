# Use the official Node.js 22 image as the base image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json if available
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Run the script with environment variables loaded from the .env file
CMD ["node" ,"index.js"]
