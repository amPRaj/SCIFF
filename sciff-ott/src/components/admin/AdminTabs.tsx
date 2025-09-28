import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Upload, Search, Filter, Eye, Edit, Trash2, 
  Save, X, Calendar, Clock, PlayCircle, UserCheck,
  AlertCircle, BarChart3, Activity, Globe, Shield
} from 'lucide-react';

interface TabProps {
  schools: any[];
  categories: any[];
  films: any[];
  banners: any[];
  subscriptions: any[];
  viewingLogs: any[];
  loginActivity: any[];
  onRefresh: () => void;
}

// Schools Tab Component
export const SchoolsTab: React.FC<TabProps> = ({ schools, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [bulkImporting, setBulkImporting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_email: '',
    city: '',
    state: '',
    address: '',
    pincode: '',
    principal_name: '',
    principal_phone: ''
  });

  const handleSaveSchool = async () => {
    try {
      if (editingSchool) {
        const { error } = await supabase
          .from('schools')
          .update(formData)
          .eq('id', editingSchool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('schools')
          .insert([{ ...formData, is_active: true }]);
        if (error) throw error;
      }
      
      setShowAddForm(false);
      setEditingSchool(null);
      setFormData({
        name: '', code: '', contact_email: '', city: '', state: '',
        address: '', pincode: '', principal_name: '', principal_phone: ''
      });
      onRefresh();
    } catch (error) {
      console.error('Error saving school:', error);
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setBulkImporting(true);
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const schoolsToImport = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const school: any = { is_active: true };
      
      headers.forEach((header, index) => {
        school[header] = values[index] || '';
      });
      
      return school;
    });

    try {
      const { error } = await supabase
        .from('schools')
        .insert(schoolsToImport);
      
      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error importing schools:', error);
    } finally {
      setBulkImporting(false);
    }
  };

  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Schools Management</h3>
        <div className="flex space-x-3">
          <label className="btn-secondary flex items-center cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            {bulkImporting ? 'Importing...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
              disabled={bulkImporting}
            />
          </label>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Schools Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{school.name}</div>
                      <div className="text-sm text-gray-400">Created: {new Date(school.created_at).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{school.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{school.city}, {school.state}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{school.contact_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      school.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                    }`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setEditingSchool(school);
                          setFormData(school);
                          setShowAddForm(true);
                        }}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingSchool ? 'Edit School' : 'Add New School'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSchool(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">School Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">School Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Principal Name</label>
                <input
                  type="text"
                  value={formData.principal_name}
                  onChange={(e) => setFormData({...formData, principal_name: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Principal Phone</label>
                <input
                  type="text"
                  value={formData.principal_phone}
                  onChange={(e) => setFormData({...formData, principal_phone: e.target.value})}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSchool(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSchool}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingSchool ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Categories Tab Component
export const CategoriesTab: React.FC<TabProps> = ({ categories, films, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_age: 0,
    max_age: 18,
    description: '',
    display_order: 0
  });

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ ...formData, is_active: true }]);
        if (error) throw error;
      }
      
      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({ name: '', min_age: 0, max_age: 18, description: '', display_order: 0 });
      onRefresh();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Categories Management</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-semibold text-white">{category.name}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                category.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Age Range:</strong> {category.min_age} - {category.max_age} years</p>
              <p className="text-gray-400">{category.description}</p>
              <p><strong>Films:</strong> {films.filter(f => f.category_id === category.id).length}</p>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => {
                  setEditingCategory(category);
                  setFormData(category);
                  setShowAddForm(true);
                }}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Min Age</label>
                  <input
                    type="number"
                    value={formData.min_age}
                    onChange={(e) => setFormData({...formData, min_age: parseInt(e.target.value)})}
                    className="input-field"
                    min="0"
                    max="18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Age</label>
                  <input
                    type="number"
                    value={formData.max_age}
                    onChange={(e) => setFormData({...formData, max_age: parseInt(e.target.value)})}
                    className="input-field"
                    min="0"
                    max="18"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCategory}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingCategory ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Films Tab Component  
export const FilmsTab: React.FC<TabProps> = ({ films, categories, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFilm, setEditingFilm] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    external_url: '',
    thumbnail_url: '',
    description: '',
    director: '',
    year: new Date().getFullYear(),
    runtime_seconds: 0,
    display_order: 0
  });

  const handleSaveFilm = async () => {
    try {
      if (editingFilm) {
        const { error } = await supabase
          .from('films')
          .update(formData)
          .eq('id', editingFilm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('films')
          .insert([{ ...formData, is_active: true }]);
        if (error) throw error;
      }
      
      setShowAddForm(false);
      setEditingFilm(null);
      setFormData({
        title: '', category_id: '', external_url: '', thumbnail_url: '',
        description: '', director: '', year: new Date().getFullYear(),
        runtime_seconds: 0, display_order: 0
      });
      onRefresh();
    } catch (error) {
      console.error('Error saving film:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Films Management</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Film
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {films.map((film) => (
          <div key={film.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-semibold text-white">{film.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                film.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {film.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {film.thumbnail_url && (
              <img 
                src={film.thumbnail_url} 
                alt={film.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Category:</strong> {film.category?.name}</p>
              <p><strong>Director:</strong> {film.director}</p>
              <p><strong>Year:</strong> {film.year}</p>
              <p className="text-gray-400 line-clamp-2">{film.description}</p>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => {
                  setEditingFilm(film);
                  setFormData({
                    title: film.title,
                    category_id: film.category_id,
                    external_url: film.external_url,
                    thumbnail_url: film.thumbnail_url || '',
                    description: film.description,
                    director: film.director || '',
                    year: film.year || new Date().getFullYear(),
                    runtime_seconds: film.runtime_seconds || 0,
                    display_order: film.display_order
                  });
                  setShowAddForm(true);
                }}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingFilm ? 'Edit Film' : 'Add New Film'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFilm(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Film Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Video URL *</label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => setFormData({...formData, external_url: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Director</label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({...formData, director: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="input-field"
                  min="1900"
                  max={new Date().getFullYear() + 5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Runtime (seconds)</label>
                <input
                  type="number"
                  value={formData.runtime_seconds}
                  onChange={(e) => setFormData({...formData, runtime_seconds: parseInt(e.target.value)})}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className="input-field"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFilm(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFilm}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingFilm ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};