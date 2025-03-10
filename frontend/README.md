# National Vulnerability Database Frontend

## Overview
The **National Vulnerability Database Frontend** is a web-based UI built with **Next.js** and **Tailwind CSS** to interact with the CVE History API. It provides an intuitive interface for querying, filtering, and exporting CVE data while ensuring secure authentication through JWT-based login.

## Features Implemented
- Color scheme based on users' preferred color scheme (dark or light).
- User authentication via JWT.
- Display and filtering of CVE data.
- Export functionality to CSV.
- Charts using `react-chartjs-2`.
- Responsive and accessible design using Tailwind CSS.

## Installation & Setup

### Prerequisites
Ensure you have the following installed:
- Node.js (Latest LTS version recommended)
- npm

### Steps
1. Clone the repository:
   ```sh
   git clone https://github.com/nnisarggada/nvd-frontend
   cd nvd-frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure Environment Variables:  
- Copy the sample environment file:  
  ```sh
  cp sample.env .env.local
  ```
- Update `.env.local` with your configuration values.
4. Start the development server:
   ```sh
   npm run dev
   ```

## Future Scope
- Implementing a better UI with a consistent theme.
- Improved loading indicators for better user experience.
- Caching mechanism for optimizing repeated requests.
