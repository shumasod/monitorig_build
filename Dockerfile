version: '3'
services:
  elasticsearch:
    build:
      context: .
      dockerfile: elasticsearch/Dockerfile