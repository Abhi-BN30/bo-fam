import { useState, useEffect } from 'react';

interface ChoiceModalProps {
  isOpen: boolean;
  currentUser: Record<string, any>;
  onClose: () => void;
  onSelectAddSelf: () => void;
  onSelectAddOther: () => void;
  hideAddSelf?: boolean;
}

export default function ChoiceModal({ isOpen, currentUser, onClose, onSelectAddSelf, onSelectAddOther, hideAddSelf }: ChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl w-full sm:w-96 shadow-2xl max-h-[90vh] overflow-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">Add to Family Tree</h2>
        <p className="text-gray-600 mb-4 sm:mb-6 text-center text-xs sm:text-sm">
          {hideAddSelf ? 'You are already part of this family tree. Add another family member?' : 'Would you like to add yourself to the family tree or add another family member?'}
        </p>

        <div className="space-y-3">
          {!hideAddSelf && (
            <button
              onClick={onSelectAddSelf}
              className="w-full bg-indigo-600 text-white p-2.5 sm:p-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm sm:text-base"
            >
              Add Myself to the Tree
            </button>
          )}
          <button
            onClick={onSelectAddOther}
            className="w-full bg-blue-600 text-white p-2.5 sm:p-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm sm:text-base"
          >
            Add Another Family Member
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 p-2.5 sm:p-3 rounded-lg font-semibold hover:bg-gray-300 transition text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
