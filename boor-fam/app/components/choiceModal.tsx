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
      <div className="relative bg-white p-6 sm:p-8 rounded-2xl w-full sm:w-96 shadow-2xl max-h-[90vh] overflow-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          title="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
        </div>
      </div>
    </div>
  );
}
