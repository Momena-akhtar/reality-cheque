export default function OtherFilters() {
    const options = [
        "Order By",
        "Name A-Z",
        "Name Z-A",
        "Newest",
        "Oldest",
        "Most Popular"
    ]

    return (
        <div className="relative w-38">
            <select 
                className="w-full px-4 py-2 bg-background text-foreground text-sm cursor-pointer border border-border rounded-lg appearance-none focus:border-transparent"
                defaultValue="Order By"
            >
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
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