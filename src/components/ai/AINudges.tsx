import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, TrendingUp, Clock, Sparkles, X, ExternalLink } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import type { AINudge } from '../../types/crm';
import { useNavigate } from 'react-router-dom';

export const AINudges = () => {
  const [nudges, setNudges] = useState<AINudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadNudges();
  }, []);

  const loadNudges = async () => {
    setLoading(true);
    try {
      const data = await aiService.generateNudges();
      setNudges(data);
    } catch (error) {
      console.error('Error loading nudges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const handleAction = (nudge: AINudge) => {
    if (nudge.action_url) {
      navigate(nudge.action_url);
    }
  };

  const getIcon = (type: AINudge['type']) => {
    switch (type) {
      case 'high_value':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'idle_lead':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'enrichment':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: AINudge['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const visibleNudges = nudges.filter(n => !dismissed.has(n.id));

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
          <span className="text-gray-600">Loading AI suggestions...</span>
        </div>
      </Card>
    );
  }

  if (visibleNudges.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-medium text-gray-900">All caught up!</h3>
            <p className="text-sm text-gray-600">No urgent actions needed right now</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
            <p className="text-xs text-gray-600">{visibleNudges.length} action{visibleNudges.length !== 1 ? 's' : ''} recommended</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {visibleNudges.map(nudge => (
          <div
            key={nudge.id}
            className={`p-4 border-l-4 ${getPriorityColor(nudge.priority)} hover:bg-opacity-75 transition-colors`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getIcon(nudge.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{nudge.title}</h4>
                  <p className="text-sm text-gray-700 mt-1">{nudge.message}</p>
                  {nudge.action_url && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(nudge)}
                      className="mt-2 text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Lead
                    </Button>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDismiss(nudge.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <button
          onClick={loadNudges}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mx-auto"
        >
          <Sparkles className="w-3 h-3" />
          Refresh Suggestions
        </button>
      </div>
    </Card>
  );
};
