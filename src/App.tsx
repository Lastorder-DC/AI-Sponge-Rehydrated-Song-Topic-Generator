import { useState, useEffect } from 'react'
import { Plus, Copy, Trash, Link, MusicNote, CheckCircle, Warning, Clock } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const CHARACTERS = [
  'spongebob',
  'patrick',
  'squidward',
  'sandy',
  'mrkrabs',
  'plankton',
  'gary',
  'mrspuff',
  'larry',
  'squilliam',
  'karen',
  'narrator',
  'bubblebuddy',
  'bubblebass',
  'perch',
  'pearl',
  'doodlebob',
  'dutchman',
  'kingneptune',
  'manray',
  'dirtybubble',
]

interface CharacterEntry {
  id: string
  character: string
  timestamp: string
}

interface VideoInfo {
  thumbnailUrl: string
  duration: string
  title: string
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [characters, setCharacters] = useState<CharacterEntry[]>([])
  const [urlError, setUrlError] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)

  const extractVideoId = (url: string): string | null => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/\s]+)/,
      /youtube\.com\/embed\/([^&?\/\s]+)/,
      /youtube\.com\/v\/([^&?\/\s]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const cleanYoutubeUrl = (url: string): string => {
    if (!url) return ''
    const siIndex = url.indexOf('?si=')
    if (siIndex > -1) {
      return url.substring(0, siIndex)
    }
    return url
  }

  const validateYoutubeUrl = (url: string): boolean => {
    if (!url) {
      setUrlError('')
      return false
    }
    
    if (url.includes('/live/')) {
      setUrlError('Live streams are not supported')
      return false
    }
    
    const isValid = url.includes('youtu.be/') || url.includes('youtube.com/')
    if (!isValid) {
      setUrlError('Please enter a valid YouTube URL')
    } else {
      setUrlError('')
    }
    return isValid
  }

  const fetchVideoInfo = async (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) return

    setIsLoadingVideo(true)
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      )
      
      if (response.ok) {
        const data = await response.json()
        setVideoInfo({
          thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: '',
          title: data.title || 'YouTube Video'
        })
      } else {
        setVideoInfo({
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: '',
          title: 'YouTube Video'
        })
      }
    } catch (error) {
      setVideoInfo({
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: '',
        title: 'YouTube Video'
      })
    } finally {
      setIsLoadingVideo(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setYoutubeUrl(value)
    const isValid = validateYoutubeUrl(value)
    
    if (isValid) {
      fetchVideoInfo(value)
    } else {
      setVideoInfo(null)
    }
  }

  const convertToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0
    
    const parts = timeStr.split(':')
    if (parts.length === 1) {
      return parseFloat(parts[0]) || 0
    } else if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0
      const seconds = parseFloat(parts[1]) || 0
      return minutes * 60 + seconds
    }
    return 0
  }

  const formatSecondsToMMSS = (seconds: number): string => {
    if (!seconds || seconds === 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const addCharacter = () => {
    setCharacters([
      ...characters,
      {
        id: Date.now().toString(),
        character: '',
        timestamp: '',
      },
    ])
  }

  const updateCharacter = (id: string, field: 'character' | 'timestamp', value: string) => {
    setCharacters(
      characters.map((char) =>
        char.id === id ? { ...char, [field]: value } : char
      )
    )
  }

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter((char) => char.id !== id))
  }

  const setCurrentVideoTime = (id: string) => {
    toast.info('This feature requires YouTube iframe integration', {
      description: 'For now, please enter the time manually in mm:ss format'
    })
  }

  const generateCommand = (): string => {
    const cleanedUrl = cleanYoutubeUrl(youtubeUrl)
    if (!cleanedUrl || characters.length === 0) return ''

    const characterParts = characters
      .filter((char) => char.character)
      .map((char) => {
        const seconds = convertToSeconds(char.timestamp)
        if (seconds && seconds !== 0) {
          return `${char.character} ${Math.floor(seconds)}`
        }
        return char.character
      })
      .join(' ')

    if (!characterParts) return ''

    return `!topic ${characterParts} sings ${cleanedUrl}`
  }

  const command = generateCommand()

  const isValidCommand = (): boolean => {
    if (!youtubeUrl || urlError) return false
    if (characters.length === 0) return false
    if (!characters.every((char) => char.character)) return false

    for (const char of characters) {
      if (char.timestamp && char.timestamp !== '') {
        const seconds = convertToSeconds(char.timestamp)
        if (seconds < 0) return false
      }
    }

    return true
  }

  const copyToClipboard = async () => {
    if (!isValidCommand()) return

    try {
      await navigator.clipboard.writeText(command)
      toast.success('Command copied to clipboard!', {
        description: 'Ready to paste in Discord',
      })
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,200,220,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_50px,rgba(120,200,220,0.03)_50px,rgba(120,200,220,0.03)_51px)]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <MusicNote weight="fill" className="text-accent w-10 h-10" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              AI Sponge Rehydrated Song Topic Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Create properly formatted commands for the AI Sponge Rehydrated Discord server
          </p>
        </motion.div>

        <Alert className="mb-6 border-accent/30 bg-accent/5">
          <Warning weight="fill" className="h-5 w-5 text-accent" />
          <AlertDescription className="text-sm">
            <strong>Remember:</strong> Live streams not supported • Remove ?si= from URLs • Keep songs under 4 mins • Add timestamps for multiple characters
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link weight="bold" className="text-primary" />
                  YouTube URL
                </CardTitle>
                <CardDescription>
                  Paste the YouTube link of the song you want to request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">Video URL</Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://youtu.be/..."
                    value={youtubeUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={urlError ? 'border-destructive' : ''}
                  />
                  {urlError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <Warning weight="fill" className="w-4 h-4" />
                      {urlError}
                    </p>
                  )}
                  {youtubeUrl && !urlError && cleanYoutubeUrl(youtubeUrl) !== youtubeUrl && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle weight="fill" className="w-4 h-4 text-green-600" />
                      URL cleaned: {cleanYoutubeUrl(youtubeUrl)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {videoInfo && !urlError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Video Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-start">
                    <img 
                      src={videoInfo.thumbnailUrl} 
                      alt="Video thumbnail" 
                      className="w-32 h-24 object-cover rounded-md border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-2 mb-1">{videoInfo.title}</p>
                      {videoInfo.duration && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock weight="fill" className="w-3 h-3 mr-1" />
                          {videoInfo.duration}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MusicNote weight="bold" className="text-primary" />
                      Characters
                    </CardTitle>
                    <CardDescription>
                      Add characters and their start times (in seconds)
                    </CardDescription>
                  </div>
                  <Button
                    onClick={addCharacter}
                    size="sm"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Plus weight="bold" className="mr-2" />
                    Add Character
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MusicNote weight="duotone" className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>No characters added yet. Click "Add Character" to start!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {characters.map((char, index) => (
                        <motion.div
                          key={char.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-3 items-start"
                        >
                          <Badge variant="outline" className="mt-2.5 min-w-8 justify-center">
                            {index + 1}
                          </Badge>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`character-${char.id}`} className="text-xs mb-1.5 block">
                                Character
                              </Label>
                              <Select
                                value={char.character}
                                onValueChange={(value) => updateCharacter(char.id, 'character', value)}
                              >
                                <SelectTrigger id={`character-${char.id}`}>
                                  <SelectValue placeholder="Select character" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CHARACTERS.map((character) => (
                                    <SelectItem key={character} value={character}>
                                      {character}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`timestamp-${char.id}`} className="text-xs mb-1.5 block">
                                Start Time (mm:ss)
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id={`timestamp-${char.id}`}
                                  type="text"
                                  placeholder={index === 0 ? '0:00 (optional)' : 'e.g., 1:30'}
                                  value={char.timestamp}
                                  onChange={(e) => updateCharacter(char.id, 'timestamp', e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setCurrentVideoTime(char.id)}
                                  title="Get current video time"
                                  type="button"
                                >
                                  <Clock weight="bold" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCharacter(char.id)}
                            className="mt-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash weight="bold" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy weight="bold" className="text-primary" />
                  Generated Command
                </CardTitle>
                <CardDescription>
                  Copy this command to use in Discord
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm border-2 border-border min-h-[60px] flex items-center">
                  {command ? (
                    <code className="text-foreground break-all">{command}</code>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Enter a YouTube URL and add characters to generate a command
                    </span>
                  )}
                </div>
                <Separator />
                <Button
                  onClick={copyToClipboard}
                  disabled={!isValidCommand()}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <Copy weight="bold" className="mr-2 w-5 h-5" />
                  Copy to Clipboard
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-secondary/10 border-secondary/30">
              <CardHeader>
                <CardTitle className="text-lg">📝 Formatting Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Multiple Characters:</strong> Add seconds to the starting point of each character</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Example:</strong> !topic plankton 3 spongebob 60 plankton 85 sings https://youtu.be/...</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Clean URLs:</strong> This tool automatically removes ?si= parameters</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Song Length:</strong> Keep songs preferably under 4 minutes</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pb-8 text-center text-sm text-muted-foreground"
        >
          <Separator className="mb-6" />
          <p className="mb-2">
            © {new Date().getFullYear()}{' '}
            <a 
              href="https://aisponge.net/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              AI Sponge Rehydrated
            </a>
          </p>
          <p className="text-xs">
            Created by{' '}
            <a 
              href="https://dzth.bio.link/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              Deezaath
            </a>
            {' & '}
            <a 
              href="https://riskivr.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              RiskiVR
            </a>
          </p>
        </motion.footer>
      </div>
    </div>
  )
}

export default App