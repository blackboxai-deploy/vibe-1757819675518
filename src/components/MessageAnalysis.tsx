"use client"

import { MessageAnalysis as MessageAnalysisType } from '@/types/chat'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Button } from './ui/button'
// Using Unicode symbols instead of lucide icons
const HeartIcon = ({ className }: { className?: string }) => <span className={className}>💚</span>
const FrownIcon = ({ className }: { className?: string }) => <span className={className}>😞</span>
const MehIcon = ({ className }: { className?: string }) => <span className={className}>😐</span>
const AlertTriangleIcon = ({ className }: { className?: string }) => <span className={className}>⚠️</span>
const GlobeIcon = ({ className }: { className?: string }) => <span className={className}>🌐</span>
const BrainIcon = ({ className }: { className?: string }) => <span className={className}>🧠</span>
import { cn } from '@/lib/utils'

interface MessageAnalysisProps {
  analysis: MessageAnalysisType
  compact?: boolean
  showDetailed?: boolean
}

export function MessageAnalysis({ 
  analysis, 
  compact = false, 
  showDetailed = false 
}: MessageAnalysisProps) {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <HeartIcon className="inline-block text-green-600" />
      case 'negative':
        return <FrownIcon className="inline-block text-red-600" />
      case 'neutral':
      default:
        return <MehIcon className="inline-block text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
      case 'negative':
        return 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
      case 'neutral':
      default:
        return 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
    }
  }

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return 'high'
    if (confidence >= 0.6) return 'medium'
    return 'low'
  }

  const getToxicityLevel = (toxicity: number) => {
    if (toxicity >= 0.7) return 'high'
    if (toxicity >= 0.3) return 'medium'
    return 'low'
  }

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-1 mt-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs cursor-help border transition-colors",
                  getSentimentColor(analysis.sentiment)
                )}
              >
                <span className="mr-1">{getSentimentIcon(analysis.sentiment)}</span>
                {analysis.sentiment}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div>Sentiment: {analysis.sentiment}</div>
                <div>Confidence: {formatConfidence(analysis.confidence)}</div>
                <div>Model: {analysis.modelUsed}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {analysis.toxicity > 0.3 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-700">
                  <AlertTriangleIcon className="inline-block mr-1" />
                  {getToxicityLevel(analysis.toxicity)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div>Toxicity: {Math.round(analysis.toxicity * 100)}%</div>
                  <div>This message may contain inappropriate content</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {analysis.language !== 'en' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs">
                  <GlobeIcon className="inline-block mr-1" />
                  {analysis.language.toUpperCase()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  Detected language: {analysis.language}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <BrainIcon className="inline-block text-muted-foreground" />
          <span className="text-sm font-medium">AI Analysis</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {analysis.modelUsed}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Sentiment */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {getSentimentIcon(analysis.sentiment)}
            <span className="font-medium">Sentiment</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="capitalize text-muted-foreground">{analysis.sentiment}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                getSentimentColor(analysis.sentiment)
              )}
            >
              {formatConfidence(analysis.confidence)}
            </Badge>
          </div>
        </div>

        {/* Toxicity */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangleIcon className={cn(
              "inline-block",
              analysis.toxicity > 0.7 ? "text-red-600" :
              analysis.toxicity > 0.3 ? "text-yellow-600" : "text-green-600"
            )} />
            <span className="font-medium">Safety</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {analysis.toxicity > 0.7 ? 'High Risk' :
               analysis.toxicity > 0.3 ? 'Medium Risk' : 'Safe'}
            </span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                analysis.toxicity > 0.7 ? "border-red-200 bg-red-50 text-red-700" :
                analysis.toxicity > 0.3 ? "border-yellow-200 bg-yellow-50 text-yellow-700" :
                "border-green-200 bg-green-50 text-green-700"
              )}
            >
              {Math.round((1 - analysis.toxicity) * 100)}%
            </Badge>
          </div>
        </div>

        {/* Language */}
        {analysis.language !== 'en' && (
          <div className="space-y-1 col-span-2">
            <div className="flex items-center space-x-2">
              <GlobeIcon className="inline-block text-muted-foreground" />
              <span className="font-medium">Language</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {analysis.language.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm" className="text-xs h-6">
                Translate
              </Button>
            </div>
          </div>
        )}

        {/* Topics */}
        {analysis.topics && analysis.topics.length > 0 && showDetailed && (
          <div className="space-y-1 col-span-2">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm">Topics</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {analysis.topics.slice(0, 4).map((topic, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs capitalize"
                >
                  {topic}
                </Badge>
              ))}
              {analysis.topics.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{analysis.topics.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {showDetailed && (
        <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Analyzed {new Date(analysis.processedAt).toLocaleTimeString()}</span>
            <span>Confidence: {getConfidenceLevel(analysis.confidence)}</span>
          </div>
        </div>
      )}
    </div>
  )
}