import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { useDentalChart, useDentalChartActions, useDentalChartSummary } from '../../hooks/useDentalChart';
import { ConditionInput, ProcedureInput } from '../../api/services/dentalChart';

// Tooth numbering systems
const ADULT_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const PEDIATRIC_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const PEDIATRIC_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const MIXED_UPPER = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26];
const MIXED_LOWER = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36];

export type ToothStatus = 'healthy' | 'has-condition' | 'in-treatment' | 'treated';

export interface ConditionHistoryEntry {
  type: string;
  severity?: string;
  notes: string;
  timestamp: string;
  updated_by?: string;
}

export interface ToothCondition {
  name: string; // Frappe native ID (e.g., 'x9k2m5j1')
  type: 'cavity' | 'crown' | 'bridge' | 'implant' | 'root-canal' | 'extraction' | 'filling' | 'fracture' | 'abscess' | 'other';
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  severity?: string;
  created_by?: string;
  history?: ConditionHistoryEntry[];
}

export interface ProcedureTimelineEntry {
  status: 'planned' | 'in-progress' | 'completed';
  timestamp: string;
  notes?: string;
  changed_by?: string;
}

export interface ToothProcedure {
  name: string; // Frappe native ID (e.g., 'p4l9k2m1')
  procedure_name: string; // Display name (e.g., 'Root Canal Treatment')
  status: 'planned' | 'in-progress' | 'completed';
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  timeline: ProcedureTimelineEntry[];
}

export interface ToothData {
  number: number;
  status: ToothStatus;
  conditions: ToothCondition[];
  procedures: ToothProcedure[];
}

interface DentalChartProps {
  patientId: string;
  data?: Record<number, ToothData>;
  onChange?: (data: Record<number, ToothData>) => void;
  readOnly?: boolean;
}

type ModalMode = 'add-condition' | 'add-procedure' | 'edit-condition' | 'edit-procedure' | null;

const CONDITION_OPTIONS = [
  { value: 'cavity', label: 'Cavity', icon: '🦷', color: 'text-red-600' },
  { value: 'crown', label: 'Crown', icon: '👑', color: 'text-yellow-600' },
  { value: 'bridge', label: 'Bridge', icon: '🌉', color: 'text-blue-600' },
  { value: 'implant', label: 'Implant', icon: '🔩', color: 'text-gray-600' },
  { value: 'root-canal', label: 'Root Canal', icon: '🩺', color: 'text-purple-600' },
  { value: 'filling', label: 'Filling', icon: '⚪', color: 'text-green-600' },
  { value: 'extraction', label: 'Extraction', icon: '❌', color: 'text-red-700' },
  { value: 'fracture', label: 'Fracture', icon: '⚡', color: 'text-orange-600' },
  { value: 'abscess', label: 'Abscess', icon: '🔴', color: 'text-red-500' },
  { value: 'other', label: 'Other', icon: '📝', color: 'text-gray-500' },
] as const;

const PROCEDURE_OPTIONS = [
  'Cleaning',
  'Scaling',
  'Root Planing',
  'Whitening',
  'Polishing',
  'Fluoride Treatment',
  'Sealant',
  'X-Ray',
  'Consultation',
  'Other',
] as const;

const DentalChart: React.FC<DentalChartProps> = ({ patientId, data = {}, onChange, readOnly = false }) => {
  // Fetch dental chart data from API
  const { data: dentalChartData, isLoading: isLoadingChart } = useDentalChart(patientId);
  const { data: summaryData, isLoading: isLoadingSummary } = useDentalChartSummary(patientId);
  const actions = useDentalChartActions(patientId);

  const [chartType, setChartType] = useState<'adult' | 'pediatric' | 'mixed'>('adult');
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'by-tooth' | 'by-date'>('by-tooth');
  
  // Initialize teeth data from API or props
  const [teethData, setTeethData] = useState<Record<number, ToothData>>({});

  // Update teethData when API data is loaded
  useEffect(() => {
    if (dentalChartData?.teeth) {
      // Convert API response to component format
      const convertedTeeth: Record<number, ToothData> = {};
      
      Object.entries(dentalChartData.teeth).forEach(([toothNum, toothData]: [string, any]) => {
        const toothNumber = parseInt(toothNum, 10);
        
        convertedTeeth[toothNumber] = {
          number: toothNumber,
          status: toothData.status || 'healthy',
          conditions: (toothData.conditions || []).map((cond: any) => ({
            name: cond.name, // Frappe native ID
            type: cond.type,
            notes: cond.notes || '',
            date: cond.date,
            createdAt: cond.created_at,
            updatedAt: cond.updated_at,
            severity: cond.severity,
            created_by: cond.created_by,
            history: (cond.history || []).map((hist: any) => ({
              type: hist.type,
              severity: hist.severity,
              notes: hist.notes || '',
              timestamp: hist.timestamp,
              updated_by: hist.updated_by,
            })),
          })),
          procedures: (toothData.procedures || []).map((proc: any) => ({
            name: proc.name, // Frappe native ID
            procedure_name: proc.procedure_name, // Display name
            status: proc.status,
            notes: proc.notes || '',
            date: proc.date,
            createdAt: proc.created_at,
            updatedAt: proc.updated_at,
            timeline: (proc.timeline || []).map((entry: any) => ({
              status: entry.status,
              timestamp: entry.timestamp,
              notes: entry.notes,
              changed_by: entry.changed_by,
            })),
          })),
        };
      });
      
      setTeethData(convertedTeeth);
      if (dentalChartData.chart_type) {
        setChartType(dentalChartData.chart_type);
      }
    } else if (Object.keys(data).length > 0) {
      setTeethData(data);
    }
  }, [dentalChartData, data]);
  
  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingToothNumber, setEditingToothNumber] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; toothNum: number } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showTimeline, setShowTimeline] = useState<{ procedureId: string; toothNum: number } | null>(null);
  
  // Form states
  const [conditionType, setConditionType] = useState<ToothCondition['type']>('cavity');
  const [conditionNotes, setConditionNotes] = useState('');
  
  const [procedureName, setProcedureName] = useState('Cleaning');
  const [procedureStatus, setProcedureStatus] = useState<ToothProcedure['status']>('planned');
  const [procedureNotes, setProcedureNotes] = useState('');

  const getTeethForChart = () => {
    switch (chartType) {
      case 'pediatric':
        return { upper: PEDIATRIC_UPPER, lower: PEDIATRIC_LOWER };
      case 'mixed':
        return { upper: MIXED_UPPER, lower: MIXED_LOWER };
      default:
        return { upper: ADULT_UPPER, lower: ADULT_LOWER };
    }
  };

  const getStatusColor = (toothNum: number): string => {
    const toothData = teethData[toothNum];
    if (!toothData) return 'bg-white border-gray-300 hover:border-primary-400';
    
    switch (toothData.status) {
      case 'has-condition':
        return 'bg-yellow-50 border-yellow-400 hover:border-yellow-500';
      case 'in-treatment':
        return 'bg-cyan-50 border-cyan-400 hover:border-cyan-500';
      case 'treated':
        return 'bg-green-50 border-green-400 hover:border-green-500';
      default:
        return 'bg-white border-gray-300 hover:border-primary-400';
    }
  };

  const updateTeethData = (newData: Record<number, ToothData>) => {
    setTeethData(newData);
    onChange?.(newData);
  };

  const calculateToothStatus = (tooth: ToothData): ToothStatus => {
    if (tooth.conditions.some(c => c.type === 'extraction')) return 'treated';
    if (tooth.procedures.some(p => p.status === 'completed')) return 'treated';
    if (tooth.procedures.some(p => p.status === 'in-progress')) return 'in-treatment';
    if (tooth.procedures.some(p => p.status === 'planned')) return 'in-treatment';
    if (tooth.conditions.length > 0) return 'has-condition';
    return 'healthy';
  };

  const handleToothClick = (toothNumber: number, event: React.MouseEvent) => {
    if (readOnly) return;

    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      // Multi-select mode
      setSelectedTeeth(prev => {
        const newSet = new Set(prev);
        if (newSet.has(toothNumber)) {
          newSet.delete(toothNumber);
        } else {
          newSet.add(toothNumber);
        }
        return newSet;
      });
    } else {
      // Single select/deselect toggle
      setSelectedTeeth(prev => {
        const newSet = new Set(prev);
        if (newSet.has(toothNumber) && newSet.size === 1) {
          // If this is the only selected tooth, deselect it
          newSet.clear();
        } else {
          // Otherwise, select only this tooth
          newSet.clear();
          newSet.add(toothNumber);
        }
        return newSet;
      });
    }
  };

  const handleToothRightClick = (toothNumber: number, event: React.MouseEvent) => {
    if (readOnly) return;
    event.preventDefault();
    
    // Add to selection if not already selected
    if (!selectedTeeth.has(toothNumber)) {
      setSelectedTeeth(new Set([toothNumber]));
    }
    
    // Show context menu
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      toothNum: toothNumber,
    });
  };

  const openAddConditionModal = () => {
    if (selectedTeeth.size === 0) return;
    setConditionType('cavity');
    setConditionNotes('');
    setModalMode('add-condition');
  };

  const openAddProcedureModal = () => {
    if (selectedTeeth.size === 0) return;
    setProcedureName('Cleaning');
    setProcedureStatus('planned');
    setProcedureNotes('');
    setModalMode('add-procedure');
  };

  const openEditConditionModal = (toothNum: number, conditionId: string) => {
    const tooth = teethData[toothNum];
    const condition = tooth?.conditions.find(c => c.name === conditionId);
    if (!condition) return;

    setEditingToothNumber(toothNum);
    setEditingItemId(conditionId);
    setConditionType(condition.type);
    setConditionNotes(condition.notes);
    setModalMode('edit-condition');
  };

  const openEditProcedureModal = (toothNum: number, procedureId: string) => {
    const tooth = teethData[toothNum];
    const procedure = tooth?.procedures.find(p => p.name === procedureId);
    if (!procedure) return;

    setEditingToothNumber(toothNum);
    setEditingItemId(procedureId);
    setProcedureName(procedure.procedure_name);
    setProcedureStatus(procedure.status);
    setProcedureNotes(procedure.notes);
    setModalMode('edit-procedure');
  };

  const handleSaveCondition = async () => {
    const teethToUpdate = modalMode === 'edit-condition' && editingToothNumber 
      ? [editingToothNumber]
      : Array.from(selectedTeeth);
    
    if (teethToUpdate.length === 0) return;

    const conditionInput: ConditionInput = {
      type: conditionType,
      notes: conditionNotes,
      date: new Date().toISOString().split('T')[0],
    };

    if (modalMode === 'edit-condition' && editingItemId && editingToothNumber) {
      // Update existing condition via API
      actions.updateCondition(editingItemId, conditionInput);
    } else {
      // Add new condition via API
      actions.addCondition(teethToUpdate, conditionInput);
    }

    closeModal();
  };

  const handleSaveProcedure = async () => {
    const teethToUpdate = modalMode === 'edit-procedure' && editingToothNumber 
      ? [editingToothNumber]
      : Array.from(selectedTeeth);
    
    if (teethToUpdate.length === 0) return;

    const procedureInput: ProcedureInput = {
      name: procedureName,
      status: procedureStatus,
      notes: procedureNotes,
      date: new Date().toISOString().split('T')[0],
    };

    if (modalMode === 'edit-procedure' && editingItemId && editingToothNumber) {
      // Update existing procedure (backend automatically creates timeline entry if status changed)
      actions.updateProcedure(editingItemId, procedureInput);
    } else {
      // Add new procedure via API
      actions.addProcedure(teethToUpdate, procedureInput);
    }

    closeModal();
  };

  const handleRemoveCondition = (toothNum: number, conditionId: string) => {
    actions.removeCondition(conditionId, 'User removed condition');
    closeModal();
  };

  const handleRemoveProcedure = (toothNum: number, procedureId: string) => {
    actions.removeProcedure(procedureId, 'User removed procedure');
    closeModal();
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingItemId(null);
    setEditingToothNumber(null);
    setSelectedTeeth(new Set());
    setContextMenu(null);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleContextMenuAction = (action: 'condition' | 'procedure') => {
    if (!contextMenu) return;
    
    if (action === 'condition') {
      openAddConditionModal();
    } else {
      openAddProcedureModal();
    }
    closeContextMenu();
  };

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return formatDateTime(isoString);
  };

  const teeth = getTeethForChart();

  const getConditionIcon = (type: ToothCondition['type']) => {
    return CONDITION_OPTIONS.find(opt => opt.value === type)?.icon || '📝';
  };

  const getConditionLabel = (type: ToothCondition['type']) => {
    return CONDITION_OPTIONS.find(opt => opt.value === type)?.label || type;
  };

  const getProcedureStatusColor = (status: ToothProcedure['status']) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Show loading state
  if (isLoadingChart) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading dental chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">{/* Show mutation loading overlay */}
      {actions.isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700 font-medium">Saving changes...</span>
          </div>
        </div>
      )}
      
      {/* Chart Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType('adult')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
              chartType === 'adult'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            Adult
          </button>
          <button
            onClick={() => setChartType('pediatric')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
              chartType === 'pediatric'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Pediatric
          </button>
          <button
            onClick={() => setChartType('mixed')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
              chartType === 'mixed'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            Mixed
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-yellow-50 border-2 border-yellow-400 rounded"></div>
            <span>Has Condition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-cyan-50 border-2 border-cyan-400 rounded"></div>
            <span>In Treatment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-50 border-2 border-green-400 rounded"></div>
            <span>Treated</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!readOnly && selectedTeeth.size > 0 && (
        <Card className="p-4 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-bold text-primary-900">
                {selectedTeeth.size} tooth{selectedTeeth.size > 1 ? ' selected' : ' selected'}
              </span>
              <span className="text-primary-700 ml-2 font-medium">
                ({Array.from(selectedTeeth).sort((a, b) => a - b).join(', ')})
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={openAddConditionModal}
                className="bg-red-600 hover:bg-red-700"
              >
                + Add Condition
              </Button>
              <Button
                size="sm"
                onClick={openAddProcedureModal}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + Add Procedure
              </Button>
              <button
                onClick={() => setSelectedTeeth(new Set())}
                className="text-sm text-primary-600 hover:text-primary-800 font-semibold px-3"
              >
                Clear
              </button>
            </div>
          </div>
          <p className="text-xs text-primary-600 mt-2 font-medium">
            💡 Tip: Hold Shift/Ctrl/Cmd to select multiple teeth, or right-click on teeth
          </p>
        </Card>
      )}

      {/* Summary Button */}
      {Object.keys(teethData).length > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => setShowSummary(true)}
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Summary Report
          </Button>
        </div>
      )}

      {/* View Mode Toggle */}
      {Object.keys(teethData).length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-bold text-gray-700">View Mode:</span>
            </div>
            <div className="flex items-center bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setViewMode('by-tooth')}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                  viewMode === 'by-tooth'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
                By Tooth
              </button>
              <button
                onClick={() => setViewMode('by-date')}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                  viewMode === 'by-date'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                By Date
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">
            {viewMode === 'by-tooth' 
              ? '📋 Viewing treatments organized by tooth number' 
              : '📅 Viewing treatments in chronological order'}
          </p>
        </Card>
      )}

      {/* Dental Chart */}
      <Card className="p-6">
        <div className="space-y-8">
          {/* Upper Jaw */}
          <div>
            <h3 className="text-center text-lg font-bold text-gray-800 mb-4">Upper Jaw</h3>
            <div className="flex justify-center gap-2">
              {teeth.upper.map(toothNumber => {
                const toothData = teethData[toothNumber];
                const isSelected = selectedTeeth.has(toothNumber);
                const hasData = toothData && (toothData.conditions.length > 0 || toothData.procedures.length > 0);

                return (
                  <button
                    key={toothNumber}
                    onClick={(e) => handleToothClick(toothNumber, e)}
                    onContextMenu={(e) => handleToothRightClick(toothNumber, e)}
                    className={`relative w-12 h-20 border-2 rounded-lg transition-all ${getStatusColor(toothNumber)} ${
                      isSelected ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-lg' : 'shadow-sm'
                    }`}
                    disabled={readOnly}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">{toothNumber}</span>
                    </div>
                    {hasData && (
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                        {toothData.conditions.length > 0 && (
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-white" title="Has conditions"></div>
                        )}
                        {toothData.procedures.length > 0 && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" title="Has procedures"></div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lower Jaw */}
          <div>
            <h3 className="text-center text-lg font-bold text-gray-800 mb-4">Lower Jaw</h3>
            <div className="flex justify-center gap-2">
              {teeth.lower.map(toothNumber => {
                const toothData = teethData[toothNumber];
                const isSelected = selectedTeeth.has(toothNumber);
                const hasData = toothData && (toothData.conditions.length > 0 || toothData.procedures.length > 0);

                return (
                  <button
                    key={toothNumber}
                    onClick={(e) => handleToothClick(toothNumber, e)}
                    onContextMenu={(e) => handleToothRightClick(toothNumber, e)}
                    className={`relative w-12 h-20 border-2 rounded-lg transition-all ${getStatusColor(toothNumber)} ${
                      isSelected ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-lg' : 'shadow-sm'
                    }`}
                    disabled={readOnly}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">{toothNumber}</span>
                    </div>
                    {hasData && (
                      <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                        {toothData.conditions.length > 0 && (
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-white" title="Has conditions"></div>
                        )}
                        {toothData.procedures.length > 0 && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" title="Has procedures"></div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Teeth Details */}
      {Object.keys(teethData).length > 0 && (
        <>
          {viewMode === 'by-tooth' ? (
            // BY TOOTH VIEW
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(teethData)
                .filter(([toothNum]) => selectedTeeth.size === 0 || selectedTeeth.has(parseInt(toothNum)))
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([toothNum, data]) => (
                  <Card key={toothNum} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-base font-bold text-gray-800">Tooth {toothNum}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        data.status === 'healthy' ? 'bg-gray-100 text-gray-700' :
                        data.status === 'has-condition' ? 'bg-yellow-100 text-yellow-800' :
                        data.status === 'in-treatment' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {data.status.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Conditions */}
                    {data.conditions.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-bold text-gray-600 mb-2">CONDITIONS</h5>
                        <div className="space-y-2">
                          {data.conditions.map((condition) => (
                            <div 
                              key={condition.name}
                              className="bg-red-50 border border-red-200 rounded-lg p-2 cursor-pointer hover:bg-red-100 transition-colors"
                              onClick={() => openEditConditionModal(parseInt(toothNum), condition.name)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getConditionIcon(condition.type)}</span>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800">{getConditionLabel(condition.type)}</div>
                                    {condition.notes && (
                                      <div className="text-xs text-gray-600 mt-0.5">{condition.notes}</div>
                                    )}
                                  </div>
                                </div>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">Added: {condition.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Procedures */}
                    {data.procedures.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-gray-600 mb-2">PROCEDURES</h5>
                        <div className="space-y-2">
                          {data.procedures.map((procedure) => (
                            <div 
                              key={procedure.procedure_name}
                              className="bg-blue-50 border border-blue-200 rounded-lg p-2"
                            >
                              <div 
                                className="cursor-pointer hover:bg-blue-100 transition-colors rounded p-1 -m-1"
                                onClick={() => openEditProcedureModal(parseInt(toothNum), procedure.name)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="text-sm font-semibold text-gray-800">{procedure.procedure_name}</div>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getProcedureStatusColor(procedure.status)}`}>
                                        {procedure.status}
                                      </span>
                                    </div>
                                    {procedure.notes && (
                                      <div className="text-xs text-gray-600 mt-0.5">{procedure.notes}</div>
                                    )}
                                    <div className="text-xs text-gray-500 mt-1">Date: {procedure.date}</div>
                                  </div>
                                  <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                              
                              {procedure.timeline && procedure.timeline.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTimeline({ procedureId: procedure.name, toothNum: parseInt(toothNum) });
                                  }}
                                  className="w-full mt-2 px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  View Timeline ({procedure.timeline.length} updates)
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
            </div>
          ) : (
            // BY DATE VIEW
            <div className="space-y-3">
              {(() => {
                // Collect all items with dates
                type DateItem = {
                  date: string;
                  timestamp: string;
                  type: 'condition' | 'procedure';
                  toothNum: number;
                  item: ToothCondition | ToothProcedure;
                };
                
                const allItems: DateItem[] = [];
                
                Object.entries(teethData)
                  .filter(([toothNum]) => selectedTeeth.size === 0 || selectedTeeth.has(parseInt(toothNum)))
                  .forEach(([toothNum, data]) => {
                    data.conditions.forEach(condition => {
                      allItems.push({
                        date: condition.date,
                        timestamp: condition.createdAt,
                        type: 'condition',
                        toothNum: parseInt(toothNum),
                        item: condition,
                      });
                    });
                    
                    data.procedures.forEach(procedure => {
                      allItems.push({
                        date: procedure.date,
                        timestamp: procedure.createdAt,
                        type: 'procedure',
                        toothNum: parseInt(toothNum),
                        item: procedure,
                      });
                    });
                  });
                
                // Sort by date (most recent first)
                allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
                // Group by date
                const groupedByDate: Record<string, DateItem[]> = {};
                allItems.forEach(item => {
                  if (!groupedByDate[item.date]) {
                    groupedByDate[item.date] = [];
                  }
                  groupedByDate[item.date].push(item);
                });
                
                return Object.entries(groupedByDate).map(([date, items]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg px-4 py-2 shadow-md">
                        <div className="text-xs font-bold">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="text-2xl font-bold">
                          {new Date(date).getDate()}
                        </div>
                        <div className="text-xs">
                          {new Date(date).getFullYear()}
                        </div>
                      </div>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-200 to-transparent"></div>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {items.length} item{items.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 ml-0 lg:ml-24">
                      {items.map((item, idx) => (
                        <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-blue-200">
                              <span className="text-lg font-bold text-blue-700">{item.toothNum}</span>
                            </div>
                            
                            <div className="flex-1">
                              {item.type === 'condition' ? (
                                <div
                                  className="cursor-pointer hover:bg-red-50 -m-2 p-2 rounded-lg transition-colors"
                                  onClick={() => openEditConditionModal(item.toothNum, item.item.name)}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{getConditionIcon((item.item as ToothCondition).type)}</span>
                                    <span className="text-sm font-bold text-gray-800">
                                      {getConditionLabel((item.item as ToothCondition).type)}
                                    </span>
                                    <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                      CONDITION
                                    </span>
                                  </div>
                                  {item.item.notes && (
                                    <p className="text-xs text-gray-600 mt-1">{item.item.notes}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div
                                    className="cursor-pointer hover:bg-blue-50 -m-2 p-2 rounded-lg transition-colors"
                                    onClick={() => openEditProcedureModal(item.toothNum, item.item.name)}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-bold text-gray-800">
                                        {(item.item as ToothProcedure).name}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getProcedureStatusColor((item.item as ToothProcedure).status)}`}>
                                        {(item.item as ToothProcedure).status}
                                      </span>
                                    </div>
                                    {item.item.notes && (
                                      <p className="text-xs text-gray-600 mt-1">{item.item.notes}</p>
                                    )}
                                  </div>
                                  
                                  {(item.item as ToothProcedure).timeline && (item.item as ToothProcedure).timeline.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTimeline({ procedureId: item.item.name, toothNum: item.toothNum });
                                      }}
                                      className="w-full px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      View Timeline ({(item.item as ToothProcedure).timeline.length} updates)
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Condition Modal */}
      {(modalMode === 'add-condition' || modalMode === 'edit-condition') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === 'edit-condition' ? 'Edit Condition' : 'Add Condition'}
                {modalMode === 'add-condition' && selectedTeeth.size > 1 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({selectedTeeth.size} teeth)
                  </span>
                )}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Condition Type Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Select Condition</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setConditionType(option.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        conditionType === option.value
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{option.icon}</span>
                        <span className={`text-sm font-semibold ${option.color}`}>
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {modalMode === 'edit-condition' && (
                  <Button
                    variant="outline"
                    onClick={() => editingToothNumber && editingItemId && handleRemoveCondition(editingToothNumber, editingItemId)}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCondition}
                  className="flex-1"
                >
                  {modalMode === 'edit-condition' ? 'Update' : 'Add Condition'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Procedure Modal */}
      {(modalMode === 'add-procedure' || modalMode === 'edit-procedure') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === 'edit-procedure' ? 'Edit Procedure' : 'Add Procedure'}
                {modalMode === 'add-procedure' && selectedTeeth.size > 1 && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({selectedTeeth.size} teeth)
                  </span>
                )}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Procedure Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Procedure Name</label>
                <select
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                >
                  {PROCEDURE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Custom procedure name if "Other" is selected */}
              {procedureName === 'Other' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Custom Procedure Name</label>
                  <input
                    type="text"
                    onChange={(e) => setProcedureName(e.target.value)}
                    placeholder="Enter procedure name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
              )}

              {/* Procedure Status */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setProcedureStatus('planned')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      procedureStatus === 'planned'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📋</div>
                      <div className="text-xs font-semibold text-gray-700">Planned</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setProcedureStatus('in-progress')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      procedureStatus === 'in-progress'
                        ? 'border-yellow-500 bg-yellow-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">⚙️</div>
                      <div className="text-xs font-semibold text-gray-700">In Progress</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setProcedureStatus('completed')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      procedureStatus === 'completed'
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">✅</div>
                      <div className="text-xs font-semibold text-gray-700">Completed</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={procedureNotes}
                  onChange={(e) => setProcedureNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                {modalMode === 'edit-procedure' && (
                  <Button
                    variant="outline"
                    onClick={() => editingToothNumber && editingItemId && handleRemoveProcedure(editingToothNumber, editingItemId)}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProcedure}
                  className="flex-1"
                >
                  {modalMode === 'edit-procedure' ? 'Update' : 'Add Procedure'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right-Click Context Menu */}
      {contextMenu && !readOnly && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b">
              {selectedTeeth.size > 1 
                ? `${selectedTeeth.size} teeth selected` 
                : `Tooth ${contextMenu.toothNum}`}
            </div>
            
            <button
              onClick={() => handleContextMenuAction('condition')}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <span className="text-xl">🦷</span>
              <span className="font-medium">Add Condition</span>
            </button>
            
            <button
              onClick={() => handleContextMenuAction('procedure')}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-3 text-gray-700"
            >
              <span className="text-xl">💉</span>
              <span className="font-medium">Add Procedure</span>
            </button>

            {teethData[contextMenu.toothNum] && (
              <>
                <div className="border-t my-1"></div>
                {teethData[contextMenu.toothNum].conditions.length > 0 && (
                  <div className="px-3 py-1">
                    <div className="text-xs font-semibold text-gray-500 mb-1">Conditions</div>
                    {teethData[contextMenu.toothNum].conditions.map((condition) => (
                      <button
                        key={condition.name}
                        onClick={() => {
                          openEditConditionModal(contextMenu.toothNum, condition.name);
                          closeContextMenu();
                        }}
                        className="w-full px-2 py-1.5 text-left text-xs hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                      >
                        <span>{getConditionIcon(condition.type)}</span>
                        <span>{getConditionLabel(condition.type)}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {teethData[contextMenu.toothNum].procedures.length > 0 && (
                  <div className="px-3 py-1">
                    <div className="text-xs font-semibold text-gray-500 mb-1">Procedures</div>
                    {teethData[contextMenu.toothNum].procedures.map((procedure) => (
                      <button
                        key={procedure.procedure_name}
                        onClick={() => {
                          openEditProcedureModal(contextMenu.toothNum, procedure.name);
                          closeContextMenu();
                        }}
                        className="w-full px-2 py-1.5 text-left text-xs hover:bg-gray-100 rounded transition-colors flex items-center justify-between"
                      >
                        <span>{procedure.procedure_name}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${getProcedureStatusColor(procedure.status).replace('border-', 'border ')}`}>
                          {procedure.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Procedure Timeline Modal */}
      {showTimeline && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">Procedure Timeline</h3>
              <button onClick={() => setShowTimeline(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {(() => {
                const tooth = teethData[showTimeline.toothNum];
                const procedure = tooth?.procedures.find(p => p.name === showTimeline.procedureId);
                
                if (!procedure) return null;

                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-2">Tooth {showTimeline.toothNum} - {procedure.procedure_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Current Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getProcedureStatusColor(procedure.status)}`}>
                          {procedure.status}
                        </span>
                      </div>
                      {procedure.notes && (
                        <p className="text-sm text-gray-600 mt-2">{procedure.notes}</p>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-6">
                        {procedure.timeline.map((entry, index) => (
                          <div key={index} className="relative pl-10">
                            <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-white ${
                              entry.status === 'planned' ? 'bg-blue-500' :
                              entry.status === 'in-progress' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}></div>
                            
                            <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  entry.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                  entry.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {entry.status}
                                </span>
                                <span className="text-xs text-gray-500">{formatTimeAgo(entry.timestamp)}</span>
                              </div>
                              <div className="text-xs text-gray-600">{formatDateTime(entry.timestamp)}</div>
                              {entry.notes && (
                                <p className="text-sm text-gray-700 mt-2">{entry.notes}</p>
                              )}
                              {entry.changed_by && (
                                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                  <span className="font-semibold">By:</span>
                                  <span>{entry.changed_by}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Created:</span>
                        <span>{formatDateTime(procedure.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Last Updated:</span>
                        <span>{formatDateTime(procedure.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Summary Report Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold">Dental Chart Summary Report</h3>
                <p className="text-sm text-purple-100 mt-1">Comprehensive treatment overview</p>
              </div>
              <button onClick={() => setShowSummary(false)} className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 text-center border border-gray-200 shadow-sm">
                  <div className="text-3xl font-bold text-gray-800">{Object.keys(teethData).length}</div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Teeth Affected</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center border border-yellow-200 shadow-sm">
                  <div className="text-3xl font-bold text-yellow-800">
                    {Object.values(teethData).reduce((sum, t) => sum + t.conditions.length, 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Total Conditions</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-200 shadow-sm">
                  <div className="text-3xl font-bold text-blue-800">
                    {Object.values(teethData).reduce((sum, t) => sum + t.procedures.length, 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Total Procedures</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center border border-green-200 shadow-sm">
                  <div className="text-3xl font-bold text-green-800">
                    {Object.values(teethData).reduce((sum, t) => sum + t.procedures.filter(p => p.status === 'completed').length, 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-2 font-semibold">Completed</div>
                </div>
              </div>

              {/* View Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const summaryView = document.getElementById('summary-by-date');
                      const toothView = document.getElementById('summary-by-tooth');
                      if (summaryView && toothView) {
                        summaryView.style.display = 'block';
                        toothView.style.display = 'none';
                      }
                      const btn1 = document.getElementById('tab-date-btn');
                      const btn2 = document.getElementById('tab-tooth-btn');
                      if (btn1 && btn2) {
                        btn1.className = 'px-6 py-3 font-semibold text-sm border-b-2 border-purple-600 text-purple-600 transition-colors';
                        btn2.className = 'px-6 py-3 font-semibold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors';
                      }
                    }}
                    id="tab-date-btn"
                    className="px-6 py-3 font-semibold text-sm border-b-2 border-purple-600 text-purple-600 transition-colors"
                  >
                    📅 Timeline View
                  </button>
                  <button
                    onClick={() => {
                      const summaryView = document.getElementById('summary-by-date');
                      const toothView = document.getElementById('summary-by-tooth');
                      if (summaryView && toothView) {
                        summaryView.style.display = 'none';
                        toothView.style.display = 'block';
                      }
                      const btn1 = document.getElementById('tab-date-btn');
                      const btn2 = document.getElementById('tab-tooth-btn');
                      if (btn1 && btn2) {
                        btn1.className = 'px-6 py-3 font-semibold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors';
                        btn2.className = 'px-6 py-3 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 transition-colors';
                      }
                    }}
                    id="tab-tooth-btn"
                    className="px-6 py-3 font-semibold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    🦷 By Tooth View
                  </button>
                </div>
              </div>

              {/* Timeline View (By Date) */}
              <div id="summary-by-date" className="space-y-4">
                {(() => {
                  type DateItem = {
                    date: string;
                    timestamp: string;
                    type: 'condition' | 'procedure';
                    toothNum: number;
                    item: ToothCondition | ToothProcedure;
                  };
                  
                  const allItems: DateItem[] = [];
                  
                  Object.entries(teethData).forEach(([toothNum, data]) => {
                    data.conditions.forEach(condition => {
                      allItems.push({
                        date: condition.date,
                        timestamp: condition.createdAt,
                        type: 'condition',
                        toothNum: parseInt(toothNum),
                        item: condition,
                      });
                    });
                    
                    data.procedures.forEach(procedure => {
                      allItems.push({
                        date: procedure.date,
                        timestamp: procedure.createdAt,
                        type: 'procedure',
                        toothNum: parseInt(toothNum),
                        item: procedure,
                      });
                    });
                  });
                  
                  allItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                  
                  const groupedByDate: Record<string, DateItem[]> = {};
                  allItems.forEach(item => {
                    if (!groupedByDate[item.date]) {
                      groupedByDate[item.date] = [];
                    }
                    groupedByDate[item.date].push(item);
                  });
                  
                  return (
                    <div className="relative max-h-[500px] overflow-y-auto pr-2">
                      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-300 via-blue-300 to-purple-300"></div>
                      
                      {Object.entries(groupedByDate).map(([date, items]) => (
                        <div key={date} className="relative mb-6 last:mb-0">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="relative z-10 flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-xl px-4 py-3 shadow-lg">
                              <div className="text-xs font-bold opacity-90">
                                {new Date(date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                              </div>
                              <div className="text-3xl font-bold leading-none">
                                {new Date(date).getDate()}
                              </div>
                              <div className="text-xs opacity-90">
                                {new Date(date).getFullYear()}
                              </div>
                            </div>
                            
                            <div className="flex-1 pt-2">
                              <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-base font-bold text-gray-800">
                                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h4>
                                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                                  {items.length} item{items.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {items.map((item, idx) => (
                                  <div key={idx} className="bg-white border-2 border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-purple-200 transition-all">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                                        <span className="text-xl font-bold text-white">{item.toothNum}</span>
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        {item.type === 'condition' ? (
                                          <>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-2xl">{getConditionIcon((item.item as ToothCondition).type)}</span>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-800 truncate">
                                                  {getConditionLabel((item.item as ToothCondition).type)}
                                                </div>
                                                <div className="text-xs text-gray-500">Tooth #{item.toothNum}</div>
                                              </div>
                                            </div>
                                            <div className="inline-block px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                              CONDITION
                                            </div>
                                            {item.item.notes && (
                                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">{item.item.notes}</p>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <div className="mb-2">
                                              <div className="text-sm font-bold text-gray-800 mb-1">
                                                {(item.item as ToothProcedure).name}
                                              </div>
                                              <div className="text-xs text-gray-500">Tooth #{item.toothNum}</div>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold border ${getProcedureStatusColor((item.item as ToothProcedure).status)}`}>
                                                {(item.item as ToothProcedure).status.toUpperCase()}
                                              </span>
                                              {(item.item as ToothProcedure).timeline && (item.item as ToothProcedure).timeline.length > 1 && (
                                                <button
                                                  onClick={() => setShowTimeline({ procedureId: item.item.name, toothNum: item.toothNum })}
                                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  Timeline
                                                </button>
                                              )}
                                            </div>
                                            {item.item.notes && (
                                              <p className="text-xs text-gray-600 line-clamp-2">{item.item.notes}</p>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* By Tooth View */}
              <div id="summary-by-tooth" style={{ display: 'none' }} className="space-y-4">
                <div className="max-h-[500px] overflow-y-auto pr-2">
                  {Object.entries(teethData)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([toothNum, data]) => (
                      <div key={toothNum} className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-white">{toothNum}</span>
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-800">Tooth #{toothNum}</h4>
                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${
                              data.status === 'healthy' ? 'bg-gray-200 text-gray-700' :
                              data.status === 'has-condition' ? 'bg-yellow-200 text-yellow-900' :
                              data.status === 'in-treatment' ? 'bg-cyan-200 text-cyan-900' :
                              'bg-green-200 text-green-900'
                            }`}>
                              {data.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              <span className="font-bold text-red-700">{data.conditions.length}</span> condition{data.conditions.length !== 1 ? 's' : ''}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-bold text-blue-700">{data.procedures.length}</span> procedure{data.procedures.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Conditions */}
                          {data.conditions.length > 0 && (
                            <div>
                              <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                CONDITIONS
                              </h5>
                              <div className="space-y-2">
                                {data.conditions.map((condition) => (
                                  <div key={condition.name} className="bg-white border border-red-200 rounded-lg p-3 shadow-sm">
                                    <div className="flex items-start gap-2 mb-2">
                                      <span className="text-xl">{getConditionIcon(condition.type)}</span>
                                      <div className="flex-1">
                                        <div className="text-sm font-bold text-gray-800">{getConditionLabel(condition.type)}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          Added: {new Date(condition.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                      </div>
                                    </div>
                                    {condition.notes && (
                                      <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">{condition.notes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Procedures */}
                          {data.procedures.length > 0 && (
                            <div>
                              <h5 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                PROCEDURES
                              </h5>
                              <div className="space-y-2">
                                {data.procedures.map((procedure) => (
                                  <div key={procedure.procedure_name} className="bg-white border border-blue-200 rounded-lg p-3 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-sm font-bold text-gray-800">{procedure.procedure_name}</div>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getProcedureStatusColor(procedure.status)}`}>
                                        {procedure.status.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">
                                      Date: {new Date(procedure.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    {procedure.notes && (
                                      <p className="text-xs text-gray-600 bg-gray-50 rounded p-2 mb-2">{procedure.notes}</p>
                                    )}
                                    {procedure.timeline && procedure.timeline.length > 1 && (
                                      <button
                                        onClick={() => setShowTimeline({ procedureId: procedure.name, toothNum: parseInt(toothNum) })}
                                        className="w-full px-2 py-1.5 text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded transition-colors flex items-center justify-center gap-1"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        View Timeline ({procedure.timeline.length} updates)
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowSummary(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalChart;
