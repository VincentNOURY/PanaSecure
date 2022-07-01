FROM node:17
WORKDIR /app
COPY . /app
RUN mkdir download config
RUN echo "{'sessions_secret': '', 'postgresdata': {'user': 'username', 'host': 'ip', 'database': 'databnese_name', 'password': 'password', 'port': 5432}}" > config/config.json
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
