FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for scapy/tshark
RUN apt-get update && apt-get install -y --no-install-recommends \
    tcpdump \
    tshark \
    libpcap-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY apps/ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps/ai-service/ .

# Copy rules
COPY rules/ /app/rules/

# Create directories
RUN mkdir -p /app/uploads /app/models /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
