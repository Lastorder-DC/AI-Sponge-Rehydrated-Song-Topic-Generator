import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Copy, Trash, Link, MusicNote, CheckCircle, Warning, Keyboard, DotsSixVertical } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
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
  durationSeconds?: number
}

const CHARACTER_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
]

const getCharacterColor = (character: string): string => {
  const characterIndex = CHARACTERS.indexOf(character)
  const colorIndex = Math.max(0, characterIndex) % CHARACTER_COLORS.length
  return CHARACTER_COLORS[colorIndex]
}

const createCharacterId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [characters, setCharacters] = useState<CharacterEntry[]>([])
  const [urlError, setUrlError] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [commandType, setCommandType] = useState<'topic' | 'supertopic'>('topic')
  const [stage, setStage] = useState<number | null>(null)
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)
  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null)
  const [editingTimestampCharacterId, setEditingTimestampCharacterId] = useState<string | null>(null)
  const [editingTimestampValue, setEditingTimestampValue] = useState('')
  const [editingTimestampError, setEditingTimestampError] = useState('')

  const extractVideoId = useCallback((url: string): string | null => {
    if (!url) return null
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\s]+)/,
      /youtube\.com\/embed\/([^&?\s]+)/,
      /youtube\.com\/v\/([^&?\s]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }, [])

  const cleanYoutubeUrl = useCallback((url: string): string => {
    if (!url) return ''
    const siIndex = url.indexOf('?si=')
    if (siIndex > -1) {
      return url.substring(0, siIndex)
    }
    return url
  }, [])

  const validateYoutubeUrl = useCallback((url: string): boolean => {
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
  }, [])

  const fetchVideoInfo = useCallback(async (url: string) => {
    const videoId = extractVideoId(url)
    if (!videoId) return

    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      )
      
      if (response.ok) {
        const data = await response.json()
        setVideoInfo({
          thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: '',
          title: data.title || 'YouTube Video',
          durationSeconds: undefined
        })
      } else {
        setVideoInfo({
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: '',
          title: 'YouTube Video',
          durationSeconds: undefined
        })
      }
    } catch {
      setVideoInfo({
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: '',
        title: 'YouTube Video',
        durationSeconds: undefined
      })
    }
  }, [extractVideoId])

  const handleUrlChange = useCallback((value: string) => {
    setYoutubeUrl(value)
    const isValid = validateYoutubeUrl(value)
    
    if (isValid) {
      fetchVideoInfo(value)
    } else {
      setVideoInfo(null)
    }
  }, [fetchVideoInfo, validateYoutubeUrl])

  const validateTimestamp = useCallback((timeStr: string): { valid: boolean; error?: string } => {
    if (!timeStr || timeStr === '') return { valid: true }
    
    const parts = timeStr.split(':')
    
    if (parts.length > 2) {
      return { valid: false, error: 'Format should be mm:ss or ss' }
    }
    
    if (parts.length === 1) {
      const seconds = parseFloat(parts[0])
      if (isNaN(seconds) || seconds < 0) {
        return { valid: false, error: 'Must be a positive number' }
      }
    } else if (parts.length === 2) {
      const minutes = parseInt(parts[0])
      const seconds = parseFloat(parts[1])
      
      if (isNaN(minutes) || isNaN(seconds)) {
        return { valid: false, error: 'Invalid time format' }
      }
      
      if (minutes < 0 || seconds < 0 || seconds >= 60) {
        return { valid: false, error: 'Invalid time values' }
      }
    }
    
    return { valid: true }
  }, [])

  const convertToSeconds = useCallback((timeStr: string): number => {
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
  }, [])

  const formatSecondsToMMSS = useCallback((seconds: number): string => {
    if (!seconds || seconds === 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const timelineCharacters = useMemo(
    () => characters.filter((char) => char.character && char.timestamp),
    [characters],
  )

  const maxTimelineDuration = useMemo(
    () => Math.max(240, ...timelineCharacters.map((char) => convertToSeconds(char.timestamp))),
    [convertToSeconds, timelineCharacters],
  )

  const videoId = useMemo(() => extractVideoId(youtubeUrl), [extractVideoId, youtubeUrl])

  const cleanedYoutubeUrl = useMemo(() => cleanYoutubeUrl(youtubeUrl), [cleanYoutubeUrl, youtubeUrl])

  const editingTimestampCharacter = useMemo(
    () => characters.find((char) => char.id === editingTimestampCharacterId),
    [characters, editingTimestampCharacterId],
  )

  const addCharacter = useCallback(() => {
    setCharacters((currentCharacters) => [
      ...currentCharacters,
      {
        id: createCharacterId(),
        character: '',
        timestamp: '',
      },
    ])
  }, [])

  const updateCharacter = useCallback((id: string, field: 'character' | 'timestamp', value: string) => {
    setCharacters((currentCharacters) =>
      currentCharacters.map((char) =>
        char.id === id ? { ...char, [field]: value } : char
      )
    )
  }, [])

  const removeCharacter = useCallback((id: string) => {
    setCharacters((currentCharacters) => currentCharacters.filter((char) => char.id !== id))
  }, [])

  const reorderCharacters = useCallback((sourceId: string, targetId: string) => {
    if (sourceId === targetId) return

    setCharacters((currentCharacters) => {
      const sourceIndex = currentCharacters.findIndex((char) => char.id === sourceId)
      const targetIndex = currentCharacters.findIndex((char) => char.id === targetId)

      if (sourceIndex === -1 || targetIndex === -1) {
        return currentCharacters
      }

      const reorderedCharacters = [...currentCharacters]
      const [movedCharacter] = reorderedCharacters.splice(sourceIndex, 1)
      reorderedCharacters.splice(targetIndex, 0, movedCharacter)
      return reorderedCharacters
    })
  }, [])

  const openTimestampEditor = useCallback((char: CharacterEntry) => {
    setEditingTimestampCharacterId(char.id)
    setEditingTimestampValue(char.timestamp)
    setEditingTimestampError('')
  }, [])

  const closeTimestampEditor = useCallback(() => {
    setEditingTimestampCharacterId(null)
    setEditingTimestampValue('')
    setEditingTimestampError('')
  }, [])

  const saveTimestampEdit = useCallback(() => {
    if (!editingTimestampCharacterId) return

    const trimmedTimestamp = editingTimestampValue.trim()
    const validation = validateTimestamp(trimmedTimestamp)
    if (!validation.valid) {
      setEditingTimestampError(validation.error || 'Invalid timestamp')
      return
    }

    updateCharacter(editingTimestampCharacterId, 'timestamp', trimmedTimestamp)
    closeTimestampEditor()
  }, [
    closeTimestampEditor,
    editingTimestampCharacterId,
    editingTimestampValue,
    updateCharacter,
    validateTimestamp,
  ])

  const generateCommand = useCallback((): string => {
    const cleanedUrl = cleanYoutubeUrl(youtubeUrl)
    if (!cleanedUrl || characters.length === 0) return ''

    const validCharacters = characters.filter((char) => char.character)
    
    const characterParts = validCharacters
      .map((char) => {
        const seconds = convertToSeconds(char.timestamp)
        if (validCharacters.length > 1) {
          return `${char.character} ${Math.floor(seconds)}`
        }
        if (seconds && seconds !== 0) {
          return `${char.character} ${Math.floor(seconds)}`
        }
        return char.character
      })
      .join(' ')

    if (!characterParts) return ''

    const stagePart = stage !== null ? `stage=${stage} ` : ''
    return `!${commandType} ${stagePart}${characterParts} sings ${cleanedUrl}`
  }, [characters, cleanYoutubeUrl, commandType, convertToSeconds, stage, youtubeUrl])

  const command = useMemo(() => generateCommand(), [generateCommand])

  const isValidCommand = useCallback((): boolean => {
    if (!youtubeUrl || urlError) return false
    if (characters.length === 0) return false
    if (!characters.every((char) => char.character)) return false

    for (const char of characters) {
      if (char.timestamp && char.timestamp !== '') {
        const validation = validateTimestamp(char.timestamp)
        if (!validation.valid) return false
      }
    }

    return true
  }, [characters, urlError, validateTimestamp, youtubeUrl])

  const copyToClipboard = useCallback(async () => {
    if (!isValidCommand()) return

    try {
      await navigator.clipboard.writeText(command)
      toast.success('Command copied to clipboard!', {
        description: 'Ready to paste in Discord',
      })
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }, [command, isValidCommand])

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowShortcutsModal(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.shiftKey) {
        e.preventDefault()
        if (isValidCommand()) {
          copyToClipboard()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        addCharacter()
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [addCharacter, copyToClipboard, isValidCommand])

  return (
    <>
      <Toaster />
      <Dialog open={showShortcutsModal} onOpenChange={setShowShortcutsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard weight="bold" className="text-primary" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these shortcuts to speed up your workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Show shortcuts</span>
              <Badge variant="outline" className="font-mono">Ctrl + K</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Copy command</span>
              <Badge variant="outline" className="font-mono">Ctrl + Shift + C</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm">Add character</span>
              <Badge variant="outline" className="font-mono">Ctrl + N</Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(editingTimestampCharacterId)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeTimestampEditor()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timestamp</DialogTitle>
            <DialogDescription>
              Update the start time for {editingTimestampCharacter?.character || 'this character'}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              saveTimestampEdit()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="timeline-timestamp">Start Time (mm:ss or seconds)</Label>
              <Input
                id="timeline-timestamp"
                value={editingTimestampValue}
                onChange={(event) => {
                  setEditingTimestampValue(event.target.value)
                  setEditingTimestampError('')
                }}
                placeholder="e.g., 1:30"
                aria-invalid={Boolean(editingTimestampError)}
                aria-describedby={editingTimestampError ? 'timeline-timestamp-error' : undefined}
              />
              {editingTimestampError && (
                <p id="timeline-timestamp-error" className="text-sm text-destructive">
                  {editingTimestampError}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeTimestampEditor}>
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
              AI Sponge Rehydrated<br />Song Topic Generator
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mb-3">
            Create properly formatted commands for the AI Sponge Rehydrated Discord server
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsModal(true)}
            className="text-xs"
          >
            <Keyboard weight="bold" className="mr-2 w-4 h-4" />
            Keyboard Shortcuts (Ctrl + K)
          </Button>
        </motion.div>

        <Alert className="mb-6 border-accent/30 bg-accent/5">
          <Warning weight="fill" className="h-5 w-5 text-accent" />
          <AlertDescription className="text-sm">
            <strong>Remember:</strong> AI Covers/Official Audio Only • No Regular Songs • Remove ?si= from URLs • Keep songs under 4 mins • Add timestamps for multiple characters • Check Rules for details
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
                  {youtubeUrl && !urlError && cleanedYoutubeUrl !== youtubeUrl && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle weight="fill" className="w-4 h-4 text-green-600" />
                      URL cleaned: {cleanedYoutubeUrl}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MusicNote weight="bold" className="text-primary" />
                  Command Type
                </CardTitle>
                <CardDescription>
                  Choose between !topic or !supertopic command
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={commandType} onValueChange={(value) => setCommandType(value as 'topic' | 'supertopic')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="topic" id="topic" />
                    <Label htmlFor="topic" className="font-normal cursor-pointer">!topic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="supertopic" id="supertopic" />
                    <Label htmlFor="supertopic" className="font-normal cursor-pointer">!supertopic</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.14 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MusicNote weight="bold" className="text-primary" />
                  Stage
                </CardTitle>
                <CardDescription>
                  Optionally specify the stage location for the song topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={stage !== null ? String(stage) : 'none'}
                  onValueChange={(value) => setStage(value === 'none' ? null : Number(value))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="stage-none" />
                    <Label htmlFor="stage-none" className="font-normal cursor-pointer">None (default)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id="stage-0" />
                    <Label htmlFor="stage-0" className="font-normal cursor-pointer">Stage 0 — Krusty Krab</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="stage-1" />
                    <Label htmlFor="stage-1" className="font-normal cursor-pointer">Stage 1 — Goofy Goober's</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="stage-2" />
                    <Label htmlFor="stage-2" className="font-normal cursor-pointer">Stage 2 — Glove World</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>

          {videoInfo && !urlError && videoId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Video Preview</CardTitle>
                  <CardDescription>
                    <p className="font-medium text-sm line-clamp-2">{videoInfo.title}</p>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video w-full rounded-md overflow-hidden border border-border">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={videoInfo.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  
                  {timelineCharacters.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Character Timeline</Label>
                        <span className="text-xs text-muted-foreground">Visual preview of when each character appears</span>
                      </div>
                      <p id="timeline-drag-instructions" className="sr-only">
                        Timeline markers can be clicked to edit timestamps and dragged onto another marker to reorder characters.
                      </p>
                      <div className="relative bg-muted/30 rounded-lg p-4 border border-border">
                        <div className="relative h-16 bg-background/50 rounded border border-border overflow-hidden">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-1 bg-muted" />
                          </div>
                          
                          {timelineCharacters
                            .map((char) => {
                              const seconds = convertToSeconds(char.timestamp)
                              const position = (seconds / maxTimelineDuration) * 100
                              const color = getCharacterColor(char.character)
                               
                              return (
                                <motion.div
                                  key={char.id}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="absolute top-1/2 -translate-y-1/2 group"
                                  style={{ left: `${position}%` }}
                                  draggable
                                  onDragStart={() => setDraggedCharacterId(char.id)}
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={(event) => {
                                    event.preventDefault()
                                    if (draggedCharacterId) {
                                      reorderCharacters(draggedCharacterId, char.id)
                                    }
                                    setDraggedCharacterId(null)
                                  }}
                                  onDragEnd={() => setDraggedCharacterId(null)}
                                >
                                  <button
                                    type="button"
                                    aria-label={`Edit ${char.character} timestamp`}
                                    aria-describedby="timeline-drag-instructions"
                                    title="Click to edit timestamp. Drag onto another marker to reorder."
                                    onClick={() => openTimestampEditor(char)}
                                    className={`w-4 h-4 rounded-full ${color} border-2 border-background shadow-lg -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background`}
                                  />
                                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg border border-border">
                                      <div className="font-semibold">{char.character}</div>
                                      <div className="text-muted-foreground">{formatSecondsToMMSS(seconds) || char.timestamp}</div>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            })}
                        </div>
                        
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>0:00</span>
                          <span>
                            {formatSecondsToMMSS(maxTimelineDuration)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {characters
                          .filter(c => c.character)
                          .map((char) => {
                            const color = getCharacterColor(char.character)
                             
                            return (
                              <div key={char.id} className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${color}`} />
                                <span className="text-foreground font-medium">{char.character}</span>
                                {char.timestamp && (
                                  <span className="text-muted-foreground">
                                    @ {formatSecondsToMMSS(convertToSeconds(char.timestamp)) || char.timestamp}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
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
                      Add characters and their start times (mm:ss or seconds)
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
                      {characters.map((char, index) => {
                        const timestampValidation = validateTimestamp(char.timestamp)
                        return (
                          <motion.div
                            key={char.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="flex gap-3 items-start"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault()
                              if (draggedCharacterId) {
                                reorderCharacters(draggedCharacterId, char.id)
                              }
                              setDraggedCharacterId(null)
                            }}
                            onDragEnd={() => setDraggedCharacterId(null)}
                          >
                            <button
                              type="button"
                              draggable
                              aria-label={`Drag ${char.character || `character ${index + 1}`} to reorder`}
                              title="Drag to reorder"
                              onDragStart={() => setDraggedCharacterId(char.id)}
                              className="mt-2 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                            >
                              <DotsSixVertical weight="bold" className="w-5 h-5" />
                            </button>
                            <Badge variant="outline" className="mt-2 min-w-8 justify-center">
                              {index + 1}
                            </Badge>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                <Input
                                  id={`timestamp-${char.id}`}
                                  type="text"
                                  placeholder={index === 0 ? '0:00 (optional)' : 'e.g., 1:30'}
                                  value={char.timestamp}
                                  onChange={(e) => updateCharacter(char.id, 'timestamp', e.target.value)}
                                  className={!timestampValidation.valid ? 'border-destructive' : ''}
                                />
                                {!timestampValidation.valid && (
                                  <p className="text-xs text-destructive mt-1">{timestampValidation.error}</p>
                                )}
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
                        )
                      })}
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
                <CardTitle className="text-lg">📝 Song Topic Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>AI Covers/Official Audio Only:</strong> Your song topic MUST be an AI cover, or official audio (Sweet Victory, Ripped Pants) that a character sings in the show or movie. Voice acted audio is allowed as long as it is from a voice actor or a similar sounding voice. Song topics are NOT AI generated, therefore submitting regular songs will not work!</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>US Availability Required:</strong> Do not suggest videos which cannot be viewed on YouTube in the United States, as this will result in the stream breaking. You can check if a video is blocked in the US <a href="https://polsy.org.uk/stuff/ytrestrict.cgi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">here</a>.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Non-Music Suggestions:</strong> For non-music suggestions, please keep them under 2 minutes, unless you've gotten explicit permission from server staff to post something longer.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Banned Songs List:</strong> Please refer to <a href="https://docs.google.com/document/d/1vFOASAIL35UE5ilT4Ec2Tk0G3WpiNC631CFeSmSADJI/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">this link</a> for a list of songs that are not permitted.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Quality Check:</strong> When submitting your song topic, please do a quality check and do not submit anything that is extremely low quality and/or designed to be loud noise spam.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle weight="fill" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p><strong>Multiple Characters:</strong> Add seconds to the starting point of each character (e.g., !topic plankton 3 spongebob 60 plankton 85 sings https://youtu.be/...)</p>
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
          <p className="text-xs mt-1">
            <a
              href="https://www.mockofun.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              Thumbnail Image Design created with MockoFUN
            </a>
          </p>
        </motion.footer>
      </div>
    </div>
    </>
  )
}

export default App
