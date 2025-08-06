import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Calendar, Mail, User, Users, ArrowLeft } from "lucide-react";
import { TEAMS, TEAM_COLORS } from "@/utils/constants";
import { practiceService } from "@/lib/practiceService";
import { toast } from "sonner";

const PracticeSignup = () => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!selectedTeam) {
      toast.error("Please select a team");
      return;
    }

    setIsSubmitting(true);

    try {
      const signupId = practiceService.addSignup(
        playerName.trim(),
        email.trim() || undefined,
        selectedTeam,
        preferredTime || undefined,
        notes.trim() || undefined
      );

      toast.success("Practice session signup successful!");

      // Navigate to confirmation or back to home
      navigate("/", {
        state: {
          message:
            "Thank you for signing up for practice! We'll be in touch about scheduling.",
        },
      });
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error("Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="mx-auto max-w-2xl py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="mb-8 space-y-4 text-center">
          <div className="flex justify-center">
            <Star className="h-16 w-16 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Practice Session Signup
          </h1>
          <p className="text-lg text-gray-600">
            Register for an Eastern Star practice session with your chapter
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="mb-4 flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Information
                </h3>
              </div>

              <div>
                <Label htmlFor="playerName">Full Name *</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com (optional)"
                  className="mt-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional - for practice session reminders
                </p>
              </div>
            </div>

            {/* Team Selection */}
            <div className="space-y-4">
              <div className="mb-4 flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Preference
                </h3>
              </div>

              <div>
                <Label htmlFor="team">Choose Your Star Point Team *</Label>
                <Select
                  value={selectedTeam}
                  onValueChange={setSelectedTeam}
                  required
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TEAMS).map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center space-x-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: TEAM_COLORS[team.id] }}
                          />
                          <span>
                            {team.name} - {team.heroine} ({team.meaning})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduling Preferences */}
            <div className="space-y-4">
              <div className="mb-4 flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Scheduling Preferences
                </h3>
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Input
                  id="preferredTime"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g., Tuesday evenings, Saturday afternoons"
                  className="mt-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Let us know when you're typically available
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements, accessibility needs, or questions?"
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !playerName.trim() || !selectedTeam}
              className="min-h-[60px] w-full bg-indigo-600 text-lg font-semibold hover:bg-indigo-700"
            >
              {isSubmitting ? "Signing Up..." : "Sign Up for Practice"}
            </Button>
          </form>
        </Card>

        {/* Info Section */}
        <Card className="mt-6 bg-blue-50 p-6">
          <h3 className="mb-2 font-semibold text-blue-900">What to Expect</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Practice sessions typically last 30-45 minutes</li>
            <li>
              • Questions cover Eastern Star history, symbols, and teachings
            </li>
            <li>
              • Perfect preparation for chapter competitions or knowledge review
            </li>
            <li>
              • Sessions can be organized for individual teams or mixed groups
            </li>
            <li>• We'll contact you to schedule based on group availability</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default PracticeSignup;
