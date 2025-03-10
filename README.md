# CVE History API & National Vulnerability Database Frontend

## Overview  
This repository provides a complete solution for interacting with CVE (Common Vulnerabilities and Exposures) data through a backend API and a frontend interface. The **CVE History API** enables secure access to CVE data with JWT-based authentication and supports querying, filtering, and exporting CVE data. The **National Vulnerability Database Frontend** is a web-based user interface built with **Next.js** and **Tailwind CSS**, designed to interact with the backend API. Both the backend and frontend are now included in a single repository and can be managed using Docker Compose for easier setup and deployment.

---
> [!NOTE]
> The startup process may take some time (approximately 5 minutes), as the database will be initialized with all 200,000 CVE entries. Please be patient while the backend initializes the data.
---

## Features Implemented  
- **Backend**: Filtering CVE data based on parameters, exporting filtered CVE data to CSV, statistics for the entire CVE history, and JWT-based authentication for secure access.  
- **Frontend**: Color scheme based on users' preferred color scheme (dark or light), user authentication via JWT, display and filtering of CVE data, export functionality to CSV, charts using `react-chartjs-2`, and responsive design using Tailwind CSS.  
- **Docker Compose**: Both frontend and backend are packaged together, enabling you to run the entire application stack with Docker Compose.

---

## Future Scope  

### For the CVE History API (Backend)  
- Implementation of refresh tokens for improved security.  
- Support for cookie-based JWT authentication.  
- Rate limiting to prevent abuse.  

### For the National Vulnerability Database Frontend (UI)  
- Implementing a better UI with a consistent theme.  
- Improved loading indicators for better user experience.  
- Caching mechanism for optimizing repeated requests.

---

## CVE History API (Backend)

### Overview  
The **CVE History API** provides an interface to fetch, store, and query CVE history data from the National Vulnerability Database (NVD). It supports filtering CVE data, exporting it to CSV, and JWT-based authentication.

### Authentication  
- The API uses **JWT-based authentication** for secure access.  
- Users must register and log in to obtain a token.

---

### Installation & Setup  

#### Prerequisites  
Ensure you have the following installed:
- Docker  
- Docker Compose

#### Steps  
1. **Clone the repository:**  
   ```sh
   git clone https://github.com/nnisarggada/nvd
   cd nvd
   ```

2. **Set up environment variables:**  
   - Copy the sample environment file:  
     ```sh
     cp backend/sample.env backend/.env
     ```
   - Update `backend/.env` with your configuration values.

3. **Start the application with Docker Compose:**  
   - From the root directory of the repository, run:
     ```sh
     docker-compose up --build
     ```

4. **Access the API documentation:**  
   - Once the containers are up and running, open your browser and visit:  
     - Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)  
     - Redoc UI: [http://localhost:8000/redoc](http://localhost:8000/redoc)  

---

### Endpoints  

#### 1. Status Endpoints  

- **`GET /`**  
  - **Summary:** Welcome endpoint to check API availability.  

- **`GET /status`**  
  - **Summary:** Returns the API status.  

#### 2. CVE Endpoints  

- **`GET /cves`**  
  - **Summary:** Fetches a list of CVEs with optional filters.  
  - **Query Parameters:**  
    - `page` (integer, default: 1) - Specifies the page number.  
    - `cve_id` (string) - Filters results by CVE ID.  
    - `event_name` (string) - Filters results by event name.  

- **`GET /export`**  
  - **Summary:** Exports filtered CVE data in CSV format.  
  - **Query Parameters:**  
    - `cve_id` (string) - Filters results by CVE ID.  
    - `event_name` (string) - Filters results by event name.  

- **`GET /stats`**  
  - **Summary:** Fetches CVE-related statistics.  

#### 3. Authentication Endpoints  

- **`POST /register`**  
  - **Summary:** Registers a new user.  
  - **Request Body:**  
    - `email` (string, required)  
    - `password` (string, required)  

- **`POST /login`**  
  - **Summary:** Logs in a user and returns a JWT token.  
  - **Request Body:**  
    - `email` (string, required)  
    - `password` (string, required)  

---

## National Vulnerability Database Frontend (UI)

### Overview  
The **National Vulnerability Database Frontend** is a web-based user interface built with **Next.js** and **Tailwind CSS**. It provides an intuitive way to query, filter, and export CVE data while ensuring secure authentication through JWT-based login.

---

### Installation & Setup  

#### Prerequisites  
Ensure you have the following installed:
- Docker  
- Docker Compose

#### Steps  
1. **Clone the repository:**  
   ```sh
   git clone https://github.com/nnisarggada/nvd
   cd nvd
   ```

2. **Set up environment variables:**  
   - Copy the sample environment file:  
     ```sh
     cp frontend/sample.env frontend/.env.local
     ```
   - Update `frontend/.env.local` with your configuration values.

3. **Start the application with Docker Compose:**  
   - From the root directory of the repository, run:
     ```sh
     docker-compose up --build
     ```

4. **Access the frontend:**  
   - Open your browser and visit:  
     - [http://localhost:3000](http://localhost:3000) to access the web interface.  

---

## Docker Compose Setup

With **Docker Compose**, both the frontend and backend services are managed together, simplifying the setup process. You can run the entire application stack (frontend + backend) by executing the following command:

```sh
docker-compose up --build
```

This will:
- Build and start the backend service (FastAPI with JWT authentication).
- Build and start the frontend service (Next.js with Tailwind CSS).
- Ensure both services communicate with each other using the defined network.
