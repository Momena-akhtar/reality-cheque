interface CategorySortProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
    categories: string[];
}

export default function CategorySort({ selectedCategory, onCategoryChange, categories }: CategorySortProps) {
    return (
        <div className="relative w-54">
            <select 
                className="w-full px-4 text-sm py-2 bg-background cursor-pointer max-h-[100px] text-foreground border border-border rounded-lg appearance-none focus:border-transparent [&>*]:bg-background [&>*]:rounded-md overflow-y-auto" 
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
            >
                {categories.map((category) => (
                    <option key={category} value={category} className='text-sm text-foreground bg-background'>
                        {category}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    )
}