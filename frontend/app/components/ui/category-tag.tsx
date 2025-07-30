export default function CategoryTag ({ category }: { category: string }) {
    return (
        <span className="inline-flex items-center rounded-full border border-green-700 bg-green-700/20 text-foreground px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2  truncate text-nowrap">
            {category}
        </span>
    )   
}