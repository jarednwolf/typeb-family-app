'use client';

import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

type Option = { value: string; label: string };

type FiltersToolbarProps = {
  status: string;
  onStatusChange: (v: string) => void;
  sortBy: string;
  onSortByChange: (v: string) => void;
  query: string;
  onQueryChange: (v: string) => void;
  onReset: () => void;
  right?: React.ReactNode;
};

export default function FiltersToolbar({ status, onStatusChange, sortBy, onSortByChange, query, onQueryChange, onReset, right }: FiltersToolbarProps) {
  return (
    <Card className="p-4">
      <div className="grid gap-4 sm:grid-cols-4 items-end">
        <Select label="Status" value={status} onChange={(e)=>onStatusChange(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </Select>

        <Select label="Sort by" value={sortBy} onChange={(e)=>onSortByChange(e.target.value)}>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
        </Select>

        <Input label="Search" value={query} onChange={(e)=>onQueryChange(e.target.value)} placeholder="Search tasks" />

        <div className="flex items-end gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onReset}>Reset</Button>
          {right}
        </div>
      </div>
    </Card>
  );
}


