FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_MARINA_SLUG=your-dealership-name
ARG NEXT_PUBLIC_MARINA_NAME=Your Dealership Name
ARG NEXT_PUBLIC_MARINA_SUBTITLE=Service & storage portal
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MARINA_SLUG=$NEXT_PUBLIC_MARINA_SLUG
ENV NEXT_PUBLIC_MARINA_NAME=$NEXT_PUBLIC_MARINA_NAME
ENV NEXT_PUBLIC_MARINA_SUBTITLE=$NEXT_PUBLIC_MARINA_SUBTITLE
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
