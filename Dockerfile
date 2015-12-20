FROM node:4

EXPOSE 8000
ENV PORT 8000
WORKDIR /app

ADD ./ /app/
RUN npm install

CMD ["npm", "start"]
