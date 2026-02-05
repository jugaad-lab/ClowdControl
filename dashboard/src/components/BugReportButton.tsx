'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Bug } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface BugFormData {
  title: string;
  description: string;
  severity: '1' | '2' | '3';
}

export function BugReportButton() {
  const { role } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<BugFormData>({
    title: '',
    description: '',
    severity: '3',
  });

  const severityLabels = {
    '1': 'P1/Critical',
    '2': 'P2/High',
    '3': 'P3/Medium',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Title is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[BUG] ${formData.title.trim()}`,
          description: formData.description.trim() || undefined,
          priority: parseInt(formData.severity),
          task_type: 'bug',
          status: 'backlog',
          created_by: 'user',
          project_id: '949d00d5-9072-4353-a0e9-174468978598',
          sprint_id: 'b7ad4d93-486c-4943-a7b6-9614ea476f1b',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit bug report');
      }

      const result = await response.json();
      setMessage({ 
        type: 'success', 
        text: `Bug filed! Task ID: ${result.id}` 
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        severity: '3',
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        setOpen(false);
        setMessage(null);
      }, 2000);

    } catch (error) {
      console.error('Error submitting bug report:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to submit bug report' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BugFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear message when user starts typing
    if (message) setMessage(null);
  };

  // Hide for viewers
  if (role === 'viewer') return null;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-400"
            title="Report Bug"
          >
            <Bug className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-orange-500" />
              Report Bug
            </DialogTitle>
            <DialogDescription>
              Found a bug? Let us know so we can fix it quickly.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="Brief description of the bug..."
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                aria-invalid={!formData.title.trim() && message?.type === 'error'}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <Textarea
                id="description"
                placeholder="Steps to reproduce, expected vs actual behavior..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium mb-2">
                Severity
              </label>
              <Select
                id="severity"
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value as BugFormData['severity'])}
              >
                {Object.entries(severityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading ? 'Submitting...' : 'Submit Bug Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}