import { X } from 'lucide-react';
import './AddRelationshipModal.css';

interface AddRelationshipModalProps {
  form: { parentId: string; childId: string };
  setForm: (form: { parentId: string; childId: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function AddRelationshipModal({ form, setForm, onSave, onClose }: AddRelationshipModalProps) {
  return (
    <div className="add-relationship-modal-overlay">
      <div className="add-relationship-modal-container">
        <div className="add-relationship-modal-header">
          <h2 className="add-relationship-modal-title">Add Parent-Child Relationship</h2>
          <button onClick={onClose} className="add-relationship-modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="add-relationship-modal-body">
          <div className="add-relationship-form-field">
            <label className="add-relationship-form-label">
              Parent User ID
            </label>
            <input
              type="number"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              placeholder="Enter parent user ID"
              className="add-relationship-form-input"
            />
            <p className="add-relationship-form-hint">
              The user must have user_type "parent"
            </p>
          </div>

          <div className="add-relationship-form-field">
            <label className="add-relationship-form-label">
              Child User ID
            </label>
            <input
              type="number"
              value={form.childId}
              onChange={(e) => setForm({ ...form, childId: e.target.value })}
              placeholder="Enter child user ID"
              className="add-relationship-form-input"
            />
            <p className="add-relationship-form-hint">
              The user must have user_type "child"
            </p>
          </div>
        </div>

        <div className="add-relationship-modal-footer">
          <button onClick={onClose} className="add-relationship-cancel-btn">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!form.parentId || !form.childId}
            className="add-relationship-save-btn"
          >
            Add Relationship
          </button>
        </div>
      </div>
    </div>
  );
}
