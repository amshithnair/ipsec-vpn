# ── Build stage ──
FROM golang:1.23-alpine AS builder

WORKDIR /build

RUN apk add --no-cache git curl

COPY apps/backend/go.mod apps/backend/go.sum ./
RUN go mod download

COPY apps/backend/ .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/server ./cmd/server

# ── Runtime stage ──
FROM alpine:3.20

RUN apk add --no-cache ca-certificates curl tzdata

WORKDIR /app

COPY --from=builder /build/server .

RUN mkdir -p /app/uploads /app/data

EXPOSE 8080

CMD ["./server"]
