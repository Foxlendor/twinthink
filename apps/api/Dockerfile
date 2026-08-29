FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements file first for caching
COPY apps/api/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the packages directory which contains the shared validation logic
COPY packages/ ./packages/

# Copy the api directory
COPY apps/api/ ./apps/api/

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "-m", "uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
