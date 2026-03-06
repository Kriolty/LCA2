import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, TrendingUp, X, DollarSign, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { LeadVertical, Vertical } from '../../types/crm';

interface ValueStackingPanelProps {
  leadId: string;
  primaryVertical?: string;
  primaryValue?: number;
}

const VERTICALS: { value: Vertical; label: string }[] = [
  { value: 'solar', label: 'Solar' },
  { value: 'battery', label: 'Battery Storage' },
  { value: 'property', label: 'Property Investment' },
  { value: 'finance', label: 'Finance' },
  { value: 'home_improvement', label: 'Home Improvement' },
  { value: 'ev_charger', label: 'EV Charger' },
  { value: 'heat_pump', label: 'Heat Pump' },
  { value: 'pool', label: 'Pool' },
  { value: 'spa', label: 'Spa' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'painting', label: 'Painting' },
  { value: 'other', label: 'Other' },
];

export const ValueStackingPanel = ({ leadId, primaryVertical, primaryValue }: ValueStackingPanelProps) => {
  const [verticals, setVerticals] = useState<LeadVertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newVertical, setNewVertical] = useState<Vertical>('solar');
  const [newValue, setNewValue] = useState('');
  const [newConfidence, setNewConfidence] = useState('0.7');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadVerticals();
  }, [leadId]);

  const loadVerticals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_verticals')
        .select('*')
        .eq('lead_id', leadId)
        .order('value', { ascending: false });

      if (error) throw error;
      setVerticals(data || []);
    } catch (error) {
      console.error('Error loading verticals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newValue || parseFloat(newValue) <= 0) {
      alert('Please enter a valid value');
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_verticals')
        .insert({
          lead_id: leadId,
          vertical: newVertical,
          value: parseFloat(newValue),
          confidence_score: parseFloat(newConfidence),
          notes: newNotes || null,
        });

      if (error) throw error;

      setNewValue('');
      setNewNotes('');
      setNewConfidence('0.7');
      setAdding(false);
      loadVerticals();
    } catch (error) {
      console.error('Error adding vertical:', error);
      alert('Failed to add vertical opportunity');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this vertical opportunity?')) return;

    try {
      const { error } = await supabase
        .from('lead_verticals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadVerticals();
    } catch (error) {
      console.error('Error deleting vertical:', error);
    }
  };

  const totalStackValue = (primaryValue || 0) + verticals.reduce((sum, v) => sum + (Number(v.value) || 0), 0);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Value Stacking</h3>
              <p className="text-xs text-gray-600">Multi-vertical opportunities</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-600">Total Stack Value</div>
            <div className="text-xl font-bold text-green-600">${totalStackValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {primaryVertical && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {VERTICALS.find(v => v.value === primaryVertical)?.label || primaryVertical}
                </span>
                <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <span className="font-semibold text-blue-900">${(primaryValue || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600 py-4">Loading verticals...</div>
        ) : verticals.length === 0 ? (
          <div className="text-center py-6">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No additional verticals identified yet</p>
            <p className="text-xs text-gray-500 mt-1">Add secondary opportunities to stack value</p>
          </div>
        ) : (
          <div className="space-y-2">
            {verticals.map((vertical) => (
              <div
                key={vertical.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {VERTICALS.find(v => v.value === vertical.vertical)?.label || vertical.vertical}
                      </span>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        {Math.round((vertical.confidence_score || 0) * 100)}% confidence
                      </span>
                    </div>
                    {vertical.notes && (
                      <p className="text-xs text-gray-600">{vertical.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">${Number(vertical.value).toLocaleString()}</span>
                    <button
                      onClick={() => handleDelete(vertical.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {adding ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vertical Type</label>
              <select
                value={newVertical}
                onChange={(e) => setNewVertical(e.target.value as Vertical)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {VERTICALS.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Value ($)</label>
              <Input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="1000"
                min="0"
                step="50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confidence (0.0 - 1.0)</label>
              <Input
                type="number"
                value={newConfidence}
                onChange={(e) => setNewConfidence(e.target.value)}
                min="0"
                max="1"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Why this vertical applies..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd} className="flex-1">
                Add Vertical
              </Button>
              <Button
                onClick={() => setAdding(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setAdding(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Secondary Vertical
          </Button>
        )}
      </div>
    </Card>
  );
};
