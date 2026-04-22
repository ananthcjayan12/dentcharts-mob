import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import Portal from './Portal';
import { Procedure } from '../../api/services/procedures';
import { useProcedures } from '../../hooks/useProcedures';
import { useConditions } from '../../hooks/useConditions';
import {
  buildTreatmentItemKey,
  createClientId,
  isValidFDIToothNumber,
  sortNumbers,
} from './dentalChartUtils';

export interface SelectedItem {
  id: string;
  procedure: Procedure;
  teeth: number[];
  condition: string | null;
  conditionLabel?: string | null;
  conditionIcon?: string | null;
  cost: number;
}

interface CreateProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTeeth: number[];
  onSave: (items: SelectedItem[]) => void;
}

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

  // Data Hooks
  // We use debounced search implicitly by how React Query handles keys, or just let it refetch rapidly (less ideal but direct)
  // For better UX, we might want a useDebounce hook, but passing state directly works for MVP.
  const { procedures: availableProcedures } = useProcedures(procedureSearch);
  const { conditions: availableConditions } = useConditions(conditionSearch);

  // Right Panel State
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentTeeth(sortNumbers(initialSelectedTeeth.filter(isValidFDIToothNumber)));
      setSelectedCondition(null);
      setSelectedItems([]);
      setConditionSearch('');
      setProcedureSearch('');
      setToothInput('');
    }
  }, [isOpen, initialSelectedTeeth]);

  const handleAddTooth = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && toothInput) {
      e.preventDefault();
      const num = parseInt(toothInput.trim());
      if (!isNaN(num) && isValidFDIToothNumber(num) && !currentTeeth.includes(num)) {
        const newTeeth = sortNumbers([...currentTeeth, num]);
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
      if (!isNaN(num) && isValidFDIToothNumber(num) && !currentTeeth.includes(num)) {
        const newTeeth = sortNumbers([...currentTeeth, num]);
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
    setSelectedItems(prevItems => prevItems.map(item => ({
      ...item,
      teeth: [...newTeeth],
      cost: (item.procedure.cost || 0) * newTeeth.length
    })));
  };

  const handleToggleProcedure = (procedure: Procedure) => {
    if (currentTeeth.length === 0) {
      return;
    }

    const procedureIdentifier = procedure.code || procedure.procedure_name;
    const existingIndex = selectedItems.findIndex(item =>
      buildTreatmentItemKey(item.procedure.code || item.procedure.procedure_name, item.teeth, item.condition) ===
      buildTreatmentItemKey(procedureIdentifier, currentTeeth, selectedCondition)
    );

    if (existingIndex >= 0) {
      const newItems = [...selectedItems];
      newItems.splice(existingIndex, 1);
      setSelectedItems(newItems);
    } else {
      const newItem: SelectedItem = {
        id: createClientId(),
        procedure,
        teeth: sortNumbers(currentTeeth),
        condition: selectedCondition,
        conditionLabel: availableConditions.find((condition) => condition.type === selectedCondition)?.condition_name || selectedCondition,
        conditionIcon: availableConditions.find((condition) => condition.type === selectedCondition)?.icon || '🦷',
        cost: (procedure.cost || 0) * Math.max(currentTeeth.length, 1)
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const isProcedureSelected = (code?: string) => {
    if (!code) return false;
    return selectedItems.some((item) => {
      const itemIdentifier = item.procedure.code || item.procedure.procedure_name;
      return buildTreatmentItemKey(itemIdentifier, item.teeth, item.condition) ===
        buildTreatmentItemKey(code, currentTeeth, selectedCondition);
    });
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== id));
  };

  const handleSave = () => {
    if (currentTeeth.length === 0) {
      return;
    }

    if (selectedItems.length > 0 || (selectedCondition && currentTeeth.length > 0)) {
      if (selectedItems.length === 0 && selectedCondition && currentTeeth.length > 0) {
        const conditionOnlyItem: SelectedItem = {
          id: createClientId(),
          procedure: { code: 'condition-only', procedure_name: 'Condition Only', cost: 0, category: 'General', is_custom: false, source: 'template_default' } as Procedure,
          teeth: sortNumbers(currentTeeth),
          condition: selectedCondition,
          conditionLabel: availableConditions.find((condition) => condition.type === selectedCondition)?.condition_name || selectedCondition,
          conditionIcon: availableConditions.find((condition) => condition.type === selectedCondition)?.icon || '🦷',
          cost: 0
        };
        onSave([conditionOnlyItem]);
      } else {
        onSave(selectedItems.filter((item) => item.teeth.length > 0));
      }
      onClose();
    }
  };

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
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] h-auto lg:h-[80vh] flex flex-col"
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
          <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
            {/* Left Panel - Controls */}
            <div className="w-full lg:w-7/12 p-4 sm:p-6 overflow-y-auto lg:border-r border-gray-200 space-y-6">

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
                {conditionSearch && availableConditions.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg shadow-sm">
                    {availableConditions.map((condition) => (
                      <button
                        key={condition.condition_name}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedCondition(condition.type); // Using type as value for compatibility
                          setConditionSearch('');

                          // Update condition for all selected items
                          setSelectedItems(prevItems => prevItems.map(item => ({
                            ...item,
                            condition: condition.type,
                            conditionLabel: condition.condition_name,
                            conditionIcon: condition.icon || '🦷',
                          })));
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span style={{ color: condition.color }}>{condition.icon || '🦷'}</span>
                        <span>{condition.condition_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Condition Display */}
                {selectedCondition && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700">
                    {(() => {
                      const cond = availableConditions.find(c => c.type === selectedCondition)
                        || { icon: '🦷', condition_name: selectedCondition };
                      return (
                        <>
                          <span className="text-lg">{cond.icon}</span>
                          <span className="font-medium">{cond.condition_name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedCondition(null);

                              // Update condition for all selected items
                              setSelectedItems(prevItems => prevItems.map(item => ({
                                ...item,
                                condition: null,
                                conditionLabel: null,
                                conditionIcon: null,
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
                  {availableProcedures.filter((proc) => proc.is_active !== false).map((proc) => {
                    const isSelected = isProcedureSelected(proc.code || proc.procedure_name);
                    return (
                      <div
                        key={proc.code || proc.procedure_name} // Fallback key
                        className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                        onClick={() => handleToggleProcedure(proc)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                            {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                            {proc.procedure_name}
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
            <div className="w-full lg:w-5/12 bg-gray-50 p-4 sm:p-6 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200 min-h-[240px]">
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
                        <h5 className="font-bold text-gray-800 pr-6">{item.procedure.procedure_name}</h5>
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
                            {item.conditionLabel || availableConditions.find(c => c.type === item.condition)?.condition_name || item.condition}
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
                    disabled={currentTeeth.length === 0 || (selectedItems.length === 0 && !(selectedCondition && currentTeeth.length > 0))}
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
