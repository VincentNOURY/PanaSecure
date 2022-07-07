FROM node:17
ENV sessions_secret ""
ENV db_user "postgres"
ENV db_host "localhost"
ENV db_database ""
ENV db_password ""
ENV db_port 5432
ENV salt ""
ENV salt_files ""
WORKDIR /app
COPY . /app
RUN mkdir download config
RUN echo "{\"sessions_secret\": \"\", \"postgresdata\": {\"user\": \"username\", \"host\": \"ip\", \"database\": \"databnese_name\", \"password\": \"password\", \"port\": 5432}}" > config/config.json
RUN npm install
EXPOSE 3000
CMD ["sh", "-c", "node app.js ${sessions_secret} ${db_user} ${db_host} ${db_database} ${db_password} ${db_port}"]
