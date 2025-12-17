'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Lightbulb, Send, AlertTriangle, CheckCircle, Clock, Hash, User, Calendar, Filter, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AIIdea {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  authorName?: string
  isApproved: boolean
  createdAt: string
}

const CATEGORIES = [
  'Productivity',
  'Healthcare',
  'Education',
  'Entertainment',
  'Business',
  'Creative',
  'Social Good',
  'Developer Tools',
  'Lifestyle',
  'Other'
]

const EXAMPLE_TAGS = ['AI', 'Machine Learning', 'Automation', 'Chatbot', 'Computer Vision', 'NLP', 'Analytics']

export default function Home() {
  const [ideas, setIdeas] = useState<AIIdea[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    authorName: ''
  })
  const [contentWarning, setContentWarning] = useState('')

  useEffect(() => {
    fetchIdeas()
  }, [])

  // Get all unique tags from ideas
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    ideas.forEach(idea => {
      idea.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [ideas])

  // Filter ideas based on selected tags
  const filteredIdeas = useMemo(() => {
    if (selectedTags.length === 0) return ideas
    
    return ideas.filter(idea => 
      selectedTags.some(tag => idea.tags.includes(tag))
    )
  }, [ideas, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedTags([])
  }

  const fetchIdeas = async () => {
    try {
      const response = await fetch('/api/ideas')
      if (response.ok) {
        const data = await response.json()
        setIdeas(data)
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error)
    }
  }

  const checkContent = async (content: string) => {
    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      
      if (response.ok) {
        const result = await response.json()
        return result
      }
    } catch (error) {
      console.error('Content check failed:', error)
    }
    return { isAppropriate: true, warning: '' }
  }

  const validateIdea = (idea: any) => {
    const errors: string[] = []
    
    // Title validation
    if (!idea.title || idea.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long')
    }
    if (idea.title && idea.title.length > 100) {
      errors.push('Title must be less than 100 characters')
    }
    if (idea.title && (idea.title.toLowerCase().includes('test') || idea.title.toLowerCase().includes('spam'))) {
      errors.push('Title cannot contain "test" or "spam"')
    }
    
    // Description validation
    if (!idea.description || idea.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long')
    }
    if (idea.description && idea.description.length > 500) {
      errors.push('Description must be less than 500 characters')
    }
    if (idea.description && (
      idea.description.toLowerCase().includes('test') ||
      idea.description.toLowerCase().includes('spam') ||
      idea.description.toLowerCase().includes('asdf') ||
      idea.description.toLowerCase().includes('123') ||
      idea.description.toLowerCase().includes('xxx') ||
      idea.description.toLowerCase().includes('free money') ||
      idea.description.toLowerCase().includes('click here') ||
      idea.description.toLowerCase().includes('limited offer')
    )) {
      errors.push('Description contains inappropriate content')
    }
    
    // Category validation
    if (!idea.category || !CATEGORIES.includes(idea.category)) {
      errors.push('Please select a valid category')
    }
    
    // Tags validation
    // Ensure tags is an array
    const tagsArray = Array.isArray(idea.tags) ? idea.tags : []
    if (tagsArray.some(tag => 
      tag.toLowerCase().includes('test') ||
      tag.toLowerCase().includes('spam') ||
      tag.toLowerCase().includes('xxx') ||
      tag.toLowerCase().includes('123') ||
      tag.toLowerCase().includes('free money') ||
      tag.toLowerCase().includes('limited offer') ||
      tag.toLowerCase().includes('click here')
    )) {
      errors.push('Tags contain inappropriate content')
    }
    
    // Rate limiting check (simple in-memory implementation)
    const now = Date.now()
    const lastSubmission = localStorage.getItem('lastSubmission')
    const timeSinceLastSubmission = lastSubmission ? now - parseInt(lastSubmission) : 999999
    
    if (timeSinceLastSubmission < 60000) { // Less than 1 minute
      errors.push('Please wait before submitting another idea')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationResult = validateIdea(formData)
    
    if (!validationResult.isValid) {
      toast({
        title: "Please fix the following issues:",
        description: validationResult.errors.join('. '),
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setContentWarning('')

    const contentToCheck = `${formData.title} ${formData.description} ${Array.isArray(formData.tags) ? formData.tags.join(' ') : formData.tags}`
    const moderationResult = await checkContent(contentToCheck)

    if (!moderationResult.isAppropriate) {
      setContentWarning(moderationResult.warning || 'Please revise your content to be more appropriate.')
      setIsSubmitting(false)
      return
    }

    // Store last submission time
    localStorage.setItem('lastSubmission', Date.now().toString())

    try {
      // Properly handle tags - ensure it's an array
      let tagsArray: string[] = []
      if (typeof formData.tags === 'string') {
        tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      } else if (Array.isArray(formData.tags)) {
        tagsArray = formData.tags
      }

      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray
        })
      })

      if (response.ok) {
        toast({
          title: "Idea submitted! 🎉",
          description: "Your AI idea has been submitted for review and will appear shortly.",
        })
        setFormData({ title: '', description: '', category: '', tags: '', authorName: '' })
        setShowForm(false)
        fetchIdeas()
      } else {
        throw new Error('Submission failed')
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string; duration: string }>>([])

  // Generate deterministic particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${(i * 20) % 100}`,
      delay: `${(i * 0.5) % 2}s`,
      duration: `${15 + (i % 5) * 3}s`
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated particle background */}
      <div className="particle-bg">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.left,
              animationDelay: particle.delay,
              animationDuration: particle.duration
            }}
          />
        ))}
      </div>

      {/* Scanner line effect */}
      <div className="scanner-line"></div>

      {/* Cyber grid background */}
      <div className="fixed inset-0 cyber-grid opacity-20"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="holographic">
          <div className="container relative mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl neon-border p-1"
              >
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                  <Lightbulb className="w-10 h-10 text-cyan-400" />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-black glitch-text mb-6 tracking-wider"
              >
                AI NEXUS
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg sm:text-xl text-foreground/80 max-w-3xl mx-auto mb-8 font-light tracking-wide"
              >
                Share your revolutionary AI concepts. No authentication required. Build tomorrow's intelligence today.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Dialog open={showForm} onOpenChange={setShowForm}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="tech-button text-cyan-100 px-10 py-4 text-lg font-semibold tracking-wide">
                      <Sparkles className="w-5 h-5 mr-3" />
                      DEPLOY CONCEPT
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto holographic border-0">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold gradient-text glitch-text">
                        NEURAL INTERFACE
                      </DialogTitle>
                      <DialogDescription className="text-foreground/70">
                        Upload your AI concept to the quantum network. All transmissions are filtered for protocol compliance.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {contentWarning && (
                      <Alert className="neon-border bg-red-500/10 border-red-500/30 text-red-400">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <AlertDescription className="text-red-300">
                          {contentWarning}
                        </AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                      <div>
                        <label className="text-sm font-medium text-foreground/90 mb-3 block tracking-wider uppercase">Designation</label>
                        <Input
                          placeholder="Initialize concept designation..."
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-background/50 border-border/50 focus:border-cyan-500 focus:ring-cyan-500/20"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground/90 mb-3 block tracking-wider uppercase">Protocol Description</label>
                        <Textarea
                          placeholder="Transmit detailed specifications. Problem domain. Implementation parameters. System architecture."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full min-h-[120px] bg-background/50 border-border/50 focus:border-cyan-500 focus:ring-cyan-500/20"
                          maxLength={500}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground/90 mb-3 block tracking-wider uppercase">Domain Classification</label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger className="bg-background/50 border-border/50 focus:border-cyan-500 focus:ring-cyan-500/20">
                            <SelectValue placeholder="Select domain classification" />
                          </SelectTrigger>
                          <SelectContent className="holographic border-0">
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category} className="focus:bg-cyan-500/20">{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground/90 mb-3 block tracking-wider uppercase">Neural Tags</label>
                        <Input
                          placeholder="AI, Machine Learning, Automation, Chatbot..."
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                          className="w-full bg-background/50 border-border/50 focus:border-cyan-500 focus:ring-cyan-500/20"
                          maxLength={100}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          {EXAMPLE_TAGS.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200"
                              onClick={() => {
                                const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
                                if (!currentTags.includes(tag)) {
                                  setFormData({ ...formData, tags: [...currentTags, tag].join(', ') })
                                }
                              }}
                            >
                              + {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground/90 mb-3 block tracking-wider uppercase">Operator ID (Optional)</label>
                        <Input
                          placeholder="ANONYMOUS OPERATOR"
                          value={formData.authorName}
                          onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                          className="w-full bg-background/50 border-border/50 focus:border-cyan-500 focus:ring-cyan-500/20"
                          maxLength={50}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full tech-button text-cyan-100 font-semibold py-4 tracking-wide text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Idea
                          </>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold gradient-text mb-4 tracking-wider">QUANTUM DATABASE</h2>
          <p className="text-xl text-foreground/70 max-w-4xl mx-auto font-light tracking-wide">Explore neural networks and artificial intelligence concepts from the collective consciousness</p>
        </div>

        {/* Tag Filter Section */}
        {allTags.length > 0 && (
          <div className="mb-12 holographic rounded-2xl p-8 border-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Filter className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xl font-semibold text-foreground tracking-wider">NEURAL FILTERS</h3>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    {selectedTags.length} protocols active
                  </Badge>
                )}
              </div>
              {selectedTags.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  RESET
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3 mb-6">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-300 ${
                    selectedTags.includes(tag)
                      ? "bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/25"
                      : "hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:text-cyan-400"
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  <Hash className="w-3 h-3 mr-2" />
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Active filters display */}
            {selectedTags.length > 0 && (
              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-sm text-foreground/70 tracking-wider uppercase">Active Protocols:</span>
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 cursor-pointer hover:bg-cyan-500/30 transition-all duration-200"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-2" />
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-foreground/50">
                  Processing {filteredIdeas.length} of {ideas.length} neural pathways
                </div>
              </div>
            )}
          </div>
        )}

        {filteredIdeas.length === 0 && ideas.length > 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-2xl neon-border p-1">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Filter className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-wider">NO NEURAL PATHWAYS DETECTED</h3>
            <p className="text-foreground/70 mb-6 max-w-md mx-auto">Reconfigure filter parameters to access alternative consciousness streams</p>
            <Button onClick={clearFilters} className="tech-button text-cyan-100">
              <X className="w-4 h-4 mr-2" />
              RESET FILTERS
            </Button>
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 rounded-2xl neon-border p-1">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                <Lightbulb className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3 tracking-wider">INITIALIZE QUANTUM DATABASE</h3>
            <p className="text-foreground/70 mb-6 max-w-md mx-auto">Deploy the first neural pathway to begin the collective consciousness network</p>
            <Button onClick={() => setShowForm(true)} className="tech-button text-cyan-100">
              <Sparkles className="w-4 h-4 mr-2" />
              INITIATE PROTOCOL
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="h-full holographic rounded-2xl border-0 card-hover overflow-hidden group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <CardHeader className="relative pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shimmer">
                          {idea.category}
                        </Badge>
                        <div className="flex items-center text-xs text-foreground/60 bg-background/50 px-3 py-1 rounded-full border border-cyan-500/20">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(idea.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:via-blue-500 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-500">
                        {idea.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="relative pt-0">
                      <CardDescription className="text-foreground/70 mb-4 line-clamp-3 leading-relaxed group-hover:text-foreground/90 transition-colors duration-500">
                        {idea.description}
                      </CardDescription>
                      
                      {idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {idea.tags.slice(0, 3).map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 transition-all duration-200">
                              <Hash className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {idea.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                              +{idea.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="flex items-center text-sm text-foreground/60 bg-background/50 px-3 py-1 rounded-full border border-cyan-500/20">
                          {idea.authorName ? (
                            <>
                              <User className="w-3 h-3 mr-2" />
                              {idea.authorName}
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 mr-2" />
                              ANONYMOUS OPERATOR
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Futuristic Footer */}
      <footer className="relative z-10 border-t border-border/50 backdrop-blur-xl">
        <div className="holographic">
          <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold gradient-text glitch-text mb-2">QUANTUM CORE</h3>
                  <p className="text-foreground/70 text-sm tracking-wide">Built with AI ❤️ and human creativity</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-foreground/50 tracking-wider uppercase mb-1">NEURAL NETWORK STATUS</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400 font-medium">ONLINE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}