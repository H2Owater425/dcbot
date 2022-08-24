FROM node:lts-alpine
WORKDIR /application
COPY package.json /application
COPY tsconfig.json /application
COPY schema.prisma /application
COPY ./distribution/ /application/distribution/
RUN npm install --force --omit=dev
CMD ["node", "-r", "tsconfig-paths/register", "distribution/application.js"]
EXPOSE 80