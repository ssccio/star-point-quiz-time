import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Plus,
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import yaml from "js-yaml";
import { questionSetService, type QuestionSet } from "@/lib/questionSetService";
import type { Question } from "@/types/game";

interface ParsedYAML {
  metadata: {
    title: string;
    description: string;
    difficulty: string;
    category: string;
    version?: string;
  };
  questions: Array<{
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    correctAnswer: string;
    explanation?: string;
  }>;
}

export function QuestionSetManager() {
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedYAML | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [setToDelete, setSetToDelete] = useState<QuestionSet | null>(null);
  const [uploadError, setUploadError] = useState<string>("");

  // Load existing question sets
  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      const sets = await questionSetService.getQuestionSets(true); // Include inactive
      setQuestionSets(sets);
    } catch (error) {
      console.error("Failed to load question sets:", error);
      toast.error("Failed to load question sets");
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
      toast.error("Please select a YAML file (.yaml or .yml)");
      return;
    }

    setSelectedFile(file);
    setUploadError("");

    // Parse the YAML file
    try {
      const text = await file.text();
      const data = yaml.load(text) as ParsedYAML;

      // Validate the structure
      if (!data.metadata || !data.questions) {
        throw new Error(
          "Invalid YAML structure. Must have 'metadata' and 'questions' sections."
        );
      }

      if (!data.metadata.title || !data.metadata.description) {
        throw new Error("Metadata must include 'title' and 'description'.");
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Questions must be a non-empty array.");
      }

      // Validate each question
      data.questions.forEach((q, index) => {
        if (!q.question || !q.options || !q.correctAnswer) {
          throw new Error(`Question ${index + 1} is missing required fields.`);
        }
        if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
          throw new Error(
            `Question ${index + 1} has invalid correct answer. Must be A, B, C, or D.`
          );
        }
      });

      setParsedData(data);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to parse YAML:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to parse YAML file"
      );
      toast.error("Failed to parse YAML file");
      setSelectedFile(null);
      setParsedData(null);
    }
  };

  const handleUpload = async () => {
    if (!parsedData) return;

    setLoading(true);
    try {
      // Check if set already exists
      const existingSet = questionSets.find(
        (s) => s.name === parsedData.metadata.title
      );
      if (existingSet) {
        toast.error(
          `Question set "${parsedData.metadata.title}" already exists`
        );
        setLoading(false);
        return;
      }

      // Convert to Question format
      const questions: Question[] = parsedData.questions.map((q, index) => ({
        id: (index + 1).toString(),
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer as "A" | "B" | "C" | "D",
        explanation: q.explanation || "",
      }));

      // Create the question set
      await questionSetService.createQuestionSet(
        parsedData.metadata.title,
        parsedData.metadata.description,
        (parsedData.metadata.difficulty || "mixed") as
          | "easy"
          | "medium"
          | "hard"
          | "mixed",
        parsedData.metadata.category || "general",
        questions
      );

      toast.success(`Successfully uploaded "${parsedData.metadata.title}"`);

      // Reset and reload
      setSelectedFile(null);
      setParsedData(null);
      setShowPreview(false);
      loadQuestionSets();

      // Clear file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Failed to upload question set:", error);
      toast.error("Failed to upload question set");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!setToDelete) return;

    setLoading(true);
    try {
      await questionSetService.deleteQuestionSet(setToDelete.id);
      toast.success(`Deleted "${setToDelete.name}"`);
      setShowDeleteDialog(false);
      setSetToDelete(null);
      loadQuestionSets();
    } catch (error) {
      console.error("Failed to delete question set:", error);
      toast.error("Failed to delete question set");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (set: QuestionSet) => {
    try {
      await questionSetService.updateQuestionSet(set.id, {
        is_active: !set.is_active,
      });
      toast.success(
        `${set.is_active ? "Deactivated" : "Activated"} "${set.name}"`
      );
      loadQuestionSets();
    } catch (error) {
      console.error("Failed to update question set:", error);
      toast.error("Failed to update question set");
    }
  };

  const downloadSampleYAML = () => {
    const sample = `metadata:
  title: "Sample Question Set"
  description: "An example question set for the Eastern Star Quiz"
  difficulty: "mixed"
  category: "eastern-star"
  version: "1.0"

questions:
  - question: "What year was the Order of the Eastern Star founded?"
    options:
      A: "1850"
      B: "1868"
      C: "1874"
      D: "1890"
    correctAnswer: "A"
    explanation: "The Order of the Eastern Star was founded in 1850 by Rob Morris."

  - question: "Who is known as the 'Master Builder' of the Order?"
    options:
      A: "Robert Macoy"
      B: "Rob Morris"
      C: "Willis D. Engle"
      D: "Robert Morris"
    correctAnswer: "B"
    explanation: "Rob Morris is known as the 'Master Builder' of the Order of the Eastern Star."`;

    const blob = new Blob([sample], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-question-set.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-6xl space-y-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Question Set Manager
            </h1>
            <p className="mt-1 text-gray-600">
              Upload and manage quiz question sets
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </div>

        {/* Upload Section */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">
            Upload New Question Set
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select YAML File</Label>
              <div className="mt-2 flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={downloadSampleYAML}
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Sample YAML
                </Button>
              </div>
              {uploadError && (
                <p className="mt-2 text-sm text-red-600">{uploadError}</p>
              )}
            </div>

            {selectedFile && !uploadError && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                {selectedFile.name}
                {parsedData && (
                  <Badge variant="outline" className="ml-2">
                    {parsedData.questions.length} questions
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Existing Question Sets */}
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Existing Question Sets</h2>

          {questionSets.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No question sets uploaded yet</p>
              <p className="mt-2 text-sm">Upload a YAML file to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionSets.map((set) => (
                  <TableRow key={set.id}>
                    <TableCell className="font-medium">{set.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {set.description}
                    </TableCell>
                    <TableCell>{set.question_count}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{set.difficulty}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={set.is_active ? "default" : "secondary"}>
                        {set.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(set)}
                        >
                          {set.is_active ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSetToDelete(set);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Question Set</DialogTitle>
              <DialogDescription>
                Review the questions before uploading to the database
              </DialogDescription>
            </DialogHeader>

            {parsedData && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{parsedData.metadata.title}</h3>
                  <p className="text-sm text-gray-600">
                    {parsedData.metadata.description}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge>{parsedData.metadata.difficulty || "mixed"}</Badge>
                    <Badge variant="outline">
                      {parsedData.questions.length} questions
                    </Badge>
                  </div>
                </div>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {parsedData.questions.slice(0, 5).map((q, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <p className="mb-2 font-medium">
                        {index + 1}. {q.question}
                      </p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(q.options).map(([key, value]) => (
                          <div
                            key={key}
                            className={`pl-4 ${
                              key === q.correctAnswer
                                ? "font-medium text-green-600"
                                : ""
                            }`}
                          >
                            {key}. {value}
                            {key === q.correctAnswer && " ✓"}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="mt-2 text-sm italic text-gray-600">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                  {parsedData.questions.length > 5 && (
                    <p className="py-2 text-center text-gray-500">
                      ... and {parsedData.questions.length - 5} more questions
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload to Database
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Question Set</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{setToDelete?.name}"? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
