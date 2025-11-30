// 分页组件的属性接口
export interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
}

/**
 * 自定义分页组件
 */
export default function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  // 计算显示的起始和结束记录数
  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="mt-6 flex justify-between items-center">
      <div className="text-sm text-gray-500">
        显示 {startRecord} - {endRecord} 条，共 {total} 条记录
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">每页显示：</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="10">10条</option>
          <option value="20">20条</option>
          <option value="50">50条</option>
        </select>
        <div className="flex items-center space-x-1 ml-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`px-3 py-1 rounded border ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
          >
            上一页
          </button>
          <span className="px-3 py-1 text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className={`px-3 py-1 rounded border ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
