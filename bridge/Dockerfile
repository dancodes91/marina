FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/marina_service ./marina_service
COPY bridge/main.py ./main.py

ENV PYTHONPATH=/app

CMD ["python", "main.py"]
