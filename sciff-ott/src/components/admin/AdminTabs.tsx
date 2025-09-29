import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Upload, Search, Edit, Trash2,
  Save, X, Globe,
  Film, Users, CheckCircle
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
      // Prepare the data to ensure it matches the database schema
      const categoryData = {
        name: formData.name.trim(),
        min_age: formData.min_age || 0,
        max_age: formData.max_age || 18,
        description: formData.description?.trim() || '',
        display_order: formData.display_order || 0,
        is_active: true
      };
      
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        alert('Category updated successfully!');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([categoryData]);
        if (error) throw error;
        alert('Category added successfully!');
      }
      
      setShowAddForm(false);
      setEditingCategory(null);
      setFormData({ name: '', min_age: 0, max_age: 18, description: '', display_order: 0 });
      // Add a small delay to ensure database consistency
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(`Failed to save category: ${error.message || error.details || 'Please try again.'}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const filmsInCategory = films.filter(f => f.category_id === categoryId).length;
    
    if (filmsInCategory > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${filmsInCategory} film(s). Please move or delete the films first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId);
        
        if (error) throw error;
        alert('Category deleted successfully!');
        // Add a small delay to ensure database consistency
        setTimeout(() => {
          onRefresh();
        }, 500);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
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
              <p><strong>Films:</strong> 
                <span className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                  films.filter(f => f.category_id === category.id).length === 5 
                    ? 'bg-green-900/30 text-green-300' 
                    : 'bg-yellow-900/30 text-yellow-300'
                }`}>
                  {films.filter(f => f.category_id === category.id).length}/5
                </span>
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => {
                  setEditingCategory(category);
                  setFormData(category);
                  setShowAddForm(true);
                }}
                className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Edit Category"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteCategory(category.id, category.name)}
                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-4 h-4" />
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
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  className="input-field"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first (0-10)</p>
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
  const [loading, setLoading] = useState(false);

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

  const resetForm = () => {
    setFormData({
      title: '', category_id: '', external_url: '', thumbnail_url: '',
      description: '', director: '', year: new Date().getFullYear(),
      runtime_seconds: 0, display_order: 0
    });
    setEditingFilm(null);
    setShowAddForm(false);
  };

  const validateForm = () => {
    console.log('Validating form data:', formData);
    console.log('Available categories:', categories);
    
    if (!formData.title.trim()) {
      alert('Please enter a film title');
      return false;
    }
    if (!formData.category_id) {
      alert('Please select a category');
      return false;
    }
    if (!formData.external_url.trim()) {
      alert('Please enter a video URL');
      return false;
    }
    // Basic URL validation
    try {
      new URL(formData.external_url);
    } catch (urlError) {
      console.log('URL validation error:', urlError);
      alert('Please enter a valid video URL');
      return false;
    }
    
    // Check if category already has 5 films (only for new films)
    if (!editingFilm) {
      const filmsInCategory = films.filter(f => f.category_id === formData.category_id).length;
      console.log('Film capacity check - Films in category:', filmsInCategory);
      if (filmsInCategory >= 5) {
        alert('This category already has 5 films. Please select a different category or delete a film first.');
        return false;
      }
    }
    
    // Validate category exists
    const categoryExists = categories.some(cat => cat.id === formData.category_id);
    console.log('Category validation - Selected ID:', formData.category_id, 'Exists:', categoryExists);
    if (!categoryExists) {
      alert('Please select a valid category');
      return false;
    }
    
    return true;
  };

  const handleSaveFilm = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Prepare the data to ensure it matches the database schema
      const filmData = {
        title: formData.title.trim(),
        category_id: formData.category_id,
        external_url: formData.external_url.trim(),
        thumbnail_url: formData.thumbnail_url?.trim() || null,
        description: formData.description?.trim() || '',
        director: formData.director?.trim() || null,
        year: formData.year || null,
        runtime_seconds: formData.runtime_seconds || null,
        display_order: formData.display_order || 0,
        is_active: true
      };
      
      console.log('Saving film data:', filmData);
      
      if (editingFilm) {
        console.log('Updating film with ID:', editingFilm.id);
        const { error } = await supabase
          .from('films')
          .update(filmData)
          .eq('id', editingFilm.id);
        if (error) throw error;
        alert('Film updated successfully!');
      } else {
        console.log('Inserting new film');
        const { error } = await supabase
          .from('films')
          .insert([filmData]);
        if (error) throw error;
        alert('Film added successfully!');
      }
      
      resetForm();
      // Add a small delay to ensure database consistency
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error: any) {
      console.error('Error saving film:', error);
      alert(`Failed to save film: ${error.message || error.details || error.toString() || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilmStatus = async (filmId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('films')
        .update({ is_active: !currentStatus })
        .eq('id', filmId);
      
      if (error) throw error;
      // Add a small delay to ensure database consistency
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error) {
      console.error('Error updating film status:', error);
      alert('Failed to update film status');
    }
  };

  const handleDeleteFilm = async (filmId: string, filmTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${filmTitle}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('films')
          .delete()
          .eq('id', filmId);
        
        if (error) throw error;
        alert('Film deleted successfully!');
        // Add a small delay to ensure database consistency
        setTimeout(() => {
          onRefresh();
        }, 500);
      } catch (error) {
        console.error('Error deleting film:', error);
        alert('Failed to delete film. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Films Management</h3>
          <p className="text-gray-400 text-sm mt-1">Add and manage films that will be available to schools</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Film by URL
        </button>
      </div>

      {/* Films Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
          <div className="flex items-center">
            <Film className="w-6 h-6 text-blue-400 mr-3" />
            <div>
              <p className="text-blue-300 text-sm font-medium">Total Films</p>
              <p className="text-white text-2xl font-bold">{films.length}/15</p>
            </div>
          </div>
        </div>
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            <div>
              <p className="text-green-300 text-sm font-medium">Active Films</p>
              <p className="text-white text-2xl font-bold">{films.filter(f => f.is_active).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-purple-400 mr-3" />
            <div>
              <p className="text-purple-300 text-sm font-medium">Categories</p>
              <p className="text-white text-2xl font-bold">{categories.length}/3</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <Film className="w-6 h-6 text-yellow-400 mr-3" />
            <div>
              <p className="text-yellow-300 text-sm font-medium">Avg per Category</p>
              <p className="text-white text-2xl font-bold">{categories.length > 0 ? Math.round(films.length / categories.length) : 0}/5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {films.map((film) => (
          <div key={film.id} className="card p-6 hover:border-blue-500 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-semibold text-white line-clamp-2">{film.title}</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleFilmStatus(film.id, film.is_active)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    film.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}
                >
                  {film.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            
            {film.thumbnail_url && (
              <img 
                src={film.thumbnail_url} 
                alt={film.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Category:</strong> 
                <span className="inline-block bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs ml-2">
                  {film.category?.name}
                </span>
              </p>
              {film.director && <p><strong>Director:</strong> {film.director}</p>}
              {film.year && <p><strong>Year:</strong> {film.year}</p>}
              {film.runtime_seconds > 0 && (
                <p><strong>Duration:</strong> {Math.floor(film.runtime_seconds / 60)} minutes</p>
              )}
              <p className="text-gray-400 line-clamp-2">{film.description}</p>
              <div className="pt-2">
                <a 
                  href={film.external_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  View Video
                </a>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-700">
              <button 
                onClick={() => toggleFilmStatus(film.id, film.is_active)}
                className={`p-2 rounded-lg transition-colors ${
                  film.is_active 
                    ? 'text-green-400 hover:text-green-300 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                }`}
                title={film.is_active ? "Deactivate Film" : "Activate Film"}
              >
                {film.is_active ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
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
                    year: film.year || null,
                    runtime_seconds: film.runtime_seconds || 0,
                    display_order: film.display_order
                  });
                  setShowAddForm(true);
                }}
                className="text-yellow-400 hover:text-yellow-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Edit Film"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDeleteFilm(film.id, film.title)}
                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                title="Delete Film"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {films.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-gray-400 text-lg font-medium">No films added yet</h3>
            <p className="text-gray-500 text-sm mt-2">Start by adding your first film using the button above</p>
          </div>
        )}
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
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})}
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
                  onChange={(e) => setFormData({...formData, runtime_seconds: parseInt(e.target.value) || 0})}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  className="input-field"
                  min="0"
                  max="10"
                />
                <p className="text-xs text-gray-400 mt-1">Lower numbers appear first (0-10)</p>
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
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFilm}
                className="btn-primary flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingFilm ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};