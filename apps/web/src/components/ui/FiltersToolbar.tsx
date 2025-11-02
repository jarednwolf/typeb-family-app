'use client';

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
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e)=>onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
          <select
            value={sortBy}
            onChange={(e)=>onSortByChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            value={query}
            onChange={(e)=>onQueryChange(e.target.value)}
            placeholder="Search tasks"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>

        <div className="flex items-end gap-2 justify-end">
          <button onClick={onReset} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Reset</button>
          {right}
        </div>
      </div>
    </div>
  );
}


