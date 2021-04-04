#
# Dockerfile for:  bm98ch/fsimpngtiles
#
# Uses the official 'node' LTS image based on alpine
#   node:14.15.3-alpine3.11  as of 20201227
#
# start docker desktop - create shell (Powershell in Win)
# head to this folder
# Build: docker build --tag bm98ch/fsimpngtiles:1.1 .
# Export tar: docker save -o ./fsimpngtiles-1.1.tar bm98ch/fsimpngtiles:1.1
# 
# PortMap:  from  8080/tcp   Web Server
# PortMap:  from  8081/tcp   Tile Server
# Volume:   /usr/src/app/www/src
#
FROM node:lts-alpine

LABEL version="1.1"
LABEL imagename="bm98ch/fsimpngtiles"
LABEL description="Simple tilelive/tessera based tile webserver for the Flightsim serves PNG tiles"
LABEL attribution="PNG original maps Courtesy of the University of Texas Libraries, The University of Texas at Austin."
LABEL maintainer="github@mail.burri-web.org"

# Create app directory for the website node files
WORKDIR /usr/src/app

# Install app dependencies from package.json
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source- 
COPY . .

# Expose the http port for the server (defined in the start section of package.json)
EXPOSE 8080/tcp
EXPOSE 8081/tcp
# Expose the www volume for later mapping - NOT USED
VOLUME /usr/src/app/www/src

# the start  command with the start section of package.json
CMD [ "npm", "run", "start" ]

#EOD
