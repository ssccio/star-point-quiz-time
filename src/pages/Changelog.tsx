import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCommit, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChangelogEntry {
  hash: string;
  shortHash: string;
  date: string;
  message: string;
  author: string;
  timestamp: number;
}

export default function Changelog() {
  const navigate = useNavigate();
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChangelog();
  }, []);

  const loadChangelog = async () => {
    try {
      // Try to load the generated changelog
      const response = await fetch("/changelog.json");
      if (response.ok) {
        const data = await response.json();
        setChangelog(data.commits || []);
      } else {
        // Fallback if no changelog file exists yet
        setError(
          "Changelog data not available yet. Will be generated on next deployment."
        );
      }
    } catch (err) {
      console.error("Failed to load changelog:", err);
      setError("Failed to load changelog data.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCommitType = (message: string) => {
    const match = message.match(
      /^(feat|fix|docs|debug|refactor|style|test|chore|perf)(?:\(.+\))?: /
    );
    return match ? match[1] : null;
  };

  const getCommitTypeColor = (type: string | null) => {
    switch (type) {
      case "feat":
        return "bg-green-100 text-green-800 border-green-200";
      case "fix":
        return "bg-red-100 text-red-800 border-red-200";
      case "debug":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "docs":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "refactor":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "perf":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const isAiGenerated = (message: string) => {
    return (
      message.includes("🤖 Generated with [Claude Code]") ||
      message.includes("Co-Authored-By: Claude")
    );
  };

  const cleanCommitMessage = (message: string) => {
    // Remove the AI metadata for display
    return message
      .split("\n")[0] // Take first line only
      .replace(/🤖.*$/, "")
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="mx-auto max-w-4xl space-y-6 pt-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Changelog</h1>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">Loading changelog...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6 pt-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Changelog</h1>
          <Badge variant="outline" className="text-sm">
            Recent Updates
          </Badge>
        </div>

        <div className="mb-6 text-gray-600">
          Track recent changes, bug fixes, and new features deployed to the
          application.
        </div>

        {error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-orange-600">
                <Clock className="mx-auto mb-2 h-8 w-8" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {changelog.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No changelog entries available yet.
                </CardContent>
              </Card>
            ) : (
              changelog.map((entry) => {
                const commitType = getCommitType(entry.message);
                const aiGenerated = isAiGenerated(entry.message);

                return (
                  <Card
                    key={entry.hash}
                    className="border-l-4 border-l-indigo-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center space-x-3">
                            {commitType && (
                              <Badge
                                variant="outline"
                                className={getCommitTypeColor(commitType)}
                              >
                                {commitType}
                              </Badge>
                            )}
                            {aiGenerated && (
                              <Badge
                                variant="outline"
                                className="border-blue-200 bg-blue-50 text-blue-700"
                              >
                                🤖 AI-Assisted
                              </Badge>
                            )}
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <GitCommit className="h-4 w-4" />
                              <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                                {entry.shortHash}
                              </code>
                            </div>
                          </div>

                          <h3 className="mb-2 font-semibold text-gray-900">
                            {cleanCommitMessage(entry.message)}
                          </h3>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(entry.timestamp)}</span>
                            </div>
                            <span>by {entry.author}</span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://github.com/ssccio/star-point-quiz-time/commit/${entry.hash}`,
                              "_blank"
                            )
                          }
                          className="ml-4"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-500">
              This changelog is automatically updated with each deployment.
              <br />
              Last updated:{" "}
              {changelog.length > 0
                ? formatDate(changelog[0]?.timestamp)
                : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
