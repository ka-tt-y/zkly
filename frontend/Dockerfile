FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps
COPY . .

# Vite embeds VITE_* env vars at build time, so they must be available here.
# In Docker, these come from build args (set in docker-compose.yml).
ARG VITE_ZKLY_API_URL
ARG VITE_XEROSTARK_API_URL
ENV VITE_ZKLY_API_URL=$VITE_ZKLY_API_URL
ENV VITE_XEROSTARK_API_URL=$VITE_XEROSTARK_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
