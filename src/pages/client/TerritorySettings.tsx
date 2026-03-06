import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { MapPin, Plus, X, Save, AlertCircle } from 'lucide-react';

interface Territory {
  id: string;
  client_id: string;
  territory_name: string;
  postcodes: string[];
  radius_km: number;
  verticals: string[];
  max_leads_per_day: number;
  max_leads_per_month: number;
  active: boolean;
}

const AVAILABLE_VERTICALS = [
  'Solar',
  'Property Investment',
  'Business Finance',
  'Home Improvements',
  'Spas',
  'Insurance',
  'Telecommunications',
  'Energy',
];

export const TerritorySettings = () => {
  const { user } = useAuthStore();
  const [clientId, setClientId] = useState<string | null>(null);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [newPostcode, setNewPostcode] = useState('');

  useEffect(() => {
    if (user) {
      loadClientAndTerritories();
    }
  }, [user]);

  const loadClientAndTerritories = async () => {
    if (!user) return;

    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (client) {
        setClientId(client.id);

        const { data: territoriesData, error } = await supabase
          .from('territories')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTerritories(territoriesData || []);
      }
    } catch (error) {
      console.error('Error loading territories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTerritory = () => {
    const newTerritory: Territory = {
      id: 'new-' + Date.now(),
      client_id: clientId || '',
      territory_name: 'New Territory',
      postcodes: [],
      radius_km: 50,
      verticals: [],
      max_leads_per_day: 10,
      max_leads_per_month: 200,
      active: true,
    };
    setEditingTerritory(newTerritory);
  };

  const handleSaveTerritory = async () => {
    if (!editingTerritory || !clientId) return;

    setSaving(true);
    try {
      const isNew = editingTerritory.id.startsWith('new-');

      if (isNew) {
        const { data, error } = await supabase
          .from('territories')
          .insert({
            client_id: clientId,
            territory_name: editingTerritory.territory_name,
            postcodes: editingTerritory.postcodes,
            radius_km: editingTerritory.radius_km,
            verticals: editingTerritory.verticals,
            max_leads_per_day: editingTerritory.max_leads_per_day,
            max_leads_per_month: editingTerritory.max_leads_per_month,
            active: editingTerritory.active,
          })
          .select()
          .single();

        if (error) throw error;
        setTerritories([data, ...territories]);
      } else {
        const { error } = await supabase
          .from('territories')
          .update({
            territory_name: editingTerritory.territory_name,
            postcodes: editingTerritory.postcodes,
            radius_km: editingTerritory.radius_km,
            verticals: editingTerritory.verticals,
            max_leads_per_day: editingTerritory.max_leads_per_day,
            max_leads_per_month: editingTerritory.max_leads_per_month,
            active: editingTerritory.active,
          })
          .eq('id', editingTerritory.id);

        if (error) throw error;
        setTerritories(territories.map(t => t.id === editingTerritory.id ? editingTerritory : t));
      }

      setEditingTerritory(null);
    } catch (error) {
      console.error('Error saving territory:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPostcode = () => {
    if (!editingTerritory || !newPostcode.trim()) return;

    const postcode = newPostcode.trim();
    if (editingTerritory.postcodes.includes(postcode)) {
      return;
    }

    setEditingTerritory({
      ...editingTerritory,
      postcodes: [...editingTerritory.postcodes, postcode],
    });
    setNewPostcode('');
  };

  const handleRemovePostcode = (postcode: string) => {
    if (!editingTerritory) return;

    setEditingTerritory({
      ...editingTerritory,
      postcodes: editingTerritory.postcodes.filter(p => p !== postcode),
    });
  };

  const handleToggleVertical = (vertical: string) => {
    if (!editingTerritory) return;

    const verticals = editingTerritory.verticals.includes(vertical)
      ? editingTerritory.verticals.filter(v => v !== vertical)
      : [...editingTerritory.verticals, vertical];

    setEditingTerritory({
      ...editingTerritory,
      verticals,
    });
  };

  const handleDeleteTerritory = async (territoryId: string) => {
    if (!confirm('Are you sure you want to delete this territory?')) return;

    try {
      const { error } = await supabase
        .from('territories')
        .delete()
        .eq('id', territoryId);

      if (error) throw error;
      setTerritories(territories.filter(t => t.id !== territoryId));
    } catch (error) {
      console.error('Error deleting territory:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Territory Settings</h1>
            <p className="text-gray-600 mt-1">Configure your lead distribution preferences</p>
          </div>
          <Button onClick={handleCreateTerritory}>
            <Plus className="h-4 w-4 mr-2" />
            Add Territory
          </Button>
        </div>

        {!clientId && !loading && (
          <Card>
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">
                Client profile not found. Please contact support.
              </p>
            </div>
          </Card>
        )}

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          </Card>
        ) : territories.length === 0 && !editingTerritory ? (
          <Card>
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No territories configured</h3>
              <p className="text-gray-600 mb-6">
                Create your first territory to start receiving leads automatically
              </p>
              <Button onClick={handleCreateTerritory}>
                <Plus className="h-4 w-4 mr-2" />
                Create Territory
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {territories.map((territory) => (
              <Card key={territory.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{territory.territory_name}</h3>
                      <p className="text-sm text-gray-600">
                        {territory.postcodes.length} postcodes • {territory.verticals.length} verticals
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      territory.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {territory.active ? 'Active' : 'Inactive'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTerritory(territory)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTerritory(territory.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Radius</p>
                    <p className="font-medium">{territory.radius_km} km</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Daily Limit</p>
                    <p className="font-medium">{territory.max_leads_per_day} leads</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Monthly Limit</p>
                    <p className="font-medium">{territory.max_leads_per_month} leads</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Postcodes:</p>
                  <div className="flex flex-wrap gap-2">
                    {territory.postcodes.map(postcode => (
                      <span
                        key={postcode}
                        className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {postcode}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Verticals:</p>
                  <div className="flex flex-wrap gap-2">
                    {territory.verticals.map(vertical => (
                      <span
                        key={vertical}
                        className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
                      >
                        {vertical}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}

            {editingTerritory && (
              <Card>
                <CardHeader title={editingTerritory.id.startsWith('new-') ? 'Create Territory' : 'Edit Territory'} />

                <div className="space-y-6">
                  <Input
                    label="Territory Name"
                    value={editingTerritory.territory_name}
                    onChange={(e) => setEditingTerritory({
                      ...editingTerritory,
                      territory_name: e.target.value,
                    })}
                    placeholder="e.g., Sydney Metro"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postcodes
                    </label>
                    <div className="flex space-x-2 mb-3">
                      <Input
                        value={newPostcode}
                        onChange={(e) => setNewPostcode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddPostcode()}
                        placeholder="Enter postcode (e.g., 2000)"
                      />
                      <Button onClick={handleAddPostcode}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingTerritory.postcodes.map(postcode => (
                        <span
                          key={postcode}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                        >
                          {postcode}
                          <button
                            onClick={() => handleRemovePostcode(postcode)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Radius (km)
                    </label>
                    <Input
                      type="number"
                      value={editingTerritory.radius_km}
                      onChange={(e) => setEditingTerritory({
                        ...editingTerritory,
                        radius_km: parseInt(e.target.value) || 0,
                      })}
                      min="1"
                      max="500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Leads within this radius of your postcodes will be assigned to you
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verticals / Industries
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_VERTICALS.map(vertical => (
                        <label
                          key={vertical}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={editingTerritory.verticals.includes(vertical)}
                            onChange={() => handleToggleVertical(vertical)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{vertical}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Leads Per Day
                      </label>
                      <Input
                        type="number"
                        value={editingTerritory.max_leads_per_day}
                        onChange={(e) => setEditingTerritory({
                          ...editingTerritory,
                          max_leads_per_day: parseInt(e.target.value) || 0,
                        })}
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Leads Per Month
                      </label>
                      <Input
                        type="number"
                        value={editingTerritory.max_leads_per_month}
                        onChange={(e) => setEditingTerritory({
                          ...editingTerritory,
                          max_leads_per_month: parseInt(e.target.value) || 0,
                        })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingTerritory.active}
                        onChange={(e) => setEditingTerritory({
                          ...editingTerritory,
                          active: e.target.checked,
                        })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active (receive leads automatically)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setEditingTerritory(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTerritory} loading={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Territory
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
