import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Printer, Download } from "lucide-react";

const PrintableQR = () => {
  const [searchParams] = useSearchParams();
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const qrCacheRef = useRef<Record<string, string>>({});

  const team = searchParams.get("team");
  const baseUrl = searchParams.get("baseUrl") || window.location.origin;

  const teams = useMemo(
    () => (team ? [team] : ["adah", "ruth", "esther", "martha", "electa"]),
    [team]
  );

  const generateQRCodes = async () => {
    setLoading(true);
    setProgress(0);
    const urls: Record<string, string> = {};
    let completedCount = 0;

    const updateProgress = () => {
      completedCount++;
      const progress = (completedCount / teams.length) * 100;
      setProgress(progress);
      console.log(
        `Progress: ${Math.round(progress)}% (${completedCount}/${teams.length})`
      );
    };

    try {
      // Generate QR codes in parallel with caching
      const qrPromises = teams.map(async (teamName) => {
        try {
          const joinUrl = `${baseUrl}/join?team=${teamName}`;
          const cacheKey = `${joinUrl}-${TEAM_COLORS[teamName as keyof typeof TEAM_COLORS]}`;

          // Check cache first
          if (qrCacheRef.current[cacheKey]) {
            console.log(`Using cached QR code for team ${teamName}`);
            updateProgress();
            return {
              teamName,
              qrDataUrl: qrCacheRef.current[cacheKey],
              success: true,
            };
          }

          // Generate new QR code with optimized settings
          const qrDataUrl = await QRCode.toDataURL(joinUrl, {
            width: 200, // Reduced from 300
            margin: 1, // Reduced from 2
            errorCorrectionLevel: "L", // Lowest error correction for speed
            color: {
              dark: TEAM_COLORS[teamName as keyof typeof TEAM_COLORS],
              light: "#FFFFFF",
            },
          });

          // Cache the result
          qrCacheRef.current[cacheKey] = qrDataUrl;

          console.log(`Generated QR code for team ${teamName}`);
          updateProgress();
          return { teamName, qrDataUrl, success: true };
        } catch (error) {
          console.error(`Failed to generate QR code for ${teamName}:`, error);
          updateProgress();
          return { teamName, qrDataUrl: null, success: false };
        }
      });

      // Wait for all QR codes to complete
      const results = await Promise.all(qrPromises);

      // Build URLs object from successful results
      results.forEach(({ teamName, qrDataUrl, success }) => {
        if (success && qrDataUrl) {
          urls[teamName] = qrDataUrl;
        }
      });

      setQrDataUrls(urls);
      console.log("All QR codes generated successfully");
    } catch (error) {
      console.error("Error generating QR codes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQRCodes();
  }, [baseUrl, teams]);

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = () => {
    // For now, just trigger print dialog
    // Could implement actual PDF generation later with libraries like jsPDF
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="mb-4 text-gray-600">Generating QR codes...</p>

          {/* Progress bar */}
          <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Print controls - hidden when printing */}
      <div className="no-print border-b bg-gray-50 p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Eastern Star Trivia - Table QR Codes
          </h1>
          <div className="flex space-x-3">
            <Button
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              onClick={downloadPDF}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Printable content */}
      <div className="mx-auto max-w-4xl p-8">
        {teams.map((teamName) => {
          const teamInfo = TEAMS[teamName as keyof typeof TEAMS];
          const teamColor = TEAM_COLORS[teamName as keyof typeof TEAM_COLORS];
          const qrDataUrl = qrDataUrls[teamName];

          return (
            <div key={teamName} className="page-break mb-12 last:mb-0">
              <Card
                className="p-8 text-center"
                style={{ borderColor: teamColor, borderWidth: "3px" }}
              >
                {/* Header */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center justify-center space-x-3">
                    <Star
                      className="h-12 w-12"
                      style={{ color: teamColor }}
                      fill={teamColor}
                    />
                    <h1
                      className="text-4xl font-bold"
                      style={{ color: teamColor }}
                    >
                      Team {teamInfo.name}
                    </h1>
                  </div>

                  <div
                    className="inline-block rounded-lg px-6 py-3"
                    style={{ backgroundColor: `${teamColor}20` }}
                  >
                    <div className="mb-2 flex items-center justify-center space-x-2">
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span
                        className="text-xl font-bold"
                        style={{ color: teamColor }}
                      >
                        {teamInfo.heroine}
                      </span>
                    </div>
                    <div className="text-gray-600">
                      Symbolizing <strong>{teamInfo.meaning}</strong>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mb-8">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for Team ${teamInfo.name}`}
                      className="mx-auto"
                      style={{ width: "200px", height: "200px" }}
                    />
                  )}
                </div>

                {/* Instructions */}
                <div className="mx-auto max-w-md space-y-4 text-left">
                  <h3 className="text-center text-xl font-bold text-gray-900">
                    How to Join Your Team
                  </h3>

                  <div className="space-y-3 text-gray-700">
                    <div className="flex items-start space-x-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        1
                      </div>
                      <div>
                        <strong>Scan this QR code</strong> with your smartphone
                        camera
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        2
                      </div>
                      <div>
                        <strong>Enter your name</strong> (First name, last
                        initial)
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        3
                      </div>
                      <div>
                        <strong>Wait for the game code</strong> to be announced
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: teamColor }}
                      >
                        4
                      </div>
                      <div>
                        <strong>Enter the 3-letter code</strong> when announced
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-6 rounded-lg p-4 text-center"
                    style={{ backgroundColor: `${teamColor}10` }}
                  >
                    <div
                      className="text-sm font-semibold"
                      style={{ color: teamColor }}
                    >
                      Need help? Ask your table host!
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .page-break {
            page-break-after: always;
          }

          .page-break:last-child {
            page-break-after: auto;
          }

          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableQR;
