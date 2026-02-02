FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Make startup script executable
RUN chmod +x start.sh

EXPOSE 5000

# IMPORTANT: run startup script
CMD ["sh", "./start.sh"]
