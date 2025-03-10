# CVE History API

## Overview  
The **CVE History API** provides an interface to fetch, store, and query CVE (Common Vulnerabilities and Exposures) history data from NVD (National Vulnerability Database). This API supports filtering, exporting data to CSV, and JWT-based authentication.

## Authentication  
- The API uses JWT-based authentication for secure access.  
- Users must register and log in to obtain a token.  

## Installation & Setup  

### Prerequisites  
Ensure you have the following installed:  
- Python (3.8 or later)  
- pip (Python package manager)  

### Steps  
1. **Clone the repository:**  
   ```sh
   git clone https://github.com/nnisarggada/nvd-backend
   cd nvd-backend
   ```  

2. **Create a virtual environment:**  
   ```sh
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate     # On Windows
   ```  

3. **Install dependencies:**  
   ```sh
   pip install -r requirements.txt
   ```  

4. **Configure environment variables:**  
   - Copy the sample environment file:  
     ```sh
     cp sample.env .env
     ```
   - Update `.env` with your configuration values.  

5. **Run the FastAPI server:**  
   ```sh
   fastapi dev
   ```  

6. **Access the API documentation:**  
   - Open your browser and visit:  
     - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
     - Redoc UI: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)  

## Endpoints  

### 1. Status Endpoints  

#### `GET /`  
**Summary:** Welcome endpoint to check API availability.  

#### `GET /status`  
**Summary:** Returns the API status.  

### 2. CVE Endpoints  

#### `GET /cves`  
**Summary:** Fetches a list of CVEs with optional filters.  

**Query Parameters:**  
- `page` (integer, default: 1) - Specifies the page number.  
- `cve_id` (string) - Filters results by CVE ID.  
- `event_name` (string) - Filters results by event name.  

**Responses:**  
- `200 OK` - Returns a list of CVEs.  
- `422 Validation Error` - Invalid request parameters.  
- `500 Internal Server Error` - Server failure.  

#### `GET /export`  
**Summary:** Exports filtered CVE data in CSV format.  

**Query Parameters:**  
- `cve_id` (string) - Filters results by CVE ID.  
- `event_name` (string) - Filters results by event name.  

**Responses:**  
- `200 OK` - Returns the exported CSV data.  
- `422 Validation Error` - Invalid request parameters.  
- `500 Internal Server Error` - Server failure.  

#### `GET /stats`  
**Summary:** Fetches CVE-related statistics.  

**Responses:**  
- `200 OK` - Returns statistics.  
- `500 Internal Server Error` - Server failure.  

### 3. Authentication Endpoints  

#### `POST /register`  
**Summary:** Registers a new user.  

**Request Body:**  
- `email` (string, required)  
- `password` (string, required)  

**Responses:**  
- `201 Created` - User successfully registered.  
- `409 Conflict` - Email already in use.  
- `429 Too Many Requests` - Rate limit exceeded.  
- `500 Internal Server Error` - Server failure.  

#### `POST /login`  
**Summary:** Logs in a user and returns a JWT token.  

**Request Body:**  
- `email` (string, required)  
- `password` (string, required)  

**Responses:**  
- `200 OK` - Returns an authentication token.  
- `401 Unauthorized` - Invalid credentials.  `500 Internal Server Error` - Server failure.  

## Features Implemented  
- Filtering CVE data based on parameters.  
- Exporting (filtered) CVE data to CSV.  
- Statistics for the entire CVE history.  
- JWT-based authentication for secure access.  

## Future Scope  
- Implementation of refresh tokens for improved security.
- Support for cookie-based JWT authentication.
- Rate limiting to prevent abuse.
