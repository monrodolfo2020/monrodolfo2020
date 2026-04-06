FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/data/uploads /app/data/outputs

ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV UPLOAD_DIR=/app/data/uploads
ENV OUTPUT_DIR=/app/data/outputs

EXPOSE 8080
CMD ["python", "app.py"]
