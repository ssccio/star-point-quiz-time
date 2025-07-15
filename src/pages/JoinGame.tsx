import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { gameService } from '@/lib/gameService'
import { TEAMS, TEAM_COLORS } from '@/utils/constants'
import { Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'

const JoinGame = () => {
  const { gameCode, team } = useParams<{ gameCode: string; team?: string }>()
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [gameExists, setGameExists] = useState<boolean | null>(null)
  const navigate = useNavigate()
  
  // Validate team parameter if provided
  const validTeams = ['adah', 'ruth', 'esther', 'martha', 'electa']
  const preAssignedTeam = team && validTeams.includes(team) ? team : null

  // Check if game exists when component mounts
  useEffect(() => {
    if (gameCode) {
      checkGameExists()
    }
  }, [gameCode])

  const checkGameExists = async () => {
    if (!gameCode) return
    
    try {
      const game = await gameService.getGame(gameCode)
      setGameExists(!!game)
      
      if (!game) {
        toast.error('Game not found or has already started')
      } else if (game.status !== 'waiting') {
        toast.error('This game has already started')
        setGameExists(false)
      }
    } catch (error) {
      console.error('Error checking game:', error)
      setGameExists(false)
      toast.error('Error finding game')
    }
  }

  const joinGame = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (!gameCode) {
      toast.error('Invalid game code')
      return
    }

    setIsJoining(true)
    try {
      const { game, player } = await gameService.joinGame(gameCode, playerName.trim(), preAssignedTeam || undefined)
      
      const teamName = TEAMS[player.team as keyof typeof TEAMS].name
      if (preAssignedTeam) {
        toast.success(`Welcome to Team ${teamName}!`)
      } else {
        toast.success(`Welcome! You've been assigned to Team ${teamName}`)
      }
      
      // Store game data for lobby
      localStorage.setItem('gameData', JSON.stringify({
        gameId: game.id,
        playerId: player.id,
        playerName: player.name,
        team: player.team,
        isHost: false,
        gameCode: gameCode
      }))

      navigate('/lobby')
      
    } catch (error) {
      console.error('Error joining game:', error)
      toast.error('Failed to join game. It may be full or already started.')
    } finally {
      setIsJoining(false)
    }
  }

  if (gameExists === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Checking game...</span>
          </div>
        </Card>
      </div>
    )
  }

  if (gameExists === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="space-y-4">
            <div className="text-red-600 text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900">Game Not Found</h1>
            <p className="text-gray-600">
              The game code <strong>{gameCode}</strong> is invalid or the game has already started.
            </p>
            <Button onClick={() => navigate('/')} className="bg-indigo-600 hover:bg-indigo-700">
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Users className="h-8 w-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-900">Join Game</h1>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Game Code</div>
              <div className="text-2xl font-bold text-indigo-600 tracking-wider">
                {gameCode}
              </div>
              {preAssignedTeam && (
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${TEAM_COLORS[preAssignedTeam as keyof typeof TEAM_COLORS]}20` }}>
                  <div className="text-sm text-gray-600">You're joining</div>
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: TEAM_COLORS[preAssignedTeam as keyof typeof TEAM_COLORS] }}
                    />
                    <span className="font-bold" style={{ color: TEAM_COLORS[preAssignedTeam as keyof typeof TEAM_COLORS] }}>
                      Team {TEAMS[preAssignedTeam as keyof typeof TEAMS].name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {TEAMS[preAssignedTeam as keyof typeof TEAMS].meaning}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="playerName">Your Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                disabled={isJoining}
                onKeyDown={(e) => e.key === 'Enter' && joinGame()}
              />
            </div>

            <Button 
              onClick={joinGame} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={isJoining || !playerName.trim()}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Game...
                </>
              ) : (
                'Join Game'
              )}
            </Button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div>• You'll be automatically assigned to a team</div>
              <div>• Wait in the lobby for the game to start</div>
              <div>• Answer Eastern Star trivia questions</div>
              <div>• Compete for the highest score!</div>
            </div>
          </div>

          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Wrong game? Go home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default JoinGame