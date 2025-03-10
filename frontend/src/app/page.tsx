"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Bar, Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState("");
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({ cve_id: "", event_name: "" });
  const [appliedFilter, setAppliedFilter] = useState({ cve_id: "", event_name: "" });
  const [isDownloading, setIsDownloading] = useState(false);

  const [stats, setStats] = useState<{ cves_per_event: Record<string, number>; cves_over_time: Record<string, number> } | null>(null);
  const [barChartData, setBarChartData] = useState(null);
  const [lineChartData, setLineChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    sessionStorage.removeItem("token");
    router.replace("/login");
  };

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(appliedFilter.cve_id && { cve_id: appliedFilter.cve_id.trim() }),
        ...(appliedFilter.event_name && { event_name: appliedFilter.event_name.trim() }),
      });

      const response = await fetch(`${API_URL}/cves?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      setData(result.cves);
      setTotalPages(result.total_pages);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data. Please try again.");
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [page, appliedFilter, token]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
      );
      const result = await response.json();

      startTransition(() => {
        setStats(result);
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  useEffect(() => {
    if (!stats) return;

    //NOTE: ignore LSP error
    // @ts-expect-error
    if (stats.detail) return;

    const eventLabels = Object.keys(stats.cves_per_event);
    const eventCounts = Object.values(stats.cves_per_event);

    setBarChartData({
      //NOTE: ignore LSP error
      // @ts-expect-error
      labels: eventLabels,
      datasets: [
        {
          label: "Number of CVEs",
          data: eventCounts,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    });

    const sortedDates = Object.keys(stats.cves_over_time).sort();
    const cveCounts = sortedDates.map((date) => stats.cves_over_time[date]);

    setLineChartData({
      //NOTE: ignore LSP error
      // @ts-expect-error
      labels: sortedDates,
      datasets: [
        {
          label: "CVEs Over Time",
          data: cveCounts,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    });
  }, [stats]);

  const applyFilters = () => {
    setAppliedFilter(filter);
    setPage(1);
  };

  const downloadCsv = async () => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams({
        ...(appliedFilter.cve_id && { cve_id: appliedFilter.cve_id.trim() }),
        ...(appliedFilter.event_name && { event_name: appliedFilter.event_name.trim() }),
      });

      const response = await fetch(`${API_URL}/export?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
      );

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "cve_data.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export CSV. Please try again.");
    }
    setIsDownloading(false);
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      logout();
    } else {
      setToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="fixed bg-background inset-0 z-20 h-20 w-full max-w-7xl mx-auto flex items-center justify-between gap-4 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          National Vulnerability Database
        </h1>
        <button onClick={logout} className="aspect-square text-red-500 p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
            />
          </svg>
        </button>
      </div>

      <main className="w-full max-w-7xl mx-auto pt-24 h-full flex flex-col min-h-screen p-4">
        <button
          onClick={downloadCsv}
          disabled={isDownloading}
          className={`mt-4 w-fit bg-green-700 font-bold transition-all duration-300 ease-in-out hover:bg-green-800 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md ${isDownloading ? "animate-pulse cursor-not-allowed" : ""}`}
        >
          {isDownloading ? "Downloading..." : "Download CSV"}
        </button>

        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="filter-cve_id" className="font-bold">Filter by CVE ID</label>
            <input
              id="filter-cve_id"
              type="text"
              placeholder="Filter by CVE ID"
              className="border border-secondary p-2 rounded-md"
              value={filter.cve_id}
              onChange={(e) => setFilter({ ...filter, cve_id: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="filter-event_name" className="font-bold">Filter by Event Name</label>
            <input
              id="filter-event_name"
              type="text"
              placeholder="Filter by Event Name"
              className="border border-secondary p-2 rounded-md"
              value={filter.event_name}
              onChange={(e) => setFilter({ ...filter, event_name: e.target.value })}
            />
          </div>
          <button
            onClick={applyFilters}
            className="bg-primary h-fit mt-auto font-bold transition-all duration-300 ease-in-out hover:bg-secondary text-white p-4 rounded-md"
          >
            Apply Filters
          </button>
        </form>

        <div className="overflow-x-auto mt-4 dark:bg-primary shadow-md rounded-lg">
          <table className="min-w-full max-h-4 divide-y divide-secondary-accent">
            <thead className="bg-primary-accent text-white">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">CVE ID</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Event Name</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Source Identifier</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-accent max-h-40 overflow-y-auto">
              {data?.length > 0 ? (
                data.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">{item.cve_id}</td>
                    <td className="px-4 py-2">{item.event_name}</td>
                    <td className="px-4 py-2">{item.source_identifier}</td>
                    <td className="px-4 py-2">{new Date(item.created).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <pre className="text-xs whitespace-pre-wrap dark:bg-primary bg-background p-2 rounded">
                        {item.details.length > 0
                          ? item.details.map((d: any) => `${d.action}: ${d.type} -> ${d.newValue || d.oldValue}`).join("\n")
                          : "No details found"}
                      </pre>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-center">No data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="dark:bg-primary-accent bg-secondary px-4 py-2 rounded disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="dark:bg-primary-accent bg-secondary px-4 py-2 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {loading && (
          <h2 className="text-lg mx-4 mt-8 font-semibold text-gray-900 dark:text-white">Loading Charts...</h2>
        )}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

          {loading ? (
            <div className="p-4 bg-background rounded-lg shadow-md w-full animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            barChartData && (
              <div className="p-4 bg-background rounded-lg shadow-md w-full">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">CVEs per Event Name</h2>
                <div className="w-full h-80">
                  <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            )
          )}

          {loading ? (
            <div className="p-4 bg-background rounded-lg shadow-md w-full animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
              <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ) : (
            lineChartData && (
              <div className="p-4 bg-background rounded-lg shadow-md w-full">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">CVEs Over Time</h2>
                <div className="w-full h-80">
                  <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}
