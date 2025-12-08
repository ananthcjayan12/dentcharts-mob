import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import Portal from './Portal';
import Autocomplete from './Autocomplete';
import { Procedure, proceduresService } from '../../api/services/procedures';
import conditionsData from '../../data/conditions.json';

export interface SelectedItem {
  id: string;
  procedure: Procedure;
  teeth: number[];
  condition: string | null;
  cost: number;
}

interface CreateProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeeth: number[];
  onSave: (items: SelectedItem[]) => void;
}

const CONDITION_OPTIONS = conditionsData.map(c => ({
  value: c.type,
  label: c.label,
  icon: c.icon,
  color: c.color,
  code: c.code,
  severity: c.severity,
  description: c.description
}));

const CreateProcedureModal: React.FC<CreateProcedureModalProps> = ({
  isOpen,
  onClose,
  selectedTeeth: initialSelectedTeeth,
  onSave,
}) => {
  // Left Panel State
  const [currentTeeth, setCurrentTeeth] = useState<number[]>([]);
  const [toothInput, setToothInput] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [conditionSearch, setConditionSearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');
  const [availableProcedures, setAvailableProcedures] = useState<Procedure[]>([]);
  
  // Right Panel State
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTeeth(initialSelectedTeeth);
      setSelectedCondition(null);
      setSelectedItems([]);
      setConditionSearch('');
      setProcedureSearch('');
      setToothInput('');
      // Fetch initial procedures
      proceduresService.list('').then(setAvailableProcedures);
    }
  }, [isOpen, initialSelectedTeeth]);

  // Filter procedures when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      proceduresService.list(procedureSearch).then(setAvailableProcedures);
    }, 300);
    return () => clearTimeout(timer);
  }, [procedureSearch]);

  const handleAddTooth = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && toothInput) {
      e.preventDefault();
      const num = parseInt(toothInput.trim());
      if (!isNaN(num) && num > 0 && num < 100 && !currentTeeth.includes(num)) {
        const newTeeth = [...currentTeeth, num].sort((a, b) => a - b);
        setCurrentTeeth(newTeeth);
        setToothInput('');
        
        // Update teeth for all selected items with the new teeth array
        setSelectedItems(prevItems => prevItems.map(item => ({
          ...item,
          teeth: [...newTeeth],
          cost: (item.procedure.cost || 0) * newTeeth.length
        })));
      } else {
        setToothInput('');
      }
    }
  };

  const handleToothInputBlur = () => {
    if (toothInput) {
      const num = parseInt(toothInput.trim());
      if (!isNaN(num) && num > 0 && num < 100 && !currentTeeth.includes(num)) {
        const newTeeth = [...currentTeeth, num].sort((a, b) => a - b);
        setCurrentTeeth(newTeeth);
        setToothInput('');
        
        // Update teeth for all selected items with the new teeth array
        setSelectedItems(prevItems => prevItems.map(item => ({
          ...item,
          teeth: [...newTeeth],
          cost: (item.procedure.cost || 0) * newTeeth.length
        })));
      } else {
        setToothInput('');
      }
    }
  };

  const handleRemoveTooth = (tooth: number) => {
    const newTeeth = currentTeeth.filter(t => t !== tooth);
    setCurrentTeeth(newTeeth);
    
    // Update teeth for all selected items with the new teeth array
    if (newTeeth.length > 0) {
      setSelectedItems(prevItems => prevItems.map(item => ({
        ...item,
        teeth: [...newTeeth],
        cost: (item.procedure.cost || 0) * newTeeth.length
      })));
    }
  };

  const handleToggleProcedure = (procedure: Procedure) => {
    // Check if this exact combination already exists
    const existingIndex = selectedItems.findIndex(item => 
      item.procedure.code === procedure.code &&
      JSON.stringify(item.teeth.sort()) === JSON.stringify(currentTeeth.sort()) &&
      item.condition === selectedCondition
    );

    if (existingIndex >= 0) {
      // Remove the existing item
      const newItems = [...selectedItems];
      newItems.splice(existingIndex, 1);
      setSelectedItems(newItems);
    } else {
      // Add new item - allow even with empty teeth (will add teeth later)
      const newItem: SelectedItem = {
        id: Math.random().toString(36).substr(2, 9),
        procedure,
        teeth: [...currentTeeth],
        condition: selectedCondition,
        cost: (procedure.cost || 0) * Math.max(currentTeeth.length, 1)
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const isProcedureSelected = (code: string) => {
    // Check if this procedure is in any selected item
    return selectedItems.some(item => item.procedure.code === code);
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    // Allow saving if there are selected procedures OR if there's a condition with teeth
    if (selectedItems.length > 0 || (selectedCondition && currentTeeth.length > 0)) {
      // If there's a condition but no procedures, create a dummy item for the condition
      if (selectedItems.length === 0 && selectedCondition && currentTeeth.length > 0) {
        const conditionOnlyItem: SelectedItem = {
          id: Math.random().toString(36).substr(2, 9),
          procedure: { code: 'condition-only', name: 'Condition Only', cost: 0 } as Procedure,
          teeth: [...currentTeeth],
          condition: selectedCondition,
          cost: 0
        };
        onSave([conditionOnlyItem]);
      } else {
        onSave(selectedItems);
      }
      onClose();
    }
  };

  const filteredConditions = CONDITION_OPTIONS.filter(c => 
    c.label.toLowerCase().includes(conditionSearch.toLowerCase())
  );

  const totalCost = selectedItems.reduce((sum, item) => sum + item.cost, 0);

  if (!isOpen) return null;

  return (
    <Portal>
      <div 
        className="fixed inset-0 flex items-center justify-center"
        style={{ 
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.75)'
        }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col"
          style={{ zIndex: 100000 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xl font-bold text-gray-900">
              Create Procedure
            </h3>
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Controls */}
            <div className="w-7/12 p-6 overflow-y-auto border-r border-gray-200 space-y-6">
                
                {/* Selected Teeth */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Selected Teeth</label>
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-white min-h-[42px]">
                    {currentTeeth.map(tooth => (
                      <span key={tooth} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {tooth}
                        <button
                          type="button"
                          onClick={() => handleRemoveTooth(tooth)}
                          className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                        >
                          <span className="sr-only">Remove tooth {tooth}</span>
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={toothInput}
                      onChange={(e) => setToothInput(e.target.value)}
                      onKeyDown={handleAddTooth}
                      onBlur={handleToothInputBlur}
                      placeholder="Type tooth number..."
                      className="flex-1 min-w-[60px] outline-none text-sm bg-transparent"
                    />
                  </div>
                </div>

                {/* Select Condition */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Condition</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search for a Condition..."
                      value={conditionSearch}
                      onChange={(e) => setConditionSearch(e.target.value)}
                    />
                  </div>
                  
                  {/* Condition List (Filtered) */}
                  {conditionSearch && filteredConditions.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
                      {filteredConditions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedCondition(option.value);
                            setConditionSearch('');
                            
                            // Update condition for all selected items
                            setSelectedItems(prevItems => prevItems.map(item => ({
                              ...item,
                              condition: option.value
                            })));
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Selected Condition Display */}
                  {selectedCondition && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700">
                      {(() => {
                        const opt = CONDITION_OPTIONS.find(c => c.value === selectedCondition);
                        return (
                          <>
                            <span className="text-lg">{opt?.icon}</span>
                            <span className="font-medium">{opt?.label}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedCondition(null);
                                
                                // Update condition for all selected items
                                setSelectedItems(prevItems => prevItems.map(item => ({
                                  ...item,
                                  condition: null
                                })));
                              }}
                              className="ml-auto text-primary-400 hover:text-primary-600"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Select Procedure */}
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Procedure</label>
                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search for a procedure..."
                      value={procedureSearch}
                      onChange={(e) => setProcedureSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {availableProcedures.map((proc) => {
                      const isSelected = isProcedureSelected(proc.code);
                      return (
                        <div 
                          key={proc.code} 
                          className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                          onClick={() => handleToggleProcedure(proc)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                              {proc.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-500">₹{proc.cost}</span>
                        </div>
                      );
                    })}
                    {availableProcedures.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No procedures found
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Summary */}
              <div className="w-5/12 bg-gray-50 p-6 flex flex-col border-l border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Selected Procedures</h4>
                
                <div className="flex-1 overflow-y-auto space-y-3">
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p>No procedures selected</p>
                      <p className="text-sm mt-1">Select teeth, condition and procedures from the left panel</p>
                    </div>
                  ) : (
                    selectedItems.map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative group">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-gray-800 pr-6">{item.procedure.name}</h5>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-bold text-gray-900">₹</span>
                            <input
                              type="number"
                              value={item.cost}
                              onChange={(e) => {
                                const newCost = parseInt(e.target.value) || 0;
                                setSelectedItems(prevItems => prevItems.map(i => 
                                  i.id === item.id ? { ...i, cost: newCost } : i
                                ));
                              }}
                              className="w-20 px-2 py-1 text-sm font-bold text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium text-gray-700">Teeth: </span>
                            {item.teeth.join(', ')}
                          </div>
                          {item.condition && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium text-gray-700">Condition: </span>
                              {CONDITION_OPTIONS.find(c => c.value === item.condition)?.label || item.condition}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                    <span className="text-xl font-bold text-gray-900">₹{totalCost.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 py-2.5"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white"
                      disabled={selectedItems.length === 0 && !(selectedCondition && currentTeeth.length > 0)}
                    >
                      {selectedItems.length === 0 && selectedCondition ? 'Add Condition' : 'Add Treatment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </Portal>
  );
};

export default CreateProcedureModal;