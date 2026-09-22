#!/bin/bash

cd ../backend

aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com
#docker build -t pdf-extractor-backend .
#docker tag pdf-extractor-backend:latest 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest
#docker push 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest
docker buildx build \
  --platform linux/amd64 \
  --push \
  -t 504233295989.dkr.ecr.ap-northeast-2.amazonaws.com/pdf-extractor-backend:latest \
  .