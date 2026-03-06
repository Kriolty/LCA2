import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { MapPin, Plus, Trash2 } from 'lucide-react';

interface Territory {
  id: string;
  name: string;
  postcodes: string[];
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
}

interface TerritorySelectorProps {
  clientId: string;
  onSave?: () => void;
}

export const TerritorySelector = ({ clientId, onSave }: TerritorySelectorProps) => {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPostcode, setNewPostcode] = useState('');
  const [newRadius, setNewRadius] = useState(50);

  useEffect(() => {
    loadTerritories();
  }, [clientId]);

  const loadTerritories = async () => {
    try {
      const { data, error } = await supabase
        .from('territories')
        .select('*, territory_postcodes(postcode)')
        .eq('client_id', clientId);

      if (error) throw error;

      const formattedTerritories = data?.map(t => ({
        id: t.id,
        name: t.name,
        postcodes: t.territory_postcodes?.map((tp: any) => tp.postcode) || [],
        latitude: t.latitude,
        longitude: t.longitude,
        radius_km: t.radius_km || 50,
      })) || [];

      setTerritories(formattedTerritories);
    } catch (error) {
      console.error('Error loading territories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPostcode = async (territoryId: string) => {
    if (!newPostcode.trim()) {
      alert('Please enter a postcode');
      return;
    }

    try {
      setSaving(true);

      const { data, error } = await supabase
        .from('territory_postcodes')
        .insert({
          territory_id: territoryId,
          postcode: newPostcode.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      const geocoded = await geocodePostcode(newPostcode.trim());
      if (geocoded) {
        await supabase
          .from('territories')
          .update({
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
          })
          .eq('id', territoryId);
      }

      setNewPostcode('');
      await loadTerritories();
      onSave?.();
    } catch (error) {
      console.error('Error adding postcode:', error);
      alert('Failed to add postcode');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePostcode = async (territoryId: string, postcode: string) => {
    if (!confirm(`Remove postcode ${postcode}?`)) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('territory_postcodes')
        .delete()
        .eq('territory_id', territoryId)
        .eq('postcode', postcode);

      if (error) throw error;

      await loadTerritories();
      onSave?.();
    } catch (error) {
      console.error('Error removing postcode:', error);
      alert('Failed to remove postcode');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRadius = async (territoryId: string, radius: number) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('territories')
        .update({ radius_km: radius })
        .eq('id', territoryId);

      if (error) throw error;

      await loadTerritories();
      onSave?.();
    } catch (error) {
      console.error('Error updating radius:', error);
    } finally {
      setSaving(false);
    }
  };

  const geocodePostcode = async (postcode: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${postcode}&country=Australia&format=json`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {territories.map((territory) => (
        <Card key={territory.id}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{territory.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {territory.postcodes.length} postcode(s) configured
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Radius: {territory.radius_km} km
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={territory.radius_km}
                  onChange={(e) => handleUpdateRadius(territory.id, Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={saving}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5 km</span>
                  <span>200 km</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postcodes
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {territory.postcodes.map((postcode) => (
                    <span
                      key={postcode}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
                    >
                      {postcode}
                      <button
                        onClick={() => handleRemovePostcode(territory.id, postcode)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                        disabled={saving}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {territory.postcodes.length === 0 && (
                    <span className="text-sm text-gray-500">No postcodes added yet</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Input
                    value={newPostcode}
                    onChange={(e) => setNewPostcode(e.target.value)}
                    placeholder="Enter postcode (e.g., 2000)"
                    disabled={saving}
                  />
                  <Button
                    onClick={() => handleAddPostcode(territory.id)}
                    disabled={saving || !newPostcode.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {territory.latitude && territory.longitude && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">
                    <strong>Center Point:</strong> {territory.latitude.toFixed(6)}, {territory.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Leads within {territory.radius_km}km of this location will be matched to your territory
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {territories.length === 0 && (
        <Card>
          <div className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No territories configured yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Contact support to set up your territory
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
